```python
"""Pydantic schemas for the FlashGuard AI alert broadcast system."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


AlertSeverity = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
NotificationChannel = Literal["FCM", "SMS", "PUSH"]


class AlertCreateRequest(BaseModel):
    """Input payload for creating a new alert."""

    severity: AlertSeverity = Field(
        ...,
        description="Alert severity level.",
        examples=["CRITICAL"],
    )
    district: str = Field(
        ...,
        description="Affected administrative district.",
        examples=["Chamoli"],
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Alert message text.",
        examples=["Immediate evacuation advised."],
    )
    channels: list[NotificationChannel] = Field(
        default_factory=lambda: ["FCM"],
        description="Notification channels to use.",
        examples=[["FCM", "SMS"]],
    )
    latitude: float | None = Field(
        default=None,
        ge=-90.0,
        le=90.0,
        description="Optional WGS84 latitude of affected area.",
    )
    longitude: float | None = Field(
        default=None,
        ge=-180.0,
        le=180.0,
        description="Optional WGS84 longitude of affected area.",
    )


class AlertResponse(BaseModel):
    """Alert object returned from API."""

    id: str = Field(
        ...,
        description="Unique alert identifier.",
        examples=["alert_001"],
    )
    severity: AlertSeverity = Field(
        ...,
        description="Alert severity level.",
    )
    district: str = Field(
        ...,
        description="Affected administrative district.",
    )
    message: str = Field(
        ...,
        description="Alert message text.",
    )
    channels: list[NotificationChannel] = Field(
        default_factory=list,
        description="Channels selected for this alert.",
    )
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    created_at: datetime = Field(
        ...,
        description="Timestamp when alert was created in UTC.",
    )
    status: Literal["active", "acknowledged", "resolved"] = Field(
        default="active",
        description="Alert lifecycle status.",
    )


class AlertListResponse(BaseModel):
    """Container for alert list response."""

    alerts: list[AlertResponse] = Field(
        default_factory=list,
        description="List of recent alerts.",
    )
    total: int = Field(
        default=0,
        description="Total number of alerts.",
    )


class SMSAlertRequest(BaseModel):
    """Input payload for emergency SMS alert dispatch."""

    phone_number: str = Field(
        ...,
        min_length=10,
        max_length=15,
        description="Recipient phone number (10–15 digits with optional leading '+').",
        examples=["9876543210"],
    )
    location: str = Field(
        ...,
        min_length=1,
        description="Target affected location in Uttarakhand.",
        examples=["Joshimath"],
    )
    risk_level: str = Field(
        ...,
        min_length=1,
        description="Assessed disaster severity tier (e.g., CRITICAL, HIGH).",
        examples=["CRITICAL"],
    )
    risk_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Composite risk score on a 0–100 scale.",
        examples=[81],
    )
    disaster_type: str = Field(
        ...,
        min_length=1,
        description="Natural disaster category (e.g., flood, landslide).",
        examples=["flood"],
    )

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        """Validate phone number length and digit composition."""
        cleaned = value.strip()
        digits = cleaned[1:] if cleaned.startswith("+") else cleaned

        if not digits.isdigit():
            raise ValueError(
                "Phone number must contain only numeric digits "
                "(with optional leading '+')"
            )

        if not (10 <= len(cleaned) <= 15):
            raise ValueError(
                "Phone number length must be between 10 and 15 characters"
            )

        return cleaned

    @field_validator("location", "risk_level", "disaster_type")
    @classmethod
    def validate_non_empty_str(cls, value: str) -> str:
        """Ensure string fields contain non-whitespace characters."""
        cleaned = value.strip()

        if not cleaned:
            raise ValueError("Field cannot be empty or whitespace only")

        return cleaned


class SMSAlertResponse(BaseModel):
    """Standardized response payload for emergency SMS alert dispatch."""

    success: bool = Field(
        ...,
        description="Indicates whether the alert dispatch or simulation succeeded.",
        examples=[True],
    )
    delivery_mode: str = Field(
        ...,
        description="Delivery channel or simulation identifier (e.g., 'SMS_DEMO').",
        examples=["SMS_DEMO"],
    )
    recipient: str = Field(
        ...,
        description="Masked recipient phone number for data privacy.",
        examples=["******3210"],
    )
    message: str = Field(
        ...,
        description="Emergency SMS alert text payload.",
        examples=[
            "FLASHGUARD ALERT: CRITICAL flood risk detected at Joshimath. "
            "Risk Score: 81. Evacuate to the nearest safe zone."
        ],
    )
```
