# SnapTik Admin Dashboard — Component Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all mock/seed data, fix the localhost inviteUrl bug, then refactor every file to ≤500 lines using OOP/DRY/KISS principles with a shared UI primitives layer.

**Architecture:** Approach C (Layer by Layer) — Layer 1 fixes production issues first; Layer 2 runs four parallel agents across independent modules (Users, Reports+Content, Analytics+Audit, Settings+Shared).

**Tech Stack:** Next.js 15 App Router, TypeScript, TanStack Table v8, TanStack Query v5, Axios, Tailwind CSS, Lucide React, Express 5, Mongoose, Docker on EC2.

---

## LAYER 1 — Production Fixes (do these first, in order)

---

### Task 1: Fix inviteUrl in backend controller

**Files:**
- Modify: `apps/api/src/controllers/admins.controller.ts:74`

**Step 1: Open the file and find line 74**

The current broken line is:
```ts
const inviteUrl = `http://localhost:3000/register?token=${inviteToken}`;
```

**Step 2: Replace it**

```ts
const frontendUrl = (process.env.FRONTEND_URL ?? 'https://admin.beautybilen.com').replace(/\/$/, '');
const inviteUrl   = `${frontendUrl}/register?token=${inviteToken}`;
```

**Step 3: Verify no other localhost:3000 refs remain in the API**

```bash
grep -rn "localhost:3000" apps/api/src/
```
Expected: zero results.

**Step 4: Commit**

```bash
git add apps/api/src/controllers/admins.controller.ts
git commit -m "fix: use FRONTEND_URL env var for invite links (was localhost:3000)"
```

---

### Task 2: Add FRONTEND_URL to EC2 and redeploy

**Files:**
- Modify: `/home/ubuntu/snaptik-admin.env` on EC2 `16.16.251.27`

**Step 1: SSH into the admin EC2**

```bash
ssh -i /tmp/admin-key.pem ubuntu@16.16.251.27
```

**Step 2: Add the env var**

```bash
echo "FRONTEND_URL=https://admin.beautybilen.com" >> /home/ubuntu/snaptik-admin.env
grep FRONTEND_URL /home/ubuntu/snaptik-admin.env   # verify it's there
```

**Step 3: Rebuild and restart the container**

```bash
cd /home/ubuntu
docker compose -f docker-compose.production.yml pull   # pull latest image
docker compose -f docker-compose.production.yml up -d --force-recreate snaptik-admin-api
docker logs snaptik-admin-api --tail 20
```

**Step 4: Smoke test the invite endpoint**

```bash
# Get a token first (run this locally, not on EC2)
TOKEN=$(node -e "
const https=require('https');
const b=JSON.stringify({email:'admin@snaptik.com',password:'Admin@1234!'});
const req=https.request({hostname:'admin-api.beautybilen.com',port:443,path:'/api/v1/auth/login',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>console.log(JSON.parse(d).accessToken));});
req.write(b);req.end();
")
echo "Token: $TOKEN"
```

Expected: inviteUrl in response contains `https://admin.beautybilen.com/register?token=...` not `localhost`.

---

### Task 3: Create `lib/constants.ts`

**Files:**
- Create: `apps/web/src/lib/constants.ts`

**Step 1: Create the file**

```ts
/**
 * App-wide constants — single source of truth for URLs and config strings.
 * NEVER hardcode beautybilen.com anywhere else in the frontend source.
 */
export const APP = {
  name:        'SnapTik Admin',
  frontendUrl: process.env.NEXT_PUBLIC_APP_URL  ?? 'https://admin.beautybilen.com',
  apiUrl:      process.env.NEXT_PUBLIC_API_URL  ?? 'https://admin-api.beautybilen.com/api/v1',
} as const;
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/constants.ts
git commit -m "feat: add lib/constants.ts — single source of truth for app URLs"
```

---

### Task 4: Create `lib/hooks/use-api.ts`

**Files:**
- Create: `apps/web/src/lib/hooks/use-api.ts`

This DRY hook wraps `useQuery` + `apiClient`. Every data-fetching page will use it instead of duplicating `useQuery({ queryKey, queryFn })` boilerplate.

**Step 1: Create the file**

