"""Backend services and bridges package."""

from backend.app.services.alert_service import (
    generate_emergency_message,
    mask_phone_number,
    send_alert,
    send_sms_alert,
)
from backend.app.services.risk_service import assess_risk
from backend.app.services.sms_provider import BaseSMSProvider, DemoSMSProvider

__all__ = [
    "BaseSMSProvider",
    "DemoSMSProvider",
    "assess_risk",
    "generate_emergency_message",
    "mask_phone_number",
    "send_alert",
    "send_sms_alert",
]

