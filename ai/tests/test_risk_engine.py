"""Unit tests for the independent Risk Assessment Engine."""

import pytest

from ai.src.risk_engine import calculate_risk


def test_joshimath_critical_flood() -> None:
    """Validate exact Joshimath payload calculation against the API contract."""
    result = calculate_risk(rainfall=90.0, water_level=85.0, historical_risk=70.0)
    assert result.risk_score == 84
    assert result.risk_level == "CRITICAL"


def test_low_threshold() -> None:
    """Verify values in range 0-30 are classified as LOW."""
    result = calculate_risk(rainfall=10.0, water_level=10.0, historical_risk=10.0)
    assert result.risk_score == 10
    assert result.risk_level == "LOW"


def test_medium_threshold() -> None:
    """Verify values in range 31-50 are classified as MEDIUM."""
    result = calculate_risk(rainfall=40.0, water_level=40.0, historical_risk=40.0)
    assert result.risk_score == 40
    assert result.risk_level == "MEDIUM"


def test_high_threshold() -> None:
    """Verify values in range 51-75 are classified as HIGH."""
    result = calculate_risk(rainfall=60.0, water_level=60.0, historical_risk=60.0)
    assert result.risk_score == 60
    assert result.risk_level == "HIGH"


def test_critical_threshold() -> None:
    """Verify values in range 76-100 are classified as CRITICAL."""
    result = calculate_risk(rainfall=80.0, water_level=80.0, historical_risk=80.0)
    assert result.risk_score == 80
    assert result.risk_level == "CRITICAL"


@pytest.mark.parametrize(
    "rainfall, water_level, historical_risk, expected_score, expected_level",
    [
        (0.0, 0.0, 0.0, 0, "LOW"),
        (30.0, 30.0, 30.0, 30, "LOW"),
        (31.0, 31.0, 31.0, 31, "MEDIUM"),
        (50.0, 50.0, 50.0, 50, "MEDIUM"),
        (51.0, 51.0, 51.0, 51, "HIGH"),
        (75.0, 75.0, 75.0, 75, "HIGH"),
        (76.0, 76.0, 76.0, 76, "CRITICAL"),
        (100.0, 100.0, 100.0, 100, "CRITICAL"),
    ],
)
def test_boundary_values(
    rainfall: float,
    water_level: float,
    historical_risk: float,
    expected_score: int,
    expected_level: str,
) -> None:
    """Test boundary conditions between each risk severity tier."""
    result = calculate_risk(rainfall, water_level, historical_risk)
    assert result.risk_score == expected_score
    assert result.risk_level == expected_level


@pytest.mark.parametrize(
    "invalid_rainfall, invalid_water_level, invalid_historical_risk",
    [
        (-1.0, 50.0, 50.0),
        (50.0, -0.1, 50.0),
        (50.0, 50.0, -10.0),
    ],
)
def test_invalid_values_below_zero(
    invalid_rainfall: float,
    invalid_water_level: float,
    invalid_historical_risk: float,
) -> None:
    """Ensure ValueError is raised for negative input metrics."""
    with pytest.raises(ValueError, match="must be between 0 and 100"):
        calculate_risk(
            rainfall=invalid_rainfall,
            water_level=invalid_water_level,
            historical_risk=invalid_historical_risk,
        )


@pytest.mark.parametrize(
    "invalid_rainfall, invalid_water_level, invalid_historical_risk",
    [
        (100.1, 50.0, 50.0),
        (50.0, 105.0, 50.0),
        (50.0, 50.0, 200.0),
    ],
)
def test_invalid_values_above_hundred(
    invalid_rainfall: float,
    invalid_water_level: float,
    invalid_historical_risk: float,
) -> None:
    """Ensure ValueError is raised for metrics exceeding 100."""
    with pytest.raises(ValueError, match="must be between 0 and 100"):
        calculate_risk(
            rainfall=invalid_rainfall,
            water_level=invalid_water_level,
            historical_risk=invalid_historical_risk,
        )
