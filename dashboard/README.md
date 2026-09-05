# FlashGuard AI — Admin Monitoring Dashboard

> **Centralized administrative monitoring, geospatial situational awareness, and incident management dashboard for SIH 2026.**  
> Built with **React**, **Vite**, **TypeScript**, **Tailwind CSS**, and **Leaflet**.

---

## 📌 Overview

The Admin Dashboard provides emergency coordinators, district administrators, and disaster response teams with a high-altitude situational overview across Uttarakhand.

### Core Capabilities
* **Interactive Disaster Map**: Visualizes hazard polygons, active telemetry monitoring stations, and shelter locations using Leaflet.
* **Live Telemetry Feeds**: Displays real-time and cached NWDP/NWIC rainfall measurements across Uttarakhand districts.
* **Emergency Alert Dispatch**: Interface to broadcast high-priority FCM and SMS notifications.
* **Sensor Monitoring**: Live telemetry visualization from ESP32 river-gauge sensors and IoT simulator streams.

---

## 🛠️ Technology Stack

* **Framework**: React 18+ (SPA)
* **Build Tool**: Vite
* **Language**: TypeScript (strict typing matching backend Pydantic schemas)
* **Styling**: Tailwind CSS
* **Map Renderer**: Leaflet & React-Leaflet
* **State & Data Fetching**: Axios / TanStack Query with REST polling

---

## 📡 Backend API Integration

The dashboard consumes the unified FastAPI backend (`/api/v1`):
* `GET /api/v1/risk/uttarakhand` — Complete Uttarakhand district and station risk assessment.
* `GET /api/v1/risk/uttarakhand/geojson` — GeoJSON Point features for direct Leaflet map layers.
* `GET /api/v1/rainfall/uttarakhand` — Ingestion metadata and raw observation summaries.
* `GET /api/v1/demo/risk/uttarakhand` — Deterministic demonstration mode.
