# SnapTik Admin Dashboard — Component Refactor Design
**Date:** 2026-03-20
**Approach:** C — Layer by Layer
**Status:** Approved

---

## Problem Statement

The dashboard has three categories of technical debt:

1. **Live production bugs** — `inviteUrl` returns `http://localhost:3000/...`, breaking admin invites
2. **Mock/seed data** — `seedUsers()`, `seedReports()`, `seedGrowth()`, `seedRetention()`, `MOCK_MODERATORS` generate fake data instead of hitting the real API
3. **Monolithic files** — `users-table.tsx` is 587 lines, several others exceed 300+ lines, violating the 200–500 line component limit and making DRY/KISS/OOP principles impossible to enforce

---

## Two-Phase Plan

### Phase 1 — Clean Codebase (this plan)
Fix production bugs + remove all mocks + refactor into components.

### Phase 2 — UI/UX Enhancement (separate plan)
Visual redesign, advanced features, and UX improvements on top of the clean codebase.

---

## Phase 1 · Layer 1 — Production Fixes

**Goal:** Production is fully healthy. No hardcoded URLs, no fake data anywhere.

### Backend fix — `FRONTEND_URL` env var
- **File:** `apps/api/src/controllers/admins.controller.ts:74`
- **Change:** `const inviteUrl = \`${process.env.FRONTEND_URL ?? 'https://admin.beautybilen.com'}/register?token=\${inviteToken}\``
- **EC2:** Add `FRONTEND_URL=https://admin.beautybilen.com` to `/home/ubuntu/snaptik-admin.env`, restart container

### Frontend — remove all mock/seed data
| Mock | Location | Replacement |
|------|----------|-------------|
| `seedUsers()` | `users-table.tsx:43` | Delete — `initialData` comes from real API already |
| `seedReports()` | `reports-board.tsx:29` | Delete — `initialColumns` comes from real API already |
| `seedGrowth()` / `seedRetention()` | `analytics/page.tsx:39–74` | Replace with real data from `GET /analytics/overview` |
| `MOCK_MODERATORS` | `types/reports.ts:76` + `report-card.tsx:12` | Replace with `GET /admins` query in report-card |

### Shared constants — `lib/constants.ts` (new)
Centralise all app-wide strings. No hardcoded URLs anywhere in the codebase.
```ts
export const APP = {
  name:        'SnapTik Admin',
  frontendUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://admin.beautybilen.com',
  apiUrl:      process.env.NEXT_PUBLIC_API_URL  ?? 'https://admin-api.beautybilen.com/api/v1',
} as const;
```

---

## Phase 1 · Layer 2 — Component Refactor

**Goal:** Every file ≤ 500 lines. No component does more than one job. DRY shared primitives. Parallel agent execution across 4 independent modules.

### Shared UI Primitives (new — `components/ui/`)
These replace inline duplicated loading/error/empty patterns found across 8+ files:

| Component | Props | Replaces |
|-----------|-------|---------|
| `loading-spinner.tsx` | `size`, `label` | 6 different inline spinner implementations |
| `error-banner.tsx` | `message`, `onRetry` | Inline "Something went wrong" divs |
| `empty-state.tsx` | `icon`, `title`, `description`, `action` | Inline empty state JSX |

### Custom Hook — `lib/hooks/use-api.ts` (new)
Typed wrapper around `useQuery` + `apiClient`. Enforces consistent error/loading/data shape across all pages. Eliminates the repeated `apiClient.get<T>(...)` + `useQuery({ queryKey, queryFn })` boilerplate in every page.

```ts
// Usage at call site — clean, typed, DRY:
const { data, loading, error } = useApi<User[]>('/users');
```

### Module Splits

#### Users module — `components/users/` (587 → ~4 files)
| File | Responsibility | Target lines |
|------|---------------|-------------|
| `columns.tsx` | TanStack column definitions array only | ~100 |
| `action-menu.tsx` | Dropdown menu + icon button | ~80 |
| `user-avatar.tsx` | Avatar with initials fallback + status ring | ~60 |
| `users-table.tsx` | Orchestrator: state + modal trigger + table render | ~150 |
| `user-action-modal.tsx` | Stays as-is (212 lines, within limit) | 212 |

#### Reports module — `components/reports/` (317 → ~3 files)
| File | Responsibility | Target lines |
|------|---------------|-------------|
| `kanban-column.tsx` | Single column + drag-over highlight + drop zone | ~100 |
| `report-card.tsx` | Single card + assignee dropdown (real API) | ~120 |
| `reports-board.tsx` | Orchestrator: drag state + column layout | ~120 |

