# 🚨 FlashGuard AI

> **AI-Powered Disaster Management, Early Warning, Risk Assessment, and Resilient Communication System for Smart India Hackathon (SIH) 2026.**  
> **Regional Focus**: **Uttarakhand, India** (Himalayan disaster-prone corridor).

---

## 📌 Project Overview & SIH 2026 Context

**FlashGuard AI** is a location-aware, communication-resilient emergency platform engineered for the **Smart India Hackathon (SIH) 2026**. It focuses on the high-risk Himalayan disaster corridor across Uttarakhand, where cloudbursts, torrential precipitation, flash floods, and landslides present severe threats to mountainous communities, pilgrimage corridors, and critical infrastructure.

The platform bridges real-time government telemetry, in-process explainable risk modeling, multi-window precipitation accumulation analysis, and geospatial visualization to provide field emergency responders, district coordinators, and citizens with rapid, actionable disaster intelligence.

---

## 🏔️ Problem Statement & Proposed Solution

### The Challenge
The Himalayan disaster corridor in Uttarakhand experiences rapid, localized weather anomalies (e.g., Kedarnath 2013, Chamoli 2021). Conventional disaster response workflows suffer from:
1. **Siloed Telemetry**: Government sensor data is often dispersed across administrative portals without automated ingestion into early warning pipelines.
2. **Delayed Risk Interpretation**: Raw millimeter rainfall measurements lack contextualized, multi-window accumulation scoring (hourly, 6h, 24h) and explainable threat classifications.
3. **Communication Vulnerability**: Mountainous terrain suffers frequent cellular network degradation and outages during severe storms, leaving affected communities isolated.

### The FlashGuard AI Solution
* **Automated Government Telemetry**: Direct ingestion of hourly rainfall telemetry from the National Water Data Portal (NWDP / NWIC, Ministry of Jal Shakti).
* **Explainable Multi-Tiered Risk Engine**: In-process risk calculations classifying hazards into `LOW`, `MODERATE`, `HIGH`, and `CRITICAL` with human-readable rationale.
* **Geospatial Map Layers**: Dynamic RFC 7946 GeoJSON generation with coordinates formatted in strict `[longitude, latitude]` Point geometry for mobile and web map overlays.
* **Multi-Layer Resilience**: In-memory caching with TTL, stale-cache retention for upstream outages, and deterministic presentation demo modes.

---

## 🚀 Current Prototype Status

To maintain engineering transparency, project capabilities are strictly categorized by current implementation status:

### ✅ IMPLEMENTED (Current Prototype)
* **Government Ingestion Pipeline**: Asynchronous client ingesting the NWDP CKAN datastore for hourly Uttarakhand telemetry with multi-format date parsing and pagination.
* **Fault-Tolerant Caching**: In-memory thread-safe cache (`CACHE_TTL_SECONDS`) with stale-cache fallback during upstream network failures.
* **Explainable Station Risk Model**: Real-time evaluation of hourly rate, 6-hour accumulation, and 24-hour accumulation with completeness metrics and reason logging.
* **Hierarchical Aggregation**: Dynamic aggregation from Station $\to$ District $\to$ State, using worst-case severity escalation and dynamic station/district counts.
* **GeoJSON Service**: Dynamic generation of RFC 7946 `FeatureCollection` layers for interactive mapping.
* **Unified FastAPI Gateway**: Consolidated backend at `backend.app.main:app` with CORS origin control, health endpoints, and automatic Swagger documentation.
* **Director Demo Contracts**: Preserved weighted risk scoring endpoint (`POST /api/v1/demo/risk-assessment`) and deterministic multi-tier state fallback (`GET /api/v1/demo/risk/uttarakhand`).
* **Test Suite**: 50 automated unit and integration tests passing across AI and backend modules.

