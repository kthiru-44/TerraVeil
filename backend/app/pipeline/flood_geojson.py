"""Convert pixel-level flood mask + NDWI values to GeoJSON for frontend visualization.

Creates geographic polygons from the flood detection grid, with per-cell intensity
values derived from actual NDWI measurements. Each polygon maps to a real
lat/lon region — no synthetic shapes.
"""

import json
import numpy as np


def mask_to_geojson(flood_mask: np.ndarray, ndwi_after: np.ndarray,
                    bbox: dict, max_features: int = 300,
                    ndwi_before: np.ndarray = None) -> dict:
    """
    Convert a boolean flood mask + NDWI values to GeoJSON FeatureCollection.

    Strategy:
        1. Downsample the grid so we get manageable polygon count
        2. For each flooded cell, create a rectangle polygon at its real lat/lon
        3. Assign intensity from actual NDWI value (normalized 0-1)
        4. Exclude permanent water bodies (ocean, lakes) using pre-event NDWI

    Args:
        flood_mask: boolean 2D array (H, W) — True = flooded pixel
        ndwi_after: float 2D array (H, W) — NDWI values for intensity
        bbox: dict with north/south/east/west
        max_features: cap on polygon count for performance
        ndwi_before: optional float 2D array (H, W) — pre-event NDWI for water body exclusion

    Returns:
        GeoJSON FeatureCollection dict
    """
    h, w = flood_mask.shape
    if h == 0 or w == 0:
        return {"type": "FeatureCollection", "features": []}

    north, south = bbox["north"], bbox["south"]
    east, west = bbox["east"], bbox["west"]
    dlat = north - south
    dlon = east - west

    # Determine block size for downsampling — aim for ~15x15 grid (cleaner visuals)
    block_h = max(1, h // 15)
    block_w = max(1, w // 15)
    grid_h = h // block_h
    grid_w = w // block_w

    features = []

    for r in range(grid_h):
        for c in range(grid_w):
            # Extract block
            r0, r1 = r * block_h, (r + 1) * block_h
            c0, c1 = c * block_w, (c + 1) * block_w

            block_mask = flood_mask[r0:r1, c0:c1]
            flood_fraction = float(np.mean(block_mask))

            # Skip cells with <35% flood coverage — only show clearly flooded areas
            if flood_fraction < 0.35:
                continue

            # ── OCEAN/PERMANENT WATER EXCLUSION ──
            # If pre-event NDWI is high (>0.4), this cell is permanent water
            # (ocean, lake, river) — NOT new flooding. Skip it.
            if ndwi_before is not None:
                block_before = ndwi_before[r0:r1, c0:c1]
                mean_before_ndwi = float(np.mean(block_before))
                if mean_before_ndwi > 0.4:
                    continue  # permanent water body — skip

            # Compute intensity from actual NDWI values in this block
            block_ndwi = ndwi_after[r0:r1, c0:c1]
            flooded_ndwi = block_ndwi[block_mask] if np.any(block_mask) else block_ndwi
            mean_ndwi = float(np.mean(flooded_ndwi)) if flooded_ndwi.size > 0 else 0

            # Intensity = combination of flood coverage + NDWI strength
            # flood_fraction drives the base (how much of the cell is flooded)
            # NDWI magnitude adds water-depth signal
            ndwi_boost = max(0, min(0.3, mean_ndwi * 0.5))
            intensity = min(1.0, max(0.25, flood_fraction * 0.7 + ndwi_boost + 0.15))

            # Classify zone based on intensity
            if intensity > 0.70:
                zone = "Critical"
            elif intensity > 0.50:
                zone = "High"
            elif intensity > 0.35:
                zone = "Medium"
            else:
                zone = "Low"

            # Compute geographic bounds for this cell
            cell_south = north - (r1 / h) * dlat
            cell_north = north - (r0 / h) * dlat
            cell_west = west + (c0 / w) * dlon
            cell_east = west + (c1 / w) * dlon

            # Create polygon (rectangle for this grid cell)
            coords = [[
                [round(cell_west, 6), round(cell_south, 6)],
                [round(cell_east, 6), round(cell_south, 6)],
                [round(cell_east, 6), round(cell_north, 6)],
                [round(cell_west, 6), round(cell_north, 6)],
                [round(cell_west, 6), round(cell_south, 6)],  # close ring
            ]]

            features.append({
                "type": "Feature",
                "properties": {
                    "intensity": round(intensity, 3),
                    "type": "flood",
                    "zone": zone,
                    "ndwi": round(mean_ndwi, 4),
                    "flood_pct": round(flood_fraction * 100, 1),
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": coords,
                },
            })

    # Sort by intensity (low first, high last) so high-intensity renders on top
    features.sort(key=lambda f: f["properties"]["intensity"])

    # Cap features
    if len(features) > max_features:
        features = features[:max_features]

    print(f"[GEOJSON] Generated {len(features)} flood polygons from {h}x{w} mask "
          f"(block={block_h}x{block_w}, grid={grid_h}x{grid_w})")

    return {"type": "FeatureCollection", "features": features}


def generate_before_geojson(ndwi_before: np.ndarray, bbox: dict) -> dict:
    """Generate a GeoJSON showing baseline water bodies (pre-event).
    Uses NDWI > 0.3 threshold to identify permanent water."""
    water_mask = ndwi_before > 0.3
    return mask_to_geojson(water_mask, ndwi_before, bbox, max_features=150)


def generate_forecast_geojson(flood_mask: np.ndarray, ndwi_after: np.ndarray,
                               bbox: dict, forecast_score: float) -> dict:
    """Generate expanded flood zones for 72H forecast visualization.
    Dilates the flood mask based on forecast score."""
    from scipy.ndimage import binary_dilation

    # Higher forecast score = more expansion
    expansion = max(1, int(forecast_score / 20))
    struct = np.ones((expansion * 2 + 1, expansion * 2 + 1), dtype=bool)
    expanded = binary_dilation(flood_mask, structure=struct, iterations=1)

    # The expanded area gets forecast-type properties
    geojson = mask_to_geojson(expanded, ndwi_after, bbox, max_features=200)

    # Mark as forecast type
    for f in geojson["features"]:
        f["properties"]["type"] = "forecast"
        # Reduce intensity slightly for expanded (uncertain) areas
        if not flood_mask[0, 0]:  # just mark all as forecast
            f["properties"]["intensity"] *= 0.8

    return geojson


def generate_drought_geojson(nddi_values: np.ndarray, bbox: dict,
                              nddi_threshold: float = 0.1) -> dict:
    """Generate drought zone GeoJSON from NDDI values."""
    drought_mask = nddi_values > nddi_threshold
    if not np.any(drought_mask):
        return {"type": "FeatureCollection", "features": []}

    geojson = mask_to_geojson(drought_mask, nddi_values, bbox, max_features=150)

    # Reclassify for drought
    for f in geojson["features"]:
        f["properties"]["type"] = "drought"
        nddi = f["properties"].get("ndwi", 0)
        if nddi > 0.4:
            f["properties"]["zone"] = "Severe"
        elif nddi > 0.2:
            f["properties"]["zone"] = "Moderate"
        else:
            f["properties"]["zone"] = "Watch"

    return geojson
