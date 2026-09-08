import React, { useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CloudRain,
  Database,
  Info,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { StateRiskSummary, StationRisk } from '../types/api';

interface AnalyticsPageProps {
  summary: StateRiskSummary | null;
  stations: StationRisk[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ summary, stations }) => {
  const [selectedMetric, setSelectedMetric] = useState<'rainfall' | 'risk' | 'activity'>('rainfall');

  // Compute live aggregates from reporting stations
  const districtRainfall = summary?.districts
    ? [...summary.districts].sort((a, b) => b.avg_rainfall_24h - a.avg_rainfall_24h)
    : [];

  const maxRain = Math.max(...districtRainfall.map((d) => d.avg_rainfall_24h), 1);
  const maxScore = Math.max(...districtRainfall.map((d) => d.risk_score), 1);

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto font-mono text-xs">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              DISASTER TRENDS & HYDROMETEOROLOGICAL ANALYTICS
            </h1>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Aggregated precipitation patterns, risk index distributions, and catchment telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800 text-slate-300">
            <span className="text-slate-500 px-1 text-[10px] uppercase">Trend Interval:</span>
            <button type="button" className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold">
              Current (24h)
            </button>
            <button type="button" className="px-2 py-0.5 rounded text-slate-400 hover:text-white">
              7 Days
            </button>
          </div>
        </div>
      </div>

      {/* Historical Data Transparency Callout per prompt requirement */}
      <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-lg flex items-start gap-3">
        <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-slate-200">Historical Archive Status: </span>
          <span className="text-slate-400 text-[11px]">
            Long-term multi-year historical API endpoints are pending integration with State Hydrological Archives. Charts below compute live statistics directly from active telemetry reporting nodes.
          </span>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* District Rainfall Comparison (24h Cumulative) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 uppercase flex items-center gap-2 text-xs">
              <CloudRain className="w-4 h-4 text-blue-400" />
              District 24h Rainfall Comparison (mm)
            </span>
            <span className="text-[10px] text-slate-500">SORTED BY INTENSITY</span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
            {districtRainfall.map((dist) => (
              <div key={dist.district} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-slate-200">{dist.district}</span>
                  <span className="text-blue-400 font-bold">{dist.avg_rainfall_24h} mm</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      dist.avg_rainfall_24h >= 100
                        ? 'bg-red-500'
                        : dist.avg_rainfall_24h >= 50
                        ? 'bg-orange-500'
                        : dist.avg_rainfall_24h >= 25
                        ? 'bg-amber-400'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.round((dist.avg_rainfall_24h / maxRain) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* District Risk Index Comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 uppercase flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Disaster Risk Severity by District (0 - 100 Index)
            </span>
            <span className="text-[10px] text-slate-500">LIVE ENGINE SCORE</span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2">
            {[...districtRainfall]
              .sort((a, b) => b.risk_score - a.risk_score)
              .map((dist) => (
                <div key={dist.district} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-slate-200">{dist.district}</span>
                    <span
                      className={`font-bold ${
                        dist.risk_score >= 80
                          ? 'text-red-400'
                          : dist.risk_score >= 50
                          ? 'text-orange-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {dist.risk_score} / 100 ({dist.risk_level})
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        dist.risk_score >= 80
                          ? 'bg-red-500'
                          : dist.risk_score >= 50
                          ? 'bg-orange-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${dist.risk_score}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Historical Trend Placeholders per explicit requirement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5 flex flex-col items-center justify-center min-h-[160px] text-center space-y-2">
          <Calendar className="w-8 h-8 text-slate-600" />
          <div className="text-slate-400 font-bold uppercase text-xs">
            Historical Rainfall Hyetograph Archive
          </div>
          <div className="text-slate-500 text-[11px] max-w-sm">
            <span className="text-amber-400/90 font-semibold block">Historical data unavailable</span>
            Requires multi-year historical telemetry API connection.
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5 flex flex-col items-center justify-center min-h-[160px] text-center space-y-2">
          <Zap className="w-8 h-8 text-slate-600" />
          <div className="text-slate-400 font-bold uppercase text-xs">
            Multi-Year Flash Flood Frequency Model
          </div>
          <div className="text-slate-500 text-[11px] max-w-sm">
            <span className="text-amber-400/90 font-semibold block">Historical data unavailable</span>
            Long-term recurrence interval modeling is pending backend repository activation.
          </div>
        </div>
      </div>
    </div>
  );
};
