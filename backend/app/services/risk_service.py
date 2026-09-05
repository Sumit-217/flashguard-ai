"""Risk assessment service bridging FastAPI backend with AI risk engine."""

from ai.src.risk_engine import calculate_risk
from backend.app.schemas.risk import RiskAssessmentRequest, RiskAssessmentResponse


def assess_risk(request: RiskAssessmentRequest) -> RiskAssessmentResponse:
    """Evaluate disaster risk using the independent AI risk engine.

    Args:
        request: Validated RiskAssessmentRequest payload.

    Returns:
        Standardized RiskAssessmentResponse matching demo API contract.
    """
    # Delegate core mathematical calculation to independent risk engine in ai/src/
    result = calculate_risk(
        rainfall=request.rainfall,
        water_level=request.water_level,
        historical_risk=request.historical_risk,
    )

    # Trigger emergency alert for HIGH or CRITICAL risk severity
    alert_triggered = result.risk_level in ("HIGH", "CRITICAL")

    return RiskAssessmentResponse(
        risk_score=result.risk_score,
        risk_level=result.risk_level,  # type: ignore[arg-type]
        disaster_type=request.disaster_type,
        affected_area=request.location,
        alert=alert_triggered,
    )
