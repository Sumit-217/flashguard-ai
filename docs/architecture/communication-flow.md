# FlashGuard AI — Communication Flows & Subsystem Protocols

This document details the exact protocols, payload structures, and message flows between all subsystems in the FlashGuard AI ecosystem.

---

## 1. IoT Sensor Telemetry Stream (IoT ➔ Backend)

### 1.1 MQTT Topic Hierarchy
```text
flashguard/sensors/{sensor_id}/readings
```
*Example:* `flashguard/sensors/SENSOR_001/readings`

### 1.2 MQTT Payload Specification
```json
{
  "sensor_id": "SENSOR_001",
  "sensor_type": "WATER_LEVEL",
  "value": 4.25,
  "unit": "meters",
  "battery_pct": 94,
  "timestamp": "2026-09-01T12:30:00Z"
}
```

### 1.3 Ingestion Flow
```text
[ESP32 / Python Simulator]
          │  MQTT Publish (QoS 1)
          ▼
   [Mosquitto Broker]
          │
          ▼
 [Backend MQTT Consumer]
   ├── 1. Inserts into PostgreSQL `sensor_readings`
   ├── 2. Updates `iot_sensors.last_seen`
   └── 3. Evaluates Thresholds ──▶ [Triggers Risk Engine if critical]
```

---

## 2. AI / Risk Engine Interface (In-Process Python Module in `ai/`)

### 2.1 Backend Input to AI Engine
The backend imports and invokes the AI engine functions in-process, passing an extensible dictionary / Pydantic model of geospatial and environmental sensor metrics:
```json
{
  "disaster_type": "FLOOD",
  "rainfall_mm": 125.0,
  "water_level_m": 4.25,
  "elevation_m": 310.0,
  "distance_to_river_km": 0.45,
  "soil_moisture_pct": 88.0,
  "location": {
    "latitude": 30.3165,
    "longitude": 78.0322
  }
}
```

### 2.2 AI Engine Output to Backend
```json
{
  "risk_score": 0.88,
  "risk_level": "HIGH",
  "confidence": 0.93,
  "recommended_action": "EVACUATE_IMMEDIATELY",
  "model_version": "rf_flood_v1.0"
}
```

---

## 3. Safe Evacuation Routing Flow (Flutter ➔ Backend ➔ OSRM ➔ Risk Filter ➔ Flutter)

```text
[Flutter Client]
       │  POST /api/v1/routes (Origin, Destination, Mode)
       ▼
[FastAPI Backend]
       │
       ├── 1. Query OSRM ──▶ Returns Candidate Route Polylines (A, B, C)
       │
       ├── 2. Spatial Intersection with PostGIS `risk_zones`
       │      • Route A (Shortest): Crosses CRITICAL risk polygon (Cost += 1000)
       │      • Route B (Alternative): Crosses LOW risk polygon (Cost += 10)
       │
       └── 3. Select Safest Route (Route B)
       │
       ▼
[Flutter Client] ◀── Receives Route B GeoJSON + Safety Score (0.94)
```

---

## 4. Emergency Alert Dispatch Flows

```text
                  [Disaster Trigger / Admin Broadcast]
                                  │
                                  ▼
                         [Alert Engine (FastAPI)]
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
         ▼                        ▼                        ▼
    [FCM Service]          [SMS Gateway API]        [Local Cache Sync]
         │                        │                        │
         ▼ (FCM Push)             ▼ (SMS)                  ▼ (SQLite)
   [Smartphones]           [Single Keypad Phone]     [Offline Devices]
```

### 4.1 Push Notification (FCM Data Payload)
```json
{
  "alert_id": "alt_001",
  "priority": "CRITICAL",
  "disaster_type": "FLOOD",
  "risk_level": "CRITICAL",
  "zone_id": "zone_001",
  "title": "FLASHGUARD EMERGENCY ALERT",
  "message": "Critical water level detected. Evacuate immediately to Community Relief Center.",
  "timestamp": "2026-09-01T12:30:00Z"
}
```

### 4.2 SMS Gateway Contract (1 Keypad Phone Demo)
- **Interface**: Abstract adapter (`sendEmergencySms(recipient_id, message)`); concrete provider selection deferred to Stage 5.
- **Target**: Restricted strictly to `TEST_KEYPAD_001`.
- **SMS Body**: `FLASHGUARD ALERT: HIGH FLOOD RISK. MOVE TO NEAREST SAFE SHELTER.`
- **Two-Way SMS Reply Codes**:
  - `1` = `SAFE`
  - `2` = `NEED HELP`
  - `3` = `EVACUATING`

---

## 5. Peer-to-Peer (P2P) Store-and-Forward Mesh Protocol

When cellular/Internet connectivity is unavailable, smartphones use Google Nearby Connections or Wi-Fi Direct to form a multi-hop ad-hoc relay.

```text
[Device A (Offline)] ──▶ [Device B (Offline)] ──▶ [Device C (Online)] ──▶ [Backend API]
     (Creates SOS)          (Relays Message)       (Forwards to Server)
```

### 5.1 P2P Packet Specification
```json
{
  "message_id": "msg_550e8400-e29b-41d4-a716-446655440000",
  "sender_id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "message_type": "TRAPPED",
  "priority": "CRITICAL",
  "location": {
    "latitude": 30.3165,
    "longitude": 78.0322,
    "accuracy_meters": 5.0
  },
  "timestamp": "2026-09-01T12:30:00Z",
  "ttl_seconds": 3600,
  "hop_count": 0,
  "max_hops": 5
}
```

### 5.2 Mesh Relay Rules
1. **Deduplication**: Devices keep an in-memory hash set of seen `message_id`s. Any message already in the set is dropped immediately.
2. **Hop Counter**: Each forwarding node increments `hop_count` by 1. If `hop_count >= max_hops` (default 5), forwarding ceases.
3. **Time-To-Live (TTL)**: Messages older than `timestamp + ttl_seconds` are pruned from local cache.
4. **Internet Uplink**: As soon as any device in the mesh reconnects to the Internet, it batches all cached emergency packets to `POST /api/v1/emergency/messages`.
