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
} from 'recharts';
import { cn } from '@/lib/cn';

// ─── Shared tooltip style ────────────────────────────────────────────────────
function ChartTooltipContent({
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
    <div className="rounded-lg border border-white/10 bg-surface px-3 py-2 shadow-xl">
      <p className="mb-1.5 text-xs font-medium text-muted">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-white/70">{entry.name}:</span>
          <span className="font-semibold text-white">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────
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
    <div className={cn('rounded-xl border border-white/10 bg-surface p-5', className)}>
      <div className="mb-4">
        <h3 className="font-outfit text-sm font-semibold text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── User Growth Chart ────────────────────────────────────────────────────────
export interface UserGrowthPoint {
  date: string;
  mau: number;
  dau: number;
  newUsers: number;
}

export function UserGrowthChart({ data }: { data: UserGrowthPoint[] }) {
  return (
    <ChartCard
      title="User Growth"
      subtitle="Monthly Active Users & Daily Active Users (30 days)"
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="mauGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007AFF" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34C759" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#AAAAAA' }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#AAAAAA' }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <Tooltip content={<ChartTooltipContent />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12, color: '#AAAAAA' }}
            iconType="circle"
            iconSize={7}
          />
          <Area
            type="monotone"
            dataKey="mau"
            name="MAU"
            stroke="#007AFF"
            strokeWidth={2}
            fill="url(#mauGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#007AFF' }}
          />
          <Area
            type="monotone"
            dataKey="dau"
            name="DAU"
            stroke="#34C759"
            strokeWidth={2}
            fill="url(#dauGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#34C759' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Content Moderation Chart ─────────────────────────────────────────────────
export interface ModerationPoint {
  date: string;
  flagged: number;
  removed: number;
  appealed: number;
}

export function ModerationChart({ data }: { data: ModerationPoint[] }) {
  return (
    <ChartCard
      title="Content Moderation"
      subtitle="Flagged, removed & appealed content (7 days)"
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#AAAAAA' }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#AAAAAA' }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12, color: '#AAAAAA' }}
            iconType="circle"
            iconSize={7}
          />
          <Bar dataKey="flagged" name="Flagged" fill="#FF9500" radius={[3, 3, 0, 0]} maxBarSize={20} />
          <Bar dataKey="removed" name="Removed" fill="#FF3B30" radius={[3, 3, 0, 0]} maxBarSize={20} />
          <Bar dataKey="appealed" name="Appealed" fill="#007AFF" radius={[3, 3, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── Engagement Chart ─────────────────────────────────────────────────────────
export interface EngagementPoint {
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

export function EngagementChart({ data }: { data: EngagementPoint[] }) {
  return (
    <ChartCard
      title="Engagement"
      subtitle="Likes, comments & shares (30 days)"
      className="col-span-full"
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#FF3B30" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="commentsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007AFF" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="sharesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34C759" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#34C759" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#AAAAAA' }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#AAAAAA' }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <Tooltip content={<ChartTooltipContent />} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12, color: '#AAAAAA' }}
            iconType="circle"
            iconSize={7}
          />
          <Area type="monotone" dataKey="likes" name="Likes" stroke="#FF3B30" strokeWidth={1.5} fill="url(#likesGrad)" dot={false} activeDot={{ r: 3 }} />
          <Area type="monotone" dataKey="comments" name="Comments" stroke="#007AFF" strokeWidth={1.5} fill="url(#commentsGrad)" dot={false} activeDot={{ r: 3 }} />
          <Area type="monotone" dataKey="shares" name="Shares" stroke="#34C759" strokeWidth={1.5} fill="url(#sharesGrad)" dot={false} activeDot={{ r: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
