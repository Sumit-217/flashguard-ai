import React from 'react';
import { RiskLevel } from '../../types/api';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  size = 'md',
  showPulse = false,
  score,
}) => {
  const getColors = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/40',
          text: 'text-red-400',
          dot: 'bg-red-500',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/40',
          text: 'text-orange-400',
          dot: 'bg-orange-500',
        };
      case 'MODERATE':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/40',
          text: 'text-yellow-400',
          dot: 'bg-yellow-400',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
        };
    }
  };

  const colors = getColors();

  const sizeClasses = {
    sm: 'text-[9px] px-2 py-0.5 font-bold tracking-wide rounded',
    md: 'text-[10px] px-2.5 py-0.5 font-bold tracking-wider rounded-md',
    lg: 'text-xs px-3 py-1 font-bold tracking-widest rounded-md',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 border uppercase font-mono ${colors.bg} ${colors.border} ${colors.text} ${sizeClasses}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {showPulse && (level === 'CRITICAL' || level === 'HIGH') && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.dot}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${colors.dot}`} />
      </span>
      <span>{level}</span>
      {typeof score === 'number' && (
        <span className="opacity-80 text-[9px] font-mono border-l border-white/10 pl-1 ml-0.5">
          {score}
        </span>
      )}
    </span>
  );
};
