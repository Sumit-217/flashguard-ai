# FlashGuard AI — System Interfaces & Component Boundaries

## 1. Executive Summary

FlashGuard AI is designed as a modular, resilient disaster-management and communication platform for SIH 2026. This document specifies the **system boundaries, component responsibilities, and interface contracts** across all 6 submodules.

```text
                               ┌────────────────────────────────┐
                               │   Admin Dashboard (Member 6)   │
                               │      React + Vite + Leaflet    │
                               └───────────────┬────────────────┘
                                               │ REST API / JWT
                                               ▼
┌───────────────────────────┐       ┌────────────────────────────────┐       ┌────────────────────────────┐
│  Mobile App (Member 2)    │──────▶│    FastAPI Backend (Member 1)  │◀──────│  AI/Risk Engine (Member 4) │
│  Flutter + Drift (SQLite) │◀──────│       Python / Pydantic        │──────▶│   scikit-learn / GeoPandas │
└─────────────┬─────────────┘       └──────────────┬─────────────────┘       └────────────────────────────┘
              │                                    │
              │                                    ├──────────────────────────┐
              │                                    ▼                          ▼
              │                     ┌─────────────────────────────┐   ┌──────────────────────────┐
              │                     │  PostgreSQL + PostGIS (M1)  │   │  OSRM Routing (Member 3) │
              │                     │  Spatial Data & Persistence │   │  Safe Route Computation  │
              │                     └─────────────────────────────┘   └──────────────────────────┘
              │                                    │
              │                                    ├──────────────────────────┐
              │                                    ▼                          ▼
              ▼                     ┌─────────────────────────────┐   ┌──────────────────────────┐
┌───────────────────────────┐       │  MQTT Broker (Eclipse Mosq) │   │  External SMS Gateway    │
│ P2P Store & Forward Mesh  │       │  IoT Readings Ingestion (M5)│   │  Single Keypad Test (M5) │
│ Nearby / Wi-Fi Direct (M5)│       └──────────────┬──────────────┘   └──────────────────────────┘
└───────────────────────────┘                      │
                                                   ▲
                                    ┌──────────────┴──────────────┐
                                    │ ESP32 / Python Simulator    │
                                    │ Environmental Sensors (M5)  │
                                    └─────────────────────────────┘
```

---

## 2. Component Ownership Matrix

| Subsystem | Primary Owner | Tech Stack | Core Responsibilities | Prohibited / Out-of-Scope Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Backend & DB** | Member 1 | FastAPI, Python, PostgreSQL, PostGIS | Central REST API, Auth/JWT, DB transactions, spatial indexing, dispatching alerts. | Directly rendering UI, running raw ML training pipelines in-process. |
| **Mobile App** | Member 2 | Flutter, Riverpod, Drift (SQLite), Dio | Mobile UI, user GPS tracking, local caching, local notifications, P2P UI integration. | Direct SQL connection to PostgreSQL backend. |
| **Maps & Routing** | Member 3 | OpenStreetMap, OSRM, GeoJSON | GeoJSON spatial layers, OSRM candidate routing, hazard-avoidance routing algorithm. | Managing user authentication or backend DB sessions directly. |
| **AI / Risk Engine** | Member 4 | Python, scikit-learn, GeoPandas, Shapely | Multi-factor risk calculation, geospatial intersection, risk level inference. | Directly writing to database without going through backend service/API. |
| **IoT & Comm.** | Member 5 | ESP32, MQTT (Mosquitto), Python, SMS API, P2P | Sensor telemetry ingestion, IoT simulation, single keypad phone SMS testing, P2P mesh logic. | Building nationwide telecom or cellular infrastructure. |
| **Admin Dashboard**| Member 6 | React, TypeScript, Vite, Tailwind CSS, Leaflet | Admin visualization, disaster overview, live sensor telemetry, alert management. | Direct database access bypassing FastAPI REST APIs. |

---

## 3. Subsystem Interface Definitions

