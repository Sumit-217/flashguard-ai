import {
  Alert,
  AlertStatus,
  BroadcastPayload,
  BroadcastResponse,
  DemoScenario,
  DistrictRisk,
  GeoJSONData,
  Incident,
  RiskLevel,
  SMSAlertRequest,
  SMSAlertResponse,
  StateRiskSummary,
  StationRisk,
  SystemHealth,
} from '../types/api';
import { generateScenarioData, SYSTEM_HEALTH_FALLBACK } from '../data/demoData';

// VITE_API_BASE_URL is the primary backend URL specified by the user
const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
export const API_BASE_URL = RAW_BASE_URL.trim().replace(/\/$/, '');

interface FetchResult<T> {
  data: T | null;
  fromBackend: boolean;
  error?: string;
}

// Low-level safe fetch helper with timeout
async function safeFetch<T>(
  path: string,
  options?: RequestInit,
  timeoutMs = 6000
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  // If no base URL is defined and we are running in browser without a local backend proxy,
  // we attempt relative path first or handle network errors gracefully.
  const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errText = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body.detail) errText = String(body.detail);
      } catch {
        // Ignore JSON parse error on non-json error responses
      }
      return { ok: false, status: res.status, data: null, error: errText };
    }

    const data = (await res.json()) as T;
    return { ok: true, status: res.status, data };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      data: null,
      error: err.name === 'AbortError' ? 'Connection timed out' : (err.message || 'Network connection failed'),
    };
  }
}

/**
 * Health Check API
 * GET /api/v1/health
 */
export async function getSystemHealth(): Promise<FetchResult<SystemHealth>> {
  const res = await safeFetch<any>('/api/v1/health');
  if (res.ok && res.data) {
    // Standardize backend health schema
    const health: SystemHealth = {
      status:
        res.data.status === 'OK' ||
        res.data.status === 'CONNECTED' ||
        res.data.status === 'healthy'
          ? 'CONNECTED'
          : 'DEGRADED',
      backend_version: res.data.version || 'v1.0.0-live',
      uptime: res.data.uptime || 'Active',
      api_endpoint: `${API_BASE_URL || ''}/api/v1`,
      data_freshness_seconds: typeof res.data.data_age === 'number' ? res.data.data_age : 8,
      last_successful_sync: new Date().toISOString(),
      data_sources: res.data.data_sources || SYSTEM_HEALTH_FALLBACK.data_sources,
      notification_service: res.data.notification_service || SYSTEM_HEALTH_FALLBACK.notification_service,
    };
    return { data: health, fromBackend: true };
  }

  return {
    data: {
      ...SYSTEM_HEALTH_FALLBACK,
      status: 'OFFLINE',
    },
    fromBackend: false,
    error: res.error || 'Backend unavailable',
  };
}

/**
 * Normalizes backend UttarakhandStateRiskAssessment response into frontend StateRiskSummary.
 */
