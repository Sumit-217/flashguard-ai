# FlashGuard AI — Backend Service

> **Core REST API & Central Integration Gateway for FlashGuard AI (SIH 2026)**  
> Built with **Python 3.11+**, **FastAPI**, **Pydantic v2**, and **Uvicorn**.

---

## 📌 Overview

The `backend/` directory houses the primary FastAPI web application. It acts as the central orchestrator connecting:
- **Flutter Mobile Application** (incident reporting, safe routing, emergency broadcasts)
- **Admin Monitoring Dashboard** (incident map visualization, sensor telemetry)
- **AI & Government Risk Engine** (in-process risk calculations and NWDP telemetry ingestion)
- **Database & Spatial Store** (PostgreSQL + PostGIS)

---

## 📂 Architecture & Directory Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # Primary FastAPI entrypoint, CORS & router mounting
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── demo.py          # Monday Director Demo endpoints
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── risk.py              # Pydantic v2 validation models
│   └── services/
│       ├── __init__.py
│       └── risk_service.py      # Bridge service invoking ai/src/risk_engine.py
├── tests/
│   └── test_demo_api.py         # API integration test suite
├── requirements.txt             # Service-specific dependencies
└── README.md
```

---

## 🚀 Active Endpoints

All REST routes are prefixed with `/api/v1` unless designated otherwise:

| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Service health status check | Active |
| `POST` | `/api/v1/demo/risk-assessment` | Monday Director Demo: multi-parameter weighted risk evaluation for Joshimath | Active |
| `GET` | `/api/v1/rainfall/uttarakhand` | Government NWDP telemetry feed summary | Active |
| `GET` | `/api/v1/risk/uttarakhand` | State-wide composite risk profile across all 13 Uttarakhand districts | Active |
| `GET` | `/api/v1/risk/district/{district}` | District-specific telemetry metrics and station risk assessments | Active |
| `GET` | `/api/v1/risk/station/{station}` | Station-level rainfall accumulation (hourly, 6h, 24h) and explainable reasons | Active |
| `GET` | `/api/v1/risk/uttarakhand/geojson` | RFC 7946 GeoJSON FeatureCollection formatted as `[longitude, latitude]` Point features | Active |
| `GET` | `/api/v1/demo/risk/uttarakhand` | Deterministic demo fallback exercising `LOW`, `MODERATE`, `HIGH`, and `CRITICAL` risk tiers | Active |

---

## 💻 Local Development Setup

### 1. Requirements
- Python 3.11+ (Python 3.13 supported)
- Virtual environment (`venv`)

### 2. Installation
From the repository root:
```bash
# Using root dependencies:
pip install -r requirements.txt

# Or backend specific:
pip install -r backend/requirements.txt
```

### 3. Running the Server
From the repository root:
```bash
uvicorn backend.app.main:app --reload --port 8000
```
Interactive OpenAPI documentation will be available at:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 Testing

Run backend tests using Pytest:
```bash
pytest backend/tests/
```

Run full monorepo tests:
```bash
pytest
```

---

## ☁️ Cloud Deployment (Render)

The backend is configured for deployment on **Render** via `render.yaml`:
* **Environment**: Python
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
