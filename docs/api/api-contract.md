# FlashGuard AI — API Specification & Data Contract

**Base URL**: `/api/v1`  
**Protocol**: HTTPS  
**Content-Type**: `application/json`  
**Current Version**: `v1.0.0` (Stage 0.3 Setup)

---

## 1. Global Conventions

### 1.1 Timestamp Standard
- All timestamps MUST adhere to **ISO 8601 UTC** format with explicit `Z` suffix.
- Example: `"2026-09-01T12:30:00Z"`

### 1.2 Geospatial Coordinate Standard
- Coordinate System: **WGS84 (EPSG:4326)**.
- **REST Object Fields**: Explicit latitude & longitude fields:
  ```json
  {
    "latitude": 30.3165,
    "longitude": 78.0322
  }
  ```
- **GeoJSON Payloads**: Standard GeoJSON coordinate order is strictly **`[longitude, latitude]`**:
  ```json
  {
    "type": "Point",
    "coordinates": [78.0322, 30.3165]
  }
  ```

### 1.3 Standard Error Format
All 4xx and 5xx responses MUST return the standardized error object:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested risk zone was not found.",
    "details": {
      "resource_id": "ZONE_001"
    },
    "timestamp": "2026-09-01T12:30:00Z"
  }
}
```

#### Common HTTP Status Codes
| Code | Status | Description |
| :--- | :--- | :--- |
| `200` | OK | Successful retrieval or general request. |
| `201` | Created | Successful resource creation. |
| `400` | Bad Request | Malformed JSON or invalid payload syntax. |
| `401` | Unauthorized | Missing, invalid, or expired JWT token. |
| `403` | Forbidden | User lacks necessary role permissions (e.g. non-admin accessing admin API). |
| `404` | Not Found | Requested entity does not exist. |
| `422` | Unprocessable Entity | Pydantic validation error on request fields. |
| `500` | Internal Server Error | Unhandled server or database exception. |

---

## 2. Standard Enumerations

### 2.1 Disaster Type (`DisasterType`)
```text
FLOOD
EARTHQUAKE
LANDSLIDE
CYCLONE
FIRE
OTHER
```

### 2.2 Risk Level (`RiskLevel`)
```text
LOW
MEDIUM
HIGH
CRITICAL
```

### 2.3 Alert Priority (`AlertPriority`)
```text
LOW
NORMAL
HIGH
CRITICAL
```

### 2.4 Emergency Message Type (`EmergencyMessageType`)
```text
NEED_HELP
MEDICAL_EMERGENCY
TRAPPED
NEED_WATER
NEED_FOOD
SAFE
EVACUATING
```

### 2.5 User Role (`UserRole`)
```text
USER
ADMIN
```

---

## 3. Authentication & Authorization

All protected endpoints require an `Authorization` header containing a valid Bearer JWT:
```http
Authorization: Bearer <access_token>
```

---

## 4. API Endpoints & Contract Examples

### 4.1 Authentication (`/auth`)

#### 4.1.1 Register User
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/register`
- **Request**:
```json
{
  "name": "Jane Doe",
  "phone_number": "+919876543210",
  "password": "SecurePassword123!",
  "role": "USER"
}
```
- **Response** (`201 Created`):
```json
{
  "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "name": "Jane Doe",
  "phone_number": "+919876543210",
  "role": "USER",
  "created_at": "2026-09-01T12:30:00Z"
}
```

#### 4.1.2 Login User
- **Method**: `POST`
- **Endpoint**: `/api/v1/auth/login`
- **Request**:
```json
{
  "phone_number": "+919876543210",
  "password": "SecurePassword123!"
}
```
- **Response** (`200 OK`):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "name": "Jane Doe",
    "phone_number": "+919876543210",
    "role": "USER"
  }
}
```

---

### 4.2 Users (`/users`)

#### 4.2.1 Get Current User Profile
- **Method**: `GET`
- **Endpoint**: `/api/v1/users/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
```json
{
  "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "name": "Jane Doe",
  "phone_number": "+919876543210",
  "role": "USER",
  "created_at": "2026-09-01T12:30:00Z",
  "updated_at": "2026-09-01T12:30:00Z"
}
```

