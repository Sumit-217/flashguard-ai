"""Time-series rainfall processing and station-level risk assessment."""

from datetime import datetime, timedelta, timezone
from typing import Sequence

from ai.src.config import settings
from ai.src.schemas import (
    DataSourceStatus,
    NWDPRecord,
    RiskLevelType,
    StationRiskAssessment,
    TimeSeriesCompleteness,
)


def assess_station_rainfall_risk(
    station_name: str,
    district_name: str,
    records: Sequence[NWDPRecord],
    retrieved_at: datetime | None = None,
    data_source_status: DataSourceStatus = "live",
) -> StationRiskAssessment | None:
    """Evaluate explainable rainfall risk for a single monitoring station.

    Computes:
        - Latest available hourly rainfall
        - Rolling 6-hour accumulation
        - Rolling 24-hour accumulation
        - Time-series completeness counts
        - Explainable risk score (0-100) & risk level (LOW, MODERATE, HIGH, CRITICAL)
        - Data age relative to ingestion timestamp

    Args:
        station_name: Name of the telemetry station.
        district_name: Name of the parent district.
        records: All observation records for this station.
        retrieved_at: Pipeline retrieval/ingestion timestamp.
        data_source_status: Provenance status (live, cached, unavailable, demo).

    Returns:
        StationRiskAssessment or None if no valid observations exist.
    """
    if not records:
        return None

    # Sort observations chronologically
    sorted_obs = sorted(records, key=lambda r: r.observed_at)
    latest = sorted_obs[-1]
    ref_time = retrieved_at or datetime.now(timezone.utc)

    # Rolling window thresholds relative to the latest available observation time
    cutoff_6h = latest.observed_at - timedelta(hours=6)
    cutoff_24h = latest.observed_at - timedelta(hours=24)

    obs_6h = [r for r in sorted_obs if cutoff_6h < r.observed_at <= latest.observed_at]
    obs_24h = [
        r for r in sorted_obs if cutoff_24h < r.observed_at <= latest.observed_at
    ]

    rainfall_hourly = latest.rainfall_mm
    rainfall_6h = sum(r.rainfall_mm for r in obs_6h)
    rainfall_24h = sum(r.rainfall_mm for r in obs_24h)

    # Calculate explainable score and collect rationale
    score = 0.0
    reasons: list[str] = []

    # 1. Hourly rate contribution
    if rainfall_hourly >= settings.RAINFALL_CRITICAL_MM:
        score += 90.0
        reasons.append(
            f"Critical torrential hourly rain "
            f"({rainfall_hourly:.1f} mm >= {settings.RAINFALL_CRITICAL_MM} mm)"
        )
    elif rainfall_hourly >= settings.RAINFALL_HIGH_MM:
        score += 65.0
        reasons.append(
            f"High hourly rain "
            f"({rainfall_hourly:.1f} mm >= {settings.RAINFALL_HIGH_MM} mm)"
        )
    elif rainfall_hourly >= settings.RAINFALL_MODERATE_MM:
        score += 35.0
        reasons.append(
            f"Moderate hourly rain "
            f"({rainfall_hourly:.1f} mm >= {settings.RAINFALL_MODERATE_MM} mm)"
        )

    # 2. 6-hour accumulation contribution
    if rainfall_6h >= settings.RAINFALL_6H_SEVERE_MM:
        score += 30.0
        reasons.append(
            f"Severe 6-hour accumulation "
            f"({rainfall_6h:.1f} mm >= {settings.RAINFALL_6H_SEVERE_MM} mm)"
        )
    elif rainfall_6h >= settings.RAINFALL_6H_ELEVATED_MM:
        score += 15.0
        reasons.append(
            f"Elevated 6-hour accumulation "
            f"({rainfall_6h:.1f} mm >= {settings.RAINFALL_6H_ELEVATED_MM} mm)"
        )

    # 3. 24-hour accumulation contribution
    if rainfall_24h >= settings.RAINFALL_24H_SEVERE_MM:
        score += 25.0
        reasons.append(
            f"Severe 24-hour accumulation "
            f"({rainfall_24h:.1f} mm >= {settings.RAINFALL_24H_SEVERE_MM} mm)"
        )
    elif rainfall_24h >= settings.RAINFALL_24H_ELEVATED_MM:
        score += 10.0
        reasons.append(
            f"Elevated 24-hour accumulation "
            f"({rainfall_24h:.1f} mm >= {settings.RAINFALL_24H_ELEVATED_MM} mm)"
        )

    # Normal baseline fallback
    if not reasons:
        reasons.append("Precipitation within normal baseline thresholds")

    # Time-series completeness notation
    completeness = TimeSeriesCompleteness(
        observations_6h=len(obs_6h),
        expected_observations_6h=6,
        observations_24h=len(obs_24h),
        expected_observations_24h=24,
    )
    if len(obs_6h) < 3:
        reasons.append(f"Notice: Sparse 6h telemetry ({len(obs_6h)}/6 recorded)")
    if len(obs_24h) < 10:
        reasons.append(f"Notice: Sparse 24h telemetry ({len(obs_24h)}/24 recorded)")

    # Normalize final score between 0.0 and 100.0
    final_score = min(100.0, max(0.0, round(score, 1)))

    # Risk level categorization
    risk_level: RiskLevelType
    if final_score <= 30.0:
        risk_level = "LOW"
    elif final_score <= 50.0:
        risk_level = "MODERATE"
    elif final_score <= 75.0:
        risk_level = "HIGH"
    else:
        risk_level = "CRITICAL"

    # Data age calculation
    data_age_hours = max(
        0.0,
        round((ref_time - latest.observed_at).total_seconds() / 3600.0, 1),
    )

    # Extract coordinates from latest record with coordinates
    lat = latest.latitude
    lon = latest.longitude
    if lat is None or lon is None:
        for r in reversed(sorted_obs):
            if r.latitude is not None and r.longitude is not None:
                lat = r.latitude
                lon = r.longitude
                break

    return StationRiskAssessment(
        station=station_name,
        district=district_name,
        latitude=lat,
        longitude=lon,
        hourly_rainfall_mm=round(rainfall_hourly, 1),
        rainfall_6h_mm=round(rainfall_6h, 1),
        rainfall_24h_mm=round(rainfall_24h, 1),
        risk_score=final_score,
        risk_level=risk_level,
        reasons=reasons,
        observation_time=latest.observed_at,
        retrieved_at=ref_time,
        data_age_hours=data_age_hours,
        data_source_status=data_source_status,
        completeness=completeness,
    )
