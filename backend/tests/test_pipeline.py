"""Pipeline module unit tests for TerraVeil.

Tests individual pipeline computation modules:
  - NDWI computation & flood detection
  - NDDI drought classification
  - Change detection
  - Risk classification & population estimate
  - Orbital node inference
  - Bayesian consensus
"""

import numpy as np
import pytest
import sys
import os

# Ensure backend root is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ═══════════════════════════════════════════════════════════════════
#  NDWI Module
# ═══════════════════════════════════════════════════════════════════

class TestNDWI:
    def test_compute_ndwi_basic(self):
        from app.pipeline.ndwi import compute_ndwi
        green = np.array([[200, 300], [150, 400]], dtype=np.float64)
        nir = np.array([[100, 200], [300, 100]], dtype=np.float64)
        ndwi = compute_ndwi(green, nir)
        assert ndwi.shape == (2, 2)
        # NDWI = (green - nir) / (green + nir)
        # pixel [0,0]: (200-100)/(200+100) = 0.333
        assert abs(ndwi[0, 0] - 1/3) < 0.01

    def test_compute_ndwi_range(self):
        from app.pipeline.ndwi import compute_ndwi
        green = np.random.rand(100, 100) * 1000
        nir = np.random.rand(100, 100) * 1000
        ndwi = compute_ndwi(green, nir)
        assert ndwi.min() >= -1.0
        assert ndwi.max() <= 1.0

    def test_compute_ndwi_zero_safe(self):
        from app.pipeline.ndwi import compute_ndwi
        green = np.zeros((5, 5))
        nir = np.zeros((5, 5))
        ndwi = compute_ndwi(green, nir)
        assert not np.any(np.isnan(ndwi))
        assert not np.any(np.isinf(ndwi))

    def test_detect_flood(self):
        from app.pipeline.ndwi import detect_flood
        # Before: NDWI < 0 (dry), After: NDWI > 0 (flooded)
        ndwi_before = np.full((20, 20), -0.3)
        ndwi_after = np.full((20, 20), 0.4)
        mask, area, mean = detect_flood(ndwi_before, ndwi_after, pixel_area_km2=0.01)
        assert mask.shape == (20, 20)
        assert area > 0
        assert mean > 0

    def test_detect_flood_no_new_flooding(self):
        from app.pipeline.ndwi import detect_flood
        # Both positive — no new flooding
        ndwi_before = np.full((10, 10), 0.3)
        ndwi_after = np.full((10, 10), 0.5)
        mask, area, mean = detect_flood(ndwi_before, ndwi_after)
        assert area == 0.0

    def test_flood_probability(self):
        from app.pipeline.ndwi import compute_flood_probability
        ndwi = np.array([-0.5, 0.0, 0.5])
        prob = compute_flood_probability(ndwi)
        assert prob.min() >= 0.0
        assert prob.max() <= 1.0
        # Higher NDWI → higher probability
        assert prob[2] > prob[1] > prob[0]


# ═══════════════════════════════════════════════════════════════════
#  NDDI / Drought Module
# ═══════════════════════════════════════════════════════════════════

class TestNDDI:
    def test_compute_ndvi(self):
        from app.pipeline.nddi import compute_ndvi
        nir = np.array([300.0, 400.0])
        red = np.array([100.0, 100.0])
        ndvi = compute_ndvi(nir, red)
        assert ndvi.shape == (2,)
        # (300-100)/(300+100) = 0.5
        assert abs(ndvi[0] - 0.5) < 0.01

    def test_compute_nddi(self):
        from app.pipeline.nddi import compute_nddi
        ndvi = np.array([0.5, 0.7])
        ndwi = np.array([0.3, 0.1])
        nddi = compute_nddi(ndvi, ndwi)
        assert nddi.shape == (2,)
        assert nddi.min() >= -1.0
        assert nddi.max() <= 1.0

    def test_classify_drought_normal(self):
        from app.pipeline.nddi import classify_drought
        nddi = np.full((100, 100), 0.05)  # Below all thresholds
        result = classify_drought(nddi)
        assert result["severity"] == "NORMAL"

    def test_classify_drought_watch(self):
        from app.pipeline.nddi import classify_drought
        nddi = np.full((100, 100), 0.2)  # WATCH range
        result = classify_drought(nddi)
        assert result["severity"] == "WATCH"

    def test_classify_drought_warning(self):
        from app.pipeline.nddi import classify_drought
        nddi = np.full((100, 100), 0.4)  # WARNING range
        result = classify_drought(nddi)
        assert result["severity"] == "WARNING"

    def test_classify_drought_emergency(self):
        from app.pipeline.nddi import classify_drought
        nddi = np.full((100, 100), 0.6)  # EMERGENCY
        result = classify_drought(nddi)
        assert result["severity"] == "EMERGENCY"
        assert result["drought_area_km2"] > 0

    def test_classify_drought_has_all_fields(self):
        from app.pipeline.nddi import classify_drought
        nddi = np.full((50, 50), 0.3)
        result = classify_drought(nddi)
        for field in ["nddi_mean", "severity", "drought_area_km2"]:
            assert field in result


# ═══════════════════════════════════════════════════════════════════
#  Change Detection
# ═══════════════════════════════════════════════════════════════════

class TestChangeDetection:
    def test_detect_change_basic(self):
        from app.pipeline.change_detection import detect_change
        t0 = np.full((20, 20), -0.3)
        t1 = np.full((20, 20), 0.5)
        delta, mask, area = detect_change(t0, t1, threshold=0.2)
        assert delta.shape == (20, 20)
        assert mask.shape == (20, 20)
        assert area > 0

    def test_detect_change_no_change(self):
        from app.pipeline.change_detection import detect_change
        t0 = np.full((10, 10), 0.3)
        t1 = np.full((10, 10), 0.3)
        delta, mask, area = detect_change(t0, t1, threshold=0.2)
        assert area == 0.0
        assert not np.any(mask)

    def test_detect_change_threshold(self):
        from app.pipeline.change_detection import detect_change
        t0 = np.full((10, 10), 0.0)
        t1 = np.full((10, 10), 0.15)  # Below threshold
        _, _, area = detect_change(t0, t1, threshold=0.2)
        assert area == 0.0


