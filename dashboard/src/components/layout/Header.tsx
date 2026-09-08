import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Menu,
  RefreshCw,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { DemoScenario, SystemHealth } from '../../types/api';

interface HeaderProps {
  isDemo: boolean;
  setIsDemo?: (val: boolean) => void;
  onToggleDemo?: () => void;
  scenario?: DemoScenario;
  demoScenario?: DemoScenario;
  setScenario?: (sc: DemoScenario) => void;
  onSelectScenario?: (sc: DemoScenario) => void;
  health?: SystemHealth | null;
  isBackendOnline: boolean;
  isUsingCachedData: boolean;
  loading: boolean;
  onRefresh: () => void;
  highestRiskLevel?: string;
  lastUpdated?: Date | null;
  activeAlertsCount?: number;
  onToggleSidebar?: () => void;
  onNavigateAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDemo,
  setIsDemo,
  onToggleDemo,
  scenario,
  demoScenario,
  setScenario,
  onSelectScenario,
  health,
  isBackendOnline,
  isUsingCachedData,
  loading,
  onRefresh,
  highestRiskLevel = 'LOW',
  onToggleSidebar,
}) => {
  const [timeStr, setTimeStr] = useState({ ist: '', utc: '' });

  const activeScenario = scenario || demoScenario || 'NORMAL';
  const handleScenarioChange = (sc: DemoScenario) => {
    if (setScenario) setScenario(sc);
    if (onSelectScenario) onSelectScenario(sc);
  };

  const handleToggleDemo = () => {
    if (onToggleDemo) onToggleDemo();
    else if (setIsDemo) setIsDemo(!isDemo);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      const istDateOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
      };
      const ist = `${now.toLocaleDateString('en-GB', istDateOptions)} ${now.toLocaleTimeString('en-GB', istOptions)} IST`;
      const utc = `${now.toISOString().slice(11, 19)} UTC`;
      setTimeStr({ ist, utc });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Left: Hamburger (mobile), System Live indicator, divider, version tag */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded hover:bg-white/5 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* System Status Readout */}
        <div className="flex items-center gap-2">
          {!isBackendOnline && !isDemo ? (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-red-400 font-sans">
                System Offline
              </span>
            </>
          ) : health?.status === 'DEGRADED' || isUsingCachedData ? (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300 font-sans">
                Degraded Link
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest uppercase text-white font-sans">
                System Live
              </span>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
          v2.4.0-STABLE
        </span>

        {/* Threat Level Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono">
          <span className="text-slate-500">THREAT:</span>
          <span
            className={`font-bold ${
              highestRiskLevel === 'CRITICAL'
                ? 'text-red-400'
                : highestRiskLevel === 'HIGH'
                ? 'text-orange-400'
                : highestRiskLevel === 'MODERATE'
                ? 'text-yellow-400'
                : 'text-emerald-400'
            }`}
          >
            {highestRiskLevel}
          </span>
        </div>
      </div>

      {/* Center: Live / Demo Segmented Switcher & Scenario Pills */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-md overflow-hidden border border-white/10 bg-white/5 p-0.5">
          <button
            type="button"
            onClick={() => isDemo && handleToggleDemo()}
            className={`px-3 py-1 text-[10px] font-bold uppercase transition-all rounded ${
              !isDemo
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Live
          </button>
          <button
            type="button"
            onClick={() => !isDemo && handleToggleDemo()}
            className={`px-3 py-1 text-[10px] font-bold uppercase transition-all rounded ${
              isDemo
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            Demo
          </button>
        </div>

        {/* Demo Scenario Selector (Compact Bento Pill) */}
        {isDemo && (
          <div className="hidden sm:flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-md p-0.5">
            {(['NORMAL', 'ALERT', 'WARNING', 'CRITICAL'] as DemoScenario[]).map((sc) => (
              <button
                key={sc}
                type="button"
                onClick={() => handleScenarioChange(sc)}
                className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded transition-colors ${
                  activeScenario === sc
                    ? sc === 'CRITICAL'
                      ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                      : sc === 'WARNING'
                      ? 'bg-orange-500/30 text-orange-300 border border-orange-500/40'
                      : sc === 'ALERT'
                      ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40'
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: Clocks, Refresh Button, Profile */}
      <div className="flex items-center gap-3">
        {/* Dual Timestamps */}
        <div className="hidden xl:flex flex-col items-end text-[10px] font-mono leading-tight pr-3 border-r border-white/10">
          <span className="text-white font-medium">{timeStr.utc}</span>
          <span className="text-slate-500">{timeStr.ist}</span>
        </div>

        {/* Refresh button with Bento styling */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Telemetry Stream"
          className="p-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
        </button>

        {/* Admin Tag */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="h-7 w-7 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
            <User className="w-3.5 h-3.5 opacity-80" />
          </div>
          <div className="hidden 2xl:flex flex-col text-left font-mono">
            <span className="text-[11px] font-medium text-slate-200 leading-none">Ops #04</span>
            <span className="text-[9px] text-slate-500 leading-none mt-1 uppercase">UKSDMA DEOC</span>
          </div>
        </div>
      </div>
    </header>
  );
};
