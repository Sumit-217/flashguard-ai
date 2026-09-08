import React from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bell,
  Clock,
  Compass,
  Droplets,
  Eye,
  Layers,
  MapPin,
  Maximize2,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { Alert, GeoJSONData, Incident, StateRiskSummary, StationRisk, SystemHealth } from '../types/api';
import { StatsCards } from '../components/cards/StatsCards';
import { RiskMap } from '../components/maps/RiskMap';
import { RiskBadge } from '../components/common/RiskBadge';
import { DashboardPage } from '../components/layout/Sidebar';

interface OverviewPageProps {
  summary: StateRiskSummary | null;
  geoData: GeoJSONData | null;
  health: SystemHealth | null;
  incidents: Incident[];
  alerts: Alert[];
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (page: DashboardPage) => void;
  onSelectStation: (station: StationRisk) => void;
  isDemo: boolean;
  onToggleDemo: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  summary,
  geoData,
  health,
  incidents,
  alerts,
  loading,
  onRefresh,
  onNavigate,
  onSelectStation,
  isDemo,
  onToggleDemo,
}) => {
  const activeAlerts = alerts
    .filter((a) => a.status === 'ACTIVE')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto select-none">
      {/* Top Action & Subheader Bento Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <h1 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white font-sans">
              COMMAND CENTER — SITUATION OVERVIEW
            </h1>
          </div>
          <span className="text-slate-600 font-mono text-xs hidden md:inline">|</span>
          <span className="text-xs font-mono text-slate-400 hidden md:inline">
            Uttarakhand Disaster Management Operations Desk
          </span>
        </div>

        {/* Buttons: LIVE / DEMO, Refresh, View Alerts, View Risk Map */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDemo}
            className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-colors border ${
              isDemo
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            {isDemo ? '● DEMO MODE ACTIVE' : 'SWITCH TO DEMO'}
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            <Bell className="w-3 h-3 text-amber-400" />
            <span>Alerts ({alerts.filter((a) => a.status === 'ACTIVE').length})</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('map')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/40 text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            <MapPin className="w-3 h-3 text-red-500" />
            <span>Risk Map</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row (Clickable Bento Blocks) */}
      <StatsCards
        summary={summary}
        health={health}
        dataFreshnessSeconds={health?.data_freshness_seconds || 14}
        onNavigateToAlerts={() => onNavigate('alerts')}
        onNavigateToMap={() => onNavigate('map')}
        onNavigateToStations={() => onNavigate('stations')}
        onNavigateToSystem={() => onNavigate('system')}
      />

      {/* Center Bento Grid: Live Risk Map (left 8 cols) + Recent Alerts (right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Embedded Live Risk Map in Bento Container */}
        <div className="lg:col-span-8 bg-[#0a0a0f] border border-white/10 rounded-xl overflow-hidden relative flex flex-col h-[480px]">
          {/* Bento Overlay Tag & Legend on Map */}
          <div className="absolute top-4 left-4 z-[400] flex flex-col gap-1.5 pointer-events-auto">
            <div className="px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded text-[10px] font-bold tracking-wider text-white">
              REGIONAL RISK HEATMAP
            </div>
            <div className="flex gap-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold rounded">
                LOW
              </span>
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[9px] font-bold rounded">
                MOD
              </span>
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-bold rounded">
                HIGH
              </span>
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold rounded">
                CRIT
              </span>
            </div>
          </div>

          {/* Bento Bottom Coordinates Tag */}
          <div className="absolute bottom-4 right-4 z-[400] bg-black/70 backdrop-blur-md px-2.5 py-1.5 border border-white/10 rounded pointer-events-auto">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">
              Uttarakhand Center
            </p>
            <p className="text-[10px] font-mono text-white">30.0668° N, 79.0193° E</p>
          </div>

          {/* Interactive Leaflet Map */}
          <div className="w-full h-full">
            <RiskMap
              stations={summary?.stations || []}
              geoData={geoData}
              onSelectStation={onSelectStation}
              isEmbedded={true}
              onExpandToFullMap={() => onNavigate('map')}
            />
          </div>
        </div>

        {/* Right Column: Recent Alerts Bento Block */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col h-[480px]">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0a0a0f]/40">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              Recent Alerts
            </h3>
            <span className="text-[10px] text-slate-500 font-mono uppercase">LATEST 24H</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                No active emergency alerts recorded.
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onNavigate('alerts')}
                  className="flex gap-3 border-b border-white/5 pb-3 cursor-pointer hover:bg-white/5 p-1.5 rounded transition-colors group"
                >
                  <div
                    className={`w-1 rounded-full shrink-0 ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-600'
                        : alert.severity === 'HIGH'
                        ? 'bg-orange-500'
                        : alert.severity === 'MODERATE'
                        ? 'bg-yellow-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          alert.severity === 'CRITICAL'
                            ? 'text-red-400'
                            : alert.severity === 'HIGH'
                            ? 'text-orange-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {alert.severity} Warning
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-white leading-tight font-medium line-clamp-2">
                      {alert.district}: {alert.message}
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1">
                      <span>{alert.risk_source}</span>
                      <span className="text-slate-400">{alert.recommended_action || 'Monitor basin'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('alerts')}
            className="p-3 w-full bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest border-t border-white/10 transition-colors text-center"
          >
            View All Alerts
          </button>
        </div>
      </div>

      {/* Secondary Bento Grid Row: Catchment Triage, Disasters, Hubs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Catchment & District Risk Triage */}
        <div className="md:col-span-6 bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-xs font-mono">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-red-400" />
              Catchment & District Risk Triage
            </span>
            <button
              type="button"
              onClick={() => onNavigate('stations')}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 uppercase tracking-wider font-bold"
            >
              <span>{summary?.stations?.length || 14} Stations</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {(summary?.districts || []).slice(0, 8).map((dist) => (
              <div
                key={dist.district}
                onClick={() => onNavigate('map')}
                className="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="font-semibold text-white truncate text-xs">{dist.district}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">24h: {dist.avg_rainfall_24h} mm</div>
                </div>
                <div className="mt-2">
                  <RiskBadge level={dist.risk_level} size="sm" score={dist.risk_score} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Incidents Bento Card */}
        <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs mb-3">
              <div className="flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-orange-400" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Incidents ({activeIncidents.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('incidents')}
                className="text-[10px] text-slate-400 hover:text-white uppercase font-bold tracking-wider"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {activeIncidents.length === 0 ? (
                <div className="p-4 bg-white/5 rounded-lg border border-white/5 text-center text-slate-500 text-xs font-mono">
                  No active incidents recorded.
                </div>
              ) : (
                activeIncidents.slice(0, 2).map((inc) => (
                  <div
                    key={inc.id}
                    className="p-2.5 bg-white/5 rounded-lg border border-white/5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs truncate">{inc.location}</span>
                      <RiskBadge level={inc.severity} size="sm" />
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{inc.description}</p>
                    <div className="text-[9px] text-orange-400 font-semibold flex items-center justify-between pt-1 font-mono">
                      <span>STATUS: {inc.status}</span>
                      <span className="text-slate-500">
                        {new Date(inc.detected_time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('broadcast')}
            className="mt-3 w-full py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 text-[10px] font-bold uppercase tracking-widest rounded-md transition-colors flex items-center justify-center gap-1.5"
          >
            <Radio className="w-3 h-3 text-red-500" />
            <span>Emergency Broadcast</span>
          </button>
        </div>

        {/* Response Infrastructure Bento Card */}
        <div className="md:col-span-3 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs mb-3">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Response Hubs
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('response')}
                className="text-[10px] text-slate-400 hover:text-white uppercase font-bold tracking-wider"
              >
                Directory
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-500 text-[9px] font-bold uppercase block tracking-wider">
                  SDRF / RESCUE
                </span>
                <span className="font-bold text-emerald-400 font-mono text-xs">14 QRTs Ready</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-500 text-[9px] font-bold uppercase block tracking-wider">
                  SAFE SHELTERS
                </span>
                <span className="font-bold text-white font-mono text-xs">8 Hubs Open</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-500 text-[9px] font-bold uppercase block tracking-wider">
                  MEDICAL CENT.
                </span>
                <span className="font-bold text-emerald-400 font-mono text-xs">AIIMS + Dist.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-slate-500 text-[9px] font-bold uppercase block tracking-wider">
                  HELPLINES
                </span>
                <span className="font-bold text-blue-400 font-mono text-xs">1070 Active</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-white/5 rounded-lg border border-white/5 mt-3 flex items-center justify-between text-[10px] text-slate-400">
            <span>DEOC Readiness:</span>
            <span className="text-emerald-400 font-mono font-bold">OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry & Broadcast Engine Bento Bar (Matching Design HTML) */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-6">
        <div className="flex-1 flex flex-wrap items-center gap-6 sm:gap-8">
          {/* API Cluster Segmented Bars */}
          <div className="flex flex-col">
            <p className="text-[9px] uppercase text-slate-500 mb-1.5 font-bold tracking-wider">
              API Cluster
            </p>
            <div className="flex gap-1 items-center">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-sm opacity-80" />
              <div className="w-1.5 h-4 bg-emerald-500 rounded-sm opacity-80" />
              <div className="w-1.5 h-4 bg-emerald-500 rounded-sm opacity-80" />
              <div className="w-1.5 h-4 bg-emerald-500 rounded-sm opacity-80" />
              <div className="w-1.5 h-4 bg-emerald-500 rounded-sm opacity-80" />
              <div className="w-1.5 h-4 bg-emerald-500 rounded-sm opacity-20" />
            </div>
          </div>

          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          {/* DB Health */}
          <div className="flex flex-col">
            <p className="text-[9px] uppercase text-slate-500 mb-1 font-bold tracking-wider">
              DB Health
            </p>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {health?.status === 'DEGRADED' ? 'DEGRADED / 48ms' : 'STABLE / 12ms'}
            </span>
          </div>

          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          {/* Broadcast Engine */}
          <div className="flex flex-col">
            <p className="text-[9px] uppercase text-slate-500 mb-1 font-bold tracking-wider">
              Broadcast Engine
            </p>
            <span className="text-xs font-mono text-white font-bold">CONNECTED</span>
          </div>

          <div className="h-8 w-px bg-white/10 hidden md:block" />

          {/* Model Inference */}
          <div className="hidden md:flex flex-col">
            <p className="text-[9px] uppercase text-slate-500 mb-1 font-bold tracking-wider">
              AI Risk Engine
            </p>
            <span className="text-xs font-mono text-slate-300">
              {health?.model_status || 'XGBoost v2.1 Active'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('broadcast')}
            className="px-4 py-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-600/40 text-[10px] font-bold rounded uppercase tracking-widest transition-colors shadow-sm"
          >
            Emergency Broadcast
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-[10px] font-bold rounded uppercase tracking-widest transition-colors shadow-sm"
          >
            Refresh Engine
          </button>
        </div>
      </div>
    </div>
  );
};
