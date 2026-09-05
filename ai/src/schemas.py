"""Pydantic schemas and data models for NWDP records, risk assessments, and GeoJSON."""

import logging
from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

RiskLevelType = Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
DataSourceStatus = Literal["live", "cached", "unavailable", "demo"]


def parse_acquisition_time(time_str: str | None) -> datetime | None:
    """Parse NWDP 'Data Acquisition Time' into a timezone-aware UTC datetime.

    Supports formats observed in NWDP/NWIC datastore:
    - DD-MM-YYYY HH:MM (e.g. '17-02-2026 23:00')
    - DD-Mon-YYYY HH:MM (e.g. '15-Jul-2026 20:00')
    - Standard ISO-8601 strings
    """
    if not time_str or not time_str.strip() or time_str.strip() == "-":
        return None

    cleaned = time_str.strip()
    date_formats = [
        "%d-%m-%Y %H:%M",
        "%d-%b-%Y %H:%M",
        "%d-%B-%Y %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M",
    ]
    for fmt in date_formats:
        try:
            dt = datetime.strptime(cleaned, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    logger.warning("Could not parse observation timestamp: '%s'", time_str)
    return None


def parse_float_safe(val: Any) -> float | None:
    """Safely cast raw values to float, returning None on invalid/missing content."""
    if val is None:
        return None
    val_str = str(val).strip()
    if not val_str or val_str in ("-", "null", "none", "nan"):
        return None
    try:
        f = float(val_str)
        return f if f >= 0.0 else None
    except ValueError:
        return None


class NWDPRecord(BaseModel):
    """Normalized observation from NWDP/NWIC datastore."""

    id: int | str | None = Field(default=None, description="Record unique identifier")
    station: str = Field(..., description="Station name")
    district: str = Field(..., description="District name")
    agency: str | None = Field(default=None, description="Reporting agency")
    state: str = Field(default="Uttarakhand", description="State name")
    latitude: float | None = Field(default=None, description="WGS84 Latitude")
    longitude: float | None = Field(default=None, description="WGS84 Longitude")
    observed_at: datetime = Field(..., description="Observation timestamp in UTC")
    rainfall_mm: float = Field(
        ..., ge=0.0, description="Hourly rainfall measurement in mm"
    )

    @classmethod
    def from_raw(cls, raw: dict[str, Any]) -> "NWDPRecord | None":
        """Convert a raw NWDP CKAN record dictionary into a validated NWDPRecord."""
        try:
            station = str(raw.get("Station") or raw.get("station") or "").strip()
            district = str(raw.get("District") or raw.get("district") or "").strip()
            if not station or not district or station == "-" or district == "-":
                return None

            raw_time = raw.get("Data Acquisition Time") or raw.get("observed_at")
            observed_at = parse_acquisition_time(raw_time)
            if not observed_at:
                return None

            raw_rf = raw.get("Telemetry Hourly Rainfall (mm)") or raw.get("rainfall_mm")
            rainfall_mm = parse_float_safe(raw_rf)
            if rainfall_mm is None:
                # Missing or null rainfall reading
                rainfall_mm = 0.0

            raw_lat = raw.get("Latitude") or raw.get("latitude")
            raw_lon = raw.get("Longitude") or raw.get("longitude")
            lat = parse_float_safe(raw_lat)
            lon = parse_float_safe(raw_lon)

            # Validate WGS84 coordinate bounds
            if lat is not None and not (-90.0 <= lat <= 90.0):
                lat = None
            if lon is not None and not (-180.0 <= lon <= 180.0):
                lon = None

            return cls(
                id=raw.get("_id") or raw.get("id"),
                station=station,
                district=district,
                agency=str(raw.get("Agency") or "Uttarakhand").strip(),
                state=str(raw.get("State") or "Uttarakhand").strip(),
                latitude=lat,
                longitude=lon,
                observed_at=observed_at,
                rainfall_mm=rainfall_mm,
            )
        except Exception as exc:
            logger.debug("Failed to parse raw record: %s. Error: %s", raw, exc)
            return None


class TimeSeriesCompleteness(BaseModel):
    """Metadata tracking observation continuity and missing intervals."""

    observations_6h: int = Field(
        ..., description="Actual observations in rolling 6-hour window"
    )
    expected_observations_6h: int = Field(
        default=6, description="Expected hourly observations in 6-hour window"
    )
    observations_24h: int = Field(
        ..., description="Actual observations in rolling 24-hour window"
    )
    expected_observations_24h: int = Field(
        default=24, description="Expected hourly observations in 24-hour window"
    )


class StationRiskAssessment(BaseModel):
    """Risk evaluation for an individual monitoring station."""

    station: str = Field(..., description="Station name")
    district: str = Field(..., description="District name")
    latitude: float | None = Field(default=None, description="WGS84 Latitude")
    longitude: float | None = Field(default=None, description="WGS84 Longitude")
    hourly_rainfall_mm: float = Field(
        ..., description="Rainfall in latest available observation"
    )
    rainfall_6h_mm: float = Field(
        ..., description="Accumulated rainfall over preceding 6 hours"
    )
    rainfall_24h_mm: float = Field(
        ..., description="Accumulated rainfall over preceding 24 hours"
    )
    risk_score: float = Field(
        ..., ge=0.0, le=100.0, description="Calculated composite risk score (0-100)"
    )
    risk_level: RiskLevelType = Field(
        ..., description="Risk classification: LOW, MODERATE, HIGH, CRITICAL"
    )
    reasons: list[str] = Field(
        default_factory=list, description="Explanatory scoring breakdown"
    )
    observation_time: datetime = Field(
        ..., description="Timestamp of latest available observation in UTC"
    )
    retrieved_at: datetime = Field(
        ..., description="Timestamp when API ingested this data in UTC"
    )
    data_age_hours: float = Field(
        ..., description="Hours elapsed between latest observation and retrieval"
    )
    data_source_status: DataSourceStatus = Field(
        ..., description="Source origin: live, cached, unavailable, or demo"
    )
    completeness: TimeSeriesCompleteness = Field(
        ..., description="Time-series observation count metadata"
    )


class DistrictRiskAssessment(BaseModel):
    """Aggregated risk profile for an administrative district."""

    district: str = Field(..., description="District name")
    station_count: int = Field(..., description="Total reporting stations in district")
    highest_risk: RiskLevelType = Field(
        ..., description="Peak severity tier observed across district stations"
    )
    average_risk_score: float = Field(
        ..., description="Mean station risk score across district"
    )
    maximum_risk_score: float = Field(
        ..., description="Peak station risk score across district"
    )
    high_or_critical_station_count: int = Field(
        ..., description="Number of stations with HIGH or CRITICAL risk"
    )
    max_hourly_rainfall_mm: float = Field(
        ..., description="Peak hourly rainfall across district stations"
    )
    max_6h_rainfall_mm: float = Field(
        ..., description="Peak 6-hour accumulation across district stations"
    )
    max_24h_rainfall_mm: float = Field(
        ..., description="Peak 24-hour accumulation across district stations"
    )
    observation_time: datetime | None = Field(
        default=None, description="Latest observation timestamp in district"
    )
    retrieved_at: datetime = Field(
        ..., description="Timestamp when data was processed in UTC"
    )
    data_age_hours: float | None = Field(
        default=None, description="Age in hours of latest district observation"
    )
    data_source_status: DataSourceStatus = Field(
        ..., description="Source origin: live, cached, unavailable, or demo"
    )
    stations: list[StationRiskAssessment] = Field(
        default_factory=list, description="List of station assessments in district"
    )


class UttarakhandStateRiskAssessment(BaseModel):
    """Complete state-wide risk assessment for Uttarakhand."""

    state: str = Field(default="Uttarakhand", description="State name")
    district_count: int = Field(
        ..., description="Total active districts dynamically discovered"
    )
    station_count: int = Field(
        ..., description="Total reporting stations dynamically discovered"
    )
    observations_used: int = Field(
        ..., description="Total observation records processed in pipeline"
    )
    highest_risk: RiskLevelType = Field(
        ..., description="Peak severity across all Uttarakhand districts"
    )
    average_risk_score: float = Field(
        ..., description="Mean station risk score state-wide"
    )
    maximum_risk_score: float = Field(
        ..., description="Maximum station risk score state-wide"
    )
    high_or_critical_station_count: int = Field(
        ..., description="Total stations state-wide at HIGH or CRITICAL risk"
    )
    observation_time: datetime | None = Field(
        default=None, description="Latest available observation across entire state"
    )
    retrieved_at: datetime = Field(
        ..., description="Timestamp of ingestion / retrieval in UTC"
    )
    data_age_hours: float | None = Field(
        default=None, description="Hours since state's latest available observation"
    )
    data_source_status: DataSourceStatus = Field(
        ..., description="Source status: live, cached, unavailable, or demo"
    )
    disclaimer: str = Field(
        ..., description="Prototype disclaimer regarding non-official thresholds"
    )
    districts: list[DistrictRiskAssessment] = Field(
        default_factory=list, description="Assessments for all districts"
    )


class GeoJSONPointGeometry(BaseModel):
    """GeoJSON Point geometry adhering strictly to [longitude, latitude]."""

    type: Literal["Point"] = "Point"
    coordinates: list[float] = Field(
        ...,
        min_length=2,
        max_length=2,
        description="WGS84 coordinates in strict [longitude, latitude] order",
    )


class GeoJSONFeature(BaseModel):
    """GeoJSON Feature representing a risk-evaluated monitoring station."""

    type: Literal["Feature"] = "Feature"
    geometry: GeoJSONPointGeometry = Field(..., description="Point geometry")
    properties: dict[str, Any] = Field(
        ..., description="Station metadata and risk attributes"
    )


class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection for Flutter map rendering."""

    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[GeoJSONFeature] = Field(default_factory=list)
