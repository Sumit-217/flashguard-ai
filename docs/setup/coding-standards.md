# FlashGuard AI — Coding Conventions & Project Standards

This document defines the strict development standards for the **FlashGuard AI (SIH 2026)** team. Because six members are working across different technologies (Flutter, React, Python, PostGIS), following these unified conventions is critical.

---

## 1. General Principles

* **Keep Code Simple**: Prefer readability over cleverness.
* **Single Responsibility Principle**: Functions/classes should do one thing well.
* **No Logic Duplication**: Keep logic in its designated module based on the system architecture.
* **Respect Contracts**: Do not bypass defined API, DB, or MQTT contracts.
* **No Secrets in Code**: Never commit passwords, tokens, or API keys.
* **No Generated Code**: Do not commit build files unless explicitly required.
* **Document the WHY**: Comments should explain non-obvious reasoning, not obvious syntax.

---

## 2. Language-Specific Standards

### Python (Backend, AI, IoT Simulator)
* **Style**: PEP 8.
* **Typing**: Use standard Python type hints for all function signatures.
* **Naming**:
  - `snake_case` for variables, functions, and files.
  - `PascalCase` for classes.
  - `UPPER_SNAKE_CASE` for constants.
* **Formatting/Linting**: Use **Ruff** for fast linting and formatting.
* **Testing**: Use **Pytest**.

*Example:*
```python
MAX_RISK_SCORE = 1.0


class RiskAssessment:
    def calculate_risk_score(self, water_level: float) -> float:
        pass
```

### Flutter & Dart (Mobile App)
* **Architecture**: Riverpod (strict UI / Business Logic separation). Do not place DB/Network logic inside Widgets.
* **Naming**:
  - `lowerCamelCase` for variables and functions.
  - `PascalCase` for classes, widgets, and enums.
  - `snake_case` for filenames (`risk_zone_card.dart`).
* **Formatting/Linting**: Use `dart format` and `flutter analyze`.

*Example:*
```dart
class RiskZoneCard extends StatelessWidget {}

final riskScore = 0.87;

Future<void> fetchRiskZones() async {}
```

### React & TypeScript (Admin Dashboard)
* **Typing**: TypeScript strict mode. Avoid `any` unless documented.
* **Naming**:
  - `camelCase` for variables and functions.
  - `PascalCase` for components and classes.
  - `PascalCase.tsx` for React components (`RiskMap.tsx`).
  - `camelCase.ts` for utilities and services (`alertService.ts`).
* **Formatting/Linting**: Use **ESLint** and **Prettier**.

---

## 3. API & JSON Conventions

### REST API Naming
All endpoints start with `/api/v1/`. Use lowercase, plural nouns, and kebab-case.
* **Correct**: `GET /api/v1/risk-zones`, `GET /api/v1/shelters/nearby`
* **Incorrect**: `/getRiskZones`, `/disasterList`

### JSON Formatting
API request and response payloads strictly use **`snake_case`**. Do not mix casing.
```json
{
  "risk_score": 0.87,
  "risk_level": "HIGH",
  "created_at": "2026-09-01T12:30:00Z"
}
```

---

## 4. Database & Geospatial Naming (PostgreSQL)

* **Tables**: `snake_case` and plural (e.g., `users`, `disasters`, `sensor_readings`).
* **Columns**: `snake_case` (e.g., `water_level`).
* **Primary Key**: `id`
* **Foreign Keys**: `[table_singular]_id` (e.g., `disaster_id`).
* **Timestamps**: `created_at`, `updated_at`.

### Geospatial Rule (CRITICAL)
* **System**: WGS84 (`EPSG:4326`).
* **Application level**: `latitude` and `longitude`.
* **GeoJSON representation**: Always `[longitude, latitude]`. Do not silently swap this ordering.

---

## 5. IDs & Timestamps

* **IDs**: Prefer UUIDs for distributed entities (especially Emergency Messages and P2P deduplication). Numeric IDs are acceptable for standard relational data if performance requires it.
* **Timestamps**: All backend systems communicate in **UTC ISO 8601** (e.g., `2026-09-01T12:30:00Z`). Mobile apps convert to local time only for UI display.

---

## 6. Error Handling

Backend errors must follow a standard JSON envelope format:
```json
{
  "error": {
    "code": "RISK_ZONE_NOT_FOUND",
    "message": "No risk zone was found."
  }
}
```
* **Security**: Never expose passwords, secrets, or internal stack traces in API errors.

---

## 7. Security & Privacy Rules

### General Security
* Authentication must use JWTs per the API contract.
* Passwords must be hashed (never stored in plaintext).
* Admin endpoints must verify the `ADMIN` role.
* Mobile: Do not store sensitive credentials in plain SQLite.

### Location Privacy (Core Philosophy)
FlashGuard AI operates in disaster scenarios:
* Do not continuously collect GPS unless a specific feature requires it (saves battery).
* Avoid logging precise user locations in application logs.
* Admin Dashboards should use aggregated/anonymized stats where possible, only exposing direct user location during explicit emergencies.

---

## 8. Logging

Logs must be safe and focused.
* **Allowed**: Request IDs, endpoint names, durations, status codes, sensor IDs, error codes.
* **Prohibited**: Passwords, JWTs, API keys, unnecessary phone numbers, precise user locations.
* **Levels**: `DEBUG`, `INFO`, `WARNING`, `ERROR`. Do not flood production with `DEBUG`.

---

## 9. Testing Strategy

We do not require 100% test coverage for this hackathon prototype, but we require tests for critical functionality:
* **Backend (pytest)**: API validation, core risk logic, database operations.
* **AI (pytest)**: Input validation, risk-score ranges, mapping logic.
* **Flutter**: Core offline-routing logic, repository boundaries.
* **IoT**: MQTT payload parsing and validation.

---

## 10. Pre-Pull Request Checklist

Before submitting a PR to `develop`, developers MUST verify:
- [ ] Code is formatted and Linter passes.
- [ ] Tests pass locally.
- [ ] No secrets are committed.
- [ ] API / Database / MQTT contracts are strictly followed.
- [ ] Documentation updated if appropriate.
- [ ] No unnecessary or undocumented dependencies added.
- [ ] No unrelated changes are included in the PR.

---

## 11. Team-Specific Responsibilities

* **Member 1 (Backend/DB)**: Adhere strictly to FastAPI, PostGIS schemas, and API contracts.
* **Member 2 (Flutter)**: Implement strict Riverpod repository separation and respect offline-first design limits.
* **Member 3 (Maps/Routing)**: Stick to `[lon, lat]` GeoJSON format and OSRM interface limits.
* **Member 4 (AI/Risk)**: Ensure deterministic output from risk-score engines and maintain reproducible Python environments.
* **Member 5 (IoT/Offline)**: Adhere to strict MQTT topics, P2P TTL/hop-count limitations, and keep the SMS provider interface abstract.
* **Member 6 (Dashboard)**: Ensure React TypeScript types perfectly match the backend REST API responses; enforce admin authorization rules.
