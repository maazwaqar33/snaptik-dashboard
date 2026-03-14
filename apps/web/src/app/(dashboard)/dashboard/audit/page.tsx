'use client';

import { useState, useMemo } from 'react';
import { Download, Search, Shield } from 'lucide-react';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { useAbility } from '@/hooks/use-ability';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/cn';

type AuditAction =
  | 'login' | 'logout'
  | 'ban_user' | 'warn_user' | 'unban_user'
  | 'delete_content' | 'approve_content' | 'flag_content'
  | 'close_report' | 'assign_report'
  | 'reply_ticket' | 'close_ticket'
  | 'invite_admin' | 'deactivate_admin'
  | 'update_settings' | 'export_data';

interface AuditEvent {
  _id: string;
  actor: { _id: string; name: string; role: string };
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  details: string;
  ip: string;
  createdAt: string;
}

const ACTORS = [
  { _id: 'a1', name: 'Alex Chen',    role: 'super_admin' },
  { _id: 'a2', name: 'Sam Rivera',   role: 'moderator'   },
  { _id: 'a3', name: 'Jordan Kim',   role: 'support'     },
  { _id: 'a4', name: 'Taylor Smith', role: 'analyst'     },
];

const EVENT_TEMPLATES: Array<{ action: AuditAction; resourceType: string; details: string }> = [
  { action: 'ban_user',        resourceType: 'user',     details: 'Banned for harassment in comments'          },
  { action: 'delete_content',  resourceType: 'video',    details: 'Removed violating content'                 },
  { action: 'close_report',    resourceType: 'report',   details: 'Resolved — content removed'                },
  { action: 'approve_content', resourceType: 'video',    details: 'Cleared after manual review'               },
  { action: 'warn_user',       resourceType: 'user',     details: 'First warning issued for spam'             },
  { action: 'reply_ticket',    resourceType: 'ticket',   details: 'Replied to user support query'             },
  { action: 'invite_admin',    resourceType: 'admin',    details: 'Invited new support agent'                 },
  { action: 'update_settings', resourceType: 'settings', details: 'Updated AI confidence threshold to 88%'    },
  { action: 'export_data',     resourceType: 'report',   details: 'Exported compliance report (last 90 days)' },
  { action: 'login',           resourceType: 'session',  details: 'Successful login'                          },
];

function seedAudit(n = 80): AuditEvent[] {
  return Array.from({ length: n }, (_, i) => {
    const template = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length]!;
    const actor    = ACTORS[i % ACTORS.length]!;
    return {
      _id:          `evt-${i}`,
      actor,
      action:       template.action,
      resourceType: template.resourceType,
      resourceId:   `${template.resourceType.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(4, '0')}`,
      details:      template.details,
      ip:           `192.168.${Math.floor(i / 20)}.${(i * 7) % 255}`,
      createdAt:    subDays(new Date(), Math.floor(i / 4)).toISOString(),
    };
  });
}

const AUDIT_EVENTS = seedAudit(80);

function actionColor(action: AuditAction): string {
  if (['ban_user', 'delete_content', 'deactivate_admin'].includes(action))
    return 'bg-[#FF3B30]/15 text-[#FF3B30]';
  if (['warn_user', 'flag_content'].includes(action))
    return 'bg-[#FF9500]/15 text-[#FF9500]';
  if (['approve_content', 'unban_user', 'invite_admin'].includes(action))
    return 'bg-[#34C759]/15 text-[#34C759]';
  if (['export_data', 'update_settings'].includes(action))
    return 'bg-[#007AFF]/15 text-[#007AFF]';
  return 'bg-white/8 text-[#AAAAAA]';
}

