'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, UserX, ShieldCheck } from 'lucide-react';
import { UsersTable } from '@/components/users/users-table';
import { useAbility } from '@/hooks/use-ability';
import { apiClient } from '@/lib/api';
import type { PaginatedUsers } from '@/types/platform';

async function fetchUsers(): Promise<PaginatedUsers> {
  const { data } = await apiClient.get<PaginatedUsers>('/users?limit=200&page=1');
  return data;
}

export default function UsersPage() {
  const ability = useAbility();

  // RBAC guard — if admin can't read users, show nothing
  if (!ability.can('read', 'users')) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <UserX className="h-10 w-10 text-muted/40" />
        <p className="text-sm text-muted">You don&apos;t have permission to view user data.</p>
      </div>
    );
  }

  return <UsersPageContent />;
}

function UsersPageContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    retry: 1,
    // Don't refetch automatically — user data changes on action, not on a timer
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-muted">
            Search, filter, and manage all SnapTik platform users
          </p>
        </div>
        {/* Quick stats */}
        {data && (
          <div className="hidden items-center gap-4 sm:flex">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Users className="h-3.5 w-3.5" />
              <span>{data.users.length.toLocaleString()} total</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-danger">
              <UserX className="h-3.5 w-3.5" />
              <span>{data.users.filter((u) => u.status === 'banned').length} banned</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-success">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{data.users.filter((u) => u.isVerified).length} verified</span>
            </div>
          </div>
        )}
      </div>

      {isError && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
          Could not reach API — showing seed data for development
        </div>
      )}

      {/* Table — uses seed data when API is unavailable */}
      <UsersTable initialData={data?.users ?? []} />
    </div>
  );
}
