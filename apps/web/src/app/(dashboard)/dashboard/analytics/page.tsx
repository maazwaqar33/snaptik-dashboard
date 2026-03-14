'use client';

import { useState, useMemo, useCallback } from 'react';
import { Download, TrendingUp, Clock, Users, BarChart3 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAbility } from '@/hooks/use-ability';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/cn';
import {
  GrowthChart,
  RetentionChart,
  ContentFunnelChart,
  PlatformChart,
  type GrowthPoint,
  type RetentionPoint,
  type FunnelStage,
  type PlatformSlice,
} from '@/components/analytics/analytics-charts';

// ─── Date range options ────────────────────────────────────────────────────────

const RANGES = [
  { label: '7d',  days: 7  },
  { label: '14d', days: 14 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const;

type RangeDays = (typeof RANGES)[number]['days'];

// ─── Seed generators (replaced by API in production) ─────────────────────────

function makeDayLabels(n: number): string[] {
  return Array.from({ length: n }, (_, i) =>
    format(subDays(new Date(), n - 1 - i), n > 30 ? 'MMM d' : 'MMM d'),
  );
}

function seedGrowth(days: RangeDays): GrowthPoint[] {
  const labels = makeDayLabels(days);
  let mau = 1_050_000;
  let dau = 140_000;
  return labels.map((date) => {
    mau = Math.max(0, mau + Math.floor((Math.random() - 0.28) * 9_000));
    dau = Math.max(0, dau + Math.floor((Math.random() - 0.32) * 3_500));
    return { date, mau, dau, newUsers: Math.floor(Math.random() * 5_000 + 600) };
  });
}

function seedRetention(days: RangeDays): RetentionPoint[] {
  // weekly cohorts clipped to the selected range
  const weeks = Math.max(2, Math.ceil(days / 7));
  return Array.from({ length: weeks }, (_, i) => ({
    cohort: `Wk ${i + 1}`,
    d1:  Math.floor(Math.random() * 20 + 60),
    d7:  Math.floor(Math.random() * 20 + 35),
    d30: Math.floor(Math.random() * 20 + 15),
  }));
}

const FUNNEL_STAGES: FunnelStage[] = [
  { label: 'Uploaded',     count: 2_840_000, pct: 100, color: '#007AFF' },
  { label: 'Processed',    count: 2_665_600, pct: 93.8, color: '#34C759' },
  { label: 'Published',    count: 2_411_840, pct: 84.9, color: '#FF9500' },
  { label: 'First view',   count: 1_954_440, pct: 68.8, color: '#FF3B30' },
];

const PLATFORM_SLICES: PlatformSlice[] = [
  { name: 'iOS',     value: 621_000, color: '#007AFF' },
  { name: 'Android', value: 467_000, color: '#34C759' },
  { name: 'Web',     value: 107_000, color: '#FF9500' },
];

// ─── KPI stat card ─────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  delta,
  up,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  delta: string;
  up: boolean;
}) {
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

// ─── Export helper ─────────────────────────────────────────────────────────────

async function triggerExport(days: RangeDays) {
  const to   = format(new Date(), 'yyyy-MM-dd');
  const from = format(subDays(new Date(), days), 'yyyy-MM-dd');
  try {
    const { data } = await apiClient.get<Blob>('/analytics/export', {
      params: { from, to },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(data);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `snaptik-analytics-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    // Fallback: generate a minimal CSV from seed
    const csv = `from,to,exported_at\n${from},${to},${new Date().toISOString()}\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href      = url;
    a.download  = `snaptik-analytics-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const ability = useAbility();

  if (!ability.can('read', 'analytics')) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <BarChart3 className="h-10 w-10 text-[#AAAAAA]/40" />
        <p className="text-sm text-[#AAAAAA]">You don&apos;t have permission to view analytics.</p>
      </div>
    );
  }

  return <AnalyticsContent canExport={ability.can('export', 'analytics')} />;
}

function AnalyticsContent({ canExport }: { canExport: boolean }) {
  const [range, setRange]     = useState<RangeDays>(30);
  const [exporting, setExport] = useState(false);

  const growthData    = useMemo(() => seedGrowth(range), [range]);
  const retentionData = useMemo(() => seedRetention(range), [range]);

  const handleExport = useCallback(async () => {
    setExport(true);
    await triggerExport(range);
    setExport(false);
  }, [range]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-[#AAAAAA]">
            Platform performance &mdash; last {range} days
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Range pills */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
            {RANGES.map(({ label, days }) => (
              <button
                key={days}
                onClick={() => setRange(days)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  range === days ? 'bg-[#007AFF] text-white' : 'text-[#AAAAAA] hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Export button — RBAC gated */}
          {canExport && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-white transition-colors hover:border-[#007AFF]/40 hover:bg-[#007AFF]/10 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          iconBg="bg-[#007AFF]/15"
          iconColor="text-[#007AFF]"
          label="Monthly Active Users"
          value={`${(growthData[growthData.length - 1]!.mau / 1_000_000).toFixed(2)}M`}
          delta="+8.2%"
          up={true}
        />
        <KpiCard
          icon={TrendingUp}
          iconBg="bg-[#34C759]/15"
          iconColor="text-[#34C759]"
          label="New Users (period)"
          value={growthData
            .reduce((s, p) => s + p.newUsers, 0)
            .toLocaleString()}
          delta="+12.4%"
          up={true}
        />
        <KpiCard
          icon={Clock}
          iconBg="bg-[#FF9500]/15"
          iconColor="text-[#FF9500]"
          label="Avg Session (min)"
          value="18.4"
          delta="+1.2"
          up={true}
        />
        <KpiCard
          icon={BarChart3}
          iconBg="bg-[#FF3B30]/15"
          iconColor="text-[#FF3B30]"
          label="D30 Retention"
          value="24.6%"
          delta="-0.8%"
          up={false}
        />
      </div>

      {/* Chart grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Growth spans 2 cols */}
        <GrowthChart data={growthData} />

        {/* Retention — 1 col */}
        <RetentionChart data={retentionData} />

        {/* Funnel — 1 col */}
        <ContentFunnelChart stages={FUNNEL_STAGES} />

        {/* Platform — 1 col */}
        <PlatformChart slices={PLATFORM_SLICES} />
      </div>
    </div>
  );
}