```ts
'use client';

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { AxiosError } from 'axios';

interface UseApiResult<T> {
  data:    T | undefined;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

/**
 * Typed wrapper around useQuery + apiClient.
 * Provides consistent data/loading/error shape across all pages.
 *
 * @example
 *   const { data, loading, error } = useApi<User[]>('/users');
 */
export function useApi<T>(
  path:    string,
  options?: Omit<UseQueryOptions<T, AxiosError>, 'queryKey' | 'queryFn'>,
): UseApiResult<T> {
  const { data, isLoading, error, refetch } = useQuery<T, AxiosError>({
    queryKey: [path],
    queryFn:  async () => {
      const res = await apiClient.get<T>(path);
      return res.data;
    },
    ...options,
  });

  return {
    data,
    loading: isLoading,
    error:   error ? (error.response?.data as { error?: string })?.error ?? error.message : null,
    refetch,
  };
}
```

**Step 2: Create hooks directory if needed**

```bash
mkdir -p apps/web/src/lib/hooks
```

**Step 3: Commit**

```bash
git add apps/web/src/lib/hooks/use-api.ts
git commit -m "feat: add useApi hook — DRY typed wrapper around useQuery+apiClient"
```

---

### Task 5: Create shared UI primitives

**Files:**
- Create: `apps/web/src/components/ui/loading-spinner.tsx`
- Create: `apps/web/src/components/ui/error-banner.tsx`
- Create: `apps/web/src/components/ui/empty-state.tsx`

**Step 1: Create loading-spinner.tsx**

```tsx
interface LoadingSpinnerProps {
  size?:  'sm' | 'md' | 'lg';
  label?: string;
}

const SIZE = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' } as const;

export function LoadingSpinner({ size = 'md', label = 'Loading…' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <div className={`${SIZE[size]} animate-spin rounded-full border-2 border-white/10 border-t-coral`} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
```

**Step 2: Create error-banner.tsx**

```tsx
import { AlertTriangle } from 'lucide-react';

interface ErrorBannerProps {
  message:  string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-danger">
      <AlertTriangle className="h-8 w-8" />
      <p className="text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 rounded-lg border border-danger/30 px-4 py-1.5 text-xs hover:bg-danger/10 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
```

**Step 3: Create empty-state.tsx**

```tsx
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon:         LucideIcon;
  title:        string;
  description?: string;
  action?:      React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center text-muted">
      <Icon className="h-10 w-10 opacity-30" />
      <p className="font-medium text-white/60">{title}</p>
      {description && <p className="max-w-xs text-sm">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add apps/web/src/components/ui/
git commit -m "feat: add shared UI primitives — LoadingSpinner, ErrorBanner, EmptyState"
```

---

### Task 6: Remove seedUsers + SEED_USERS from users-table.tsx

**Files:**
- Modify: `apps/web/src/components/users/users-table.tsx`

**Step 1: Delete lines 33–71 (the mock seed block)**

Delete everything between and including these markers:
```ts
// ─── Mock seed data ──────────────────────────────────────────────────────────
...
const SEED_USERS = seedUsers(200);
```

**Step 2: Remove the SEED_USERS fallback in UsersTable**

Find:
```ts
const [data, setData] = useState<AppUser[]>(initialData ?? SEED_USERS);
```

Replace with:
```ts
const [data, setData] = useState<AppUser[]>(initialData ?? []);
```

**Step 3: Update the interface to make initialData required**

Find:
```ts
interface UsersTableProps {
  /** If provided, real API is used; otherwise falls back to seed data */
  initialData?: AppUser[];
}
```

Replace with:
```ts
interface UsersTableProps {
  initialData: AppUser[];
}
```

**Step 4: Verify build passes**

```bash
cd F:/snaptik-dashboard && pnpm --filter @snaptik/web build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
git add apps/web/src/components/users/users-table.tsx
git commit -m "fix: remove seedUsers mock data from users-table"
```

---

### Task 7: Remove seedReports + makeInitialColumns from reports-board.tsx

**Files:**
- Modify: `apps/web/src/components/reports/reports-board.tsx`

**Step 1: Delete lines 18–61 (the REPORT_TYPES, PRIORITIES, SUBJECTS, seedReports, makeInitialColumns block)**

Delete everything between and including:
```ts
// ─── Seed data ─────────────────────────────────────────────────────────────────
...
}
```
(up to and including `makeInitialColumns`)

**Step 2: Update the props interface**

Find:
```ts
interface ReportsBoardProps {
  initialColumns?: KanbanColumns;
}
```

Replace with:
```ts
interface ReportsBoardProps {
  initialColumns: KanbanColumns;
}
```

**Step 3: Remove the makeInitialColumns fallback**

Find:
```ts
const [columns, setColumns] = useState<KanbanColumns>(initialColumns ?? makeInitialColumns());
```

