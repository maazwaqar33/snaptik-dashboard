import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Users' };

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-outfit text-2xl font-bold text-white">Users</h1>
      <p className="text-sm text-muted">Coming in Task 7</p>
    </div>
  );
}
