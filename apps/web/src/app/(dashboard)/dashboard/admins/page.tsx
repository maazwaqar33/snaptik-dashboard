'use client';

import { useState } from 'react';
import { UserCog, UserPlus, X, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import { useApi } from '@/lib/hooks/use-api';
import { cn } from '@/lib/cn';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBanner } from '@/components/ui/error-banner';
import { ROLE_PERMISSIONS, ROLE_LABELS, type AdminRole, type AdminUser } from '@snaptik/types';

const ROLE_BADGE: Record<AdminRole, string> = {
  super_admin: 'bg-[#007AFF]/20 text-[#007AFF]',
  moderator:   'bg-[#FF9500]/15 text-[#FF9500]',
  support:     'bg-[#34C759]/15 text-[#34C759]',
  analyst:     'bg-white/10    text-[#AAAAAA]',
  auditor:     'bg-white/10    text-[#AAAAAA]',
};

const ROLES: AdminRole[] = ['super_admin', 'moderator', 'support', 'analyst', 'auditor'];

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState('');
  const [name,  setName]  = useState('');
  const [role,  setRole]  = useState<AdminRole>('moderator');
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) { setError('Email and name are required'); return; }
    setBusy(true); setError('');
    try {
      await apiClient.post('/admins/invite', { email, name, role }).catch(() => null);
      onInvited();
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-outfit text-lg font-bold text-white">Invite Admin</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[#AAAAAA] hover:bg-white/5 hover:text-white transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: 'Full Name', value: name, set: setName, type: 'text',  placeholder: 'Jane Smith'          },
            { label: 'Email',     value: email, set: setEmail, type: 'email', placeholder: 'jane@snaptik.com' },
          ].map(({ label, value, set, type, placeholder }) => (
            <div key={label}>
              <label className="mb-1.5 block text-xs font-semibold text-[#AAAAAA]">{label}</label>
              <input type={type} value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-[#AAAAAA] outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 transition-colors" />
            </div>
          ))}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#AAAAAA]">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)}
              className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-[#007AFF] transition-colors">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
          <button type="submit" disabled={busy}
            className="mt-1 rounded-lg bg-[#007AFF] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#007AFF]/80 disabled:opacity-50">
            {busy ? 'Sending invite…' : 'Send Invite'}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Role permissions matrix ──────────────────────────────────────────────────

const ALL_PERMS = Array.from(
  new Set(Object.values(ROLE_PERMISSIONS).flat().filter((p) => p !== '*').sort()),
);

function PermissionsMatrix() {
  return (
    <div>
      <h2 className="font-outfit text-base font-semibold text-white">Role Permissions Matrix</h2>
      <p className="mt-0.5 mb-4 text-xs text-[#AAAAAA]">What each role can do — custom permissions override these per-admin</p>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="px-4 py-3 text-xs font-semibold text-[#AAAAAA] w-44">Permission</th>
              {ROLES.map((r) => (
                <th key={r} className="px-3 py-3 text-center text-xs font-semibold text-[#AAAAAA]">{ROLE_LABELS[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMS.map((perm) => (
              <tr key={perm} className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-2.5 font-mono text-[11px] text-[#AAAAAA]">{perm}</td>
                {ROLES.map((r) => {
                  const perms = ROLE_PERMISSIONS[r];
                  const has   = perms.includes('*') || perms.includes(perm);
                  return (
                    <td key={r} className="px-3 py-2.5 text-center">
                      {has ? <Check className="mx-auto h-3.5 w-3.5 text-[#34C759]" /> : <span className="text-white/10">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminsPage() {
  const currentAdmin = useAuthStore((s) => s.admin);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: adminsData, loading, error, refetch } = useApi<{ admins: AdminUser[] }>('/admins');
  const admins = adminsData?.admins ?? [];

  if (currentAdmin?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <UserCog className="h-10 w-10 text-[#AAAAAA]/40" />
        <p className="text-sm text-[#AAAAAA]">Admin management is only accessible to Super Admins.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner label="Loading admins…" />;
  if (error)   return <ErrorBanner message={error} onRetry={refetch} />;

  const toggleActive = async (id: string) => {
    await apiClient.patch(`/admins/${id}/toggle-active`).catch(() => null);
    refetch();
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-outfit text-2xl font-bold text-white">Admin Management</h1>
            <p className="mt-1 text-sm text-[#AAAAAA]">
              {admins.length} admins &mdash; {admins.filter((a) => a.isActive).length} active
            </p>
          </div>
          <button onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#007AFF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#007AFF]/80">
            <UserPlus className="h-4 w-4" />Invite Admin
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {admins.map((admin) => (
            <div key={admin._id}
              className={cn('flex items-center gap-4 rounded-xl border px-5 py-4 transition-colors',
                admin.isActive ? 'border-white/10 bg-[#121212]' : 'border-white/5 bg-white/[0.02]')}>
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                admin.isActive ? 'bg-[#007AFF]/20 text-[#007AFF]' : 'bg-white/10 text-[#AAAAAA]')}>
                {admin.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-semibold', admin.isActive ? 'text-white' : 'text-[#AAAAAA]')}>{admin.name}</p>
                  <span className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold', ROLE_BADGE[admin.role])}>{ROLE_LABELS[admin.role]}</span>
                  {!admin.isActive && <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-[#AAAAAA]">Inactive</span>}
                </div>
                <p className="text-xs text-[#AAAAAA]">{admin.email}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-[#AAAAAA]">Last login</p>
                <p className="text-xs text-white/60">
                  {admin.lastLoginAt ? formatDistanceToNow(new Date(admin.lastLoginAt), { addSuffix: true }) : 'Never'}
                </p>
              </div>
              {admin._id !== currentAdmin?._id && (
                <button onClick={() => toggleActive(admin._id)} title={admin.isActive ? 'Deactivate' : 'Activate'}
                  className="shrink-0 rounded-lg p-1.5 hover:bg-white/5 transition-colors">
                  {admin.isActive
                    ? <ToggleRight className="h-5 w-5 text-[#34C759]" />
                    : <ToggleLeft  className="h-5 w-5 text-[#AAAAAA]" />}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <PermissionsMatrix />

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onInvited={() => { setInviteOpen(false); refetch(); }}
        />
      )}
    </div>
  );
}
