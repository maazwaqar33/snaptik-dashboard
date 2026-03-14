'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/cn';

// ─── Shared primitives ────────────────────────────────────────────────────────

function Tooltip_({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#121212] px-3 py-2 shadow-xl">
      <p className="mb-1.5 text-xs font-medium text-[#AAAAAA]">{label}</p>
      {payload.map((e) => (
        <div key={e.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
          <span className="text-white/70">{e.name}:</span>
          <span className="font-semibold text-white">{e.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-white/10 bg-[#121212] p-5', className)}>
      <div className="mb-4">
        <h3 className="font-outfit text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-[#AAAAAA]">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

const AXIS = { fontSize: 10, fill: '#AAAAAA' } as const;
const GRID = 'rgba(255,255,255,0.06)';

// ─── 1. User Growth ───────────────────────────────────────────────────────────

export interface GrowthPoint {
  date: string;
  mau: number;
  dau: number;
  newUsers: number;
}

export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  return (
    <ChartCard
      title="User Growth"
      subtitle={`MAU & DAU trend — ${data.length} days`}
      className="col-span-2"
    >
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="ag-mau" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007AFF" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ag-dau" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34C759" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ag-new" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF9500" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#FF9500" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={AXIS} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <Tooltip content={<Tooltip_ />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: '#AAAAAA' }} iconType="circle" iconSize={7} />
          <Area type="monotone" dataKey="mau"      name="MAU"       stroke="#007AFF" strokeWidth={2} fill="url(#ag-mau)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="dau"      name="DAU"       stroke="#34C759" strokeWidth={2} fill="url(#ag-dau)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="newUsers" name="New Users" stroke="#FF9500" strokeWidth={1.5} fill="url(#ag-new)" dot={false} activeDot={{ r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 2. Retention Cohorts ─────────────────────────────────────────────────────

export interface RetentionPoint {
  cohort: string;
  d1: number;
  d7: number;
  d30: number;
}

export function RetentionChart({ data }: { data: RetentionPoint[] }) {
  return (
    <ChartCard
      title="Retention by Cohort"
      subtitle="Day 1 / Day 7 / Day 30 retention %"
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={3} barCategoryGap="30%">
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="cohort" tick={AXIS} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis
            domain={[0, 100]}
            tick={AXIS}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            content={
              <Tooltip_
                payload={undefined}
                label={undefined}
                active={undefined}
              />
            }
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            formatter={(value: number) => [`${value}%`]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12, color: '#AAAAAA' }} iconType="circle" iconSize={7} />
          <Bar dataKey="d1"  name="Day 1"  fill="#007AFF" radius={[3, 3, 0, 0]} maxBarSize={16} />
          <Bar dataKey="d7"  name="Day 7"  fill="#34C759" radius={[3, 3, 0, 0]} maxBarSize={16} />
          <Bar dataKey="d30" name="Day 30" fill="#FF9500" radius={[3, 3, 0, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 3. Content Funnel (CSS bars — cleaner than Recharts funnel) ──────────────

export interface FunnelStage {
  label: string;
  count: number;
  pct: number; // relative to first stage
  color: string;
}

export function ContentFunnelChart({ stages }: { stages: FunnelStage[] }) {
  return (
    <ChartCard title="Content Funnel" subtitle="Upload → process → publish → first view">
      <div className="flex flex-col gap-3 py-1">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-3">
            {/* Label */}
            <span className="w-28 shrink-0 text-right text-xs text-[#AAAAAA]">{stage.label}</span>
            {/* Bar */}
            <div className="flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-5 rounded-full transition-all duration-500"
                style={{ width: `${stage.pct}%`, background: stage.color }}
              />
            </div>
            {/* Stats */}
            <div className="flex w-28 shrink-0 items-center gap-1.5">
              <span className="text-xs font-semibold text-white">
                {stage.count >= 1_000_000
                  ? `${(stage.count / 1_000_000).toFixed(1)}M`
                  : stage.count >= 1000
                  ? `${(stage.count / 1000).toFixed(0)}k`
                  : stage.count.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#AAAAAA]">({stage.pct.toFixed(0)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ─── 4. Platform Split (donut) ─────────────────────────────────────────────────

export interface PlatformSlice {
  name: string;
  value: number;
  color: string;
}

export function PlatformChart({ slices }: { slices: PlatformSlice[] }) {
  const total = slices.reduce((s, p) => s + p.value, 0);

  return (
    <ChartCard title="Platform Split" subtitle="Active users by platform">
      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative h-[160px] w-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {slices.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => [`${((v / total) * 100).toFixed(1)}%`, '']}
                contentStyle={{
                  background: '#121212',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 11,
                }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-[#AAAAAA]">Total</span>
            <span className="font-outfit text-base font-bold text-white">
              {total >= 1_000_000
                ? `${(total / 1_000_000).toFixed(1)}M`
                : `${(total / 1000).toFixed(0)}k`}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {slices.map((s) => (
            <div key={s.name} className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <div>
                <p className="text-xs font-semibold text-white">{s.name}</p>
                <p className="text-[11px] text-[#AAAAAA]">
                  {((s.value / total) * 100).toFixed(1)}% &middot; {(s.value / 1000).toFixed(0)}k users
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
