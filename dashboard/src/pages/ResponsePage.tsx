import React, { useState } from 'react';
import {
  Building2,
  ExternalLink,
  Flame,
  Hospital,
  LifeBuoy,
  MapPin,
  Navigation,
  Phone,
  Search,
  Shield,
  ShieldAlert,
  Tent,
} from 'lucide-react';
import { ResponseFacilityType, ResponseLocation } from '../types/api';
import { RESPONSE_FACILITIES_SEED, UTTARAKHAND_DISTRICTS } from '../data/demoData';

interface ResponsePageProps {
  onViewOnMap: (coordinates: [number, number]) => void;
}

export const ResponsePage: React.FC<ResponsePageProps> = ({ onViewOnMap }) => {
  const [facilities, setFacilities] = useState<ResponseLocation[]>(RESPONSE_FACILITIES_SEED);
  const [selectedType, setSelectedType] = useState<'ALL' | ResponseFacilityType>('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFacilities = facilities.filter((f) => {
    if (selectedType !== 'ALL' && f.type !== selectedType) return false;
    if (districtFilter !== 'ALL' && f.district !== districtFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchLoc = f.location.toLowerCase().includes(q);
      const matchDist = f.district.toLowerCase().includes(q);
      if (!matchName && !matchLoc && !matchDist) return false;
    }
    return true;
  });

  const getFacilityIcon = (type: ResponseFacilityType) => {
    switch (type) {
      case 'HOSPITAL':
        return <Hospital className="w-4 h-4 text-emerald-400" />;
      case 'FIRE':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'POLICE':
        return <Shield className="w-4 h-4 text-blue-400" />;
      case 'SHELTER':
        return <Tent className="w-4 h-4 text-amber-400" />;
      case 'RELIEF':
        return <LifeBuoy className="w-4 h-4 text-cyan-400" />;
      case 'DEOC':
      default:
        return <Building2 className="w-4 h-4 text-purple-400" />;
    }
  };

  const openNavigation = (coords: [number, number]) => {
    // Open standard geographical navigation URI
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`, '_blank');
  };

  return (
    <div className="p-4 space-y-4 max-w-[1920px] mx-auto font-mono text-xs">
      {/* Header */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              DISASTER RESPONSE & EMERGENCY SAFE INFRASTRUCTURE
            </h1>
          </div>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Designated hospitals, trauma centers, emergency shelters, SDRF headquarters, and district staging camps.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
          STATUS: <strong className="text-emerald-400">READINESS ACTIVE</strong>
        </div>
      </div>

      {/* Integration Notice */}
      <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg flex items-start gap-2.5 text-slate-400 text-[11px]">
        <Building2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-200">State Response Registry Ready: </span>
          Showing certified emergency infrastructure nodes in Uttarakhand. This schema is architected to ingest live telemetry from backend open-data API feeds when provisioned.
        </div>
      </div>

      {/* Filters: Facility Type & District */}
      <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 uppercase text-[10px] mr-1">Facility:</span>
          {(
            [
              { id: 'ALL', label: 'All Facilities' },
              { id: 'HOSPITAL', label: 'Hospitals' },
              { id: 'DEOC', label: 'DEOC / Command' },
              { id: 'SHELTER', label: 'Shelters' },
              { id: 'FIRE', label: 'Fire / Rescue' },
              { id: 'POLICE', label: 'Police Lines' },
              { id: 'RELIEF', label: 'Relief Hubs' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedType(item.id)}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                selectedType === item.id
                  ? 'bg-slate-700 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* District & Search */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase">District:</span>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">
                All Districts
              </option>
              {UTTARAKHAND_DISTRICTS.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-slate-200">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search facility name..."
              className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 text-xs w-48 sm:w-56 focus:outline-none focus:border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredFacilities.length === 0 ? (
          <div className="col-span-full p-8 bg-slate-900 border border-slate-800 rounded-lg text-center text-slate-500">
            No facilities found matching your criteria.
          </div>
        ) : (
          filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg p-4 space-y-3 flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                      {getFacilityIcon(facility.type)}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block uppercase">
                        {facility.type}
                      </span>
                      <h3 className="font-bold text-slate-100 text-sm leading-snug">{facility.name}</h3>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                      facility.status === 'OPERATIONAL'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        : facility.status === 'ENGAGED'
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {facility.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{facility.location}, <strong>{facility.district}</strong></span>
                  </div>

                  {facility.capacity && (
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80 text-[11px]">
                      <span className="text-slate-500 text-[10px] block uppercase">Operational Capacity</span>
                      <span className="text-slate-200 font-medium">{facility.capacity}</span>
                    </div>
                  )}

                  {facility.resource_notes && (
                    <p className="text-[11px] text-slate-400 italic pt-0.5">
                      "{facility.resource_notes}"
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-blue-400 pt-1">
                    <Phone className="w-3 h-3 text-blue-400" />
                    <span>Contact: <strong className="text-white">{facility.contact}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: View on Map, Navigate */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onViewOnMap(facility.coordinates)}
                  className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span>View on Map</span>
                </button>

                <button
                  type="button"
                  onClick={() => openNavigation(facility.coordinates)}
                  className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Navigate</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