function actionLabel(action: AuditAction): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function exportAudit(events: AuditEvent[]) {
  try {
    const { data } = await apiClient.get<Blob>('/audit/export', { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const a   = document.createElement('a');
    a.href = url; a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  } catch {
    const rows = events.map((e) =>
      [e.createdAt, e.actor.name, e.actor.role, e.action, e.resourceType, e.resourceId, e.ip, `"${e.details}"`].join(','),
    );
    const csv  = ['timestamp,actor,role,action,resource_type,resource_id,ip,details', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }
}

const PAGE_SIZE = 20;

const ACTION_FILTERS = [
  { label: 'All',      value: 'all'      },
  { label: 'Content',  value: 'content'  },
  { label: 'Users',    value: 'user'     },
  { label: 'Reports',  value: 'report'   },
  { label: 'Settings', value: 'settings' },
  { label: 'Auth',     value: 'login'    },
];

export default function AuditLogPage() {
  const ability   = useAbility();
  const canExport = ability.can('export', 'compliance');
  const [search,       setSearch]       = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page,         setPage]         = useState(0);
  const [exporting,    setExporting]    = useState(false);

  // useMemo must be called before any conditional return (Rules of Hooks)
  const filtered = useMemo(() =>
    AUDIT_EVENTS.filter((e) => {
      if (actionFilter !== 'all' && !e.resourceType.includes(actionFilter) && !e.action.includes(actionFilter))
        return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.actor.name.toLowerCase().includes(q) ||
          e.action.includes(q) ||
          e.resourceId.toLowerCase().includes(q) ||
          e.details.toLowerCase().includes(q) ||
          e.ip.includes(q)
        );
      }
      return true;
    }),
    [search, actionFilter],
  );

  const pageCount  = Math.ceil(filtered.length / PAGE_SIZE);
  const pageEvents = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!ability.can('read', 'auditlog')) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Shield className="h-10 w-10 text-[#AAAAAA]/40" />
        <p className="text-sm text-[#AAAAAA]">You don&apos;t have permission to view the audit log.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">Audit Log</h1>
          <p className="mt-1 text-sm text-[#AAAAAA]">
            Immutable record of all admin actions &mdash; {AUDIT_EVENTS.length} total events
          </p>
        </div>
        {canExport && (
          <button
            onClick={async () => { setExporting(true); await exportAudit(filtered); setExporting(false); }}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs font-semibold text-white transition-colors hover:border-[#007AFF]/40 hover:bg-[#007AFF]/10 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#AAAAAA]" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search actor, action, IP…"
            className="h-9 w-full rounded-lg border border-white/10 bg-black/40 pl-8 pr-3 text-sm text-white placeholder:text-[#AAAAAA] outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-colors"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
          {ACTION_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => { setActionFilter(value); setPage(0); }}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                actionFilter === value ? 'bg-[#007AFF] text-white' : 'text-[#AAAAAA] hover:text-white',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                {['Time', 'Actor', 'Action', 'Resource', 'IP', 'Details'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#AAAAAA]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageEvents.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-sm text-[#AAAAAA]">No events match</td></tr>
              ) : (
                pageEvents.map((e) => (
                  <tr key={e._id} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs text-[#AAAAAA] whitespace-nowrap" title={format(new Date(e.createdAt), 'PPpp')}>
                      {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-white">{e.actor.name}</p>
                      <p className="text-[10px] capitalize text-[#AAAAAA]">{e.actor.role.replace('_', ' ')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-lg px-2 py-0.5 text-[11px] font-semibold', actionColor(e.action))}>
                        {actionLabel(e.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-white/70">{e.resourceType}</p>
                      <p className="font-mono text-[10px] text-[#AAAAAA]">{e.resourceId}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#AAAAAA]">{e.ip}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="line-clamp-1 text-xs text-white/60" title={e.details}>{e.details}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-3">
          <span className="text-xs text-[#AAAAAA]">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#AAAAAA]">Page {page + 1} of {pageCount || 1}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                className="rounded-md px-2 py-1 text-xs text-[#AAAAAA] hover:bg-white/5 hover:text-white disabled:opacity-30 transition-colors">←</button>
              <button onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1}
                className="rounded-md px-2 py-1 text-xs text-[#AAAAAA] hover:bg-white/5 hover:text-white disabled:opacity-30 transition-colors">→</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
