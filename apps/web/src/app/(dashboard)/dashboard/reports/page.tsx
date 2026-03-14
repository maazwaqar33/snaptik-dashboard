'use client';

import { useQuery } from '@tanstack/react-query';
import { Flag } from 'lucide-react';
import { ReportsBoard } from '@/components/reports/reports-board';
import { useAbility } from '@/hooks/use-ability';
import { apiClient } from '@/lib/api';
import type { KanbanColumns } from '@/types/reports';

async function fetchReports(): Promise<KanbanColumns> {
  const { data } = await apiClient.get<KanbanColumns>('/reports/kanban');
  return data;
}

export default function ReportsPage() {
  const ability = useAbility();

  if (!ability.can('read', 'reports')) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Flag className="h-10 w-10 text-muted/40" />
        <p className="text-sm text-muted">
          You don&apos;t have permission to view reports.
        </p>
      </div>
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
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-warning">
          Could not reach API &mdash; showing seed data for development
        </div>
      )}

      <ReportsBoard initialColumns={data ?? undefined} />
    </div>
  );
}