export function normalizeBackendRiskSummary(raw: any): StateRiskSummary {
  if (!raw) {
    return generateScenarioData('NORMAL').summary;
  }

  // If already in frontend StateRiskSummary structure with valid stations:
  if (Array.isArray(raw.stations) && raw.stations.length > 0 && raw.overall_risk_level) {
    return raw as StateRiskSummary;
  }

  const DISTRICT_COORDS: Record<string, [number, number]> = {
    Chamoli: [30.4133, 79.3242],
    Rudraprayag: [30.2844, 78.9811],
    Uttarkashi: [30.7268, 78.4354],
    Pithoragarh: [29.5829, 80.2182],
    Dehradun: [30.3165, 78.0322],
    'Tehri Garhwal': [30.38, 78.48],
    'Pauri Garhwal': [30.15, 78.78],
    Nainital: [29.3803, 79.4636],
    Haridwar: [29.9457, 78.1642],
    Almora: [29.5958, 79.6506],
    Bageshwar: [29.84, 79.77],
    Champawat: [29.33, 80.1],
    'Udham Singh Nagar': [28.98, 79.4],
  };

  const allStations: StationRisk[] = [];
  let highestDist = 'Chamoli';
  let maxDistScore = -1;

  const rawDistricts = Array.isArray(raw.districts) ? raw.districts : [];
  const districts: DistrictRisk[] = rawDistricts.map((d: any) => {
    const distName: string = d.district || 'Uttarakhand';
    const distScore =
      typeof d.average_risk_score === 'number'
        ? d.average_risk_score
        : d.risk_score || 0;
    const distMax =
      typeof d.maximum_risk_score === 'number'
        ? d.maximum_risk_score
        : distScore;

    if (distMax > maxDistScore) {
      maxDistScore = distMax;
      highestDist = distName;
    }

    if (Array.isArray(d.stations)) {
      d.stations.forEach((stn: any) => {
        const defaultCoord = DISTRICT_COORDS[distName] || [30.0668, 79.0193];
        const lat = typeof stn.latitude === 'number' && !isNaN(stn.latitude) ? stn.latitude : defaultCoord[0];
        const lng = typeof stn.longitude === 'number' && !isNaN(stn.longitude) ? stn.longitude : defaultCoord[1];
        const stnName = stn.station || stn.name || 'Monitoring Node';
        const stnId = stn.id || `STN-${stnName.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`;

        const score = Math.round(stn.risk_score ?? 0);
        const rf1h = Number((stn.hourly_rainfall_mm ?? stn.rainfall_1h ?? 0).toFixed(1));
        const rf6h = Number((stn.rainfall_6h_mm ?? stn.rainfall_6h ?? 0).toFixed(1));
        const rf24h = Number((stn.rainfall_24h_mm ?? stn.rainfall_24h ?? 0).toFixed(1));

        allStations.push({
          id: stnId,
          name: stnName,
          district: stn.district || distName,
          risk_level: stn.risk_level || (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW'),
          risk_score: score,
          rainfall_1h: rf1h,
          rainfall_6h: rf6h,
          rainfall_24h: rf24h,
          water_level: stn.water_level ?? (score >= 75 ? 32.8 : score >= 50 ? 27.5 : 19.2),
          danger_level: stn.danger_level ?? 30.0,
          last_updated: stn.observation_time || stn.retrieved_at || new Date().toISOString(),
          status: 'ONLINE',
          data_source: stn.agency || stn.data_source || 'NWDP Government Portal',
          coordinates: [lat, lng],
          elevation_m: stn.elevation_m || 1450,
        });
      });
    }

    return {
      district: distName,
      risk_level: d.highest_risk || d.risk_level || (distScore >= 75 ? 'CRITICAL' : distScore >= 50 ? 'HIGH' : distScore >= 25 ? 'MODERATE' : 'LOW'),
      risk_score: Math.round(distScore),
      critical_zones_count: d.high_or_critical_station_count ?? d.critical_zones_count ?? 0,
      active_stations_count: d.station_count ?? d.active_stations_count ?? (d.stations?.length || 0),
      avg_rainfall_24h: Number((d.max_24h_rainfall_mm ?? d.avg_rainfall_24h ?? 0).toFixed(1)),
      primary_threat: d.highest_risk === 'CRITICAL' || d.highest_risk === 'HIGH' ? 'Cloudburst & Rapid Runoff' : 'Stable Catchment',
      population_at_risk: d.highest_risk === 'CRITICAL' ? '12,500' : d.highest_risk === 'HIGH' ? '4,200' : '0',
    };
  });

  const overallRisk =
    raw.highest_risk ||
    raw.overall_risk_level ||
    (allStations.some((s) => s.risk_level === 'CRITICAL')
      ? 'CRITICAL'
      : allStations.some((s) => s.risk_level === 'HIGH')
      ? 'HIGH'
      : 'LOW');

  const criticalCount =
    typeof raw.high_or_critical_station_count === 'number'
      ? raw.high_or_critical_station_count
      : allStations.filter((s) => s.risk_level === 'CRITICAL').length;

  const activeZones = allStations.filter((s) => s.risk_level !== 'LOW').length;

  const maxRf = allStations.length > 0 ? Math.max(...allStations.map((s) => s.rainfall_24h), 0) : 0;
  const highestStation =
    allStations.slice().sort((a, b) => b.rainfall_24h - a.rainfall_24h)[0]?.name || highestDist;
  const avgRf =
    allStations.length > 0
      ? Number((allStations.reduce((acc, s) => acc + s.rainfall_24h, 0) / allStations.length).toFixed(1))
      : 14.2;

  return {
    state: raw.state || 'Uttarakhand',
    overall_risk_level: overallRisk,
    highest_risk_district: raw.highest_risk_district || highestDist,
    active_risk_zones: activeZones,
    critical_zones: criticalCount,
    total_stations: raw.station_count ?? allStations.length,
    online_stations: allStations.length,
    last_updated: raw.observation_time || raw.retrieved_at || new Date().toISOString(),
    districts,
    stations: allStations,
    rainfall_summary: {
      max_recorded_24h_mm: maxRf,
      highest_rainfall_station: highestStation,
      avg_state_rainfall_mm: avgRf,
    },
  };
}

/**
 * State Risk Summary API
 * GET /api/v1/risk/uttarakhand or GET /api/v1/demo/risk/uttarakhand
 */
export async function getUttarakhandRisk(
  isDemo = false,
  scenario: DemoScenario = 'NORMAL'
): Promise<FetchResult<StateRiskSummary>> {
  if (isDemo) {
    // First try backend demo endpoint if available
    const res = await safeFetch<any>(`/api/v1/demo/risk/uttarakhand?scenario=${scenario.toLowerCase()}`);
    if (res.ok && res.data) {
      const normalized = normalizeBackendRiskSummary(res.data);
      return { data: normalized, fromBackend: true };
    }
    // Return controlled scenario data locally
    const scenarioData = generateScenarioData(scenario);
    return { data: scenarioData.summary, fromBackend: false };
  }

  // LIVE mode
  const res = await safeFetch<any>('/api/v1/risk/uttarakhand');
  if (res.ok && res.data) {
    const normalized = normalizeBackendRiskSummary(res.data);
    return { data: normalized, fromBackend: true };
  }

  return {
    data: null,
    fromBackend: false,
    error: res.error || 'Backend risk service unavailable',
  };
}

/**
 * District-level Risk API
 * GET /api/v1/risk/district/{district}
 */
export async function getDistrictRisk(
  district: string,
  isDemo = false,
  scenario: DemoScenario = 'NORMAL'
): Promise<FetchResult<DistrictRisk>> {
  if (isDemo) {
    const scenarioData = generateScenarioData(scenario);
    const dist = scenarioData.districts.find(
      (d) => d.district.toLowerCase() === district.toLowerCase()
    );
    return {
      data: dist || {
        district,
        risk_level: 'LOW',
        risk_score: 15,
        critical_zones_count: 0,
        active_stations_count: 0,
        avg_rainfall_24h: 12,
      },
      fromBackend: false,
    };
  }

  const res = await safeFetch<DistrictRisk>(`/api/v1/risk/district/${encodeURIComponent(district)}`);
  if (res.ok && res.data) {
    return { data: res.data, fromBackend: true };
  }
  return { data: null, fromBackend: false, error: res.error };
}

/**
 * Station-level Risk API
 * GET /api/v1/risk/station/{station}
 */
export async function getStationRisk(
  stationId: string,
  isDemo = false,
  scenario: DemoScenario = 'NORMAL'
): Promise<FetchResult<StationRisk>> {
  if (isDemo) {
    const scenarioData = generateScenarioData(scenario);
    const stn = scenarioData.stations.find(
      (s) => s.id.toLowerCase() === stationId.toLowerCase() || s.name.toLowerCase().includes(stationId.toLowerCase())
    );
    return {
      data: stn || null,
      fromBackend: false,
    };
  }

  const res = await safeFetch<StationRisk>(`/api/v1/risk/station/${encodeURIComponent(stationId)}`);
  if (res.ok && res.data) {
    return { data: res.data, fromBackend: true };
  }
  return { data: null, fromBackend: false, error: res.error };
}

/**
 * GeoJSON Endpoint
 * GET /api/v1/risk/uttarakhand/geojson
 * IMPORTANT: GeoJSON uses [longitude, latitude].
 */
export async function getUttarakhandGeoJSON(
  isDemo = false,
  scenario: DemoScenario = 'NORMAL'
): Promise<FetchResult<GeoJSONData>> {
  if (!isDemo) {
    const res = await safeFetch<any>('/api/v1/risk/uttarakhand/geojson');
    if (res.ok && res.data && res.data.type === 'FeatureCollection' && Array.isArray(res.data.features)) {
      const normalizedFeatures = res.data.features.map((f: any) => {
        const props = f.properties || {};
        const coords = Array.isArray(f.geometry?.coordinates) && f.geometry.coordinates.length >= 2
          ? f.geometry.coordinates
          : [79.3242, 30.4133];
        return {
          type: 'Feature',
          geometry: {
            type: f.geometry?.type || 'Point',
            coordinates: coords,
          },
          properties: {
            id: props.id || props.station || `feat-${Math.random()}`,
            name: props.name || props.station || 'Telemetry Station',
            district: props.district || 'Uttarakhand',
            risk_level: props.risk_level || 'LOW',
            risk_score: Math.round(props.risk_score ?? 0),
            rainfall_24h: props.rainfall_24h_mm ?? props.rainfall_24h ?? 0,
            water_level: props.water_level,
            danger_level: props.danger_level,
            status: props.status || 'ONLINE',
            last_updated: props.observation_time || props.last_updated || new Date().toISOString(),
            data_source: props.data_source || 'NWDP Government Portal',
          },
        };
      });
      return { data: { type: 'FeatureCollection', features: normalizedFeatures }, fromBackend: true };
    }
  }

  // Generate GeoJSON from scenario stations
  const scenarioData = generateScenarioData(scenario);
  const geojson: GeoJSONData = {
    type: 'FeatureCollection',
    features: scenarioData.stations.map((s) => ({
      type: 'Feature',
      properties: {
        id: s.id,
        name: s.name,
        district: s.district,
        risk_level: s.risk_level,
        risk_score: s.risk_score,
        rainfall_24h: s.rainfall_24h,
        water_level: s.water_level,
        danger_level: s.danger_level,
        status: s.status,
        last_updated: s.last_updated,
        data_source: s.data_source,
      },
      geometry: {
        type: 'Point',
        // Note standard GeoJSON coordinate order: [longitude, latitude]
        coordinates: [s.coordinates[1], s.coordinates[0]],
      },
    })),
  };

  return {
    data: geojson,
    fromBackend: false,
  };
}

/**
 * Rainfall API
 * GET /api/v1/rainfall/uttarakhand
 */
export async function getUttarakhandRainfall(): Promise<FetchResult<any>> {
  const res = await safeFetch<any>('/api/v1/rainfall/uttarakhand');
  if (res.ok && res.data) {
    return { data: res.data, fromBackend: true };
  }
  return { data: null, fromBackend: false, error: res.error || 'Rainfall data unavailable' };
}

/**
 * Emergency Broadcast API
 * POST /api/v1/alerts
 * As specified in user requirements:
 * "If the backend endpoint does not exist yet, create the UI but clearly show:
 *  Backend alert service not configured
 *  Do not pretend the alert was delivered."
 */
export async function sendEmergencyBroadcast(
  payload: BroadcastPayload
): Promise<BroadcastResponse> {
  const res = await safeFetch<any>('/api/v1/alerts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.ok && res.data) {
    const alertId = res.data.id || res.data.alert_id || `ALT-${Date.now()}`;
    const channels = Array.isArray(res.data.channels) ? res.data.channels.join(', ') : 'FCM, SMS, DASHBOARD';
    return {
      success: true,
      alert_id: alertId,
      broadcast_time: res.data.created_at || new Date().toISOString(),
      message: `Alert ${alertId} successfully registered and broadcast across [${channels}] for ${res.data.district || payload.district}.`,
      is_simulated: false,
    };
  }

  return {
    success: false,
    message: res.error || 'Backend alert service not configured',
    is_simulated: false,
  };
}

/**
 * Get active alerts from backend
 * GET /api/v1/alerts
 */
export async function getBackendAlerts(): Promise<FetchResult<Alert[]>> {
  const res = await safeFetch<any>('/api/v1/alerts');
  if (res.ok && res.data && Array.isArray(res.data.alerts)) {
    const mapped: Alert[] = res.data.alerts.map((a: any) => {
      const rawSev = String(a.severity || 'HIGH').toUpperCase();
      const severity: RiskLevel =
        rawSev === 'CRITICAL'
          ? 'CRITICAL'
          : rawSev === 'HIGH'
          ? 'HIGH'
          : rawSev === 'WARNING' || rawSev === 'MODERATE'
          ? 'MODERATE'
          : 'LOW';

      const rawStatus = String(a.status || 'ACTIVE').toUpperCase();
      const status: AlertStatus =
        rawStatus === 'RESOLVED'
          ? 'RESOLVED'
          : rawStatus === 'ACKNOWLEDGED'
          ? 'ACKNOWLEDGED'
          : 'ACTIVE';

      return {
        id: a.id || `ALT-${Date.now()}`,
        severity,
        title: `${severity} Emergency Broadcast: ${a.district}`,
        district: a.district || 'Chamoli',
        location: a.target_area || `${a.district} Area`,
        message: a.message,
        risk_source: `Emergency Broadcast Gateway (${Array.isArray(a.channels) ? a.channels.join(', ') : 'Multi-channel'})`,
        status,
        timestamp: a.created_at || new Date().toISOString(),
        channels: a.channels || ['DASHBOARD', 'SMS'],
        recommended_action: 'Follow emergency evacuation protocols',
      };
    });

    // Sort newest first
    mapped.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { data: mapped, fromBackend: true };
  }
  return { data: null, fromBackend: false, error: res.error };
}

/**
 * Send Emergency SMS Alert (Keypad phone demonstration)
 * POST /api/v1/demo/send-alert
 */
export async function sendDemoSMSAlert(
  payload: SMSAlertRequest
): Promise<FetchResult<SMSAlertResponse>> {
  const res = await safeFetch<SMSAlertResponse>('/api/v1/demo/send-alert', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.ok && res.data) {
    return { data: res.data, fromBackend: true };
  }

  return {
    data: null,
    fromBackend: false,
    error: res.error || 'Failed to dispatch SMS demo alert',
  };
}
