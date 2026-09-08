import React, { useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Incident, IncidentStatus, RiskLevel } from '../types/api';
import { RiskBadge } from '../components/common/RiskBadge';

interface IncidentsPageProps {
  incidents: Incident[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  onRefresh: () => void;
  loading: boolean;
  isDemo: boolean;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({
  incidents,
  onAcknowledge,
  onResolve,
  onRefresh,
  loading,
  isDemo,
}) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | IncidentStatus>('ALL');

  const filtered = incidents.filter((inc) => {
    if (filterStatus !== 'ALL' && inc.status !== filterStatus) return false;
    return true;
  });

  const activeCount = incidents.filter((i) => i.status === 'ACTIVE').length;
  const monitoringCount = incidents.filter((i) => i.status === 'MONITORING').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto font-mono text-xs">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              ACTIVE DISASTER INCIDENTS & TACTICAL DISPATCH
            </h1>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Real-time incident records synced with Uttarakhand State Emergency Operations Centre (SEOC).
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Tally Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setFilterStatus('ACTIVE')}
          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
            filterStatus === 'ACTIVE'
              ? 'bg-red-950/60 border-red-600'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-red-400 text-[10px] uppercase font-bold">
            <span>Critical / Active Response</span>
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-1">{activeCount}</div>
          <div className="text-slate-500 text-[10px]">Uncontained Flash Floods / Breaches</div>
        </div>

        <div
          onClick={() => setFilterStatus('MONITORING')}
          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
            filterStatus === 'MONITORING'
              ? 'bg-amber-950/60 border-amber-600'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400 text-[10px] uppercase font-bold">
            <span>Monitoring & Field Standby</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{monitoringCount}</div>
          <div className="text-slate-500 text-[10px]">Rising Water Levels Under Watch</div>
        </div>

        <div
          onClick={() => setFilterStatus('RESOLVED')}
          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
            filterStatus === 'RESOLVED'
              ? 'bg-emerald-950/60 border-emerald-600'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400 text-[10px] uppercase font-bold">
            <span>Resolved / Safe Basins</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{resolvedCount}</div>
          <div className="text-slate-500 text-[10px]">Waters Receded Below Danger Level</div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-lg text-center text-slate-500 font-mono">
            {isDemo
              ? 'No incidents under current filter. Switch scenario to WARNING or CRITICAL to simulate incidents.'
              : 'No live disaster incidents currently reported by backend.'}
          </div>
        ) : (
          filtered.map((incident) => (
            <div
              key={incident.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-4 transition-colors space-y-3"
            >
              {/* Top Row: Title, Severity, District */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-400">{incident.id}</span>
                  <RiskBadge level={incident.severity} size="sm" score={incident.risk_score} showPulse />
                  <h3 className="text-sm font-bold text-slate-100">{incident.title}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-slate-950 border border-slate-800 font-semibold text-slate-300">
                    {incident.district}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      incident.status === 'ACTIVE'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : incident.status === 'MONITORING'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    ● {incident.status}
                  </span>
                </div>
              </div>

              {/* Middle Row: Description & Context */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                <div className="lg:col-span-2 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase">Incident Narrative</span>
                  <p className="text-slate-200 leading-relaxed">{incident.description}</p>
                  {incident.evacuation_status && (
                    <div className="pt-1 text-red-400 font-bold text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>EVACUATION: {incident.evacuation_status}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-300 font-semibold">{incident.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Detected:</span>
                    <span className="text-slate-300">
                      {new Date(incident.detected_time).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trigger Sensors:</span>
                    <span className="text-blue-400 truncate max-w-[140px]">
                      {incident.related_stations.join(', ') || 'District Mesh'}
                    </span>
                  </div>
                  {incident.deployed_teams && incident.deployed_teams.length > 0 && (
                    <div className="flex justify-between pt-1 border-t border-slate-800">
                      <span className="text-slate-500">Deployed QRTs:</span>
                      <span className="text-emerald-400 truncate max-w-[140px]">
                        {incident.deployed_teams.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[10px] text-slate-500">
                  Incident synced with State Disaster Response Force (SDRF) Dispatch
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedIncident(incident)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Details</span>
                  </button>

                  {incident.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() => onAcknowledge(incident.id)}
                      className="px-2.5 py-1 rounded bg-amber-950/70 hover:bg-amber-900 text-amber-200 border border-amber-800 text-xs transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  {incident.status !== 'RESOLVED' && (
                    <button
                      type="button"
                      onClick={() => onResolve(incident.id)}
                      className="px-2.5 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 text-xs transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl font-mono text-xs">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <RiskBadge level={selectedIncident.severity} size="md" score={selectedIncident.risk_score} showPulse />
                <span className="text-slate-300 font-bold">{selectedIncident.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              <h3 className="text-base font-bold text-white">{selectedIncident.title}</h3>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">DISTRICT:</span>
                  <span className="font-bold text-white">{selectedIncident.district}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SPECIFIC LOCATION:</span>
                  <span className="text-slate-200">{selectedIncident.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DETECTED AT:</span>
                  <span className="text-slate-300">{new Date(selectedIncident.detected_time).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">REPORTING SENSORS:</span>
                  <span className="text-blue-400">{selectedIncident.related_stations.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CURRENT STATUS:</span>
                  <span className="text-orange-400 font-bold">{selectedIncident.status}</span>
                </div>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">
                  Tactical Briefing
                </span>
                {selectedIncident.description}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedIncident.status === 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => {
                      onAcknowledge(selectedIncident.id);
                      setSelectedIncident(null);
                    }}
                    className="px-3 py-1.5 rounded bg-amber-900/80 hover:bg-amber-800 text-amber-200 border border-amber-700 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
                {selectedIncident.status !== 'RESOLVED' && (
                  <button
                    type="button"
                    onClick={() => {
                      onResolve(selectedIncident.id);
                      setSelectedIncident(null);
                    }}
                    className="px-3 py-1.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 transition-colors"
                  >
                    Resolve
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
