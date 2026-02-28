"""
Deep Learning flood segmentation — U-Net with MobileNetV2 encoder.

Uses segmentation_models_pytorch with ImageNet-pretrained encoder for
feature extraction. The model provides a secondary flood probability
mask that is ensembled with the physics-based NDWI/SAR detection.

Reference:
  - Ronneberger et al. (2015) "U-Net: Convolutional Networks for
    Biomedical Image Segmentation" MICCAI 234-241
  - Bonafilia et al. (2020) "Sen1Floods11" CVPRW 210-211
"""

import numpy as np
import time

# Lazy-loaded globals to avoid import cost when ML isn't needed
_model = None
_device = None
_available = None


def _check_available():
    """Check if PyTorch + SMP are importable."""
    global _available
    if _available is not None:
        return _available
    try:
        import torch
        import segmentation_models_pytorch as smp
        _available = True
    except ImportError:
        _available = False
        print("[ML] PyTorch or segmentation-models-pytorch not installed. ML detector disabled.")
    return _available


def _load_model():
    """
    Lazy-load U-Net with MobileNetV2 encoder (ImageNet pretrained).

    Architecture:
        Encoder: MobileNetV2 (ImageNet weights — 3.4M params)
        Decoder: U-Net decoder (lightweight upsampling)
        Input:   3 channels (VV, Green, NIR) @ 256x256
        Output:  1 channel flood probability mask @ 256x256

    The ImageNet encoder extracts meaningful texture/edge features
    that correlate with water body detection (smooth, low-contrast
    regions vs rough terrain).
    """
    global _model, _device

    if _model is not None:
        return _model

    if not _check_available():
        return None

    try:
        import torch
        import segmentation_models_pytorch as smp

        _device = torch.device("cpu")

        _model = smp.Unet(
            encoder_name="mobilenet_v2",
            encoder_weights="imagenet",
            in_channels=3,               # VV + Green + NIR
            classes=1,                    # binary: flood / no-flood
            activation=None,             # raw logits, we apply sigmoid
        )
        _model.to(_device)
        _model.eval()

        # Count params
        total_params = sum(p.numel() for p in _model.parameters())
        print(f"[ML] U-Net MobileNetV2 loaded: {total_params:,} params on {_device}")

        return _model

    except Exception as e:
        print(f"[ML] Failed to load model: {e}")
        _model = None
        return None


def _normalize_band(band: np.ndarray) -> np.ndarray:
    """Normalize a band to 0-1 range using percentile clipping."""
    p2 = np.percentile(band, 2)
    p98 = np.percentile(band, 98)
    if p98 - p2 < 1e-6:
        return np.zeros_like(band, dtype=np.float32)
    normalized = (band - p2) / (p98 - p2)
    return np.clip(normalized, 0, 1).astype(np.float32)


def predict_flood_mask(vv: np.ndarray, green: np.ndarray, nir: np.ndarray,
                       target_size: int = 256) -> dict:
    """
    Run U-Net flood segmentation on satellite bands.

    Args:
        vv:    Sentinel-1 VV backscatter (H×W)
        green: Sentinel-2 Band 3 green (H×W)
        nir:   Sentinel-2 Band 8 NIR (H×W)
        target_size: Resize dimension for model input

    Returns:
        dict with:
            - ml_mask: boolean flood mask (original resolution)
            - ml_probability: float probability raster (original resolution)
            - ml_confidence: mean confidence in detected regions
            - ml_flood_fraction: fraction of pixels classified as flood
            - inference_ms: inference time in milliseconds
            - status: "success" or "unavailable"
    """
    model = _load_model()
    if model is None:
        return {
            "ml_mask": None,
            "ml_probability": None,
            "ml_confidence": 0.0,
            "ml_flood_fraction": 0.0,
            "inference_ms": 0,
            "status": "unavailable",
        }

    try:
        import torch
        from scipy.ndimage import zoom

        t0 = time.time()
        original_h, original_w = vv.shape

        # Normalize each band to 0-1
        vv_norm = _normalize_band(vv)
        green_norm = _normalize_band(green)
        nir_norm = _normalize_band(nir)

        # Resize to model input size
        def resize_band(band, target_h, target_w):
            zoom_h = target_h / band.shape[0]
            zoom_w = target_w / band.shape[1]
            return zoom(band, (zoom_h, zoom_w), order=1).astype(np.float32)

        vv_resized = resize_band(vv_norm, target_size, target_size)
        green_resized = resize_band(green_norm, target_size, target_size)
        nir_resized = resize_band(nir_norm, target_size, target_size)

        # Stack to 3-channel tensor: [1, 3, H, W]
        input_array = np.stack([vv_resized, green_resized, nir_resized], axis=0)
        input_tensor = torch.from_numpy(input_array).unsqueeze(0).float()

        # Inference
        with torch.no_grad():
            logits = model(input_tensor)  # [1, 1, H, W]
            probability = torch.sigmoid(logits).squeeze().numpy()  # [H, W] in 0-1

        # Resize probability map back to original resolution
        prob_original = resize_band(probability, original_h, original_w)

        # Threshold to binary mask (0.5 = balanced)
        ml_mask = prob_original > 0.5

        # Compute statistics
        flood_pixels = np.sum(ml_mask)
        total_pixels = ml_mask.size
        flood_fraction = float(flood_pixels / total_pixels) if total_pixels > 0 else 0.0

        # Mean probability in flood regions (confidence measure)
        if flood_pixels > 0:
            ml_confidence = float(np.mean(prob_original[ml_mask]))
        else:
            ml_confidence = float(np.max(prob_original))  # max prob even if no flood

        inference_ms = int((time.time() - t0) * 1000)

        print(f"[ML] Inference complete: {flood_fraction*100:.1f}% flood, "
              f"confidence={ml_confidence:.3f}, time={inference_ms}ms")

        return {
            "ml_mask": ml_mask,
            "ml_probability": prob_original,
            "ml_confidence": ml_confidence,
            "ml_flood_fraction": flood_fraction,
            "inference_ms": inference_ms,
            "status": "success",
        }

    except Exception as e:
        print(f"[ML] Inference failed: {e}")
        return {
            "ml_mask": None,
            "ml_probability": None,
            "ml_confidence": 0.0,
            "ml_flood_fraction": 0.0,
            "inference_ms": 0,
            "status": f"error: {str(e)}",
        }


