# FlashGuard AI — Android / Mobile Application

> **Mobile client for FlashGuard AI (SIH 2026)**  
> Built with **Flutter (Dart)**, **Riverpod**, **Drift (SQLite)**, and **Dio**.

---

## 📌 Overview

The mobile application provides individuals and field rescue teams with real-time hazard intelligence, risk-zone alerts, safe evacuation guidance, and resilient communication in disaster scenarios.

### Target Regional Scope
* Primary testing and demonstration region: **Uttarakhand, India** (Chamoli, Rudraprayag, Uttarkashi, Dehradun).

---

## 🛠️ Technology Stack & Architecture

* **Framework**: Flutter (Dart SDK)
* **Architecture**: Riverpod (strict separation of UI from network and repository logic)
* **Local Persistence & Offline Cache**: Drift (SQLite) for caching hazard polygons, safe shelters, and emergency contacts
* **Network Client**: Dio (configured to consume the FastAPI backend at `/api/v1`)
* **Geospatial & Location**: Geolocator (adaptive GPS tracking based on risk proximity)
* **Emergency Alerting**: Firebase Cloud Messaging (FCM) & Flutter Local Notifications
* **Mesh Communication (Offline)**: Google Nearby Connections / Wi-Fi Direct store-and-forward mesh for device-to-device SOS propagation

---

## 📡 Backend Integration Endpoints

The mobile client interacts with the following FastAPI backend endpoints:
* `GET /api/v1/risk/uttarakhand` — Complete state risk assessment and district breakdown.
* `GET /api/v1/risk/uttarakhand/geojson` — Live GeoJSON Point features for map layer overlays.
* `GET /api/v1/demo/risk/uttarakhand` — Deterministic demo fallback for presentations.
* `POST /api/v1/demo/risk-assessment` — Director demo risk evaluation payload.
