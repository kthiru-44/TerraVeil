"""GET /api/v1/risk — Quick risk lookup from cache (the demo curl endpoint)."""

from fastapi import APIRouter, HTTPException, Query
from app.db import queries as db
from app.core.config import DEMO_REGIONS
from app.pipeline.runner import run_pipeline

router = APIRouter()


@router.get("/risk")
async def get_risk(
    region: str = Query(..., description="Region key or custom name"),
    date: str = Query(None, description="Event end date YYYY-MM-DD (t1)"),
    t0: str = Query(None, description="Start date YYYY-MM-DD"),
    t1: str = Query(None, description="End date YYYY-MM-DD"),
    north: float = Query(None, description="Bbox north latitude"),
    south: float = Query(None, description="Bbox south latitude"),
    east: float = Query(None, description="Bbox east longitude"),
    west: float = Query(None, description="Bbox west longitude"),
):
    """
    Risk intelligence lookup. Works for ANY location worldwide.
    GEE has global coverage — Sentinel-2 and Sentinel-1 cover the entire planet.

    Known regions: curl 'http://localhost:8000/api/v1/risk?region=bangalore'
    Any location:  curl 'http://localhost:8000/api/v1/risk?region=tokyo&north=35.8&south=35.5&east=139.9&west=139.6&t0=2023-01-01&t1=2023-01-15'
    """
    # Resolve dates
    effective_t1 = t1 or date
    effective_t0 = t0

    # Check cache
    if effective_t1:
        scan = await db.get_scan_by_region(region, effective_t1)
        if scan:
            return _format_scan(scan)

    # Resolve region — known preset OR custom bbox
    region_key = region.lower().strip()
    if region_key in DEMO_REGIONS:
        demo = DEMO_REGIONS[region_key]
        run_t0 = effective_t0 or demo["t0"]
        run_t1 = effective_t1 or demo["t1"]
        run_name = demo["name"]
        run_bbox = demo["bbox"]
    elif north is not None and south is not None and east is not None and west is not None:
        # Custom bbox — works for ANY location on Earth
        if not effective_t0 or not effective_t1:
            raise HTTPException(400, "Custom locations require t0 and t1 date params")
        run_t0 = effective_t0
        run_t1 = effective_t1
        run_name = region  # use whatever name they gave
        run_bbox = {"north": north, "south": south, "east": east, "west": west}
    else:
        raise HTTPException(
            400,
            f"Unknown region '{region}'. Either use a known region ({list(DEMO_REGIONS.keys())}) "
            f"or provide bbox params: north, south, east, west + t0, t1 dates.",
        )

    # Check cache with resolved t1
    scan = await db.get_scan_by_region(region, run_t1)
    if scan:
        return _format_scan(scan)

    # Run pipeline — GEE has global Sentinel-2/S1 coverage
    scan_id = await db.create_scan(
        region_name=run_name, bbox=run_bbox,
        t0=run_t0, t1=run_t1, source="sentinel-2",
    )
    await run_pipeline(scan_id, run_name, run_bbox, run_t0, run_t1, "sentinel-2")
    scan = await db.get_scan(scan_id)
    if scan:
        return _format_scan(scan)

    raise HTTPException(500, "Pipeline failed to produce results")


def _format_scan(scan: dict) -> dict:
    """Format a scan DB row into an API response."""
    import json as _json

    # Parse infrastructure JSON if available
    infra = []
    if scan.get("infrastructure_json"):
        try:
            infra = _json.loads(scan["infrastructure_json"])
        except Exception:
            pass

    # Parse GeoJSON overlays
    def _parse_geo(key):
        raw = scan.get(key)
        if raw:
            try:
                return _json.loads(raw)
            except Exception:
                pass
        return None

    return {
        "scan_id": scan["scan_id"],
        "region": scan["region_name"],
        "risk_level": scan["risk_level"],
        "risk_score": scan["risk_score"],
        "confidence": scan["confidence"],
        "confidence_band": {
            "lower": scan["confidence_lower"],
            "upper": scan["confidence_upper"],
        },
        "flood_area_km2": scan["flood_area_km2"],
        "change_area_km2": scan["change_area_km2"],
        "pop_affected": scan["pop_affected"],
        "hospitals_at_risk": scan["hospitals_at_risk"],
        "roads_km_affected": scan["roads_km_affected"],
        "forecast": {
            "score": scan["forecast_score"],
            "recommendation": scan["forecast_rec"],
        },
        "drought": {
            "nddi_mean": scan["drought_nddi"],
            "severity": scan["drought_severity"],
            "area_km2": scan["drought_area_km2"],
        },
        "processing_ms": scan["processing_ms"],
        "status": scan["status"],
        "created_at": scan["created_at"],
        "t0_date": scan["t0_date"],
        "t1_date": scan["t1_date"],
        "bbox": {
            "north": scan["bbox_north"],
            "south": scan["bbox_south"],
            "east": scan["bbox_east"],
            "west": scan["bbox_west"],
        },
        "infrastructure": infra,
        "flood_geojson": _parse_geo("flood_geojson_json"),
        "before_geojson": _parse_geo("before_geojson_json"),
        "forecast_geojson": _parse_geo("forecast_geojson_json"),
        "drought_geojson": _parse_geo("drought_geojson_json"),
    }
