# 🚨 FlashGuard AI

> **AI-powered disaster management, emergency alerting, risk assessment, and resilient communication system for SIH 2026.**

---

## 📌 Project Overview

**FlashGuard AI** is a disaster-management system designed to help individuals and emergency responders receive timely disaster information, understand location-specific risk levels, access safer evacuation routes, and maintain vital communication during emergencies—even when cellular or Internet connectivity is disrupted.

The system combines **geospatial intelligence, AI-based risk assessment, IoT environmental monitoring, offline capabilities, and multi-channel emergency communication** into an integrated platform.

---

## 🎯 Project Goal

The primary goal of FlashGuard AI is to provide a reliable, location-aware, and communication-resilient emergency management platform for Smart India Hackathon (SIH) 2026. The prototype demonstrates end-to-end disaster ingestion, risk evaluation, safe routing, offline availability, multi-tier alerting (FCM, SMS, and peer-to-peer store-and-forward mesh), and centralized administrative monitoring.

---

## ✨ Main Features (Planned)

1. **Disaster Ingestion & Risk-Zone Identification**: Ingest disaster feeds and classify geographical areas into risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
2. **AI-Based Risk Assessment**: Multi-parameter risk scoring combining geospatial analysis, rules, sensor data, and machine learning.
3. **Risk-Aware Safe Evacuation Routing**: Evacuation path computation via OpenStreetMap and OSRM that intentionally avoids high-risk hazard zones.
4. **Resilient Multi-Channel Emergency Alerting**:
   - Push notifications (FCM) over Internet.
   - SMS alert dispatch demonstrating emergency communication with a basic keypad phone.
   - Peer-to-peer (P2P) store-and-forward emergency messaging for offline devices.
5. **Battery-Efficient Adaptive Location Tracking**: Context-aware location checks that scale frequency based on proximity to active risk zones.
6. **Offline First Mobile Experience**: Local caching of risk zones, safe zones, shelters, emergency contacts, and maps via Drift (SQLite).
7. **IoT Environmental Monitoring & Simulation**: Real-time water level and weather telemetry via ESP32 hardware and Python-based IoT simulation over MQTT.
8. **Admin Monitoring Dashboard**: Centralized incident monitoring, sensor visualization, and emergency coordination.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile Application** | Flutter, Dart, Riverpod, Drift (SQLite), Dio, Geolocator, FCM |
| **Backend API** | Python, FastAPI, Pydantic, Uvicorn |
| **Database & GIS** | PostgreSQL, PostGIS |
| **AI / Risk Engine** | Python, NumPy, Pandas, scikit-learn, GeoPandas, Shapely |
| **Maps & Routing** | OpenStreetMap (OSM), OSRM, Leaflet |
| **IoT & Telemetry** | ESP32, MQTT (Eclipse Mosquitto), Python Simulator |
| **Admin Dashboard** | React, Vite, TypeScript, Tailwind CSS, Leaflet |
| **Containerization** | Docker, Docker Compose |

---

## 📂 Repository Structure

FlashGuard AI is organized as a single monorepo:

```text
flashguard-ai/
│
├── .github/              # GitHub templates and workflows
├── android/              # Flutter mobile application
├── backend/              # FastAPI backend service
├── ai/                   # AI & risk assessment engine
│   ├── models/
│   ├── datasets/
│   ├── notebooks/
│   ├── src/
│   └── tests/
├── maps/                 # Geospatial data, GeoJSON, and routing
│   ├── data/
│   ├── geojson/
│   ├── routing/
│   └── scripts/
├── iot/                  # IoT firmware, simulation, and MQTT config
│   ├── esp32/
│   ├── simulator/
│   └── mqtt/
├── dashboard/            # React + Vite admin dashboard
├── docs/                 # System documentation & ADRs
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── setup/
│   └── decisions/
├── scripts/              # Shared dev & utility scripts
├── docker/               # Docker configurations
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
├── README.md
└── docker-compose.yml
```

---

## 👥 Team & Module Responsibilities

| Member | Focus Area | Primary Responsibilities |
| :--- | :--- | :--- |
| **Member 1** | Backend + Database | FastAPI, PostgreSQL, PostGIS, REST APIs, Backend Integration |
| **Member 2** | Flutter Mobile | Mobile UI, Riverpod state, Drift offline caching, Location, FCM |
| **Member 3** | Maps + Routing | OpenStreetMap, OSRM routing, GeoJSON layers, Spatial queries |
| **Member 4** | AI / Risk Engine | Risk scoring models, scikit-learn, GeoPandas, Shapely |
| **Member 5** | IoT + Communication | ESP32 firmware, Python IoT simulator, MQTT, SMS & P2P research |
| **Member 6** | Admin Dashboard | React dashboard, TypeScript, Tailwind CSS, Leaflet, Integration |

---

## 📋 Current Development Stage

> **✅ Stage 0 — Project Setup & Standardization is COMPLETE.**

We have established the monorepo, tech stack, data contracts, environment specifications, and coding standards. Application development will begin in the next stages.

*See [PROGRESS.md](PROGRESS.md) for a detailed breakdown of completed milestones.*

---

## 🤝 Basic Contribution Workflow

All development takes place using feature branches targeting `develop`:

1. Checkout and update `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Create your feature branch:
   ```bash
   git checkout -b feature/<feature-name>
   ```
3. Commit your changes following conventional commit syntax (`feat:`, `fix:`, `docs:`, `chore:`):
   ```bash
   git add .
   git commit -m "feat: your change summary"
   ```
4. Push and open a Pull Request into **`develop`**:
   ```bash
   git push -u origin feature/<feature-name>
   ```

Refer to [`CONTRIBUTING.md`](CONTRIBUTING.md) for detailed contribution guidelines.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
