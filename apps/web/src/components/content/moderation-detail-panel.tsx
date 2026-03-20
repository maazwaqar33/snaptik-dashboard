'use client';

import { CheckCircle2, Trash2, Clock, SkipForward, BadgeCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';
import { useAbility } from '@/hooks/use-ability';
import { VideoPlayer } from './video-player';
import { ConfidenceBar } from './confidence-badge';
import { FLAG_REASON_LABELS, FLAG_REASON_COLORS, type FlaggedVideo } from '@/types/moderation';

interface ModerationDetailPanelProps {
  item: FlaggedVideo;
  onApprove: () => void;
  onRemove: () => void;
  onDefer: () => void;
  loading: boolean;
}

export function ModerationDetailPanel({
  item, onApprove, onRemove, onDefer, loading,
}: ModerationDetailPanelProps) {
  const ability = useAbility();
  const canModerate = ability.can('moderate', 'content');
  const canDelete   = ability.can('delete', 'content');
  const isPending   = item.status === 'pending';

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Video player */}
      <div className="flex justify-center border-b border-white/10 bg-black/30 p-6">
        <VideoPlayer
          videoUrl={item.videoUrl}
          hlsUrl={item.hlsUrl}
          thumbnailUrl={item.thumbnailUrl}
        />
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-4 p-5">
        {/* Already actioned banner */}
        {!isPending && (
          <div className={cn(
            'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium',
            item.status === 'approved' ? 'border-success/30 bg-success/10 text-success' :
            item.status === 'removed'  ? 'border-danger/30 bg-danger/10 text-danger' :
            'border-white/10 bg-white/5 text-muted',
          )}>
            {item.status === 'approved' && <CheckCircle2 className="h-4 w-4" />}
            {item.status === 'removed'  && <Trash2 className="h-4 w-4" />}
            {item.status === 'deferred' && <Clock className="h-4 w-4" />}
            <span className="capitalize">{item.status}</span>
          </div>
        )}

        {/* Uploader */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">Uploader</p>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
              {item.uploader.displayName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{item.uploader.displayName}</p>
              <p className="text-xs text-muted">@{item.uploader.username}</p>
            </div>
            {item.uploader.isVerified && <BadgeCheck className="h-4 w-4 text-accent" />}
          </div>
        </div>

        {/* Flag reason */}
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">Flag Reason</p>
          <span className={cn('inline-flex rounded-md border px-2 py-1 text-xs font-semibold', FLAG_REASON_COLORS[item.flagReason])}>
            {FLAG_REASON_LABELS[item.flagReason]}
          </span>
        </div>

        {/* AI Analysis */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">AI Analysis</p>
          <ConfidenceBar confidence={item.aiConfidence} />
          <div className="mt-2 flex flex-wrap gap-1">
            {item.aiLabels.map((label) => (
              <span key={label} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-muted">
                {label.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Reports + timestamps */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[10px] text-muted">User Reports</p>
            <p className="mt-0.5 text-lg font-bold text-danger">{item.reportCount}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[10px] text-muted">Video Length</p>
            <p className="mt-0.5 text-lg font-bold text-white">
              {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[10px] text-muted">Flagged</p>
            <p className="mt-0.5 text-xs font-medium text-white">
              {formatDistanceToNow(new Date(item.flaggedAt), { addSuffix: true })}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
            <p className="text-[10px] text-muted">Uploaded</p>
            <p className="mt-0.5 text-xs font-medium text-white">
              {formatDistanceToNow(new Date(item.uploadedAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {isPending && (
          <div className="flex flex-col gap-2 pt-1">
            {canModerate && (
              <button
                onClick={onApprove}
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-success/15 text-sm font-semibold text-success transition-colors hover:bg-success/25 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
                <kbd className="ml-auto rounded border border-success/30 px-1.5 py-0.5 text-[10px] font-mono">A</kbd>
              </button>
            )}
            {canDelete && (
              <button
                onClick={onRemove}
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-danger/15 text-sm font-semibold text-danger transition-colors hover:bg-danger/25 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove Video
                <kbd className="ml-auto rounded border border-danger/30 px-1.5 py-0.5 text-[10px] font-mono">R</kbd>
              </button>
            )}
            <button
              onClick={onDefer}
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 text-sm font-medium text-muted transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              <SkipForward className="h-4 w-4" />
              Defer
              <kbd className="ml-auto rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-mono">D</kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
