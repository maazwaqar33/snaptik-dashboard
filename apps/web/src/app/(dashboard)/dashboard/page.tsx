'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  UserPlus,
  ShieldAlert,
  Flag,
  Ticket,
} from 'lucide-react';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import {
  UserGrowthChart,
  ModerationChart,
  EngagementChart,
} from '@/components/dashboard/charts';
import { AlertsFeed } from '@/components/dashboard/alerts-feed';
import { apiClient } from '@/lib/api';
import { ErrorBanner } from '@/components/ui/error-banner';
import type { DashboardStats } from '@snaptik/types';

// ─── API fetch ─────────────────────────────────────────────────────────────────

async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/analytics/dashboard');
  return data;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30_000, // refresh every 30s
    retry: 2,
  });

  const loading = isLoading;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="font-outfit text-2xl font-bold text-white">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          Platform health at a glance — refreshes every 30 seconds
        </p>
        {isError && (
          <ErrorBanner message="Could not reach API — showing last cached values" />
        )}
      </div>

      {/* KPI stat grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="Monthly Active Users"
              value={stats?.mau ?? 0}
              delta="+8.2%"
              trend="up"
              icon={Users}
              iconBg="bg-accent/15"
              iconColor="text-accent"
            />
            <StatCard
              label="Daily Active Users"
              value={stats?.dau ?? 0}
              delta="+3.1%"
              trend="up"
              icon={UserCheck}
              iconBg="bg-success/15"
              iconColor="text-success"
            />
            <StatCard
              label="Total Users"
              value={stats?.totalUsers ?? 0}
              delta="+12.4%"
              trend="up"
              icon={UserPlus}
              iconBg="bg-accent/10"
              iconColor="text-accent"
            />
            <StatCard
              label="Flagged Content"
              value={stats?.flaggedContent ?? 0}
              delta="+34"
              trend="up"
              upIsGood={false}
              icon={ShieldAlert}
              iconBg="bg-warning/15"
              iconColor="text-warning"
            />
            <StatCard
              label="Open Reports"
              value={stats?.openReports ?? 0}
              delta="-18"
              trend="down"
              upIsGood={false}
              icon={Flag}
              iconBg="bg-danger/15"
              iconColor="text-danger"
            />
            <StatCard
              label="Open Tickets"
              value={stats?.openTickets ?? 0}
              delta="-7"
              trend="down"
              upIsGood={false}
              icon={Ticket}
              iconBg="bg-accent/10"
              iconColor="text-accent"
            />
          </>
        )}
      </div>

      {/* Charts + Alerts two-column layout */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        {/* Charts column */}
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted">Chart history — available once analytics pipeline is connected</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UserGrowthChart data={[]} />
            <ModerationChart data={[]} />
          </div>
          <EngagementChart data={[]} />
        </div>

        {/* Live alerts column — sticky height matches chart area */}
        <div className="min-h-[480px] xl:sticky xl:top-0 xl:max-h-[calc(100vh-7rem)]">
          <AlertsFeed />
        </div>
      </div>
    </div>
  );
}