Replace with:
```ts
const [columns, setColumns] = useState<KanbanColumns>(initialColumns);
```

**Step 4: Commit**

```bash
git add apps/web/src/components/reports/reports-board.tsx
git commit -m "fix: remove seedReports mock data from reports-board"
```

---

### Task 8: Remove MOCK_MODERATORS — replace with real API call

**Files:**
- Modify: `apps/web/src/types/reports.ts`
- Modify: `apps/web/src/components/reports/report-card.tsx`

**Step 1: Delete MOCK_MODERATORS from types/reports.ts**

Find and delete these lines:
```ts
/** Mock moderator list for assignment dropdown */
export const MOCK_MODERATORS = [
  { _id: 'mod-1', name: 'Alex Chen' },
  { _id: 'mod-2', name: 'Sam Rivera' },
  { _id: 'mod-3', name: 'Jordan Kim' },
  { _id: 'mod-4', name: 'Taylor Smith' },
];
```

**Step 2: Update report-card.tsx to use real API**

Remove the import of `MOCK_MODERATORS`. Add a `useApi` call to fetch the real moderator list:

```tsx
import { useApi } from '@/lib/hooks/use-api';

// Inside ReportCard component, add:
const { data: moderatorsData } = useApi<{ admins: Array<{ _id: string; name: string; role: string }> }>(
  '/admins',
  { staleTime: 5 * 60 * 1000 }, // cache 5 min — list rarely changes
);

const moderators = (moderatorsData?.admins ?? []).filter(
  (a) => a.role === 'moderator' || a.role === 'super_admin',
);
```

Replace the existing `{MOCK_MODERATORS.map(...)}` with `{moderators.map(...)}`.

**Step 3: Commit**

```bash
git add apps/web/src/types/reports.ts apps/web/src/components/reports/report-card.tsx
git commit -m "fix: replace MOCK_MODERATORS with real GET /admins call in report-card"
```

---

### Task 9: Remove seedGrowth / seedRetention from analytics/page.tsx

**Files:**
- Modify: `apps/web/src/app/(dashboard)/dashboard/analytics/page.tsx`

**Step 1: Delete lines 33–110 (makeDayLabels, seedGrowth, seedRetention, funnelData, platformData)**

These are the fake data generator functions.

**Step 2: Replace with real API data**

The analytics page already imports `apiClient`. Add a `useApi` call inside `AnalyticsContent`:

```tsx
import { useApi } from '@/lib/hooks/use-api';

// In AnalyticsContent, replace the useMemo(seedGrowth) calls:
const { data: analyticsData, loading } = useApi<{
  growthData:    GrowthPoint[];
  retentionData: RetentionPoint[];
  funnelData:    FunnelStage[];
  platformData:  PlatformSlice[];
}>(`/analytics/overview?days=${range}`);

const growthData    = analyticsData?.growthData    ?? [];
const retentionData = analyticsData?.retentionData ?? [];
```

**Step 3: Show LoadingSpinner while fetching**

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

if (loading) return <LoadingSpinner label="Loading analytics…" />;
```

**Step 4: Commit**

```bash
git add apps/web/src/app/(dashboard)/dashboard/analytics/page.tsx
git commit -m "fix: replace seedGrowth/seedRetention with real GET /analytics/overview"
```

---

## LAYER 2 — Component Refactor (run as parallel agents)

> Agents A, B, C, D work on completely independent files.
> Deploy in parallel — no shared state between them.

---

## AGENT A — Users Module

---

### Task 10: Extract user-avatar.tsx

**Files:**
- Create: `apps/web/src/components/users/user-avatar.tsx`

```tsx
import { cn } from '@/lib/cn';
import type { UserStatus } from '@/types/platform';

const STATUS_RING: Record<UserStatus, string> = {
  active:    'ring-success/60',
  banned:    'ring-danger/60',
  suspended: 'ring-warning/60',
  pending:   'ring-white/20',
};

interface UserAvatarProps {
  displayName: string;
  avatarUrl?:  string;
  status:      UserStatus;
  size?:       'sm' | 'md';
}

