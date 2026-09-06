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

## 📂 Directory Structure

```text
android/
├── pubspec.yaml                 # Flutter project configuration & dependencies
├── README.md                    # Mobile application documentation
├── lib/
│   ├── main.dart                # Application entrypoint
│   ├── core/                    # App constants, networking, theme
│   ├── features/                # UI screens (home, alerts, map, route, offline, profile)
│   ├── models/                  # Data models (risk, alerts, shelters, user profile)
│   ├── providers/               # Riverpod state providers
│   └── services/                # API, storage, and local caching services
├── test/
│   └── widget_test.dart         # Flutter widget test suite
└── android/
    └── app/src/main/
        └── AndroidManifest.xml  # Native Android manifest with permissions
```

---

## 🚀 One-Time Setup & Execution

### 1. Generate Platform Boilerplate (If starting fresh)
From within this `android/` folder:
```bash
flutter create --platforms=android --org com.flashguard .
```
> **Note**: If prompted to overwrite `AndroidManifest.xml`, keep the provided file (`android/app/src/main/AndroidManifest.xml`) as it includes required `INTERNET`, `ACCESS_FINE_LOCATION`, and `ACCESS_COARSE_LOCATION` permissions.

### 2. Install Dependencies
```bash
flutter pub get
```

### 3. Connect to Backend
Pass the backend base URL at runtime (or configure in `lib/core/constants/app_constants.dart`):

```bash
# Deployed Render Backend:
flutter run --dart-define=FLASHGUARD_API_BASE_URL=https://flashguard-ai.onrender.com

# Android Emulator (Localhost backend):
flutter run --dart-define=FLASHGUARD_API_BASE_URL=http://10.0.2.2:8000

# Physical Device on LAN:
flutter run --dart-define=FLASHGUARD_API_BASE_URL=http://<YOUR_LAN_IP>:8000
```

---

## 📡 Backend Integration Endpoints

| Screen | Backend Endpoint(s) | Description |
| :--- | :--- | :--- |
| **Dashboard** | `GET /api/v1/risk/uttarakhand` | State-wide composite risk profile. Falls back to `/api/v1/demo/risk/uttarakhand`. |
| **Alerts** | `GET /api/v1/risk/uttarakhand` | Real-time district warnings filtered to `HIGH` and `CRITICAL`. |
| **Risk Map** | `GET /api/v1/risk/uttarakhand/geojson` | GeoJSON RFC 7946 point features for map overlays. |
| **Safe Route** | Local GPS + District Risk Data | Proximity calculation to nearest safe reference zones. |
| **Offline** | On-device Drift cache | Caches risk assessments and emergency contacts when network drops. |
| **SOS / Profile**| `POST /api/v1/alerts` / Admin Webhook | Encrypted profile & GPS emergency broadcast dispatch. |
| **SMS Gateway** | `POST /api/v1/demo/send-alert` | Fallback SMS alert transmission for feature / keypad phones. |

---

## 🔒 Security & Privacy Notes

- User Profile data (name, phone, Aadhaar ID, emergency contacts) is encrypted at rest on-device using `flutter_secure_storage` (`lib/services/profile_storage_service.dart`).
- Location sharing is opt-in, only running actively in foreground during active emergencies.