### 3.1 Mobile (Flutter) ↔ Backend (FastAPI)
- **Protocol**: HTTPS / REST over JSON.
- **Authentication**: `Authorization: Bearer <JWT_ACCESS_TOKEN>`.
- **Primary Flows**:
  - `POST /api/v1/auth/*`: Registration and login.
  - `GET /api/v1/risk-zones/nearby`: Spatial query for active danger areas around current GPS coordinates.
  - `GET /api/v1/shelters/nearby`: Proximity query for open emergency shelters.
  - `POST /api/v1/routes`: Requests a risk-evaluated safe evacuation route.
  - `POST /api/v1/emergency/messages`: Submits local emergency SOS or forward-synced mesh messages.
  - `GET /api/v1/alerts`: Retrieves active emergency broadcasts.

### 3.2 AI / Risk Engine ↔ Backend
- **Interface**: In-process Python module inside `ai/` imported directly by backend services (clean interface boundaries maintained so it can be split into a separate service later only if required).
- **Input Contract**: Structured dictionary/Pydantic model containing disaster type, rainfall, water level, elevation, soil moisture, and spatial location.
- **Output Contract**: Normalized `risk_score` (0.00 – 1.00), categorical `risk_level` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and `confidence` score.
- **Boundary Rule**: AI Engine calculates scores; Backend assigns `zone_id`, writes to PostGIS, and triggers notifications.

### 3.3 Maps / Routing (OSRM) ↔ Backend
- **Interface**: OSRM HTTP Engine (`/route/v1/driving/` or `/route/v1/foot/`) + Backend Risk Filter.
- **Process**:
  1. Backend requests candidate routes between Origin `[lat, lon]` and Destination `[lat, lon]` from OSRM.
  2. Backend intersects candidate route geometry with active PostGIS `RiskZone` polygons.
  3. Safe routing algorithm penalizes high-risk intersections and selects the optimal path.
  4. Selected route GeoJSON is returned to Flutter / Dashboard.

### 3.4 IoT (ESP32 / Simulator) ↔ Backend (MQTT)
- **Broker**: Eclipse Mosquitto (Port `1883` standard, `9001` WebSocket).
- **Topic Hierarchy**: `flashguard/sensors/{sensor_id}/readings`.
- **Payload**: Standard JSON reading with timestamp, sensor ID, metric type, unit, and value.
- **Backend Role**: MQTT consumer daemon parses readings, writes to PostgreSQL `sensor_readings`, checks threshold alerts, and feeds the AI Risk Engine.

### 3.5 Backend ↔ External Notification Gateways
1. **Push Notifications (FCM)**:
   - Dispatched to registered mobile client FCM device tokens.
   - High-priority data messages containing `alert_id`, `priority`, `risk_level`, `zone_id`, and `message`.
2. **SMS Gateway (1 Keypad Phone)**:
   - Backend interfaces with an abstract SMS gateway adapter (`sendEmergencySms`).
   - The concrete SMS provider will be selected during Stage 5 based on cost and trial availability.
   - Target is strictly restricted to ONE demonstration keypad feature phone.

### 3.6 P2P Store-and-Forward Emergency Communication (Mobile ↔ Mobile)
- **Transport**: Google Nearby Connections API / Wi-Fi Direct / Bluetooth.
- **Topology**: Ad-hoc decentralized multi-hop mesh.
- **Rule**: Packets carry unique `message_id` for deduplication, strict `hop_count` limit (max 5 hops), and `ttl` (Time-To-Live). When any peer regains Internet access, cached messages are synced to `POST /api/v1/emergency/messages`.

### 3.7 Admin Dashboard ↔ Backend
- **Protocol**: HTTPS / REST with periodic polling for the SIH MVP (WebSocket/SSE streams deferred as future enhancements).
- **Authentication**: `Authorization: Bearer <JWT_ADMIN_TOKEN>`.
- **Flows**: High-level aggregated telemetry (`GET /api/v1/admin/overview`), alert broadcast triggers (`POST /api/v1/alerts`), and live sensor monitoring via REST polling.
