import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Sliders,
  Tent,
  X,
} from 'lucide-react';
import { GeoJSONData, RiskLevel, StationRisk } from '../../types/api';
import { UTTARAKHAND_DISTRICTS } from '../../data/demoData';

export interface EvacuationRoute {
  id: string;
  name: string;
  district: string;
  hazardDescription: string;
  hazardCenter: [number, number];
  hazardRadiusMeters: number;
  blockedRoadName: string;
  blockedWaypoints: [number, number][];
  originName: string;
  originCoords: [number, number];
  destinationName: string;
  destinationCoords: [number, number];
  distanceKm: string;
  elevationGainM: string;
  estTime: string;
  clearanceStatus: string;
  waypoints: [number, number][];
}

export const EVACUATION_ROUTES: EvacuationRoute[] = [
  {
    id: 'joshimath-sunil',
    name: 'Joshimath — Sunil Ridge Corridor',
    district: 'Chamoli',
    hazardDescription: 'Alaknanda Gorge Flash Flood (Submerged Riverbed)',
    hazardCenter: [30.562, 79.554],
    hazardRadiusMeters: 550,
    blockedRoadName: 'Alaknanda Riverside Ghat Road',
    blockedWaypoints: [
      [30.556, 79.551],
      [30.562, 79.554],
      [30.568, 79.557],
    ],
    originName: 'Joshimath Upper Bazaar Safe Assembly',
    originCoords: [30.556, 79.567],
    destinationName: 'SDRF Sunil High-Ground Mountain Shelter',
    destinationCoords: [30.543, 79.584],
    distanceKm: '3.6 km',
    elevationGainM: '+280m',
    estTime: '14m vehicle / 42m foot',
    clearanceStatus: 'CLEARED BY SDRF (HIGH GROUND)',
    // These waypoints are strictly 1.4km to 3.6km to the east/south-east, completely outside the 550m red circle!
    waypoints: [
      [30.556, 79.567],
      [30.553, 79.572],
      [30.549, 79.577],
      [30.545, 79.581],
      [30.543, 79.584],
    ],
  },
  {
    id: 'rudraprayag-mandakini',
    name: 'Mandakini — Agastyamuni Route',
    district: 'Rudraprayag',
    hazardDescription: 'Mandakini Torrential Surge Channel',
    hazardCenter: [30.365, 79.014],
    hazardRadiusMeters: 550,
    blockedRoadName: 'Low Riverbank Highway Segment',
    blockedWaypoints: [
      [30.352, 79.012],
      [30.365, 79.014],
      [30.378, 79.016],
    ],
    originName: 'Tilwara High Gathering Ground',
    originCoords: [30.346, 79.028],
    destinationName: 'Agastyamuni Higher Ground Stadium Shelter',
    destinationCoords: [30.392, 79.035],
    distanceKm: '5.2 km',
    elevationGainM: '+190m',
    estTime: '18m vehicle / 1h 05m foot',
    clearanceStatus: 'MONITORED - CLEAR',
    // Strictly 1.5km to 3.5km east of the river channel, avoiding the 550m hazard circle
    waypoints: [
      [30.346, 79.028],
      [30.357, 79.031],
      [30.369, 79.033],
      [30.381, 79.0345],
      [30.392, 79.035],
    ],
  },
  {
    id: 'rishikesh-aiims',
    name: 'Rishikesh Ganga Bypass Route',
    district: 'Dehradun',
    hazardDescription: 'Low Ghats & Riverbed Floodplain',
    hazardCenter: [30.108, 78.304],
    hazardRadiusMeters: 550,
    blockedRoadName: 'Triveni Low River Promenade',
    blockedWaypoints: [
      [30.115, 78.307],
      [30.108, 78.304],
      [30.1, 78.3],
    ],
    originName: 'Triveni Elevated Bus Depot',
    originCoords: [30.116, 78.291],
    destinationName: 'AIIMS Rishikesh Trauma & Evacuation Hub',
    destinationCoords: [30.0768, 78.2882],
    distanceKm: '4.2 km',
    elevationGainM: '+45m',
    estTime: '12m vehicle / 38m foot',
    clearanceStatus: '100% CLEAR',
    // Strictly 1.6km to 3.7km west along bypass, avoiding the 550m hazard circle
    waypoints: [
      [30.116, 78.291],
      [30.105, 78.289],
      [30.092, 78.288],
      [30.0768, 78.2882],
    ],
  },
];

