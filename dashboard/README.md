# 🚨 FlashGuard AI — Admin Monitoring Dashboard

> **Centralized Emergency Monitoring, Geospatial Situational Awareness, and Incident Management Dashboard for Smart India Hackathon (SIH) 2026.**  
> Built with **React 19**, **Vite 6**, **TypeScript**, **Tailwind CSS v4**, **Motion**, and **Leaflet**.

---

## 📌 Overview

The **FlashGuard AI Admin Monitoring Dashboard** provides state and district disaster management authorities (USDMA, DDMA), emergency coordinators, and field response teams (NDRF, SDRF) with real-time situational intelligence across the Himalayan disaster corridor in **Uttarakhand, India**.

It aggregates automated telemetry from the **National Water Data Portal (NWDP / NWIC)**, visualizes multi-window precipitation accumulation and flood risk across districts and stations, and provides a multi-channel emergency alert dispatch system with live keypad phone SMS simulation.

---

## ✨ Key Features & Capabilities

### 1. 🗺️ Interactive Geospatial Risk Map (`/map`)
* **Leaflet & GeoJSON Integration**: Renders real-time RFC 7946 GeoJSON Point and Polygon layers directly from `GET /api/v1/risk/uttarakhand/geojson`.
* **Dynamic Severity Color Coding**: Visual cues mapped to official hazard thresholds:
  * 🟢 **LOW** ($\le 30$ pts) — Normal baseline monitoring
  * 🟡 **MODERATE** ($31\text{--}50$ pts) — Advisory alert; localized monitoring
  * 🟠 **HIGH** ($51\text{--}75$ pts) — Warning tier; heightened readiness
  * 🔴 **CRITICAL** ($76\text{--}100$ pts) — Emergency level; immediate evacuation / response
* **Interactive Station Inspect**: Click any station to inspect rolling 1h, 6h, and 24h accumulation, coordinates, and explainable scoring rationale.

### 2. 📊 High-Altitude Situational Overview (`/`)
* **State-Wide Risk Gauge**: Live composite risk rating aggregated dynamically across all reporting stations.
* **Metric Stat Cards**: Active stations, critical alert count, peak observed rainfall rate, and upstream data freshness indicators.
* **Top Risk Districts Table**: Real-time breakdown of Uttarakhand districts (Chamoli, Rudraprayag, Uttarkashi, Pithoragarh, Dehradun, etc.).

### 3. 📡 Telemetry Station Directory (`/stations`)
* **Live Observation Table**: Comprehensive inventory of NWDP automated telemetry stations.
* **Multi-Window Tracking**: Hourly precipitation rate, 6-hour accumulation, and 24-hour accumulation.
* **Completeness & Anomaly Indicators**: Highlights telemetry gaps or missing chronological intervals.
* **Instant Filtering & Search**: Filter by district or search by station name.

### 4. 📢 Multi-Channel Emergency Alert Dispatch (`/broadcast`)
* **Multi-Channel Selection**: Broadcast alerts across **SMS**, **Push Notifications**, **Dashboard Banner**, **CAP (Common Alerting Protocol)**, **WhatsApp**, and **Siren Systems**.
* **Keypad Phone SMS Simulator**: Built-in **interactive feature phone preview** demonstrating single GSM segment ($\le 160$ characters) formatting for zero-data environments.
* **Backend Dispatch**: Posts payloads directly to `POST /api/v1/alerts` and `POST /api/v1/demo/send-alert`.

### 5. 🚨 Incident & Response Coordination (`/incidents`, `/response`)
* **Active Incidents Feed**: Track reported cloudbursts, flash floods, and debris blockages with severity tags.
* **Response Force Allocation**: Monitor deployed SDRF, NDRF, and medical teams with shelter occupancy status.

### 6. 📈 Risk Analytics & Trends (`/analytics`)
* **Precipitation Trends**: Comparative 24-hour rainfall curves across high-altitude monitoring stations.
* **Vulnerability Matrix**: Regional hazard distribution across northern and southern river basins.

