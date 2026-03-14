'use client';

import { useState } from 'react';
import { Save, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/cn';

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = ['Platform', 'Moderation', 'Notifications'] as const;
type Tab = (typeof TABS)[number];

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
        on ? 'bg-[#007AFF]' : 'bg-white/20',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform',
          on ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-8 border-b border-white/8 py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-[#AAAAAA]">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-64 rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-[#AAAAAA] outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-colors"
    />
  );
}

function NumberInput({ value, onChange, min, max, unit }: { value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 w-24 rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-colors"
      />
      {unit && <span className="text-xs text-[#AAAAAA]">{unit}</span>}
    </div>
  );
}

// ─── Initial state ────────────────────────────────────────────────────────────

const PLATFORM_DEFAULTS = {
  appName:       'SnapTik',
  maintenanceMode: false,
  maxVideoDuration: 180,
  maxFileSizeMb:  500,
  allowedRegions: 'US,UK,CA,AU',
};

const MODERATION_DEFAULTS = {
  aiConfidenceThreshold: 85,
  autoRemoveThreshold:   95,
  bannedWords: 'hate,abuse,violence',
  requireManualReview: true,
};

const NOTIFICATIONS_DEFAULTS = {
  alertEmail:    'alerts@snaptik.com',
  slackWebhook:  '',
  criticalAlerts: true,
  weeklyDigest:   true,
};

// ─── Save helper ──────────────────────────────────────────────────────────────

async function saveSettings(section: string, values: Record<string, unknown>) {
  return apiClient.put(`/settings/${section}`, values).catch(() => null);
}

// ─── Section components ───────────────────────────────────────────────────────

function PlatformSection() {
  const [vals, setVals] = useState(PLATFORM_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof typeof PLATFORM_DEFAULTS>(k: K, v: (typeof PLATFORM_DEFAULTS)[K]) =>
    setVals((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await saveSettings('platform', vals);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      {vals.maintenanceMode && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#FF9500]/30 bg-[#FF9500]/10 px-4 py-3 text-sm text-[#FF9500]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Maintenance mode is active — users will see a downtime message
        </div>
      )}
      <div className="rounded-xl border border-white/10 bg-[#121212] px-5">
        <Field label="App Name" hint="Displayed in emails and the mobile app">
          <Input value={vals.appName} onChange={(v) => set('appName', v)} />
        </Field>
        <Field label="Maintenance Mode" hint="Blocks all user logins and shows a maintenance page">
          <Toggle on={vals.maintenanceMode} onChange={(v) => set('maintenanceMode', v)} />
        </Field>
        <Field label="Max Video Duration" hint="Maximum video length users can upload">
          <NumberInput value={vals.maxVideoDuration} onChange={(v) => set('maxVideoDuration', v)} min={10} max={600} unit="seconds" />
        </Field>
        <Field label="Max File Size" hint="Maximum upload file size">
          <NumberInput value={vals.maxFileSizeMb} onChange={(v) => set('maxFileSizeMb', v)} min={50} max={2000} unit="MB" />
        </Field>
        <Field label="Allowed Regions" hint="ISO country codes (comma-separated)">
          <Input value={vals.allowedRegions} onChange={(v) => set('allowedRegions', v)} placeholder="US,UK,CA" />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#007AFF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#007AFF]/80 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Platform Settings'}
        </button>
      </div>
    </div>
  );
}

function ModerationSection() {
  const [vals, setVals] = useState(MODERATION_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof typeof MODERATION_DEFAULTS>(k: K, v: (typeof MODERATION_DEFAULTS)[K]) =>
    setVals((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await saveSettings('moderation', vals);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div className="rounded-xl border border-white/10 bg-[#121212] px-5">
        <Field label="AI Confidence Threshold" hint="Flag content when AI confidence exceeds this value">
          <NumberInput value={vals.aiConfidenceThreshold} onChange={(v) => set('aiConfidenceThreshold', v)} min={50} max={100} unit="%" />
        </Field>
        <Field label="Auto-Remove Threshold" hint="Automatically remove content above this confidence level">
          <NumberInput value={vals.autoRemoveThreshold} onChange={(v) => set('autoRemoveThreshold', v)} min={70} max={100} unit="%" />
        </Field>
        <Field label="Require Manual Review" hint="Content below auto-remove threshold still needs moderator approval">
          <Toggle on={vals.requireManualReview} onChange={(v) => set('requireManualReview', v)} />
        </Field>
        <Field label="Banned Keywords" hint="Comma-separated list — matched against captions and comments">
          <textarea
            value={vals.bannedWords}
            onChange={(e) => set('bannedWords', e.target.value)}
            rows={3}
            className="w-64 resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-colors"
          />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#007AFF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#007AFF]/80 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Moderation Settings'}
        </button>
      </div>
    </div>
  );
}

function NotificationsSection() {
  const [vals, setVals] = useState(NOTIFICATIONS_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof typeof NOTIFICATIONS_DEFAULTS>(k: K, v: (typeof NOTIFICATIONS_DEFAULTS)[K]) =>
    setVals((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await saveSettings('notifications', vals);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div className="rounded-xl border border-white/10 bg-[#121212] px-5">
        <Field label="Alert Email" hint="Receives critical platform alerts (content spikes, security events)">
          <Input value={vals.alertEmail} onChange={(v) => set('alertEmail', v)} type="email" />
        </Field>
        <Field label="Slack Webhook URL" hint="Leave blank to disable Slack notifications">
          <Input value={vals.slackWebhook} onChange={(v) => set('slackWebhook', v)} placeholder="https://hooks.slack.com/…" />
        </Field>
        <Field label="Critical Alerts" hint="Real-time alerts for bans, mass reports, and system errors">
          <Toggle on={vals.criticalAlerts} onChange={(v) => set('criticalAlerts', v)} />
        </Field>
        <Field label="Weekly Digest" hint="Email summary of platform health every Monday">
          <Toggle on={vals.weeklyDigest} onChange={(v) => set('weeklyDigest', v)} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#007AFF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#007AFF]/80 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
        <p className="mt-1 text-sm text-[#AAAAAA]">
          Platform configuration — changes take effect immediately
        </p>
      </div>

      {/* Tabs */}
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

      {/* Tab content */}
      {tab === 'Platform'      && <PlatformSection />}
      {tab === 'Moderation'    && <ModerationSection />}
      {tab === 'Notifications' && <NotificationsSection />}
    </div>
  );
}
