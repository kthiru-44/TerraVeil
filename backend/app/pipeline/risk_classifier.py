"""Risk classification engine — composite risk scores and tiers."""

from app.core.constants import RISK_LOW, RISK_MEDIUM, RISK_HIGH, RISK_CRITICAL


def classify_risk(flood_area_km2: float, confidence: float,
                  pop_affected: int, ndwi_mean: float,
                  hospitals_at_risk: int = 0,
                  forecast_score: float = 0.0) -> dict:
    """
    Compute composite risk score (0–100) and classify into tier.

    Score formula:
        - Flood area contribution (30%): normalized to 200 km² max
        - NDWI intensity (20%): normalized to 0-1
        - Population (25%): normalized to 500k max
        - Infrastructure (15%): hospitals at risk * 15, capped at 100
        - Forecast (10%): raw forecast score

    Risk tiers:
        LOW:      0–20
        MEDIUM:  20–50
        HIGH:    50–75
        CRITICAL: 75–100
    """
    # Normalize components to 0–100
    area_score = min(100, (flood_area_km2 / 200) * 100)
    ndwi_score = min(100, max(0, ndwi_mean * 200))       # ndwi_mean ~0-0.5
    pop_score = min(100, (pop_affected / 500000) * 100)
    infra_score = min(100, hospitals_at_risk * 30)
    forecast_component = min(100, forecast_score)

    # Weighted composite
    risk_score = (
        0.30 * area_score +
        0.20 * ndwi_score +
        0.25 * pop_score +
        0.15 * infra_score +
        0.10 * forecast_component
    )
    risk_score = round(min(100, max(0, risk_score)), 1)

    # Classify tier
    if risk_score >= 75:
        risk_level = RISK_CRITICAL
    elif risk_score >= 50:
        risk_level = RISK_HIGH
    elif risk_score >= 20:
        risk_level = RISK_MEDIUM
    else:
        risk_level = RISK_LOW

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "components": {
            "area": round(area_score, 1),
            "ndwi": round(ndwi_score, 1),
            "population": round(pop_score, 1),
            "infrastructure": round(infra_score, 1),
            "forecast": round(forecast_component, 1),
        },
    }


def estimate_population(flood_area_km2: float, region_density: float = 2000.0) -> int:
    """
    Estimate affected population from flood area.
    Default density: 2000 people/km² (typical Maharashtra rural-urban mix).
    """
    return int(flood_area_km2 * region_density)
