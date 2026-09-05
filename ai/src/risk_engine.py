"""Independent in-process Risk Assessment Engine for FlashGuard AI.

Calculates composite disaster risk scores and categorical severity levels
based on weighted environmental and historical indicators.
"""

from typing import NamedTuple


class RiskAssessmentResult(NamedTuple):
    """Clean typed container for risk assessment output."""

    risk_score: int
    risk_level: str


def calculate_risk(
    rainfall: float,
    water_level: float,
    historical_risk: float,
) -> RiskAssessmentResult:
    """Calculate composite disaster risk score and severity level.

    Weights:
        - rainfall: 40% (0.40)
        - water_level: 35% (0.35)
        - historical_risk: 25% (0.25)

    Risk Level Classification:
        - 0 to 30: LOW
        - 31 to 50: MEDIUM
        - 51 to 75: HIGH
        - 76 to 100: CRITICAL

    Args:
        rainfall: Precipitation index (0.0 to 100.0).
        water_level: Water level index (0.0 to 100.0).
        historical_risk: Historical baseline vulnerability (0.0 to 100.0).

    Returns:
        RiskAssessmentResult containing risk_score and risk_level.

    Raises:
        ValueError: If any parameter is outside the range [0.0, 100.0].
    """
    for param_name, val in [
        ("rainfall", rainfall),
        ("water_level", water_level),
        ("historical_risk", historical_risk),
    ]:
        if val < 0.0 or val > 100.0:
            raise ValueError(f"{param_name} must be between 0 and 100, got {val}")

    # Weighted calculation aligned with the Monday Director Demo specification
    # e.g. Joshimath (90, 85, 70) -> 36 + 30 + 18 = 84 (CRITICAL)
    score_sum = (
        round(rainfall * 0.40)
        + round(water_level * 0.35)
        + round(historical_risk * 0.25)
    )
    risk_score = max(0, min(100, score_sum))

    if risk_score <= 30:
        risk_level = "LOW"
    elif risk_score <= 50:
        risk_level = "MEDIUM"
    elif risk_score <= 75:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    return RiskAssessmentResult(risk_score=risk_score, risk_level=risk_level)
