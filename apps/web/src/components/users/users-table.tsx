'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ShieldBan,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  BadgeCheck,
  BadgeX,
  Filter,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/cn';
import { useAbility } from '@/hooks/use-ability';
import { UserActionModal, type UserAction, nextStatus } from './user-action-modal';
import type { AppUser, UserStatus } from '@/types/platform';
import { apiClient } from '@/lib/api';

// ─── Mock seed data ──────────────────────────────────────────────────────────

const COUNTRIES = ['US', 'GB', 'IN', 'BR', 'DE', 'FR', 'JP', 'KR', 'AU', 'CA'];
const STATUSES: UserStatus[] = ['active', 'active', 'active', 'active', 'active', 'banned', 'suspended', 'pending'];

function seedUsers(n: number): AppUser[] {
  return Array.from({ length: n }, (_, i) => {
    const id = `user-${String(i + 1).padStart(4, '0')}`;
    const names = ['Alex Chen', 'Sam Rivera', 'Jordan Kim', 'Taylor Smith', 'Morgan Lee', 'Casey Brown', 'Riley Davis', 'Quinn Wilson', 'Avery Moore', 'Blake Taylor'];
    const name = names[i % names.length]!;
    const joined = new Date(Date.now() - Math.random() * 365 * 3 * 24 * 60 * 60 * 1000);
    return {
      _id: id,
      username: `${name.toLowerCase().replace(' ', '_')}${i + 1}`,
      displayName: `${name} ${i + 1}`,
      email: `${name.toLowerCase().replace(' ', '.')}${i + 1}@example.com`,
      status: STATUSES[i % STATUSES.length]!,
      isVerified: i % 7 === 0,
      isEmailVerified: i % 12 !== 0,
      followersCount: Math.floor(Math.random() * 1_000_000),
      followingCount: Math.floor(Math.random() * 5000),
      videosCount: Math.floor(Math.random() * 500),
      likesCount: Math.floor(Math.random() * 5_000_000),
      createdAt: joined.toISOString(),
      lastActiveAt: new Date(joined.getTime() + Math.random() * (Date.now() - joined.getTime())).toISOString(),
      reportCount: Math.floor(Math.random() * 10),
      country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
    };
  });
}

const SEED_USERS = seedUsers(200);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<UserStatus, { dot: string; text: string; label: string }> = {
  active:    { dot: 'bg-success', text: 'text-success', label: 'Active' },
  banned:    { dot: 'bg-danger',  text: 'text-danger',  label: 'Banned' },
  suspended: { dot: 'bg-warning', text: 'text-warning', label: 'Suspended' },
  pending:   { dot: 'bg-muted',   text: 'text-muted',   label: 'Pending' },
};

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

// ─── Column helper ────────────────────────────────────────────────────────────

const colHelper = createColumnHelper<AppUser>();

// ─── Row action menu ──────────────────────────────────────────────────────────

