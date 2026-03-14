import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Content Moderation' };

export default function ContentModerationPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-outfit text-2xl font-bold text-white">Content Moderation</h1>
      <p className="text-sm text-muted">Coming in Task 8</p>
    </div>
  );
}
