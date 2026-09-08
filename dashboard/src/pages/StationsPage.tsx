import React, { useState } from 'react';
import {
  Activity,
  ArrowUpDown,
  CheckCircle2,
  Droplets,
  ExternalLink,
  Eye,
  Filter,
  Radio,
  RadioTower,
  RefreshCw,
  Search,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { RiskLevel, StationRisk, StationStatus } from '../types/api';
import { RiskBadge } from '../components/common/RiskBadge';
import { UTTARAKHAND_DISTRICTS } from '../data/demoData';

interface StationsPageProps {
  stations: StationRisk[];
  onSelectStation: (station: StationRisk) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const StationsPage: React.FC<StationsPageProps> = ({
  stations,
  onSelectStation,
  onRefresh,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StationStatus>('ALL');
  const [sortBy, setSortBy] = useState<'risk_score' | 'rainfall_24h' | 'name'>('risk_score');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredStations = stations
    .filter((stn) => {
      if (districtFilter !== 'ALL' && stn.district !== districtFilter) return false;
      if (riskFilter !== 'ALL' && stn.risk_level !== riskFilter) return false;
      if (statusFilter !== 'ALL' && stn.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = stn.name.toLowerCase().includes(q);
        const matchId = stn.id.toLowerCase().includes(q);
        const matchDist = stn.district.toLowerCase().includes(q);
        const matchSrc = stn.data_source.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDist && !matchSrc) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'risk_score') comparison = b.risk_score - a.risk_score;
      else if (sortBy === 'rainfall_24h') comparison = b.rainfall_24h - a.rainfall_24h;
      else comparison = a.name.localeCompare(b.name);
      return sortAsc ? -comparison : comparison;
    });

  const handleSort = (field: 'risk_score' | 'rainfall_24h' | 'name') => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  const onlineCount = stations.filter((s) => s.status === 'ONLINE').length;
  const offlineCount = stations.filter((s) => s.status === 'OFFLINE').length;
  const maxRainfall = Math.max(...stations.map((s) => s.rainfall_24h), 0);

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto font-mono text-xs">
      {/* Top Header & Tally */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <RadioTower className="w-5 h-5 text-blue-400" />
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              GOVERNMENT & IOT REPORTING STATIONS MONITOR
            </h1>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">
            IMD Automatic Weather Stations, CWC river gauging telemetry, and UKSDMA slope sensor network.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
            ONLINE: <strong className="text-emerald-400">{onlineCount}</strong> / {stations.length}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* District Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px]">District:</span>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">
                All Districts ({UTTARAKHAND_DISTRICTS.length})
              </option>
              {UTTARAKHAND_DISTRICTS.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-slate-200">
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px]">Risk:</span>
            {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRiskFilter(r)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  riskFilter === r ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px]">Status:</span>
            {(['ALL', 'ONLINE', 'OFFLINE'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  statusFilter === s ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station ID, name or telemetry..."
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 text-xs w-64 focus:outline-none focus:border-slate-700"
            />
          </div>
          <span className="text-slate-500 text-[11px]">
            {filteredStations.length} matching
          </span>
        </div>
      </div>

      {/* Stations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                <th className="py-2.5 px-4 font-semibold">Station ID</th>
                <th
                  className="py-2.5 px-4 font-semibold cursor-pointer hover:text-white"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    <span>Station Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-2.5 px-4 font-semibold">District</th>
                <th
                  className="py-2.5 px-4 font-semibold cursor-pointer hover:text-white"
                  onClick={() => handleSort('risk_score')}
                >
                  <div className="flex items-center gap-1">
                    <span>Risk Level & Score</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  className="py-2.5 px-4 font-semibold cursor-pointer hover:text-white"
                  onClick={() => handleSort('rainfall_24h')}
                >
                  <div className="flex items-center gap-1">
                    <span>Rainfall (1h / 24h)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-2.5 px-4 font-semibold">Telemetry Source</th>
                <th className="py-2.5 px-4 font-semibold">Last Update</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No stations found for current filters.
                  </td>
                </tr>
              ) : (
                filteredStations.map((stn) => (
                  <tr
                    key={stn.id}
                    onClick={() => onSelectStation(stn)}
                    className="hover:bg-slate-850/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-bold text-slate-400">
                      {stn.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                        {stn.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {stn.elevation_m ? `${stn.elevation_m}m MSL` : 'Catchment Gauge'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-300">
                      {stn.district}
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={stn.risk_level} size="sm" score={stn.risk_score} showPulse />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <div>
                          <span className="font-bold text-blue-400">{stn.rainfall_24h} mm</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">({stn.rainfall_1h} mm/1h)</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-[200px] truncate">
                      {stn.data_source}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(stn.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          stn.status === 'ONLINE'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950/80 text-red-400 border border-red-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${stn.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-red-500'}`} />
                        {stn.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onSelectStation(stn)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1 ml-auto transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
