"""POST /api/v1/scan — Submit a new analysis scan."""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models.schemas import ScanRequest, ScanSubmitResponse
from app.db import queries as db
from app.pipeline.runner import run_pipeline

router = APIRouter()


@router.post("/scan", response_model=ScanSubmitResponse)
async def submit_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """Submit a new scan for analysis. Runs pipeline in the background."""
    bbox = request.bbox.model_dump()

    scan_id = await db.create_scan(
        region_name=request.region_name,
        bbox=bbox,
        t0=request.t0_date,
        t1=request.t1_date,
        source=request.data_source,
    )

    background_tasks.add_task(
        run_pipeline, scan_id, request.region_name, bbox,
        request.t0_date, request.t1_date, request.data_source,
    )

    return ScanSubmitResponse(
        scan_id=scan_id,
        status="pending",
        message=f"Scan submitted. Pipeline running for {request.region_name}.",
    )


@router.get("/scans/{scan_id}")
async def get_scan(scan_id: str):
    """Get full scan result by ID."""
    scan = await db.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan
