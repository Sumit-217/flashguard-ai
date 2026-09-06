"""Emergency alert service for FlashGuard AI.

Handles emergency message generation, phone number masking for privacy,
and SMS alert dispatch via pluggable SMS providers.
"""

from backend.app.schemas.alert import SMSAlertRequest, SMSAlertResponse
from backend.app.services.sms_provider import BaseSMSProvider, DemoSMSProvider


def mask_phone_number(phone_number: str) -> str:
    """Mask phone number preserving only the last 4 digits for privacy.

    Example:
        '9876543210' -> '******3210'
        '+919876543210' -> '*********3210'

    Args:
        phone_number: Input mobile phone number string.

    Returns:
        Masked phone number string.
    """
    cleaned = phone_number.strip()
    if len(cleaned) <= 4:
        return "*" * len(cleaned)
    return "*" * (len(cleaned) - 4) + cleaned[-4:]


def generate_emergency_message(
    location: str,
    risk_level: str,
    risk_score: int,
    disaster_type: str,
) -> str:
    """Generate concise emergency SMS alert message for keypad phones.

    Designed to fit within a single 160-character GSM SMS segment.

    Args:
        location: Affected geographic area (e.g., Joshimath).
        risk_level: Categorical risk tier (e.g., CRITICAL, HIGH).
        risk_score: Numerical risk score (0 to 100).
        disaster_type: Type of disaster (e.g., flood, landslide).

    Returns:
        Formatted emergency alert string.
    """
    return (
        f"FLASHGUARD ALERT: {risk_level} {disaster_type} risk detected at "
        f"{location}. Risk Score: {risk_score}. Evacuate to the nearest safe zone."
    )


def send_sms_alert(
    phone_number: str,
    location: str,
    risk_level: str,
    risk_score: int,
    disaster_type: str,
    provider: BaseSMSProvider | None = None,
) -> SMSAlertResponse:
    """Generate emergency message and dispatch alert via configured SMS provider.

    Args:
        phone_number: Target recipient phone number.
        location: Affected area.
        risk_level: Disaster severity tier.
        risk_score: Disaster risk index (0–100).
        disaster_type: Natural disaster type.
        provider: Optional SMS provider implementation (defaults to DemoSMSProvider).

    Returns:
        Standardized SMSAlertResponse.
    """
    if provider is None:
        provider = DemoSMSProvider()

    message = generate_emergency_message(
        location=location,
        risk_level=risk_level,
        risk_score=risk_score,
        disaster_type=disaster_type,
    )

    result = provider.send(
        phone_number=phone_number,
        message=message,
    )

    return SMSAlertResponse(
        success=result.success,
        delivery_mode=result.delivery_mode,
        recipient=result.recipient,
        message=result.message,
    )


def send_alert(
    request: SMSAlertRequest,
    provider: BaseSMSProvider | None = None,
) -> SMSAlertResponse:
    """Delegate SMSAlertRequest payload to the SMS alert dispatch workflow.

    Args:
        request: Validated SMSAlertRequest instance.
        provider: Optional SMS provider implementation.

    Returns:
        Standardized SMSAlertResponse.
    """
    return send_sms_alert(
        phone_number=request.phone_number,
        location=request.location,
        risk_level=request.risk_level,
        risk_score=request.risk_score,
        disaster_type=request.disaster_type,
        provider=provider,
    )
