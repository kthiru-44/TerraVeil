"""SAR backscatter analysis for cloud-immune flood detection."""

import numpy as np


def compute_sar_flood_mask(vv: np.ndarray, method: str = "otsu") -> tuple[np.ndarray, float]:
    """
    Detect water surfaces from Sentinel-1 VV backscatter using Otsu threshold.

    Water typically has very low backscatter (< -18 dB).

    Returns:
        sar_mask: binary mask (True = water detected)
        threshold: the Otsu threshold used
    """
    if method == "otsu":
        threshold = _otsu_threshold(vv)
    else:
        threshold = -15.0  # fixed fallback

    sar_mask = vv < threshold
    return sar_mask, float(threshold)


def fuse_masks(ndwi_mask: np.ndarray, sar_mask: np.ndarray) -> np.ndarray:
    """
    Fuse optical NDWI mask with SAR mask via logical OR.
    Union of all detected flood pixels.
    """
    # Ensure same shape
    if ndwi_mask.shape != sar_mask.shape:
        # Resize SAR to match NDWI
        from scipy.ndimage import zoom
        zoom_factors = (
            ndwi_mask.shape[0] / sar_mask.shape[0],
            ndwi_mask.shape[1] / sar_mask.shape[1],
        )
        sar_mask = zoom(sar_mask.astype(float), zoom_factors, order=0) > 0.5

    return ndwi_mask | sar_mask


def _otsu_threshold(data: np.ndarray) -> float:
    """Compute Otsu's threshold on a 1D or 2D array."""
    flat = data.flatten()
    flat = flat[np.isfinite(flat)]

    # Histogram with 256 bins
    hist, bin_edges = np.histogram(flat, bins=256)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2

    total = hist.sum()
    if total == 0:
        return np.median(flat)

    sum_total = (hist * bin_centers).sum()
    sum_bg = 0.0
    weight_bg = 0
    max_variance = 0.0
    threshold = bin_centers[0]

    for i in range(len(hist)):
        weight_bg += hist[i]
        if weight_bg == 0:
            continue
        weight_fg = total - weight_bg
        if weight_fg == 0:
            break
        sum_bg += hist[i] * bin_centers[i]
        mean_bg = sum_bg / weight_bg
        mean_fg = (sum_total - sum_bg) / weight_fg
        variance = weight_bg * weight_fg * (mean_bg - mean_fg) ** 2
        if variance > max_variance:
            max_variance = variance
            threshold = bin_centers[i]

    return float(threshold)


def should_use_sar_primary(cloud_pct: float) -> bool:
    """Use SAR as primary detector when cloud cover > 20%."""
    return cloud_pct > 20.0
