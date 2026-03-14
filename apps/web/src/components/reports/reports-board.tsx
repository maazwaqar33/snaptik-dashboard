'use client';

import { useState, useCallback, useMemo } from 'react';
import { Flag, Loader, CheckCircle2, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { apiClient } from '@/lib/api';
import { ReportCard } from './report-card';
import {
  REPORT_TYPE_LABELS,
  PRIORITY_CONFIG,
  type Report,
  type ReportStatus,
  type ReportPriority,
  type KanbanColumns,
} from '@/types/reports';

// ─── Seed data ─────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  'spam', 'harassment', 'impersonation', 'hate_speech', 'violence', 'misinformation', 'other',
] as const;
const PRIORITIES: ReportPriority[] = ['high', 'medium', 'medium', 'low', 'low'];
const SUBJECTS = [
  { type: 'user' as const,    id: 'usr-001', display: '@user_handle' },
  { type: 'video' as const,   id: 'vid-001', display: 'Video #a1b2c3' },
  { type: 'comment' as const, id: 'cmt-001', display: 'Comment on viral post' },
];

function seedReports(n: number, status: ReportStatus, offset = 0): Report[] {
  return Array.from({ length: n }, (_, i) => {
    const idx = offset + i;
    return {
      _id: `rep-${status}-${idx}`,
      reportId: `RPT-${String(idx + 1).padStart(4, '0')}`,
      type: REPORT_TYPES[idx % REPORT_TYPES.length]!,
      status,
      priority: PRIORITIES[idx % PRIORITIES.length]!,
      subject: SUBJECTS[idx % SUBJECTS.length]!,
      reporter: { _id: `ru-${idx}`, username: `reporter_${idx + 1}` },
      assignedTo: status === 'in_review' && idx % 3 !== 0
        ? { _id: 'mod-1', name: 'Alex Chen' }
        : undefined,
      description: 'User submitted this content for review due to policy concerns.',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
      resolvedAt: status === 'resolved'
        ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    };
  });
}

function makeInitialColumns(): KanbanColumns {
  return {
    pending:   seedReports(12, 'pending',   0),
    in_review: seedReports(7,  'in_review', 12),
    resolved:  seedReports(18, 'resolved',  19),
  };
}

// ─── Column config ──────────────────────────────────────────────────────────

interface ColConfig {
  key: keyof KanbanColumns;
  label: string;
  icon: React.ElementType;
  headerColor: string;
  dropHighlight: string;
}

const COLUMNS: ColConfig[] = [
  {
    key: 'pending',
    label: 'Pending',
    icon: Flag,
    headerColor: 'text-warning',
    dropHighlight: 'bg-warning/5 border-warning/30',
  },
  {
    key: 'in_review',
    label: 'In Review',
    icon: Loader,
    headerColor: 'text-accent',
    dropHighlight: 'bg-accent/5 border-accent/30',
  },
  {
    key: 'resolved',
    label: 'Resolved',
    icon: CheckCircle2,
    headerColor: 'text-success',
    dropHighlight: 'bg-success/5 border-success/30',
  },
];

// ─── Priority filter pill ────────────────────────────────────────────────────

type FilterPriority = ReportPriority | 'all';

// ─── Board ───────────────────────────────────────────────────────────────────

interface ReportsBoardProps {
  initialColumns?: KanbanColumns;
}

