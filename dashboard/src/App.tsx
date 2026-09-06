import { useState } from 'react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

type DisasterState = 'NORMAL' | 'ALERT' | 'WARNING' | 'CRITICAL'

type DisasterInfo = {
  title: string
  message: string
  alertClass: string
  incidents: string
  riskZones: string
  mapStatus: string
  rainfall: string
  waterLevel: string
  windSpeed: string
  responseTeams: string
}

function App() {
  const [disasterState, setDisasterState] =
    useState<DisasterState>('ALERT')

  const [showAllAlerts, setShowAllAlerts] = useState(false)

  const disasterData: Record<DisasterState, DisasterInfo> = {
    NORMAL: {
      title: 'System Operating Normally',
      message: 'All monitoring systems are functioning within safe limits.',
      alertClass: 'normal-banner',
      incidents: '00',
      riskZones: '01',
      mapStatus: 'SAFE ZONE',
      rainfall: '32 mm/hr',
      waterLevel: '2.1 m',
      windSpeed: '18 km/h',
      responseTeams: '06',
    },

    ALERT: {
      title: 'Moderate Risk Alert',
      message:
        'Heavy rainfall detected in the monitored region. AI monitoring is active.',
      alertClass: 'alert-banner',
      incidents: '03',
      riskZones: '07',
      mapStatus: 'MODERATE RISK',
      rainfall: '78 mm/hr',
      waterLevel: '4.8 m',
      windSpeed: '42 km/h',
      responseTeams: '08',
    },

    WARNING: {
      title: 'Warning: Conditions Escalating',
      message:
        'Multiple sensors indicate increasing disaster risk. Response teams are on standby.',
      alertClass: 'warning-banner',
      incidents: '06',
      riskZones: '12',
      mapStatus: 'HIGH RISK',
      rainfall: '92 mm/hr',
      waterLevel: '6.2 m',
      windSpeed: '58 km/h',
      responseTeams: '12',
    },

    CRITICAL: {
      title: 'Critical Emergency Situation',
      message:
        'Immediate emergency response required. High-risk zones are actively monitored.',
      alertClass: 'critical-banner',
      incidents: '12',
      riskZones: '21',
      mapStatus: 'CRITICAL',
      rainfall: '120 mm/hr',
      waterLevel: '8.5 m',
      windSpeed: '74 km/h',
      responseTeams: '18',
    },
  }

  const current = disasterData[disasterState]

  const getMapColor = (): string => {
    switch (disasterState) {
      case 'NORMAL':
        return '#22c55e'
      case 'ALERT':
        return '#eab308'
      case 'WARNING':
        return '#f97316'
      case 'CRITICAL':
        return '#ef4444'
      default:
        return '#2563eb'
    }
  }

  const alerts = [
    {
      title: current.title,
      description: current.message,
      time: 'JUST NOW',
    },
    {
      title: 'IoT Monitoring Active',
      description: '124 environmental sensors are reporting live data.',
      time: '2 MIN AGO',
    },
    {
      title: 'Response Network Ready',
      description: 'Emergency response teams are ready for deployment.',
      time: '8 MIN AGO',
    },
    {
      title: 'Weather Intelligence Updated',
      description: 'Satellite monitoring data synchronized successfully.',
      time: '15 MIN AGO',
    },
  ]

  const visibleAlerts = showAllAlerts ? alerts : alerts.slice(0, 3)

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">⚡</div>

          <div>
            <h2>FlashGuard AI</h2>
            <span>COMMAND CENTER</span>
          </div>
        </div>

        <nav className="nav-menu">
          <button className="nav-item active">
            ▦ <span>Dashboard</span>
          </button>

          <button className="nav-item">
            ⚠ <span>Incidents</span>
          </button>

          <button className="nav-item">
            ◉ <span>Live Monitoring</span>
          </button>

          <button className="nav-item">
            ⌖ <span>Risk Map</span>
          </button>

          <button className="nav-item">
            ▤ <span>Analytics</span>
          </button>

          <button className="nav-item">
            ⚙ <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <p>SYSTEM STATUS</p>

          <div className="system-online">
            <span className="status-dot"></span>
            All Systems Operational
          </div>

          <span className="version">
            v1.0.0 // FLASHGUARD AI
          </span>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        {/* HEADER */}
        <header className="header">
          <div>
            <p className="welcome">
              FLASHGUARD AI // COMMAND CENTER
            </p>

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

        {/* DISASTER STATE */}
        <section className="state-controls">
          <div>
            <p>DISASTER STATE SIMULATION</p>
            <span>Simulate different emergency conditions</span>
          </div>

          <div className="state-buttons">
            {(
              ['NORMAL', 'ALERT', 'WARNING', 'CRITICAL'] as DisasterState[]
            ).map((state) => (
              <button
                key={state}
                className={`state-button ${
                  disasterState === state ? 'selected' : ''
                }`}
                onClick={() => setDisasterState(state)}
              >
                <span className="state-dot"></span>
                {state}
              </button>
            ))}
          </div>
        </section>

        {/* AI ALERT */}
        <section
          className={`dynamic-alert ${current.alertClass}`}
        >
          <div className="alert-icon">⚠</div>

          <div className="alert-content">
            <span className="alert-label">
              AI RISK ASSESSMENT
            </span>

            <strong>{current.title}</strong>

            <p>{current.message}</p>
          </div>

          <div className="current-state">
            <span>CURRENT STATE</span>
            <strong>{disasterState}</strong>
          </div>
        </section>

        {/* STATS */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">⚠</div>

            <div>
              <p>ACTIVE INCIDENTS</p>
              <h2>{current.incidents}</h2>
              <span>LIVE SYSTEM DATA</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">◎</div>

            <div>
              <p>HIGH RISK ZONES</p>
              <h2>{current.riskZones}</h2>
              <span>AI RISK ASSESSMENT</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">◉</div>

            <div>
              <p>IOT SENSORS ONLINE</p>
              <h2>124</h2>

              <span className="success-text">
                ● 98.4% OPERATIONAL
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✦</div>

            <div>
              <p>RESPONSE TEAMS</p>
              <h2>{current.responseTeams}</h2>

              <span className="success-text">
                ● READY TO DEPLOY
              </span>
            </div>
          </div>
        </section>

        {/* MAP + ALERTS */}
        <section className="content-grid">
          <div className="panel map-panel">
            <div className="panel-header">
              <div>
                <span className="section-tag">
                  GEOSPATIAL INTELLIGENCE
                </span>

                <h3>Live Risk Zone Map</h3>

                <p>
                  Current status: {current.mapStatus}
                </p>
              </div>

              <span className="map-live">
                ● LIVE
              </span>
            </div>

            <div className="map-status-legend">
              <span>
                <i className="safe-dot"></i>
                SAFE
              </span>

              <span>
                <i className="alert-dot"></i>
                ALERT
              </span>

              <span>
                <i className="warning-dot"></i>
                WARNING
              </span>

              <span>
                <i className="critical-dot"></i>
                CRITICAL
              </span>
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
                  radius={
                    disasterState === 'CRITICAL'
                      ? 28
                      : disasterState === 'WARNING'
                      ? 24
                      : 20
                  }
                  pathOptions={{
                    color: getMapColor(),
                    fillColor: getMapColor(),
                    fillOpacity: 0.6,
                    weight: 3,
                  }}
                >
                  <Popup>
                    <strong>
                      FlashGuard AI Monitoring Zone
                    </strong>

                    <br />

                    Current State: {disasterState}

                    <br />

                    Risk Level: {current.mapStatus}
                  </Popup>
                </CircleMarker>

                <CircleMarker
                  center={[28.4595, 77.0266]}
                  radius={12}
                  pathOptions={{
                    color: '#2563eb',
                    fillColor: '#60a5fa',
                    fillOpacity: 0.7,
                  }}
                >
                  <Popup>
                    IoT Sensor Station
                    <br />
                    Status: ONLINE
                  </Popup>
                </CircleMarker>

                <CircleMarker
                  center={[28.6139, 77.209]}
                  radius={10}
                  pathOptions={{
                    color: '#16a34a',
                    fillColor: '#22c55e',
                    fillOpacity: 0.7,
                  }}
                >
                  <Popup>
                    Response Station
                    <br />
                    Status: READY
                  </Popup>
                </CircleMarker>
              </MapContainer>
            </div>
          </div>

          {/* RECENT ALERTS */}
          <div className="panel alerts-panel">
            <div className="panel-header">
              <div>
                <span className="section-tag">
                  SYSTEM EVENTS
                </span>

                <h3>Recent Alerts</h3>

                <p>Latest system activity</p>
              </div>

              <button
                className="text-button"
                onClick={() => setShowAllAlerts(!showAllAlerts)}
              >
                {showAllAlerts ? 'SHOW LESS ↑' : 'VIEW ALL →'}
              </button>
            </div>

            <div className="alert-list">
              {visibleAlerts.map((alert, index) => (
                <div
                  className="alert-item"
                  key={index}
                >
                  <span className="alert-level"></span>

                  <div>
                    <strong>{alert.title}</strong>

                    <p>{alert.description}</p>

                    <span className="alert-time">
                      ● {alert.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM SECTION */}
        <section className="bottom-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="section-tag">
                  LIVE TELEMETRY
                </span>

                <h3>IoT Sensor Activity</h3>

                <p>
                  Real-time readings from monitoring stations
                </p>
              </div>
            </div>

            <div className="sensor-list">
              <div className="sensor">
                <div className="sensor-icon">☔</div>

                <div className="sensor-info">
                  <strong>Rainfall Sensor</strong>

                  <p>Station A-12 • Online</p>
                </div>

                <span>{current.rainfall}</span>
              </div>

              <div className="sensor">
                <div className="sensor-icon">≈</div>

                <div className="sensor-info">
                  <strong>Water Level</strong>

                  <p>River Station B-04 • Online</p>
                </div>

                <span>{current.waterLevel}</span>
              </div>

              <div className="sensor">
                <div className="sensor-icon">≋</div>

                <div className="sensor-info">
                  <strong>Wind Speed</strong>

                  <p>Weather Station C-09 • Online</p>
                </div>

                <span>{current.windSpeed}</span>
              </div>
            </div>
          </div>

          {/* RESPONSE */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="section-tag">
                  EMERGENCY RESPONSE
                </span>

                <h3>Response Overview</h3>

                <p>
                  Current emergency network status
                </p>
              </div>
            </div>

            <div className="response-info">
              <div className="response-number">
                <strong>{current.incidents}</strong>
                <span>INCIDENTS</span>
              </div>

              <div className="response-number">
                <strong>{current.riskZones}</strong>
                <span>RISK ZONES</span>
              </div>

              <div className="response-number">
                <strong>{current.responseTeams}</strong>
                <span>TEAMS READY</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App