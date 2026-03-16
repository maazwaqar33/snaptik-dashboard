'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AppUser, UserStatus } from '@/types/platform';

export type UserAction = 'ban' | 'unban' | 'warn' | 'verify' | 'unverify' | 'reset-password' | 'bulk-ban';

interface ActionConfig {
  title: string;
  description: (user: AppUser | null, count?: number) => string;
  confirmLabel: string;
  confirmClass: string;
  needsReason: boolean;
  reasonPlaceholder?: string;
}

const ACTION_CONFIG: Record<UserAction, ActionConfig> = {
  ban: {
    title: 'Ban User',
    description: (u) => `@${u?.username} will be banned and immediately locked out. This action is logged in the audit trail.`,
    confirmLabel: 'Ban User',
    confirmClass: 'bg-danger hover:bg-danger/90',
    needsReason: true,
    reasonPlaceholder: 'e.g. Repeated community guideline violations',
  },
  unban: {
    title: 'Unban User',
    description: (u) => `@${u?.username} will be reinstated and regain full access to SnapTik.`,
    confirmLabel: 'Unban User',
    confirmClass: 'bg-success hover:bg-success/90',
    needsReason: false,
  },
  warn: {
    title: 'Warn User',
    description: (u) => `A warning notification will be sent to @${u?.username}. This is logged but does not restrict access.`,
    confirmLabel: 'Send Warning',
    confirmClass: 'bg-warning hover:bg-warning/90',
    needsReason: true,
    reasonPlaceholder: 'e.g. Posting misleading content',
  },
  verify: {
    title: 'Verify Account',
    description: (u) => `@${u?.username} will receive a verified badge visible to all users.`,
    confirmLabel: 'Verify Account',
    confirmClass: 'bg-accent hover:bg-accent/90',
    needsReason: false,
  },
  unverify: {
    title: 'Remove Verification',
    description: (u) => `The verified badge will be removed from @${u?.username}.`,
    confirmLabel: 'Remove Badge',
    confirmClass: 'bg-warning hover:bg-warning/90',
    needsReason: false,
  },
  'reset-password': {
    title: 'Reset Password',
    description: (u) => `A password reset email will be sent to ${u?.email}. Their current password will be invalidated immediately.`,
    confirmLabel: 'Send Reset Email',
    confirmClass: 'bg-accent hover:bg-accent/90',
    needsReason: false,
  },
  'bulk-ban': {
    title: 'Bulk Ban Users',
    description: (_, count) => `${count ?? 0} selected users will be banned simultaneously. This action is irreversible and logged.`,
    confirmLabel: 'Ban All Selected',
    confirmClass: 'bg-danger hover:bg-danger/90',
    needsReason: true,
    reasonPlaceholder: 'e.g. Coordinated spam campaign',
  },
};

interface UserActionModalProps {
  open: boolean;
  action: UserAction | null;
  user: AppUser | null;
  bulkCount?: number;
  onConfirm: (reason?: string) => Promise<void>;
  onClose: () => void;
}

export function UserActionModal({
  open,
  action,
  user,
  bulkCount,
  onConfirm,
  onClose,
}: UserActionModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const config = action ? ACTION_CONFIG[action] : null;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setReason('');
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !config || !action) return null;

  const handleConfirm = async () => {
    if (config.needsReason && !reason.trim()) {
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      await onConfirm(reason.trim() || undefined);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger/15">
              <AlertTriangle className="h-4.5 w-4.5 text-danger" />
            </div>
            <div>
              <h2 className="font-outfit text-base font-semibold text-white">{config.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {config.description(user, bulkCount)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-muted hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Reason input */}
        {config.needsReason && (
          <div className="p-5 pb-0">
            <label className="mb-1.5 block text-xs font-medium text-white/80">
              Reason {config.needsReason && <span className="text-danger">*</span>}
            </label>
            <textarea
              ref={inputRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={config.reasonPlaceholder}
              rows={3}
              className={cn(
                'w-full resize-none rounded-lg border bg-black/40 px-3 py-2 text-sm text-white placeholder:text-muted',
                'outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20',
                'border-white/10',
              )}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-9 rounded-lg border border-white/10 px-4 text-sm font-medium text-muted hover:border-white/20 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (config.needsReason && !reason.trim())}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-opacity',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-danger/40 disabled:text-white/60',
              config.confirmClass,
            )}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {config.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Derive the new status after an action
export function nextStatus(action: UserAction, current: UserStatus): UserStatus {
  if (action === 'ban' || action === 'bulk-ban') return 'banned';
  if (action === 'unban') return 'active';
  return current;
}
