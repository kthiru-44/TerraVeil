"""72-Hour flood risk forecast + drought trajectory using OpenMeteo + NDWI trend."""

import numpy as np
import requests
from app.core.constants import FORECAST_WEIGHT_NDWI, FORECAST_WEIGHT_RAINFALL, FORECAST_WEIGHT_ELEVATION


def fetch_openmeteo_forecast(lat: float, lon: float) -> dict:
    """
    Fetch 72-hour precipitation forecast from OpenMeteo (free, no key).
    Returns hourly rainfall forecast.
    """
    try:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "precipitation,temperature_2m",
            "forecast_days": 3,
        }
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        hourly = data.get("hourly", {})
        precip = hourly.get("precipitation", [])
        temps = hourly.get("temperature_2m", [])

        return {
            "total_rainfall_mm": sum(p for p in precip if p is not None),
            "max_hourly_mm": max(precip) if precip else 0,
            "avg_temp_c": np.mean([t for t in temps if t is not None]) if temps else 25.0,
            "hours": len(precip),
            "source": "openmeteo",
        }
    except Exception as e:
        print(f"[FORECAST] OpenMeteo failed: {e}. Using simulated forecast.")
        return _simulate_forecast()


def _simulate_forecast() -> dict:
    """Simulated 72h forecast for demo."""
    return {
        "total_rainfall_mm": 187.5,
        "max_hourly_mm": 32.4,
        "avg_temp_c": 28.3,
        "hours": 72,
        "source": "simulated",
    }


def compute_ndwi_trend(ndwi_series: list[float]) -> float:
    """
    Compute linear trend slope of NDWI values over time.
    ndwi_series: list of mean NDWI values ordered by time.
    Returns slope (positive = wetting trend = flood risk rising).
    """
    if len(ndwi_series) < 2:
        return 0.0

    try:
        from scipy.stats import linregress
        x = np.arange(len(ndwi_series))
        result = linregress(x, ndwi_series)
        return float(result.slope)
    except ImportError:
        # Simple slope fallback
        return (ndwi_series[-1] - ndwi_series[0]) / max(len(ndwi_series) - 1, 1)


def compute_forecast_score(ndwi_trend_slope: float, rainfall_72h_mm: float,
                           elevation_m: float = 100.0) -> tuple[float, str]:
    """
    Composite flood risk score for next 72 hours.

    Weights: 35% NDWI trend + 35% rainfall forecast + 30% elevation factor.

    Returns:
        score: 0–100 composite risk score
        recommendation: actionable text
    """
    # Normalize NDWI trend (0-100 scale, slope of 0.1 per time unit = max)
    ndwi_score = min(100, max(0, abs(ndwi_trend_slope) * 1000))

    # Normalize rainfall (0-100 scale, 200mm = max risk)
    rainfall_score = min(100, max(0, rainfall_72h_mm / 200 * 100))

    # Elevation factor (lower = higher risk): 0m = 100 risk, 500m = 0 risk
    elevation_score = max(0, 100 - (elevation_m / 5))

    # Weighted composite
    score = (
        FORECAST_WEIGHT_NDWI * ndwi_score +
        FORECAST_WEIGHT_RAINFALL * rainfall_score +
        FORECAST_WEIGHT_ELEVATION * elevation_score
    )
    score = min(100, max(0, score))

    # Recommendation
    if score >= 75:
        rec = "CRITICAL: Pre-position disaster teams. Evacuation advisory recommended within 24 hours."
    elif score >= 50:
        rec = "HIGH: Alert district authorities. Stage emergency supplies. Monitor hourly."
    elif score >= 25:
        rec = "MODERATE: Increased monitoring. Review flood barriers and drainage systems."
    else:
        rec = "LOW: Standard monitoring. No immediate action required."

    return round(score, 1), rec


def compute_drought_trajectory(nddi_series: list[float], temp_anomaly: float = 0.0) -> dict:
    """
    14-day drought severity trajectory from NDDI trend + temperature anomaly.

    Returns projection dict with current severity, trajectory direction, and days to next tier.
    """
    if len(nddi_series) < 2:
        return {"trajectory": "stable", "projected_severity": "NORMAL", "days_to_escalation": None}

    try:
        from scipy.stats import linregress
        x = np.arange(len(nddi_series))
        result = linregress(x, nddi_series)
        slope = result.slope
    except ImportError:
        slope = (nddi_series[-1] - nddi_series[0]) / max(len(nddi_series) - 1, 1)

    current_nddi = nddi_series[-1]

    # Adjust slope by temperature anomaly (hotter = dries faster)
    adjusted_slope = slope + (temp_anomaly * 0.01)

    # Project 14 days ahead
    projected_nddi = current_nddi + adjusted_slope * 14

    # Determine trajectory
    if adjusted_slope > 0.005:
        trajectory = "worsening"
    elif adjusted_slope < -0.005:
        trajectory = "improving"
    else:
        trajectory = "stable"

    # Projected severity
    if projected_nddi > 0.5:
        proj_severity = "EMERGENCY"
    elif projected_nddi > 0.3:
        proj_severity = "WARNING"
    elif projected_nddi > 0.1:
        proj_severity = "WATCH"
    else:
        proj_severity = "NORMAL"

    return {
        "trajectory": trajectory,
        "projected_severity": proj_severity,
        "current_nddi": round(current_nddi, 4),
        "projected_nddi_14d": round(projected_nddi, 4),
        "slope": round(adjusted_slope, 6),
    }
