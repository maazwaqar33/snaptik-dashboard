# SnapTik Admin Dashboard — QA Test Guide
**Version**: 2.0 (Post-Production Wiring)
**Date**: 2026-03-17
**URL**: https://snaptik-dashboard-web-ddcc.vercel.app

---

## Test Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| Super Admin | `admin@snaptik.com` | `Admin@1234!` | Full access — all screens, all actions |
| Moderator | `moderator@snaptik.com` | `Mod@1234!` | Content + Reports + Users (read) |
| Support | `support@snaptik.com` | `Support@1` | Tickets only |
| Analyst | `analyst@snaptik.com` | `Analyst@1` | Analytics + Audit log (read-only) |
| Auditor | `auditor@snaptik.com` | `Auditor@1` | Audit log only |

> All credentials are seeded in the production MongoDB on the admin EC2 instance.

---

## Architecture (for QA context)

```
Browser (HTTPS Vercel) → /api/proxy/* → Vercel Edge → HTTP EC2 (16.16.251.27:80) → Express API → MongoDB
```

The **proxy** is critical: browsers block HTTPS→HTTP fetch requests (mixed content). All API calls go through `/api/proxy` at Vercel, which server-side forwards to EC2.

---

## Test Scenarios

### TS-01: Login / Logout

**Test each role:**
1. Go to https://snaptik-dashboard-web-ddcc.vercel.app/login
2. Enter credentials from table above
3. Verify you land on the dashboard
4. Verify sidebar shows only role-appropriate nav items
5. Click profile menu → **Logout**
6. Verify redirect to `/login`

**Expected**: Each role logs in successfully. Analyst/Auditor should NOT see moderation screens.

---

### TS-02: Dashboard Overview

**Login as**: `admin@snaptik.com`

1. Check the KPI cards — values reflect real DB counts:
   - **Total Users**: 8 (seeded QA users)
   - **Flagged Pending**: 4 (items awaiting moderation)
   - **Open Reports**: 3 (pending + in_review reports)
   - **MAU / DAU / Revenue**: 0 (requires main app telemetry — expected)

2. Verify no hardcoded/fake numbers on the summary cards

---

### TS-03: User Management

**Login as**: `admin@snaptik.com`
**URL**: Dashboard → Users

1. Verify the users list loads 8 users (the QA seed data)
2. **Search**: Type "lena" — should show only `dance_queen_lena`
3. **Filter**: Select "Banned" — should show `spammer_xbot99` and `hatefull_user77`
4. **Ban action**: Click on `comedy_bro_raj` → Actions → Ban → confirm reason
5. Verify the user now appears in the Banned filter
6. **Unban**: Repeat step 4, choose Unban
7. **Warn**: Issue a warning to `bookworm_sofia`

**Login as**: `moderator@snaptik.com` — verify user management is visible
**Login as**: `analyst@snaptik.com` — verify user management is NOT visible (RBAC)

---

### TS-04: Content Moderation

**Login as**: `moderator@snaptik.com`
**URL**: Dashboard → Content

1. Verify moderation queue loads with 4 pending items
2. Click an item to view details (caption, AI flag scores)
3. **Approve** one item — verify status changes to "Approved"
4. **Reject** one item with a reason — verify status changes to "Rejected"
5. **Defer** one item — verify it stays "Pending" with note "Deferred for further review"
6. Test **bulk select** (2 items) → bulk approve

---

### TS-05: Reports Kanban

**Login as**: `moderator@snaptik.com`
**URL**: Dashboard → Reports

1. Verify 3 Kanban columns: **Pending** (3 items), **In Review** (1 item), **Resolved** (2 items)
2. **Drag** a Pending report to In Review — verify it moves
3. Click a report card → **Resolve** with action "Dismiss" + a note
4. Verify resolved report appears in Resolved column
5. **Assign** an In Review report to yourself

---

### TS-06: Support Tickets

**Login as**: `support@snaptik.com`
**URL**: Dashboard → Support Tickets

1. Verify the tickets list loads (initially empty or with existing tickets)
2. **Create new ticket**: Fill subject, description, category, priority
3. Verify ticket appears in the list
4. Open the ticket → **Reply** with a message
5. Change ticket **status** from Open → In Progress → Resolved