# ═══════════════════════════════════════════════════════════════════
#  Risk Classifier
# ═══════════════════════════════════════════════════════════════════

class TestRiskClassifier:
    def test_classify_low_risk(self):
        from app.pipeline.risk_classifier import classify_risk
        result = classify_risk(
            flood_area_km2=5, confidence=0.9,
            pop_affected=1000, ndwi_mean=0.1,
        )
        assert result["risk_level"] == "LOW"
        assert 0 <= result["risk_score"] <= 20

    def test_classify_medium_risk(self):
        from app.pipeline.risk_classifier import classify_risk
        result = classify_risk(
            flood_area_km2=30, confidence=0.9,
            pop_affected=60000, ndwi_mean=0.35,
            hospitals_at_risk=2,
        )
        assert result["risk_level"] == "MEDIUM"
        assert 20 <= result["risk_score"] <= 50

    def test_classify_high_risk(self):
        from app.pipeline.risk_classifier import classify_risk
        result = classify_risk(
            flood_area_km2=100, confidence=0.95,
            pop_affected=200000, ndwi_mean=0.45,
            hospitals_at_risk=3, forecast_score=70,
        )
        assert result["risk_level"] in ["HIGH", "CRITICAL"]
        assert result["risk_score"] >= 50

    def test_classify_critical_risk(self):
        from app.pipeline.risk_classifier import classify_risk
        result = classify_risk(
            flood_area_km2=200, confidence=0.99,
            pop_affected=500000, ndwi_mean=0.5,
            hospitals_at_risk=5, forecast_score=90,
        )
        assert result["risk_level"] == "CRITICAL"
        assert result["risk_score"] >= 75

    def test_risk_score_range(self):
        from app.pipeline.risk_classifier import classify_risk
        result = classify_risk(
            flood_area_km2=0, confidence=0.5,
            pop_affected=0, ndwi_mean=0,
        )
        assert 0 <= result["risk_score"] <= 100

    def test_risk_components_present(self):
        from app.pipeline.risk_classifier import classify_risk
        result = classify_risk(
            flood_area_km2=50, confidence=0.9,
            pop_affected=10000, ndwi_mean=0.3,
        )
        assert "components" in result
        assert "area" in result["components"]
        assert "population" in result["components"]

    def test_estimate_population(self):
        from app.pipeline.risk_classifier import estimate_population
        pop = estimate_population(30.0, region_density=2000.0)
        assert pop == 60000

    def test_estimate_population_zero_area(self):
        from app.pipeline.risk_classifier import estimate_population
        pop = estimate_population(0.0)
        assert pop == 0


# ═══════════════════════════════════════════════════════════════════
#  Consensus Protocol
# ═══════════════════════════════════════════════════════════════════

class TestConsensus:
    def _make_packet(self, flood_detected=True, confidence=0.95, area=30.0):
        from app.orbital.inference_packet import InferencePacketData
        return InferencePacketData(
            node_id="TEST-NODE",
            bbox={"north": 17, "south": 16, "east": 75, "west": 74},
            flood_area_km2=area,
            confidence=confidence,
            ndwi_mean=0.35,
            bandwidth_ratio=380000,
            compute_ms=600,
            raw_data_mb=2300,
            packet_kb=6.2,
            flood_detected=flood_detected,
        )

    def test_consensus_3_of_3(self):
        from app.orbital.consensus import run_consensus
        packets = [self._make_packet() for _ in range(3)]
        result = run_consensus(packets)
        assert result["nodes_responded"] == 3
        assert result["confidence"] > 0.9
        assert result["flood_area_km2"] > 0

    def test_consensus_2_of_3(self):
        from app.orbital.consensus import run_consensus
        packets = [
            self._make_packet(flood_detected=True),
            self._make_packet(flood_detected=True),
            self._make_packet(flood_detected=False),
        ]
        result = run_consensus(packets)
        assert result["nodes_responded"] >= 2

    def test_consensus_insufficient_data(self):
        from app.orbital.consensus import run_consensus
        packets = [self._make_packet()]
        result = run_consensus(packets)
        # 1 node is below MIN_NODES_FOR_CONSENSUS (2)
        assert result["status"] == "INSUFFICIENT_DATA"
        assert result["reduced_confidence"] is True

    def test_consensus_confidence_range(self):
        from app.orbital.consensus import run_consensus
        packets = [self._make_packet() for _ in range(3)]
        result = run_consensus(packets)
        assert 0 <= result["confidence"] <= 1
        assert result["confidence_lower"] <= result["confidence_upper"]


# ═══════════════════════════════════════════════════════════════════
#  Constants Sanity
# ═══════════════════════════════════════════════════════════════════

class TestConstants:
    def test_pipeline_steps_count(self):
        from app.core.constants import PIPELINE_STEPS
        assert len(PIPELINE_STEPS) == 10

    def test_risk_thresholds_cover_range(self):
        from app.core.constants import RISK_THRESHOLDS
        assert RISK_THRESHOLDS["LOW"][0] == 0
        assert RISK_THRESHOLDS["CRITICAL"][1] == 100

    def test_oec_node_ids(self):
        from app.core.constants import OEC_NODE_IDS
        assert len(OEC_NODE_IDS) == 3
        assert all(id.startswith("COSMEON") for id in OEC_NODE_IDS)
