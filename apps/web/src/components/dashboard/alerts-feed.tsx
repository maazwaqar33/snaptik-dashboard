'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { Flag, UserX, Ticket, Video, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Cookies from 'js-cookie';
import { cn } from '@/lib/cn';
import type { Alert } from '@snaptik/types';

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_SOCKET_URL as string | undefined) ??
  'http://localhost:5001';

const MAX_ALERTS = 50;

const ALERT_CONFIG: Record<
  Alert['type'],
  { icon: React.ElementType; color: string; label: string }
> = {
  new_report: { icon: Flag, color: 'text-warning', label: 'New report' },
  video_flagged: { icon: Video, color: 'text-danger', label: 'Video flagged' },
  ticket_created: { icon: Ticket, color: 'text-accent', label: 'New ticket' },
  user_banned: { icon: UserX, color: 'text-danger', label: 'User banned' },
};

// Seed with some demo alerts so the panel isn't blank on first load
function makeDemoAlerts(): Alert[] {
  const now = new Date();
  return [
    {
      id: 'demo-1',
      type: 'video_flagged',
      message: 'Video #7f2e flagged for hate speech (AI confidence 94%)',
      createdAt: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-2',
      type: 'new_report',
      message: 'User @handle reported for impersonation',
      createdAt: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-3',
      type: 'ticket_created',
      message: 'Support ticket: "Account locked after update"',
      createdAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-4',
      type: 'user_banned',
      message: 'User @spammer123 banned by moderator Alex',
      createdAt: new Date(now.getTime() - 32 * 60 * 1000).toISOString(),
    },
  ];
}

export function AlertsFeed() {
  const [alerts, setAlerts] = useState<Alert[]>(makeDemoAlerts);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = Cookies.get('admin_access_token');
    if (!token) return;

    const socket = io(`${SOCKET_URL}/admin`, {
      auth: { token },
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    // Real-time alert events from the admin namespace
    socket.on('alert', (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));
      // Auto-scroll to top
      if (listRef.current) listRef.current.scrollTop = 0;
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="font-outfit text-sm font-semibold text-white">Live Alerts</h3>
        <div className="flex items-center gap-1.5 text-xs">
          {connected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-success" />
              <span className="text-success">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-muted" />
              <span className="text-muted">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Alert list */}
      <div ref={listRef} className="flex flex-1 flex-col overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-muted/40" />
            <p className="text-xs text-muted">No recent alerts</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = ALERT_CONFIG[alert.type];
            const Icon = config?.icon ?? AlertTriangle;
            return (
              <div
                key={alert.id}
                className="flex gap-3 border-b border-white/5 px-4 py-3 transition-colors hover:bg-white/3"
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/40',
                    config?.color ?? 'text-muted',
                  )}
                >
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
          })
        )}
      </div>
    </div>
  );
}
