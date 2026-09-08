import React, { Component, ReactNode, useState } from 'react';
import { useRiskData } from './hooks/useRiskData';
import { Header } from './components/layout/Header';
import { Sidebar, DashboardPage } from './components/layout/Sidebar';
import { AlertBanner } from './components/layout/AlertBanner';
import { StationDetailModal } from './components/common/StationDetailModal';
import { StationRisk } from './types/api';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { RiskMapPage } from './pages/RiskMapPage';
import { AlertsPage } from './pages/AlertsPage';
import { BroadcastPage } from './pages/BroadcastPage';
import { StationsPage } from './pages/StationsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ResponsePage } from './pages/ResponsePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SystemStatusPage } from './pages/SystemStatusPage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary to prevent blank screen crashes
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    console.error('FlashGuard Dashboard Error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-16 bg-red-950/40 border border-red-500/40 rounded-xl text-center font-mono">
          <h2 className="text-base font-bold text-red-400 mb-2">Module View Recovery</h2>
          <p className="text-xs text-slate-300 mb-4 break-words">
            {this.state.error?.message || 'A rendering error occurred in this view.'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-600"
            >
              Retry Component
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<DashboardPage>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<StationRisk | null>(null);

  const {
    isDemo,
    setIsDemo: setDemo,
    scenario: demoScenario,
    isBackendOnline,
    isUsingCachedData,
    loading,
    lastSyncTime: lastUpdated,
    summary,
    geoData,
    health,
    incidents,
    alerts,
    setScenario,
    refresh: refreshData,
    addAlert,
    acknowledgeAlert,
    acknowledgeIncident,
    resolveIncident,
  } = useRiskData();

  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalZonesCount = summary?.critical_zones || 0;

  // Handler to view a facility or coordinates on map
  const handleViewLocationOnMap = (coordinates: [number, number]) => {
    setCurrentPage('map');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-mono select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setSidebarOpen(false);
        }}
        activeAlertsCount={activeAlertsCount}
        criticalCount={criticalZonesCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Operational Header */}
        <Header
          isDemo={isDemo}
          demoScenario={demoScenario}
          isBackendOnline={isBackendOnline}
          isUsingCachedData={isUsingCachedData}
          lastUpdated={lastUpdated}
          loading={loading}
          activeAlertsCount={activeAlertsCount}
          onToggleDemo={() => setDemo(!isDemo)}
          onSelectScenario={setScenario}
          onRefresh={refreshData}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigateAlerts={() => setCurrentPage('alerts')}
        />

        {/* Global Warning / Backend Fallback Banner */}
        <AlertBanner
          isBackendOnline={isBackendOnline}
          isUsingCachedData={isUsingCachedData}
          isDemo={isDemo}
          demoScenario={demoScenario}
          criticalZonesCount={criticalZonesCount}
          onSwitchToDemo={() => setDemo(true)}
          onSelectScenario={setScenario}
          onViewCriticalZones={() => setCurrentPage('map')}
        />

        {/* Primary Page Canvas wrapped in ErrorBoundary */}
        <main className="flex-1 overflow-y-auto bg-[#050507]">
          <ErrorBoundary>
            {currentPage === 'overview' && (
              <OverviewPage
                summary={summary}
                geoData={geoData}
                health={health}
                incidents={incidents}
                alerts={alerts}
                loading={loading}
                onRefresh={refreshData}
                onNavigate={(page) => setCurrentPage(page)}
                onSelectStation={(stn) => setSelectedStation(stn)}
                isDemo={isDemo}
                onToggleDemo={() => setDemo(!isDemo)}
              />
            )}

            {currentPage === 'map' && (
              <RiskMapPage
                stations={summary?.stations || []}
                geoData={geoData}
                onSelectStation={(stn) => setSelectedStation(stn)}
                onRefresh={refreshData}
                loading={loading}
              />
            )}

            {currentPage === 'alerts' && (
              <AlertsPage
                alerts={alerts}
                onAcknowledge={acknowledgeAlert}
                onCreateAlert={() => setCurrentPage('broadcast')}
                onRefresh={refreshData}
                loading={loading}
              />
            )}

            {currentPage === 'broadcast' && (
              <BroadcastPage
                defaultDistrict={summary?.highest_risk_district}
                onAlertCreated={(newAlert) => addAlert(newAlert)}
                onRefresh={refreshData}
                onNavigate={(page) => setCurrentPage(page)}
              />
            )}

            {currentPage === 'stations' && (
              <StationsPage
                stations={summary?.stations || []}
                onSelectStation={(stn) => setSelectedStation(stn)}
                onRefresh={refreshData}
                loading={loading}
              />
            )}

            {currentPage === 'incidents' && (
              <IncidentsPage
                incidents={incidents}
                onAcknowledge={acknowledgeIncident}
                onResolve={resolveIncident}
                onRefresh={refreshData}
                loading={loading}
                isDemo={isDemo}
              />
            )}

            {currentPage === 'response' && (
              <ResponsePage onViewOnMap={handleViewLocationOnMap} />
            )}

            {currentPage === 'analytics' && (
              <AnalyticsPage
                summary={summary}
                stations={summary?.stations || []}
              />
            )}

            {currentPage === 'system' && (
              <SystemStatusPage
                health={health}
                isBackendOnline={isBackendOnline}
                onRefresh={refreshData}
                loading={loading}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Station Detail Modal */}
      <StationDetailModal
        station={selectedStation}
        onClose={() => setSelectedStation(null)}
      />
    </div>
  );
}
