import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-outfit text-2xl font-bold text-white">Settings</h1>
      <p className="text-sm text-muted">Coming in Task 12</p>
    </div>
  );
}
