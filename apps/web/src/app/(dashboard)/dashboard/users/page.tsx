'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, UserX, ShieldCheck } from 'lucide-react';
import { UsersTable } from '@/components/users/users-table';
import { useAbility } from '@/hooks/use-ability';
import { apiClient } from '@/lib/api';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBanner } from '@/components/ui/error-banner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { AppUser } from '@/types/platform';

// The mock returns { users: [...], data: [...] } — support both
interface UsersResponse {
  users?: AppUser[];
  data?:  AppUser[];
  total:  number;
}

async function fetchUsers(): Promise<UsersResponse> {
  const { data } = await apiClient.get<UsersResponse>('/users?limit=200&page=1');
  return data;
}

export default function UsersPage() {
  const ability = useAbility();

  if (!ability.can('read', 'users')) {
    return (
      <EmptyState
        icon={UserX}
        title="Access restricted"
        description="You don't have permission to view user data."
      />
    );
  }

  return <UsersPageContent />;
}

function UsersPageContent() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const users: AppUser[] = data?.users ?? data?.data ?? [];

  if (isLoading) return <LoadingSpinner label="Loading users…" />;

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
        {users.length > 0 && (
          <div className="hidden items-center gap-4 sm:flex">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Users className="h-3.5 w-3.5" />
              <span>{users.length.toLocaleString()} total</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-danger">
              <UserX className="h-3.5 w-3.5" />
              <span>{users.filter((u) => u.status === 'banned').length} banned</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-success">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{users.filter((u) => u.isVerified).length} verified</span>
            </div>
          </div>
        )}
      </div>

      {isError && (
        <ErrorBanner message="Could not reach API — user list may be incomplete" />
      )}

      <UsersTable initialData={users} />
    </div>
  );
}
