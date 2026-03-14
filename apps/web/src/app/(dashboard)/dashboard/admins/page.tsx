import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Management' };

export default function AdminManagementPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-outfit text-2xl font-bold text-white">Admin Management</h1>
      <p className="text-sm text-muted">Coming in Task 12</p>
    </div>
  );
}
