"""NDWI flood detection: (Green - NIR) / (Green + NIR)."""

import numpy as np


def compute_ndwi(green: np.ndarray, nir: np.ndarray) -> tuple[np.ndarray, np.ndarray, float]:
    """
    Compute NDWI from Green (Band3) and NIR (Band8).

    Returns:
        ndwi: NDWI raster (-1 to 1)
        flood_mask: binary mask (True = flooded)
        flood_area_km2: estimated flooded area
    """
    green = green.astype(np.float64)
    nir = nir.astype(np.float64)

    denom = green + nir
    denom[denom == 0] = 1e-10  # avoid div/0

    ndwi = (green - nir) / denom

    return ndwi


def detect_flood(ndwi_before: np.ndarray, ndwi_after: np.ndarray,
                 pixel_area_km2: float = 0.01) -> tuple[np.ndarray, float, float]:
    """
    Detect newly flooded areas by comparing pre- and post-event NDWI.

    Flood mask: pixels where NDWI_after > 0 AND NDWI_before < 0

    Returns:
        flood_mask: binary mask
        flood_area_km2: total flooded area
        ndwi_mean: mean NDWI in flooded region
    """
    # Newly flooded pixels
    flood_mask = (ndwi_after > 0) & (ndwi_before < 0)

    # Morphological cleanup: remove isolated clusters < 3 pixels
    flood_mask = _morphological_cleanup(flood_mask, min_cluster=3)

    # Compute area
    flood_pixels = np.sum(flood_mask)
    flood_area_km2 = flood_pixels * pixel_area_km2

    # Mean NDWI in flooded zone
    ndwi_mean = float(np.mean(ndwi_after[flood_mask])) if flood_pixels > 0 else 0.0

    return flood_mask, float(flood_area_km2), ndwi_mean


def _morphological_cleanup(mask: np.ndarray, min_cluster: int = 3) -> np.ndarray:
    """Remove isolated pixel clusters smaller than min_cluster."""
    try:
        from scipy import ndimage
        labeled, num_features = ndimage.label(mask)
        for i in range(1, num_features + 1):
            if np.sum(labeled == i) < min_cluster:
                mask[labeled == i] = False
    except ImportError:
        pass  # Skip if scipy not available
    return mask


def compute_flood_probability(ndwi: np.ndarray) -> np.ndarray:
    """Convert NDWI to flood probability raster (0.0 - 1.0)."""
    # Sigmoid mapping: NDWI of 0 -> 0.5 probability, NDWI of 0.5 -> ~0.95
    prob = 1 / (1 + np.exp(-5 * ndwi))
    return np.clip(prob, 0, 1)
