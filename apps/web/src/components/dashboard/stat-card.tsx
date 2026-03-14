'use client';

import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface StatCardProps {
  label: string;
  value: string | number;
  /** Delta as a percentage string e.g. "+12.4%" */
  delta?: string;
  /** Direction of change — controls color */
  trend?: 'up' | 'down' | 'flat';
  /** Whether "up" is good (green) or bad (red). Default: true */
  upIsGood?: boolean;
  icon: LucideIcon;
  /** Tailwind bg-* class for icon background */
  iconBg?: string;
  /** Tailwind text-* class for icon color */
  iconColor?: string;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  delta,
  trend = 'flat',
  upIsGood = true,
  icon: Icon,
  iconBg = 'bg-accent/15',
  iconColor = 'text-accent',
  loading = false,
}: StatCardProps) {
  const trendColor =
    trend === 'flat'
      ? 'text-muted'
      : upIsGood
        ? trend === 'up'
          ? 'text-success'
          : 'text-danger'
        : trend === 'up'
          ? 'text-danger'
          : 'text-success';

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-surface p-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
      </div>

      {/* Value */}
      {loading ? (
        <div className="h-8 w-24 animate-pulse rounded-md bg-white/10" />
      ) : (
        <span className="font-outfit text-3xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      )}

      {/* Delta */}
      {delta && !loading && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{delta} vs last 30 days</span>
        </div>
      )}
    </div>
  );
}

/** Skeleton version used while data is loading */
export function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-surface p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-white/10" />
        <div className="h-8 w-8 rounded-lg bg-white/10" />
      </div>
      <div className="h-8 w-28 rounded-md bg-white/10" />
      <div className="h-3 w-32 rounded bg-white/10" />
    </div>
  );
}
