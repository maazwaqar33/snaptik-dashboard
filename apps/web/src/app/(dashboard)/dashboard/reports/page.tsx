import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reports' };

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-outfit text-2xl font-bold text-white">Reports</h1>
      <p className="text-sm text-muted">Coming in Task 9</p>
    </div>
  );
}
