"""Pydantic schemas for the FlashGuard AI risk assessment API."""

from typing import Literal

from pydantic import BaseModel, Field

# Valid choices per Monday Director Demo specification
DisasterType = Literal["flood", "landslide", "cloudburst", "earthquake"]
LocationType = Literal["Joshimath", "Kedarnath", "Dharasu", "Rishikesh"]
RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


class RiskAssessmentRequest(BaseModel):
    """Input payload for disaster risk evaluation."""

    disaster_type: DisasterType = Field(
        ...,
        description="Type of natural disaster.",
        examples=["flood"],
    )
    location: LocationType = Field(
        ...,
        description="Target location in Uttarakhand, India.",
        examples=["Joshimath"],
    )
    rainfall: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Precipitation index / 24h mm (0.0 to 100.0).",
        examples=[90.0],
    )
    water_level: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="River / gauge station percentage (0.0 to 100.0).",
        examples=[85.0],
    )
    historical_risk: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Historical baseline vulnerability score (0.0 to 100.0).",
        examples=[70.0],
    )


class RiskAssessmentResponse(BaseModel):
    """Standardized risk evaluation response."""

    risk_score: int = Field(
        ...,
        ge=0,
        le=100,
        description="Calculated composite risk index.",
        examples=[84],
    )
    risk_level: RiskLevel = Field(
        ...,
        description="Categorical severity classification.",
        examples=["CRITICAL"],
    )
    disaster_type: str = Field(
        ...,
        description="Confirmed disaster category.",
        examples=["flood"],
    )
    affected_area: str = Field(
        ...,
        description="Confirmed geographical impact area.",
        examples=["Joshimath"],
    )
    alert: bool = Field(
        ...,
        description="High-priority emergency broadcast trigger.",
        examples=[True],
    )
