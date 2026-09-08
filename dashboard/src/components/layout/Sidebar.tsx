import React from 'react';
import {
  Activity,
  AlertOctagon,
  BarChart3,
  Bell,
  LayoutDashboard,
  MapPin,
  Radio,
  Server,
  ShieldAlert,
  X,
} from 'lucide-react';

export type DashboardPage =
  | 'overview'
  | 'map'
  | 'alerts'
  | 'broadcast'
  | 'stations'
  | 'incidents'
  | 'response'
  | 'analytics'
  | 'system';

interface SidebarProps {
  currentPage: DashboardPage;
  onNavigate: (page: DashboardPage) => void;
  activeAlertsCount?: number;
  activeIncidentsCount?: number;
  criticalStationsCount?: number;
  criticalCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  activeAlertsCount = 0,
  activeIncidentsCount = 0,
  criticalStationsCount,
  criticalCount,
  isOpen = false,
  onClose,
}) => {
  const criticals = criticalStationsCount ?? criticalCount ?? 0;

  const navItems: {
    id: DashboardPage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
    {
      id: 'map',
      label: 'RISK MAP',
      icon: MapPin,
      badge: criticals > 0 ? criticals : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'alerts',
      label: 'ALERTS',
      icon: Bell,
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    { id: 'broadcast', label: 'BROADCAST', icon: Radio },
    { id: 'stations', label: 'STATIONS', icon: Activity },
    {
      id: 'incidents',
      label: 'INCIDENTS',
      icon: AlertOctagon,
      badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
      badgeColor: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    },
    { id: 'response', label: 'SAFE HUBS', icon: ShieldAlert },
    { id: 'analytics', label: 'ANALYTICS', icon: BarChart3 },
    { id: 'system', label: 'SYSTEM', icon: Server },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-56 sm:w-60 border-r border-white/5 bg-[#0a0a0f] flex flex-col shrink-0 select-none transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-red-600 rounded-sm flex items-center justify-center font-bold text-[10px] text-white shadow-sm">
                F
              </div>
              <h1 className="text-sm font-bold tracking-widest text-white uppercase">
                FlashGuard AI
              </h1>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/5 lg:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Directory Tag */}
          <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 px-2 py-1 mb-1">
            OPS COMMAND
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all text-left ${
                    isActive
                      ? 'text-white bg-white/5 border border-white/10 shadow-sm'
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                        isActive ? 'bg-red-500 shadow-sm' : 'bg-slate-700'
                      }`}
                    />
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    <span className="tracking-wider">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        item.badgeColor || 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bento Footer: Last Update & Helpline */}
        <div className="mt-auto p-4 border-t border-white/5 space-y-2">
          <div className="p-3 bg-white/5 rounded-lg border border-white/5">
            <p className="text-[9px] text-slate-500 uppercase tracking-tight font-bold mb-1">
              SEOC HELPLINE 24/7
            </p>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-mono font-bold text-red-400">1070</span>
              <span className="text-[9px] text-emerald-400 font-mono">ACTIVE</span>
            </div>
            <p className="text-[9px] text-slate-500 font-sans mt-1">
              Uttarakhand State EOC
            </p>
          </div>

          <div className="p-2.5 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-tight">ENGINE STATUS</span>
            <span className="text-[10px] font-mono text-slate-300">ONLINE</span>
          </div>
        </div>
      </aside>
    </>
  );
};