### ⏳ PLANNED / FUTURE SCOPE (Target Production Architecture)
* **Machine Learning Forecasting**: Time-series predictive rainfall forecasting models (LSTM / XGBoost).
* **Spatial Database (PostGIS)**: Persistent storage of historical hazard polygons, evacuation routes, and safe shelter points.
* **Hazard-Avoidance Routing**: OSRM-based evacuation path calculation actively penalizing paths through `HIGH` and `CRITICAL` hazard zones.
* **Edge IoT Telemetry**: Physical ESP32 hardware and MQTT broker consumer daemon ingesting real-time river water levels into PostGIS.
* **Multi-Channel Alert Broadcasts**: Automated Firebase Cloud Messaging (FCM) push alerts, SMS gateway integration for keypad phones, and peer-to-peer (P2P) Wi-Fi Direct mesh propagation.
* **Enterprise Security**: JWT authentication, API keys, and rate limiting.

---

## 🏗️ System Architecture

```text
       ┌────────────────────────────────────────────────────────┐
       │   National Water Data Portal (NWDP / NWIC Datastore)   │
       │   Ministry of Jal Shakti, Government of India           │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTPS (JSON / CKAN)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Unified Backend                         │
│                    (Entrypoint: backend.app.main:app)                  │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 AI Telemetry & Risk Module                     │   │
│   │                                                                │   │
│   │  [NWDP Client]  ──►  [Schema Normalization]  ──► [TTL Cache]   │   │
│   │         │                                             │        │   │
│   │         ▼                                             ▼        │   │
│   │  [Rainfall Engine] (Hourly + 6h + 24h Windows + Rationale)     │   │
│   │         │                                                      │   │
│   │         ▼                                                      │   │
│   │  [Spatial Aggregation] (Station ──► District ──► State)       │   │
│   │         │                                                      │   │
│   │         ▼                                                      │   │
│   │  [GeoJSON RFC 7946 Generator] (Point [lon, lat])               │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│   ┌──────────────────────────────┐   ┌─────────────────────────────┐   │
│   │     Director Demo Router     │   │     CORS & Security Core    │   │
│   │  (Weighted Risk Evaluation)  │   │   (Allowed Origins Filter)  │   │
│   └──────────────────────────────┘   └─────────────────────────────┘   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │ REST / GeoJSON                    │ REST / GeoJSON
                 ▼                                   ▼
    ┌─────────────────────────┐         ┌─────────────────────────┐
    │   Flutter Mobile App    │         │  React Admin Dashboard  │
    │  (Citizen / Field Team) │         │ (District Coordinators) │
    └─────────────────────────┘         └─────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Implemented / Active | Planned / Target |
| :--- | :--- | :--- |
| **Backend Service** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn, HTTPX | PostgreSQL, PostGIS, SQLAlchemy |
| **AI / Risk Pipeline** | In-process Python heuristic risk model, time-series windows | LSTM / XGBoost forecasting, GeoPandas, Shapely |
| **Government Data** | NWDP / NWIC CKAN Datastore API (Telemetry Hourly) | CWC River Gauges, IMD Radar API |
| **Mobile Client** | Flutter (Dart) scaffolding, Dio client contracts | Drift (SQLite) offline cache, Riverpod, FCM |
| **Admin Dashboard** | React, Vite, TypeScript, Leaflet scaffolding | Live telemetry websockets, incident dispatch |
| **Deployment** | Render (`render.yaml`), Docker definitions | Distributed cloud cluster |

---

## 📂 Repository Structure

```text
flashguard-ai/
├── ai/                         # AI & Government Risk Engine
│   ├── src/                    # Core clients, risk processors, aggregators, schemas
│   │   ├── api/routes.py       # Government telemetry & risk REST endpoints
│   │   ├── clients/            # Async NWDP CKAN client & demo records generator
│   │   ├── risk/               # Station rainfall processor & multi-level aggregator
│   │   ├── config.py           # Pipeline configuration & threshold settings
│   │   ├── risk_engine.py      # Independent weighted calculation engine for demo
│   │   └── schemas.py          # Pydantic v2 schemas for telemetry, risk, and GeoJSON
│   └── tests/                  # 45 AI unit & integration tests
├── android/                    # Flutter mobile application client
├── backend/                    # Unified FastAPI backend application
│   ├── app/
│   │   ├── api/v1/demo.py      # Director Demo REST router (Joshimath evaluation)
│   │   ├── schemas/risk.py     # Request/response schemas for demo contract
│   │   ├── services/           # Risk service delegating to ai/src/risk_engine.py
│   │   └── main.py             # Main entrypoint, CORS configuration & router mount
│   └── tests/                  # 5 backend API integration tests
├── dashboard/                  # React + Vite admin monitoring dashboard
├── docker/                     # Container configurations and Dockerfile references
├── docs/                       # Specifications, architectural flows, and demo contracts
│   ├── api/                    # API specifications
│   ├── architecture/           # System interfaces, communication & data flows
│   ├── database/               # Database schemas
│   ├── decisions/              # Architectural Decision Records (ADRs)
│   ├── demo/                   # Monday Director Demo contract specifications
│   └── setup/                  # Developer environment, coding standards, git workflow
├── iot/                        # ESP32 firmware, MQTT broker config & sensor simulator
├── maps/                       # Geospatial data extracts and routing scripts
├── scripts/                    # Developer setup and automation scripts
├── pyproject.toml              # Ruff and Pytest project configuration
├── render.yaml                 # Render infrastructure-as-code specification
└── requirements.txt            # Python dependencies for local setup & Render build
```

---

## 📡 Active API Endpoints

All endpoints are mounted and verified on the running FastAPI application:

| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Primary service health status check (Render monitor). | Active |
| `GET` | `/api/v1/health` | Sub-router health check endpoint. | Active |
| `POST` | `/api/v1/demo/risk-assessment` | Director Demo: weighted multi-parameter disaster risk for Joshimath. | Active |
| `GET` | `/api/v1/rainfall/uttarakhand` | Summary of ingested NWDP telemetry, reporting districts, and station counts. | Active |
| `GET` | `/api/v1/risk/uttarakhand` | State-wide composite risk profile with full district/station breakdown. | Active |
| `GET` | `/api/v1/risk/district/{district}` | Administrative district risk profile (e.g. `Chamoli`, `Dehradun`). | Active |
| `GET` | `/api/v1/risk/station/{station}` | Station evaluation with rolling 6h/24h accumulation and explainable rationale. | Active |
| `GET` | `/api/v1/risk/uttarakhand/geojson` | RFC 7946 GeoJSON FeatureCollection formatted as `[lon, lat]` Point features. | Active |
| `GET` | `/api/v1/demo/risk/uttarakhand` | Deterministic demo fallback exercising all 4 risk tiers (`LOW` to `CRITICAL`). | Active |

---

## 📊 Risk Assessment & Ingestion Logic

### 1. Government Telemetry Ingestion (NWDP / NWIC)
* **Dataset**: `Rainfall Uttarakhand Uttarakhand (2026 - 2030) Telemetry Hourly`
* **Resource ID**: `8b406187-0fee-40b9-8cd9-a249e0ce1903`
* **Base URL**: `https://nwdp.nwic.gov.in`
* **Datastore Endpoint**: `/api/3/action/datastore_search`
* **Dynamic Scope**: Ingestion dynamically discovers all reporting districts and stations. Counts are derived at runtime and never hardcoded.

