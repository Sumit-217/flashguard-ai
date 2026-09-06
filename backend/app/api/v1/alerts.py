"""Alert broadcast router for FlashGuard AI."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, status

from backend.app.schemas.alert import (
    AlertCreateRequest,
    AlertListResponse,
    AlertResponse,
)

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# In-memory storage for active disaster alerts
_alerts: list[AlertResponse] = []


@router.post(
    "",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Alert",
    description="Broadcast a new emergency alert across specified channels.",
)
def create_alert(payload: AlertCreateRequest) -> AlertResponse:
    """Create and broadcast a new disaster alert."""
    alert = AlertResponse(
        id=f"alert_{uuid.uuid4().hex[:8]}",
        severity=payload.severity,
        district=payload.district,
        message=payload.message,
        channels=payload.channels,
        latitude=payload.latitude,
        longitude=payload.longitude,
        created_at=datetime.now(timezone.utc),
        status="active",
    )
    _alerts.append(alert)
    return alert


@router.get(
    "",
    response_model=AlertListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Alerts",
    description="Retrieve all active alerts.",
)
def list_alerts() -> AlertListResponse:
    """Retrieve list of active disaster alerts."""
    return AlertListResponse(
        alerts=list(_alerts),
        total=len(_alerts),
    )