export function ReportsBoard({ initialColumns }: ReportsBoardProps) {
  const [columns, setColumns] = useState<KanbanColumns>(
    initialColumns ?? makeInitialColumns(),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<keyof KanbanColumns | null>(null);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');

  // Find which column a report is in
  const findColumn = useCallback(
    (id: string): keyof KanbanColumns | null => {
      for (const col of Object.keys(columns) as Array<keyof KanbanColumns>) {
        if (columns[col].some((r) => r._id === id)) return col;
      }
      return null;
    },
    [columns],
  );

  // ── DnD handlers ──────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, reportId: string) => {
    setDraggingId(reportId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', reportId);
  };

  const handleDragOver = (e: React.DragEvent, col: keyof KanbanColumns) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverColumn(col);
  };

  const handleDragLeave = () => setOverColumn(null);

  const handleDrop = async (e: React.DragEvent, targetCol: keyof KanbanColumns) => {
    e.preventDefault();
    setOverColumn(null);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const sourceCol = findColumn(id);
    if (!sourceCol || sourceCol === targetCol) { setDraggingId(null); return; }

    const report = columns[sourceCol].find((r) => r._id === id);
    if (!report) return;

    const statusMap: Record<keyof KanbanColumns, ReportStatus> = {
      pending: 'pending', in_review: 'in_review', resolved: 'resolved',
    };
    const newStatus = statusMap[targetCol];

    // Optimistic update
    setColumns((prev) => ({
      ...prev,
      [sourceCol]: prev[sourceCol].filter((r) => r._id !== id),
      [targetCol]: [{ ...report, status: newStatus }, ...prev[targetCol]],
    }));
    setDraggingId(null);

    // Fire and forget
    apiClient.patch(`/reports/${id}/status`, { status: newStatus }).catch(() => null);
  };

  const handleDragEnd = () => { setDraggingId(null); setOverColumn(null); };

  // ── Assignment handler ────────────────────────────────────────────────────
  const handleAssign = useCallback(
    (reportId: string, mod: { _id: string; name: string } | null) => {
      const col = findColumn(reportId);
      if (!col) return;
      setColumns((prev) => ({
        ...prev,
        [col]: prev[col].map((r) =>
          r._id === reportId ? { ...r, assignedTo: mod ?? undefined } : r,
        ),
      }));
    },
    [findColumn],
  );

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filterReports = useCallback(
    (reports: Report[]) =>
      reports.filter((r) => {
        if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            r.reportId.toLowerCase().includes(q) ||
            r.subject.display.toLowerCase().includes(q) ||
            r.reporter.username.toLowerCase().includes(q) ||
            REPORT_TYPE_LABELS[r.type].toLowerCase().includes(q)
          );
        }
        return true;
      }),
    [priorityFilter, search],
  );

  const filteredColumns = useMemo(
    () => ({
      pending:   filterReports(columns.pending),
      in_review: filterReports(columns.in_review),
      resolved:  filterReports(columns.resolved),
    }),
    [columns, filterReports],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports, users…"
            className="h-9 w-full rounded-lg border border-white/10 bg-black/40 pl-8 pr-3 text-sm text-white placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
          />
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                priorityFilter === p ? 'bg-accent text-white' : 'text-muted hover:text-white',
              )}
            >
              {p !== 'all' && (
                <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_CONFIG[p].dot)} />
              )}
              {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const ColIcon = col.icon;
          const colReports = filteredColumns[col.key];
          const isOver = overColumn === col.key;

          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.key)}
              className={cn(
                'flex min-h-[400px] flex-col rounded-xl border transition-colors',
                isOver ? col.dropHighlight : 'border-white/10 bg-black/20',
              )}
            >
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <ColIcon className={cn('h-4 w-4', col.headerColor)} />
                  <span className="text-sm font-semibold text-white">{col.label}</span>
                </div>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-bold',
                  col.key === 'pending'   ? 'bg-warning/20 text-warning' :
                  col.key === 'in_review' ? 'bg-accent/20  text-accent'  :
                  'bg-success/20 text-success',
                )}>
                  {colReports.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
                {colReports.length === 0 ? (
                  <div className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center',
                    isOver ? 'border-current opacity-60' : 'border-white/10',
                  )}>
                    <p className="text-xs text-muted">
                      {isOver ? 'Drop here' : 'No reports'}
                    </p>
                  </div>
                ) : (
                  colReports.map((report) => (
                    <div
                      key={report._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, report._id)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <ReportCard
                        report={report}
                        isDragging={draggingId === report._id}
                        onAssign={handleAssign}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