export function UserAvatar({ displayName, avatarUrl, status, size = 'md' }: UserAvatarProps) {
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-xs';

  return (
    <div className={cn('shrink-0 rounded-full ring-2', sizeClass, STATUS_RING[status])}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName} className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10 font-semibold text-white">
          {initials}
        </div>
      )}
    </div>
  );
}
```

**Step: Commit**

```bash
git add apps/web/src/components/users/user-avatar.tsx
git commit -m "refactor: extract UserAvatar component from users-table"
```

---

### Task 11: Extract action-menu.tsx

**Files:**
- Create: `apps/web/src/components/users/action-menu.tsx`
- Modify: `apps/web/src/components/users/users-table.tsx` (remove inline ActionMenu)

**Step 1:** Move the entire `ActionMenu` function (lines 92–159) from `users-table.tsx` into the new file. Add `'use client';` at the top and the necessary imports.

**Step 2:** In `users-table.tsx`, replace the inline `ActionMenu` with an import:
```ts
import { ActionMenu } from './action-menu';
```

**Step 3: Commit**
```bash
git add apps/web/src/components/users/action-menu.tsx apps/web/src/components/users/users-table.tsx
git commit -m "refactor: extract ActionMenu into own file"
```

---

### Task 12: Extract columns.tsx

**Files:**
- Create: `apps/web/src/components/users/columns.tsx`
- Modify: `apps/web/src/components/users/users-table.tsx`

**Step 1:** Move the `createColumnHelper`, `colHelper`, and the columns array definition into `columns.tsx`. The columns array depends on `fmtNum`, `STATUS_STYLES`, `UserAvatar`, `ActionMenu` — import them all.

**Step 2:** Export a `createColumns` function:
```ts
export function createColumns(
  onAction: (action: UserAction, user: AppUser) => void,
  canBan: boolean,
) {
  return [/* all column definitions */];
}
```

**Step 3:** In `users-table.tsx`, replace inline column creation with:
```ts
import { createColumns } from './columns';
const columns = useMemo(() => createColumns(openModal, canBan), [openModal, canBan]);
```

**Step 4: Verify `users-table.tsx` is now ≤200 lines**
```bash
wc -l apps/web/src/components/users/users-table.tsx
```
Expected: ≤200

**Step 5: Commit**
```bash
git add apps/web/src/components/users/
git commit -m "refactor: extract column definitions into columns.tsx (users-table: 587→<200 lines)"
```

---

## AGENT B — Reports + Content Modules

---

### Task 13: Extract kanban-column.tsx

**Files:**
- Create: `apps/web/src/components/reports/kanban-column.tsx`

Extract the per-column render block from `reports-board.tsx` into a dedicated component that owns its own drag-over highlight state.

```tsx
'use client';

import { cn } from '@/lib/cn';
import { ReportCard } from './report-card';
import type { Report, ReportStatus, KanbanColumns } from '@/types/reports';
import type { LucideIcon } from 'lucide-react';

interface KanbanColumnProps {
  colKey:      keyof KanbanColumns;
  label:       string;
  icon:        LucideIcon;
  headerColor: string;
  reports:     Report[];
  isOver:      boolean;
  draggingId:  string | null;
  onDragStart: (e: React.DragEvent, id: string, col: keyof KanbanColumns) => void;
  onDragOver:  (e: React.DragEvent, col: keyof KanbanColumns) => void;
  onDragLeave: () => void;
  onDrop:      (e: React.DragEvent, col: keyof KanbanColumns) => void;
  onDragEnd:   () => void;
  onAssign:    (reportId: string, col: keyof KanbanColumns, moderatorId: string) => void;
}

export function KanbanColumn({ colKey, label, icon: Icon, headerColor, reports, isOver, draggingId, onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd, onAssign }: KanbanColumnProps) {
  return (
    <div
      className={cn('flex min-h-[200px] flex-col rounded-2xl border p-3 transition-colors', isOver ? 'border-coral/40 bg-coral/5' : 'border-white/10 bg-surface')}
      onDragOver={(e) => onDragOver(e, colKey)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, colKey)}
    >
      <div className={cn('mb-3 flex items-center gap-2 text-sm font-semibold', headerColor)}>
        <Icon className="h-4 w-4" />
        {label}
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">{reports.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {reports.map((report) => (
          <ReportCard
            key={report._id}
            report={report}
            isDragging={draggingId === report._id}
            onDragStart={(e) => onDragStart(e, report._id, colKey)}
            onDragEnd={onDragEnd}
            onAssign={(modId) => onAssign(report._id, colKey, modId)}
          />
        ))}
      </div>
    </div>
  );
}
```

**Step: Commit**
```bash
git add apps/web/src/components/reports/kanban-column.tsx
git commit -m "refactor: extract KanbanColumn component"
```

---

### Task 14: Slim reports-board.tsx to orchestrator only

**Files:**
- Modify: `apps/web/src/components/reports/reports-board.tsx`

**Step 1:** Replace the full column render JSX with `<KanbanColumn>` usage. The board now only owns drag state and column config — no rendering logic.

**Step 2:** Verify line count:
```bash
wc -l apps/web/src/components/reports/reports-board.tsx
```
Expected: ≤130

**Step 3: Commit**
```bash
git add apps/web/src/components/reports/reports-board.tsx
git commit -m "refactor: slim reports-board to orchestrator (317→<130 lines)"
```

---

### Task 15: Extract moderation-item.tsx and ai-flags-bar.tsx

**Files:**
- Create: `apps/web/src/components/content/ai-flags-bar.tsx`
- Create: `apps/web/src/components/content/moderation-item.tsx`
- Modify: `apps/web/src/components/content/moderation-queue.tsx`

**Step 1: Create ai-flags-bar.tsx**

```tsx
interface AiFlagsBarProps {
  flags: {
    nsfw:       number;
    violence:   number;
    spam:       number;
    hateSpeech: number;
  };
}

