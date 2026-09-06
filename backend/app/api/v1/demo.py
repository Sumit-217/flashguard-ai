"""Demo API router for the Monday Director Demo and emergency SMS alerting."""

from fastapi import APIRouter, status

from backend.app.schemas.alert import SMSAlertRequest, SMSAlertResponse
from backend.app.schemas.risk import RiskAssessmentRequest, RiskAssessmentResponse
from backend.app.services.alert_service import send_alert
from backend.app.services.risk_service import assess_risk

router = APIRouter(prefix="/demo", tags=["Demo"])


@router.post(
    "/risk-assessment",
    response_model=RiskAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Assess Disaster Risk",
    description="Evaluates composite disaster risk for target Uttarakhand locations.",
)
def assess_disaster_risk(
    request: RiskAssessmentRequest,
) -> RiskAssessmentResponse:
    """Validate request and delegate evaluation to the backend risk service."""
    return assess_risk(request)


@router.post(
    "/send-alert",
    response_model=SMSAlertResponse,
    status_code=status.HTTP_200_OK,
    summary="Dispatch Emergency SMS Alert (Demo)",
    description=(
        "Simulate emergency SMS alert generation and keypad-phone dispatch "
        "for high-risk disaster scenarios in Uttarakhand."
    ),
)
def send_emergency_alert(
    request: SMSAlertRequest,
) -> SMSAlertResponse:
    """Validate request and dispatch emergency SMS alert in demo mode."""
    return send_alert(request)

