import React, { useState } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  Radio,
  Send,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Terminal,
  WifiOff,
} from 'lucide-react';
import { Alert, BroadcastPayload, BroadcastResponse, RiskLevel, SMSAlertResponse } from '../types/api';
import { sendDemoSMSAlert, sendEmergencyBroadcast } from '../services/api';
import { UTTARAKHAND_DISTRICTS } from '../data/demoData';
import { DashboardPage } from '../components/layout/Sidebar';
import { KeypadPhonePreview } from '../components/broadcast/KeypadPhonePreview';

interface BroadcastPageProps {
  defaultDistrict?: string;
  onAlertCreated?: (alert: Alert) => void;
  onRefresh?: () => void;
  onNavigate?: (page: DashboardPage) => void;
}

export const BroadcastPage: React.FC<BroadcastPageProps> = ({
  defaultDistrict,
  onAlertCreated,
  onRefresh,
  onNavigate,
}) => {
  const [severity, setSeverity] = useState<RiskLevel>('CRITICAL');
  const [district, setDistrict] = useState<string>(defaultDistrict || 'Chamoli');
  const [targetArea, setTargetArea] = useState<string>('Upper Catchment & River Banks');
  const [message, setMessage] = useState<string>(
    'URGENT: Rapid water level rise detected in river basin. Immediate evacuation advised from low-lying areas. Move to designated SDRF shelters.'
  );
  const [channels, setChannels] = useState<{ fcm: boolean; sms: boolean; dashboard: boolean }>({
    fcm: true,
    sms: true,
    dashboard: true,
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [response, setResponse] = useState<BroadcastResponse | null>(null);
  const [showPayloadPreview, setShowPayloadPreview] = useState<boolean>(false);

  const [targetPhoneNumber, setTargetPhoneNumber] = useState<string>('8076675259');
  const [lastDeliveredSMS, setLastDeliveredSMS] = useState<SMSAlertResponse | null>(null);

  const toggleChannel = (channelKey: 'fcm' | 'sms' | 'dashboard') => {
    setChannels((prev) => ({ ...prev, [channelKey]: !prev[channelKey] }));
  };

  const selectedChannelsList: ('FCM' | 'SMS' | 'DASHBOARD')[] = [
    ...(channels.fcm ? ['FCM' as const] : []),
    ...(channels.sms ? ['SMS' as const] : []),
    ...(channels.dashboard ? ['DASHBOARD' as const] : []),
  ];

  const payloadPreview: BroadcastPayload = {
    severity,
    district,
    target_area: targetArea,
    message,
    channels: selectedChannelsList,
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || selectedChannelsList.length === 0) return;

    setSubmitting(true);
    setResponse(null);

    try {
      const res = await sendEmergencyBroadcast(payloadPreview);
      setResponse(res);

      // If SMS channel is active, also dispatch SMS demonstration to Keypad Phone
      if (channels.sms) {
        try {
          const smsRes = await sendDemoSMSAlert({
            phone_number: targetPhoneNumber,
            location: `${district} - ${targetArea || 'Valley'}`,
            risk_level: severity,
            risk_score: severity === 'CRITICAL' ? 88 : severity === 'HIGH' ? 68 : 42,
            disaster_type: 'flash flood',
          });
          if (smsRes.data && smsRes.data.success) {
            setLastDeliveredSMS(smsRes.data);
          }
        } catch (smsErr) {
          console.error('SMS Demo dispatch error:', smsErr);
        }
      }

      if (res.success) {
        const createdAlert: Alert = {
          id: res.alert_id || `ALT-${Date.now()}`,
          severity,
          title: `${severity} Emergency Broadcast: ${district}`,
          district,
          location: targetArea || `${district} Sector`,
          message,
          risk_source: `Emergency Broadcast Gateway (${selectedChannelsList.join(', ')})`,
          status: 'ACTIVE',
          timestamp: res.broadcast_time || new Date().toISOString(),
          channels: selectedChannelsList,
          recommended_action: 'Follow emergency evacuation protocols',
        };

        if (onAlertCreated) {
          onAlertCreated(createdAlert);
        }
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (err: any) {
      setResponse({
        success: false,
        message: 'Backend alert service not configured',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto font-mono text-xs">
      {/* Page Header */}
      <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              EMERGENCY BROADCAST & CELLULAR SMS CONSOLE
            </h1>
          </div>
          <p className="text-slate-400 text-[11px] mt-1">
            Authorized administrative emergency dissemination gateway. Relays alerts across citizen Flutter push and telecom SMS networks for basic keypad phones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            REST API: <strong className="text-white">POST /api/v1/alerts</strong>
          </div>
          <div className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            SMS DEMO: <strong className="text-emerald-400">POST /api/v1/demo/send-alert</strong>
          </div>
        </div>
      </div>

      {/* Safety & Protocol Banner */}
      <div className="bg-red-950/40 border border-red-800/80 p-3 rounded-lg text-slate-300 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-[11px]">
          <span className="font-bold text-red-300 uppercase">Emergency Protocol Advisory:</span>
          <p className="text-slate-400 leading-relaxed">
            Disaster broadcasts reach smartphone users via high-priority push notifications and basic keypad phone users via 160-character GSM SMS segments. Phone numbers are protected with strict end-to-end masking (<code className="text-amber-300">******0957</code>).
          </p>
        </div>
      </div>

      {/* Main Grid: Broadcast Form (Left) & Keypad Simulation + Verification (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Broadcast Controls */}
        <form onSubmit={handleBroadcastSubmit} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          {/* Quick Scenario Templates */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-400 uppercase text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Emergency Presets</span>
              </label>
              <span className="text-[10px] text-slate-500">Auto-fills GSM-tested text</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  title: 'Joshimath Flash Flood',
                  sub: 'Chamoli · CRITICAL',
                  district: 'Chamoli',
                  targetArea: 'Upper Catchment & River Banks',
                  sev: 'CRITICAL' as RiskLevel,
                  msg: 'URGENT: Rapid water level rise detected in river basin. Immediate evacuation advised from low-lying areas. Move to designated SDRF shelters.',
                },
                {
                  title: 'Kedarnath Cloudburst',
                  sub: 'Rudraprayag · HIGH',
                  district: 'Rudraprayag',
                  targetArea: 'Mandakini Valley & Gaurikund',
                  sev: 'HIGH' as RiskLevel,
                  msg: 'WARNING: Extreme cloudburst rainfall detected along Mandakini. All pilgrim movement suspended. Move away from riverbanks to high ground.',
                },
                {
                  title: 'Rishikesh High Water',
                  sub: 'Dehradun · WARNING',
                  district: 'Dehradun',
                  targetArea: 'Pashulok Barrage & Low Ghats',
                  sev: 'WARNING' as RiskLevel,
                  msg: 'ADVISORY: Upstream dam discharge will elevate Ganga water levels above warning threshold. Clear all bathing ghats and river floodplains.',
                },
              ].map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => {
                    setSeverity(preset.sev);
                    setDistrict(preset.district);
                    setTargetArea(preset.targetArea);
                    setMessage(preset.msg);
                  }}
                  className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-left transition-colors group"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-amber-300">
                    {preset.title}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{preset.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Severity Selector */}
          <div>
            <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1.5">
              Alert Severity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CRITICAL', label: 'CRITICAL', desc: 'Immediate threat & evacuation', color: 'border-red-600 bg-red-950/60 text-red-300' },
                { id: 'HIGH', label: 'HIGH', desc: 'Severe flood / landslide risk', color: 'border-orange-600 bg-orange-950/60 text-orange-300' },
                { id: 'WARNING', label: 'WARNING', desc: 'Precautionary weather watch', color: 'border-amber-500 bg-amber-950/60 text-amber-300' },
              ].map((sev) => (
                <button
                  key={sev.id}
                  type="button"
                  onClick={() => setSeverity(sev.id as RiskLevel)}
                  className={`p-2.5 rounded border text-left transition-all ${severity === sev.id
                      ? `${sev.color} ring-1 ring-white/20 font-bold shadow-md`
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                >
                  <div className="text-xs">{sev.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{sev.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* District & Target Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1">
                Target District
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2.5 rounded focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {UTTARAKHAND_DISTRICTS.map((d) => (
                  <option key={d} value={d} className="bg-slate-900 text-slate-100">
                    {d} District
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1">
                Target Specific Area / River Basin
              </label>
              <input
                type="text"
                value={targetArea}
                onChange={(e) => setTargetArea(e.target.value)}
                placeholder="e.g. Alaknanda Riverbanks, Badrinath Route"
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-2.5 rounded focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Message Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400 uppercase text-[10px] font-bold">
                Broadcast Advisory Message
              </label>
              <span className={`text-[10px] ${message.length <= 160 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {message.length} / 280 chars ({message.length <= 160 ? '1 GSM Segment' : '2 GSM Segments'})
              </span>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="State clear evacuation advice, affected zones, and assembly safe points..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 p-3 rounded focus:outline-none focus:border-red-500 leading-relaxed"
            />
          </div>

          {/* Delivery Channels */}
          <div>
            <label className="block text-slate-400 uppercase text-[10px] font-bold mb-1.5">
              Disaster Dissemination Channels
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer select-none transition-colors ${channels.fcm ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                <input
                  type="checkbox"
                  checked={channels.fcm}
                  onChange={() => toggleChannel('fcm')}
                  className="rounded bg-slate-900 border-slate-700 text-red-500 focus:ring-0"
                />
                <div>
                  <span className="font-bold block text-xs">Flutter Push</span>
                  <span className="text-[9px] text-slate-400">Citizen App</span>
                </div>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer select-none transition-colors ${channels.sms ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={() => toggleChannel('sms')}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <div>
                  <span className="font-bold block text-xs">SMS Gateway</span>
                  <span className="text-[9px] text-slate-400">Keypad Phones</span>
                </div>
              </label>

              <label className={`flex items-center gap-2 p-2.5 rounded border cursor-pointer select-none transition-colors ${channels.dashboard ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}>
                <input
                  type="checkbox"
                  checked={channels.dashboard}
                  onChange={() => toggleChannel('dashboard')}
                  className="rounded bg-slate-900 border-slate-700 text-red-500 focus:ring-0"
                />
                <div>
                  <span className="font-bold block text-xs">Dashboard</span>
                  <span className="text-[9px] text-slate-400">Inter-agency</span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPayloadPreview(!showPayloadPreview)}
              className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showPayloadPreview ? 'Hide Payload' : 'Inspect JSON Payload'}</span>
            </button>

            <button
              type="submit"
              disabled={submitting || !message.trim() || selectedChannelsList.length === 0}
              className="px-6 py-3 rounded bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold tracking-wider uppercase transition-colors flex items-center gap-2 shadow-lg shadow-red-950"
            >
              <Send className={`w-4 h-4 ${submitting ? 'animate-pulse' : ''}`} />
              <span>{submitting ? 'DISPATCHING TO BACKEND...' : 'TRANSMIT BROADCAST'}</span>
            </button>
          </div>
        </form>

        {/* Right Column: Keypad Phone Simulation & Status */}
        <div className="lg:col-span-5 space-y-4">
          {/* Keypad Phone Live Simulator */}
          <KeypadPhonePreview
            district={district}
            targetArea={targetArea}
            severity={severity}
            broadcastMessage={message}
            defaultPhoneNumber={targetPhoneNumber}
            lastDeliveredSMS={lastDeliveredSMS}
            onSMSDispatched={(res) => setLastDeliveredSMS(res)}
          />

          {/* Backend Response Display */}
          {response && (
            <div
              className={`p-3.5 rounded-lg border space-y-1.5 animate-in fade-in ${response.success
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-red-950/80 border-red-700 text-red-200'
                }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {response.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
                <span>{response.success ? 'TRANSMISSION CONFIRMED' : 'BACKEND BROADCAST STATUS'}</span>
              </div>
              <div className="text-xs font-semibold">
                {response.message}
              </div>
              {response.broadcast_time && (
                <div className="text-[10px] text-slate-400 pt-1">
                  Timestamp: {response.broadcast_time}
                </div>
              )}
              {response.success && onNavigate && (
                <div className="pt-2 flex flex-wrap gap-2 border-t border-emerald-800/60 mt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('alerts')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors shadow"
                  >
                    View in Active Alerts →
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('overview')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-600 transition-colors"
                  >
                    View on Overview →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payload JSON Inspector */}
          {showPayloadPreview && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px]">
              <div className="text-slate-500 uppercase text-[10px] font-bold mb-1">
                FastAPI Request Payload (POST /api/v1/alerts)
              </div>
              <pre className="text-slate-300 bg-slate-900 p-2.5 rounded overflow-x-auto text-[10px] leading-tight">
                {JSON.stringify(payloadPreview, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
