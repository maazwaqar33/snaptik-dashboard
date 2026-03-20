'use client';

import { Search, ShieldBan } from 'lucide-react';
import { cn } from '@/lib/cn';
import { STATUS_STYLES } from './columns';
import type { UserAction } from './user-action-modal';
import type { AppUser, UserStatus } from '@/types/platform';

interface TableToolbarProps {
  globalFilter:    string;
  setGlobalFilter: (v: string) => void;
  statusFilter:    UserStatus | 'all';
  setStatusFilter: (v: UserStatus | 'all') => void;
  totalFiltered:   number;
  selectedCount:   number;
  canBan:          boolean;
  openModal:       (action: UserAction, user: AppUser | null) => void;
}

export function TableToolbar({
  globalFilter,
  setGlobalFilter,
  statusFilter,
  setStatusFilter,
  totalFiltered,
  selectedCount,
  canBan,
  openModal,
}: TableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search users, emails…"
          className="h-9 w-full rounded-lg border border-white/10 bg-black/40 pl-8 pr-3 text-sm text-white placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
          {(['all', 'active', 'banned', 'suspended', 'pending'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                statusFilter === s ? 'bg-accent text-white' : 'text-muted hover:text-white',
              )}
            >
              {s === 'all' ? 'All' : STATUS_STYLES[s].label}
            </button>
          ))}
        </div>

        {canBan && selectedCount > 0 && (
          <button
            onClick={() => openModal('bulk-ban', null)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-danger/15 px-3 text-xs font-semibold text-danger hover:bg-danger/25 transition-colors"
          >
            <ShieldBan className="h-3.5 w-3.5" />
            Ban {selectedCount} selected
          </button>
        )}

        <span className="hidden text-xs text-muted sm:inline">
          {totalFiltered.toLocaleString()} users
        </span>
      </div>
    </div>
  );
}
