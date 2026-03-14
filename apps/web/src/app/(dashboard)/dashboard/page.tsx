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
import { format, subDays } from 'date-fns';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import {
  UserGrowthChart,
  ModerationChart,
  EngagementChart,
  type UserGrowthPoint,
  type ModerationPoint,
  type EngagementPoint,
} from '@/components/dashboard/charts';
import { AlertsFeed } from '@/components/dashboard/alerts-feed';
import { apiClient } from '@/lib/api';
import type { DashboardStats } from '@snaptik/types';

// ─── Mock chart data (replaced with real API in backend integration phase) ────

function makeDays(n: number) {
  return Array.from({ length: n }, (_, i) =>
    format(subDays(new Date(), n - 1 - i), 'MMM d'),
  );
}

function seedUserGrowth(): UserGrowthPoint[] {
  const days = makeDays(30);
  let mau = 850_000;
  let dau = 120_000;
  return days.map((date) => {
    mau += Math.floor((Math.random() - 0.3) * 8000);
    dau += Math.floor((Math.random() - 0.35) * 3000);
    return { date, mau: Math.max(mau, 0), dau: Math.max(dau, 0), newUsers: Math.floor(Math.random() * 4000 + 500) };
  });
}

function seedModeration(): ModerationPoint[] {
  const days = makeDays(7);
  return days.map((date) => ({
    date,
    flagged: Math.floor(Math.random() * 300 + 80),
    removed: Math.floor(Math.random() * 120 + 30),
    appealed: Math.floor(Math.random() * 40 + 5),
  }));
}

function seedEngagement(): EngagementPoint[] {
  const days = makeDays(30);
  return days.map((date) => ({
    date,
    likes: Math.floor(Math.random() * 200_000 + 100_000),
    comments: Math.floor(Math.random() * 40_000 + 20_000),
    shares: Math.floor(Math.random() * 25_000 + 8_000),
  }));
}

// Stable seeds (re-created once per mount, not per render)
const USER_GROWTH_DATA = seedUserGrowth();
const MODERATION_DATA = seedModeration();
const ENGAGEMENT_DATA = seedEngagement();

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
          <p className="mt-2 text-xs text-warning">
            Could not reach API — showing last cached values or placeholders
          </p>
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
              value={stats?.mau ?? USER_GROWTH_DATA[USER_GROWTH_DATA.length - 1]!.mau}
              delta="+8.2%"
              trend="up"
              icon={Users}
              iconBg="bg-accent/15"
              iconColor="text-accent"
            />
            <StatCard
              label="Daily Active Users"
              value={stats?.dau ?? USER_GROWTH_DATA[USER_GROWTH_DATA.length - 1]!.dau}
              delta="+3.1%"
              trend="up"
              icon={UserCheck}
              iconBg="bg-success/15"
              iconColor="text-success"
            />
            <StatCard
              label="Total Users"
              value={stats?.totalUsers ?? 1_240_885}
              delta="+12.4%"
              trend="up"
              icon={UserPlus}
              iconBg="bg-accent/10"
              iconColor="text-accent"
            />
            <StatCard
              label="Flagged Content"
              value={stats?.flaggedContent ?? 482}
              delta="+34"
              trend="up"
              upIsGood={false}
              icon={ShieldAlert}
              iconBg="bg-warning/15"
              iconColor="text-warning"
            />
            <StatCard
              label="Open Reports"
              value={stats?.openReports ?? 127}
              delta="-18"
              trend="down"
              upIsGood={false}
              icon={Flag}
              iconBg="bg-danger/15"
              iconColor="text-danger"
            />
            <StatCard
              label="Open Tickets"
              value={stats?.openTickets ?? 43}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <UserGrowthChart data={USER_GROWTH_DATA} />
            <ModerationChart data={MODERATION_DATA} />
          </div>
          <EngagementChart data={ENGAGEMENT_DATA} />
        </div>

        {/* Live alerts column — sticky height matches chart area */}
        <div className="min-h-[480px] xl:sticky xl:top-0 xl:max-h-[calc(100vh-7rem)]">
          <AlertsFeed />
        </div>
      </div>
    </div>
  );
}
