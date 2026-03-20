'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, Filter } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAbility } from '@/hooks/use-ability';
import { UserActionModal, type UserAction, nextStatus } from './user-action-modal';
import { createColumns } from './columns';
import { TableToolbar } from './table-toolbar';
import { TablePagination } from './table-pagination';
import type { AppUser, UserStatus } from '@/types/platform';
import { apiClient } from '@/lib/api';

interface UsersTableProps {
  initialData: AppUser[];
}

export function UsersTable({ initialData }: UsersTableProps) {
  const ability = useAbility();
  const canBan  = ability.can('ban', 'users');

  const [data, setData]                 = useState<AppUser[]>(initialData ?? []);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [sorting, setSorting]           = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [modal, setModal]               = useState<{ action: UserAction; user: AppUser | null } | null>(null);

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
        selectedIds.map((id) => apiClient.post(`/users/${id}/ban`, { reason }).catch(() => null)),
      );
      setData((prev) =>
        prev.map((u) => selectedIds.includes(u._id) ? { ...u, status: 'banned', statusReason: reason } : u),
      );
      setRowSelection({});
      return;
    }

    if (!user) return;

    const endpoint: Record<UserAction, string> = {
      ban:              `/users/${user._id}/ban`,
      unban:            `/users/${user._id}/unban`,
      warn:             `/users/${user._id}/warn`,
      verify:           `/users/${user._id}/verify`,
      unverify:         `/users/${user._id}/verify`,
      'reset-password': `/users/${user._id}/reset-password`,
      'bulk-ban':       '',
    };

    try { await apiClient.post(endpoint[action], { reason }); } catch { /* optimistic */ }

    setData((prev) =>
      prev.map((u) => {
        if (u._id !== user._id) return u;
        return {
          ...u,
          status:     nextStatus(action, u.status),
          statusReason: reason,
          isVerified: action === 'verify' ? true : action === 'unverify' ? false : u.isVerified,
        };
      }),
    );
  }, [modal, rowSelection]);

  const columns = useMemo(() => createColumns(openModal, canBan), [openModal, canBan]);

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
  const pageRows      = table.getRowModel().rows;

  return (
    <>
      <TableToolbar
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        totalFiltered={table.getFilteredRowModel().rows.length}
        selectedCount={selectedCount}
        canBan={canBan}
        openModal={openModal}
      />

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-white/10 bg-white/3">
                {hg.headers.map((header) => {
                  const sorted  = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={cn('px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted', canSort && 'cursor-pointer select-none hover:text-white')}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-muted/50">
                            {sorted === 'asc' ? <ChevronUp className="h-3 w-3" /> : sorted === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3" />}
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
                <td colSpan={columns.length} className="px-3 py-12 text-center text-sm text-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Filter className="h-8 w-8 text-muted/30" />
                    No users match your filters
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={row.id} className={cn('border-b border-white/5 transition-colors hover:bg-white/3', row.getIsSelected() && 'bg-accent/5')}>
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

      <TablePagination table={table} />

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
