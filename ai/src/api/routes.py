"""API routes for Uttarakhand government telemetry and risk assessments."""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status

from ai.src.clients.nwdp_client import NWDPClient, get_nwdp_client
from ai.src.risk.aggregation import aggregate_state_risk, generate_geojson_features
from ai.src.schemas import (
    DistrictRiskAssessment,
    GeoJSONFeatureCollection,
    StationRiskAssessment,
    UttarakhandStateRiskAssessment,
)

router = APIRouter(tags=["Government Telemetry & Risk"])


@router.get(
    "/health",
    summary="Health check",
    tags=["Health"],
)
def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


@router.get(
    "/rainfall/uttarakhand",
    summary="Ingested Uttarakhand Telemetry Records",
    response_model=dict[str, Any],
)
async def get_uttarakhand_rainfall(
    force_refresh: bool = Query(
        default=False, description="Bypass cache and force fresh NWDP ingestion"
    ),
) -> dict[str, Any]:
    """Retrieve summarized telemetry records ingested from NWDP."""
    client = get_nwdp_client()
    records, data_status = await client.fetch_uttarakhand_records(
        force_refresh=force_refresh
    )

    unique_districts = sorted({r.district.strip() for r in records})
    unique_stations = sorted({r.station.strip() for r in records})

    return {
        "state": "Uttarakhand",
        "data_source_status": data_status,
        "total_records": len(records),
        "district_count": len(unique_districts),
        "station_count": len(unique_stations),
        "districts": unique_districts,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "sample_records": [r.model_dump(mode="json") for r in records[:20]],
    }


@router.get(
    "/risk/uttarakhand",
    summary="State-wide Uttarakhand Disaster Risk Assessment",
    response_model=UttarakhandStateRiskAssessment,
)
async def get_uttarakhand_risk(
    force_refresh: bool = Query(
        default=False, description="Bypass cache and force fresh NWDP ingestion"
    ),
) -> UttarakhandStateRiskAssessment:
    """Primary Flutter endpoint: complete Uttarakhand risk profile."""
    client = get_nwdp_client()
    records, data_status = await client.fetch_uttarakhand_records(
        force_refresh=force_refresh
    )
    return aggregate_state_risk(records=records, data_source_status=data_status)


@router.get(
    "/risk/district/{district}",
    summary="District Risk Assessment",
    response_model=DistrictRiskAssessment,
)
async def get_district_risk(
    district: str,
    force_refresh: bool = Query(
        default=False, description="Bypass cache and force fresh NWDP ingestion"
    ),
) -> DistrictRiskAssessment:
    """Evaluate risk for a single administrative district."""
    client = get_nwdp_client()
    records, data_status = await client.fetch_uttarakhand_records(
        force_refresh=force_refresh
    )
    state_eval = aggregate_state_risk(records=records, data_source_status=data_status)

    target = district.strip().lower()
    for d in state_eval.districts:
        if d.district.strip().lower() == target:
            return d

    known_districts = [d.district for d in state_eval.districts]
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=(
            f"District '{district}' not found. Available districts: {known_districts}"
        ),
    )


@router.get(
    "/risk/station/{station}",
    summary="Station Risk Assessment",
    response_model=StationRiskAssessment,
)
async def get_station_risk(
    station: str,
    force_refresh: bool = Query(
        default=False, description="Bypass cache and force fresh NWDP ingestion"
    ),
) -> StationRiskAssessment:
    """Evaluate risk for a specific telemetry monitoring station."""
    client = get_nwdp_client()
    records, data_status = await client.fetch_uttarakhand_records(
        force_refresh=force_refresh
    )
    state_eval = aggregate_state_risk(records=records, data_source_status=data_status)

    target = station.strip().lower()
    for dist in state_eval.districts:
        for stn in dist.stations:
            if stn.station.strip().lower() == target:
                return stn

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Station '{station}' not found in active telemetry dataset.",
    )


@router.get(
    "/risk/uttarakhand/geojson",
    summary="GeoJSON Risk Map Layers",
    response_model=GeoJSONFeatureCollection,
)
async def get_uttarakhand_risk_geojson(
    force_refresh: bool = Query(
        default=False, description="Bypass cache and force fresh NWDP ingestion"
    ),
) -> GeoJSONFeatureCollection:
    """Retrieve Point features formatted strictly as [longitude, latitude]."""
    client = get_nwdp_client()
    records, data_status = await client.fetch_uttarakhand_records(
        force_refresh=force_refresh
    )
    state_eval = aggregate_state_risk(records=records, data_source_status=data_status)
    return generate_geojson_features(state_eval)


@router.get(
    "/demo/risk/uttarakhand",
    summary="Deterministic Demo/Fallback Risk Assessment",
    response_model=UttarakhandStateRiskAssessment,
)
def get_demo_risk_uttarakhand() -> UttarakhandStateRiskAssessment:
    """Deterministic fallback exercising LOW, MODERATE, HIGH, and CRITICAL tiers.

    Uses the exact same risk calculation and aggregation algorithms as live pipeline.
    """
    demo_records = NWDPClient.get_demo_records()
    return aggregate_state_risk(records=demo_records, data_source_status="demo")
