import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  DemoScenario,
  GeoJSONData,
  Incident,
  StateRiskSummary,
  SystemHealth,
} from '../types/api';
import {
  getBackendAlerts,
  getSystemHealth,
  getUttarakhandGeoJSON,
  getUttarakhandRisk,
} from '../services/api';
import { generateScenarioData, SYSTEM_HEALTH_FALLBACK } from '../data/demoData';

export interface UseRiskDataReturn {
  isDemo: boolean;
  setIsDemo: (val: boolean) => void;
  scenario: DemoScenario;
  setScenario: (sc: DemoScenario) => void;
  summary: StateRiskSummary | null;
  geoData: GeoJSONData | null;
  health: SystemHealth | null;
  incidents: Incident[];
  alerts: Alert[];
  loading: boolean;
  isBackendOnline: boolean;
  isUsingCachedData: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  refresh: () => Promise<void>;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string) => void;
  acknowledgeIncident: (id: string) => void;
  resolveIncident: (id: string) => void;
}

export function useRiskData(): UseRiskDataReturn {
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [scenario, setScenario] = useState<DemoScenario>('ALERT');

  const [summary, setSummary] = useState<StateRiskSummary | null>(null);
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const [isUsingCachedData, setIsUsingCachedData] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep last known valid summary for offline fallback
  const lastKnownSummary = useRef<StateRiskSummary | null>(null);
  const lastKnownGeo = useRef<GeoJSONData | null>(null);
  const customAlertsRef = useRef<Alert[]>([]);

  // Helper to derive alert stream from state, incidents & backend alerts
  const deriveAlerts = useCallback(
    (currentSummary: StateRiskSummary | null, currentIncidents: Incident[], backendAlerts: Alert[] = []) => {
      // Merge backend alerts with locally created alerts
      const baseMap = new Map<string, Alert>();
      [...backendAlerts, ...customAlertsRef.current].forEach((a) => {
        baseMap.set(a.id, a);
      });

      const derived: Alert[] = Array.from(baseMap.values());

      // Add alerts from incidents
      currentIncidents.forEach((inc) => {
        const alertId = `ALT-${inc.id}`;
        if (!baseMap.has(alertId)) {
          derived.push({
            id: alertId,
            severity: inc.severity,
            title: inc.title,
            district: inc.district,
            location: inc.location,
            message: inc.description,
            risk_source: `Disaster Incident Engine (${inc.related_stations.join(', ') || 'District'})`,
            status: inc.status === 'RESOLVED' ? 'RESOLVED' : inc.status === 'MONITORING' ? 'ACKNOWLEDGED' : 'ACTIVE',
            timestamp: inc.detected_time,
            channels: ['DASHBOARD', 'SMS_QUEUE'],
          });
        }
      });

      // Add alerts for any critical or high stations
      if (currentSummary?.stations) {
        currentSummary.stations
          .filter((s) => s.risk_level === 'CRITICAL' || s.risk_level === 'HIGH')
          .forEach((stn) => {
            const existing = derived.some((d) => d.district === stn.district && d.title.includes(stn.name));
            if (!existing) {
              derived.push({
                id: `ALT-STN-${stn.id}`,
                severity: stn.risk_level,
                title: `${stn.risk_level} Threshold Exceeded: ${stn.name}`,
                district: stn.district,
                location: `${stn.name} (Elev: ${stn.elevation_m || 1000}m)`,
                message: `Rainfall 24h: ${stn.rainfall_24h}mm | 1h: ${stn.rainfall_1h}mm${
                  stn.water_level && stn.danger_level
                    ? ` | River level: ${stn.water_level}m (Danger: ${stn.danger_level}m)`
                    : ''
                }. Rapid runoff triggered.`,
                risk_source: stn.data_source,
                status: 'ACTIVE',
                timestamp: stn.last_updated,
                channels: ['DASHBOARD', 'FCM', 'SMS'],
              });
            }
          });
      }

      // Add a baseline warning if moderate and no alerts
      if (currentSummary?.overall_risk_level === 'MODERATE' && derived.length === 0) {
        derived.push({
          id: 'ALT-SYS-MOD-01',
          severity: 'MODERATE',
          title: `Monsoon Surge Watch - ${currentSummary.highest_risk_district}`,
          district: currentSummary.highest_risk_district,
          message: `Elevated precipitation observed. Continuous river stage monitoring active.`,
          risk_source: 'IMD Synoptic Chart & Catchment Runoff Model',
          status: 'ACTIVE',
          timestamp: new Date().toISOString(),
          channels: ['DASHBOARD'],
        });
      }

      // Sort newest first
      derived.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setAlerts(derived);
    },
    []
  );

  // Primary fetch handler
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Health
      const healthRes = await getSystemHealth();
      setHealth(healthRes.data);

      if (isDemo) {
        // Controlled DEMO Mode
        setIsBackendOnline(healthRes.fromBackend);
        setIsUsingCachedData(false);

        const scenarioData = generateScenarioData(scenario);
        setSummary(scenarioData.summary);
        setIncidents(scenarioData.incidents);
        lastKnownSummary.current = scenarioData.summary;

        const [geoRes, alertsRes] = await Promise.all([
          getUttarakhandGeoJSON(true, scenario),
          getBackendAlerts(),
        ]);
        if (geoRes.data) {
          setGeoData(geoRes.data);
          lastKnownGeo.current = geoRes.data;
        }

        deriveAlerts(scenarioData.summary, scenarioData.incidents, alertsRes.data || []);
        setLastSyncTime(new Date());
      } else {
        // LIVE Mode
        const [riskRes, geoRes, alertsRes] = await Promise.all([
          getUttarakhandRisk(false),
          getUttarakhandGeoJSON(false),
          getBackendAlerts(),
        ]);

        if (riskRes.data) {
          // Real backend returned data
          setSummary(riskRes.data);
          lastKnownSummary.current = riskRes.data;
          setIsBackendOnline(true);
          setIsUsingCachedData(false);

          if (geoRes.data) {
            setGeoData(geoRes.data);
            lastKnownGeo.current = geoRes.data;
          }

          // In live mode, incidents can come from live backend or empty list
          const liveIncidents = (riskRes.data as any).incidents || [];
          setIncidents(liveIncidents);
          deriveAlerts(riskRes.data, liveIncidents, alertsRes.data || []);
          setLastSyncTime(new Date());
        } else {
          // Backend is offline / unreachable in LIVE mode
          setIsBackendOnline(false);
          setError(riskRes.error || 'Backend unavailable');

          if (lastKnownSummary.current) {
            // "Showing last available data" per prompt instructions
            setSummary(lastKnownSummary.current);
            setIsUsingCachedData(true);
            if (lastKnownGeo.current) setGeoData(lastKnownGeo.current);
          } else {
            // First load when backend isn't running yet:
            // Fall back to clean default baseline so dashboard never crashes
            const fallback = generateScenarioData('NORMAL');
            setSummary(fallback.summary);
            setIncidents([]);
            const geoFallback = await getUttarakhandGeoJSON(true, 'NORMAL');
            if (geoFallback.data) setGeoData(geoFallback.data);
            deriveAlerts(fallback.summary, []);
            setIsUsingCachedData(true);
          }
        }
      }
    } catch (err: any) {
      setIsBackendOnline(false);
      setError(err.message || 'System error while fetching telemetry');
      if (lastKnownSummary.current) {
        setIsUsingCachedData(true);
        setSummary(lastKnownSummary.current);
      }
    } finally {
      setLoading(false);
    }
  }, [isDemo, scenario, deriveAlerts]);

  // Initial fetch on mount & whenever mode/scenario switches
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling: Poll important risk data every 30 seconds for live pages
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const acknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' as const, acknowledged_at: new Date().toISOString() } : a))
    );
  };

  const acknowledgeIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'MONITORING' as const } : inc))
    );
  };

  const resolveIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: 'RESOLVED' as const,
              resolved_at: new Date().toISOString(),
            }
          : inc
      )
    );
  };

  const addAlert = useCallback((newAlert: Alert) => {
    customAlertsRef.current = [newAlert, ...customAlertsRef.current.filter((a) => a.id !== newAlert.id)];
    setAlerts((prev) => {
      const merged = [newAlert, ...prev.filter((a) => a.id !== newAlert.id)];
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return merged;
    });
  }, []);

  return {
    isDemo,
    setIsDemo,
    scenario,
    setScenario,
    summary,
    geoData,
    health: health || SYSTEM_HEALTH_FALLBACK,
    incidents,
    alerts,
    loading,
    isBackendOnline,
    isUsingCachedData,
    lastSyncTime,
    error,
    refresh: fetchData,
    addAlert,
    acknowledgeAlert,
    acknowledgeIncident,
    resolveIncident,
  };
}
