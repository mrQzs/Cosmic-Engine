'use client';

import type { ReactNode } from 'react';

type CalloutType = 'NOTE' | 'WARNING' | 'TIP' | 'DANGER';

interface CalloutBlockProps {
  type: CalloutType;
  children: ReactNode;
}

const calloutConfig: Record<
  CalloutType,
  { icon: string; borderColor: string; bgColor: string; textColor: string }
> = {
  NOTE: {
    icon: 'ℹ',
    borderColor: 'border-cosmic-glow/40',
    bgColor: 'bg-cosmic-glow/5',
    textColor: 'text-cosmic-glow',
  },
  WARNING: {
    icon: '⚠',
    borderColor: 'border-amber-400/40',
    bgColor: 'bg-amber-400/5',
    textColor: 'text-amber-400',
  },
  TIP: {
    icon: '✦',
    borderColor: 'border-emerald-400/40',
    bgColor: 'bg-emerald-400/5',
    textColor: 'text-emerald-400',
  },
  DANGER: {
    icon: '✕',
    borderColor: 'border-cosmic-danger/40',
    bgColor: 'bg-cosmic-danger/5',
    textColor: 'text-cosmic-danger',
  },
};

export default function CalloutBlock({ type, children }: CalloutBlockProps) {
  const config = calloutConfig[type] ?? calloutConfig.NOTE;

  return (
    <div className={`my-4 rounded-lg border-l-4 ${config.borderColor} ${config.bgColor} p-4`}>
      <div
        className={`mb-1 flex items-center gap-2 font-mono text-xs font-semibold uppercase ${config.textColor}`}
      >
        <span>{config.icon}</span>
        <span>{type}</span>
      </div>
      <div className="text-sm text-cosmic-frost/80">{children}</div>
    </div>
  );
}
