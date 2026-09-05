"""District and state-level risk aggregation and GeoJSON generation."""

from collections import defaultdict
from datetime import datetime, timezone

from ai.src.config import settings
from ai.src.risk.rainfall import assess_station_rainfall_risk
from ai.src.schemas import (
    DataSourceStatus,
    DistrictRiskAssessment,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    GeoJSONPointGeometry,
    NWDPRecord,
    RiskLevelType,
    StationRiskAssessment,
    UttarakhandStateRiskAssessment,
)

SEVERITY_RANK: dict[RiskLevelType, int] = {
    "LOW": 1,
    "MODERATE": 2,
    "HIGH": 3,
    "CRITICAL": 4,
}
RANK_TO_SEVERITY: dict[int, RiskLevelType] = {
    1: "LOW",
    2: "MODERATE",
    3: "HIGH",
    4: "CRITICAL",
}


def get_highest_severity(levels: list[RiskLevelType]) -> RiskLevelType:
    """Escalate to the highest risk tier across a collection of elements."""
    if not levels:
        return "LOW"
    max_rank = max(SEVERITY_RANK.get(lvl, 1) for lvl in levels)
    return RANK_TO_SEVERITY.get(max_rank, "LOW")


def aggregate_district_risk(
    district_name: str,
    station_assessments: list[StationRiskAssessment],
    retrieved_at: datetime,
    data_source_status: DataSourceStatus,
) -> DistrictRiskAssessment:
    """Aggregate station assessments into an administrative district risk profile."""
    if not station_assessments:
        return DistrictRiskAssessment(
            district=district_name,
            station_count=0,
            highest_risk="LOW",
            average_risk_score=0.0,
            maximum_risk_score=0.0,
            high_or_critical_station_count=0,
            max_hourly_rainfall_mm=0.0,
            max_6h_rainfall_mm=0.0,
            max_24h_rainfall_mm=0.0,
            observation_time=None,
            retrieved_at=retrieved_at,
            data_age_hours=None,
            data_source_status=data_source_status,
            stations=[],
        )

    highest_risk = get_highest_severity([s.risk_level for s in station_assessments])
    avg_score = round(
        sum(s.risk_score for s in station_assessments) / len(station_assessments),
        1,
    )
    max_score = round(max(s.risk_score for s in station_assessments), 1)
    high_critical_count = sum(
        1 for s in station_assessments if s.risk_level in ("HIGH", "CRITICAL")
    )

    max_hourly = max(s.hourly_rainfall_mm for s in station_assessments)
    max_6h = max(s.rainfall_6h_mm for s in station_assessments)
    max_24h = max(s.rainfall_24h_mm for s in station_assessments)

    latest_obs_time = max(s.observation_time for s in station_assessments)
    min_data_age = min(s.data_age_hours for s in station_assessments)

    return DistrictRiskAssessment(
        district=district_name,
        station_count=len(station_assessments),
        highest_risk=highest_risk,
        average_risk_score=avg_score,
        maximum_risk_score=max_score,
        high_or_critical_station_count=high_critical_count,
        max_hourly_rainfall_mm=max_hourly,
        max_6h_rainfall_mm=max_6h,
        max_24h_rainfall_mm=max_24h,
        observation_time=latest_obs_time,
        retrieved_at=retrieved_at,
        data_age_hours=min_data_age,
        data_source_status=data_source_status,
        stations=station_assessments,
    )


