'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/cn';
import { PlatformForm, ModerationForm, NotificationsForm } from '@/components/settings/settings-form';

const TABS = ['Platform', 'Moderation', 'Notifications'] as const;
type Tab = (typeof TABS)[number];

export default function SettingsPage() {
  const admin = useAuthStore((s) => s.admin);
  const [tab, setTab] = useState<Tab>('Platform');

  if (admin?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-sm text-[#AAAAAA]">Settings are only accessible to Super Admins.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-[#AAAAAA]">Platform configuration — changes take effect immediately</p>
      </div>

      <div className="flex gap-1 rounded-lg border border-white/10 bg-black/40 p-1 self-start">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              tab === t ? 'bg-[#007AFF] text-white' : 'text-[#AAAAAA] hover:text-white',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Platform'      && <PlatformForm />}
      {tab === 'Moderation'    && <ModerationForm />}
      {tab === 'Notifications' && <NotificationsForm />}
    </div>
  );
}
