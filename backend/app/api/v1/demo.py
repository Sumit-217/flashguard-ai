"""Demo API router for the Monday Director Demo."""

from fastapi import APIRouter, status

from backend.app.schemas.risk import RiskAssessmentRequest, RiskAssessmentResponse
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
