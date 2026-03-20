'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import { ModerationQueue } from '@/components/content/moderation-queue';
import { useAbility } from '@/hooks/use-ability';
import { apiClient } from '@/lib/api';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBanner } from '@/components/ui/error-banner';
import type { FlaggedVideo } from '@/types/moderation';

async function fetchQueue(): Promise<FlaggedVideo[]> {
  const { data } = await apiClient.get<{ items: FlaggedVideo[] }>('/content/moderation-queue');
  return data.items;
}

export default function ContentModerationPage() {
  const ability = useAbility();

  if (!ability.can('read', 'content')) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Access restricted"
        description="You don't have permission to access content moderation."
      />
    );
  }

  return <ContentPageInner />;
}

function ContentPageInner() {
  const { data, isError } = useQuery({
    queryKey: ['moderation-queue'],
    queryFn: fetchQueue,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-outfit text-2xl font-bold text-white">Content Moderation</h1>
          <p className="mt-1 text-sm text-muted">
            Review flagged videos — use{' '}
            <kbd className="rounded border border-white/20 px-1 py-0.5 text-xs">A</kbd>{' '}
            <kbd className="rounded border border-white/20 px-1 py-0.5 text-xs">R</kbd>{' '}
            <kbd className="rounded border border-white/20 px-1 py-0.5 text-xs">D</kbd>{' '}
            for Approve / Remove / Defer
          </p>
        </div>
      </div>

      {isError && (
        <ErrorBanner message="Could not reach API — showing seed data for development" />
      )}

      <ModerationQueue initialItems={data ?? undefined} />
    </div>
  );
}