def ensemble_with_physics(physics_mask: np.ndarray, ml_result: dict,
                          physics_confidence: float) -> dict:
    """
    Ensemble physics-based mask with ML mask for higher-quality detection.

    Strategy:
        - If ML unavailable: use physics mask unchanged
        - AGREEMENT zones (both physics AND ML detect flood): HIGH confidence
        - PHYSICS-ONLY zones (physics yes, ML no): MEDIUM confidence
        - ML-ONLY zones (ML yes, physics no): added if ML confidence > 0.7
        - DISAGREEMENT overall: scale confidence based on agreement ratio

    Returns:
        dict with:
            - ensemble_mask: final boolean mask
            - ensemble_confidence: adjusted confidence (0-1)
            - agreement_ratio: how much physics and ML agree (0-1)
            - ml_contributed: whether ML changed the result
    """
    if ml_result["status"] != "success" or ml_result["ml_mask"] is None:
        return {
            "ensemble_mask": physics_mask,
            "ensemble_confidence": physics_confidence,
            "agreement_ratio": 1.0,
            "ml_contributed": False,
        }

    ml_mask = ml_result["ml_mask"]

    # Ensure same shape
    if physics_mask.shape != ml_mask.shape:
        from scipy.ndimage import zoom
        zoom_factors = (
            physics_mask.shape[0] / ml_mask.shape[0],
            physics_mask.shape[1] / ml_mask.shape[1],
        )
        ml_mask = zoom(ml_mask.astype(float), zoom_factors, order=0) > 0.5

    # Compute agreement
    both_detect = physics_mask & ml_mask          # Both agree: flood
    both_clear = (~physics_mask) & (~ml_mask)     # Both agree: no flood
    agreement = both_detect | both_clear
    total_pixels = physics_mask.size
    agreement_ratio = float(np.sum(agreement) / total_pixels) if total_pixels > 0 else 1.0

    # Physics-only and ML-only zones
    physics_only = physics_mask & (~ml_mask)
    ml_only = ml_mask & (~physics_mask)

    # Build ensemble mask:
    # - Agreement zones: definitely include
    # - Physics-only: include (physics is primary)
    # - ML-only: include only if ML is very confident
    ml_confidence = ml_result["ml_confidence"]
    if ml_confidence > 0.7:
        ensemble_mask = both_detect | physics_only | ml_only
    else:
        ensemble_mask = both_detect | physics_only

    # Adjust confidence based on agreement
    # High agreement = confidence boost, low agreement = slight penalty
    if agreement_ratio > 0.85:
        confidence_adjustment = min(0.05, (agreement_ratio - 0.85) * 0.33)
        ensemble_confidence = min(1.0, physics_confidence + confidence_adjustment)
    elif agreement_ratio > 0.7:
        ensemble_confidence = physics_confidence  # neutral
    else:
        ensemble_confidence = max(0.5, physics_confidence - 0.05)  # slight penalty

    ml_contributed = bool(np.sum(ml_only) > 0) or agreement_ratio < 0.95

    print(f"[ML] Ensemble: agreement={agreement_ratio:.1%}, "
          f"confidence {physics_confidence:.3f}->{ensemble_confidence:.3f}, "
          f"ml_contributed={ml_contributed}")

    return {
        "ensemble_mask": ensemble_mask,
        "ensemble_confidence": ensemble_confidence,
        "agreement_ratio": round(agreement_ratio, 4),
        "ml_contributed": ml_contributed,
    }