### 2. Station Rainfall Risk Model (`ai/src/risk/rainfall.py`)
Observations are sorted chronologically to evaluate multi-window precipitation accumulation against prototype thresholds:

* **Hourly Rate**:
  - $\ge 80.0\text{ mm}$: Critical torrential precipitation (+90 pts)
  - $\ge 50.0\text{ mm}$: High precipitation (+65 pts)
  - $\ge 25.0\text{ mm}$: Moderate precipitation (+35 pts)
* **6-Hour Accumulation**:
  - $\ge 100.0\text{ mm}$: Severe accumulation (+30 pts)
  - $\ge 50.0\text{ mm}$: Elevated accumulation (+15 pts)
* **24-Hour Accumulation**:
  - $\ge 150.0\text{ mm}$: Severe accumulation (+25 pts)
  - $\ge 75.0\text{ mm}$: Elevated accumulation (+10 pts)
* **Classification**: `LOW` ($\le 30$), `MODERATE` ($31\text{--}50$), `HIGH` ($51\text{--}75$), `CRITICAL` ($76\text{--}100$).

### 3. Data Freshness & Upstream Resilience
* **Metadata Provenance**: Every response includes `observation_time` (sensor reading time), `retrieved_at` (pipeline ingestion time), `data_age_hours`, and `data_source_status`.
* **Caching**: Telemetry is cached in memory with a 300-second TTL (`CACHE_TTL_SECONDS`).
* **Fault Tolerance**: If the upstream NWDP portal is temporarily unreachable, the engine gracefully falls back to the previous in-memory cache marked with `"data_source_status": "cached"`.
* **Deterministic Presentation Mode**: `/api/v1/demo/risk/uttarakhand` provides guaranteed demonstration data covering all four risk tiers using the exact same calculation algorithms.

