'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';
import { TicketDetail } from './ticket-detail';
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  CATEGORY_LABELS,
  type Ticket,
  type TicketStatus,
} from '@/types/tickets';

const col = createColumnHelper<Ticket>();

const COLUMNS = [
  col.accessor('ticketId', {
    header: 'ID',
    size: 90,
    cell: (i) => (
      <span className="font-mono text-xs font-semibold text-[#AAAAAA]">{i.getValue()}</span>
    ),
  }),
  col.accessor('subject', {
    header: 'Subject',
    size: 260,
    cell: (i) => (
      <span className="line-clamp-1 text-sm font-medium text-white">{i.getValue()}</span>
    ),
  }),
  col.accessor('user.username', {
    header: 'User',
    size: 120,
    cell: (i) => <span className="text-xs text-[#AAAAAA]">@{i.getValue()}</span>,
  }),
  col.accessor('status', {
    header: 'Status',
    size: 110,
    cell: (i) => {
      const cfg = STATUS_CONFIG[i.getValue()];
      return (
        <span className={cn('rounded-lg px-2.5 py-1 text-[11px] font-semibold', cfg.bg, cfg.text)}>
          {cfg.label}
        </span>
      );
    },
  }),
  col.accessor('priority', {
    header: 'Priority',
    size: 90,
    cell: (i) => {
      const cfg = PRIORITY_CONFIG[i.getValue()];
      return (
        <span className="flex items-center gap-1.5 text-xs text-[#AAAAAA]">
          <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
          {cfg.label}
        </span>
      );
    },
  }),
  col.accessor('category', {
    header: 'Category',
    size: 90,
    cell: (i) => (
      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-[#AAAAAA]">
        {CATEGORY_LABELS[i.getValue()]}
      </span>
    ),
  }),
  col.accessor('assignedTo', {
    header: 'Assigned',
    size: 110,
    enableSorting: false,
    cell: (i) => {
      const a = i.getValue();
      return a ? (
        <span className="text-xs text-white/70">{a.name.split(' ')[0]}</span>
      ) : (
        <span className="text-xs text-[#AAAAAA]/50">—</span>
      );
    },
  }),
  col.accessor('createdAt', {
    header: 'Opened',
    size: 110,
    cell: (i) => (
      <span className="text-xs text-[#AAAAAA]">
        {formatDistanceToNow(new Date(i.getValue()), { addSuffix: true })}
      </span>
    ),
  }),
];

const STATUS_FILTERS: Array<{ label: string; value: TicketStatus | 'all' }> = [
  { label: 'All',         value: 'all'         },
  { label: 'Open',        value: 'open'        },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Waiting',     value: 'waiting'     },
  { label: 'Resolved',    value: 'resolved'    },
];

interface TicketsTableProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
}

export function TicketsTable({ tickets, onStatusChange }: TicketsTableProps) {
  const [sorting, setSorting]         = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [selected, setSelected]       = useState<Ticket | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const table = useReactTable({
    data: filtered,
    columns: COLUMNS,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className={cn('flex gap-4 transition-all', selected ? 'flex-col xl:flex-row' : '')}>
      {/* Table panel */}
      <div className={cn('flex min-w-0 flex-col gap-3', selected ? 'xl:flex-1' : 'w-full')}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#AAAAAA]" />
            <input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search tickets, users…"
              className="h-9 w-full rounded-lg border border-white/10 bg-black/40 pl-8 pr-3 text-sm text-white placeholder:text-[#AAAAAA] outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-colors"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
            {STATUS_FILTERS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  statusFilter === value ? 'bg-[#007AFF] text-white' : 'text-[#AAAAAA] hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-white/10 bg-white/[0.03]">
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        style={{ width: h.getSize() }}
                        className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#AAAAAA]"
                      >
                        {h.isPlaceholder ? null : (
                          <div
                            className={cn(
                              'flex items-center gap-1',
                              h.column.getCanSort() && 'cursor-pointer select-none hover:text-white',
                            )}
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {h.column.getIsSorted() === 'asc'  && <ChevronUp   className="h-3 w-3 text-[#007AFF]" />}
                            {h.column.getIsSorted() === 'desc' && <ChevronDown className="h-3 w-3 text-[#007AFF]" />}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="py-16 text-center text-sm text-[#AAAAAA]">
                      No tickets match your filters
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row.original)}
                      className={cn(
                        'cursor-pointer border-b border-white/[0.06] transition-colors hover:bg-white/[0.03]',
                        selected?._id === row.original._id && 'bg-[#007AFF]/8',
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
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
          <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-3">
            <span className="text-xs text-[#AAAAAA]">
              {table.getFilteredRowModel().rows.length} ticket
              {table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#AAAAAA]">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="rounded-md p-1 text-[#AAAAAA] transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="rounded-md p-1 text-[#AAAAAA] transition-colors hover:bg-white/5 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="h-[600px] w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[#121212] xl:w-[420px] xl:h-auto xl:max-h-[80vh]">
          <TicketDetail
            ticket={selected}
            onClose={() => setSelected(null)}
            onStatusChange={(id, s) => {
              onStatusChange(id, s);
              setSelected((prev) => (prev?._id === id ? { ...prev, status: s } : prev));
            }}
          />
        </div>
      )}
    </div>
  );
}
