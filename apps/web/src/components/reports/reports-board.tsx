'use client';

import { useState, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { apiClient } from '@/lib/api';
import { KanbanColumn, KANBAN_COLUMNS } from './kanban-column';
import {
  REPORT_TYPE_LABELS,
  PRIORITY_CONFIG,
  type Report,
  type ReportStatus,
  type ReportPriority,
  type KanbanColumns,
} from '@/types/reports';

type FilterPriority = ReportPriority | 'all';

interface ReportsBoardProps { initialColumns: KanbanColumns }

export function ReportsBoard({ initialColumns }: ReportsBoardProps) {
  const [columns, setColumns]               = useState<KanbanColumns>(initialColumns);
  const [draggingId, setDraggingId]         = useState<string | null>(null);
  const [overColumn, setOverColumn]         = useState<keyof KanbanColumns | null>(null);
  const [search, setSearch]                 = useState('');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');

  const findColumn = useCallback((id: string): keyof KanbanColumns | null => {
    for (const col of Object.keys(columns) as Array<keyof KanbanColumns>) {
      if (columns[col].some((r) => r._id === id)) return col;
    }
    return null;
  }, [columns]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id);
  };
  const handleDragOver  = (e: React.DragEvent, col: keyof KanbanColumns) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverColumn(col);
  };
  const handleDragLeave = () => setOverColumn(null);
  const handleDragEnd   = () => { setDraggingId(null); setOverColumn(null); };

  const handleDrop = async (e: React.DragEvent, targetCol: keyof KanbanColumns) => {
    e.preventDefault(); setOverColumn(null);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const sourceCol = findColumn(id);
    if (!sourceCol || sourceCol === targetCol) { setDraggingId(null); return; }
    const report = columns[sourceCol].find((r) => r._id === id);
    if (!report) return;
    const statusMap: Record<keyof KanbanColumns, ReportStatus> = {
      pending: 'pending', in_review: 'in_review', resolved: 'resolved',
    };
    setColumns((prev) => ({
      ...prev,
      [sourceCol]: prev[sourceCol].filter((r) => r._id !== id),
      [targetCol]: [{ ...report, status: statusMap[targetCol] }, ...prev[targetCol]],
    }));
    setDraggingId(null);
    apiClient.patch(`/reports/${id}/status`, { status: statusMap[targetCol] }).catch(() => null);
  };

  const handleAssign = useCallback((reportId: string, mod: { _id: string; name: string } | null) => {
    const col = findColumn(reportId);
    if (!col) return;
    setColumns((prev) => ({
      ...prev,
      [col]: prev[col].map((r) => r._id === reportId ? { ...r, assignedTo: mod ?? undefined } : r),
    }));
  }, [findColumn]);

  const filterReports = useCallback((reports: Report[]) =>
    reports.filter((r) => {
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.reportId.toLowerCase().includes(q) ||
        r.subject.display.toLowerCase().includes(q) ||
        r.reporter.username.toLowerCase().includes(q) ||
        REPORT_TYPE_LABELS[r.type].toLowerCase().includes(q)
      );
    }), [priorityFilter, search]);

  const filteredColumns = useMemo(() => ({
    pending:   filterReports(columns.pending),
    in_review: filterReports(columns.in_review),
    resolved:  filterReports(columns.resolved),
  }), [columns, filterReports]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports, users…"
            className="h-9 w-full rounded-lg border border-white/10 bg-black/40 pl-8 pr-3 text-sm text-white placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className={cn('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                priorityFilter === p ? 'bg-accent text-white' : 'text-muted hover:text-white')}
            >
              {p !== 'all' && <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_CONFIG[p].dot)} />}
              {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {KANBAN_COLUMNS.map((col) => (
          <KanbanColumn key={col.key} colKey={col.key} label={col.label} icon={col.icon}
            headerColor={col.headerColor} dropHighlight={col.dropHighlight}
            reports={filteredColumns[col.key]} isOver={overColumn === col.key}
            draggingId={draggingId} onDragStart={handleDragStart} onDragOver={handleDragOver}
            onDragLeave={handleDragLeave} onDrop={handleDrop} onDragEnd={handleDragEnd}
            onAssign={handleAssign}
          />
        ))}
      </div>
    </div>
  );
}
