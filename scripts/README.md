# FlashGuard AI — Development & Automation Scripts

> **Shared developer utilities, data preprocessing, and setup automation for SIH 2026.**

---

## 📌 Available Scripts & Tasks

This directory contains cross-module helper scripts to accelerate local development and testing:

* **Setup & Verification**:
  - Validates environment variables from `.env.example`.
  - Verifies local Docker database and Mosquitto connectivity.
* **Geospatial & Seed Scripts**:
  - Seeds Uttarakhand administrative district boundaries and shelter points into PostGIS.
  - Generates initial test polygons for Chamoli, Rudraprayag, and Dehradun.
* **IoT Simulation**:
  - Fallback testing scripts generating continuous water-level readings over MQTT.
