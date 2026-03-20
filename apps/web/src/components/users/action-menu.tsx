'use client';

import { useState } from 'react';
import {
  MoreHorizontal,
  ShieldBan,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  BadgeCheck,
  BadgeX,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAbility } from '@/hooks/use-ability';
import type { UserAction } from './user-action-modal';
import type { AppUser } from '@/types/platform';

export function ActionMenu({
  user,
  onAction,
}: {
  user: AppUser;
  onAction: (action: UserAction, user: AppUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const ability = useAbility();

  const canBan     = ability.can('ban',           'users');
  const canWarn    = ability.can('warn',          'users');
  const canEdit    = ability.can('edit',          'users');
  const canResetPw = ability.can('resetpassword', 'users');

  const items: Array<{
    action:     UserAction;
    label:      string;
    icon:       React.ElementType;
    show:       boolean;
    className?: string;
  }> = [
    {
      action:    (user.isVerified ? 'unverify' : 'verify') as UserAction,
      label:     user.isVerified ? 'Remove verification' : 'Verify account',
      icon:      user.isVerified ? BadgeX : BadgeCheck,
      show:      canEdit,
    },
    { action: 'warn' as UserAction,           label: 'Warn user',      icon: AlertTriangle, show: canWarn,    className: 'text-warning' },
    { action: 'reset-password' as UserAction, label: 'Reset password', icon: KeyRound,      show: canResetPw },
    {
      action:    (user.status === 'banned' ? 'unban' : 'ban') as UserAction,
      label:     user.status === 'banned' ? 'Unban user' : 'Ban user',
      icon:      user.status === 'banned' ? ShieldCheck : ShieldBan,
      show:      canBan,
      className: user.status === 'banned' ? 'text-success' : 'text-danger',
    },
  ].filter((i) => i.show);

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Row actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-1 w-48 rounded-xl border border-white/10 bg-surface py-1 shadow-2xl">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.action}
                  onClick={() => { setOpen(false); onAction(item.action, user); }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-white/5',
                    item.className ?? 'text-white/80',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
