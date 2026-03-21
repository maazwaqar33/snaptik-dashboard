'use client';

import { useState, useMemo } from 'react';
import { Download, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useAbility } from '@/hooks/use-ability';
import { useApi } from '@/lib/hooks/use-api';
import { apiClient } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBanner } from '@/components/ui/error-banner';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditLogTable, type AuditEvent } from '@/components/audit/audit-log-table';

const PAGE_SIZE = 20;

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

  const { data: auditData, loading, error } = useApi<{ logs: AuditEvent[]; total: number }>('/audit?limit=100');
  const AUDIT_EVENTS = auditData?.logs ?? [];

  if (!ability.can('read', 'auditlog')) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Shield className="h-10 w-10 text-[#AAAAAA]/40" />
        <p className="text-sm text-[#AAAAAA]">You don&apos;t have permission to view the audit log.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner label="Loading audit log…" />;
  if (error)   return <ErrorBanner message={error} />;

  const filtered = AUDIT_EVENTS.filter((e) => {
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
  });

  const pageCount  = Math.ceil(filtered.length / PAGE_SIZE);
  const pageEvents = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
