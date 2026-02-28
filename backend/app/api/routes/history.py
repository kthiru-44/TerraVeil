"""GET /api/v1/history — Scan history list."""

from fastapi import APIRouter, Query
from app.db import queries as db

router = APIRouter()


@router.get("/history")
async def get_scan_history(limit: int = Query(default=20, le=100)):
    """Get recent scan history."""
    history = await db.get_history(limit)
    return {"scans": history, "total": len(history)}