---

## 📱 Subsystem Status (Mobile, Admin, Maps & IoT)

### Flutter Mobile Client (`android/`)
* **Current Status**: Scaffolding complete with defined Dio API contract consuming `/api/v1/risk/uttarakhand`, `/api/v1/risk/uttarakhand/geojson`, `/api/v1/demo/risk/uttarakhand`, and `/api/v1/demo/risk-assessment`.
* **Next Stage**: Riverpod state management and Drift (SQLite) offline cache implementation for persistent offline shelter and hazard lookup.

### Admin Monitoring Dashboard (`dashboard/`)
* **Current Status**: React + Vite + TypeScript project scaffold with Leaflet map container.
* **Next Stage**: Rendering live GeoJSON risk layers from `/api/v1/risk/uttarakhand/geojson` and district telemetry summaries.

### Maps & Geospatial Routing (`maps/`)
* **Current Status**: RFC 7946 GeoJSON Point feature generator implemented and active in `ai/src/risk/aggregation.py`. Coordinates strictly follow `[longitude, latitude]` order.
* **Next Stage**: OpenStreetMap (OSM) extract ingestion and OSRM graph profile penalizing routes through `HIGH` and `CRITICAL` hazard zones.

### IoT & Environmental Sensing (`iot/`)
* **Current Status**: Standardized MQTT topic contract (`flashguard/sensors/{sensor_id}/readings`) and payload structure defined.
* **Next Stage**: Background MQTT consumer daemon in the backend ingesting sensor readings into PostGIS.

---

## 🔒 Security Posture & CORS

* **CORS Whitelist**: Controlled browser origins are configured via `ALLOWED_ORIGINS` (comma-separated list).
* **Restricted Methods & Headers**: Limited strictly to `GET` and `POST` methods, and `Content-Type` and `Authorization` headers.
* **Credentials**: Disabled (`allow_credentials=False`).
* **Mobile Compatibility**: Native Flutter apps communicate directly without browser CORS constraints.
* **Authentication Note**: Authentication (JWT / API Keys) and rate limiting are planned for the production hardening phase and are **not active in the current prototype**.

---

## ⚙️ Environment Configuration & Variables

All settings load from environment variables with safe internal defaults:

| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `ALLOWED_ORIGINS` | `""` (empty) | Comma-separated list of allowed browser origins (e.g. `http://localhost:5173`). |
| `NWDP_BASE_URL` | `https://nwdp.nwic.gov.in` | Government datastore root URL. |
| `NWDP_RESOURCE_ID` | `8b406187-0fee-40b9-8cd9-a249e0ce1903` | NWDP hourly telemetry dataset ID. |
| `NWDP_PAGE_SIZE` | `100` | Ingestion pagination batch limit. |
| `NWDP_TIMEOUT_SECONDS` | `30.0` | Upstream HTTP request timeout. |
| `CACHE_TTL_SECONDS` | `300` | In-memory telemetry cache lifetime (seconds). |
| `RAINFALL_MODERATE_MM` | `25.0` | Hourly rainfall moderate threshold (mm). |
| `RAINFALL_HIGH_MM` | `50.0` | Hourly rainfall high threshold (mm). |
| `RAINFALL_CRITICAL_MM` | `80.0` | Hourly rainfall critical torrential threshold (mm). |
| `RAINFALL_6H_ELEVATED_MM` | `50.0` | 6-hour accumulation elevated threshold (mm). |
| `RAINFALL_6H_SEVERE_MM` | `100.0` | 6-hour accumulation severe threshold (mm). |
| `RAINFALL_24H_ELEVATED_MM` | `75.0` | 24-hour accumulation elevated threshold (mm). |
| `RAINFALL_24H_SEVERE_MM` | `150.0` | 24-hour accumulation severe threshold (mm). |

---

## 💻 Local Setup & Development

### 1. Prerequisites
* Python 3.11+ (Python 3.11 and 3.13 tested and verified)
* Git

### 2. Install Dependencies
From the repository root:
```bash
pip install -r requirements.txt
```

### 3. Run the Backend Server
```bash
uvicorn backend.app.main:app --reload --port 8000
```
Interactive endpoints:
* **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
* **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 🧪 Testing & Code Quality

The test suite contains 50 automated tests covering the risk engine, NWDP client, aggregation logic, and backend endpoints:

```bash
# Run all tests
pytest

# Run linter checks
ruff check .
```

---

## ☁️ Render Deployment

The backend web service is prepared for automated cloud deployment via [`render.yaml`](render.yaml):

* **Service Name**: `flashguard-backend`
* **Runtime**: Python `3.11.9`
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
* **Health Check Path**: `/health`
* **Status**: Deployment configuration is prepared and validated.

---

## ⏳ Current Limitations & Future Roadmap

### Current Limitations
1. **Prototype Thresholds**: Rainfall thresholds and scores are heuristic demonstration rules and not calibrated against official IMD/CWC warning declarations.
2. **In-Memory Cache**: Telemetry is cached in-memory on the single application process rather than a distributed Redis cache.
3. **Absence of Persistent Storage**: Risk assessments are computed dynamically in-process; historical observations are not yet stored in a persistent spatial database.
4. **Internet Dependency for Live Feed**: Live telemetry ingestion requires internet connectivity to reach the NWDP CKAN datastore (mitigated by deterministic demo fallback and in-memory cache).

### Future Roadmap
1. **Machine Learning Forecasting**: Integrating time-series deep learning models (LSTM) to predict rainfall 3–6 hours in advance.
2. **Spatial Database Integration**: Connecting PostgreSQL + PostGIS for persistent hazard polygons and safe shelters.
3. **Hazard-Avoidance Evacuation Routing**: Intersecting OSRM route polylines with high-risk polygons to return safe evacuation paths.
4. **Hardware Telemetry Integration**: Deploying physical ESP32 water-level sensors and streaming telemetry over MQTT.
5. **Resilient Communication**: Implementing P2P Wi-Fi Direct mesh networking and SMS gateway failover for off-grid operation.

---

## ⚠️ Disclaimer

> [!CAUTION]
> **Prototype Demonstration Notice**: FlashGuard AI is an academic prototype developed for the Smart India Hackathon (SIH) 2026. The risk scores, thresholds, and alerts generated by this system are for algorithmic evaluation and simulation only. They do **NOT** represent official weather advisories, flood warnings, or disaster declarations from the India Meteorological Department (IMD), Central Water Commission (CWC), or Uttarakhand State Disaster Management Authority (USDMA).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
