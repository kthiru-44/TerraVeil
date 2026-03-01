"""Pydantic models / schemas for TerraVeil API."""

from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Request Models ──────────────────────────────────────────────────

class BBox(BaseModel):
    north: float
    south: float
    east: float
    west: float


class ScanRequest(BaseModel):
    region_name: str = Field(..., example="Kolhapur, Maharashtra")
    bbox: BBox
    t0_date: str = Field(..., example="2021-06-15")
    t1_date: str = Field(..., example="2021-07-22")
    data_source: str = Field(default="sentinel-2")


# ── Orbital / OEC Models ───────────────────────────────────────────

class InferencePacket(BaseModel):
    node_id: str
    bbox: BBox
    flood_area_km2: float
    confidence: float
    ndwi_mean: float
    bandwidth_ratio: float
    compute_ms: int
    status: str = "success"
    raw_data_mb: float = 0.0
    packet_kb: float = 0.0


# ── Pipeline Log ───────────────────────────────────────────────────

class PipelineLogRow(BaseModel):
    log_id: str
    scan_id: str
    step_name: str
    step_order: int
    status: str
    started_at: str
    completed_at: Optional[str] = None
    duration_ms: Optional[int] = None
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    error_message: Optional[str] = None
    node_id: Optional[str] = None


# ── Consensus / Risk Response ──────────────────────────────────────

class ConfidenceBand(BaseModel):
    lower: float
    upper: float


class ForecastResult(BaseModel):
    score: float
    recommendation: str
    rainfall_72h_mm: float = 0.0
    ndwi_trend_slope: float = 0.0


class InfrastructureItem(BaseModel):
    type: str
    name: str
    lat: float
    lon: float
    risk_level: str


class OrbitalNodeTelemetry(BaseModel):
    pass_id: str
    scan_id: str
    node_id: str
    tile_region: str
    inference_ms: int
    raw_data_mb: float
    packet_kb: float
    bandwidth_ratio: float
    flood_detected: bool
    ndwi_mean: float
    confidence: float
    timestamp: str


class RiskInsightObject(BaseModel):
    scan_id: str
    region: str
    bbox: BBox
    t0_date: str
    t1_date: str
    data_source: str
    status: str

    # Risk
    risk_level: str
    risk_score: float
    confidence: float
    confidence_band: ConfidenceBand

    # Flood
    flood_area_km2: float
    change_area_km2: float

    # Drought
    drought: Optional[DroughtResult] = None

    # Impact
    pop_affected: int
    hospitals_at_risk: int
    roads_km_affected: float
    infrastructure: list[InfrastructureItem] = []

    # Forecast
    forecast: Optional[ForecastResult] = None

    # OEC provenance
    nodes_responded: int
    consensus_method: str = "bayesian_weighted"
    orbital_nodes: list[InferencePacket] = []
    bandwidth_reduction_ratio: float = 0.0

    # Meta
    processing_ms: int
    created_at: str


# ── API wrapper responses ──────────────────────────────────────────

class ScanSubmitResponse(BaseModel):
    scan_id: str
    status: str
    message: str


class HistoryItem(BaseModel):
    scan_id: str
    region_name: str
    risk_level: Optional[str] = None
    risk_score: Optional[float] = None
    status: str
    created_at: str
