import React from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Clock,
  Radio,
  Server,
  Shield,
  Zap,
} from 'lucide-react';
import { StateRiskSummary, SystemHealth } from '../../types/api';
import { RiskBadge } from '../common/RiskBadge';

interface StatsCardsProps {
  summary: StateRiskSummary | null;
  health: SystemHealth | null;
  dataFreshnessSeconds: number;
  onNavigateToStations?: () => void;
  onNavigateToAlerts?: () => void;
  onNavigateToMap?: () => void;
  onNavigateToSystem?: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  summary,
  health,
  dataFreshnessSeconds,
  onNavigateToStations,
  onNavigateToAlerts,
  onNavigateToMap,
  onNavigateToSystem,
}) => {
  const overallRisk = summary?.overall_risk_level || 'LOW';
  const criticalCount = summary?.critical_zones || 0;
  const activeZones = summary?.active_risk_zones || 0;
  const totalStations = summary?.total_stations || 14;
  const onlineStations = summary?.online_stations || 14;
  const highestDistrict = summary?.highest_risk_district || 'Chamoli';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 select-none">
      {/* 1. Overall System Status */}
      <div
        onClick={onNavigateToSystem}
        className="bg-white/5 border border-white/10 hover:border-white/25 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all group shadow-sm"
      >
        <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 font-sans">
          <span>System Health</span>
          <Server className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>
        <div className="my-1.5 flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'CONNECTED'
                  ? 'bg-emerald-400'
                  : health?.status === 'DEGRADED'
                  ? 'bg-amber-400'
                  : 'bg-red-500'
              }`}
            />
            <h2 className="text-xl font-bold font-mono text-white tracking-wide">
              {health?.status || 'ONLINE'}
            </h2>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Uptime {health?.uptime || '99.9%'}</span>
          <span className="text-emerald-400 font-mono">12ms API</span>
        </div>
      </div>

      {/* 2. Highest Risk Level */}
      <div
        onClick={onNavigateToMap}
        className={`border rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all group shadow-sm ${
          overallRisk === 'CRITICAL'
            ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
            : overallRisk === 'HIGH'
            ? 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50'
            : overallRisk === 'MODERATE'
            ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50'
            : 'bg-white/5 border-white/10 hover:border-white/25'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 font-sans">
          <span>Highest Risk</span>
          <AlertTriangle className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>
        <div className="my-1">
          <RiskBadge level={overallRisk} size="md" showPulse />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Sector:</span>
          <span className="text-slate-200 font-semibold truncate ml-1">{highestDistrict}</span>
        </div>
      </div>

      {/* 3. Critical Zones */}
      <div
        onClick={onNavigateToAlerts}
        className={`border rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all group shadow-sm ${
          criticalCount > 0
            ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
            : 'bg-white/5 border-white/10 hover:border-white/25'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 font-sans">
          <span>Critical Zones</span>
          <AlertOctagon
            className={`w-3.5 h-3.5 ${
              criticalCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'
            }`}
          />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <h2
            className={`text-3xl font-bold font-mono ${
              criticalCount > 0 ? 'text-red-400' : 'text-white'
            }`}
          >
            {criticalCount}
          </h2>
          <span
            className={`text-[10px] uppercase font-bold ${
              criticalCount > 0 ? 'text-red-400' : 'text-slate-500'
            }`}
          >
            {criticalCount > 0 ? 'Red Alert' : 'Normal'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          {criticalCount > 0 ? 'Requires immediate action' : 'Basins stable'}
        </div>
      </div>

      {/* 4. Active Risk Zones */}
      <div
        onClick={onNavigateToMap}
        className="bg-white/5 border border-white/10 hover:border-white/25 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all group shadow-sm"
      >
        <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 font-sans">
          <span>Active Basins</span>
          <Shield className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <h2 className="text-3xl font-bold font-mono text-white">
            {activeZones}
          </h2>
          <span className="text-[10px] font-mono text-amber-400 uppercase">
            Catchments
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          Monitored hydro basins
        </div>
      </div>

      {/* 5. Telemetry Sensors Online */}
      <div
        onClick={onNavigateToStations}
        className="bg-white/5 border border-white/10 hover:border-white/25 rounded-xl p-4 flex flex-col justify-between cursor-pointer transition-all group shadow-sm"
      >
        <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 font-sans">
          <span>Sensors Online</span>
          <Activity className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <h2 className="text-3xl font-bold font-mono text-white">
            {onlineStations}
            <span className="text-slate-600 text-lg ml-0.5">/{totalStations}</span>
          </h2>
          <span className="text-[10px] font-mono text-emerald-400">
            {Math.round((onlineStations / Math.max(totalStations, 1)) * 100)}% OK
          </span>
        </div>
        <div className="text-[10px] text-slate-400">
          IMD, CWC & IoT Nodes
        </div>
      </div>

      {/* 6. Data Freshness */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 font-sans">
          <span>Telemetry Stream</span>
          <Clock className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="my-1 flex items-baseline justify-between">
          <h2 className="text-3xl font-bold font-mono text-white">
            {dataFreshnessSeconds}
            <span className="text-xs font-sans text-slate-400 ml-1 font-normal">s</span>
          </h2>
          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </div>
        </div>
        <div className="text-[10px] text-slate-400">
          FastAPI poll cycle active
        </div>
      </div>
    </div>
  );
};