### 7. ⚙️ System Health & Data Provenance (`/system`)
* **Upstream NWDP Sync Monitor**: Real-time telemetry sync latency and cached status indicator.
* **Dual Operational Modes**:
  * **Live Backend Mode**: Communicates with the FastAPI backend (`http://localhost:8000` or deployed Render URL).
  * **Deterministic Demo Fallback**: When backend connectivity is absent or for offline presentations, seamlessly activates high-fidelity demo scenarios (`NORMAL`, `MONSOON_WARNING`, `FLASH_FLOOD_EMERGENCY`).

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/) (Single Page Application) |
| **Build Tool** | [Vite 6](https://vite.dev/) |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) (Strict typing matching backend Pydantic schemas) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite` |
| **Geospatial Mapping**| [Leaflet 1.9](https://leafletjs.com/) with custom OpenStreetMap tile layers |
| **UI Components & Icons** | [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/) micro-animations |
| **Networking** | Native Fetch with `AbortController` timeout resilience and demo failover |

---

## 📂 Project Structure

```text
dashboard/
├── index.html                   # HTML entrypoint & Leaflet stylesheet link
├── package.json                 # Dependencies and build scripts
├── vite.config.ts               # Vite configuration with Tailwind CSS & React plugins
├── tsconfig.json                # TypeScript compiler configuration
├── .env.example                 # Environment variables template
├── public/                      # Static assets & icons
└── src/
    ├── main.tsx                 # React application bootstrap
    ├── App.tsx                  # Top-level router, view switching & scenario state
    ├── index.css                # Tailwind CSS imports & custom utility styles
    ├── types/
    │   └── api.ts               # Type definitions matching backend REST & GeoJSON schemas
    ├── services/
    │   └── api.ts               # Resilient backend API client with demo fallback
    ├── hooks/
    │   └── useRiskData.ts       # Unified data hook managing polling and scenario switches
    ├── data/
    │   └── demoData.ts          # Deterministic demo datasets for Uttarakhand scenarios
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx       # System status bar, scenario selector & refresh controls
    │   │   ├── Sidebar.tsx      # Navigation drawer with active route indicators
    │   │   └── AlertBanner.tsx  # Global critical disaster notification banner
    │   ├── maps/
    │   │   └── RiskMap.tsx      # Interactive Leaflet risk map with GeoJSON markers
    │   ├── cards/
    │   │   └── StatsCards.tsx   # Executive summary metric cards
    │   ├── broadcast/
    │   │   └── KeypadPhonePreview.tsx # Realistic keypad feature phone SMS renderer
    │   └── common/
    │       ├── RiskBadge.tsx    # Standardized color-coded severity badges
    │       └── StationDetailModal.tsx # Station telemetry inspection modal
    └── pages/
        ├── OverviewPage.tsx     # High-altitude monitoring summary
        ├── RiskMapPage.tsx      # Dedicated full-screen geospatial hazard view
        ├── StationsPage.tsx     # Station telemetry list with search & filter
        ├── BroadcastPage.tsx    # Multi-channel alert dispatch center
        ├── AlertsPage.tsx       # Active disaster notifications list
        ├── IncidentsPage.tsx    # Active field incident response tracker
        ├── ResponsePage.tsx     # Rescue force mobilization & shelters
        ├── AnalyticsPage.tsx    # Precipitation accumulation charts
        └── SystemStatusPage.tsx # Upstream sync and service telemetry
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: v18.0 or later (v20+ recommended)
* **npm** or **bun** / **yarn**

### 2. Installation
Navigate to the `dashboard/` directory and install dependencies:
```bash
cd dashboard
npm install
```

### 3. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Edit `.env` as appropriate:
```bash
# Point to your local FastAPI backend:
VITE_API_BASE_URL=http://localhost:8000

# Or point to deployed Render backend:
# VITE_API_BASE_URL=https://flashguard-ai.onrender.com
```

### 4. Run Development Server
```bash
npm run dev
```
The dashboard will start on `http://localhost:3000` (or `http://localhost:5173`).

### 5. Build for Production
```bash
npm run build
```
The static production assets will be generated in `dashboard/dist/`.

---

## 📡 Backend API Integration

The dashboard consumes the following unified FastAPI endpoints:

| Endpoint | Method | Purpose in Dashboard |
| :--- | :--- | :--- |
| `/api/v1/health` | `GET` | Telemetry pipeline and upstream connection health check. |
| `/api/v1/risk/uttarakhand` | `GET` | State-wide composite risk profile and district telemetry breakdown. |
| `/api/v1/risk/uttarakhand/geojson` | `GET` | RFC 7946 GeoJSON Point feature collection for Leaflet map overlay. |
| `/api/v1/risk/district/{district}` | `GET` | District-specific telemetry metrics and station rankings. |
| `/api/v1/risk/station/{station}` | `GET` | Detailed station precipitation accumulation (1h, 6h, 24h). |
| `/api/v1/alerts` | `GET` | Active emergency alerts list. |
| `/api/v1/alerts` | `POST` | Dispatches new multi-channel emergency alert. |
| `/api/v1/demo/send-alert` | `POST` | Dispatches single-segment SMS alert formatted for feature/keypad phones. |
| `/api/v1/demo/risk/uttarakhand` | `GET` | Deterministic 4-tier risk dataset for live presentation demonstrations. |

---

## 📱 Feature / Keypad Phone SMS Preview

In mountainous disaster corridors like Uttarakhand, cellular data and smartphone connectivity are frequently disrupted during severe cloudbursts. FlashGuard AI prioritizes basic feature phone accessibility:
* **Single GSM Segment Guarantee**: Messages are automatically bounded to $\le 160$ standard GSM-7 characters to prevent message concatenation failure across degraded mobile towers.
* **Visual Verification in Dashboard**: The `/broadcast` page features a live keypad phone simulator rendering the exact character count, sender header (`FLASHGUARD-NDRF`), and warning message.

---

## 🔒 Security & CORS

* The dashboard communicates with the backend via REST endpoints with standard JSON headers.
* In development and production, ensure the backend's `ALLOWED_ORIGINS` environment variable includes your dashboard's host URL (e.g. `http://localhost:3000`).

---

## ⚠️ Prototype Notice

> [!CAUTION]
> **Academic Prototype**: FlashGuard AI is an academic prototype engineered for the **Smart India Hackathon (SIH) 2026**. Visualized hazard ratings, alert broadcasts, and simulated keypad SMS messages are for demonstration and evaluation only.
