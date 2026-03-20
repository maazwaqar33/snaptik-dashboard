'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { BadgeCheck } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/cn';
import { ActionMenu } from './action-menu';
import type { UserAction } from './user-action-modal';
import type { AppUser, UserStatus } from '@/types/platform';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const STATUS_STYLES: Record<UserStatus, { dot: string; text: string; label: string }> = {
  active:    { dot: 'bg-success', text: 'text-success', label: 'Active' },
  banned:    { dot: 'bg-danger',  text: 'text-danger',  label: 'Banned' },
  suspended: { dot: 'bg-warning', text: 'text-warning', label: 'Suspended' },
  pending:   { dot: 'bg-muted',   text: 'text-muted',   label: 'Pending' },
};

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000)      return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

// ─── Column factory ───────────────────────────────────────────────────────────

const colHelper = createColumnHelper<AppUser>();

export function createColumns(
  onAction: (action: UserAction, user: AppUser) => void,
  _canBan: boolean,
) {
  return [
    // Checkbox
    colHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-3.5 w-3.5 accent-accent"
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5 accent-accent"
          aria-label="Select row"
        />
      ),
      size: 40,
    }),
    // User identity
    colHelper.accessor('displayName', {
      header: 'User',
      cell: ({ row }) => {
        const u = row.original;
        const initials = u.displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-medium text-white">{u.displayName}</span>
                {u.isVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-accent" />}
              </div>
              <span className="truncate text-xs text-muted">@{u.username}</span>
            </div>
          </div>
        );
      },
      enableGlobalFilter: true,
      size: 200,
    }),
    // Email
    colHelper.accessor('email', {
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="truncate text-xs text-muted">{getValue()}</span>
      ),
      size: 200,
    }),
    // Status
    colHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const s = STATUS_STYLES[getValue()];
        return (
          <div className="flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
            <span className={cn('text-xs font-medium', s.text)}>{s.label}</span>
          </div>
        );
      },
      size: 100,
    }),
    // Followers
    colHelper.accessor('followersCount', {
      header: 'Followers',
      cell: ({ getValue }) => (
        <span className="text-xs text-white/70">{fmtNum(getValue())}</span>
      ),
      size: 90,
    }),
    // Videos
    colHelper.accessor('videosCount', {
      header: 'Videos',
      cell: ({ getValue }) => (
        <span className="text-xs text-white/70">{getValue()}</span>
      ),
      size: 70,
    }),
    // Reports
    colHelper.accessor('reportCount', {
      header: 'Reports',
      cell: ({ getValue }) => {
        const v = getValue();
        return (
          <span className={cn('text-xs font-medium', v > 5 ? 'text-danger' : v > 0 ? 'text-warning' : 'text-muted')}>
            {v}
          </span>
        );
      },
      size: 70,
    }),
    // Joined
    colHelper.accessor('createdAt', {
      header: 'Joined',
      cell: ({ getValue }) => (
        <span className="text-xs text-muted" title={format(new Date(getValue()), 'PPP')}>
          {format(new Date(getValue()), 'MMM d, yyyy')}
        </span>
      ),
      size: 110,
    }),
    // Last active
    colHelper.accessor('lastActiveAt', {
      header: 'Last Active',
      cell: ({ getValue }) => {
        const v = getValue();
        return (
          <span className="text-xs text-muted">
            {v ? formatDistanceToNow(new Date(v), { addSuffix: true }) : '—'}
          </span>
        );
      },
      size: 120,
    }),
    // Actions
    colHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <ActionMenu user={row.original} onAction={onAction} />
      ),
      size: 48,
    }),
  ];
}
