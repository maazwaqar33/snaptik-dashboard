import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Analytics' };

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-outfit text-2xl font-bold text-white">Analytics</h1>
      <p className="text-sm text-muted">Coming in Task 10</p>
    </div>
  );
}
