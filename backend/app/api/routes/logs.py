"""GET /api/v1/scans/{id}/logs — Pipeline log timeline."""

from fastapi import APIRouter, HTTPException
from app.db import queries as db

router = APIRouter()


@router.get("/scans/{scan_id}/logs")
async def get_scan_logs(scan_id: str):
    """Get all pipeline log steps for a scan. Polled by frontend every 800ms."""
    scan = await db.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    logs = await db.get_logs(scan_id)
    return {
        "scan_id": scan_id,
        "scan_status": scan["status"],
        "steps": logs,
    }