#### 4.2.2 Update Current User
- **Method**: `PUT`
- **Endpoint**: `/api/v1/users/me`
- **Request**:
```json
{
  "name": "Jane Doe Updated"
}
```
- **Response** (`200 OK`):
```json
{
  "id": "usr_9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "name": "Jane Doe Updated",
  "phone_number": "+919876543210",
  "role": "USER",
  "updated_at": "2026-09-01T12:35:00Z"
}
```

---

### 4.3 Disasters (`/disasters`)

#### 4.3.1 List Active Disasters
- **Method**: `GET`
- **Endpoint**: `/api/v1/disasters?status=ACTIVE`
- **Response** (`200 OK`):
```json
[
  {
    "id": "dis_a1b2c3d4",
    "type": "FLOOD",
    "title": "Monsoon Flash Flood Warning - Dehradun Basin",
    "description": "Rising river water levels detected near Rispana river basin following 120mm rainfall.",
    "severity": "HIGH",
    "status": "ACTIVE",
    "source": "IMD / IoT Sensor Telemetry",
    "location": {
      "type": "Point",
      "coordinates": [78.0322, 30.3165]
    },
    "start_time": "2026-09-01T10:00:00Z",
    "end_time": null,
    "created_at": "2026-09-01T10:05:00Z",
    "updated_at": "2026-09-01T12:00:00Z"
  }
]
```

#### 4.3.2 Create Disaster Event (Admin Only)
- **Method**: `POST`
- **Endpoint**: `/api/v1/disasters`
- **Request**:
```json
{
  "type": "FLOOD",
  "title": "Monsoon Flash Flood Warning - Dehradun Basin",
  "description": "Rising river water levels detected near Rispana river basin.",
  "severity": "HIGH",
  "status": "ACTIVE",
  "source": "IMD / IoT Sensor Telemetry",
  "location": {
    "type": "Point",
    "coordinates": [78.0322, 30.3165]
  },
  "start_time": "2026-09-01T10:00:00Z"
}
```
- **Response** (`201 Created`): Returns created disaster object.

---

### 4.4 Risk Zones (`/risk-zones`)

#### 4.4.1 Get Nearby Risk Zones
- **Method**: `GET`
- **Endpoint**: `/api/v1/risk-zones/nearby?latitude=30.3165&longitude=78.0322&radius_km=10`
- **Response** (`200 OK`):
```json
[
  {
    "id": "zone_001",
    "disaster_id": "dis_a1b2c3d4",
    "risk_level": "HIGH",
    "risk_score": 0.87,
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [78.0200, 30.3100],
          [78.0400, 30.3100],
          [78.0400, 30.3300],
          [78.0200, 30.3300],
          [78.0200, 30.3100]
        ]
      ]
    },
    "created_at": "2026-09-01T10:30:00Z",
    "updated_at": "2026-09-01T12:00:00Z"
  }
]
```

---

### 4.5 Shelters & Hospitals (`/shelters`)

#### 4.5.1 Get Nearby Shelters
- **Method**: `GET`
- **Endpoint**: `/api/v1/shelters/nearby?latitude=30.3165&longitude=78.0322&radius_km=15`
- **Response** (`200 OK`):
```json
[
  {
    "id": "she_101",
    "name": "Community Relief Center - Sector 4",
    "location": {
      "latitude": 30.3250,
      "longitude": 78.0450
    },
    "capacity": 500,
    "available_capacity": 320,
    "status": "OPEN",
    "contact_number": "+911352000001",
    "distance_meters": 1650.5
  }
]
```

---

### 4.6 Risk-Aware Safe Routing (`/routes`)

