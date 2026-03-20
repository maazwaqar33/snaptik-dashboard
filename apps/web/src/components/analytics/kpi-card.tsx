'use client';

import { cn } from '@/lib/cn';

interface KpiCardProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

export function KpiCard({ icon: Icon, iconBg, iconColor, label, value, delta, up }: KpiCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#121212] p-4">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', iconBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-[#AAAAAA]">{label}</p>
        <p className="mt-0.5 font-outfit text-xl font-bold text-white">{value}</p>
      </div>
      <span className={cn('shrink-0 text-xs font-semibold', up ? 'text-[#34C759]' : 'text-[#FF3B30]')}>
        {delta}
      </span>
    </div>
  );
}
