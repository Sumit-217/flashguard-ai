# 🚨 FlashGuard AI

> **AI-powered disaster management, emergency alerting, risk assessment, and resilient communication system for Smart India Hackathon (SIH) 2026.**  
> **Regional Focus**: **Uttarakhand, India** (Himalayan disaster-prone corridor).

---

## 📌 Project Overview

**FlashGuard AI** is a location-aware, communication-resilient emergency platform designed to provide early hazard intelligence, calculate multi-tiered disaster risk, recommend safe evacuation paths avoiding active danger zones, and deliver actionable emergency broadcasts—even under extreme network degradation or complete cellular blackout.

The system integrates **real-time government telemetry (NWDP/NWIC), in-process AI risk assessment, IoT environmental sensing, offline-first mobile sync, and decentralized peer-to-peer (P2P) emergency mesh communication**.

---

## ✨ Key Features & Capabilities

1. **Government Telemetry Ingestion (NWDP/NWIC)**:
   - Automated ingestion of hourly rainfall telemetry across all 13 districts of Uttarakhand.
   - Resilient multi-page CKAN datastore client with in-memory TTL caching and fault-tolerant fallbacks.
2. **Explainable AI Risk Engine**:
   - Multi-parameter weighted risk scoring combining precipitation rates, rolling 6h/24h accumulation, river water levels, and USDMA historical vulnerability.
   - Categorical classification: `LOW`, `MODERATE`, `HIGH`, and `CRITICAL`.
3. **GeoJSON Risk Layers**:
   - Dynamic RFC 7946 GeoJSON `FeatureCollection` generation with Point geometries strictly in `[longitude, latitude]` order for direct rendering on Flutter and Leaflet maps.
4. **Director Demo Milestone Contract**:
   - Deterministic endpoint returning high-priority emergency alerts for Himalayan hazard hotspots (e.g. Joshimath, Chamoli).
5. **Safe Evacuation Routing (In Progress)**:
   - Hazard-avoidance path calculation using OpenStreetMap (OSM) and OSRM that actively penalizes routes passing through high-risk disaster polygons.
6. **Resilient Multi-Channel Alerting (In Progress)**:
   - Push notifications (FCM), emergency SMS for feature keypad phones, and local offline store-and-forward mesh propagation.
7. **Offline-First Mobile Architecture**:
   - Drift (SQLite) local caching of active hazard boundaries, safe shelters, and emergency contacts.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| **AI / Risk Engine** | Python, NumPy, Pandas, scikit-learn, GeoPandas, Shapely |
| **Government Data** | NWDP / NWIC Datastore API (Ministry of Jal Shakti) |
| **Mobile Application** | Flutter (Dart), Riverpod, Drift (SQLite), Dio, Geolocator, FCM |
| **Admin Dashboard** | React, Vite, TypeScript, Tailwind CSS, Leaflet |
| **Spatial Database** | PostgreSQL, PostGIS (WGS84 EPSG:4326) |
| **IoT & Telemetry** | ESP32, MQTT (Eclipse Mosquitto), Python Simulator |
| **Deployment** | Render (`render.yaml`), Docker Compose |

---

## 📂 Repository Structure

```text
flashguard-ai/
│
├── ai/                   # AI & Government Risk Engine
│   ├── src/              # Clients, risk processors, aggregators, standalone app
│   └── tests/            # AI test suites (risk engine, NWDP client, aggregations)
├── android/              # Flutter mobile client
├── backend/              # Unified FastAPI backend application
│   ├── app/              # Routers, schemas, services, entrypoint
│   └── tests/            # API integration tests
├── dashboard/            # React + Vite admin dashboard
├── docker/               # Container configurations
├── docs/                 # Architectural specifications, ADRs, and demo contracts
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── demo/             # Monday Director Demo contract
│   └── setup/
├── iot/                  # ESP32 firmware, MQTT, and sensor simulator
├── maps/                 # Geospatial data extracts and routing scripts
├── scripts/              # Shared utility and dev scripts
├── .agents/              # Workspace customization rules (Uttarakhand regional focus)
├── pyproject.toml        # Ruff linter and Pytest testpaths configuration
├── requirements.txt      # Root Python dependencies (Render deployable)
├── render.yaml           # Render infrastructure-as-code specification
└── docker-compose.yml    # Container orchestration placeholder
```

---

## 🚀 Quick Start: Running Backend Locally

### 1. Prerequisites
- Python 3.11+ (Python 3.13 tested and verified)
- Git

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Start the Server
```bash
uvicorn backend.app.main:app --reload --port 8000
```
Open interactive documentation:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Status: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 📡 Key REST Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Backend health check |
| `GET` | `/api/v1/risk/uttarakhand` | State-wide dynamic risk assessment across all active districts |
| `GET` | `/api/v1/risk/district/{district}` | District risk assessment (e.g. `Dehradun`, `Chamoli`) |
| `GET` | `/api/v1/risk/station/{station}` | Station assessment with rolling 6h/24h accumulation and completeness |
| `GET` | `/api/v1/risk/uttarakhand/geojson` | Valid GeoJSON FeatureCollection in `[lon, lat]` Point coordinates |
| `GET` | `/api/v1/rainfall/uttarakhand` | Summary of ingested NWDP government telemetry records |
| `GET` | `/api/v1/demo/risk/uttarakhand` | Deterministic demo fallback exercising `LOW`, `MODERATE`, `HIGH`, `CRITICAL` |
| `POST` | `/api/v1/demo/risk-assessment` | Monday Director Demo contract payload for Joshimath |

---

## 🧪 Testing & Code Quality

Run all unit and integration tests across backend and AI suites:
```bash
pytest
```
Run linter and formatting checks:
```bash
ruff check .
ruff format --check backend ai
```

---

## 👥 Six-Member Ownership Matrix

| Member | Focus Area | Core Responsibilities |
| :--- | :--- | :--- |
| **Member 1** | Backend & Database | FastAPI, PostgreSQL/PostGIS, REST APIs, System Orchestration |
| **Member 2** | Flutter Mobile | Mobile UI, Riverpod state, Drift offline cache, Location, FCM |
| **Member 3** | Maps & Routing | OpenStreetMap, OSRM hazard-avoidance routing, GeoJSON |
| **Member 4** | AI / Risk Engine | Risk models, NWDP telemetry pipeline, explainable scoring |
| **Member 5** | IoT & Communication | ESP32 firmware, MQTT broker, sensor simulation, SMS adapter |
| **Member 6** | Admin Dashboard | React/Vite dashboard, live sensor maps, system integration |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
