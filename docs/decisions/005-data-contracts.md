# ADR 005: Unified System Interfaces, Data Contracts, and Protocols

## Status
**ACCEPTED** (Stage 0.3 — Project Setup)

---

## Context
FlashGuard AI is being developed by a 6-member team for Smart India Hackathon (SIH) 2026. The platform spans Flutter (mobile), FastAPI (backend), PostgreSQL/PostGIS (spatial DB), scikit-learn/GeoPandas (AI/Risk Engine), ESP32/MQTT (IoT telemetry), and React/Vite (Admin Dashboard).

To prevent integration friction, breaking changes, and merge conflicts during Stage 1–6 development, a strict and centralized data contract is required before writing application code.

---

## Decision

1. **Centralized Integration Gateway & Architecture**:
   - The FastAPI backend serves as the single source of truth for database operations and client communication.
   - Flutter and React dashboards never connect directly to PostgreSQL.
   - The **AI/Risk Engine** operates as an internal Python module inside `ai/` imported in-process by the backend (not a separate microservice for MVP).
   - The AI engine calculates risk scores and passes results to the backend; it does not write directly to the DB.

2. **Geospatial & Time Standardization**:
   - Coordinate reference system is strictly **WGS84 (EPSG:4326)**.
   - GeoJSON coordinate ordering is strictly **`[longitude, latitude]`**.
   - REST request/response location objects use explicit **`latitude`** and **`longitude`** floating-point fields.
   - Timestamps are strictly **ISO 8601 in UTC** (e.g. `2026-09-01T12:30:00Z`).

3. **Standardized Enumerations**:
   - `DisasterType`: `FLOOD`, `EARTHQUAKE`, `LANDSLIDE`, `CYCLONE`, `FIRE`, `OTHER`.
   - `RiskLevel`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
   - `AlertPriority`: `LOW`, `NORMAL`, `HIGH`, `CRITICAL`.
   - `EmergencyMessageType`: `NEED_HELP`, `MEDICAL_EMERGENCY`, `TRAPPED`, `NEED_WATER`, `NEED_FOOD`, `SAFE`, `EVACUATING`.
   - `UserRole`: `USER`, `ADMIN`.

4. **MQTT Topic Hierarchy**:
   - Topic: `flashguard/sensors/{sensor_id}/readings`.

5. **P2P Mesh Communication Constraints**:
   - Mandatory `message_id` (UUID) for duplicate drop.
   - `hop_count` limit capped at 5 to avoid infinite loops.
   - `ttl_seconds` to expire stale packets.

6. **Prototype Constraints & Simplifications**:
   - Exactly **ONE keypad feature phone** is supported via an abstract SMS gateway interface (`sendEmergencySms`), with provider selection deferred based on cost/availability during Stage 5.
   - The **Admin Dashboard** relies on standard **REST polling** for live updates during the SIH MVP (WebSocket/SSE streams deferred as future optimizations).

---

## Consequences

- **Positive**: Complete alignment across all 6 developers with zero ambiguity on API endpoints, payload keys, or database column names.
- **Positive**: Frontends (Flutter and React) can begin mocking API responses immediately without waiting for complete backend logic.
- **Rule**: Breaking contract modifications require a team review and pull request.
