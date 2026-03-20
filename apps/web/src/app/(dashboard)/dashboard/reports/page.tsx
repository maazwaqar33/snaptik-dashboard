'use client';

import { useQuery } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import { ReportsBoard } from '@/components/reports/reports-board';
import { useAbility } from '@/hooks/use-ability';
import { apiClient } from '@/lib/api';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBanner } from '@/components/ui/error-banner';
import type { KanbanColumns } from '@/types/reports';

async function fetchReports(): Promise<KanbanColumns> {
  const { data } = await apiClient.get<KanbanColumns>('/reports/kanban');
  return data;
}

export default function ReportsPage() {
  const ability = useAbility();

  if (!ability.can('read', 'reports')) {
    return (
      <EmptyState
        icon={Flag}
        title="Access restricted"
        description="You don't have permission to view reports."
      />
    );
  }

  return <ReportsPageContent />;
}

function ReportsPageContent() {
  const { data, isError } = useQuery({
    queryKey: ['reports-kanban'],
    queryFn: fetchReports,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-outfit text-2xl font-bold text-white">Reports</h1>
        <p className="mt-1 text-sm text-muted">
          Drag cards between columns to update status &mdash; assign moderators from each card
        </p>
      </div>

      {isError && (
        <ErrorBanner message="Could not reach API — showing seed data for development" />
      )}

      <ReportsBoard initialColumns={data ?? { pending: [], in_review: [], resolved: [] }} />
    </div>
  );
}
