"""Backend integration tests."""

import pytest
from fastapi.testclient import FastAPI
from backend.app.main import app

client = TestClient(app)


def test_health_check():
    """Test health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_alert():
    """Test alert creation."""
    payload = {
        "severity": "CRITICAL",
        "district": "Chamoli",
        "message": "Immediate evacuation advised.",
        "channels": ["FCM"],
    }
    response = client.post("/api/v1/alerts", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["severity"] == "CRITICAL"
    assert data["district"] == "Chamoli"
    assert "id" in data
    assert "created_at" in data


def test_get_alerts():
    """Test alert retrieval."""
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert "total" in data


def test_risk_uttarakhand():
    """Test risk endpoint."""
    response = client.get("/api/v1/risk/uttarakhand")
    assert response.status_code == 200
    data = response.json()
    assert "state" in data
    assert data["state"] == "Uttarakhand"


def test_geojson_endpoint():
    """Test GeoJSON endpoint."""
    response = client.get("/api/v1/risk/uttarakhand/geojson")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
