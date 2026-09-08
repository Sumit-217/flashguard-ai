import React, { useState } from 'react';
import {
  AlertTriangle,
  Battery,
  CheckCircle2,
  Copy,
  Loader2,
  Phone,
  Radio,
  Send,
  ShieldAlert,
  Signal,
  Smartphone,
  Volume2,
} from 'lucide-react';
import { RiskLevel, SMSAlertRequest, SMSAlertResponse } from '../../types/api';
import { sendDemoSMSAlert } from '../../services/api';

interface KeypadPhonePreviewProps {
  district: string;
  targetArea: string;
  severity: RiskLevel;
  broadcastMessage: string;
  defaultPhoneNumber?: string;
  lastDeliveredSMS?: SMSAlertResponse | null;
  onSMSDispatched?: (res: SMSAlertResponse) => void;
}

export const KeypadPhonePreview: React.FC<KeypadPhonePreviewProps> = ({
  district,
  targetArea,
  severity,
  broadcastMessage,
  defaultPhoneNumber = '8076675259',
  lastDeliveredSMS,
  onSMSDispatched,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>(defaultPhoneNumber);
  const [sending, setSending] = useState<boolean>(false);
  const [deliveryResult, setDeliveryResult] = useState<SMSAlertResponse | null>(
    lastDeliveredSMS || null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [soundActive, setSoundActive] = useState<boolean>(false);

  // Sync if parent passes new lastDeliveredSMS
  React.useEffect(() => {
    if (lastDeliveredSMS) {
      setDeliveryResult(lastDeliveredSMS);
    }
  }, [lastDeliveredSMS]);

  // Derive risk score based on severity
  const riskScore =
    severity === 'CRITICAL' ? 88 : severity === 'HIGH' ? 68 : 42;

  // Format the standardized emergency GSM message
  const smsBody =
    `FLASHGUARD ALERT: ${severity} flash flood risk detected at ${district} (${targetArea || 'Upper Catchment'}). ` +
    `Risk Score: ${riskScore}. Evacuate immediately to designated safe shelter.`;

  const charCount = smsBody.length;
  const isWithinGsmLimit = charCount <= 160;

  const handleSendSMS = async () => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    if (cleanNumber.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSending(true);
    setErrorMessage(null);

    // Beep sound simulation via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
      setSoundActive(true);
      setTimeout(() => setSoundActive(false), 500);
    } catch {
      // AudioContext may be restricted by browser policy before user gesture
    }

    const payload: SMSAlertRequest = {
      phone_number: cleanNumber,
      location: `${district} - ${targetArea || 'Valley'}`,
      risk_level: severity,
      risk_score: riskScore,
      disaster_type: 'flash flood',
    };

    const res = await sendDemoSMSAlert(payload);
    setSending(false);

    if (res.data && res.data.success) {
      setDeliveryResult(res.data);
      if (onSMSDispatched) {
        onSMSDispatched(res.data);
      }
    } else {
      setErrorMessage(res.error || 'Failed to dispatch demo SMS.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4 font-mono text-xs">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 uppercase tracking-wide text-xs flex items-center gap-1.5">
              Keypad & Feature Phone SMS Gateway
              <span className="px-1.5 py-0.2 text-[9px] rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-normal">
                GSM 160-Char
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Offline disaster alerting for keypad phones without mobile data connectivity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>2G/3G Cell Mesh</span>
        </div>
      </div>

      {/* Recipient Phone Configuration */}
      <div className="bg-slate-950 border border-slate-800 rounded p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Phone className="w-3 h-3 text-cyan-400" />
            <span>Target Citizen / Official Number</span>
          </label>
          <span className="text-[10px] text-slate-500">
            Current Recipient: <strong className="text-white">+91 {phoneNumber}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs">
            <span className="text-slate-400 mr-1">🇮🇳 +91</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="8076675259"
              className="bg-transparent border-none text-white focus:outline-none w-28 tracking-widest font-bold"
              maxLength={15}
            />
          </div>

          <button
            type="button"
            onClick={handleSendSMS}
            disabled={sending || !phoneNumber.trim()}
            className="flex-1 px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            {sending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Demo SMS</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <p className="text-[10px] text-red-400 font-semibold mt-1">
            ⚠ {errorMessage}
          </p>
        )}
      </div>

      {/* Character Counter & GSM Compliance Banner */}
      <div className="flex items-center justify-between text-[10px] px-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">SMS Length:</span>
          <span
            className={`font-bold ${isWithinGsmLimit ? 'text-emerald-400' : 'text-amber-400'
              }`}
          >
            {charCount} / 160 GSM chars
          </span>
        </div>
        <span className="text-slate-500">
          {isWithinGsmLimit
            ? '✓ Fits in 1 single GSM segment'
            : '⚠ Exceeds 160 chars (multi-part SMS)'}
        </span>
      </div>

      {/* Retro Keypad Phone Visual Simulation (Nokia 3310 / JioBharat Style) */}
      <div className="flex justify-center py-2">
        <div
          className={`w-[290px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-4 border-slate-700 rounded-3xl p-3.5 shadow-2xl shadow-black/80 transition-all ${soundActive ? 'ring-2 ring-red-500 scale-105' : ''
            }`}
        >
          {/* Top Speaker Grille & Branding */}
          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="w-10 h-1.5 bg-slate-700 rounded-full" />
            <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span>BHARAT GUARD 2G</span>
            </div>
          </div>

          {/* Monochrome Green / Amber Dot Matrix LCD Screen */}
          <div className="bg-[#8fa778] text-[#1a2d13] p-2.5 rounded-lg border-2 border-[#6d8457] shadow-inner font-mono select-none space-y-1.5 min-h-[170px] flex flex-col justify-between">
            {/* LCD Status Header */}
            <div className="flex items-center justify-between text-[9px] border-b border-[#6d8457]/50 pb-1 font-bold">
              <div className="flex items-center gap-1">
                <span>📶 ▮▮▮▮</span>
                <span>BSNL 2G</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="animate-pulse">✉ (1)</span>
                <span>🔋 96%</span>
              </div>
            </div>

            {/* LCD Message Area */}
            <div className="space-y-1 py-1">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase bg-[#6d8457]/25 px-1 py-0.5 rounded">
                <span>PRIORITY ALRT</span>
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="text-[10.5px] leading-snug tracking-tight font-medium break-words pt-0.5">
                {deliveryResult?.message || smsBody}
              </div>
            </div>

            {/* LCD Softkey Footer */}
            <div className="flex items-center justify-between text-[8.5px] pt-1 border-t border-[#6d8457]/50 font-bold uppercase">
              <span>[ VIEW ]</span>
              <span className="text-[7.5px] tracking-widest">
                {deliveryResult?.recipient || `+91 ${phoneNumber}`}
              </span>
              <span>[ EXIT ]</span>
            </div>
          </div>

          {/* Phone Physical Navigation & Keypad Layout */}
          <div className="mt-3 space-y-2">
            {/* Soft Keys & Call/End Buttons */}
            <div className="grid grid-cols-3 gap-2 px-1 text-slate-300">
              <div className="h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold hover:bg-slate-700">
                —
              </div>
              {/* D-Pad Nav */}
              <div className="h-7 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-[10px] text-slate-400">
                ●
              </div>
              <div className="h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold hover:bg-slate-700">
                —
              </div>
            </div>

            {/* Call & End Buttons */}
            <div className="grid grid-cols-2 gap-3 px-1">
              <div className="h-5 rounded-md bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400 text-[9px] font-bold">
                CALL
              </div>
              <div className="h-5 rounded-md bg-red-950/80 border border-red-600/50 flex items-center justify-center text-red-400 text-[9px] font-bold">
                END
              </div>
            </div>

            {/* 12-Key Numeric Keypad */}
            <div className="grid grid-cols-3 gap-1.5 px-1 pt-1">
              {[
                { num: '1', sub: '._@' },
                { num: '2', sub: 'ABC' },
                { num: '3', sub: 'DEF' },
                { num: '4', sub: 'GHI' },
                { num: '5', sub: 'JKL' },
                { num: '6', sub: 'MNO' },
                { num: '7', sub: 'PQRS' },
                { num: '8', sub: 'TUV' },
                { num: '9', sub: 'WXYZ' },
                { num: '*', sub: '♫' },
                { num: '0', sub: '␣' },
                { num: '#', sub: '⇧' },
              ].map((k) => (
                <div
                  key={k.num}
                  className="h-6 rounded bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700 flex flex-col items-center justify-center text-slate-200 cursor-default select-none shadow-sm"
                >
                  <span className="text-[9px] font-bold leading-none">{k.num}</span>
                  <span className="text-[6.5px] text-slate-400 leading-none">{k.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Backend Delivery Confirmation Report */}
      {deliveryResult && (
        <div className="p-3 rounded border border-emerald-700/80 bg-emerald-950/50 text-emerald-300 space-y-1.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>SMS BROADCAST CONFIRMED</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 font-bold">
              {deliveryResult.delivery_mode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 text-slate-300 border-t border-emerald-800/40">
            <div>
              <span className="text-slate-400">Recipient: </span>
              <strong className="text-white">{deliveryResult.recipient}</strong>
            </div>
            <div>
              <span className="text-slate-400">Encoding: </span>
              <strong className="text-white">GSM 7-bit Def</strong>
            </div>
          </div>

          <div className="text-[9.5px] text-slate-400 pt-0.5">
            Backend Endpoint: <code className="text-emerald-300">POST /api/v1/demo/send-alert</code>
          </div>
        </div>
      )}
    </div>
  );
};
