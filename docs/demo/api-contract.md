# Demo API Contract — Risk Assessment

> **Regional Focus**: **Uttarakhand, India** (Himalayan disaster-prone corridor)  
> **Agency Reference**: Aligned with Uttarakhand State Disaster Management Authority (USDMA) & IMD Dehradun alerting criteria.  
> **Purpose**: Minimal API contract for the Monday Director Demo.  
> **Unblocking Team Members**: Once this specification is agreed upon, frontend, dashboard, and mobile/IoT members do not need to wait for backend implementation. They can directly use the mock JSON payloads provided below.

---

## 1. Regional Context & Geographic Scope

All demonstration data, simulation feeds, hazard zones, and mock payloads in FlashGuard AI reference **Uttarakhand, India**:

| Location | District | River Basin / Valley | Coordinates | Primary Disaster Profile |
| :--- | :--- | :--- | :--- | :--- |
| **Joshimath** *(Primary Demo)* | Chamoli | Alaknanda / Dhauliganga | `30.5564° N, 79.5678° E` | Flash flood, GLOF, Land subsidence |
| **Kedarnath / Gaurikund** | Rudraprayag | Mandakini River | `30.7346° N, 79.0669° E` | Cloudburst, Flash flood |
| **Dharasu** | Uttarkashi | Bhagirathi River | `30.6322° N, 78.3186° E` | Landslide, Debris flow |
| **Rishikesh** | Dehradun / Tehri | Ganga River Basin | `30.0869° N, 78.2676° E` | Downstream river surge |

---

## 2. Endpoint Overview

- **Endpoint**: `POST /api/v1/demo/risk-assessment`
- **Content-Type**: `application/json`
- **Method**: `POST`

---

## 3. Request Specification

### Payload Format (Uttarakhand Scenario: Joshimath Flash Flood)

```json
{
  "disaster_type": "flood",
  "location": "Joshimath",
  "rainfall": 90,
  "water_level": 85,
  "historical_risk": 70
}
```

### Field Definitions

| Field | Type | Description | Regional Reference (Uttarakhand) |
| :--- | :--- | :--- | :--- |
| `disaster_type` | `string` | Type of natural disaster | `"flood"`, `"landslide"`, `"cloudburst"`, `"earthquake"` |
| `location` | `string` | Target location in Uttarakhand | `"Joshimath"`, `"Kedarnath"`, `"Dharasu"`, `"Rishikesh"` |
| `rainfall` | `number` | Precipitation index / 24h mm | `90` (IMD Uttarakhand Heavy Rain >64.5mm) |
| `water_level` | `number` | River / gauge station percentage | `85` (Above Alaknanda danger mark %) |
| `historical_risk` | `number` | USDMA baseline historical vulnerability score | `70` (0–100 scale; high vulnerability in Chamoli) |

---

## 4. Response Specification

### Payload Format (Critical Alert Triggered)

```json
{
  "risk_score": 84,
  "risk_level": "CRITICAL",
  "disaster_type": "flood",
  "affected_area": "Joshimath",
  "alert": true
}
```

### Field Definitions

| Field | Type | Description | Values / Range |
| :--- | :--- | :--- | :--- |
| `risk_score` | `integer` | Computed composite risk index | `84` (0–100 scale) |
| `risk_level` | `string` | Categorical risk severity | `"LOW"`, `"MEDIUM"`, `"HIGH"`, `"CRITICAL"` |
| `disaster_type` | `string` | Confirmed disaster category | `"flood"` |
| `affected_area` | `string` | Confirmed geographical impact area | `"Joshimath"` |
| `alert` | `boolean` | High-priority emergency broadcast trigger | `true` or `false` |

---

## 5. Mock Scenarios for Parallel Development

Team members can use these exact mock responses representing Uttarakhand regional events:

### Scenario A: Critical Flood Warning — Joshimath (Chamoli)
```json
{
  "risk_score": 84,
  "risk_level": "CRITICAL",
  "disaster_type": "flood",
  "affected_area": "Joshimath",
  "alert": true
}
```

### Scenario B: High Landslide Warning — Dharasu (Uttarkashi)
```json
{
  "risk_score": 72,
  "risk_level": "HIGH",
  "disaster_type": "landslide",
  "affected_area": "Dharasu",
  "alert": true
}
```

### Scenario C: Moderate / Normal Status — Rishikesh (Dehradun)
```json
{
  "risk_score": 38,
  "risk_level": "MEDIUM",
  "disaster_type": "flood",
  "affected_area": "Rishikesh",
  "alert": false
}
```

---

## 6. Implementation Guide by Subsystem

### Dashboard / Frontend Team
- Place the mock JSON in `src/mocks/demoRiskData.json`.
- Bind UI map markers to Uttarakhand coordinates (Joshimath: `[79.5678, 30.5564]`).
- Display regional hazard badge `"CRITICAL"` with alert banner when `alert: true`.

### Android / Mobile Team
- Mock incoming notification payload with `affected_area: "Joshimath"` and `alert: true`.
- Trigger local emergency siren / vibration and offline mesh broadcast for Chamoli district.

### Backend Team (`feature/demo-backend-risk`)
- Implement Pydantic models for `RiskAssessmentRequest` and `RiskAssessmentResponse`.
- Validate against Uttarakhand regional bounds and serve deterministic values for demo presets.
