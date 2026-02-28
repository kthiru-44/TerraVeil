"""Change detection: delta NDWI between baseline and event."""

import numpy as np


def detect_change(ndwi_t0: np.ndarray, ndwi_t1: np.ndarray,
                  threshold: float = 0.2,
                  pixel_area_km2: float = 0.01) -> tuple[np.ndarray, np.ndarray, float]:
    """
    Compute NDWI delta between baseline (T0) and event (T1).

    Delta = |NDWI_T1 - NDWI_T0| per pixel → continuous intensity heatmap.
    Pixels with delta > threshold classified as newly flooded.

    Returns:
        delta: continuous intensity heatmap (0–2 range)
        change_mask: binary mask of significant changes
        change_area_km2: total area of significant change
    """
    delta = np.abs(ndwi_t1 - ndwi_t0)
    change_mask = delta > threshold
    change_area_km2 = float(np.sum(change_mask) * pixel_area_km2)

    return delta, change_mask, change_area_km2
