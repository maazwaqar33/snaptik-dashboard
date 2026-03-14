'use client';

import { useState, useRef } from 'react';
import { GripVertical, User, Video, MessageSquare, ChevronDown, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';
import { apiClient } from '@/lib/api';
import {
  REPORT_TYPE_LABELS,
  REPORT_TYPE_COLORS,
  PRIORITY_CONFIG,
  MOCK_MODERATORS,
  type Report,
} from '@/types/reports';

const SUBJECT_ICONS = {
  user:    User,
  video:   Video,
  comment: MessageSquare,
} as const;

interface ReportCardProps {
  report: Report;
  isDragging?: boolean;
  onAssign: (reportId: string, moderator: { _id: string; name: string } | null) => void;
}

export function ReportCard({ report, isDragging, onAssign }: ReportCardProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const SubjectIcon = SUBJECT_ICONS[report.subject.type];
  const priority = PRIORITY_CONFIG[report.priority];

  const handleAssign = async (mod: { _id: string; name: string } | null) => {
    setAssigning(true);
    setAssignOpen(false);
    try {
      await apiClient
        .post(`/reports/${report._id}/assign`, { adminId: mod?._id ?? null })
        .catch(() => null); // optimistic
      onAssign(report._id, mod);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div
      className={cn(
        'group rounded-xl border border-white/10 bg-surface p-3',
        'transition-shadow hover:border-white/20 hover:shadow-lg hover:shadow-black/40',
        isDragging && 'opacity-50 ring-2 ring-accent',
      )}
    >
      {/* Top row: priority dot + report ID + drag handle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', priority.dot)} title={priority.label} />
          <span className="font-mono text-[11px] font-semibold text-muted">{report.reportId}</span>
        </div>
        <GripVertical className="h-3.5 w-3.5 cursor-grab text-muted/30 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing" />
      </div>

      {/* Type badge */}
      <div className="mt-2">
        <span className={cn('inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-semibold', REPORT_TYPE_COLORS[report.type])}>
          {REPORT_TYPE_LABELS[report.type]}
        </span>
      </div>

      {/* Subject */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-white/80">
        <SubjectIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
        <span className="truncate">{report.subject.display}</span>
      </div>

      {/* Reporter */}
      <p className="mt-1 text-[11px] text-muted">
        Reported by <span className="text-white/60">@{report.reporter.username}</span>
      </p>

      {/* Divider */}
      <div className="my-2.5 border-t border-white/8" />

      {/* Assign dropdown + timestamp */}
      <div className="flex items-center justify-between gap-2">
        {/* Assignee */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setAssignOpen((v) => !v); }}
            disabled={assigning}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-colors',
              report.assignedTo
                ? 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20'
                : 'border-white/10 bg-white/5 text-muted hover:border-white/20 hover:text-white',
              'disabled:opacity-50',
            )}
          >
            {report.assignedTo ? (
              <>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
                  {report.assignedTo.name.charAt(0)}
                </span>
                <span className="max-w-[80px] truncate">{report.assignedTo.name.split(' ')[0]}</span>
              </>
            ) : (
              <span>Assign</span>
            )}
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>

          {assignOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setAssignOpen(false)} />
              <div className="absolute left-0 z-30 mt-1 w-44 rounded-xl border border-white/10 bg-surface py-1 shadow-2xl">
                {/* Unassign option */}
                {report.assignedTo && (
                  <button
                    onClick={() => handleAssign(null)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-white/5 transition-colors"
                  >
                    Unassign
                  </button>
                )}
                {MOCK_MODERATORS.map((mod) => (
                  <button
                    key={mod._id}
                    onClick={() => handleAssign(mod)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs text-white/80 hover:bg-white/5 transition-colors"
                  >
                    <span>{mod.name}</span>
                    {report.assignedTo?._id === mod._id && (
                      <Check className="h-3 w-3 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Timestamp */}
        <span className="shrink-0 text-[10px] text-muted">
          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
