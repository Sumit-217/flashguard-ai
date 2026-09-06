"""Tests for emergency SMS alert schemas, service, providers, and API endpoint."""

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.app.main import app
from backend.app.schemas.alert import SMSAlertRequest, SMSAlertResponse
from backend.app.services.alert_service import (
    generate_emergency_message,
    mask_phone_number,
    send_alert,
    send_sms_alert,
)
from backend.app.services.sms_provider import (
    BaseSMSProvider,
    DemoSMSProvider,
    SMSDeliveryResult,
)

client = TestClient(app)


def test_valid_sms_alert_request_schema() -> None:
    """Verify that a properly constructed payload passes schema validation."""
    payload = {
        "phone_number": "9876543210",
        "location": "Joshimath",
        "risk_level": "CRITICAL",
        "risk_score": 81,
        "disaster_type": "flood",
    }
    req = SMSAlertRequest(**payload)
    assert req.phone_number == "9876543210"
    assert req.location == "Joshimath"
    assert req.risk_level == "CRITICAL"
    assert req.risk_score == 81
    assert req.disaster_type == "flood"


@pytest.mark.parametrize(
    "valid_phone",
    [
        "9876543210",
        "+919876543210",
        "123456789012345",
        "+12345678901234",
    ],
)
def test_phone_number_validation_valid(valid_phone: str) -> None:
    """Ensure valid phone numbers with 10–15 chars and optional '+' pass validation."""
    req = SMSAlertRequest(
        phone_number=valid_phone,
        location="Joshimath",
        risk_level="CRITICAL",
        risk_score=81,
        disaster_type="flood",
    )
    assert req.phone_number == valid_phone.strip()


@pytest.mark.parametrize(
    "invalid_phone",
    [
        "12345",  # Too short (<10)
        "123456789",  # 9 chars (<10)
        "1234567890123456",  # 16 chars (>15)
        "98765abcde",  # Non-numeric
        "98765-43210",  # Hyphens not permitted
        "+91 9876543210",  # Embedded spaces
    ],
)
def test_phone_number_validation_invalid(invalid_phone: str) -> None:
    """Ensure malformed or out-of-range phone numbers raise ValidationError."""
    with pytest.raises(ValidationError):
        SMSAlertRequest(
            phone_number=invalid_phone,
            location="Joshimath",
            risk_level="CRITICAL",
            risk_score=81,
            disaster_type="flood",
        )


@pytest.mark.parametrize("valid_score", [0, 1, 50, 81, 99, 100])
def test_risk_score_validation_valid(valid_score: int) -> None:
    """Ensure boundary and intermediate risk scores (0–100) are accepted."""
    req = SMSAlertRequest(
        phone_number="9876543210",
        location="Joshimath",
        risk_level="HIGH",
        risk_score=valid_score,
        disaster_type="landslide",
    )
    assert req.risk_score == valid_score


@pytest.mark.parametrize("invalid_score", [-5, -1, 101, 150])
def test_risk_score_validation_invalid(invalid_score: int) -> None:
    """Ensure risk scores outside [0, 100] raise ValidationError."""
    with pytest.raises(ValidationError):
        SMSAlertRequest(
            phone_number="9876543210",
            location="Joshimath",
            risk_level="HIGH",
            risk_score=invalid_score,
            disaster_type="landslide",
        )


def test_required_fields_validation() -> None:
    """Ensure missing required fields raise ValidationError."""
    with pytest.raises(ValidationError):
        SMSAlertRequest(  # type: ignore[call-arg]
            phone_number="9876543210",
            location="Joshimath",
        )


def test_message_generation() -> None:
    """Verify emergency message template formatting matching SIH demo contract."""
    message = generate_emergency_message(
        location="Joshimath",
        risk_level="CRITICAL",
        risk_score=81,
        disaster_type="flood",
    )
    expected = (
        "FLASHGUARD ALERT: CRITICAL flood risk detected at Joshimath. "
        "Risk Score: 81. Evacuate to the nearest safe zone."
    )
    assert message == expected
    # Must fit within single GSM 7-bit SMS limit (160 characters)
    assert len(message) <= 160


def test_phone_number_masking() -> None:
    """Verify phone numbers are masked preserving only the last 4 digits."""
    assert mask_phone_number("9876543210") == "******3210"
    assert mask_phone_number("+919876543210") == "*********3210"
    assert mask_phone_number("1234") == "****"
    assert mask_phone_number("12") == "**"


