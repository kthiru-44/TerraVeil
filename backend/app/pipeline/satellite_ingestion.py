"""Satellite data ingestion from Google Earth Engine with local cache fallback."""

import time
import numpy as np
from pathlib import Path
from app.core.config import GEOTIFF_DIR, CACHE_DIR, GEE_SERVICE_ACCOUNT, GEE_KEY_FILE, GEE_PROJECT

# Lazy GEE init
_ee_initialized = False


def _init_gee():
    """Initialize GEE — lazy, called once."""
    global _ee_initialized
    if _ee_initialized:
        return True
    try:
        import ee
        import os
        project = GEE_PROJECT or None

        # Try Service Account first
        if GEE_SERVICE_ACCOUNT and GEE_KEY_FILE and Path(GEE_KEY_FILE).exists():
            print(f"[GEE] Initializing with Service Account: {GEE_SERVICE_ACCOUNT}")
            credentials = ee.ServiceAccountCredentials(GEE_SERVICE_ACCOUNT, GEE_KEY_FILE)
            ee.Initialize(credentials, project=project)
        else:
            # Use credentials saved by ee.Authenticate() (stored in ~/.config/earthengine/)
            print(f"[GEE] Initializing with stored credentials (project={project})...")
            ee.Initialize(project=project)

        _ee_initialized = True
        print("[GEE] Initialization successful.")
        return True
    except Exception as e:
        print(f"[GEE] Init failed: {e}. Falling back to simulated pipeline.")
        return False


def fetch_sentinel2(bbox: dict, t0: str, t1: str) -> dict:
    """
    Fetch Sentinel-2 L2A imagery from GEE.
    Returns dict with 'green' (Band3), 'nir' (Band8), 'swir' (Band11) numpy arrays
    for both baseline and event periods.

    Falls back to simulated data if GEE unavailable.
    """
    region = [bbox["west"], bbox["south"], bbox["east"], bbox["north"]]

    if _init_gee():
        try:
            return _fetch_s2_from_gee(bbox, t0, t1)
        except Exception as e:
            print(f"[GEE] Sentinel-2 fetch failed: {e}. Using simulation.")

    # Fallback: generate realistic simulated data
    return _simulate_sentinel2(bbox, t0, t1)


def fetch_sentinel1(bbox: dict, t0: str, t1: str) -> dict:
    """
    Fetch Sentinel-1 GRD VV/VH from GEE.
    Returns dict with 'vv' and 'vh' numpy arrays.
    """
    if _init_gee():
        try:
            return _fetch_s1_from_gee(bbox, t0, t1)
        except Exception as e:
            print(f"[GEE] Sentinel-1 fetch failed: {e}. Using simulation.")

    return _simulate_sentinel1(bbox, t0, t1)


def _fetch_s2_from_gee(bbox: dict, t0: str, t1: str) -> dict:
    """Real GEE fetch for Sentinel-2 — progressive cloud relaxation, SAR compensates."""
    import ee
    from datetime import datetime, timedelta

    aoi = ee.Geometry.Rectangle([bbox["west"], bbox["south"], bbox["east"], bbox["north"]])
    SCALE = 500

    t0_dt = datetime.fromisoformat(t0)
    t1_dt = datetime.fromisoformat(t1)

    # Baseline: 120 days before t0 (wide window for cloud-free composites)
    baseline_start = (t0_dt - timedelta(days=120)).strftime("%Y-%m-%d")
    baseline_col = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(aoi)
        .filterDate(baseline_start, t0)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 50))
    )

    baseline_count = baseline_col.size().getInfo()
    if baseline_count == 0:
        # Try without cloud filter for baseline
        baseline_col = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(aoi)
            .filterDate(baseline_start, t0)
        )
        baseline_count = baseline_col.size().getInfo()

    # Event: progressive cloud relaxation — during floods it's ALWAYS cloudy
    event_end = (t1_dt + timedelta(days=15)).strftime("%Y-%m-%d")
    event_col = None
    event_count = 0
    cloud_pct = 100.0  # assume worst until we know

    for max_cloud in [50, 80, 100]:
        col = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(aoi)
            .filterDate(t0, event_end)
        )
        if max_cloud < 100:
            col = col.filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", max_cloud))

        count = col.size().getInfo()
        if count > 0:
            event_col = col
            event_count = count
            cloud_pct = col.aggregate_mean("CLOUDY_PIXEL_PERCENTAGE").getInfo() or float(max_cloud)
            print(f"[GEE] Sentinel-2: {baseline_count} baseline, {event_count} event (cloud filter <{max_cloud}%, actual={cloud_pct:.0f}%)")
            break

    if baseline_count == 0:
        raise Exception(f"No Sentinel-2 baseline images found at all")

    # If no event images exist, use baseline as both (SAR will detect the actual flood)
    if event_count == 0:
        print(f"[GEE] Sentinel-2: {baseline_count} baseline, 0 event — using baseline as event, SAR will be PRIMARY")
        event_col = baseline_col
        event_count = baseline_count
        cloud_pct = 100.0  # force SAR primary

    # cloud_pct already set above during progressive relaxation

    # Composite and reproject to fixed scale for reliable sampleRectangle
    proj = ee.Projection("EPSG:4326").atScale(SCALE)
    baseline = baseline_col.median().select(["B3", "B8", "B11"]).clip(aoi).reproject(crs=proj)
    event = event_col.median().select(["B3", "B8", "B11"]).clip(aoi).reproject(crs=proj)

    # Sample — now returns proper pixel grid
    baseline_data = baseline.sampleRectangle(region=aoi, defaultValue=0).getInfo()
    event_data = event.sampleRectangle(region=aoi, defaultValue=0).getInfo()

    b_green = np.array(baseline_data["properties"]["B3"])
    b_nir = np.array(baseline_data["properties"]["B8"])
    b_swir = np.array(baseline_data["properties"]["B11"])
    e_green = np.array(event_data["properties"]["B3"])
    e_nir = np.array(event_data["properties"]["B8"])
    e_swir = np.array(event_data["properties"]["B11"])

    print(f"[GEE] S2 grid shape: baseline={b_green.shape}, event={e_green.shape}, cloud={cloud_pct:.1f}%")

    return {
        "baseline": {"green": b_green, "nir": b_nir, "swir": b_swir},
        "event": {"green": e_green, "nir": e_nir, "swir": e_swir},
        "bbox": bbox,
        "cloud_pct": round(cloud_pct, 1),
        "tiles": baseline_count + event_count,
        "source": "gee",
    }


