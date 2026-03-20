'use client';

import { useState, useMemo } from 'react';
import { Download, Shield } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAbility } from '@/hooks/use-ability';
import { apiClient } from '@/lib/api';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditLogTable, type AuditEvent } from '@/components/audit/audit-log-table';

// ─── Seed data ─────────────────────────────────────────────────────────────────

type AuditAction =
  | 'login' | 'logout'
  | 'ban_user' | 'warn_user' | 'unban_user'
  | 'delete_content' | 'approve_content' | 'flag_content'
  | 'close_report' | 'assign_report'
  | 'reply_ticket' | 'close_ticket'
  | 'invite_admin' | 'deactivate_admin'
  | 'update_settings' | 'export_data';

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
const PAGE_SIZE    = 20;

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const ability   = useAbility();
  const canExport = ability.can('export', 'compliance');

  const [search,       setSearch]       = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page,         setPage]         = useState(0);
  const [exporting,    setExporting]    = useState(false);

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

      <AuditFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(0); }}
        actionFilter={actionFilter}
        onActionChange={(v) => { setActionFilter(v); setPage(0); }}
      />

      <AuditLogTable
        events={pageEvents}
        totalCount={filtered.length}
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
      />
    </div>
  );
}
