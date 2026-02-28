"""GET /api/v1/risk — Quick risk lookup from cache (the demo curl endpoint)."""

from fastapi import APIRouter, HTTPException, Query
from app.db import queries as db
from app.core.config import DEMO_REGIONS
from app.pipeline.runner import run_pipeline

router = APIRouter()


@router.get("/risk")
async def get_risk(
    region: str = Query(..., description="Region key: kolhapur, chennai, pakistan"),
    date: str = Query(None, description="Event date YYYY-MM-DD"),
):
    """
    Quick risk intelligence lookup.

    This is THE demo curl command:
    curl 'http://localhost:8000/api/v1/risk?region=kolhapur&date=2021-07-22'
    """
    # Look up from cache
    scan = await db.get_scan_by_region(region, date)

    if scan:
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
        }

    # If not cached, check if it's a known demo region
    region_key = region.lower().strip()
    if region_key in DEMO_REGIONS:
        demo = DEMO_REGIONS[region_key]
        # Auto-run pipeline
        scan_id = await db.create_scan(
            region_name=demo["name"],
            bbox=demo["bbox"],
            t0=demo["t0"],
            t1=demo["t1"],
            source=demo["source"],
        )
        await run_pipeline(scan_id, demo["name"], demo["bbox"], demo["t0"], demo["t1"], demo["source"])
        scan = await db.get_scan(scan_id)
        if scan:
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
            }

    raise HTTPException(
        status_code=404,
        detail=f"No cached results for region='{region}', date='{date}'. Available regions: {list(DEMO_REGIONS.keys())}",
    )
