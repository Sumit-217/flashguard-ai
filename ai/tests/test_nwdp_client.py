"""Unit tests for NWDP client, record normalization, and caching."""

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from ai.src.clients.nwdp_client import NWDPClient
from ai.src.schemas import NWDPRecord, parse_acquisition_time, parse_float_safe


def test_parse_acquisition_time_formats() -> None:
    """Ensure various date formats from NWDP datastore parse cleanly."""
    t1 = parse_acquisition_time("17-02-2026 23:00")
    assert t1 == datetime(2026, 2, 17, 23, 0, tzinfo=timezone.utc)

    t2 = parse_acquisition_time("15-Jul-2026 20:00")
    assert t2 == datetime(2026, 7, 15, 20, 0, tzinfo=timezone.utc)

    t3 = parse_acquisition_time("2026-08-01 12:30:00")
    assert t3 == datetime(2026, 8, 1, 12, 30, tzinfo=timezone.utc)

    assert parse_acquisition_time("-") is None
    assert parse_acquisition_time("") is None
    assert parse_acquisition_time(None) is None


def test_parse_float_safe() -> None:
    """Validate safe float casting with negative and malformed values."""
    assert parse_float_safe("231") == 231.0
    assert parse_float_safe("4.5") == 4.5
    assert parse_float_safe("0") == 0.0
    assert parse_float_safe("-") is None
    assert parse_float_safe("invalid") is None
    assert parse_float_safe(None) is None


def test_nwdp_record_from_raw() -> None:
    """Verify raw CKAN dictionary parses into typed NWDPRecord."""
    raw = {
        "_id": 1,
        "Station": "Joshimath",
        "District": "Chamoli",
        "Agency": "Uttarakhand",
        "State": "Uttarakhand",
        "Latitude": "30.5564",
        "Longitude": "79.5678",
        "Data Acquisition Time": "17-02-2026 23:00",
        "Telemetry Hourly Rainfall (mm)": "45.5",
    }
    rec = NWDPRecord.from_raw(raw)
    assert rec is not None
    assert rec.station == "Joshimath"
    assert rec.district == "Chamoli"
    assert rec.latitude == 30.5564
    assert rec.longitude == 79.5678
    assert rec.rainfall_mm == 45.5


def test_nwdp_record_invalid_omits_silently() -> None:
    """Corrupted records should return None without crashing."""
    assert NWDPRecord.from_raw({"Station": "-", "District": "-"}) is None
    assert NWDPRecord.from_raw({}) is None


def test_client_pagination_and_cache() -> None:
    """Test pagination loop with mocked HTTP responses and memory cache."""
    page_1 = {
        "success": True,
        "result": {
            "total": 2,
            "records": [
                {
                    "_id": 1,
                    "Station": "Joshimath",
                    "District": "Chamoli",
                    "Data Acquisition Time": "17-02-2026 21:00",
                    "Telemetry Hourly Rainfall (mm)": "10.0",
                }
            ],
        },
    }
    page_2 = {
        "success": True,
        "result": {
            "total": 2,
            "records": [
                {
                    "_id": 2,
                    "Station": "Joshimath",
                    "District": "Chamoli",
                    "Data Acquisition Time": "17-02-2026 22:00",
                    "Telemetry Hourly Rainfall (mm)": "20.0",
                }
            ],
        },
    }

    client = NWDPClient(page_size=1, cache_ttl=60)

    # Mock get requests
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        resp_1 = MagicMock()
        resp_1.json.return_value = page_1
        resp_1.raise_for_status.return_value = None

        resp_2 = MagicMock()
        resp_2.json.return_value = page_2
        resp_2.raise_for_status.return_value = None

        mock_get.side_effect = [resp_1, resp_2]

        records, status = asyncio.run(client.fetch_uttarakhand_records())
        assert status == "live"
        assert len(records) == 2
        assert mock_get.call_count == 2

        # Second call should hit in-memory cache without extra HTTP requests
        cached_records, cached_status = asyncio.run(client.fetch_uttarakhand_records())
        assert cached_status == "cached"
        assert len(cached_records) == 2
        assert mock_get.call_count == 2


def test_client_fallback_on_http_error() -> None:
    """Verify fallback to stale cache when upstream HTTP fails."""
    client = NWDPClient(cache_ttl=1)
    client._cached_records = [
        NWDPRecord(
            id=1,
            station="Dharasu",
            district="Uttarkashi",
            observed_at=datetime.now(timezone.utc),
            rainfall_mm=5.0,
        )
    ]
    client._cache_timestamp = datetime(2020, 1, 1, tzinfo=timezone.utc)  # expired cache

    with patch("httpx.AsyncClient.get", side_effect=Exception("Network error")):
        records, status = asyncio.run(
            client.fetch_uttarakhand_records(force_refresh=True)
        )
        assert status == "cached"
        assert len(records) == 1
        assert records[0].station == "Dharasu"
