"""GET /api/v1/nodes/{scan_id} — OEC orbital node telemetry."""

from fastapi import APIRouter, HTTPException
from app.db import queries as db

router = APIRouter()


@router.get("/nodes/{scan_id}")
async def get_orbital_nodes(scan_id: str):
    """Get all OEC orbital node telemetry for a scan."""
    nodes = await db.get_nodes(scan_id)
    if not nodes:
        raise HTTPException(status_code=404, detail="No node data for this scan")
    return {
        "scan_id": scan_id,
        "nodes": nodes,
        "total_nodes": len(nodes),
    }
