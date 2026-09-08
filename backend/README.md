# FlashGuard AI — Backend Service

> **Central REST API gateway and orchestration layer for FlashGuard AI (SIH 2026).**  
> Built with **Python 3.11+**, **FastAPI**, **Pydantic v2**, and **Uvicorn**.

---

## 📌 Architecture & Responsibilities

The `backend/` package serves as the unified application gateway. In the current prototype, it mounts both demo and government telemetry risk assessment routers, enforces network security and CORS policies, and validates incoming data contracts.

### Implemented Architecture
* **FastAPI Core**: Entrypoint at `backend.app.main:app`.
* **In-Process Integration**: Mounts independent AI risk engines and NWDP telemetry clients under `/api/v1`.
* **CORS Protection**: Controlled origin whitelist parsed dynamically from the environment.
* **OpenAPI Documentation**: Automatically generated interactive Swagger UI and ReDoc specifications.

### Target / Planned Architecture (Future Scope)
* **Spatial Storage**: PostgreSQL + PostGIS database connection for persistent hazard polygons and shelters.
* **Authentication**: JWT / OAuth2 role-based access control for administrative actions.
* **IoT Consumer**: Background MQTT daemon ingesting sensor readings into the database.
* **Safe Routing**: OSRM hazard-avoidance routing bridge.

---

## 📂 Directory Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # Primary FastAPI entrypoint, CORS configuration & router mounts
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── alerts.py        # Multi-channel disaster alerts & broadcast router (POST/GET /api/v1/alerts)
│   │       └── demo.py          # Director Demo endpoints (Joshimath evaluation & SMS alerts)
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── alert.py             # Pydantic v2 validation models for alerts (FCM, SMS, PUSH, DASHBOARD, etc.)
│   │   └── risk.py              # Pydantic v2 validation models for demo requests/responses
│   └── services/
│       ├── __init__.py
│       ├── alert_service.py     # Emergency message generation and SMS dispatch service
│       ├── risk_service.py      # Bridge service invoking ai/src/risk_engine.py
│       └── sms_provider.py      # Pluggable SMS provider abstraction and DemoSMSProvider
├── tests/
│   ├── __init__.py
│   ├── test_alert.py            # Unit and API integration tests for SMS alerts
│   └── test_demo_api.py         # Integration test suite for backend routes
├── requirements.txt             # Service dependency definitions
└── README.md
```

---

## 📡 Verified Active Endpoints

All application routes are documented below and verified against the current codebase:

| Method | Endpoint | Router / Component | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | `backend.app.main` | Primary service health status check (used by Render). |
| `GET` | `/api/v1/health` | `ai.src.api.routes` | Health status check for telemetry sub-router. |
| `POST` | `/api/v1/alerts` | `backend.app.api.v1.alerts` | Broadcast a new emergency alert across specified channels (`FCM`, `SMS`, `PUSH`, `DASHBOARD`, etc.). |
| `GET` | `/api/v1/alerts` | `backend.app.api.v1.alerts` | Retrieve all active disaster alerts. |
| `POST` | `/api/v1/demo/risk-assessment` | `backend.app.api.v1.demo` | Director Demo contract: evaluates composite risk for target locations (Joshimath). |
| `POST` | `/api/v1/demo/send-alert` | `backend.app.api.v1.demo` | Emergency SMS Alert Demonstration: generates and dispatches alert payload for keypad phones. |
| `GET` | `/api/v1/rainfall/uttarakhand` | `ai.src.api.routes` | Government NWDP telemetry summary, active districts, and station counts. |
| `GET` | `/api/v1/risk/uttarakhand` | `ai.src.api.routes` | State-wide composite risk profile across all reporting Uttarakhand districts. |
| `GET` | `/api/v1/risk/district/{district}` | `ai.src.api.routes` | District-specific telemetry metrics and station risk breakdowns. |
| `GET` | `/api/v1/risk/station/{station}` | `ai.src.api.routes` | Station-level rainfall accumulation (hourly, 6h, 24h) and explainable reasons. |
| `GET` | `/api/v1/risk/uttarakhand/geojson` | `ai.src.api.routes` | RFC 7946 GeoJSON FeatureCollection in strict `[longitude, latitude]` Point coordinates. |
| `GET` | `/api/v1/demo/risk/uttarakhand` | `ai.src.api.routes` | Deterministic demo fallback dataset exercising all 4 risk tiers (`LOW` to `CRITICAL`). |

### 📢 Emergency Alerts & Multi-Channel Broadcast (`/api/v1/alerts`)

* **Endpoint**: `POST /api/v1/alerts` and `GET /api/v1/alerts`
* **Supported Channels**: `FCM`, `SMS`, `PUSH`, `DASHBOARD`, `CAP`, `WHATSAPP`, `SIREN`.
* **Payload Highlights**: Supports severity levels (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`), target districts, specific target zones/localities (`target_area`), geolocation (`latitude`, `longitude`), and custom warning text.

