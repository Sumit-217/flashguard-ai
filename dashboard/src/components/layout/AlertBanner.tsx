import React from 'react';
import { AlertCircle, AlertTriangle, Database, Info, WifiOff } from 'lucide-react';
import { DemoScenario } from '../../types/api';

interface AlertBannerProps {
  isBackendOnline: boolean;
  isUsingCachedData: boolean;
  isDemo: boolean;
  scenario?: DemoScenario;
  demoScenario?: DemoScenario;
  criticalZonesCount?: number;
  error?: string | null;
  lastSyncTime?: Date | null;
  onRetry?: () => void;
  onSwitchToDemo?: () => void;
  onSelectScenario?: (s: DemoScenario) => void;
  onViewCriticalZones?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  isBackendOnline,
  isUsingCachedData,
  isDemo,
  scenario,
  demoScenario,
  criticalZonesCount,
  error,
  lastSyncTime,
  onRetry,
  onSwitchToDemo,
  onSelectScenario,
  onViewCriticalZones,
}) => {
  const currentScenario = scenario || demoScenario || 'NORMAL';
  // If in demo mode, show a high-visibility, professional advisory banner
  if (isDemo) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 sm:px-6 py-2 flex items-center justify-between text-xs font-mono text-amber-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            <strong className="font-bold text-amber-200">DEMO SCENARIO ACTIVE:</strong> Simulating{' '}
            <span className="font-bold text-white uppercase bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
              {currentScenario}
            </span>{' '}
            disaster scenario for Uttarakhand. Simulated data is isolated from live operations.
          </span>
        </div>
        <div className="text-[10px] text-amber-400/70 hidden md:block">
          FastAPI /api/v1/demo/risk/uttarakhand
        </div>
      </div>
    );
  }

  // If live mode and backend is unavailable
  if (!isBackendOnline) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/30 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-red-300">
        <div className="flex items-center gap-2">
          <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <div>
            <span className="font-bold text-red-200 uppercase">Backend Offline</span>
            {isUsingCachedData && (
              <span className="text-red-300 ml-2">
                — Displaying cached snapshot{' '}
                {lastSyncTime && `(${lastSyncTime.toLocaleTimeString()})`}
              </span>
            )}
            {error && <span className="text-red-400/80 ml-2 text-[10px]">[{error}]</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded border border-red-500/40 text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            Reconnect
          </button>
          <button
            type="button"
            onClick={onSwitchToDemo}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-amber-300 rounded border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            Switch to Demo
          </button>
        </div>
      </div>
    );
  }

  // If using cached data while degraded
  if (isUsingCachedData) {
    return (
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 py-1.5 flex items-center justify-between text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Telemetry link degraded — <strong className="text-amber-300">Displaying cached snapshot</strong>
          </span>
        </div>
        {lastSyncTime && (
          <span className="text-slate-500 text-[10px]">
            Observed: {lastSyncTime.toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  return null;
};