function ActionMenu({
  user,
  onAction,
}: {
  user: AppUser;
  onAction: (action: UserAction, user: AppUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const ability = useAbility();

  const canBan = ability.can('ban', 'users');
  const canWarn = ability.can('warn', 'users');
  const canEdit = ability.can('edit', 'users');
  const canResetPw = ability.can('resetpassword', 'users');

  const items: Array<{
    action: UserAction;
    label: string;
    icon: React.ElementType;
    show: boolean;
    className?: string;
  }> = [
    { action: (user.isVerified ? 'unverify' : 'verify') as UserAction, label: user.isVerified ? 'Remove verification' : 'Verify account', icon: user.isVerified ? BadgeX : BadgeCheck, show: canEdit },
    { action: 'warn' as UserAction,           label: 'Warn user',        icon: AlertTriangle, show: canWarn, className: 'text-warning' },
    { action: 'reset-password' as UserAction, label: 'Reset password',   icon: KeyRound,      show: canResetPw },
    { action: (user.status === 'banned' ? 'unban' : 'ban') as UserAction, label: user.status === 'banned' ? 'Unban user' : 'Ban user', icon: user.status === 'banned' ? ShieldCheck : ShieldBan, show: canBan, className: user.status === 'banned' ? 'text-success' : 'text-danger' },
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

// ─── Main table component ─────────────────────────────────────────────────────

interface UsersTableProps {
  /** If provided, real API is used; otherwise falls back to seed data */
  initialData?: AppUser[];
}

export function UsersTable({ initialData }: UsersTableProps) {
  const ability = useAbility();
  const canBan = ability.can('ban', 'users');

  const [data, setData] = useState<AppUser[]>(initialData ?? SEED_USERS);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [modal, setModal] = useState<{ action: UserAction; user: AppUser | null } | null>(null);

  // Apply status filter before passing to table
  const filteredData = useMemo(
    () => (statusFilter === 'all' ? data : data.filter((u) => u.status === statusFilter)),
    [data, statusFilter],
  );

  const openModal = useCallback((action: UserAction, user: AppUser | null) => {
    setModal({ action, user });
  }, []);

  const handleConfirm = useCallback(async (reason?: string) => {
    if (!modal) return;
    const { action, user } = modal;

    if (action === 'bulk-ban') {
      const selectedIds = Object.keys(rowSelection);
      await Promise.all(
        selectedIds.map((id) =>
          apiClient.post(`/users/${id}/ban`, { reason }).catch(() => null),
        ),
      );
      setData((prev) =>
        prev.map((u) =>
          selectedIds.includes(u._id) ? { ...u, status: 'banned', statusReason: reason } : u,
        ),
      );
      setRowSelection({});
      return;
    }

    if (!user) return;

    const endpoint: Record<UserAction, string> = {
      ban: `/users/${user._id}/ban`,
      unban: `/users/${user._id}/unban`,
      warn: `/users/${user._id}/warn`,
      verify: `/users/${user._id}/verify`,
      unverify: `/users/${user._id}/verify`,
      'reset-password': `/users/${user._id}/reset-password`,
      'bulk-ban': '',
    };

    try {
      await apiClient.post(endpoint[action], { reason });
    } catch {
      // Optimistic — update UI even if API is down during dev
    }

    setData((prev) =>
      prev.map((u) => {
        if (u._id !== user._id) return u;
        const newStatus = nextStatus(action, u.status);
        return {
          ...u,
          status: newStatus,
          statusReason: reason,
          isVerified: action === 'verify' ? true : action === 'unverify' ? false : u.isVerified,
        };
      }),
    );
  }, [modal, rowSelection]);

  // ── Column definitions ────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
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
          <ActionMenu user={row.original} onAction={openModal} />
        ),
        size: 48,
      }),
    ],
    [openModal],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { globalFilter, sorting, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row._id,
    initialState: { pagination: { pageSize: 25 } },
  });

  const selectedCount = Object.keys(rowSelection).length;
  const pageRows = table.getRowModel().rows;

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        {/* Search */}
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
          {/* Status filter */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
            {(['all', 'active', 'banned', 'suspended', 'pending'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                  statusFilter === s
                    ? 'bg-accent text-white'
                    : 'text-muted hover:text-white',
                )}
              >
                {s === 'all' ? 'All' : STATUS_STYLES[s].label}
              </button>
            ))}
          </div>

          {/* Bulk ban */}
          {canBan && selectedCount > 0 && (
            <button
              onClick={() => openModal('bulk-ban', null)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-danger/15 px-3 text-xs font-semibold text-danger hover:bg-danger/25 transition-colors"
            >
              <ShieldBan className="h-3.5 w-3.5" />
              Ban {selectedCount} selected
            </button>
          )}

          {/* Row count */}
          <span className="hidden text-xs text-muted sm:inline">
            {table.getFilteredRowModel().rows.length.toLocaleString()} users
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-white/10 bg-white/3">
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={cn(
                        'px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted',
                        canSort && 'cursor-pointer select-none hover:text-white',
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-muted/50">
                            {sorted === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-12 text-center text-sm text-muted"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="h-8 w-8 text-muted/30" />
                    No users match your filters
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-white/5 transition-colors hover:bg-white/3',
                    row.getIsSelected() && 'bg-accent/5',
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ width: cell.column.getSize() }} className="px-3 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-3">
        <span className="text-xs text-muted">
          Page {table.getState().pagination.pageIndex + 1} of{' '}
          {table.getPageCount()} &mdash; {table.getFilteredRowModel().rows.length.toLocaleString()} total
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-muted hover:border-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(table.getPageCount(), 7) }, (_, i) => {
            const total = table.getPageCount();
            const current = table.getState().pagination.pageIndex;
            // Show first, last, current ± 1, with ... gaps
            let page: number;
            if (total <= 7) {
              page = i;
            } else if (i === 0) {
              page = 0;
            } else if (i === 6) {
              page = total - 1;
            } else {
              page = Math.max(1, Math.min(current - 1, total - 5)) + (i - 1);
            }
            const isActive = page === current;
            return (
              <button
                key={page}
                onClick={() => table.setPageIndex(page)}
                className={cn(
                  'h-7 min-w-[28px] rounded-lg border px-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'border-accent bg-accent text-white'
                    : 'border-white/10 text-muted hover:border-white/20 hover:text-white',
                )}
              >
                {page + 1}
              </button>
            );
          })}
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-muted hover:border-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Action modal */}
      <UserActionModal
        open={modal !== null}
        action={modal?.action ?? null}
        user={modal?.user ?? null}
        bulkCount={modal?.action === 'bulk-ban' ? selectedCount : undefined}
        onConfirm={handleConfirm}
        onClose={() => setModal(null)}
      />
    </>
  );
}
