"""Pydantic schemas for the FlashGuard AI alert broadcast system."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

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
