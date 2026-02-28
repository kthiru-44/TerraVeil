"""Database query helpers for scans, pipeline logs, and orbital nodes."""

import uuid
import json
from datetime import datetime, timezone
from app.db.database import get_db


# ── Scan queries ────────────────────────────────────────────────────

async def create_scan(region_name: str, bbox: dict, t0: str, t1: str, source: str = "sentinel-2") -> str:
    """Create a new scan record and return its scan_id."""
    scan_id = str(uuid.uuid4())
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO scans
               (scan_id, region_name, bbox_north, bbox_south, bbox_east, bbox_west,
                t0_date, t1_date, data_source, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)""",
            (scan_id, region_name, bbox["north"], bbox["south"],
             bbox["east"], bbox["west"], t0, t1, source,
             datetime.now(timezone.utc).isoformat()),
        )
        await db.commit()
    finally:
        await db.close()
    return scan_id


async def update_scan_status(scan_id: str, status: str):
    db = await get_db()
    try:
        await db.execute("UPDATE scans SET status = ? WHERE scan_id = ?", (status, scan_id))
        await db.commit()
    finally:
        await db.close()


async def update_scan_results(scan_id: str, **kwargs):
    """Update scan with computed results. Pass any column as kwarg."""
    db = await get_db()
    try:
        set_clause = ", ".join(f"{k} = ?" for k in kwargs)
        values = list(kwargs.values()) + [scan_id]
        await db.execute(f"UPDATE scans SET {set_clause} WHERE scan_id = ?", values)
        await db.commit()
    finally:
        await db.close()


async def get_scan(scan_id: str) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM scans WHERE scan_id = ?", (scan_id,))
        row = await cursor.fetchone()
        if row is None:
            return None
        return dict(row)
    finally:
        await db.close()


async def get_scan_by_region(region_key: str, date: str) -> dict | None:
    """Find a cached scan by region name pattern and date."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM scans WHERE LOWER(region_name) LIKE ? AND t1_date = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1",
            (f"%{region_key.lower()}%", date),
        )
        row = await cursor.fetchone()
        if row is None:
            return None
        return dict(row)
    finally:
        await db.close()


async def get_history(limit: int = 20) -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT scan_id, region_name, risk_level, risk_score, status, created_at FROM scans ORDER BY created_at DESC LIMIT ?",
            (limit,),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


# ── Pipeline log queries ────────────────────────────────────────────

async def log_step(scan_id: str, step_name: str, step_order: int, status: str = "running",
                   input_summary: dict | None = None, node_id: str | None = None) -> str:
    """Log the START of a pipeline step. Returns log_id."""
    log_id = str(uuid.uuid4())
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO pipeline_logs
               (log_id, scan_id, step_name, step_order, status, started_at, input_summary, node_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (log_id, scan_id, step_name, step_order, status,
             datetime.now(timezone.utc).isoformat(),
             json.dumps(input_summary) if input_summary else None,
             node_id),
        )
        await db.commit()
    finally:
        await db.close()
    return log_id


async def complete_log_step(log_id: str, output_summary: dict | None = None, error: str | None = None):
    """Mark a pipeline step as completed (or failed)."""
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        # Compute duration
        cursor = await db.execute("SELECT started_at FROM pipeline_logs WHERE log_id = ?", (log_id,))
        row = await cursor.fetchone()
        duration_ms = None
        if row:
            started = datetime.fromisoformat(row["started_at"])
            duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)

        status = "failed" if error else "success"
        await db.execute(
            """UPDATE pipeline_logs
               SET status = ?, completed_at = ?, duration_ms = ?, output_summary = ?, error_message = ?
               WHERE log_id = ?""",
            (status, now, duration_ms,
             json.dumps(output_summary) if output_summary else None,
             error, log_id),
        )
        await db.commit()
    finally:
        await db.close()


async def get_logs(scan_id: str) -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM pipeline_logs WHERE scan_id = ? ORDER BY step_order ASC",
            (scan_id,),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


# ── Orbital node queries ────────────────────────────────────────────

async def save_node_telemetry(scan_id: str, node_id: str, tile_region: str,
                              inference_ms: int, raw_data_mb: float, packet_kb: float,
                              bandwidth_ratio: float, flood_detected: bool,
                              ndwi_mean: float, confidence: float) -> str:
    pass_id = str(uuid.uuid4())
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO orbital_nodes
               (pass_id, scan_id, node_id, tile_region, inference_ms, raw_data_mb,
                packet_kb, bandwidth_ratio, flood_detected, ndwi_mean, confidence, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (pass_id, scan_id, node_id, tile_region, inference_ms,
             raw_data_mb, packet_kb, bandwidth_ratio,
             1 if flood_detected else 0, ndwi_mean, confidence,
             datetime.now(timezone.utc).isoformat()),
        )
        await db.commit()
    finally:
        await db.close()
    return pass_id


async def get_nodes(scan_id: str) -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM orbital_nodes WHERE scan_id = ? ORDER BY timestamp ASC",
            (scan_id,),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()
