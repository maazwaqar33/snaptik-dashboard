'use client';

import { cn } from '@/lib/cn';

interface ConfidenceBadgeProps {
  confidence: number; // 0–100
  size?: 'sm' | 'md';
}

/**
 * Displays AI model confidence as a coloured pill.
 * ≥ 90 → danger (act immediately)
 * 70–89 → warning (review required)
 * < 70  → muted (low confidence, low priority)
 */
export function ConfidenceBadge({ confidence, size = 'md' }: ConfidenceBadgeProps) {
  const color =
    confidence >= 90
      ? 'border-danger/40 bg-danger/15 text-danger'
      : confidence >= 70
        ? 'border-warning/40 bg-warning/15 text-warning'
        : 'border-white/10 bg-white/5 text-muted';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-mono font-semibold tabular-nums',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        color,
      )}
      title={`AI confidence: ${confidence}%`}
    >
      {confidence}%
    </span>
  );
}

/** Inline bar used in the detail panel */
export function ConfidenceBar({ confidence }: { confidence: number }) {
  const color =
    confidence >= 90 ? 'bg-danger' : confidence >= 70 ? 'bg-warning' : 'bg-muted';

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-mono font-semibold text-white">
        {confidence}%
      </span>
    </div>
  );
}
