'use client';

import { Flag, Loader, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ReportCard } from './report-card';
import type { Report, KanbanColumns } from '@/types/reports';

// ─── Column config (shared with reports-board) ───────────────────────────────

export const KANBAN_COLUMNS = [
  { key: 'pending'   as const, label: 'Pending',   icon: Flag,         headerColor: 'text-warning', dropHighlight: 'bg-warning/5 border-warning/30' },
  { key: 'in_review' as const, label: 'In Review', icon: Loader,       headerColor: 'text-accent',  dropHighlight: 'bg-accent/5 border-accent/30'   },
  { key: 'resolved'  as const, label: 'Resolved',  icon: CheckCircle2, headerColor: 'text-success', dropHighlight: 'bg-success/5 border-success/30'  },
];

interface KanbanColumnProps {
  colKey:        keyof KanbanColumns;
  label:         string;
  icon:          React.ElementType;
  headerColor:   string;
  dropHighlight: string;
  reports:       Report[];
  isOver:        boolean;
  draggingId:    string | null;
  onDragStart:   (e: React.DragEvent, id: string) => void;
  onDragOver:    (e: React.DragEvent, col: keyof KanbanColumns) => void;
  onDragLeave:   () => void;
  onDrop:        (e: React.DragEvent, col: keyof KanbanColumns) => void;
  onDragEnd:     () => void;
  onAssign:      (reportId: string, moderator: { _id: string; name: string } | null) => void;
}

export function KanbanColumn({
  colKey, label, icon: Icon, headerColor, dropHighlight, reports, isOver,
  draggingId, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, onAssign,
}: KanbanColumnProps) {
  return (
    <div
      onDragOver={(e) => onDragOver(e, colKey)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, colKey)}
      className={cn(
        'flex min-h-[400px] flex-col rounded-xl border transition-colors',
        isOver ? dropHighlight : 'border-white/10 bg-black/20',
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', headerColor)} />
          <span className="text-sm font-semibold text-white">{label}</span>
        </div>
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs font-bold',
          colKey === 'pending'   ? 'bg-warning/20 text-warning' :
          colKey === 'in_review' ? 'bg-accent/20  text-accent'  :
          'bg-success/20 text-success',
        )}>
          {reports.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {reports.length === 0 ? (
          <div className={cn(
            'flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center',
            isOver ? 'border-current opacity-60' : 'border-white/10',
          )}>
            <p className="text-xs text-muted">
              {isOver ? 'Drop here' : 'No reports'}
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report._id}
              draggable
              onDragStart={(e) => onDragStart(e, report._id)}
              onDragEnd={onDragEnd}
              className="cursor-grab active:cursor-grabbing"
            >
              <ReportCard
                report={report}
                isDragging={draggingId === report._id}
                onAssign={onAssign}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
