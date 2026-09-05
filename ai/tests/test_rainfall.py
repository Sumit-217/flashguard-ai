"""Unit tests for time-series rainfall processing and station risk scoring."""

from datetime import datetime, timedelta, timezone

from ai.src.risk.rainfall import assess_station_rainfall_risk
from ai.src.schemas import NWDPRecord


def test_station_risk_time_series_windows() -> None:
    """Validate 6h and 24h rolling accumulation and completeness metadata."""
    now = datetime(2026, 8, 15, 12, 0, tzinfo=timezone.utc)
    records = [
        NWDPRecord(
            station="Joshimath",
            district="Chamoli",
            observed_at=now - timedelta(hours=25),  # Outside 24h window
            rainfall_mm=100.0,
        ),
        NWDPRecord(
            station="Joshimath",
            district="Chamoli",
            observed_at=now - timedelta(hours=10),  # Inside 24h, outside 6h
            rainfall_mm=20.0,
        ),
        NWDPRecord(
            station="Joshimath",
            district="Chamoli",
            observed_at=now - timedelta(hours=3),  # Inside 6h
            rainfall_mm=15.0,
        ),
        NWDPRecord(
            station="Joshimath",
            district="Chamoli",
            observed_at=now,  # Latest observation
            rainfall_mm=30.0,
        ),
    ]

    eval_result = assess_station_rainfall_risk(
        station_name="Joshimath",
        district_name="Chamoli",
        records=records,
        retrieved_at=now + timedelta(hours=1),
    )
    assert eval_result is not None
    assert eval_result.hourly_rainfall_mm == 30.0
    assert eval_result.rainfall_6h_mm == 45.0  # 30 + 15
    assert eval_result.rainfall_24h_mm == 65.0  # 30 + 15 + 20
    assert eval_result.completeness.observations_6h == 2
    assert eval_result.completeness.expected_observations_6h == 6
    assert eval_result.completeness.observations_24h == 3
    assert eval_result.completeness.expected_observations_24h == 24
    assert eval_result.data_age_hours == 1.0


def test_station_risk_critical_scenario() -> None:
    """Test critical classification on torrential hourly rainfall."""
    now = datetime(2026, 8, 15, 12, 0, tzinfo=timezone.utc)
    records = [
        NWDPRecord(
            station="Joshimath",
            district="Chamoli",
            observed_at=now,
            rainfall_mm=95.0,  # >= 80mm critical
        ),
    ]
    result = assess_station_rainfall_risk("Joshimath", "Chamoli", records, now)
    assert result is not None
    assert result.risk_level == "CRITICAL"
    assert result.risk_score >= 76.0
    assert any("Critical torrential" in r for r in result.reasons)


def test_station_risk_moderate_scenario() -> None:
    """Test moderate classification on 25-49mm hourly rainfall."""
    now = datetime(2026, 8, 15, 12, 0, tzinfo=timezone.utc)
    records = [
        NWDPRecord(
            station="Dharasu",
            district="Uttarkashi",
            observed_at=now,
            rainfall_mm=35.0,
        ),
    ]
    result = assess_station_rainfall_risk("Dharasu", "Uttarkashi", records, now)
    assert result is not None
    assert result.risk_level == "MODERATE"
    assert 31.0 <= result.risk_score <= 50.0


def test_station_risk_low_baseline() -> None:
    """Test low classification on light rainfall."""
    now = datetime(2026, 8, 15, 12, 0, tzinfo=timezone.utc)
    records = [
        NWDPRecord(
            station="Rishikesh",
            district="Dehradun",
            observed_at=now,
            rainfall_mm=5.0,
        ),
    ]
    result = assess_station_rainfall_risk("Rishikesh", "Dehradun", records, now)
    assert result is not None
    assert result.risk_level == "LOW"
    assert result.risk_score <= 30.0
    assert any("normal baseline" in r.lower() for r in result.reasons)