def aggregate_state_risk(
    records: list[NWDPRecord],
    retrieved_at: datetime | None = None,
    data_source_status: DataSourceStatus = "live",
) -> UttarakhandStateRiskAssessment:
    """Process all observations and aggregate into a state-wide risk assessment.

    Dynamic Counts Rule:
        Never hardcode 13 districts or 40 stations. All counts, peak tiers,
        and averages are dynamically derived from the ingested records.
    """
    ref_time = retrieved_at or datetime.now(timezone.utc)

    if not records:
        return UttarakhandStateRiskAssessment(
            state="Uttarakhand",
            district_count=0,
            station_count=0,
            observations_used=0,
            highest_risk="LOW",
            average_risk_score=0.0,
            maximum_risk_score=0.0,
            high_or_critical_station_count=0,
            observation_time=None,
            retrieved_at=ref_time,
            data_age_hours=None,
            data_source_status=data_source_status,
            disclaimer=settings.PROTOTYPE_DISCLAIMER,
            districts=[],
        )

    # Group records by (district, station)
    grouped: dict[str, dict[str, list[NWDPRecord]]] = defaultdict(
        lambda: defaultdict(list)
    )
    for rec in records:
        dist_key = rec.district.strip()
        stn_key = rec.station.strip()
        grouped[dist_key][stn_key].append(rec)

    all_station_assessments: list[StationRiskAssessment] = []
    district_assessments: list[DistrictRiskAssessment] = []

    for district_name in sorted(grouped.keys()):
        station_assessments_for_district: list[StationRiskAssessment] = []
        for station_name in sorted(grouped[district_name].keys()):
            station_records = grouped[district_name][station_name]
            stn_eval = assess_station_rainfall_risk(
                station_name=station_name,
                district_name=district_name,
                records=station_records,
                retrieved_at=ref_time,
                data_source_status=data_source_status,
            )
            if stn_eval:
                station_assessments_for_district.append(stn_eval)
                all_station_assessments.append(stn_eval)

        dist_assessment = aggregate_district_risk(
            district_name=district_name,
            station_assessments=station_assessments_for_district,
            retrieved_at=ref_time,
            data_source_status=data_source_status,
        )
        district_assessments.append(dist_assessment)

    # State-level escalation & statistics
    state_highest_risk = get_highest_severity(
        [d.highest_risk for d in district_assessments]
    )
    state_avg_score = (
        round(
            sum(s.risk_score for s in all_station_assessments)
            / len(all_station_assessments),
            1,
        )
        if all_station_assessments
        else 0.0
    )
    state_max_score = (
        round(max(s.risk_score for s in all_station_assessments), 1)
        if all_station_assessments
        else 0.0
    )
    state_high_critical_count = sum(
        d.high_or_critical_station_count for d in district_assessments
    )

    valid_obs_times = [
        d.observation_time for d in district_assessments if d.observation_time
    ]
    state_latest_obs_time = max(valid_obs_times) if valid_obs_times else None

    valid_data_ages = [
        d.data_age_hours for d in district_assessments if d.data_age_hours is not None
    ]
    state_min_data_age = min(valid_data_ages) if valid_data_ages else None

    return UttarakhandStateRiskAssessment(
        state="Uttarakhand",
        district_count=len(district_assessments),
        station_count=len(all_station_assessments),
        observations_used=len(records),
        highest_risk=state_highest_risk,
        average_risk_score=state_avg_score,
        maximum_risk_score=state_max_score,
        high_or_critical_station_count=state_high_critical_count,
        observation_time=state_latest_obs_time,
        retrieved_at=ref_time,
        data_age_hours=state_min_data_age,
        data_source_status=data_source_status,
        disclaimer=settings.PROTOTYPE_DISCLAIMER,
        districts=district_assessments,
    )


def generate_geojson_features(
    state_assessment: UttarakhandStateRiskAssessment,
) -> GeoJSONFeatureCollection:
    """Convert state risk assessment into valid GeoJSON FeatureCollection.

    Coordinates Standard:
        Strictly [longitude, latitude] per GeoJSON WGS84 RFC 7946 standard.
    """
    features: list[GeoJSONFeature] = []

    for dist in state_assessment.districts:
        for stn in dist.stations:
            if stn.latitude is not None and stn.longitude is not None:
                geometry = GeoJSONPointGeometry(
                    coordinates=[stn.longitude, stn.latitude]
                )
                properties = {
                    "station": stn.station,
                    "district": stn.district,
                    "risk_level": stn.risk_level,
                    "risk_score": stn.risk_score,
                    "hourly_rainfall_mm": stn.hourly_rainfall_mm,
                    "rainfall_6h_mm": stn.rainfall_6h_mm,
                    "rainfall_24h_mm": stn.rainfall_24h_mm,
                    "observation_time": stn.observation_time.isoformat(),
                    "data_age_hours": stn.data_age_hours,
                    "data_source_status": stn.data_source_status,
                    "reasons": stn.reasons,
                }
                features.append(
                    GeoJSONFeature(
                        geometry=geometry,
                        properties=properties,
                    )
                )

    return GeoJSONFeatureCollection(features=features)
