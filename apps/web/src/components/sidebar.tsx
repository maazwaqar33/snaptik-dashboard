'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  Flag,
  Ticket,
  BarChart2,
  ScrollText,
  UserCog,
  Settings,
  Radio,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useAbility } from '@/hooks/use-ability';
import { cn } from '@/lib/cn';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  // Permission required to see this item — undefined = always visible
  permission?: [string, string]; // [action, subject]
  // If true, only super_admin sees it
  superAdminOnly?: boolean;
  // Visual separator above this item
  groupStart?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Users',
    href: '/dashboard/users',
    icon: Users,
    permission: ['read', 'users'],
    groupStart: true,
  },
  {
    label: 'Content',
    href: '/dashboard/content',
    icon: ShieldAlert,
    permission: ['read', 'content'],
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: Flag,
    permission: ['read', 'reports'],
  },
  {
    label: 'Tickets',
    href: '/dashboard/tickets',
    icon: Ticket,
    permission: ['read', 'tickets'],
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart2,
    permission: ['read', 'analytics'],
    groupStart: true,
  },
  {
    label: 'Audit Log',
    href: '/dashboard/audit',
    icon: ScrollText,
    permission: ['read', 'auditlog'],
  },
  {
    label: 'Live Monitor',
    href: '/dashboard/live',
    icon: Radio,
    permission: ['read', 'analytics'],
  },
  {
    label: 'Admins',
    href: '/dashboard/admins',
    icon: UserCog,
    superAdminOnly: true,
    groupStart: true,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    superAdminOnly: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAuthStore();
  const ability = useAbility();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.push('/login');
  };

  const isVisible = (item: NavItem): boolean => {
    if (item.superAdminOnly) return admin?.role === 'super_admin';
    if (item.permission) {
      const [action, subject] = item.permission;
      return ability.can(action, subject);
    }
    return true;
  };

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-white/10 bg-surface transition-all duration-200',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* Logo area */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-white/10 px-4',
          collapsed ? 'justify-center' : 'gap-2.5',
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden>
            <path
              d="M20 6H12C9.79 6 8 7.79 8 10v8c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4v-8c0-2.21-1.79-4-4-4z"
              fill="white"
              opacity="0.9"
            />
            <path
              d="M11 14l4 4 6-7"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        {!collapsed && (
          <span className="font-outfit text-sm font-semibold text-white">SnapTik Admin</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.filter(isVisible).map((item, index, arr) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          // Show divider for groupStart items (but not the very first visible item)
          const showDivider = item.groupStart && index > 0 && isVisible(arr[index - 1]!);

          return (
            <div key={item.href}>
              {showDivider && <div className="my-1.5 border-t border-white/8" />}
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors',
                  collapsed ? 'justify-center' : '',
                  active
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-accent' : '')} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="shrink-0 border-t border-white/10 p-2">
        {/* User info */}
        {!collapsed && admin && (
          <div className="mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
              {admin.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">{admin.name}</p>
              <p className="truncate text-xs text-muted capitalize">
                {admin.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex h-9 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium',
            'text-muted transition-colors hover:bg-danger/10 hover:text-danger',
            'disabled:opacity-50',
            collapsed ? 'justify-center' : '',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={cn(
          'absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center',
          'rounded-full border border-white/10 bg-surface text-muted',
          'hover:border-accent/40 hover:text-white transition-colors',
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}