interface RiskMapProps {
  stations: StationRisk[];
  geoData: GeoJSONData | null;
  onSelectStation: (station: StationRisk) => void;
  isEmbedded?: boolean;
  onExpandToFullMap?: () => void;
  initialCenter?: [number, number];
}

const RISK_COLORS: Record<RiskLevel, { hex: string; bg: string; text: string }> = {
  LOW: { hex: '#22c55e', bg: 'bg-emerald-500', text: 'text-emerald-400' },
  MODERATE: { hex: '#eab308', bg: 'bg-amber-500', text: 'text-amber-400' },
  HIGH: { hex: '#f97316', bg: 'bg-orange-500', text: 'text-orange-400' },
  CRITICAL: { hex: '#ef4444', bg: 'bg-red-500', text: 'text-red-400' },
};

export const RiskMap: React.FC<RiskMapProps> = ({
  stations,
  geoData,
  onSelectStation,
  isEmbedded = false,
  onExpandToFullMap,
  initialCenter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  // Evacuation Routing State
  const [showEvacuationRoute, setShowEvacuationRoute] = useState<boolean>(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('joshimath-sunil');

  // Filters
  const [riskFilter, setRiskFilter] = useState<'ALL' | RiskLevel>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered stations list
  const filteredStations = stations.filter((stn) => {
    if (riskFilter !== 'ALL' && stn.risk_level !== riskFilter) return false;
    if (districtFilter !== 'ALL' && stn.district !== districtFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = stn.name.toLowerCase().includes(q);
      const matchId = stn.id.toLowerCase().includes(q);
      const matchDist = stn.district.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDist) return false;
    }
    return true;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCoords = initialCenter || [30.25, 79.15];
      const map = L.map(mapContainerRef.current, {
        center: initialCoords,
        zoom: isEmbedded ? 7 : 8,
        minZoom: 6,
        maxZoom: 15,
        zoomControl: !isEmbedded,
        attributionControl: false,
      });

      // Dark Basemap tile layer (No watermark)
      L.tileLayer(
        'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(map);

      // Attribution
      L.control
        .attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('&copy; OpenStreetMap, &copy; CARTO | FlashGuard AI')
        .addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      const routeGroup = L.layerGroup().addTo(map);
      routeLayerRef.current = routeGroup;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        routeLayerRef.current = null;
      }
    };
  }, [isEmbedded]);

  // Render Evacuation Route & Hazard Avoidance Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeLayerRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    if (!showEvacuationRoute) return;

    const route =
      EVACUATION_ROUTES.find((r) => r.id === selectedRouteId) ||
      EVACUATION_ROUTES[0];
    if (!route) return;

    // 1. Hazard Inundation / Flash Flood Buffer Zone (Red semi-transparent warning circle)
    const hazardCircle = L.circle(route.hazardCenter, {
      radius: route.hazardRadiusMeters,
      color: '#ef4444',
      fillColor: '#ef4444',
      fillOpacity: 0.25,
      weight: 2,
      dashArray: '6, 6',
    });

    hazardCircle.bindTooltip(
      `⚠️ HAZARD BUFFER: ${route.hazardDescription} (AVOIDED BY SAFE ROUTE)`,
      {
        permanent: false,
        direction: 'top',
        className:
          'font-mono text-xs bg-red-950 text-red-200 border border-red-700',
      }
    );
    hazardCircle.addTo(routeGroup);

    // 2. Blocked Impassable Road (Dashed Crimson Line through the flood zone)
    if (route.blockedWaypoints && route.blockedWaypoints.length > 0) {
      const blockedLine = L.polyline(route.blockedWaypoints, {
        color: '#f43f5e',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '6, 8',
      });
      blockedLine.bindTooltip(
        `⛔ IMPASSABLE ROAD: ${route.blockedRoadName} (SUBMERGED / BLOCKED)`,
        {
          permanent: false,
          direction: 'top',
          className:
            'font-mono text-xs bg-red-950 text-red-200 border border-red-700',
        }
      );
      blockedLine.addTo(routeGroup);

      // Blocked Warning Pin
      const blockedIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-6 h-6 rounded-full bg-red-950 border border-red-500 text-red-400 font-bold text-[10px] shadow-md">
            ⛔
          </div>
        `,
        className: 'custom-blocked-pin',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const blockedMarker = L.marker(route.hazardCenter, { icon: blockedIcon });
      blockedMarker.bindPopup(`
        <div class="font-mono text-xs p-1 select-text">
          <div class="font-bold text-red-400 uppercase">⛔ Impassable Road Blockade</div>
          <div class="text-white text-xs mt-0.5">${route.blockedRoadName}</div>
          <div class="text-red-300 text-[10px] mt-1 font-semibold">Status: Submerged. Safe Evacuation diverted around high ridge.</div>
        </div>
      `);
      blockedMarker.addTo(routeGroup);
    }

    // 3. Safe Evacuation Route Polyline (Multi-layer glowing emerald corridor on high ground)
    const outerLine = L.polyline(route.waypoints, {
      color: '#059669',
      weight: 8,
      opacity: 0.4,
      lineCap: 'round',
      lineJoin: 'round',
    });
    outerLine.addTo(routeGroup);

    const innerLine = L.polyline(route.waypoints, {
      color: '#10b981',
      weight: 4,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    });
    innerLine.bindTooltip(
      `SAFE EVACUATION CORRIDOR: ${route.name} (${route.distanceKm})`,
      {
        permanent: false,
        direction: 'top',
        className:
          'font-mono text-xs bg-slate-900 text-emerald-300 border border-emerald-600',
      }
    );
    innerLine.addTo(routeGroup);

    // 3. Origin Marker (Evacuation Assembly Point)
    const originIcon = L.divIcon({
      html: `
        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-black border-2 border-white shadow-lg font-bold text-xs">
          🚩
        </div>
      `,
      className: 'custom-route-pin',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const originMarker = L.marker(route.originCoords, { icon: originIcon });
    originMarker.bindPopup(`
      <div class="font-mono text-xs p-1 select-text">
        <div class="font-bold text-amber-400 uppercase">🚩 Evacuation Muster Point</div>
        <div class="text-white text-sm font-semibold mt-1">${route.originName}</div>
        <div class="text-slate-400 text-[10px] mt-1">District: ${route.district}</div>
        <div class="text-emerald-400 text-[10px] font-bold mt-1">Status: Active Gathering Area</div>
      </div>
    `);
    originMarker.addTo(routeGroup);

    // 4. Destination Marker (SDRF Safe Shelter)
    const destIcon = L.divIcon({
      html: `
        <div class="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white border-2 border-white shadow-lg font-bold text-xs">
          🛡️
        </div>
      `,
      className: 'custom-route-pin',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const destMarker = L.marker(route.destinationCoords, { icon: destIcon });
    destMarker.bindPopup(`
      <div class="font-mono text-xs p-1 select-text">
        <div class="font-bold text-emerald-400 uppercase">🛡️ Designated SDRF Shelter</div>
        <div class="text-white text-sm font-semibold mt-1">${route.destinationName}</div>
        <div class="text-slate-400 text-[10px] mt-1">Ascent: ${route.elevationGainM} above flood stage</div>
        <div class="text-emerald-400 text-[10px] font-bold mt-1">Clearance: ${route.clearanceStatus}</div>
      </div>
    `);
    destMarker.addTo(routeGroup);

    // Zoom and pan to route corridor bounds
    const bounds = L.latLngBounds([...route.waypoints, route.hazardCenter]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13, animate: true });
  }, [showEvacuationRoute, selectedRouteId]);

  // Update Markers whenever filtered stations or geoData change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    filteredStations.forEach((station) => {
      const color = RISK_COLORS[station.risk_level] || RISK_COLORS.LOW;
      const isCritical = station.risk_level === 'CRITICAL';
      const isHigh = station.risk_level === 'HIGH';

      // Custom HTML Marker using DivIcon
      const htmlIcon = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 28px; height: 28px;">
          ${
            isCritical
              ? `<div class="radar-ping absolute w-7 h-7 rounded-full bg-red-500/40"></div>`
              : isHigh
              ? `<div class="animate-pulse absolute w-6 h-6 rounded-full bg-orange-500/30"></div>`
              : ''
          }
          <div style="background-color: ${color.hex}; border: 2px solid #0f172a; box-shadow: 0 0 10px ${color.hex}80;" 
               class="w-3.5 h-3.5 rounded-full z-10 transition-transform group-hover:scale-125">
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: htmlIcon,
        className: 'custom-station-pin',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([station.coordinates[0], station.coordinates[1]], {
        icon: customIcon,
      });

      // Dark styled popup
      const popupContent = document.createElement('div');
      popupContent.className = 'text-xs font-mono select-text';
      popupContent.innerHTML = `
        <div class="space-y-2 p-1">
          <div class="flex items-center justify-between border-b border-slate-700 pb-1.5 gap-2">
            <span class="font-bold text-slate-100 text-sm truncate">${station.name}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold" 
                  style="background-color: ${color.hex}25; color: ${color.hex}; border: 1px solid ${color.hex}80;">
              ${station.risk_level} (${station.risk_score})
            </span>
          </div>

          <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-300">
            <div><span class="text-slate-500 text-[10px] block">DISTRICT</span>${station.district}</div>
            <div><span class="text-slate-500 text-[10px] block">STATUS</span><span class="${station.status === 'ONLINE' ? 'text-emerald-400' : 'text-red-400'}">● ${station.status}</span></div>
            <div><span class="text-slate-500 text-[10px] block">24H RAINFALL</span><strong class="text-blue-400 font-bold">${station.rainfall_24h} mm</strong></div>
            <div><span class="text-slate-500 text-[10px] block">1H RAINFALL</span><strong class="text-blue-300">${station.rainfall_1h} mm</strong></div>
            ${
              station.water_level !== undefined && station.danger_level !== undefined
                ? `<div class="col-span-2 text-[10px]"><span class="text-slate-500">RIVER STAGE:</span> <strong class="${station.water_level >= station.danger_level ? 'text-red-400' : 'text-slate-200'}">${station.water_level}m</strong> / Danger: ${station.danger_level}m</div>`
                : ''
            }
            <div class="col-span-2 text-[10px] text-slate-500 truncate">
              SRC: ${station.data_source}
            </div>
          </div>

          <div class="pt-2 border-t border-slate-700/80 flex justify-end">
            <button id="open-details-${station.id}" 
                    class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-600 text-xs font-mono transition-colors flex items-center gap-1">
              <span>Open Details</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 320 });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`open-details-${station.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectStation(station);
            marker.closePopup();
          };
        }
      });

      marker.addTo(markersGroup);
    });
  }, [filteredStations, onSelectStation]);

  // Center on coordinates if requested
  useEffect(() => {
    if (initialCenter && mapInstanceRef.current) {
      mapInstanceRef.current.setView(initialCenter, 10, { animate: true });
    }
  }, [initialCenter]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      {/* Map Control Bar (for full map mode) */}
      {!isEmbedded && (
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono z-10">
          <div className="flex flex-wrap items-center gap-2">
            {/* Risk filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
              <span className="text-slate-500 px-1 text-[11px] uppercase">Risk:</span>
              {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setRiskFilter(lvl)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    riskFilter === lvl
                      ? lvl === 'CRITICAL'
                        ? 'bg-red-600 text-white font-bold'
                        : lvl === 'HIGH'
                        ? 'bg-orange-600 text-white font-bold'
                        : lvl === 'MODERATE'
                        ? 'bg-amber-600 text-white font-bold'
                        : lvl === 'LOW'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* District filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              <span className="text-slate-500 text-[11px] uppercase">District:</span>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">
                  All Districts (13)
                </option>
                {UTTARAKHAND_DISTRICTS.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-slate-200">
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Safe Evacuation Route Toggle */}
            <button
              type="button"
              onClick={() => setShowEvacuationRoute(!showEvacuationRoute)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                showEvacuationRoute
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950 ring-1 ring-emerald-300'
                  : 'bg-slate-950 text-slate-300 hover:text-white hover:border-slate-700 border-slate-800'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safe Evacuation Path</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  showEvacuationRoute
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {showEvacuationRoute ? 'ACTIVE' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search station or ID..."
                className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 text-xs w-48 sm:w-56 focus:outline-none focus:border-slate-600"
              />
            </div>
            <div className="text-[11px] text-slate-400 px-2 py-1 bg-slate-950 rounded border border-slate-800">
              Showing <strong className="text-white">{filteredStations.length}</strong> / {stations.length}
            </div>
          </div>
        </div>
      )}

      {/* Embedded Map Header */}
      {isEmbedded && (
        <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span className="font-bold text-slate-200">LIVE RISK MAP (UTTARAKHAND)</span>
            </div>

            {/* Quick Toggle in Embedded Mode */}
            <button
              type="button"
              onClick={() => setShowEvacuationRoute(!showEvacuationRoute)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors border cursor-pointer ${
                showEvacuationRoute
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-slate-950 text-slate-400 hover:text-emerald-300 border-slate-800'
              }`}
            >
              <Navigation className="w-3 h-3 text-emerald-400" />
              <span>Safe Corridor: {showEvacuationRoute ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {onExpandToFullMap && (
            <button
              type="button"
              onClick={onExpandToFullMap}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-100 transition-colors text-[11px] cursor-pointer"
            >
              <span>View Full Map</span>
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="flex-1 w-full min-h-[300px]" />

      {/* Floating Evacuation Route HUD Panel */}
      {showEvacuationRoute && (
        <div className="absolute top-12 right-3 z-[450] w-72 sm:w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl font-mono text-xs space-y-2 animate-in fade-in slide-in-from-top-2 select-none pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-100 uppercase text-[11px]">
              <Route className="w-4 h-4 text-emerald-400" />
              <span>Safe Evacuation Corridor</span>
            </div>
            <button
              type="button"
              onClick={() => setShowEvacuationRoute(false)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Route Selector Tabs */}
          <div className="grid grid-cols-3 gap-1">
            {EVACUATION_ROUTES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRouteId(r.id)}
                className={`py-1 px-1.5 text-[9.5px] rounded font-bold uppercase truncate transition-colors cursor-pointer ${
                  selectedRouteId === r.id
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {r.district}
              </button>
            ))}
          </div>

          {/* Active Route Details */}
          {(() => {
            const activeRoute =
              EVACUATION_ROUTES.find((r) => r.id === selectedRouteId) ||
              EVACUATION_ROUTES[0];
            return (
              <div className="space-y-1.5 text-[10.5px]">
                <div className="bg-slate-950/80 p-2 rounded border border-slate-800 space-y-0.5">
                  <div className="text-white font-bold text-xs truncate">
                    {activeRoute.name}
                  </div>
                  <div className="text-slate-400 text-[9.5px] leading-tight">
                    Avoiding:{' '}
                    <span className="text-red-400 font-semibold">
                      {activeRoute.hazardDescription}
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="bg-slate-950 p-1 rounded border border-slate-800">
                    <span className="text-slate-500 text-[8.5px] block">DISTANCE</span>
                    <strong className="text-white text-xs">{activeRoute.distanceKm}</strong>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800">
                    <span className="text-slate-500 text-[8.5px] block">ASCENT</span>
                    <strong className="text-emerald-400 text-xs">
                      {activeRoute.elevationGainM}
                    </strong>
                  </div>
                  <div className="bg-slate-950 p-1 rounded border border-slate-800">
                    <span className="text-slate-500 text-[8.5px] block">TIME</span>
                    <strong className="text-cyan-400 text-xs">
                      {activeRoute.estTime.split('/')[0].trim()}
                    </strong>
                  </div>
                </div>

                {/* Waypoints origin and destination */}
                <div className="space-y-1 bg-slate-950/60 p-2 rounded text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-amber-400 font-bold">🚩 From:</span>
                    <span className="truncate">{activeRoute.originName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="text-emerald-400 font-bold">🛡️ To:</span>
                    <span className="truncate">{activeRoute.destinationName}</span>
                  </div>
                </div>

                {/* Clearance Status */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[9.5px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Corridor Safety:</span>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {activeRoute.clearanceStatus}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Floating Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-xs border border-slate-800 p-2 rounded shadow-lg text-[10px] font-mono text-slate-300 z-10 pointer-events-none">
        <div className="font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">
          Disaster Risk Thresholds
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>LOW</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>MODERATE</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
            <span>HIGH</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span>CRITICAL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
