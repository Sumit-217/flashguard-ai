# FlashGuard AI — Containerization & Deployment

> **Docker configurations and container infrastructure for FlashGuard AI (SIH 2026).**

---

## 📌 Services Overview

FlashGuard AI defines standard Docker container definitions for rapid developer onboarding and cloud staging:

| Service | Base Image / Technology | Port | Description |
| :--- | :--- | :--- | :--- |
| **Database** | `postgis/postgis:15-3.3` | `5432` | Spatial PostgreSQL database for risk zones & shelters |
| **MQTT Broker** | `eclipse-mosquitto:2` | `1883`, `9001` | Ingests real-time IoT water-level & rain sensor telemetry |
| **Backend API** | `python:3.11-slim` | `8000` | FastAPI application serving REST endpoints |
| **Admin UI** | `node:20-alpine` | `5173` | React + Vite administrative monitoring dashboard |
| **OSRM Engine** | `osrm/osrm-backend` | `5000` | Routing engine for safe evacuation calculations |

---

## ☁️ Cloud Infrastructure (Render)

In addition to local Docker Compose, the backend web service is deployed as a managed service on **Render**:
* Configured in root [`render.yaml`](../render.yaml)
* Automatic Git push deployment
* Health check monitoring against `/health`
