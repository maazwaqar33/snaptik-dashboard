'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { ROLE_LABELS } from '@snaptik/types';

// Maps route paths to human-readable breadcrumb labels
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/users': 'Users',
  '/dashboard/content': 'Content Moderation',
  '/dashboard/reports': 'Reports',
  '/dashboard/tickets': 'Support Tickets',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/audit': 'Audit Log',
  '/dashboard/live': 'Live Monitor',
  '/dashboard/admins': 'Admin Management',
  '/dashboard/settings': 'Settings',
};

function getBreadcrumb(pathname: string): string {
  // Exact match first
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]!;
  // Match by prefix for deep routes (e.g. /dashboard/users/123)
  const matched = Object.keys(ROUTE_LABELS)
    .filter((key) => key !== '/dashboard' && pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return matched ? (ROUTE_LABELS[matched] ?? 'Dashboard') : 'Dashboard';
}

export function Topbar() {
  const pathname = usePathname();
  const admin = useAuthStore((s) => s.admin);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-surface px-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted">SnapTik</span>
        <span className="text-white/20">/</span>
        <span className="font-medium text-white">{getBreadcrumb(pathname)}</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Notifications bell — placeholder, wired in Task 6 */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {/* Unread dot — shown when there are alerts */}
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>

        {/* Admin chip */}
        {admin && (
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
              {admin.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-white leading-none">{admin.name}</p>
              <p className="mt-0.5 text-[10px] text-muted leading-none">
                {ROLE_LABELS[admin.role] ?? admin.role}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
