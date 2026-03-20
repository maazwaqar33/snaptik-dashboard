'use client';

import { CheckCircle2, Trash2, Clock, ChevronRight, BadgeCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';
import { ConfidenceBadge } from './confidence-badge';
import { FLAG_REASON_LABELS, FLAG_REASON_COLORS, type FlaggedVideo } from '@/types/moderation';

interface ModerationItemProps {
  item: FlaggedVideo;
  isActive: boolean;
  onClick: () => void;
}

export function ModerationItem({ item, isActive, onClick }: ModerationItemProps) {
  const statusIcon =
    item.status === 'approved' ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> :
    item.status === 'removed'  ? <Trash2 className="h-3.5 w-3.5 text-danger" /> :
    item.status === 'deferred' ? <Clock className="h-3.5 w-3.5 text-muted" /> :
    null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-white/5 p-3 text-left transition-colors',
        'hover:bg-white/5',
        isActive && 'bg-accent/10 border-l-2 border-l-accent',
        item.status !== 'pending' && 'opacity-50',
      )}
    >
      {/* Thumbnail placeholder */}
      <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs text-muted">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <span className="text-[10px]">{Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}</span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-xs font-medium text-white">
            @{item.uploader.username}
            {item.uploader.isVerified && <BadgeCheck className="ml-1 inline h-3 w-3 text-accent" />}
          </span>
          {statusIcon ?? <ConfidenceBadge confidence={item.aiConfidence} size="sm" />}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className={cn('rounded-sm border px-1 py-0.5 text-[10px] font-medium', FLAG_REASON_COLORS[item.flagReason])}>
            {FLAG_REASON_LABELS[item.flagReason]}
          </span>
          <span className="text-[10px] text-muted">{`${item.reportCount} ${item.reportCount === 1 ? 'report' : 'reports'}`}</span>
        </div>
        <p className="mt-0.5 text-[10px] text-muted">
          {formatDistanceToNow(new Date(item.flaggedAt), { addSuffix: true })}
        </p>
      </div>

      <ChevronRight className={cn('mt-1 h-3.5 w-3.5 shrink-0 text-muted/40 transition-colors', isActive && 'text-accent')} />
    </button>
  );
}
