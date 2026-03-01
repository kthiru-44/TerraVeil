"""InferencePacket dataclass — structured output from an OrbitalNode."""

from dataclasses import dataclass, asdict


@dataclass
class InferencePacketData:
    """Structured inference result from one OEC node."""
    node_id: str
    bbox: dict  # {north, south, east, west}
    flood_area_km2: float
    confidence: float
    ndwi_mean: float
    bandwidth_ratio: float
    compute_ms: int
    status: str = "success"  # success | failed | timeout
    raw_data_mb: float = 0.0
    packet_kb: float = 0.0
    flood_detected: bool = False

    def to_dict(self) -> dict:
        return asdict(self)

    @property
    def is_valid(self) -> bool:
        return self.status == "success" and self.confidence > 0
