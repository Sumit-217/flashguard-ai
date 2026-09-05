# AI & Government Risk Assessment Pipeline

This directory contains the production risk engines, government telemetry ingestion clients, and geospatial risk aggregators for **FlashGuard AI (SIH 2026)**.

---

## 📌 Architecture Overview

```text
National Water Data Portal (NWDP / NWIC)
               │
               ▼
      [Async NWDP Client] (ai/src/clients/nwdp_client.py)
        - CKAN datastore_search API with pagination (limit + offset)
        - In-memory thread-safe cache with TTL (CACHE_TTL_SECONDS)
        - Stale cache retention for upstream fault tolerance
               │
               ▼
     [Data Normalization] (ai/src/schemas.py)
        - Resilient parsing of multi-format timestamps (e.g. DD-MM-YYYY, DD-Mon-YYYY)
        - Safe coordinate and rainfall float casting
        - Malformed record drop without pipeline interruption
               │
               ▼
    [Rainfall Time-Series & Station Risk] (ai/src/risk/rainfall.py)
        - Chronological observation ordering
        - Latest available hourly rainfall
        - Rolling 6-hour and 24-hour accumulation windows
        - Time-series completeness metadata (observations_6h, observations_24h)
        - Explainable scoring (0–100) and severity classification
               │
               ▼
     [Multi-Level Aggregator] (ai/src/risk/aggregation.py)
        - District-Level: Station statistics, maximum risk, averages, peak rainfall
        - State-Level: Dynamic counts, risk escalation (never averages away CRITICAL)
        - GeoJSON Generator: RFC 7946 Point features in strict [longitude, latitude] order
               │
               ▼
       [FastAPI Service] (ai/src/api/routes.py & backend/app/main.py)
               │
               ▼
   Flutter Mobile Client & React Admin Dashboard
```

---

## 🏛️ Government Data Source

* **Provider**: National Water Data Portal (NWDP) / National Water Informatics Centre (NWIC), Ministry of Jal Shakti.
* **Dataset**: *Rainfall Uttarakhand Uttarakhand (2026 - 2030) Telemetry Hourly*
* **Resource ID**: `8b406187-0fee-40b9-8cd9-a249e0ce1903`
* **Base URL**: `https://nwdp.nwic.gov.in`
* **Datastore Endpoint**: `/api/3/action/datastore_search`
* **Standard Filters**: `State = Uttarakhand`, `Agency = Uttarakhand`
* **Dynamic Scope**: Ingests observations across all reporting Uttarakhand districts (Almora, Bageshwar, Chamoli, Champawat, Dehradun, Haridwar, Nainital, PAURI GARHWAL, Pithoragarh, Rudraprayag, Tehri Garhwal, UDHAM SINGH NAGAR, Uttarkashi) and telemetry stations.

---

## ⚠️ Important Prototype Disclaimer

> **DISCLAIMER**: The rainfall scoring and risk tiers (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) implemented in this engine are **prototype/demonstration thresholds** designed for algorithmic evaluation and frontend simulation. They are **NOT official IMD (India Meteorological Department) or CWC (Central Water Commission) disaster declarations**. Official disaster warnings must be verified through designated state disaster management authorities (USDMA).

---

## ⚙️ Environment Variables & Configuration

All pipeline parameters are fully configurable via environment variables in `ai/src/config.py`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NWDP_BASE_URL` | `https://nwdp.nwic.gov.in` | Base NWDP portal URL |
| `NWDP_RESOURCE_ID` | `8b406187-0fee-40b9-8cd9-a249e0ce1903` | CKAN dataset resource ID |
| `NWDP_PAGE_SIZE` | `100` | Pagination page size (records per request) |
| `NWDP_TIMEOUT_SECONDS` | `30.0` | Upstream HTTP request timeout |
| `CACHE_TTL_SECONDS` | `300` | In-memory cache lifetime (5 minutes) |
| `RAINFALL_MODERATE_MM` | `25.0` | Hourly threshold for moderate risk contribution |
| `RAINFALL_HIGH_MM` | `50.0` | Hourly threshold for high risk contribution |
| `RAINFALL_CRITICAL_MM` | `80.0` | Hourly threshold for critical torrential risk |
| `RAINFALL_6H_ELEVATED_MM` | `50.0` | 6-hour accumulation elevated threshold |
| `RAINFALL_6H_SEVERE_MM` | `100.0` | 6-hour accumulation severe threshold |
| `RAINFALL_24H_ELEVATED_MM`| `75.0` | 24-hour accumulation elevated threshold |
| `RAINFALL_24H_SEVERE_MM` | `150.0` | 24-hour accumulation severe threshold |

---

## 📡 API Endpoints

### 1. Unified Risk Assessment (Primary Flutter Endpoint)
* **`GET /api/v1/risk/uttarakhand`**
  * Evaluates complete state telemetry across all dynamically discovered districts and stations.
  * Supports `?force_refresh=true` to bypass cache.
  * Includes `data_source_status` (`"live"`, `"cached"`, `"unavailable"`, or `"demo"`), `observation_time`, `retrieved_at`, and `data_age_hours`.

### 2. District Risk Profile
* **`GET /api/v1/risk/district/{district}`**
  * Case-insensitive lookup (e.g. `Dehradun`, `chamoli`).
  * Returns district-level metrics, peak severity, averages, and all child stations.

### 3. Station Risk Profile
* **`GET /api/v1/risk/station/{station}`**
  * Returns detailed station risk breakdown, rolling windows, and explanatory reason strings.

### 4. GeoJSON Map Layers (Flutter Map)
* **`GET /api/v1/risk/uttarakhand/geojson`**
  * Returns RFC 7946 `FeatureCollection` with `Point` geometry strictly in **`[longitude, latitude]`** order.

### 5. Ingested Telemetry Summary
* **`GET /api/v1/rainfall/uttarakhand`**
  * Ingestion metadata: record count, dynamic district list, station count, and sample records.

### 6. Deterministic Demo Fallback
* **`GET /api/v1/demo/risk/uttarakhand`**
  * Synthetic dataset exercising `LOW`, `MODERATE`, `HIGH`, and `CRITICAL` risk tiers.
  * Uses the **exact same risk engine and aggregation pipeline** as live data.
  * Marked with `"data_source_status": "demo"`.

### 7. Monday Director Demo Contract (Preserved)
* **`POST /api/v1/demo/risk-assessment`**
  * Weighted risk assessment contract returning 84 / CRITICAL for the Joshimath scenario.

---

## 🚀 Running & Testing

### Running the Unified Backend
From the repository root:
```bash
uvicorn backend.app.main:app --reload --port 8000
```

### Running Test Suite
```bash
pytest
```

### Running Lint & Formatting Checks
```bash
ruff check .
ruff format --check backend ai
```
