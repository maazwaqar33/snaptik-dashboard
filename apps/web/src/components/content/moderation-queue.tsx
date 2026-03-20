'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, Keyboard } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { ModerationItem } from './moderation-item';
import { ModerationDetailPanel } from './moderation-detail-panel';
import { type FlaggedVideo, type ModerationStatus } from '@/types/moderation';

// ─── Seed data ─────────────────────────────────────────────────────────────────

const FLAG_REASONS = ['hate_speech', 'nudity', 'violence', 'spam', 'misinformation', 'harassment', 'other'] as const;
const AI_LABELS: Record<string, string[]> = {
  hate_speech: ['hate_speech', 'offensive_language', 'slur'],
  nudity: ['nudity', 'sexual_content', 'adult'],
  violence: ['violence', 'graphic_content', 'blood'],
  spam: ['spam', 'repetitive_content', 'clickbait'],
  misinformation: ['misinformation', 'false_claims', 'health_misinformation'],
  harassment: ['harassment', 'bullying', 'targeted_attack'],
  other: ['policy_violation'],
};
const SEED_QUEUE: FlaggedVideo[] = Array.from({ length: 40 }, (_, i) => {
  const reason = FLAG_REASONS[i % FLAG_REASONS.length]!;
  const now = Date.now();
  return {
    _id: `flag-${String(i + 1).padStart(3, '0')}`,
    videoId: `vid-${String(i + 1).padStart(5, '0')}`,
    thumbnailUrl: undefined, videoUrl: undefined,
    duration: Math.floor(Math.random() * 55 + 5),
    uploadedAt: new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    flaggedAt: new Date(now - Math.random() * 2 * 60 * 60 * 1000).toISOString(),
    uploader: { _id: `user-${i + 1}`, username: `user_${i + 1}`, displayName: `User ${i + 1}`, isVerified: i % 12 === 0 },
    flagReason: reason, aiConfidence: Math.floor(Math.random() * 45 + 55),
    aiLabels: AI_LABELS[reason]!, reportCount: Math.floor(Math.random() * 50 + 1),
    status: 'pending' as ModerationStatus,
  };
});

// ─── Main component ───────────────────────────────────────────────────────────

interface ModerationQueueProps { initialItems?: FlaggedVideo[] }

export function ModerationQueue({ initialItems }: ModerationQueueProps) {
  const [items, setItems]                 = useState<FlaggedVideo[]>(initialItems ?? SEED_QUEUE);
  const [activeId, setActiveId]           = useState<string | null>(items[0]?._id ?? null);
  const [loading, setLoading]             = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const activeItem    = items.find((i) => i._id === activeId) ?? null;
  const pendingItems  = items.filter((i) => i.status === 'pending');
  const approvedCount = items.filter((i) => i.status === 'approved').length;
  const removedCount  = items.filter((i) => i.status === 'removed').length;
  const deferredCount = items.filter((i) => i.status === 'deferred').length;

  const selectNext = useCallback(() => {
    const next = items.slice(items.findIndex((i) => i._id === activeId) + 1).find((i) => i.status === 'pending');
    if (next) setActiveId(next._id);
  }, [activeId, items]);

  const applyAction = useCallback(async (action: ModerationStatus) => {
    if (!activeItem || activeItem.status !== 'pending') return;
    setLoading(true);
    try {
      const ep: Record<ModerationStatus, string> = {
        approved: `/content/${activeItem._id}/approve`,
        removed:  `/content/${activeItem._id}/remove`,
        deferred: `/content/${activeItem._id}/defer`,
        pending:  '',
      };
      await apiClient.post(ep[action]).catch(() => null);
      setItems((prev) => prev.map((i) => (i._id === activeItem._id ? { ...i, status: action } : i)));
      selectNext();
    } finally { setLoading(false); }
  }, [activeItem, selectNext]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
          <div>
            <span className="text-sm font-semibold text-white">Queue</span>
            <span className="ml-2 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-bold text-warning">{pendingItems.length}</span>
          </div>
          <button onClick={() => setShowShortcuts((v) => !v)} title="Keyboard shortcuts"
            className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors">
            <Keyboard className="h-3.5 w-3.5" />
          </button>
        </div>
        {showShortcuts && (
          <div className="border-b border-white/10 bg-black/30 px-3 py-2 text-[11px] text-muted">
            <div className="flex justify-between">
              <span><kbd className="rounded border border-white/20 px-1">A</kbd> Approve</span>
              <span><kbd className="rounded border border-white/20 px-1">R</kbd> Remove</span>
              <span><kbd className="rounded border border-white/20 px-1">D</kbd> Defer</span>
            </div>
          </div>
        )}
        <div className="flex border-b border-white/10 text-center text-[10px]">
          <div className="flex-1 py-1.5"><p className="font-bold text-success">{approvedCount}</p><p className="text-muted">Approved</p></div>
          <div className="flex-1 border-x border-white/10 py-1.5"><p className="font-bold text-danger">{removedCount}</p><p className="text-muted">Removed</p></div>
          <div className="flex-1 py-1.5"><p className="font-bold text-muted">{deferredCount}</p><p className="text-muted">Deferred</p></div>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <CheckCircle2 className="h-8 w-8 text-success/40" />
              <p className="text-xs text-muted">Queue is clear</p>
            </div>
          ) : (
            items.map((item) => (
              <ModerationItem key={item._id} item={item} isActive={item._id === activeId} onClick={() => setActiveId(item._id)} />
            ))
          )}
        </div>
      </div>

      {/* Right panel — detail */}
      <div className="flex-1 overflow-hidden bg-black/20">
        {activeItem ? (
          <ModerationDetailPanel item={activeItem}
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
