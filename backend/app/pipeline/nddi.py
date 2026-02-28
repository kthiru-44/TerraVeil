"""NDDI drought detection: (NDVI - NDWI) / (NDVI + NDWI)."""

import numpy as np
from app.core.constants import DROUGHT_WATCH, DROUGHT_WARNING, DROUGHT_EMERGENCY


def compute_ndvi(nir: np.ndarray, red_or_green: np.ndarray) -> np.ndarray:
    """Compute NDVI = (NIR - Red) / (NIR + Red). Using green as proxy if red unavailable."""
    nir = nir.astype(np.float64)
    red_or_green = red_or_green.astype(np.float64)
    denom = nir + red_or_green
    denom[denom == 0] = 1e-10
    return (nir - red_or_green) / denom


def compute_nddi(ndvi: np.ndarray, ndwi: np.ndarray) -> np.ndarray:
    """
    Compute NDDI = (NDVI - NDWI) / (NDVI + NDWI).
    Higher NDDI = more vegetation stress = drought.
    """
    denom = ndvi + ndwi
    # Avoid divide-by-zero and extreme values when denom is near zero
    small = np.abs(denom) < 0.01
    denom[small] = 0.01 * np.sign(denom[small])
    denom[denom == 0] = 0.01
    nddi = (ndvi - ndwi) / denom
    return np.clip(nddi, -1, 1)


def classify_drought(nddi: np.ndarray, pixel_area_km2: float = 0.01) -> dict:
    """
    Classify drought severity from NDDI raster.

    Tiers:
        WATCH: NDDI 0.1–0.3
        WARNING: NDDI 0.3–0.5
        EMERGENCY: NDDI > 0.5

    Returns dict with severity, nddi_mean, drought_area_km2, pixel counts.
    """
    nddi_mean = float(np.mean(nddi))

    # Count pixels per tier
    watch_pixels = np.sum((nddi >= 0.1) & (nddi < 0.3))
    warning_pixels = np.sum((nddi >= 0.3) & (nddi < 0.5))
    emergency_pixels = np.sum(nddi >= 0.5)

    stressed_pixels = watch_pixels + warning_pixels + emergency_pixels
    drought_area_km2 = float(stressed_pixels * pixel_area_km2)

    # Overall severity = worst tier with significant coverage (>5% of pixels)
    total_pixels = nddi.size
    if emergency_pixels > total_pixels * 0.05:
        severity = DROUGHT_EMERGENCY
    elif warning_pixels > total_pixels * 0.05:
        severity = DROUGHT_WARNING
    elif watch_pixels > total_pixels * 0.05:
        severity = DROUGHT_WATCH
    else:
        severity = "NORMAL"

    return {
        "nddi_mean": nddi_mean,
        "severity": severity,
        "drought_area_km2": drought_area_km2,
        "watch_pixels": int(watch_pixels),
        "warning_pixels": int(warning_pixels),
        "emergency_pixels": int(emergency_pixels),
    }
