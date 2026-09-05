# FlashGuard AI — AI & Government Telemetry Risk Engine

> **In-process risk analysis, National Water Data Portal (NWDP) ingestion, and geospatial risk aggregation for SIH 2026.**  
> Built with **Python 3.11+**, **FastAPI**, **Pydantic v2**, and **HTTPX**.

---

## 📌 Architectural Overview

The AI engine processes continuous environmental observations, calculates station-level hazard metrics, aggregates risk across administrative boundaries, and outputs standards-compliant geospatial layers for frontend rendering.

```text
National Water Data Portal (NWDP / NWIC CKAN Datastore)
                           │
                           ▼
                  [Async NWDP Client]
               (ai/src/clients/nwdp_client.py)
  • CKAN datastore_search API with automatic pagination (limit + offset)
  • In-memory thread-safe cache with TTL (CACHE_TTL_SECONDS, default 300s)
  • Stale cache fallback for upstream outage resilience
                           │
                           ▼
                 [Data Normalization]
                 (ai/src/schemas.py)
  • Multi-format timestamp parsing (ISO 8601, DD-MM-YYYY, DD-Mon-YYYY)
  • Robust coordinate and rainfall float casting
  • Graceful handling of nulls and malformed entries
                           │
                           ▼
            [Rainfall Time-Series Risk Model]
               (ai/src/risk/rainfall.py)
  • Chronological observation sorting per station
  • Latest hourly rainfall rate calculation
  • Rolling 6-hour and 24-hour accumulation windows
  • Time-series telemetry completeness tracking (6h and 24h counts)
  • Explainable 0–100 scoring with transparent textual rationale
                           │
                           ▼
             [Multi-Level Risk Aggregator]
              (ai/src/risk/aggregation.py)
  • District Aggregation: station metrics, maximum risk, averages, peak rain
  • State Aggregation: dynamic station/district counts, worst-case escalation
  • GeoJSON Generator: RFC 7946 Point features strictly in [longitude, latitude]
                           │
                           ▼
          [Unified FastAPI Mount & REST Endpoints]
        (ai/src/api/routes.py & backend/app/main.py)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    Flutter Mobile App          Admin React Dashboard
```

---

## 🏛️ Government Telemetry Integration (NWDP / NWIC)

The risk engine directly ingests telemetry from the **National Water Data Portal (NWDP)** operated by the **National Water Informatics Centre (NWIC)**, Ministry of Jal Shakti, Government of India:

* **Dataset**: `Rainfall Uttarakhand Uttarakhand (2026 - 2030) Telemetry Hourly`
* **Public Resource ID**: `8b406187-0fee-40b9-8cd9-a249e0ce1903`
* **Base URL**: `https://nwdp.nwic.gov.in`
* **Datastore Endpoint**: `/api/3/action/datastore_search`
* **Query Filters**: `{"State": "Uttarakhand", "Agency": "Uttarakhand"}`
* **Pagination**: Queries batches using `limit` (default: 100) and increments `offset` until all available records are ingested or total reported by CKAN is reached.
* **Dynamic Scope**: Administrative districts and monitoring stations are dynamically discovered from ingested records; counts are never hardcoded.

### Caching and Upstream Fault Tolerance
1. **Thread-Safe In-Memory Cache**: Cached records are protected by an `asyncio.Lock()` and validated against a configurable TTL (`CACHE_TTL_SECONDS`, default 300 seconds).
2. **Stale Cache Fallback**: If the upstream NWDP API fails (e.g. network timeout or server error) while an expired cache exists, the client returns the stale cache with `data_source_status = "cached"` to preserve uninterrupted downstream operations.
3. **Data Provenance**: Every response includes provenance indicators:
   - `data_source_status`: `"live"`, `"cached"`, `"unavailable"`, or `"demo"`
   - `observation_time`: Timestamp of the latest sensor reading
   - `retrieved_at`: Timestamp when the pipeline ingested/evaluated the data
   - `data_age_hours`: Elapsed time between observation and pipeline evaluation

---

## ⚠️ Prototype Risk Thresholds & Disclaimer

> [!WARNING]
> **Prototype / Demonstration Disclaimer**: The risk scoring formulas, accumulation windows, and categorical classifications (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) implemented here are **prototype demonstration thresholds**. They are designed for engineering evaluation, simulation, and demonstration purposes. They are **NOT official IMD (India Meteorological Department) or CWC (Central Water Commission) disaster declarations**. Official public alerts must be issued through authorized disaster management authorities such as USDMA.

### 1. Station Rainfall Scoring Logic (`ai/src/risk/rainfall.py`)

Station risk scores (0–100) are evaluated using a cumulative, explainable multi-window rubric:

| Dimension | Window | Threshold | Score Contribution | Reason Output |
| :--- | :--- | :--- | :--- | :--- |
| **Hourly Rate** | 1 Hour | $\ge 80.0\text{ mm}$ | +90.0 | Critical torrential hourly rain |
| | 1 Hour | $\ge 50.0\text{ mm}$ | +65.0 | High hourly rain |
| | 1 Hour | $\ge 25.0\text{ mm}$ | +35.0 | Moderate hourly rain |
| **Accumulation** | 6 Hours | $\ge 100.0\text{ mm}$ | +30.0 | Severe 6-hour accumulation |
| | 6 Hours | $\ge 50.0\text{ mm}$ | +15.0 | Elevated 6-hour accumulation |
| **Accumulation** | 24 Hours | $\ge 150.0\text{ mm}$ | +25.0 | Severe 24-hour accumulation |
| | 24 Hours | $\ge 75.0\text{ mm}$ | +10.0 | Elevated 24-hour accumulation |

