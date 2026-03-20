'use client';

import { cn } from '@/lib/cn';

export const RANGES = [
  { label: '7d',  days: 7  },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const;

export type RangeDays = (typeof RANGES)[number]['days'];

interface RangeSelectorProps {
  value: RangeDays;
  onChange: (days: RangeDays) => void;
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
      {RANGES.map(({ label, days }) => (
        <button
          key={days}
          onClick={() => onChange(days)}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
            value === days ? 'bg-[#007AFF] text-white' : 'text-[#AAAAAA] hover:text-white',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