def test_demo_sms_provider() -> None:
    """Verify DemoSMSProvider generates delivery metadata without network calls."""
    provider = DemoSMSProvider()
    result = provider.send(
        phone_number="9876543210",
        message="Test alert message",
    )
    assert isinstance(result, SMSDeliveryResult)
    assert result.success is True
    assert result.delivery_mode == "SMS_DEMO"
    assert result.recipient == "******3210"
    assert result.message == "Test alert message"


def test_send_sms_alert_service() -> None:
    """Verify alert_service.send_sms_alert returns a structured SMSAlertResponse."""
    response = send_sms_alert(
        phone_number="9876543210",
        location="Joshimath",
        risk_level="CRITICAL",
        risk_score=81,
        disaster_type="flood",
    )
    assert isinstance(response, SMSAlertResponse)
    assert response.success is True
    assert response.delivery_mode == "SMS_DEMO"
    assert response.recipient == "******3210"
    assert response.message == (
        "FLASHGUARD ALERT: CRITICAL flood risk detected at Joshimath. "
        "Risk Score: 81. Evacuate to the nearest safe zone."
    )


def test_custom_provider_extensibility() -> None:
    """Verify that a custom BaseSMSProvider can be injected into the alert workflow."""

    class MockTelecomProvider(BaseSMSProvider):
        def send(self, phone_number: str, message: str) -> SMSDeliveryResult:
            return SMSDeliveryResult(
                success=True,
                delivery_mode="MOCK_TELECOM_GATEWAY",
                recipient=f"MOCKED_{phone_number[-4:]}",
                message=message,
            )

    req = SMSAlertRequest(
        phone_number="9876543210",
        location="Kedarnath",
        risk_level="HIGH",
        risk_score=75,
        disaster_type="landslide",
    )
    response = send_alert(req, provider=MockTelecomProvider())
    assert response.success is True
    assert response.delivery_mode == "MOCK_TELECOM_GATEWAY"
    assert response.recipient == "MOCKED_3210"


def test_api_send_alert_success() -> None:
    """Verify POST /api/v1/demo/send-alert returns exact expected SIH response."""
    payload = {
        "phone_number": "9876543210",
        "location": "Joshimath",
        "risk_level": "CRITICAL",
        "risk_score": 81,
        "disaster_type": "flood",
    }
    response = client.post("/api/v1/demo/send-alert", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "success": True,
        "delivery_mode": "SMS_DEMO",
        "recipient": "******3210",
        "message": (
            "FLASHGUARD ALERT: CRITICAL flood risk detected at Joshimath. "
            "Risk Score: 81. Evacuate to the nearest safe zone."
        ),
    }


def test_api_send_alert_invalid_phone() -> None:
    """Verify POST /api/v1/demo/send-alert rejects invalid phone number with 422."""
    payload = {
        "phone_number": "123",
        "location": "Joshimath",
        "risk_level": "CRITICAL",
        "risk_score": 81,
        "disaster_type": "flood",
    }
    response = client.post("/api/v1/demo/send-alert", json=payload)
    assert response.status_code == 422


def test_api_send_alert_invalid_risk_score() -> None:
    """Verify POST /api/v1/demo/send-alert rejects out-of-range risk score with 422."""
    payload = {
        "phone_number": "9876543210",
        "location": "Joshimath",
        "risk_level": "CRITICAL",
        "risk_score": 150,
        "disaster_type": "flood",
    }
    response = client.post("/api/v1/demo/send-alert", json=payload)
    assert response.status_code == 422


def test_api_send_alert_missing_field() -> None:
    """Verify POST /api/v1/demo/send-alert rejects missing field with 422."""
    payload = {
        "phone_number": "9876543210",
        "location": "Joshimath",
        "risk_level": "CRITICAL",
    }
    response = client.post("/api/v1/demo/send-alert", json=payload)
    assert response.status_code == 422


def test_existing_risk_assessment_unaffected() -> None:
    """Ensure existing demo risk-assessment endpoint continues working identically."""
    payload = {
        "disaster_type": "flood",
        "location": "Joshimath",
        "rainfall": 95,
        "water_level": 80,
        "historical_risk": 60,
    }
    response = client.post("/api/v1/demo/risk-assessment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_score"] == 81
    assert data["risk_level"] == "CRITICAL"
    assert data["disaster_type"] == "flood"
    assert data["affected_area"] == "Joshimath"
    assert data["alert"] is True