---

### TS-07: Analytics

**Login as**: `analyst@snaptik.com`
**URL**: Dashboard → Analytics

1. Verify the page loads without error
2. KPIs show real DB-derived counts (users, flagged content, reports)
3. Time series charts show trend lines (these use demo data until main app telemetry is wired)
4. **Export**: Click Export → Users → verify CSV downloads
5. Verify "Export" action is logged in the Audit trail

---

### TS-08: Audit Log

**Login as**: `auditor@snaptik.com`
**URL**: Dashboard → Audit Log

1. Verify the audit log table loads with real entries (created during login/logout + all moderation actions taken above)
2. Check that each entry shows: admin name, action, IP, timestamp
3. Verify that your login from TS-01 appears as `admin.login`
4. Verify moderation actions from TS-04 appear as `content.remove`

---

### TS-09: Settings

**Login as**: `admin@snaptik.com`
**URL**: Dashboard → Settings

1. Verify 12 settings groups are loaded (seeded from DEFAULT_SETTINGS)
2. **Update** a setting value — e.g. change `max_video_duration_seconds`
3. Verify the change persists after page refresh
4. Verify the change appears in the Audit Log as `settings.update`

---

### TS-10: Admin Management (Invite Flow)

**Login as**: `admin@snaptik.com`
**URL**: Dashboard → Admins

1. Click **Invite Admin** — fill email, select role "moderator"
2. Submit — note the invite token in the API response (visible in Swagger)
3. Verify the new admin appears with status "Pending"
4. **Deactivate** an existing admin (not your own account)
5. Try logging in with the deactivated account — should get 401

---

### TS-11: Role-Based Access Control (RBAC)

Test each role can ONLY see/do what their permissions allow:

| Screen | super_admin | moderator | support | analyst | auditor |
|--------|-------------|-----------|---------|---------|---------|
| Dashboard | ✓ | ✓ | ✗ | ✓ | ✗ |
| Users | ✓ | ✓ (read) | ✗ | ✗ | ✗ |
| Content | ✓ | ✓ | ✗ | ✓ (read) | ✗ |
| Reports | ✓ | ✓ | ✗ | ✓ (read) | ✗ |
| Tickets | ✓ | ✗ | ✓ | ✗ | ✗ |
| Analytics | ✓ | ✗ | ✗ | ✓ | ✗ |
| Audit Log | ✓ | ✗ | ✗ | ✓ (read) | ✓ |
| Settings | ✓ | ✗ | ✗ | ✗ | ✗ |
| Admins | ✓ | ✗ | ✗ | ✗ | ✗ |

---

### TS-12: API Documentation (Swagger)

**URL**: http://16.16.251.27/api/v1/docs
(Access directly — not through Vercel proxy, as Swagger UI is a testing tool)

1. Verify Swagger UI loads with all 11 tag groups
2. Click **Authorize** → enter Bearer token from TS-01 login response
3. Test `GET /api/v1/users` — should return 8 users
4. Test `GET /api/v1/content/flagged` — should return 6 items
5. Test `GET /api/v1/reports` — should return 6 reports
6. Test `GET /api/v1/analytics/overview` — should return real DB counts

---

## Known Limitations (Not Bugs)

| Item | Status |
|------|--------|
| MAU / DAU / totalVideos / revenue show 0 | Expected — requires main SnapTik app telemetry |
| Top videos chart uses demo data | Expected — no real video analytics yet |
| Password reset email not sent | SES not configured — token logged to server console |
| Socket.io live alerts disabled | `NEXT_PUBLIC_SOCKET_URL` not set |
| Main SnapTik users not in admin DB | Admin DB is isolated; users seeded as QA data |

---

## Reporting Bugs

For each bug found, please record:
- **Test Scenario ID** (e.g. TS-04)
- **Browser + OS**
- **Steps to reproduce** (numbered)
- **Expected result**
- **Actual result**
- **Screenshot/network request** if applicable
- **Severity**: P0 (blocker) / P1 (critical) / P2 (major) / P3 (minor)
