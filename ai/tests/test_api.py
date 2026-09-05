"""Integration tests for the government telemetry and risk assessment API endpoints."""

from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from ai.src.clients.nwdp_client import NWDPClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    """Ensure GET /health returns healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_demo_risk_uttarakhand_endpoint() -> None:
    """Verify deterministic fallback endpoint GET /api/v1/demo/risk/uttarakhand."""
    response = client.get("/api/v1/demo/risk/uttarakhand")
    assert response.status_code == 200
    data = response.json()
    assert data["state"] == "Uttarakhand"
    assert data["data_source_status"] == "demo"
    assert data["district_count"] >= 4
    assert data["station_count"] >= 5
    assert data["highest_risk"] == "CRITICAL"
    assert "Prototype" in data["disclaimer"]


def test_risk_uttarakhand_with_mocked_records() -> None:
    """Verify GET /api/v1/risk/uttarakhand using mocked client records."""
    demo_records = NWDPClient.get_demo_records()
    with patch(
        "ai.src.clients.nwdp_client.NWDPClient.fetch_uttarakhand_records",
        new_callable=AsyncMock,
    ) as mock_fetch:
        mock_fetch.return_value = (demo_records, "live")
        response = client.get("/api/v1/risk/uttarakhand")
        assert response.status_code == 200
        data = response.json()
        assert data["state"] == "Uttarakhand"
        assert data["data_source_status"] == "live"
        assert len(data["districts"]) == data["district_count"]


def test_district_risk_endpoint() -> None:
    """Verify GET /api/v1/risk/district/{district} for valid and invalid queries."""
    demo_records = NWDPClient.get_demo_records()
    with patch(
        "ai.src.clients.nwdp_client.NWDPClient.fetch_uttarakhand_records",
        new_callable=AsyncMock,
    ) as mock_fetch:
        mock_fetch.return_value = (demo_records, "live")

        # Case-insensitive query for existing district
        resp_valid = client.get("/api/v1/risk/district/chamoli")
        assert resp_valid.status_code == 200
        assert resp_valid.json()["district"] == "Chamoli"

        # Non-existent district query
        resp_invalid = client.get("/api/v1/risk/district/goa")
        assert resp_invalid.status_code == 404


def test_station_risk_endpoint() -> None:
    """Verify GET /api/v1/risk/station/{station}."""
    demo_records = NWDPClient.get_demo_records()
    with patch(
        "ai.src.clients.nwdp_client.NWDPClient.fetch_uttarakhand_records",
        new_callable=AsyncMock,
    ) as mock_fetch:
        mock_fetch.return_value = (demo_records, "live")

        resp = client.get("/api/v1/risk/station/joshimath")
        assert resp.status_code == 200
        assert resp.json()["station"] == "Joshimath"
        assert resp.json()["risk_level"] == "CRITICAL"

        resp_invalid = client.get("/api/v1/risk/station/unknown_station")
        assert resp_invalid.status_code == 404


def test_risk_uttarakhand_geojson_endpoint() -> None:
    """Verify GET /api/v1/risk/uttarakhand/geojson returns valid GeoJSON structure."""
    demo_records = NWDPClient.get_demo_records()
    with patch(
        "ai.src.clients.nwdp_client.NWDPClient.fetch_uttarakhand_records",
        new_callable=AsyncMock,
    ) as mock_fetch:
        mock_fetch.return_value = (demo_records, "live")

        response = client.get("/api/v1/risk/uttarakhand/geojson")
        assert response.status_code == 200
        geojson = response.json()
        assert geojson["type"] == "FeatureCollection"
        assert len(geojson["features"]) > 0
        for feat in geojson["features"]:
            assert feat["geometry"]["type"] == "Point"
            coords = feat["geometry"]["coordinates"]
            assert len(coords) == 2


def test_existing_demo_contract_endpoint_unaffected() -> None:
    """Ensure POST /api/v1/demo/risk-assessment still produces 84/CRITICAL."""
    payload = {
        "disaster_type": "flood",
        "location": "Joshimath",
        "rainfall": 90,
        "water_level": 85,
        "historical_risk": 70,
    }
    response = client.post("/api/v1/demo/risk-assessment", json=payload)
    assert response.status_code == 200
    assert response.json() == {
        "risk_score": 84,
        "risk_level": "CRITICAL",
        "disaster_type": "flood",
        "affected_area": "Joshimath",
        "alert": True,
    }
