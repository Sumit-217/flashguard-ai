# FlashGuard AI — Development Environment Specification

Welcome to **FlashGuard AI** (SIH 2026)! This document defines the exact development environment setup required for all six team members. 

Our goal is simple: **Clone the repository and prepare your machine without guessing what to install.**

---

## 1. Common Tools (All Members)

These foundational tools are required for every team member to effectively contribute and communicate.

* **Git**: Mandatory. Required for version control.
* **GitHub Account**: Mandatory. Required for opening PRs, reviewing code, and tracking issues.
* **Visual Studio Code (VS Code)**: Recommended standard IDE for the team (lightweight, extensive extensions).
* **Docker Desktop**: Highly recommended (Mandatory for Members 1, 3, 5, 6). Simplifies running the database and message broker without manual OS-level installations.

---

## 2. Flutter Environment (Member 2 - Mobile)

**Role**: Flutter Mobile Application

### Requirements
* **Flutter SDK**: Install the latest stable Flutter SDK. (Note: **Do NOT** install a separate Dart SDK; Flutter includes the compatible Dart SDK automatically).
* **Android Studio**: Required for the Android SDK, Android SDK Platform, and Android Emulator management. You do not have to code in it, but you need it for the toolchain.
* **Android SDK & Build Tools**: Installed via Android Studio SDK Manager.
* **Physical Android Device**: Recommended for testing GPS, Nearby Connections (P2P), and FCM notifications.

### VS Code Extensions
* `Flutter` (Dart is included)

### Verification Commands
```bash
flutter doctor
flutter --version
dart --version
```
*(Ensure `flutter doctor` shows green checkmarks for Flutter, Android toolchain, and VS Code).*

*(Note: Do not initialize the actual Flutter project yet. This will be done in Stage 3).*

---

## 3. Backend Environment (Member 1 - API & DB)

**Role**: FastAPI Backend

### Requirements
* **Python**: Python 3.11+ (Stable LTS).
* **Virtual Environment**: Use Python's built-in `venv` to isolate dependencies. **Do NOT** install project dependencies globally.
* **PostgreSQL Client Tools**: `psql` or pgAdmin / DBeaver for inspecting the database.
* **Docker Desktop**: To run the PostgreSQL/PostGIS container locally.

### Setup & Activation Commands
**Create Virtual Environment:**
```bash
python -m venv .venv
```
**Activate (Windows PowerShell):**
```powershell
.\.venv\Scripts\Activate.ps1
```
**Activate (Windows CMD):**
```cmd
.\.venv\Scripts\activate.bat
```
**Activate (Linux/macOS):**
```bash
source .venv/bin/activate
```

### Verification
```bash
python --version
pip --version
```

*(Note: Do not create the FastAPI application yet. This happens in Stage 2).*

---

## 4. PostgreSQL + PostGIS (Shared Database)

**Strategy**: We strictly use **Docker** for local database development to avoid complicated OS-level PostGIS installations.

* **Image**: `postgis/postgis:15-3.3` (or similar stable tag).
* **Database Name**: `flashguard_dev`
* **Credentials Strategy**: Hard-coding passwords in Git is strictly prohibited. Use environment variables.
* **`.env.example`**: Copy `.env.example` to `.env` to configure your local connection URL.

### Verification
Once Docker is running, verify by connecting via a client (e.g., DBeaver or `psql`):
```bash
psql -h localhost -U postgres -d flashguard_dev
```

---

## 5. AI Environment (Member 4 - Risk Engine)

**Role**: AI Risk Engine and Geospatial processing

### Requirements
* **Python**: Python 3.11+
* **Dependencies**: `pandas`, `numpy`, `scikit-learn`, `geopandas`, `shapely`, `jupyter`.
* **Environment Strategy**: Share the backend Python virtual environment (`.venv`) to ensure absolute compatibility when the AI module is invoked in-process by the backend.

### VS Code Extensions
* `Python`
* `Jupyter`

### Verification
```bash
python -c "import pandas, sklearn, geopandas; print('AI Environment Ready')"
```

*(Note: Do NOT train models or download massive datasets yet. Implementation happens in Stage 4).*

---

## 6. React Dashboard Environment (Member 6 - Admin UI)

**Role**: Admin Dashboard & Integration

### Requirements
* **Node.js**: LTS version (e.g., v20.x).
* **Package Manager**: `npm` (included with Node.js).
* **Frameworks**: React, Vite, TypeScript.

### VS Code Extensions
* `ESLint`
* `Prettier - Code formatter`
* `Tailwind CSS IntelliSense`

### Verification
```bash
node --version
npm --version
```

*(Note: Do NOT initialize the React application yet. This happens in Stage 6).*

---

## 7. Maps Environment (Member 3 - Routing)

**Role**: Maps, GeoJSON, OSRM

### Requirements
* **Tools**: Python (for geospatial scripting), Docker (to run local OSRM eventually), QGIS (optional but highly recommended for viewing GeoJSON locally).
* **Data Handling**: Be prepared to handle OpenStreetMap `.osm.pbf` extracts.

