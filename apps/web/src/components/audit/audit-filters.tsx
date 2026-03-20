'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export const ACTION_FILTERS = [
  { label: 'All',      value: 'all'      },
  { label: 'Content',  value: 'content'  },
  { label: 'Users',    value: 'user'     },
  { label: 'Reports',  value: 'report'   },
  { label: 'Settings', value: 'settings' },
  { label: 'Auth',     value: 'login'    },
];

interface AuditFiltersProps {
  search:            string;
  onSearchChange:    (value: string) => void;
  actionFilter:      string;
  onActionChange:    (value: string) => void;
}

export function AuditFilters({
  search,
  onSearchChange,
  actionFilter,
  onActionChange,
}: AuditFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#AAAAAA]" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search actor, action, IP…"
          className="h-9 w-full rounded-lg border border-white/10 bg-black/40 pl-8 pr-3 text-sm text-white placeholder:text-[#AAAAAA] outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-colors"
        />
      </div>
      <div className="flex gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
        {ACTION_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onActionChange(value)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              actionFilter === value ? 'bg-[#007AFF] text-white' : 'text-[#AAAAAA] hover:text-white',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
