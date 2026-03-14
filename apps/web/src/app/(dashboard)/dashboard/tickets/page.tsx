import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Support Tickets' };

export default function SupportTicketsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-outfit text-2xl font-bold text-white">Support Tickets</h1>
      <p className="text-sm text-muted">Coming in Task 11</p>
    </div>
  );
}
