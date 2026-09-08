import React, { useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { Alert, RiskLevel } from '../types/api';
import { RiskBadge } from '../components/common/RiskBadge';

interface AlertsPageProps {
  alerts: Alert[];
  onAcknowledge: (id: string) => void;
  onCreateAlert: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  onAcknowledge,
  onCreateAlert,
  onRefresh,
  loading,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | RiskLevel>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const filteredAlerts = alerts
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter((alert) => {
      if (filterSeverity !== 'ALL' && alert.severity !== filterSeverity) return false;
      if (filterStatus !== 'ALL' && alert.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = alert.title.toLowerCase().includes(q);
        const matchDist = alert.district.toLowerCase().includes(q);
        const matchMsg = alert.message.toLowerCase().includes(q);
        if (!matchTitle && !matchDist && !matchMsg) return false;
      }
      return true;
    });

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH' && a.status === 'ACTIVE').length;
  const warningCount = alerts.filter((a) => a.severity === 'MODERATE' && a.status === 'ACTIVE').length;

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto font-mono text-xs">
      {/* Top Header & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              CENTRAL ALERT MANAGEMENT & DISASTER NOTIFICATION LOG
            </h1>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Real-time multi-hazard alerts derived from hydrometeorological threshold triggers.
          </p>
        </div>

        {/* Buttons: Refresh, Create Alert */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh Alerts</span>
          </button>
          <button
            type="button"
            onClick={onCreateAlert}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-200 font-bold uppercase transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-red-400" />
            <span>Create Alert / Broadcast</span>
          </button>
        </div>
      </div>

      {/* Severity Tally Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => {
            setFilterSeverity('ALL');
            setFilterStatus('ALL');
          }}
          className={`p-3 rounded-lg border text-left transition-colors ${
            filterSeverity === 'ALL'
              ? 'bg-slate-800/90 border-slate-600'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-slate-400 text-[10px] uppercase">All Active & Historic</div>
          <div className="text-xl font-bold text-white mt-1">{alerts.length}</div>
          <div className="text-slate-500 text-[10px]">Total Logged Alerts</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterSeverity('CRITICAL');
            setFilterStatus('ACTIVE');
          }}
          className={`p-3 rounded-lg border text-left transition-colors ${
            filterSeverity === 'CRITICAL'
              ? 'bg-red-950/60 border-red-600'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-red-400 text-[10px] uppercase font-bold flex items-center justify-between">
            <span>Critical Alerts</span>
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="text-xl font-bold text-red-400 mt-1">{criticalCount}</div>
          <div className="text-slate-500 text-[10px]">Active Emergency Priority</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterSeverity('HIGH');
            setFilterStatus('ACTIVE');
          }}
          className={`p-3 rounded-lg border text-left transition-colors ${
            filterSeverity === 'HIGH'
              ? 'bg-orange-950/60 border-orange-600'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-orange-400 text-[10px] uppercase font-bold">High Alerts</div>
          <div className="text-xl font-bold text-orange-400 mt-1">{highCount}</div>
          <div className="text-slate-500 text-[10px]">Debris & Runoff Hazard</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterSeverity('MODERATE');
            setFilterStatus('ACTIVE');
          }}
          className={`p-3 rounded-lg border text-left transition-colors ${
            filterSeverity === 'MODERATE'
              ? 'bg-amber-950/60 border-amber-600'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-amber-400 text-[10px] uppercase font-bold">Warning Alerts</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{warningCount}</div>
          <div className="text-slate-500 text-[10px]">Precipitation Advisory</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px]">Status:</span>
            {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  filterStatus === st ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px]">Severity:</span>
            {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setFilterSeverity(sev)}
                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                  filterSeverity === sev ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search district, message or station..."
            className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 text-xs w-64 focus:outline-none focus:border-slate-700"
          />
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                <th className="py-2.5 px-4 font-semibold">Severity</th>
                <th className="py-2.5 px-4 font-semibold">Alert ID & Title</th>
                <th className="py-2.5 px-4 font-semibold">District</th>
                <th className="py-2.5 px-4 font-semibold">Risk Source</th>
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No alerts match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="hover:bg-slate-850/60 transition-colors cursor-pointer group"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <td className="py-3 px-4">
                      <RiskBadge level={alert.severity} size="sm" showPulse />
                    </td>
                    <td className="py-3 px-4 max-w-xs md:max-w-md">
                      <div className="font-bold text-slate-200 truncate">{alert.title}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{alert.message}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-300">
                      {alert.district}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-[180px] truncate">
                      {alert.risk_source}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          alert.status === 'ACTIVE'
                            ? 'bg-red-950/80 text-red-400 border border-red-800'
                            : alert.status === 'ACKNOWLEDGED'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedAlert(alert)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                          title="View complete details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {alert.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => onAcknowledge(alert.id)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-lg overflow-hidden shadow-2xl font-mono text-xs">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <RiskBadge level={selectedAlert.severity} size="md" showPulse />
                <span className="text-slate-400">{selectedAlert.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              <h3 className="text-base font-bold text-white">{selectedAlert.title}</h3>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">DISTRICT:</span>
                  <span className="font-bold text-white">{selectedAlert.district}</span>
                </div>
                {selectedAlert.location && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">LOCATION:</span>
                    <span className="text-slate-300">{selectedAlert.location}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">TRIGGER SOURCE:</span>
                  <span className="text-slate-300">{selectedAlert.risk_source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TRIGGER TIME:</span>
                  <span className="text-slate-300">{new Date(selectedAlert.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DISASTER CHANNELS:</span>
                  <span className="text-blue-400">{selectedAlert.channels.join(', ')}</span>
                </div>
              </div>

              <div className="p-3 rounded bg-slate-950/80 border border-slate-800 text-slate-200 leading-relaxed">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">
                  Alert Message & Advisory
                </span>
                {selectedAlert.message}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              {selectedAlert.status === 'ACTIVE' ? (
                <button
                  type="button"
                  onClick={() => {
                    onAcknowledge(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="px-3 py-1.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 transition-colors"
                >
                  Mark Acknowledged
                </button>
              ) : (
                <span className="text-slate-500">Status: {selectedAlert.status}</span>
              )}
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
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