const FLAG_LABELS: Record<string, string> = {
  nsfw: 'NSFW', violence: 'Violence', spam: 'Spam', hateSpeech: 'Hate',
};
const FLAG_COLORS: Record<string, string> = {
  nsfw: 'bg-danger', violence: 'bg-orange-500', spam: 'bg-warning', hateSpeech: 'bg-red-800',
};

export function AiFlagsBar({ flags }: AiFlagsBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(flags).map(([key, val]) => (
        <div key={key} className="flex items-center gap-1.5 text-xs text-muted">
          <div className="h-1.5 w-16 rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${FLAG_COLORS[key] ?? 'bg-white/20'}`}
              style={{ width: `${Math.round(val * 100)}%` }}
            />
          </div>
          <span>{FLAG_LABELS[key] ?? key} {Math.round(val * 100)}%</span>
        </div>
      ))}
    </div>
  );
}
```

**Step 2:** Extract each content row into `moderation-item.tsx` receiving a single `FlaggedVideo` + action callbacks as props.

**Step 3:** Slim `moderation-queue.tsx` to filter state + list render using `<ModerationItem>`.

**Step 4:** Verify line count:
```bash
wc -l apps/web/src/components/content/moderation-queue.tsx
```
Expected: ≤140

**Step 5: Commit**
```bash
git add apps/web/src/components/content/
git commit -m "refactor: extract AiFlagsBar + ModerationItem (moderation-queue: 433→<140 lines)"
```

---

## AGENT C — Analytics + Audit Modules

---

### Task 16: Extract kpi-card.tsx and range-selector.tsx

**Files:**
- Create: `apps/web/src/components/analytics/kpi-card.tsx`
- Create: `apps/web/src/components/analytics/range-selector.tsx`

**Step 1: Create kpi-card.tsx**

```tsx
import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  icon:    LucideIcon;
  label:   string;
  value:   string | number;
  trend?:  number;   // positive = up, negative = down
  color?:  string;
}

export function KpiCard({ icon: Icon, label, value, trend, color = 'text-coral' }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        </div>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      {trend !== undefined && (
        <p className={cn('mt-2 text-xs', trend >= 0 ? 'text-success' : 'text-danger')}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last period
        </p>
      )}
    </div>
  );
}
```

**Step 2: Create range-selector.tsx**

```tsx
const RANGES = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const;

export type RangeDays = typeof RANGES[number]['days'];

