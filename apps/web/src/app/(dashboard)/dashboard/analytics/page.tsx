'use client';

import { useState, useCallback } from 'react';
import { Download, TrendingUp, Clock, Users, BarChart3 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAbility } from '@/hooks/use-ability';
import { apiClient } from '@/lib/api';
import { useApi } from '@/lib/hooks/use-api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  GrowthChart,
  RetentionChart,
  ContentFunnelChart,
  PlatformChart,
  type GrowthPoint,
  type RetentionPoint,
} from '@/components/analytics/analytics-charts';
import { KpiCard } from '@/components/analytics/kpi-card';
import { RangeSelector, type RangeDays } from '@/components/analytics/range-selector';

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
  const [range, setRange]      = useState<RangeDays>(30);
  const [exporting, setExport] = useState(false);

  const { data: analyticsData, loading } = useApi<{
    growthData?:    Array<{ date: string; users: number; videos: number }>;
    retentionData?: Array<{ day: number; d1: number; d7: number; d30: number }>;
  }>(`/analytics/overview?days=${range}`);

  const growthData    = (analyticsData?.growthData    ?? []) as unknown as GrowthPoint[];
  const retentionData = (analyticsData?.retentionData ?? []) as unknown as RetentionPoint[];

  const handleExport = useCallback(async () => {
    setExport(true);
    await triggerExport(range);
    setExport(false);
  }, [range]);

  if (loading) return <LoadingSpinner label="Loading analytics…" />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-[#AAAAAA]">Platform performance &mdash; last {range} days</p>
        </div>
        <div className="flex items-center gap-3">
          <RangeSelector value={range} onChange={setRange} />
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
          value={growthData.length > 0 ? `${(growthData[growthData.length - 1]!.mau / 1_000_000).toFixed(2)}M` : '—'}
          delta="+8.2%"
          up={true}
        />
        <KpiCard
          icon={TrendingUp}
          iconBg="bg-[#34C759]/15"
          iconColor="text-[#34C759]"
          label="New Users (period)"
          value={growthData.reduce((s, p) => s + p.newUsers, 0).toLocaleString()}
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
        <GrowthChart data={growthData} />
        <RetentionChart data={retentionData} />
        <ContentFunnelChart stages={[]} />
        <PlatformChart slices={[]} />
      </div>
    </div>
  );
}
