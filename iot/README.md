# FlashGuard AI — IoT Telemetry & Environmental Sensing

> **Hardware telemetry, MQTT broker configurations, and sensor simulation for FlashGuard AI (SIH 2026).**  
> Built with **ESP32**, **Eclipse Mosquitto (MQTT)**, and **Python**.

---

## 📌 Overview

The `iot/` directory contains firmware specifications and simulation scripts for edge environmental monitoring. In the event of sudden river surges or flash floods in Himalayan valleys (e.g. Alaknanda, Mandakini rivers in Uttarakhand), IoT sensor nodes publish telemetry directly to the FlashGuard platform.

---

## 📂 Directory Structure

```text
iot/
├── esp32/       # C++ / Arduino firmware for ESP32 microcontrollers
├── simulator/   # Python fallback simulator publishing realistic sensor telemetry
├── mqtt/        # Mosquitto broker configuration, ACLs, and topics
└── README.md
```

---

## 📡 MQTT Topic Hierarchy

All sensor telemetry follows the standardized MQTT topic contract:

```text
flashguard/sensors/{sensor_id}/readings
```

### Standard Payload Format (JSON)
```json
{
  "sensor_id": "ESP32_JOSHIMATH_01",
  "location": "Joshimath",
  "metric": "water_level",
  "unit": "cm",
  "value": 142.5,
  "timestamp": "2026-09-06T01:00:00Z"
}
```

### Integration Status
* **Implemented**: Payload schemas, topic hierarchies, and directory structures.
* **Planned (Future Scope)**: Running MQTT consumer daemon within the backend to ingest readings into PostgreSQL/PostGIS, check critical river thresholds, and stream updates into the real-time AI risk evaluation pipeline.
