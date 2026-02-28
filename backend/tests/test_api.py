"""Comprehensive API tests for TerraVeil backend.

Tests all 6 API endpoints plus edge cases:
  GET  /                   — Service info
  GET  /health             — Health check
  GET  /api/v1/risk        — Cached risk lookup (3 regions + unknown)
  POST /api/v1/scan        — Submit new scan (valid + invalid)
  GET  /api/v1/scans/{id}  — Get scan result
  GET  /api/v1/scans/{id}/logs — Pipeline logs
  GET  /api/v1/nodes/{id}  — Orbital node telemetry
  GET  /api/v1/history     — Recent scan history
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════════
#  Root & Health
# ═══════════════════════════════════════════════════════════════════

class TestRoot:
    def test_root_returns_service_info(self):
        r = client.get("/")
        assert r.status_code == 200
        data = r.json()
        assert data["service"] == "TerraVeil"
        assert "version" in data

    def test_health_check(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


# ═══════════════════════════════════════════════════════════════════
#  Risk Endpoint — Cached Regions
# ═══════════════════════════════════════════════════════════════════

class TestRiskEndpoint:
    """Test GET /api/v1/risk with all 3 cached regions."""

    def test_risk_kolhapur(self):
        r = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        assert r.status_code == 200
        data = r.json()
        assert data["region"] == "Kolhapur, Maharashtra"
        assert data["status"] == "completed"
        assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    def test_risk_chennai(self):
        r = client.get("/api/v1/risk", params={"region": "chennai", "date": "2021-11-18"})
        assert r.status_code == 200
        data = r.json()
        assert data["region"] == "Chennai, Tamil Nadu"
        assert data["status"] == "completed"

    def test_risk_pakistan(self):
        r = client.get("/api/v1/risk", params={"region": "pakistan", "date": "2022-08-28"})
        assert r.status_code == 200
        data = r.json()
        assert data["region"] == "Sindh, Pakistan"
        assert data["status"] == "completed"

    def test_different_regions_return_different_scan_ids(self):
        r1 = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        r2 = client.get("/api/v1/risk", params={"region": "chennai", "date": "2021-11-18"})
        assert r1.json()["scan_id"] != r2.json()["scan_id"]

    def test_risk_unknown_region_returns_404(self):
        r = client.get("/api/v1/risk", params={"region": "atlantis", "date": "2021-01-01"})
        assert r.status_code == 404

    def test_risk_missing_region_param_returns_422(self):
        r = client.get("/api/v1/risk")
        assert r.status_code == 422

    def test_risk_response_has_all_required_fields(self):
        r = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        data = r.json()
        required_fields = [
            "scan_id", "region", "risk_level", "risk_score", "confidence",
            "confidence_band", "flood_area_km2", "change_area_km2",
            "pop_affected", "hospitals_at_risk", "roads_km_affected",
            "forecast", "drought", "processing_ms", "status", "created_at",
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"

    def test_confidence_band_structure(self):
        r = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        band = r.json()["confidence_band"]
        assert "lower" in band
        assert "upper" in band
        assert 0 <= band["lower"] <= band["upper"] <= 1

    def test_forecast_structure(self):
        r = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        forecast = r.json()["forecast"]
        assert "score" in forecast
        assert "recommendation" in forecast
        assert 0 <= forecast["score"] <= 100

    def test_drought_structure(self):
        r = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        drought = r.json()["drought"]
        assert "nddi_mean" in drought
        assert "severity" in drought
        assert "area_km2" in drought

    def test_risk_score_in_valid_range(self):
        r = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        score = r.json()["risk_score"]
        assert 0 <= score <= 100

    def test_confidence_in_valid_range(self):
        r = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        conf = r.json()["confidence"]
        assert 0 <= conf <= 1


# ═══════════════════════════════════════════════════════════════════
#  Scan Submit & Lifecycle
# ═══════════════════════════════════════════════════════════════════

class TestScanEndpoint:
    """Test POST /api/v1/scan and GET /api/v1/scans/{id}."""

    VALID_PAYLOAD = {
        "region_name": "Test Region",
        "bbox": {"north": 20.0, "south": 19.0, "east": 73.0, "west": 72.0},
        "t0_date": "2024-01-01",
        "t1_date": "2024-01-15",
        "data_source": "sentinel-2",
    }

    def test_submit_valid_scan(self):
        r = client.post("/api/v1/scan", json=self.VALID_PAYLOAD)
        assert r.status_code == 200
        data = r.json()
        assert "scan_id" in data
        assert data["status"] == "pending"
        assert "message" in data

    def test_submit_scan_returns_uuid(self):
        r = client.post("/api/v1/scan", json=self.VALID_PAYLOAD)
        scan_id = r.json()["scan_id"]
        assert len(scan_id) == 36  # UUID format
        assert scan_id.count("-") == 4

    def test_submit_scan_missing_bbox(self):
        r = client.post("/api/v1/scan", json={"region_name": "Test"})
        assert r.status_code == 422

    def test_submit_scan_missing_dates(self):
        payload = {
            "region_name": "Test",
            "bbox": {"north": 20, "south": 19, "east": 73, "west": 72},
        }
        r = client.post("/api/v1/scan", json=payload)
        assert r.status_code == 422

    def test_submit_scan_invalid_bbox_types(self):
        payload = {
            "region_name": "Test",
            "bbox": {"north": "invalid", "south": 19, "east": 73, "west": 72},
            "t0_date": "2024-01-01",
            "t1_date": "2024-01-15",
        }
        r = client.post("/api/v1/scan", json=payload)
        assert r.status_code == 422

    def test_get_scan_result(self):
        # Submit first, then fetch
        r = client.post("/api/v1/scan", json=self.VALID_PAYLOAD)
        scan_id = r.json()["scan_id"]

        r2 = client.get(f"/api/v1/scans/{scan_id}")
        assert r2.status_code == 200
        data = r2.json()
        assert data["scan_id"] == scan_id
        assert data["region_name"] == "Test Region"

    def test_get_scan_not_found(self):
        r = client.get("/api/v1/scans/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 404

    def test_get_scan_invalid_id(self):
        r = client.get("/api/v1/scans/not-a-valid-scan-id")
        assert r.status_code == 404


# ═══════════════════════════════════════════════════════════════════
#  Logs
# ═══════════════════════════════════════════════════════════════════

class TestLogsEndpoint:
    """Test GET /api/v1/scans/{id}/logs."""

    def test_get_logs_for_cached_scan(self):
        # Get a known scan_id from risk endpoint
        r = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        scan_id = r.json()["scan_id"]

        r2 = client.get(f"/api/v1/scans/{scan_id}/logs")
        assert r2.status_code == 200
        data = r2.json()
        assert "steps" in data
        assert data["scan_id"] == scan_id
        assert data["scan_status"] == "completed"
        assert isinstance(data["steps"], list)
        assert len(data["steps"]) > 0

    def test_logs_have_required_fields(self):
        r = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        scan_id = r.json()["scan_id"]
        r2 = client.get(f"/api/v1/scans/{scan_id}/logs")
        steps = r2.json()["steps"]
        if steps:
            step = steps[0]
            assert "step_name" in step
            assert "step_order" in step
            assert "status" in step

    def test_logs_not_found(self):
        r = client.get("/api/v1/scans/00000000-0000-0000-0000-000000000000/logs")
        assert r.status_code == 404


# ═══════════════════════════════════════════════════════════════════
#  Orbital Nodes
# ═══════════════════════════════════════════════════════════════════

class TestNodesEndpoint:
    """Test GET /api/v1/nodes/{scan_id}."""

    def test_get_nodes_for_cached_scan(self):
        r = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        scan_id = r.json()["scan_id"]

        r2 = client.get(f"/api/v1/nodes/{scan_id}")
        assert r2.status_code == 200
        data = r2.json()
        assert "nodes" in data
        assert data["scan_id"] == scan_id
        assert data["total_nodes"] >= 1
        assert isinstance(data["nodes"], list)

    def test_nodes_have_required_fields(self):
        r = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        scan_id = r.json()["scan_id"]
        r2 = client.get(f"/api/v1/nodes/{scan_id}")
        nodes = r2.json()["nodes"]
        if nodes:
            node = nodes[0]
            for field in ["node_id", "scan_id", "confidence", "ndwi_mean", "bandwidth_ratio"]:
                assert field in node, f"Missing node field: {field}"

    def test_nodes_not_found(self):
        r = client.get("/api/v1/nodes/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 404


# ═══════════════════════════════════════════════════════════════════
#  History
# ═══════════════════════════════════════════════════════════════════

class TestHistoryEndpoint:
    """Test GET /api/v1/history."""

    def test_history_returns_scans(self):
        r = client.get("/api/v1/history")
        assert r.status_code == 200
        data = r.json()
        assert "scans" in data
        assert "total" in data
        assert data["total"] >= 3  # 3 pre-cached regions

    def test_history_limit_param(self):
        r = client.get("/api/v1/history", params={"limit": 2})
        assert r.status_code == 200
        data = r.json()
        assert len(data["scans"]) <= 2

    def test_history_items_have_required_fields(self):
        r = client.get("/api/v1/history")
        scans = r.json()["scans"]
        if scans:
            scan = scans[0]
            for field in ["scan_id", "region_name", "status", "created_at"]:
                assert field in scan, f"Missing history field: {field}"

    def test_history_invalid_limit(self):
        r = client.get("/api/v1/history", params={"limit": 999})
        assert r.status_code == 422  # limit must be <= 100


# ═══════════════════════════════════════════════════════════════════
#  Cross-Endpoint Integration
# ═══════════════════════════════════════════════════════════════════

class TestIntegration:
    """Tests that cross multiple endpoints to verify data consistency."""

    def test_risk_scan_id_is_fetchable(self):
        """Risk endpoint scan_id should be retrievable via /scans/{id}."""
        r1 = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        scan_id = r1.json()["scan_id"]

        r2 = client.get(f"/api/v1/scans/{scan_id}")
        assert r2.status_code == 200
        assert r2.json()["scan_id"] == scan_id

    def test_risk_scan_id_has_logs(self):
        """A completed risk scan should have pipeline logs."""
        r1 = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        scan_id = r1.json()["scan_id"]

        r2 = client.get(f"/api/v1/scans/{scan_id}/logs")
        assert r2.status_code == 200
        assert len(r2.json()["steps"]) >= 8  # At least 8 pipeline steps

    def test_risk_scan_id_has_nodes(self):
        """A completed risk scan should have orbital node telemetry."""
        r1 = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        scan_id = r1.json()["scan_id"]

        r2 = client.get(f"/api/v1/nodes/{scan_id}")
        assert r2.status_code == 200
        assert r2.json()["total_nodes"] >= 1

    def test_submitted_scan_appears_in_history(self):
        """A submitted scan should appear in the history list."""
        payload = {
            "region_name": "Integration Test Region",
            "bbox": {"north": 21.0, "south": 20.0, "east": 74.0, "west": 73.0},
            "t0_date": "2024-06-01",
            "t1_date": "2024-06-15",
            "data_source": "sentinel-2",
        }
        r1 = client.post("/api/v1/scan", json=payload)
        scan_id = r1.json()["scan_id"]

        r2 = client.get("/api/v1/history")
        scan_ids = [s["scan_id"] for s in r2.json()["scans"]]
        assert scan_id in scan_ids

    def test_all_cached_regions_in_history(self):
        """All 3 cached regions should appear in history."""
        r = client.get("/api/v1/history", params={"limit": 50})
        regions = [s["region_name"] for s in r.json()["scans"]]
        assert any("Kolhapur" in r for r in regions)
        assert any("Chennai" in r for r in regions)
        assert any("Pakistan" in r or "Sindh" in r for r in regions)

    def test_idempotent_risk_fetches(self):
        """Fetching the same region twice should return the same scan_id."""
        r1 = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        r2 = client.get("/api/v1/risk", params={"region": "kolhapur", "date": "2021-07-22"})
        assert r1.json()["scan_id"] == r2.json()["scan_id"]
