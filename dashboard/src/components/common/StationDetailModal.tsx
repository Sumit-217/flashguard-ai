import React from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Droplets,
  ExternalLink,
  MapPin,
  Radio,
  X,
} from 'lucide-react';
import { StationRisk } from '../../types/api';
import { RiskBadge } from './RiskBadge';

interface StationDetailModalProps {
  station: StationRisk | null;
  onClose: () => void;
  onOpenBroadcast?: (district: string) => void;
  onViewOnMap?: (coordinates: [number, number]) => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  onClose,
  onOpenBroadcast,
  onViewOnMap,
}) => {
  if (!station) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-red-500" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 font-semibold">{station.id}</span>
                <RiskBadge level={station.risk_level} size="sm" score={station.risk_score} showPulse />
              </div>
              <h3 className="text-base font-bold text-slate-100 font-mono mt-0.5">{station.name}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs font-mono">
          {/* Key Geographic & Source Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">District</span>
              <span className="text-slate-200 font-bold">{station.district}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Telemetry Source</span>
              <span className="text-slate-300 font-medium truncate block" title={station.data_source}>
                {station.data_source}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Status</span>
              <span
                className={`font-semibold ${
                  station.status === 'ONLINE' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                ● {station.status}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Coordinates</span>
              <span className="text-slate-300 font-mono">
                {station.coordinates[0].toFixed(4)}°N, {station.coordinates[1].toFixed(4)}°E
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Elevation</span>
              <span className="text-slate-300">{station.elevation_m || 1200} m MSL</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Observation Time</span>
              <span className="text-slate-300">
                {new Date(station.last_updated).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Rainfall Readings */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              Precipitation Telemetry
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-slate-500 text-[10px] block">LAST 1 HOUR</span>
                <span className="text-base font-bold text-blue-400">{station.rainfall_1h}</span>
                <span className="text-[10px] text-slate-500 ml-1">mm</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-slate-500 text-[10px] block">LAST 6 HOURS</span>
                <span className="text-base font-bold text-blue-400">{station.rainfall_6h ?? (station.rainfall_1h * 3).toFixed(1)}</span>
                <span className="text-[10px] text-slate-500 ml-1">mm</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-center">
                <span className="text-slate-500 text-[10px] block">24H CUMULATIVE</span>
                <span className="text-base font-bold text-blue-400">{station.rainfall_24h}</span>
                <span className="text-[10px] text-slate-500 ml-1">mm</span>
              </div>
            </div>
          </div>

          {/* Hydrological Stage (if available) */}
          {station.water_level !== undefined && station.danger_level !== undefined && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-400 uppercase tracking-wider">
                  River Stage vs Danger Threshold
                </span>
                <span
                  className={`font-bold ${
                    station.water_level >= station.danger_level ? 'text-red-400' : 'text-slate-300'
                  }`}
                >
                  {station.water_level >= station.danger_level
                    ? 'CRITICAL: ABOVE DANGER MARK'
                    : 'WITHIN BUFFER'}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="flex justify-between mb-1.5 text-[11px]">
                  <span>Current: <strong className="text-white">{station.water_level}m</strong></span>
                  <span>Danger Mark: <strong className="text-red-400">{station.danger_level}m</strong></span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      station.water_level >= station.danger_level ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((station.water_level / (station.danger_level * 1.05)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Operational Advisory */}
          <div className="p-3 rounded bg-slate-950/60 border border-slate-800 text-slate-300">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">
              Early Warning Status
            </span>
            <p className="mt-1 leading-relaxed">
              {station.risk_level === 'CRITICAL'
                ? 'High probability of torrential flash flood or sudden river breach. Automated siren triggers armed. Field verification recommended.'
                : station.risk_level === 'HIGH'
                ? 'Sustained rain may saturate upper slopes causing debris flow. Road authorities alerted for NH corridor blocks.'
                : station.risk_level === 'MODERATE'
                ? 'Moderate catchment runoff. Continuous hydrological telemetry logging every 15 minutes.'
                : 'Hydrological and meteorological indicators are stable within seasonal normal thresholds.'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onViewOnMap && (
              <button
                type="button"
                onClick={() => {
                  onViewOnMap(station.coordinates);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>View on Map</span>
              </button>
            )}
            {onOpenBroadcast && (
              <button
                type="button"
                onClick={() => {
                  onOpenBroadcast(station.district);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-mono transition-colors"
              >
                <Radio className="w-3.5 h-3.5 text-red-400" />
                <span>Issue Alert for {station.district}</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
