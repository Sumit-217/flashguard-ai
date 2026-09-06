import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

type DisasterState = 'NORMAL' | 'ALERT' | 'WARNING' | 'CRITICAL'

function App() {
  const [disasterState, setDisasterState] =
    useState<DisasterState>('ALERT')

  const disasterData = {
    NORMAL: {
      title: 'System Operating Normally',
      message: 'All monitoring systems are functioning within safe limits.',
      alertClass: 'normal-banner',
      incidents: '00',
      riskZones: '01',
      mapStatus: 'SAFE ZONE',
    },
    ALERT: {
      title: 'Moderate Risk Alert',
      message:
        'Heavy rainfall detected in monitored region. Continuous monitoring is active.',
      alertClass: 'alert-banner',
      incidents: '03',
      riskZones: '07',
      mapStatus: 'MODERATE RISK',
    },
    WARNING: {
      title: 'Warning: Conditions Escalating',
      message:
        'Multiple sensors indicate increasing disaster risk. Response teams are on standby.',
      alertClass: 'warning-banner',
      incidents: '06',
      riskZones: '12',
      mapStatus: 'HIGH RISK',
    },
    CRITICAL: {
      title: 'Critical Emergency Situation',
      message:
        'Immediate emergency response required. High-risk zones are being actively monitored.',
      alertClass: 'critical-banner',
      incidents: '12',
      riskZones: '21',
      mapStatus: 'CRITICAL',
    },
  }

  const current = disasterData[disasterState]

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <div>
            <h2>FlashGuard AI</h2>
            <span>COMMAND CENTER</span>
          </div>
        </div>

        <nav className="nav-menu">
          <button className="nav-item active">▦ Dashboard</button>
          <button className="nav-item">⚠ Incidents</button>
          <button className="nav-item">◉ Live Monitoring</button>
          <button className="nav-item">⌖ Risk Map</button>
          <button className="nav-item">▤ Analytics</button>
          <button className="nav-item">⚙ Settings</button>
        </nav>

        <div className="sidebar-bottom">
          <p>System Status</p>
          <div className="system-online">
            <span className="status-dot"></span>
            All Systems Operational
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <p className="welcome">COMMAND CENTER</p>
            <h1>Disaster Monitoring Dashboard</h1>
            <p className="subtitle">
              Real-time disaster intelligence and emergency response monitoring.
            </p>
          </div>

          <div className="header-actions">
            <div className="live-status">
              <span className="live-dot"></span>
              LIVE
            </div>
            <button className="notification">🔔</button>
            <div className="profile">KG</div>
          </div>
        </header>

        {/* DISASTER STATE CONTROLS */}
        <section className="state-controls">
          <p>SIMULATE DISASTER STATE:</p>

          <div className="state-buttons">
            {(['NORMAL', 'ALERT', 'WARNING', 'CRITICAL'] as DisasterState[]).map(
              (state) => (
                <button
                  key={state}
                  className={`state-button ${state.toLowerCase()} ${
                    disasterState === state ? 'selected' : ''
                  }`}
                  onClick={() => setDisasterState(state)}
                >
                  {state}
                </button>
              ),
            )}
          </div>
        </section>

        {/* DYNAMIC ALERT */}
        <section className={`dynamic-alert ${current.alertClass}`}>
          <div className="alert-icon">⚠</div>

          <div>
            <strong>{current.title}</strong>
            <p>{current.message}</p>
          </div>

          <div className="current-state">
            STATE: {disasterState}
          </div>
        </section>

        {/* STATISTICS */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">⚠</div>
            <div>
              <p>Active Incidents</p>
              <h2>{current.incidents}</h2>
              <span className="increase">
                Updated for current disaster state
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">◉</div>
            <div>
              <p>High Risk Zones</p>
              <h2>{current.riskZones}</h2>
              <span className="increase">Live risk assessment</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">⌁</div>
            <div>
              <p>IoT Sensors Online</p>
              <h2>124</h2>
              <span className="online-text">● 98.4% operational</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">♧</div>
            <div>
              <p>Response Teams</p>
              <h2>
                {disasterState === 'CRITICAL'
                  ? '18'
                  : disasterState === 'WARNING'
                    ? '12'
                    : '06'}
              </h2>
              <span className="online-text">● Available for deployment</span>
            </div>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel map-panel">
            <div className="panel-header">
              <div>
                <h3>Live Risk Zone Map</h3>
                <p>Current status: {current.mapStatus}</p>
              </div>

              <span className="map-live">● LIVE</span>
            </div>

            <div className="real-map-container">
  <MapContainer
    center={[28.5355, 77.391]}
    zoom={11}
    className="real-map"
  >
    <TileLayer
      attribution="&copy; OpenStreetMap contributors"
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />

    <CircleMarker
      center={[28.5355, 77.391]}
      radius={20}
      pathOptions={{
        color: disasterState === 'CRITICAL' ? '#dc2626' : '#f59e0b',
        fillColor:
          disasterState === 'NORMAL'
            ? '#22c55e'
            : disasterState === 'WARNING'
              ? '#f97316'
              : disasterState === 'CRITICAL'
                ? '#dc2626'
                : '#facc15',
        fillOpacity: 0.7,
      }}
    >
      <Popup>
        <strong>FlashGuard AI Monitoring Zone</strong>
        <br />
        Current State: {disasterState}
      </Popup>
    </CircleMarker>

    <CircleMarker
      center={[28.4595, 77.0266]}
      radius={15}
      pathOptions={{
        color: '#2563eb',
        fillColor: '#60a5fa',
        fillOpacity: 0.7,
      }}
    >
      <Popup>IoT Sensor Station</Popup>
    </CircleMarker>
  </MapContainer>
</div>
          </div>

          <div className="panel alerts-panel">
            <div className="panel-header">
              <div>
                <h3>Recent Alerts</h3>
                <p>Latest system activity</p>
              </div>
              <button className="text-button">View All</button>
            </div>

            <div className="alert-list">
              <div className="alert-item critical">
                <span className="alert-level"></span>
                <div>
                  <strong>{current.title}</strong>
                  <p>Updated based on simulation • Just now</p>
                </div>
              </div>

              <div className="alert-item warning-item">
                <span className="alert-level"></span>
                <div>
                  <strong>IoT Monitoring Active</strong>
                  <p>124 sensors reporting live data</p>
                </div>
              </div>

              <div className="alert-item normal">
                <span className="alert-level"></span>
                <div>
                  <strong>Response Network Ready</strong>
                  <p>Emergency teams available</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>IoT Sensor Activity</h3>
                <p>Live readings from monitoring stations</p>
              </div>
            </div>

            <div className="sensor-list">
              <div className="sensor">
                <div>
                  <strong>Rainfall Sensor</strong>
                  <p>Station A-12</p>
                </div>
                <span>
                  {disasterState === 'CRITICAL'
                    ? '120 mm/hr'
                    : disasterState === 'WARNING'
                      ? '92 mm/hr'
                      : '78 mm/hr'}
                </span>
              </div>

              <div className="sensor">
                <div>
                  <strong>Water Level</strong>
                  <p>River Station B-04</p>
                </div>
                <span>4.8 m</span>
              </div>

              <div className="sensor">
                <div>
                  <strong>Wind Speed</strong>
                  <p>Weather Station C-09</p>
                </div>
                <span>42 km/h</span>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <h3>Response Overview</h3>
                <p>Emergency team status</p>
              </div>
            </div>

            <div className="response-info">
              <div className="response-number">
                <strong>{current.incidents}</strong>
                <span>Active Incidents</span>
              </div>

              <div className="response-number">
                <strong>{current.riskZones}</strong>
                <span>Risk Zones</span>
              </div>

              <div className="response-number">
                <strong>{disasterState}</strong>
                <span>Current State</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App