"""Asynchronous client for ingesting telemetry from the NWDP/NWIC datastore API."""

import asyncio
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from ai.src.config import settings
from ai.src.schemas import DataSourceStatus, NWDPRecord

logger = logging.getLogger(__name__)


class NWDPClient:
    """Client for retrieving and caching Uttarakhand telemetry from NWDP/NWIC."""

    def __init__(
        self,
        base_url: str = settings.NWDP_BASE_URL,
        resource_id: str = settings.NWDP_RESOURCE_ID,
        timeout: float = settings.NWDP_TIMEOUT_SECONDS,
        page_size: int = settings.NWDP_PAGE_SIZE,
        cache_ttl: int = settings.CACHE_TTL_SECONDS,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.endpoint = f"{self.base_url}/api/3/action/datastore_search"
        self.resource_id = resource_id
        self.timeout = timeout
        self.page_size = page_size
        self.cache_ttl = cache_ttl

        # In-memory cache state
        self._cached_records: list[NWDPRecord] | None = None
        self._cache_timestamp: datetime | None = None
        self._lock = asyncio.Lock()

    def is_cache_valid(self) -> bool:
        """Check if memory cache exists and has not expired."""
        if self._cached_records is None or self._cache_timestamp is None:
            return False
        age = (datetime.now(timezone.utc) - self._cache_timestamp).total_seconds()
        return age < self.cache_ttl

    async def fetch_uttarakhand_records(
        self,
        force_refresh: bool = False,
        page_size: int | None = None,
    ) -> tuple[list[NWDPRecord], DataSourceStatus]:
        """Fetch all available Uttarakhand rainfall telemetry records with pagination.

        Returns:
            Tuple of (records_list, data_source_status).
            data_source_status is 'live' for fresh network data, 'cached' if returned
            from memory or on fallback, or 'unavailable' if completely empty.
        """
        async with self._lock:
            if not force_refresh and self.is_cache_valid():
                logger.info(
                    "Serving %d Uttarakhand records from active cache",
                    len(self._cached_records or []),
                )
                return self._cached_records or [], "cached"

            limit = page_size or self.page_size
            offset = 0
            all_records: list[NWDPRecord] = []
            total: int | None = None

            params_filters = json.dumps(
                {"State": "Uttarakhand", "Agency": "Uttarakhand"}
            )

            try:
                async with httpx.AsyncClient(
                    timeout=httpx.Timeout(self.timeout),
                    verify=True,
                ) as client:
                    while True:
                        query_params: dict[str, Any] = {
                            "resource_id": self.resource_id,
                            "limit": limit,
                            "offset": offset,
                            "filters": params_filters,
                        }

                        logger.debug(
                            "Requesting NWDP batch limit=%d offset=%d", limit, offset
                        )
                        response = await client.get(self.endpoint, params=query_params)
                        response.raise_for_status()

                        payload = response.json()
                        if not payload.get("success", False):
                            error_info = payload.get("error", "Unknown CKAN error")
                            raise RuntimeError(
                                f"NWDP API indicated failure: {error_info}"
                            )

                        result = payload.get("result", {})
                        if total is None:
                            total = int(result.get("total", 0))
                            logger.info(
                                "NWDP reports %d total records for Uttarakhand",
                                total,
                            )

                        raw_records = result.get("records", [])
                        if not raw_records:
                            break

                        for raw in raw_records:
                            rec = NWDPRecord.from_raw(raw)
                            if rec:
                                all_records.append(rec)

                        offset += len(raw_records)
                        if total is not None and offset >= total:
                            break

                logger.info(
                    "NWDP ingestion complete: fetched %d valid records (out of %s raw)",
                    len(all_records),
                    str(total),
                )

                # Update in-memory cache
                self._cached_records = all_records
                self._cache_timestamp = datetime.now(timezone.utc)
                return all_records, "live"

            except Exception as exc:
                logger.error(
                    "NWDP fetch failed: %s. Checking for cached fallback...", exc
                )
                if self._cached_records:
                    logger.warning(
                        "Falling back to stale in-memory cache (%d records)",
                        len(self._cached_records),
                    )
                    return self._cached_records, "cached"

                return [], "unavailable"

    async def fetch_district_records(
        self,
        district: str,
        force_refresh: bool = False,
    ) -> tuple[list[NWDPRecord], DataSourceStatus]:
        """Fetch records for a specific administrative district."""
        records, status = await self.fetch_uttarakhand_records(
            force_refresh=force_refresh
        )
        target = district.strip().lower()
        district_records = [r for r in records if r.district.strip().lower() == target]
        return district_records, status

    @staticmethod
    def get_demo_records() -> list[NWDPRecord]:
        """Generate a deterministic synthetic dataset exercising all risk levels.

        Districts included: Chamoli, Rudraprayag, Uttarkashi, Dehradun, Almora.
        Risk scenarios tested:
            - Joshimath (Chamoli): CRITICAL torrential rain (95 mm latest, 140 mm 6h)
            - Kedarnath (Rudraprayag): HIGH severe rain (40 mm latest, 110 mm 6h)
            - Dharasu (Uttarkashi): MODERATE rain (30 mm latest, 43 mm 6h)
            - Rishikesh (Dehradun): LOW baseline rain (8 mm latest, 24 mm 6h)
            - Almora_1 (Almora): LOW / normal weather (2 mm latest, 6.5 mm 6h)
        """
        now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        demo_stations = [
            {
                "station": "Joshimath",
                "district": "Chamoli",
                "lat": 30.5564,
                "lon": 79.5678,
                "rain_pattern": [20.0, 25.0, 30.0, 35.0, 45.0, 95.0],  # Critical
            },
            {
                "station": "Kedarnath",
                "district": "Rudraprayag",
                "lat": 30.7346,
                "lon": 79.0669,
                "rain_pattern": [
                    10.0,
                    10.0,
                    15.0,
                    15.0,
                    20.0,
                    40.0,
                ],  # High (score ~65)
            },
            {
                "station": "Dharasu",
                "district": "Uttarkashi",
                "lat": 30.6322,
                "lon": 78.3186,
                "rain_pattern": [1.0, 2.0, 2.0, 3.0, 5.0, 30.0],  # Moderate (score ~35)
            },
            {
                "station": "Rishikesh",
                "district": "Dehradun",
                "lat": 30.0869,
                "lon": 78.2676,
                "rain_pattern": [1.0, 2.0, 2.0, 5.0, 6.0, 8.0],  # Low
            },
            {
                "station": "Almora_1",
                "district": "Almora",
                "lat": 29.5957,
                "lon": 79.6506,
                "rain_pattern": [0.0, 0.5, 1.0, 1.0, 2.0, 2.0],  # Low
            },
        ]

        records: list[NWDPRecord] = []
        rec_id = 10001
        for s in demo_stations:
            for idx, rf in enumerate(s["rain_pattern"]):  # type: ignore[union-attr]
                obs_time = now - timedelta(hours=(5 - idx))
                records.append(
                    NWDPRecord(
                        id=rec_id,
                        station=str(s["station"]),
                        district=str(s["district"]),
                        agency="Uttarakhand",
                        state="Uttarakhand",
                        latitude=float(s["lat"]),  # type: ignore[arg-type]
                        longitude=float(s["lon"]),  # type: ignore[arg-type]
                        observed_at=obs_time,
                        rainfall_mm=float(rf),
                    )
                )
                rec_id += 1

        return records


_global_client: NWDPClient | None = None


def get_nwdp_client() -> NWDPClient:
    """Retrieve singleton NWDP client instance."""
    global _global_client
    if _global_client is None:
        _global_client = NWDPClient()
    return _global_client