interface RangeSelectorProps {
  value:    RangeDays;
  onChange: (days: RangeDays) => void;
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="flex gap-1 rounded-xl border border-white/10 bg-surface p-1">
      {RANGES.map((r) => (
        <button
          key={r.days}
          onClick={() => onChange(r.days)}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
            value === r.days ? 'bg-coral text-white' : 'text-muted hover:text-white'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
```

**Step 3:** Update `analytics/page.tsx` to import these instead of inlining them.

**Step 4: Commit**
```bash
git add apps/web/src/components/analytics/
git commit -m "refactor: extract KpiCard + RangeSelector from analytics page"
```

---

### Task 17: Extract audit-filters.tsx and audit-log-table.tsx

**Files:**
- Create: `apps/web/src/components/audit/audit-filters.tsx`
- Create: `apps/web/src/components/audit/audit-log-table.tsx`
- Modify: `apps/web/src/app/(dashboard)/dashboard/audit/page.tsx`

**Step 1:** Move the filter bar JSX (search + action select + date pickers) into `audit-filters.tsx` receiving filter state + setters as props.

**Step 2:** Move the table JSX into `audit-log-table.tsx` receiving `logs` array as prop.

**Step 3:** `audit/page.tsx` becomes the orchestrator: fetches via `useApi`, owns filter state, renders `<AuditFilters>` + `<AuditLogTable>`.

**Step 4:** Verify:
```bash
wc -l apps/web/src/app/\(dashboard\)/dashboard/audit/page.tsx
```
Expected: ≤100

**Step 5: Commit**
```bash
git add apps/web/src/components/audit/ apps/web/src/app/\(dashboard\)/dashboard/audit/page.tsx
git commit -m "refactor: extract AuditFilters + AuditLogTable (audit page: 260→<100 lines)"
```

---

## AGENT D — Settings + Shared Cleanup

---

### Task 18: Extract settings-section.tsx and settings-form.tsx

**Files:**
- Create: `apps/web/src/components/settings/settings-section.tsx`
- Create: `apps/web/src/components/settings/settings-form.tsx`
- Modify: `apps/web/src/app/(dashboard)/dashboard/settings/page.tsx`

**Step 1: Create settings-section.tsx**

```tsx
interface SettingsSectionProps {
  title:       string;
  description: string;
  children:    React.ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-6">
      <div className="mb-4 border-b border-white/10 pb-4">
        <h2 className="font-semibold text-white">{title}</h2>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}
```

**Step 2:** Extract the per-section form JSX into `settings-form.tsx`, receiving section key + current values + `onSave` callback.

**Step 3:** `settings/page.tsx` becomes orchestrator: fetches settings via `useApi`, maps sections to `<SettingsSection><SettingsForm /></SettingsSection>`.

**Step 4:** Verify:
```bash
wc -l apps/web/src/app/\(dashboard\)/dashboard/settings/page.tsx
```
Expected: ≤120

**Step 5: Commit**
```bash
git add apps/web/src/components/settings/ apps/web/src/app/\(dashboard\)/dashboard/settings/page.tsx
git commit -m "refactor: extract SettingsSection + SettingsForm (settings: 325→<120 lines)"
```

---

### Task 19: Replace all inline loading/error/empty with shared primitives

**Files to update** (search and replace pattern):

```bash
# Find all files still using inline loading patterns
grep -rn "animate-spin\|Something went wrong\|No results" apps/web/src/components/ apps/web/src/app/ --include="*.tsx" -l
```

For each file found:
1. Import `LoadingSpinner` / `ErrorBanner` / `EmptyState` from `@/components/ui/`
2. Replace inline JSX with the shared component

**Step: Commit**
```bash
git add -A
git commit -m "refactor: replace all inline loading/error/empty with shared UI primitives"
```

---

### Task 20: Final verification + push

**Step 1: TypeScript build check**

```bash
cd F:/snaptik-dashboard && pnpm --filter @snaptik/web build 2>&1 | tail -30
```
Expected: `✓ Compiled successfully`

**Step 2: Line count audit — no file over 500 lines**

```bash
find apps/web/src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -rn | head -15
```
Expected: largest file ≤500 lines.

**Step 3: No mock data remaining**

```bash
grep -rn "seed\|MOCK_\|SEED_\|localhost:3000" apps/web/src/ --include="*.tsx" --include="*.ts"
```
Expected: zero results.

**Step 4: Push to trigger Vercel deploy**

```bash
cd F:/snaptik-dashboard && git push origin main
```

**Step 5: Verify production**

- `https://admin.beautybilen.com/login` — login works
- `https://admin.beautybilen.com/dashboard` — real stats load
- `https://admin.beautybilen.com/dashboard/users` — real users load, no seed data
- `https://admin.beautybilen.com/dashboard/reports` — real Kanban loads
- Invite an admin → check `inviteUrl` contains `https://admin.beautybilen.com/register?token=...`

---

## Success Checklist

- [ ] `inviteUrl` returns `https://admin.beautybilen.com/register?token=...`
- [ ] Zero `seedUsers / seedReports / seedGrowth / seedRetention / MOCK_MODERATORS` in frontend
- [ ] Every `.tsx` / `.ts` file ≤ 500 lines
- [ ] `lib/constants.ts` is the only place `beautybilen.com` appears in frontend
- [ ] `useApi` hook used by analytics, audit, and reports-board pages
- [ ] Shared UI primitives used for all loading/error/empty states
- [ ] `pnpm build` passes — zero TypeScript errors
- [ ] All 6 dashboard sections show real data in production