### 📱 Emergency SMS Alert Demonstration (Keypad Phone Support)

To address real-world disaster scenarios where cellular data / internet connectivity is lost, FlashGuard AI supports emergency alerting over standard cellular SMS, reaching individuals on basic feature and keypad phones:

* **Endpoint**: `POST /api/v1/demo/send-alert`
* **Operational Mode**: Currently operates in `SMS_DEMO` mode (`delivery_mode: "SMS_DEMO"`).
* **Key Features**:
  - **Single GSM Segment**: Generates concise alerts (<= 160 characters) guaranteed to display cleanly on basic keypad phones.
  - **Privacy First**: Raw phone numbers are never stored, logged, or retained. Responses only return masked representations (e.g. `******3210`).
  - **Pluggable Architecture**: Implemented via a `BaseSMSProvider` abstraction (`DemoSMSProvider` default). A live SMS gateway (Twilio, AWS SNS, local GSM modem, or CDAC emergency broadcast) can be plugged in without changing API contracts.
  - **Keypad Phone Verification**: A basic keypad phone can be used as the demonstration recipient when an actual SMS provider / SIM gateway is connected.

---

## 🔒 Security Posture & CORS Configuration

The backend implements cross-origin access control:

1. **Dashboard & Mobile Integration**:
   - Configured via `CORSMiddleware` in `backend/app/main.py` allowing cross-origin requests from the React Admin Dashboard (`http://localhost:3000` / `http://localhost:5173` / deployed frontend) and mobile clients.
   - `allow_credentials=False` (cookies and credentials disabled).
   - *Note*: Native mobile apps (Flutter) communicate directly via native networking and do not enforce browser CORS restrictions.
2. **Current Limitations & Future Security Work**:
   - Authentication (JWT / API Keys) is **not yet implemented** in the current prototype.
   - Rate limiting, Web Application Firewall (WAF), and mutual TLS are planned for the production deployment phase.

---

## ⚙️ Environment Variables

The backend and mounted AI components consume the following environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `ALLOWED_ORIGINS` | `""` | Comma-separated list of allowed browser origins (e.g. `http://localhost:5173`). |
| `NWDP_BASE_URL` | `https://nwdp.nwic.gov.in` | Government datastore root URL. |
| `NWDP_RESOURCE_ID` | `8b406187-0fee-40b9-8cd9-a249e0ce1903` | NWDP hourly telemetry dataset ID. |
| `NWDP_PAGE_SIZE` | `100` | Ingestion pagination batch limit. |
| `NWDP_TIMEOUT_SECONDS` | `30.0` | Upstream HTTP request timeout. |
| `CACHE_TTL_SECONDS` | `300` | In-memory telemetry cache lifetime. |

---

## 💻 Local Development Setup

### 1. Prerequisites
* Python 3.11+ (tested and verified with Python 3.11 and 3.13)
* Standard Python virtual environment (`venv`)

### 2. Installation
From the repository root:
```bash
pip install -r requirements.txt
```

### 3. Running the Server
```bash
uvicorn backend.app.main:app --reload --port 8000
```

Access the interactive API interfaces:
* Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
* Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 🧪 Testing

Run backend tests using Pytest:
```bash
# Run backend integration tests only
pytest backend/tests/

# Run entire repository test suite (50 passing tests)
pytest
```

---

## ☁️ Cloud Deployment (Render Specification)

The service is configured for zero-downtime deployment on **Render** via root [`render.yaml`](../render.yaml):

* **Service Name**: `flashguard-backend`
* **Runtime**: `python` (Version: `3.11.9`)
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
* **Health Check Path**: `/health`
* **Port**: Bound dynamically via the `$PORT` environment variable injected by Render.
