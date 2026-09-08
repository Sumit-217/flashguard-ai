export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type StationStatus = 'ONLINE' | 'OFFLINE' | 'DEGRADED';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export type IncidentStatus = 'ACTIVE' | 'MONITORING' | 'CONTAINED' | 'RESOLVED';

export type ResponseFacilityType = 'HOSPITAL' | 'POLICE' | 'FIRE' | 'SHELTER' | 'RELIEF' | 'DEOC';

export type DemoScenario = 'NORMAL' | 'ALERT' | 'WARNING' | 'CRITICAL';

export interface StationRisk {
  id: string;
  name: string;
  district: string;
  risk_level: RiskLevel;
  risk_score: number; // 0 - 100
  rainfall_1h: number; // mm
  rainfall_6h: number; // mm
  rainfall_24h: number; // mm
  water_level?: number; // meters
  danger_level?: number; // meters
  last_updated: string; // ISO 8601
  status: StationStatus;
  data_source: string; // e.g. "IMD Automatic Weather Station", "CWC Gauge"
  coordinates: [number, number]; // [lat, lng]
  elevation_m?: number;
}

export interface DistrictRisk {
  district: string;
  risk_level: RiskLevel;
  risk_score: number;
  critical_zones_count: number;
  active_stations_count: number;
  avg_rainfall_24h: number;
  primary_threat?: string;
  population_at_risk?: string;
}

export interface StateRiskSummary {
  state: string;
  overall_risk_level: RiskLevel;
  highest_risk_district: string;
  active_risk_zones: number;
  critical_zones: number;
  total_stations: number;
  online_stations: number;
  last_updated: string;
  districts: DistrictRisk[];
  stations: StationRisk[];
  rainfall_summary?: {
    max_recorded_24h_mm: number;
    highest_rainfall_station: string;
    avg_state_rainfall_mm: number;
  };
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    district: string;
    risk_level: RiskLevel;
    risk_score: number;
    rainfall_24h: number;
    water_level?: number;
    danger_level?: number;
    status: StationStatus;
    last_updated: string;
    data_source: string;
  };
  geometry: {
    type: 'Point' | 'Polygon' | 'MultiPolygon';
    // GeoJSON uses [longitude, latitude]
    coordinates: any;
  };
}

export interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface Alert {
  id: string;
  severity: RiskLevel;
  title: string;
  district: string;
  location?: string;
  message: string;
  risk_source: string;
  status: AlertStatus;
  timestamp: string;
  channels: string[];
  recommended_action?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
}

export interface Incident {
  id: string;
  title: string;
  location: string;
  district: string;
  severity: RiskLevel;
  risk_score: number;
  detected_time: string;
  status: IncidentStatus;
  related_stations: string[];
  description: string;
  evacuation_status?: string;
  deployed_teams?: string[];
  resolved_at?: string;
}

export interface ResponseLocation {
  id: string;
  name: string;
  type: ResponseFacilityType;
  district: string;
  location: string;
  coordinates: [number, number]; // [lat, lng]
  capacity?: string;
  contact: string;
  status: 'OPERATIONAL' | 'STANDBY' | 'ENGAGED';
  is_verified: boolean;
  resource_notes?: string;
}

export interface DataSourceStatus {
  name: string;
  type: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';
  latency_ms: number;
  last_sync: string;
  records_processed: number;
}

export interface SystemHealth {
  status: 'CONNECTED' | 'DEGRADED' | 'OFFLINE';
  backend_version: string;
  uptime: string;
  api_endpoint: string;
  data_freshness_seconds: number;
  last_successful_sync: string;
  data_sources: DataSourceStatus[];
  model_status?: string;
  ingestion_status?: string;
  notification_status?: string;
  database_status?: string;
  timestamp?: string;
  notification_service: {
    status: 'ACTIVE' | 'UNCONFIGURED' | 'DEGRADED';
    fcm_ready: boolean;
    sms_gateway_ready: boolean;
    dashboard_stream_ready: boolean;
  };
}

export interface BroadcastPayload {
  severity: RiskLevel;
  district: string;
  target_area: string;
  message: string;
  channels: ('FCM' | 'SMS' | 'DASHBOARD')[];
}

export interface BroadcastResponse {
  success: boolean;
  alert_id?: string;
  broadcast_time?: string;
  message: string;
  is_simulated?: boolean;
}

export interface SMSAlertRequest {
  phone_number: string;
  location: string;
  risk_level: string;
  risk_score: number;
  disaster_type: string;
}

export interface SMSAlertResponse {
  success: boolean;
  delivery_mode: string;
  recipient: string;
  message: string;
}