def _fetch_s1_from_gee(bbox: dict, t0: str, t1: str) -> dict:
    """Real GEE fetch for Sentinel-1 — resampled to ~500m."""
    import ee
    from datetime import datetime, timedelta

    aoi = ee.Geometry.Rectangle([bbox["west"], bbox["south"], bbox["east"], bbox["north"]])
    SCALE = 500

    t0_dt = datetime.fromisoformat(t0)
    t1_dt = datetime.fromisoformat(t1)
    s1_start = (t0_dt - timedelta(days=10)).strftime("%Y-%m-%d")
    s1_end = (t1_dt + timedelta(days=10)).strftime("%Y-%m-%d")

    s1_col = (
        ee.ImageCollection("COPERNICUS/S1_GRD")
        .filterBounds(aoi)
        .filterDate(s1_start, s1_end)
        .filter(ee.Filter.eq("instrumentMode", "IW"))
        .select(["VV", "VH"])
    )

    count = s1_col.size().getInfo()
    print(f"[GEE] Sentinel-1: {count} images found")
    if count == 0:
        raise Exception("No Sentinel-1 images found")

    proj = ee.Projection("EPSG:4326").atScale(SCALE)
    s1 = s1_col.median().clip(aoi).reproject(crs=proj)
    data = s1.sampleRectangle(region=aoi, defaultValue=0).getInfo()

    vv = np.array(data["properties"]["VV"])
    vh = np.array(data["properties"]["VH"])
    print(f"[GEE] S1 grid shape: vv={vv.shape}")

    return {
        "vv": vv,
        "vh": vh,
        "bbox": bbox,
        "source": "gee",
    }


def _simulate_sentinel2(bbox: dict, t0: str, t1: str) -> dict:
    """Generate realistic simulated Sentinel-2 data for demo."""
    # Seed with bbox hash so different locations produce different simulated data
    seed = hash((bbox.get('north',0), bbox.get('west',0), t0, t1)) % (2**31)
    np.random.seed(seed)
    h, w = 200, 200

    # Baseline: mostly dry land
    baseline_green = np.random.uniform(800, 1500, (h, w)).astype(np.float64)
    baseline_nir = np.random.uniform(2000, 3500, (h, w)).astype(np.float64)
    baseline_swir = np.random.uniform(1500, 2500, (h, w)).astype(np.float64)

    # Event: flood zone in center (green goes up, nir drops)
    event_green = baseline_green.copy()
    event_nir = baseline_nir.copy()
    event_swir = baseline_swir.copy()

    # Create realistic flood pattern (elliptical region)
    cy, cx = h // 2, w // 2
    Y, X = np.ogrid[:h, :w]
    flood_mask = ((X - cx) ** 2 / (60 ** 2) + (Y - cy) ** 2 / (50 ** 2)) < 1

    # In flooded areas: water reflects more green, much less NIR
    event_green[flood_mask] = np.random.uniform(1200, 2000, flood_mask.sum())
    event_nir[flood_mask] = np.random.uniform(400, 900, flood_mask.sum())
    event_swir[flood_mask] = np.random.uniform(300, 700, flood_mask.sum())

    return {
        "baseline": {"green": baseline_green, "nir": baseline_nir, "swir": baseline_swir},
        "event": {"green": event_green, "nir": event_nir, "swir": event_swir},
        "bbox": bbox,
        "cloud_pct": 3.2,
        "tiles": 2,
        "source": "simulated",
    }


def _simulate_sentinel1(bbox: dict, t0: str, t1: str) -> dict:
    """Generate realistic simulated Sentinel-1 SAR data."""
    seed = hash((bbox.get('north',0), bbox.get('west',0), t0, t1, 'sar')) % (2**31)
    np.random.seed(seed)
    h, w = 200, 200

    # VV backscatter in dB — water ~= -18 to -25 dB, land ~= -5 to -12 dB
    vv = np.random.uniform(-12, -5, (h, w)).astype(np.float64)
    vh = np.random.uniform(-18, -10, (h, w)).astype(np.float64)

    # Flood zone: low backscatter
    cy, cx = h // 2, w // 2
    Y, X = np.ogrid[:h, :w]
    flood_mask = ((X - cx) ** 2 / (60 ** 2) + (Y - cy) ** 2 / (50 ** 2)) < 1
    vv[flood_mask] = np.random.uniform(-25, -18, flood_mask.sum())
    vh[flood_mask] = np.random.uniform(-30, -22, flood_mask.sum())

    return {"vv": vv, "vh": vh, "bbox": bbox, "source": "simulated"}