*(Note: Do NOT download massive OSM datasets or deploy OSRM yet. Routing implementation is in Stage 4).*

---

## 8. IoT Environment (Member 5 - Telemetry)

**Role**: ESP32 Firmware & Python Simulation

### Requirements
* **ESP32 IDE**: **Arduino IDE v2**.
  - *Why Arduino IDE?* For a student MVP, Arduino IDE provides the absolute simplest onboarding, easiest library management (PubSubClient for MQTT), and lowest friction for demonstrating hardware capability at a hackathon without the steep learning curve of PlatformIO.
* **Drivers**: CP210x / CH340 USB drivers for ESP32 serial communication.
* **MQTT Broker**: Eclipse Mosquitto (run via Docker).
* **Python**: To develop the fallback IoT Simulator script.

### Verification
* Connect ESP32 via USB and verify it appears in the Arduino IDE COM port list.
* Run `docker run -p 1883:1883 eclipse-mosquitto` to verify broker availability.

---

## 9. P2P Development Environment

**Role**: Offline Mesh Communication

### Requirements
* **Hardware**: At least **TWO physical Android devices** (Nearby Connections / Wi-Fi Direct cannot be reliably tested on emulators).
* **Cables**: High-quality data cables for concurrent USB debugging.

*(Note: Do NOT begin P2P implementation yet).*

---

## 10. Firebase (Push Notifications)

**Strategy**: FCM requires `google-services.json` (Android) and `firebase-adminsdk.json` (Backend).
* **SENSITIVE FILES**: These files contain production/development credentials and must **NEVER** be committed to Git. They are explicitly excluded in `.gitignore` (covered under `*.json` or specific paths when initialized).
* **Configuration**: A Firebase Project will be created later by the team lead, and keys distributed securely (e.g., via a secure team chat, NOT GitHub).

---

## 11. SMS Development Environment

**Constraint**: Only **ONE keypad phone** is required for the SIH prototype.
* **Provider**: Abstract interface. We will not select a specific provider (e.g., Twilio, Fast2SMS) until Stage 5 to optimize free trial credits.
* **Credentials**: API keys for the SMS gateway will eventually reside in the `.env` file. They must NEVER enter Git.

---

## 12. Docker Strategy

* **Usage**: Docker is used strictly for stateful services (`PostgreSQL/PostGIS`, `Mosquitto MQTT`, `OSRM`).
* **Avoid**: We are NOT using Kubernetes, and we are NOT dockerizing the Flutter app or compiling the backend into microservices at this stage. Keep it simple using `docker-compose.yml`.

---

## 13. Environment Variables

We use an `.env.example` file located in the repository root.
* **Action Required**: Every developer copies `.env.example` to a new file named `.env`.
* **Important**: `.gitignore` is configured to ignore `.env`. Do NOT modify `.gitignore` to track it.
* **Placeholders**: Contains placeholders for `DATABASE_URL`, `JWT_SECRET`, `FCM_PROJECT_ID`, `SMS_API_KEY`, etc.

---

## 14. IDE Configuration (VS Code)

**Recommended Extensions:**
* `Flutter` & `Dart` (Member 2)
* `Python` & `Pylance` (Members 1, 4, 5)
* `ESLint` & `Prettier` (Member 6)
* `Docker` (Members 1, 3, 5, 6)
* `GitHub Pull Requests and Issues` (All Members)

---

## 15. Windows Support

* The team develops primarily on **Windows**.
* **Terminals**: Use **PowerShell** or **CMD**.
* **WSL2**: While WSL2 is great, it is **not mandatory** unless you prefer it for Docker execution or specific Python libraries. The project is designed to run natively on Windows to reduce setup friction.

---

## 16. Minimum Hardware Requirements

* **RAM**: Minimum 8GB (16GB highly recommended for running Docker + Android Studio Emulator concurrently).
* **Storage**: 20GB free space (Android SDK, Docker Images, and Flutter take significant space).
* **CPU**: Quad-core processor with Virtualization enabled in BIOS (required for Android Emulator and Docker).
* **Peripherals**: Android testing device and data-capable USB cable.
* **IoT Hardware**: ESP32 development board (Member 5).

---

## 17. Environment Verification Checklist

Use this checklist to ensure your machine is ready before we proceed to Stage 1.

| Tool | Verification Command / Action | Required For |
| :--- | :--- | :--- |
| **Git** | `git --version` | All Members |
| **VS Code** | Launch VS Code | All Members |
| **Python** | `python --version` | Members 1, 4, 5 |
| **Node / npm**| `node --version` && `npm --version` | Member 6 |
| **Flutter** | `flutter doctor` | Member 2 |
| **Docker** | `docker info` | Members 1, 3, 5, 6 |
| **Hardware** | Connect Android / ESP32 via USB | Members 2, 5 |
| **.env File** | Confirm `.env` exists locally (not in git) | All Members |

*(End of Development Environment Specification).*
