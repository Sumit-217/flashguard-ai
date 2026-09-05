"""Integration and API tests for the FlashGuard AI FastAPI backend."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health_check() -> None:
    """Verify that the health check endpoint returns 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_joshimath_demo_payload() -> None:
    """Verify exact Joshimath payload matching the demo API contract specification."""
    payload = {
        "disaster_type": "flood",
        "location": "Joshimath",
        "rainfall": 90,
        "water_level": 85,
        "historical_risk": 70,
    }
    response = client.post("/api/v1/demo/risk-assessment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "risk_score": 84,
        "risk_level": "CRITICAL",
        "disaster_type": "flood",
        "affected_area": "Joshimath",
        "alert": True,
    }


def test_invalid_location() -> None:
    """Ensure non-Uttarakhand locations are rejected with 422 Unprocessable Entity."""
    payload = {
        "disaster_type": "flood",
        "location": "Mumbai",
        "rainfall": 90,
        "water_level": 85,
        "historical_risk": 70,
    }
    response = client.post("/api/v1/demo/risk-assessment", json=payload)
    assert response.status_code == 422


def test_invalid_disaster_type() -> None:
    """Ensure unsupported disaster categories are rejected with 422."""
    payload = {
        "disaster_type": "tornado",
        "location": "Joshimath",
        "rainfall": 90,
        "water_level": 85,
        "historical_risk": 70,
    }
    response = client.post("/api/v1/demo/risk-assessment", json=payload)
    assert response.status_code == 422


@pytest.mark.parametrize("invalid_rainfall", [-5.0, 105.0])
def test_invalid_rainfall(invalid_rainfall: float) -> None:
    """Ensure rainfall out of [0, 100] range is rejected with 422."""
    payload = {
        "disaster_type": "flood",
        "location": "Joshimath",
        "rainfall": invalid_rainfall,
        "water_level": 85,
        "historical_risk": 70,
    }
    response = client.post("/api/v1/demo/risk-assessment", json=payload)
    assert response.status_code == 422


@pytest.mark.parametrize("invalid_water_level", [-1.0, 110.0])
def test_invalid_water_level(invalid_water_level: float) -> None:
    """Ensure water level out of [0, 100] range is rejected with 422."""
    payload = {
        "disaster_type": "flood",
        "location": "Joshimath",
        "rainfall": 90,
        "water_level": invalid_water_level,
        "historical_risk": 70,
    }
    response = client.post("/api/v1/demo/risk-assessment", json=payload)
    assert response.status_code == 422


@pytest.mark.parametrize("invalid_historical_risk", [-10.0, 150.0])
def test_invalid_historical_risk(invalid_historical_risk: float) -> None:
    """Ensure historical risk out of [0, 100] range is rejected with 422."""
    payload = {
        "disaster_type": "flood",
        "location": "Joshimath",
        "rainfall": 90,
        "water_level": 85,
        "historical_risk": invalid_historical_risk,
    }
    response = client.post("/api/v1/demo/risk-assessment", json=payload)
    assert response.status_code == 422


def test_low_risk_no_alert() -> None:
    """Ensure moderate or low risk scenarios do not trigger emergency alerts."""
    payload = {
        "disaster_type": "flood",
        "location": "Rishikesh",
        "rainfall": 20,
        "water_level": 20,
        "historical_risk": 20,
    }
    response = client.post("/api/v1/demo/risk-assessment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "LOW"
    assert data["alert"] is False