* **Normalization**: The sum of points is clamped to `[0.0, 100.0]`.
* **Classification**:
  - `0.0` to `30.0`: **`LOW`**
  - `30.1` to `50.0`: **`MODERATE`**
  - `50.1` to `75.0`: **`HIGH`**
  - `75.1` to `100.0`: **`CRITICAL`**
* **Completeness Flagging**: Telemetry sparsity is flagged if $< 3$ readings exist for the 6-hour window or $< 10$ readings for the 24-hour window.

### 2. Weighted Demo Engine (`ai/src/risk_engine.py`)

For deterministic director presentations and single-point evaluations:
* **Formula**: $\text{Score} = \text{round}(\text{rainfall} \times 0.40) + \text{round}(\text{water\_level} \times 0.35) + \text{round}(\text{historical\_risk} \times 0.25)$
* **Tiers**: $0\text{--}30$: `LOW`, $31\text{--}50$: `MEDIUM`, $51\text{--}75$: `HIGH`, $76\text{--}100$: `CRITICAL`.
* **Alert Trigger**: `alert = true` whenever risk level is `HIGH` or `CRITICAL`.

---

## 🤖 Implementation Status: Heuristic vs. Machine Learning

* **IMPLEMENTED (Active)**:
  - Rule-based explainable risk scoring with multi-window precipitation accumulation.
  - Weighted composite disaster risk evaluation.
  - Multi-level spatial aggregation (Station $\to$ District $\to$ State).
  - RFC 7946 compliant GeoJSON Point feature generator.
  - Automated CKAN datastore ingestion client with TTL caching and stale fallback.
* **PLANNED / FUTURE SCOPE (Not implemented in current prototype)**:
  - Machine learning time-series rainfall forecasting (e.g. LSTM / Prophet / XGBoost).
  - Satellite remote sensing integration (e.g. Sentinel-1 / INSAT-3D precipitation estimates).
  - Automated hydrological runoff modeling.
  - Landslide susceptibility prediction using digital elevation models (DEM) and soil moisture.

---

## ⚙️ Configuration Reference (`ai/src/config.py`)

All settings load from environment variables with safe fallbacks:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `NWDP_BASE_URL` | `https://nwdp.nwic.gov.in` | NWDP portal root URL |
| `NWDP_RESOURCE_ID` | `8b406187-0fee-40b9-8cd9-a249e0ce1903` | Dataset identifier |
| `NWDP_PAGE_SIZE` | `100` | Ingestion batch pagination limit |
| `NWDP_TIMEOUT_SECONDS` | `30.0` | Upstream HTTP request timeout |
| `CACHE_TTL_SECONDS` | `300` | In-memory cache lifetime (5 minutes) |
| `RAINFALL_MODERATE_MM` | `25.0` | Hourly moderate threshold |
| `RAINFALL_HIGH_MM` | `50.0` | Hourly high threshold |
| `RAINFALL_CRITICAL_MM` | `80.0` | Hourly critical threshold |
| `RAINFALL_6H_ELEVATED_MM` | `50.0` | 6-hour elevated accumulation |
| `RAINFALL_6H_SEVERE_MM` | `100.0` | 6-hour severe accumulation |
| `RAINFALL_24H_ELEVATED_MM` | `75.0` | 24-hour elevated accumulation |
| `RAINFALL_24H_SEVERE_MM` | `150.0` | 24-hour severe accumulation |

---

## 📡 Exposed API Endpoints

When mounted under the FastAPI backend (`/api/v1`), the AI module exposes:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/rainfall/uttarakhand` | Summary of ingested NWDP records, reporting districts, and station counts. |
| `GET` | `/api/v1/risk/uttarakhand` | State-wide composite risk profile with full district/station breakdown. Supports `?force_refresh=true`. |
| `GET` | `/api/v1/risk/district/{district}` | Risk profile for a specific district (e.g. `Chamoli`, `Dehradun`). |
| `GET` | `/api/v1/risk/station/{station}` | Detailed station assessment with explainable rationale and rolling windows. |
| `GET` | `/api/v1/risk/uttarakhand/geojson` | RFC 7946 GeoJSON `FeatureCollection` with coordinates in `[lon, lat]`. |
| `GET` | `/api/v1/demo/risk/uttarakhand` | Deterministic demo fallback dataset exercising all 4 risk tiers (`LOW` to `CRITICAL`). |
| `GET` | `/api/v1/health` | Health check endpoint for the telemetry router. |

---

## 🧪 Testing

The AI pipeline is covered by comprehensive unit and integration tests under `ai/tests/`:

```bash
# Run AI-specific tests
pytest ai/tests/

# Run full project test suite
pytest
```

Tests cover:
* `test_nwdp_client.py`: CKAN response parsing, pagination, caching TTL, and stale fallback behavior.
* `test_rainfall.py`: Hourly rate, 6h/24h accumulation calculations, completeness checks, and reason generation.
* `test_aggregation.py`: District and state severity escalation, dynamic counting rules, and GeoJSON geometry compliance.
* `test_api.py`: FastAPI route handlers, query parameter overrides, and error handling.
* `test_risk_engine.py`: Weighted composite mathematical model and range validation.
