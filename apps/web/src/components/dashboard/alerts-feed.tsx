'use client';

import { useEffect, useRef, useState } from 'react';
import { Flag, UserX, Ticket, Video, AlertTriangle, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';
import type { Alert } from '@snaptik/types';

const MAX_ALERTS = 50;

const ALERT_CONFIG: Record<Alert['type'], { icon: React.ElementType; color: string; label: string }> = {
  new_report:    { icon: Flag,    color: 'text-warning', label: 'New report'    },
  video_flagged: { icon: Video,   color: 'text-danger',  label: 'Video flagged' },
  ticket_created:{ icon: Ticket,  color: 'text-accent',  label: 'New ticket'    },
  user_banned:   { icon: UserX,   color: 'text-danger',  label: 'User banned'   },
};

function makeDemoAlerts(): Alert[] {
  const now = new Date();
  return [
    { id: 'demo-1', type: 'video_flagged',  message: 'Video #7f2e flagged for hate speech (AI confidence 94%)',    createdAt: new Date(now.getTime() - 2  * 60_000).toISOString() },
    { id: 'demo-2', type: 'new_report',     message: 'User @handle reported for impersonation',                   createdAt: new Date(now.getTime() - 8  * 60_000).toISOString() },
    { id: 'demo-3', type: 'ticket_created', message: 'Support ticket: "Account locked after update"',             createdAt: new Date(now.getTime() - 15 * 60_000).toISOString() },
    { id: 'demo-4', type: 'user_banned',    message: 'User @spammer123 banned by moderator Alex',                 createdAt: new Date(now.getTime() - 32 * 60_000).toISOString() },
    { id: 'demo-5', type: 'video_flagged',  message: 'Viral video reported 47 times for misinformation',          createdAt: new Date(now.getTime() - 58 * 60_000).toISOString() },
    { id: 'demo-6', type: 'new_report',     message: '3 reports submitted against @user99 in last hour',          createdAt: new Date(now.getTime() - 71 * 60_000).toISOString() },
  ];
}

export function AlertsFeed() {
  const [alerts, setAlerts] = useState<Alert[]>(makeDemoAlerts);
  const listRef = useRef<HTMLDivElement>(null);

  // In demo mode: simulate occasional new alerts
  useEffect(() => {
    const types: Alert['type'][] = ['new_report', 'video_flagged', 'ticket_created', 'user_banned'];
    const messages = [
      'New community guideline violation reported',
      'Automated content flag: potential spam detected',
      'User submitted appeal for account suspension',
      'Trending video flagged across 3 regions',
    ];
    const interval = setInterval(() => {
      const alert: Alert = {
        id: `live-${Date.now()}`,
        type: types[Math.floor(Math.random() * types.length)]!,
        message: messages[Math.floor(Math.random() * messages.length)]!,
        createdAt: new Date().toISOString(),
      };
      setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
      if (listRef.current) listRef.current.scrollTop = 0;
    }, 18_000); // new alert every 18s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="font-outfit text-sm font-semibold text-white">Live Alerts</h3>
        <div className="flex items-center gap-1.5 text-xs">
          <WifiOff className="h-3.5 w-3.5 text-muted" />
          <span className="text-muted">Demo mode</span>
        </div>
      </div>

      {/* Alert list */}
      <div ref={listRef} className="flex flex-1 flex-col overflow-y-auto">
        {alerts.map((alert) => {
          const config = ALERT_CONFIG[alert.type];
          const Icon = config?.icon ?? AlertTriangle;
          return (
            <div key={alert.id} className="flex gap-3 border-b border-white/5 px-4 py-3 transition-colors hover:bg-white/[0.03]">
              <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/40', config?.color ?? 'text-muted')}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white/80">{config?.label}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">{alert.message}</p>
                <p className="mt-1 text-[10px] text-muted/60">
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
