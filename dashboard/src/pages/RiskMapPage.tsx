import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Droplets,
  Layers,
  MapPin,
  Maximize2,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
} from 'lucide-react';
import { GeoJSONData, RiskLevel, StationRisk } from '../types/api';
import { RiskMap } from '../components/maps/RiskMap';
import { RiskBadge } from '../components/common/RiskBadge';

interface RiskMapPageProps {
  stations: StationRisk[];
  geoData: GeoJSONData | null;
  onSelectStation: (station: StationRisk) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const RiskMapPage: React.FC<RiskMapPageProps> = ({
  stations,
  geoData,
  onSelectStation,
  onRefresh,
  loading,
}) => {
  const [selectedStationCoords, setSelectedStationCoords] = useState<[number, number] | undefined>(undefined);
  const [selectedListStation, setSelectedListStation] = useState<string | null>(null);

  const criticalCount = stations.filter((s) => s.risk_level === 'CRITICAL').length;
  const highCount = stations.filter((s) => s.risk_level === 'HIGH').length;
  const moderateCount = stations.filter((s) => s.risk_level === 'MODERATE').length;
  const lowCount = stations.filter((s) => s.risk_level === 'LOW').length;

  const handleStationClickFromList = (stn: StationRisk) => {
    setSelectedListStation(stn.id);
    setSelectedStationCoords(stn.coordinates);
    onSelectStation(stn);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden bg-slate-950">
      {/* Top Map Operational Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="font-bold text-slate-100 uppercase tracking-wider">
              GEOGRAPHICAL DISASTER RISK MAP (UTTARAKHAND)
            </span>
          </div>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden md:inline">
            FastAPI GeoJSON endpoint: <code className="text-slate-300">/api/v1/risk/uttarakhand/geojson</code>
          </span>
        </div>

        {/* Quick Tally Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-300">Critical: <strong className="text-white">{criticalCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-slate-300">High: <strong className="text-white">{highCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-300">Mod: <strong className="text-white">{moderateCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Low: <strong className="text-white">{lowCount}</strong></span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Refresh GeoJSON and telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Layout: Map (Left/Center) + Telemetry Station Drawer (Right) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Leaflet Map Section */}
        <div className="flex-1 h-full min-h-[400px]">
          <RiskMap
            stations={stations}
            geoData={geoData}
            onSelectStation={onSelectStation}
            isEmbedded={false}
            initialCenter={selectedStationCoords}
          />
        </div>

        {/* Side Station Index for Emergency Dispatchers */}
        <div className="w-full md:w-80 bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col shrink-0 h-64 md:h-full">
          <div className="p-3 bg-slate-900 border-b border-slate-800 text-xs font-mono font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              Reporting Stations ({stations.length})
            </span>
            <span className="text-[10px] text-slate-500">SORT BY RISK</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
            {[...stations]
              .sort((a, b) => b.risk_score - a.risk_score)
              .map((station) => (
                <div
                  key={station.id}
                  onClick={() => handleStationClickFromList(station)}
                  className={`p-3 hover:bg-slate-900/80 cursor-pointer transition-colors space-y-1 ${
                    selectedListStation === station.id ? 'bg-slate-800/80 border-l-2 border-red-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-200 truncate">{station.name}</span>
                    <RiskBadge level={station.risk_level} size="sm" score={station.risk_score} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{station.district}</span>
                    <span className="text-blue-400 font-semibold">{station.rainfall_24h} mm (24h)</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>{station.data_source}</span>
                    <span className="text-slate-400 flex items-center gap-0.5 hover:text-white">
                      Inspect <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Quick Coordinate Notice */}
          <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>Leaflet [Lat, Lng] &harr; GeoJSON [Lng, Lat]</span>
            <span className="text-emerald-400 font-semibold">Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};