#### Content/Moderation module — `components/content/` (433 → ~3 files)
| File | Responsibility | Target lines |
|------|---------------|-------------|
| `moderation-item.tsx` | Single content row with video preview + action buttons | ~130 |
| `ai-flags-bar.tsx` | AI confidence score bars (NSFW/Violence/Spam/Hate) | ~60 |
| `moderation-queue.tsx` | Orchestrator: filter + list + pagination | ~130 |

#### Analytics module — `components/analytics/` + `pages/`  (268+285 → ~4 files)
| File | Responsibility | Target lines |
|------|---------------|-------------|
| `kpi-card.tsx` | Single KPI stat card with trend indicator | ~60 |
| `range-selector.tsx` | Date range pill selector | ~50 |
| `analytics-charts.tsx` | Chart components only, no seed functions | ~200 |
| `analytics/page.tsx` | Orchestrator: fetches real data, composes UI | ~100 |

#### Audit module — `app/(dashboard)/dashboard/audit/` (260 → ~3 files)
| File | Responsibility | Target lines |
|------|---------------|-------------|
| `components/audit/audit-filters.tsx` | Filter controls (actor, action, date) | ~80 |
| `components/audit/audit-log-table.tsx` | Table display only | ~100 |
| `audit/page.tsx` | Orchestrator: fetches, filters, exports | ~100 |

#### Settings module — `app/(dashboard)/dashboard/settings/` (325 → ~3 files)
| File | Responsibility | Target lines |
|------|---------------|-------------|
| `components/settings/settings-section.tsx` | Reusable section card wrapper | ~50 |
| `components/settings/settings-form.tsx` | Form fields + submit per section | ~120 |
| `settings/page.tsx` | Orchestrator: section list + save handlers | ~100 |

---

## OOP / DRY / KISS / Security Rules Enforced Throughout

### OOP
- Each component is a single-responsibility class-equivalent (one concern per file)
- Shared behaviour extracted to hooks (`use-api`, `use-ability`) not copy-pasted

### DRY
- `LoadingSpinner`, `ErrorBanner`, `EmptyState` — one source of truth
- `useApi` hook — one pattern for all data fetching
- `APP` constants — one place for all URLs and config strings

### KISS
- No component does both data-fetching AND rendering complex UI — always separated
- Page files = orchestrators only (fetch + compose), max ~100–150 lines
- Component files = pure UI only, receive data via props

### Security
- No secrets or tokens in frontend code
- All API calls go through `apiClient` (has auth interceptor + token rotation)
- `FRONTEND_URL` on backend uses env var — never hardcoded
- `inviteUrl` returned to frontend only for display — not stored, not logged

---

## Parallel Agent Execution Plan (Layer 2)

Four independent agents run simultaneously:

| Agent | Module | Files touched |
|-------|--------|--------------|
| A | Users | `users-table.tsx`, new `columns.tsx`, `action-menu.tsx`, `user-avatar.tsx` |
| B | Reports + Content | `reports-board.tsx`, new `kanban-column.tsx`; `moderation-queue.tsx`, new `moderation-item.tsx`, `ai-flags-bar.tsx` |
| C | Analytics + Audit | `analytics/page.tsx`, `analytics-charts.tsx`, new `kpi-card.tsx`, `range-selector.tsx`; new `audit-filters.tsx`, `audit-log-table.tsx` |
| D | Settings + Shared UI | `settings/page.tsx`, new `settings-section.tsx`, `settings-form.tsx`; new `components/ui/loading-spinner.tsx`, `error-banner.tsx`, `empty-state.tsx`, `lib/hooks/use-api.ts`, `lib/constants.ts` |

No agent touches files owned by another agent. No merge conflicts.

---

## Success Criteria

- [ ] `inviteUrl` returns `https://admin.beautybilen.com/register?token=...` in production
- [ ] Zero `seed*()` or `MOCK_*` exports anywhere in the frontend
- [ ] Every file in `apps/web/src/` is ≤ 500 lines
- [ ] Real data loads on: Analytics, Reports (already working), Users (already working)
- [ ] `lib/constants.ts` is the only place `beautybilen.com` appears in frontend source
- [ ] `lib/hooks/use-api.ts` used by all data-fetching pages
- [ ] `components/ui/` primitives used for all loading/error/empty states
- [ ] `pnpm build` passes with zero TypeScript errors
