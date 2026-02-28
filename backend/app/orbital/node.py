"""OrbitalNode — simulates COSMEON CubeSat onboard inference."""

import time
import asyncio
import numpy as np
from app.orbital.inference_packet import InferencePacketData
from app.pipeline.ndwi import compute_ndwi, detect_flood
from app.core.constants import RAW_TILE_SIZE_MB, PACKET_SIZE_KB


class OrbitalNode:
    """
    Simulates an ESA Sentinel satellite node performing onboard inference.

    Each node:
    - Processes an independent geographic tile
    - Runs NDWI computation within a simulated 800ms compute budget
    - Returns a structured InferencePacket (not raw pixels)
    """

    def __init__(self, node_id: str, tile_bbox: dict, tile_region: str = ""):
        self.node_id = node_id
        self.tile_bbox = tile_bbox
        self.tile_region = tile_region or node_id

    async def process(self, imagery: dict, simulate_delay: bool = True) -> InferencePacketData:
        """
        Run inference on the assigned tile.

        Args:
            imagery: dict with 'baseline' and 'event' having 'green', 'nir' arrays
            simulate_delay: if True, adds realistic compute delay (200-800ms)

        Returns:
            InferencePacketData with results
        """
        start_ms = time.time() * 1000

        try:
            # Simulate orbital compute latency
            if simulate_delay:
                delay = np.random.uniform(0.2, 0.8)
                await asyncio.sleep(delay)

            green_before = imagery["baseline"]["green"]
            nir_before = imagery["baseline"]["nir"]
            green_after = imagery["event"]["green"]
            nir_after = imagery["event"]["nir"]

            # Slice tile from full image (each node gets a sub-region)
            h, w = green_after.shape
            tile_slice = self._get_tile_slice(h, w)
            g_b = green_before[tile_slice]
            n_b = nir_before[tile_slice]
            g_a = green_after[tile_slice]
            n_a = nir_after[tile_slice]

            # NDWI computation
            ndwi_before = compute_ndwi(g_b, n_b)
            ndwi_after = compute_ndwi(g_a, n_a)

            # Flood detection
            flood_mask, flood_area_km2, ndwi_mean = detect_flood(ndwi_before, ndwi_after)

            compute_ms = int(time.time() * 1000 - start_ms)

            # Bandwidth calculation
            raw_data_mb = RAW_TILE_SIZE_MB / 3  # each node gets ~1/3 of total
            packet_kb = PACKET_SIZE_KB
            bandwidth_ratio = (raw_data_mb * 1024) / packet_kb if packet_kb > 0 else 0

            return InferencePacketData(
                node_id=self.node_id,
                bbox=self.tile_bbox,
                flood_area_km2=flood_area_km2,
                confidence=self._compute_confidence(flood_mask, ndwi_after),
                ndwi_mean=ndwi_mean,
                bandwidth_ratio=round(bandwidth_ratio, 1),
                compute_ms=compute_ms,
                status="success",
                raw_data_mb=round(raw_data_mb, 1),
                packet_kb=packet_kb,
                flood_detected=flood_area_km2 > 0.5,
            )

        except Exception as e:
            compute_ms = int(time.time() * 1000 - start_ms)
            return InferencePacketData(
                node_id=self.node_id,
                bbox=self.tile_bbox,
                flood_area_km2=0.0,
                confidence=0.0,
                ndwi_mean=0.0,
                bandwidth_ratio=0.0,
                compute_ms=compute_ms,
                status="failed",
                raw_data_mb=0.0,
                packet_kb=0.0,
            )

    def _get_tile_slice(self, h: int, w: int) -> tuple:
        """Return the slice for this node's tile (NW / NE / South)."""
        mid_h = h // 2
        mid_w = w // 2

        if "07" in self.node_id:
            # NW quadrant
            return (slice(0, mid_h), slice(0, mid_w))
        elif "11" in self.node_id:
            # NE quadrant
            return (slice(0, mid_h), slice(mid_w, w))
        else:
            # South half
            return (slice(mid_h, h), slice(0, w))

    def _compute_confidence(self, flood_mask: np.ndarray, ndwi: np.ndarray) -> float:
        """Compute node-level confidence based on signal quality."""
        if flood_mask.size == 0:
            return 0.5

        # Factors: flood coverage, NDWI signal strength, spatial coherence
        coverage = np.mean(flood_mask)
        signal_strength = np.mean(np.abs(ndwi[flood_mask])) if np.any(flood_mask) else 0

        # Higher coverage + stronger signal = higher confidence
        confidence = 0.5 + 0.3 * min(1, coverage * 10) + 0.2 * min(1, signal_strength * 2)
        return round(min(0.99, max(0.1, confidence)), 3)
