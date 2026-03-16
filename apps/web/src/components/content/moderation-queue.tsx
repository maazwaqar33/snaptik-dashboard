'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  Trash2,
  Clock,
  ChevronRight,
  AlertTriangle,
  BadgeCheck,
  Keyboard,
  SkipForward,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';
import { useAbility } from '@/hooks/use-ability';
import { apiClient } from '@/lib/api';
import { VideoPlayer } from './video-player';
import { ConfidenceBadge, ConfidenceBar } from './confidence-badge';
import {
  FLAG_REASON_LABELS,
  FLAG_REASON_COLORS,
  type FlaggedVideo,
  type ModerationStatus,
} from '@/types/moderation';

// ─── Seed data ─────────────────────────────────────────────────────────────────

const FLAG_REASONS = [
  'hate_speech', 'nudity', 'violence', 'spam', 'misinformation', 'harassment', 'other',
] as const;

const AI_LABELS: Record<string, string[]> = {
  hate_speech:    ['hate_speech', 'offensive_language', 'slur'],
  nudity:         ['nudity', 'sexual_content', 'adult'],
  violence:       ['violence', 'graphic_content', 'blood'],
  spam:           ['spam', 'repetitive_content', 'clickbait'],
  misinformation: ['misinformation', 'false_claims', 'health_misinformation'],
  harassment:     ['harassment', 'bullying', 'targeted_attack'],
  other:          ['policy_violation'],
};

function seedQueue(n: number): FlaggedVideo[] {
  return Array.from({ length: n }, (_, i) => {
    const reason = FLAG_REASONS[i % FLAG_REASONS.length]!;
    const confidence = Math.floor(Math.random() * 45 + 55); // 55–100
    const now = Date.now();
    return {
      _id: `flag-${String(i + 1).padStart(3, '0')}`,
      videoId: `vid-${String(i + 1).padStart(5, '0')}`,
      thumbnailUrl: undefined,
      videoUrl: undefined,
      duration: Math.floor(Math.random() * 55 + 5),
      uploadedAt: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      flaggedAt: new Date(now - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
      uploader: {
        _id: `user-${i + 1}`,
        username: `user_${i + 1}`,
        displayName: `User ${i + 1}`,
        isVerified: i % 12 === 0,
      },
      flagReason: reason,
      aiConfidence: confidence,
      aiLabels: AI_LABELS[reason]!,
      reportCount: Math.floor(Math.random() * 50 + 1),
      status: 'pending' as ModerationStatus,
    };
  });
}

const SEED_QUEUE = seedQueue(40);

// ─── Sub-components ────────────────────────────────────────────────────────────

function QueueItem({
  item,
  isActive,
  onClick,
}: {
  item: FlaggedVideo;
  isActive: boolean;
  onClick: () => void;
}) {
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

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  item,
  onApprove,
  onRemove,
  onDefer,
  loading,
}: {
  item: FlaggedVideo;
  onApprove: () => void;
  onRemove: () => void;
  onDefer: () => void;
  loading: boolean;
}) {
  const ability = useAbility();
  const canModerate = ability.can('moderate', 'content');
  const canDelete = ability.can('delete', 'content');
  const isPending = item.status === 'pending';

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
            {item.uploader.isVerified && (
              <BadgeCheck className="h-4 w-4 text-accent" />
            )}
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

// ─── Main component ───────────────────────────────────────────────────────────

interface ModerationQueueProps {
  initialItems?: FlaggedVideo[];
}

export function ModerationQueue({ initialItems }: ModerationQueueProps) {
  const [items, setItems] = useState<FlaggedVideo[]>(initialItems ?? SEED_QUEUE);
  const [activeId, setActiveId] = useState<string | null>(items[0]?._id ?? null);
  const [loading, setLoading] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const activeItem = items.find((i) => i._id === activeId) ?? null;
  const pendingItems = items.filter((i) => i.status === 'pending');
  const approvedCount = items.filter((i) => i.status === 'approved').length;
  const removedCount  = items.filter((i) => i.status === 'removed').length;
  const deferredCount = items.filter((i) => i.status === 'deferred').length;

  const selectNext = useCallback(() => {
    const idx = items.findIndex((i) => i._id === activeId);
    const next = items.slice(idx + 1).find((i) => i.status === 'pending');
    if (next) setActiveId(next._id);
  }, [activeId, items]);

  const applyAction = useCallback(async (action: ModerationStatus) => {
    if (!activeItem || activeItem.status !== 'pending') return;
    setLoading(true);
    try {
      const endpointMap: Record<ModerationStatus, string> = {
        approved: `/content/${activeItem._id}/approve`,
        removed:  `/content/${activeItem._id}/remove`,
        deferred: `/content/${activeItem._id}/defer`,
        pending:  '',
      };
      await apiClient.post(endpointMap[action]).catch(() => null); // optimistic
      setItems((prev) =>
        prev.map((i) => (i._id === activeItem._id ? { ...i, status: action } : i)),
      );
      selectNext();
    } finally {
      setLoading(false);
    }
  }, [activeItem, selectNext]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key.toLowerCase() === 'a') applyAction('approved');
      if (e.key.toLowerCase() === 'r') applyAction('removed');
      if (e.key.toLowerCase() === 'd') applyAction('deferred');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [applyAction]);

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-white/10">
      {/* Left panel — queue list */}
      <div className="flex w-[300px] shrink-0 flex-col border-r border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
          <div>
            <span className="text-sm font-semibold text-white">Queue</span>
            <span className="ml-2 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-bold text-warning">
              {pendingItems.length}
            </span>
          </div>
          <button
            onClick={() => setShowShortcuts((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors"
            title="Keyboard shortcuts"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Keyboard shortcut hint */}
        {showShortcuts && (
          <div className="border-b border-white/10 bg-black/30 px-3 py-2 text-[11px] text-muted">
            <div className="flex justify-between"><span><kbd className="rounded border border-white/20 px-1">A</kbd> Approve</span><span><kbd className="rounded border border-white/20 px-1">R</kbd> Remove</span><span><kbd className="rounded border border-white/20 px-1">D</kbd> Defer</span></div>
          </div>
        )}

        {/* Stats bar */}
        <div className="flex border-b border-white/10 text-center text-[10px]">
          <div className="flex-1 py-1.5">
            <p className="font-bold text-success">{approvedCount}</p>
            <p className="text-muted">Approved</p>
          </div>
          <div className="flex-1 border-x border-white/10 py-1.5">
            <p className="font-bold text-danger">{removedCount}</p>
            <p className="text-muted">Removed</p>
          </div>
          <div className="flex-1 py-1.5">
            <p className="font-bold text-muted">{deferredCount}</p>
            <p className="text-muted">Deferred</p>
          </div>
        </div>

        {/* Scrollable list */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <CheckCircle2 className="h-8 w-8 text-success/40" />
              <p className="text-xs text-muted">Queue is clear</p>
            </div>
          ) : (
            items.map((item) => (
              <QueueItem
                key={item._id}
                item={item}
                isActive={item._id === activeId}
                onClick={() => setActiveId(item._id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel — detail */}
      <div className="flex-1 overflow-hidden bg-black/20">
        {activeItem ? (
          <DetailPanel
            item={activeItem}
            onApprove={() => applyAction('approved')}
            onRemove={() => applyAction('removed')}
            onDefer={() => applyAction('deferred')}
            loading={loading}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <AlertTriangle className="h-10 w-10 text-muted/30" />
            <p className="text-sm text-muted">Select a flagged item to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
