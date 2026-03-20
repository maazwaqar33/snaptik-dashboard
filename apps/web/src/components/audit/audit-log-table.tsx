'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';

type AuditAction =
  | 'login' | 'logout'
  | 'ban_user' | 'warn_user' | 'unban_user'
  | 'delete_content' | 'approve_content' | 'flag_content'
  | 'close_report' | 'assign_report'
  | 'reply_ticket' | 'close_ticket'
  | 'invite_admin' | 'deactivate_admin'
  | 'update_settings' | 'export_data';

export interface AuditEvent {
  _id: string;
  actor: { _id: string; name: string; role: string };
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  details: string;
  ip: string;
  createdAt: string;
}

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

interface AuditLogTableProps {
  events:      AuditEvent[];
  totalCount:  number;
  page:        number;
  pageCount:   number;
  onPageChange: (page: number) => void;
}

export function AuditLogTable({ events, totalCount, page, pageCount, onPageChange }: AuditLogTableProps) {
  return (
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
            {events.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-sm text-[#AAAAAA]">No events match</td></tr>
            ) : (
              events.map((e) => (
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
        <span className="text-xs text-[#AAAAAA]">{totalCount} event{totalCount !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#AAAAAA]">Page {page + 1} of {pageCount || 1}</span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-md px-2 py-1 text-xs text-[#AAAAAA] hover:bg-white/5 hover:text-white disabled:opacity-30 transition-colors"
            >←</button>
            <button
              onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}
              disabled={page >= pageCount - 1}
              className="rounded-md px-2 py-1 text-xs text-[#AAAAAA] hover:bg-white/5 hover:text-white disabled:opacity-30 transition-colors"
            >→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