#### 4.6.1 Request Safe Evacuation Route
- **Method**: `POST`
- **Endpoint**: `/api/v1/routes`
- **Request**:
```json
{
  "origin": {
    "latitude": 30.3165,
    "longitude": 78.0322
  },
  "destination": {
    "latitude": 30.3450,
    "longitude": 78.0550
  },
  "transport_mode": "foot",
  "avoid_critical_risk": true
}
```
- **Response** (`200 OK`):
```json
{
  "route_id": "rt_8f7e6d5c",
  "origin": { "latitude": 30.3165, "longitude": 78.0322 },
  "destination": { "latitude": 30.3450, "longitude": 78.0550 },
  "total_distance_meters": 4200.0,
  "estimated_duration_seconds": 3150,
  "safety_score": 0.94,
  "max_encountered_risk": "LOW",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [78.0322, 30.3165],
      [78.0380, 30.3210],
      [78.0420, 30.3320],
      [78.0550, 30.3450]
    ]
  },
  "warnings": [
    "Shortest path avoided due to HIGH flood risk on Sector 2 crossing."
  ]
}
```

---

### 4.7 Alerts & Notifications (`/alerts`)

#### 4.7.1 List Active Alerts
- **Method**: `GET`
- **Endpoint**: `/api/v1/alerts?active_only=true`
- **Response** (`200 OK`):
```json
[
  {
    "id": "alt_001",
    "disaster_id": "dis_a1b2c3d4",
    "priority": "CRITICAL",
    "target_zone_id": "zone_001",
    "message": "FLASHGUARD ALERT: Critical flood risk detected in Rispana basin. Move immediately to Community Relief Center.",
    "channel": "FCM",
    "status": "DISPATCHED",
    "created_at": "2026-09-01T12:00:00Z"
  }
]
```

#### 4.7.2 Create / Broadcast Alert (Admin Only)
- **Method**: `POST`
- **Endpoint**: `/api/v1/alerts`
- **Request**:
```json
{
  "disaster_id": "dis_a1b2c3d4",
  "priority": "CRITICAL",
  "target_zone_id": "zone_001",
  "message": "Move to the nearest safe shelter.",
  "channel": "FCM"
}
```
- **Response** (`201 Created`): Returns created alert record.

---

### 4.8 IoT Sensors & Telemetry (`/sensors`)

#### 4.8.1 Ingest Sensor Reading (HTTP Fallback / Simulator)
- **Method**: `POST`
- **Endpoint**: `/api/v1/sensors/readings`
- **Request**:
```json
{
  "sensor_id": "SENSOR_001",
  "sensor_type": "WATER_LEVEL",
  "value": 4.2,
  "unit": "meters",
  "timestamp": "2026-09-01T12:30:00Z"
}
```
- **Response** (`201 Created`):
```json
{
  "reading_id": "rdg_98765",
  "sensor_id": "SENSOR_001",
  "value": 4.2,
  "unit": "meters",
  "status": "ACCEPTED",
  "timestamp": "2026-09-01T12:30:00Z"
}
```

---

### 4.9 Emergency SOS Messages (`/emergency/messages`)

#### 4.9.1 Submit Emergency Message (Online or Mesh Sync)
- **Method**: `POST`
- **Endpoint**: `/api/v1/emergency/messages`
- **Request**:
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
  "hop_count": 2
}
```
- **Response** (`201 Created`):
```json
{
  "message_id": "msg_550e8400-e29b-41d4-a716-446655440000",
  "status": "RECEIVED_AND_QUEUED",
  "created_at": "2026-09-01T12:30:05Z"
}
```

---

### 4.10 SMS Gateway Test Endpoint (`/internal/sms/send-test`)

#### 4.10.1 Send Emergency SMS to Keypad Phone (Test Demo)
- **Method**: `POST`
- **Endpoint**: `/api/v1/internal/sms/send-test`
- **Request**:
```json
{
  "recipient_id": "TEST_KEYPAD_001",
  "phone_number": "+919800000000",
  "message": "FLASHGUARD ALERT: HIGH FLOOD RISK. MOVE TO THE NEAREST SAFE SHELTER."
}
```
- **Response** (`200 OK`):
```json
{
  "status": "SENT",
  "gateway_reference": "sms_gtw_771829",
  "recipient_id": "TEST_KEYPAD_001",
  "timestamp": "2026-09-01T12:30:00Z"
}
```
