import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Live Monitor' };

export default function LiveMonitorPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-outfit text-2xl font-bold text-white">Live Monitor</h1>
      <p className="text-sm text-muted">Coming in Task 12</p>
    </div>
  );
}
