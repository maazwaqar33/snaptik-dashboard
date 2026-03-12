# SnapTik Admin Dashboard

Professional RBAC admin control panel for SnapTik — manage users, moderate content, view analytics, handle support tickets, and configure the app.

## Tech Stack

- **Frontend:** Next.js 15 + Tailwind CSS + shadcn/ui (deployed on Vercel)
- **Backend:** Express + TypeScript (deployed on AWS EC2)
- **Database:** MongoDB (shared with main SnapTik backend)
- **Real-time:** MongoDB Change Streams → Socket.io
- **Monorepo:** Turborepo + pnpm workspaces

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- Access to SnapTik MongoDB instance

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

```bash
# For API
cp .env.example apps/api/.env
# Edit apps/api/.env with your values

# For Web
cp .env.example apps/web/.env.local
# Edit apps/web/.env.local with your values
```

### 3. Seed first Super Admin

```bash
pnpm --filter @snaptik/api run seed:admin
```

### 4. Run development servers

```bash
# Runs both web (:3000) and api (:5001) concurrently
pnpm dev
```

Or run individually:
```bash
pnpm --filter @snaptik/web dev    # Frontend only
pnpm --filter @snaptik/api dev    # Backend only
```

## Project Structure

```
snaptik-dashboard/
├── apps/
│   ├── web/     # Next.js 15 admin panel (Vercel)
│   └── api/     # Express admin API (EC2)
└── packages/
    ├── ui/      # Shared components
    └── types/   # Shared TypeScript types
```

## Roles & Permissions

| Role | Capabilities |
|------|-------------|
| Super Admin | Everything |
| Moderator | Content moderation, user actions, reports |
| Support Agent | Ticket handling, user account help |
| Analyst | Analytics dashboards, data export |
| Auditor | Read-only: audit logs, compliance reports |

## Deployment

- **Frontend:** Auto-deploys to Vercel on push to `main`
- **Backend:** GitHub Actions → SSH → EC2 → PM2 restart

## Merge into Main Backend

When admin API is complete, follow the checklist in `docs/MERGE.md`.
