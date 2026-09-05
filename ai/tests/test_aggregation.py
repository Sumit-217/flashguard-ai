"""Unit tests for district/state risk aggregations and GeoJSON generation."""

from datetime import datetime, timezone

from ai.src.clients.nwdp_client import NWDPClient
from ai.src.risk.aggregation import aggregate_state_risk, generate_geojson_features
from ai.src.schemas import NWDPRecord


def test_dynamic_counts_and_no_hardcoding() -> None:
    """Verify district and station counts are calculated dynamically."""
    now = datetime(2026, 8, 15, 12, 0, tzinfo=timezone.utc)
    records = [
        NWDPRecord(
            station="Station_A",
            district="District_1",
            observed_at=now,
            rainfall_mm=10.0,
            latitude=30.1,
            longitude=78.1,
        ),
        NWDPRecord(
            station="Station_B",
            district="District_1",
            observed_at=now,
            rainfall_mm=20.0,
            latitude=30.2,
            longitude=78.2,
        ),
        NWDPRecord(
            station="Station_C",
            district="District_2",
            observed_at=now,
            rainfall_mm=95.0,  # Critical
            latitude=30.3,
            longitude=78.3,
        ),
    ]

    state_eval = aggregate_state_risk(records)
    # Counts must be dynamically calculated (2 districts, 3 stations)
    assert state_eval.district_count == 2
    assert state_eval.station_count == 3
    assert state_eval.observations_used == 3
    assert state_eval.highest_risk == "CRITICAL"  # Escalated to peak severity
    assert state_eval.high_or_critical_station_count == 1


def test_demo_records_exercise_all_risk_tiers() -> None:
    """Validate that deterministic demo records exercise all four risk tiers."""
    demo_records = NWDPClient.get_demo_records()
    state_eval = aggregate_state_risk(demo_records, data_source_status="demo")

    assert state_eval.data_source_status == "demo"
    assert state_eval.district_count >= 4
    assert state_eval.station_count >= 5

    observed_levels = {
        stn.risk_level for dist in state_eval.districts for stn in dist.stations
    }
    # Must exercise all four tiers
    assert "LOW" in observed_levels
    assert "MODERATE" in observed_levels
    assert "HIGH" in observed_levels
    assert "CRITICAL" in observed_levels


def test_geojson_features_strictly_longitude_latitude() -> None:
    """Ensure GeoJSON features have coordinates in [longitude, latitude] order."""
    demo_records = NWDPClient.get_demo_records()
    state_eval = aggregate_state_risk(demo_records, data_source_status="demo")
    geojson = generate_geojson_features(state_eval)

    assert geojson.type == "FeatureCollection"
    assert len(geojson.features) == state_eval.station_count

    for feature in geojson.features:
        assert feature.geometry.type == "Point"
        lon, lat = feature.geometry.coordinates
        # In Uttarakhand: Latitude is ~28.5 to 31.5, Longitude is ~77.5 to 81.0
        assert 77.0 <= lon <= 82.0, f"Expected longitude first, got {lon}"
        assert 28.0 <= lat <= 32.0, f"Expected latitude second, got {lat}"
        assert "risk_level" in feature.properties
        assert "station" in feature.properties
