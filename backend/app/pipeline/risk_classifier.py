"""Risk classification engine — composite risk scores and tiers."""

from app.core.constants import RISK_LOW, RISK_MEDIUM, RISK_HIGH, RISK_CRITICAL


def classify_risk(flood_area_km2: float, confidence: float,
                  pop_affected: int, ndwi_mean: float,
                  hospitals_at_risk: int = 0,
                  forecast_score: float = 0.0) -> dict:
    """
    Compute composite risk score (0–100) and classify into tier.

    Score formula (calibrated for city-level bbox ~0.4° × 0.4°):
        - Flood area (35%): normalized to 10 km² (a 10 km² urban flood is catastrophic)
        - NDWI intensity (20%): water index strength, normalized aggressively
        - Population (20%): normalized to 50k (realistic for scan bbox)
        - Infrastructure (15%): hospitals at risk, 5+ = max
        - Forecast (10%): 72H forecast probability

    Risk tiers:
        LOW:      0–25
        MEDIUM:  25–50
        HIGH:    50–75
        CRITICAL: 75–100
    """
    # Normalize components to 0–100
    # Flood area: 10 km² = score 100 (a 10 km² flood in a city is devastating)
    area_score = min(100, (flood_area_km2 / 10.0) * 100)

    # NDWI: 0.3+ is strong water signal, anything > 0.15 is noteworthy
    ndwi_score = min(100, max(0, (ndwi_mean / 0.4) * 100))

    # Population: 50k affected = score 100 (realistic for city-level bbox)
    pop_score = min(100, (pop_affected / 50000) * 100)

    # Infrastructure: 5+ hospitals at risk = max score
    infra_score = min(100, hospitals_at_risk * 20)

    # Forecast: direct percentage
    forecast_component = min(100, forecast_score)

    # Confidence multiplier — high confidence amplifies the score
    conf_mult = 0.8 + 0.2 * min(1.0, confidence)

    # Weighted composite
    raw_score = (
        0.35 * area_score +
        0.20 * ndwi_score +
        0.20 * pop_score +
        0.15 * infra_score +
        0.10 * forecast_component
    )
    risk_score = round(min(100, max(0, raw_score * conf_mult)), 1)

    # Classify tier
    if risk_score >= 75:
        risk_level = RISK_CRITICAL
    elif risk_score >= 50:
        risk_level = RISK_HIGH
    elif risk_score >= 25:
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
