"""SQLite database initialization and connection management."""

import aiosqlite
import sqlite3
from app.core.config import DB_PATH


# ── Synchronous init (for startup) ──────────────────────────────────

def init_db():
    """Create all tables if they don't exist. Called once on app startup."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            scan_id           TEXT PRIMARY KEY,
            region_name       TEXT NOT NULL,
            bbox_north        REAL NOT NULL,
            bbox_south        REAL NOT NULL,
            bbox_east         REAL NOT NULL,
            bbox_west         REAL NOT NULL,
            t0_date           TEXT NOT NULL,
            t1_date           TEXT NOT NULL,
            data_source       TEXT NOT NULL,
            flood_area_km2    REAL,
            change_area_km2   REAL,
            risk_level        TEXT,
            risk_score        REAL,
            confidence        REAL,
            confidence_lower  REAL,
            confidence_upper  REAL,
            pop_affected      INTEGER,
            hospitals_at_risk INTEGER,
            roads_km_affected REAL,
            forecast_score    REAL,
            forecast_rec      TEXT,
            drought_nddi      REAL,
            drought_severity  TEXT,
            drought_area_km2  REAL,
            status            TEXT DEFAULT 'pending',
            created_at        TEXT NOT NULL,
            processing_ms     INTEGER,
            infrastructure_json TEXT,
            flood_geojson_json TEXT,
            before_geojson_json TEXT,
            forecast_geojson_json TEXT,
            drought_geojson_json TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pipeline_logs (
            log_id         TEXT PRIMARY KEY,
            scan_id        TEXT NOT NULL,
            step_name      TEXT NOT NULL,
            step_order     INTEGER NOT NULL,
            status         TEXT NOT NULL,
            started_at     TEXT NOT NULL,
            completed_at   TEXT,
            duration_ms    INTEGER,
            input_summary  TEXT,
            output_summary TEXT,
            error_message  TEXT,
            node_id        TEXT,
            FOREIGN KEY (scan_id) REFERENCES scans(scan_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orbital_nodes (
            pass_id          TEXT PRIMARY KEY,
            scan_id          TEXT NOT NULL,
            node_id          TEXT NOT NULL,
            tile_region      TEXT,
            inference_ms     INTEGER,
            raw_data_mb      REAL,
            packet_kb        REAL,
            bandwidth_ratio  REAL,
            flood_detected   INTEGER,
            ndwi_mean        REAL,
            confidence       REAL,
            timestamp        TEXT NOT NULL,
            FOREIGN KEY (scan_id) REFERENCES scans(scan_id)
        )
    """)

    conn.commit()
    conn.close()


# ── Async connection helper ─────────────────────────────────────────

async def get_db() -> aiosqlite.Connection:
    """Get an async SQLite connection."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db
