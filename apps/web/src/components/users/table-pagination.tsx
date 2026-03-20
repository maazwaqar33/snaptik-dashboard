'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Table } from '@tanstack/react-table';
import type { AppUser } from '@/types/platform';

interface TablePaginationProps {
  table: Table<AppUser>;
}

export function TablePagination({ table }: TablePaginationProps) {
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const total     = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-xs text-muted">
        Page {pageIndex + 1} of {pageCount} &mdash; {total.toLocaleString()} total
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

        {Array.from({ length: Math.min(pageCount, 7) }, (_, i) => {
          let page: number;
          if (pageCount <= 7)   page = i;
          else if (i === 0)     page = 0;
          else if (i === 6)     page = pageCount - 1;
          else                  page = Math.max(1, Math.min(pageIndex - 1, pageCount - 5)) + (i - 1);
          const isActive = page === pageIndex;
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
  );
}
