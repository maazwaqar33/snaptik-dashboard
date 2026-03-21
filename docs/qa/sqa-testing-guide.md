# SnapTik Admin Dashboard — SQA Testing Guide
**Date:** 2026-03-21
**Version:** 1.0
**Environment:** Production

---

## Environments

| Service | URL |
|---------|-----|
| **Frontend** | https://admin.beautybilen.com |
| **API Base** | https://admin-api.beautybilen.com/api/v1 |
| **Health Check** | https://admin-api.beautybilen.com/health |

---

## Test Accounts

| Role | Email | Password | Permissions |
|------|-------|----------|-------------|
| **Super Admin** | admin@snaptik.com | Admin@1234! | Full access — all features |
| **Moderator** | moderator@snaptik.com | Mod@1234! | Content + reports + users (read/ban/warn) |
| **Support Agent** | support@snaptik.com | Support@1234! | Tickets + users (read/edit, no ban) |
| **Analyst** | analyst@snaptik.com | Analyst@1234! | Analytics (read + export only, no PII) |
| **Auditor** | auditor@snaptik.com | Auditor@1234! | Audit logs + compliance export only |

> **Note:** All passwords are bcrypt-hashed in MongoDB. These are the seed credentials.

---

## Section 1 — Frontend UI Testing

### 1.1 Login Page (`/login`)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-1 | Valid login | Enter admin@snaptik.com / Admin@1234!, click Sign In | Redirects to `/dashboard`, JWT cookie set |
| F-2 | Invalid credentials | Enter wrong password | "Invalid credentials" error shown |
| F-3 | Empty fields | Submit with blank email | Validation error: "Email is required" |
| F-4 | Wrong email format | Enter `notanemail`, submit | Validation error on email field |
| F-5 | Rate limit | Submit login 11 times in 1 min | 429 "Too many requests" error |
| F-6 | Forgot password link | Click "Forgot Password?" | Navigates to `/forgot-password` |

---

### 1.2 Dashboard Home (`/dashboard`)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-7 | KPI cards load | Login as any role, visit dashboard | 6 stat cards visible: MAU, DAU, Total Users, Flagged, Open Reports, Open Tickets |
| F-8 | Real data (not zeros) | Wait for cards to fully load | Cards show live numbers from API (not all 0s — if 0s, check API is returning data) |
| F-9 | Auto-refresh | Wait 30 seconds | Cards reload silently without page flash |
| F-10 | Error banner | Disconnect from API, refresh | Yellow/red banner: "Could not reach API — showing last cached values" |
| F-11 | Live Alerts panel | Right-side panel visible | AlertsFeed component renders (may be empty if no recent events) |

---

### 1.3 Users Page (`/dashboard/users`)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-12 | Table loads | Login as Super Admin, go to /users | User table renders with real app users from DB |
| F-13 | Search | Type username in search box | Table filters to matching users |
| F-14 | Status filter | Select "Banned" from status dropdown | Only banned users shown |
| F-15 | Pagination | Navigate to page 2 | Next 25 users load |
| F-16 | Ban user | Click ⋯ → Ban on a user, enter reason | Modal opens, confirm → user status changes to Banned |
| F-17 | Unban user | Click ⋯ → Unban on a banned user | User status changes to Active |
| F-18 | View profile | Click ⋯ → View Profile | User detail drawer/modal opens |
| F-19 | Analyst restricted | Login as Analyst, go to /users | No Ban/Delete actions visible (read-only view) |
| F-20 | Support restricted | Login as Support, click Ban | Ban option absent from action menu |

---

### 1.4 Content Moderation (`/dashboard/content`)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-21 | Queue loads | Login as Moderator, go to /content | Moderation queue renders (or shows "Queue is clear" if empty) |
| F-22 | Empty state | When no flagged videos in DB | "Queue is clear" with checkmark icon (NOT fake videos) |
| F-23 | Approve video | Click a flagged item, press A key | Item moves to Approved count, next item auto-selected |
| F-24 | Remove video | Select item, press R key | Item moves to Removed count |
| F-25 | Defer video | Select item, press D key | Item moves to Deferred count |
| F-26 | Keyboard shortcuts | Press ? / click keyboard icon | Shortcut legend appears |
| F-27 | Analyst blocked | Login as Analyst, go to /content | "Access restricted" empty state shown |

---

### 1.5 Reports (`/dashboard/reports`)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-28 | Kanban loads | Login as Moderator, go to /reports | 3 columns: Pending / In Review / Resolved |
| F-29 | Empty state | No reports in DB | Empty columns (not fake Kanban cards) |
| F-30 | Drag card | Drag a report card to "In Review" | Card moves column, API PATCH called |
| F-31 | Assign moderator | Click card → Assign Moderator dropdown | Dropdown shows real moderator list from `/admins` |
| F-32 | Support agent | Login as Support, go to /reports | Can view reports, no resolve action |
| F-33 | Analyst blocked | Login as Analyst, go to /reports | "Access restricted" |

---

### 1.6 Analytics (`/dashboard/analytics`)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-34 | KPI cards | Login as Analyst, go to /analytics | KPI cards load from `GET /analytics/overview` |
| F-35 | Range selector | Click 7d / 30d / 90d pills | Charts reload with correct date range |
| F-36 | Charts render | All charts visible | User Growth, Moderation, Engagement charts visible |
| F-37 | Export button | Click Export | Toast: "Export queued — download link will be emailed" |
| F-38 | Moderator access | Login as Moderator, go to /analytics | Can view (read:analytics permission) |
| F-39 | Support blocked | Login as Support, visit /analytics | "Access restricted" or redirected |

---

### 1.7 Support Tickets (`/dashboard/tickets`)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-40 | Tickets load | Login as Support, go to /tickets | Ticket list from real DB |
| F-41 | Status filter | Filter by "Open" | Only open tickets shown |
| F-42 | Priority badge | Check tickets | Color-coded badges: urgent=red, high=orange, medium=yellow, low=gray |
| F-43 | Analyst blocked | Login as Analyst, go to /tickets | "Access restricted" |

---

### 1.8 Settings (`/dashboard/settings`)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-44 | Settings load | Login as Super Admin, go to /settings | Settings sections rendered |
| F-45 | Save change | Change a value, click Save | API PATCH called, success toast |
| F-46 | Moderator blocked | Login as Moderator, go to /settings | 403 / "Access restricted" |

---

### 1.9 Audit Logs (`/dashboard/audit`)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-47 | Logs load | Login as Auditor, go to /audit | Real audit log entries from DB |
| F-48 | Filter by action | Select action type filter | Logs filtered by selected action |
| F-49 | Export CSV | Click Export CSV | Downloads CSV file with log entries |
| F-50 | No edit/delete | View log entries | No edit or delete buttons on any row |
| F-51 | Moderator access | Login as Moderator, go to /audit | Can view audit logs |

---

### 1.10 Admin Management (`/dashboard/admins`) ← Super Admin only

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-52 | Admin list | Login as Super Admin, go to /admins | All admin accounts listed from real API |
| F-53 | No fake admins | Check admin list | ONLY real admins from DB — no hardcoded seed names |
| F-54 | Invite admin | Click "Invite Admin", enter email + select Moderator role | Success toast + admin appears in list on refresh |
| F-55 | Invite email | Check invited email inbox | Branded invite email with unique registration link |
| F-56 | Duplicate invite | Invite same email twice | Error: "Admin with this email already exists" |
| F-57 | Toggle active | Click deactivate toggle on an admin | `isActive` toggles, admin can no longer log in |
| F-58 | Non-super-admin | Login as Moderator, go to /admins | "Access restricted" (403) |

---

### 1.11 Registration via Invite (`/register?token=<token>`)

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-59 | Valid token | Open invite link from email | Registration form with pre-filled role |
| F-60 | Set password | Complete registration, submit | Account created, redirected to /login |
| F-61 | Expired token | Use token after 24 hours | "Invite link has expired" error |
| F-62 | Used token | Reuse a completed token | "Invalid or expired invite token" error |
| F-63 | URL is real domain | Inspect invite link | `https://admin.beautybilen.com/register?token=...` (NOT localhost) |

---

### 1.12 Auth & Session

| # | Test | Steps | Expected |
|---|------|-------|----------|
| F-64 | Auto logout | Clear `admin_access_token` cookie, reload page | Redirected to `/login` |
| F-65 | Token refresh | Wait 15 min (or manually expire token), perform action | Token auto-refreshed silently, action succeeds |
| F-66 | Logout | Click logout in header | Cookies cleared, redirect to `/login` |
| F-67 | Protected routes | Visit `/dashboard` without login | Redirected to `/login` |

---

## Section 2 — Backend API Testing (via Postman or curl)

**Base URL:** `https://admin-api.beautybilen.com/api/v1`

### 2.1 Setup — Get Access Token

```bash
# Step 1: Login
curl -X POST https://admin-api.beautybilen.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@snaptik.com","password":"Admin@1234!"}' \
  -c cookies.txt

# Response: { "accessToken": "eyJ...", "admin": { "id": "...", "role": "super_admin" } }

# Step 2: Export token for use in subsequent requests
TOKEN="<accessToken from response>"
```

---

### 2.2 Auth Endpoints

| # | Test | Request | Expected Response |
|---|------|---------|-------------------|
| A-1 | Login — valid | `POST /auth/login` `{"email":"admin@snaptik.com","password":"Admin@1234!"}` | 200 `{ accessToken, admin }` + `Set-Cookie: admin_refresh_token` |
| A-2 | Login — wrong pass | `POST /auth/login` `{"email":"admin@snaptik.com","password":"wrong"}` | 401 `{ error: "Invalid credentials" }` |
| A-3 | Refresh token | `POST /auth/refresh` with refresh cookie | 200 `{ accessToken }` (new token) |
| A-4 | Logout | `POST /auth/logout` with `Authorization: Bearer $TOKEN` | 200 `{ message: "Logged out" }` + cookie cleared |
| A-5 | Health check | `GET /health` | 200 `{ status: "ok", uptime: <number> }` |

```bash
# A-1
curl -X POST https://admin-api.beautybilen.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@snaptik.com","password":"Admin@1234!"}'

# A-3
curl -X POST https://admin-api.beautybilen.com/api/v1/auth/refresh \
  -b cookies.txt

# A-5
curl https://admin-api.beautybilen.com/health
```

---

### 2.3 Users Endpoints

```bash
# List users (paginated)
curl -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/users?page=1&limit=25"
# Expected: 200 { users: [...], total, page, limit }

# Get user by ID
curl -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/users/<userId>"
# Expected: 200 { user: { ... } }

# Ban user
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"banned","reason":"Policy violation"}' \
  "https://admin-api.beautybilen.com/api/v1/users/<userId>"
# Expected: 200 { user: { status: "banned" } }

# Bulk action
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ids":["id1","id2"],"action":"ban","reason":"Spam"}' \
  "https://admin-api.beautybilen.com/api/v1/users/bulk-action"
# Expected: 200 { updated: 2 }
```

| # | Test | Request | Expected |
|---|------|---------|----------|
| B-1 | List users | `GET /users` | 200 with real users from DB |
| B-2 | Filter by status | `GET /users?status=banned` | Only banned users |
| B-3 | Search | `GET /users?search=john` | Users matching "john" |
| B-4 | Ban user | `PATCH /users/:id` `{status:"banned",reason:"..."}` | 200 + audit log entry created |
| B-5 | Analyst — no ban | Use Analyst token, `PATCH /users/:id` | 403 Forbidden |
| B-6 | No auth | `GET /users` without token | 401 Unauthorized |

---

### 2.4 Admin Management Endpoints

```bash
# List admins
curl -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/admins"
# Expected: 200 { admins: [...] }

# Invite admin
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"newmod@test.com","name":"Test Mod","role":"moderator"}' \
  "https://admin-api.beautybilen.com/api/v1/admins/invite"
# Expected: 201 { message: "Invite sent", inviteUrl: "https://admin.beautybilen.com/register?token=..." }

# Toggle active status
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive":false}' \
  "https://admin-api.beautybilen.com/api/v1/admins/<adminId>"
# Expected: 200 { admin: { isActive: false } }
```

| # | Test | Request | Expected |
|---|------|---------|----------|
| C-1 | List admins | `GET /admins` | 200 with real admin accounts |
| C-2 | Invite admin | `POST /admins/invite` | 201 + invite URL uses `https://admin.beautybilen.com` (NOT localhost) |
| C-3 | Duplicate invite | Invite existing email | 409 "Admin with this email already exists" |
| C-4 | Invite email delivery | Send real invite | Email received at target inbox with branded template |
| C-5 | Non-super-admin | Use Moderator token, `POST /admins/invite` | 403 Forbidden |
| C-6 | Online admins | `GET /admins/online` | 200 with admins active in last 5 min |

---

### 2.5 Content Moderation Endpoints

```bash
# Get moderation queue
curl -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/content/moderation-queue"
# Expected: 200 { items: [...] }

# Approve content
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/content/<contentId>/approve"
# Expected: 200 { success: true }

# Remove content
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/content/<contentId>/remove"
# Expected: 200 { success: true }
```

| # | Test | Request | Expected |
|---|------|---------|----------|
| D-1 | Queue list | `GET /content/moderation-queue` | 200 with flagged items |
| D-2 | Approve | `POST /content/:id/approve` | 200 + audit log created |
| D-3 | Remove | `POST /content/:id/remove` | 200 + audit log created |
| D-4 | Analyst blocked | Analyst token, `POST /content/:id/remove` | 403 Forbidden |

---

### 2.6 Reports Endpoints

```bash
# Kanban view
curl -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/reports/kanban"
# Expected: 200 { pending: [...], in_review: [...], resolved: [...] }

# Resolve report
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"removed","notes":"Content removed per policy"}' \
  "https://admin-api.beautybilen.com/api/v1/reports/<reportId>/resolve"
# Expected: 200 { report: { status: "resolved" } }
```

---

### 2.7 Analytics Endpoints

```bash
# Overview (dashboard KPIs)
curl -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/analytics/overview"
# Expected: 200 { mau, dau, totalUsers, flaggedContent, openReports, openTickets }

# With date range
curl -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/analytics/overview?days=30"
```

| # | Test | Request | Expected |
|---|------|---------|----------|
| E-1 | Dashboard stats | `GET /analytics/dashboard` | 200 with KPI numbers |
| E-2 | Overview stats | `GET /analytics/overview` | 200 with same KPI fields |
| E-3 | Auditor blocked | Auditor token, `GET /analytics/overview` | 403 Forbidden |

---

### 2.8 Audit Log Endpoints

```bash
# List audit logs
curl -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/audit?limit=20"
# Expected: 200 { logs: [{ adminId, action, target, timestamp, ip }...], total }

# Filter by admin
curl -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/audit?adminId=<adminId>"
```

---

### 2.9 Settings Endpoints

```bash
# Get all settings
curl -H "Authorization: Bearer $TOKEN" \
  "https://admin-api.beautybilen.com/api/v1/settings"
# Expected: 200 { settings: [...] }

# Update a setting
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":0.85}' \
  "https://admin-api.beautybilen.com/api/v1/settings/moderation.nsfw_threshold"
# Expected: 200 + audit log entry created
```

---

## Section 3 — RBAC Permission Matrix Testing

For each role, verify the following access rules:

### 3.1 Super Admin — Full Access

```bash
SUPER_TOKEN="<token from admin@snaptik.com>"

# Should all return 200:
curl -H "Authorization: Bearer $SUPER_TOKEN" .../users
curl -H "Authorization: Bearer $SUPER_TOKEN" .../admins
curl -H "Authorization: Bearer $SUPER_TOKEN" .../content/moderation-queue
curl -H "Authorization: Bearer $SUPER_TOKEN" .../reports/kanban
curl -H "Authorization: Bearer $SUPER_TOKEN" .../analytics/overview
curl -H "Authorization: Bearer $SUPER_TOKEN" .../settings
curl -H "Authorization: Bearer $SUPER_TOKEN" .../audit
curl -H "Authorization: Bearer $SUPER_TOKEN" .../tickets
```

---

### 3.2 Moderator — Content + Reports + Users

```bash
MOD_TOKEN="<token from moderator@snaptik.com>"

# Should return 200 (allowed):
curl -H "Authorization: Bearer $MOD_TOKEN" .../users
curl -H "Authorization: Bearer $MOD_TOKEN" .../content/moderation-queue
curl -H "Authorization: Bearer $MOD_TOKEN" .../reports/kanban
curl -H "Authorization: Bearer $MOD_TOKEN" .../analytics/overview
curl -H "Authorization: Bearer $MOD_TOKEN" .../audit

# Should return 403 (blocked):
curl -H "Authorization: Bearer $MOD_TOKEN" .../admins
curl -H "Authorization: Bearer $MOD_TOKEN" .../settings
curl -X POST -H "Authorization: Bearer $MOD_TOKEN" .../admins/invite
```

---

### 3.3 Support Agent — Tickets + Users (no ban)

```bash
SUP_TOKEN="<token from support@snaptik.com>"

# Should return 200:
curl -H "Authorization: Bearer $SUP_TOKEN" .../users
curl -H "Authorization: Bearer $SUP_TOKEN" .../tickets
curl -H "Authorization: Bearer $SUP_TOKEN" .../reports

# Should return 403:
curl -H "Authorization: Bearer $SUP_TOKEN" .../admins
curl -H "Authorization: Bearer $SUP_TOKEN" .../settings
curl -H "Authorization: Bearer $SUP_TOKEN" .../analytics/overview
curl -X PATCH -H "Authorization: Bearer $SUP_TOKEN" \
  -d '{"status":"banned"}' .../users/<id>    # ban = blocked
```

---

### 3.4 Analyst — Analytics Only

```bash
ANL_TOKEN="<token from analyst@snaptik.com>"

# Should return 200:
curl -H "Authorization: Bearer $ANL_TOKEN" .../analytics/overview
curl -H "Authorization: Bearer $ANL_TOKEN" .../analytics/users
curl -H "Authorization: Bearer $ANL_TOKEN" .../users    # read-only, no PII

# Should return 403:
curl -H "Authorization: Bearer $ANL_TOKEN" .../admins
curl -H "Authorization: Bearer $ANL_TOKEN" .../settings
curl -H "Authorization: Bearer $ANL_TOKEN" .../content/moderation-queue
curl -H "Authorization: Bearer $ANL_TOKEN" .../tickets
```

---

### 3.5 Auditor — Audit Logs Only

```bash
AUD_TOKEN="<token from auditor@snaptik.com>"

# Should return 200:
curl -H "Authorization: Bearer $AUD_TOKEN" .../audit
curl -H "Authorization: Bearer $AUD_TOKEN" .../reports

# Should return 403:
curl -H "Authorization: Bearer $AUD_TOKEN" .../users
curl -H "Authorization: Bearer $AUD_TOKEN" .../content/moderation-queue
curl -H "Authorization: Bearer $AUD_TOKEN" .../admins
curl -H "Authorization: Bearer $AUD_TOKEN" .../analytics/overview
curl -H "Authorization: Bearer $AUD_TOKEN" .../settings
curl -H "Authorization: Bearer $AUD_TOKEN" .../tickets
```

---

## Section 4 — End-to-End User Flows

### Flow 1 — Invite + Register New Admin

1. Login as Super Admin → go to `/admins`
2. Click "Invite Admin" → enter `sqa-test@beautybilen.com`, role = Moderator
3. ✅ Admin appears in list immediately (after table refresh)
4. ✅ Email received at `sqa-test@beautybilen.com` within 2 minutes
5. ✅ Invite URL in email = `https://admin.beautybilen.com/register?token=...` (not localhost)
6. Open invite URL → fill registration form → submit
7. ✅ New account created with Moderator role
8. Login as new Moderator → ✅ Content/Reports visible, Settings/Admins blocked
9. Super Admin deactivates new mod → ✅ Login attempt returns 401

---

### Flow 2 — Ban User + Audit Trail

1. Login as Super Admin → go to `/users`
2. Find any user → click "Ban" → enter reason "SQA test"
3. ✅ User row shows "Banned" badge
4. Go to `/audit` → ✅ Top entry shows: `admin@snaptik.com | user.ban | <userId> | <timestamp>`
5. Go to `/users`, find same user → click "Unban"
6. ✅ Status reverts to "Active"
7. ✅ Audit log shows unban entry

---

### Flow 3 — Content Moderation Keyboard Flow

1. Login as Moderator → go to `/content`
2. If queue is empty: create a test video report via the main SnapTik app
3. ✅ First item auto-selected in left panel
4. Press `A` → ✅ Approved count increments, next item selected
5. Press `R` → ✅ Removed count increments
6. Press `D` → ✅ Deferred count increments

---

### Flow 4 — Forgot Password

1. Go to `/forgot-password`
2. Enter `admin@snaptik.com` → submit
3. ✅ "Reset link sent" message shown
4. ✅ Email received at admin@snaptik.com
5. Click link in email → ✅ Reset password form
6. Enter new password → submit → ✅ Redirected to `/login`
7. Login with new password → ✅ Success

---

## Section 5 — Security Testing

| # | Test | How to Test | Expected |
|---|------|-------------|----------|
| S-1 | No token → 401 | Any API call without `Authorization` header | 401 Unauthorized |
| S-2 | Invalid token → 401 | Set `Authorization: Bearer invalid123` | 401 Unauthorized |
| S-3 | Expired token → 401 | Wait 16 min, use old token, skip refresh | 401 (refresh interceptor should auto-refresh in browser) |
| S-4 | CORS headers | Call API from a non-whitelisted origin | 403 CORS error |
| S-5 | Rate limit — auth | 11 login attempts in 1 min | 429 Too Many Requests |
| S-6 | XSS prevention | Submit `<script>alert(1)</script>` as a user reason | Stored as escaped string, not executed |
| S-7 | NoSQL injection | Submit `{"email":{"$gt":""},"password":"x"}` | 401 or 400 (sanitized) |
| S-8 | HTTPS enforced | Visit `http://admin-api.beautybilen.com` | 301 redirect to HTTPS |
| S-9 | Security headers | Check response headers from frontend | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` |
| S-10 | Cookie flags | Inspect `admin_refresh_token` cookie | `HttpOnly`, `Secure`, `SameSite=Strict` |

```bash
# S-9 — Check security headers
curl -I https://admin.beautybilen.com

# S-10 — Inspect cookie flags (check browser DevTools → Application → Cookies)
# Or via curl:
curl -X POST https://admin-api.beautybilen.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@snaptik.com","password":"Admin@1234!"}' -v 2>&1 | grep -i "set-cookie"
```

---

## Section 6 — Infrastructure / DevOps

| # | Test | Command | Expected |
|---|------|---------|----------|
| I-1 | API health | `curl https://admin-api.beautybilen.com/health` | `{"status":"ok","uptime":...}` |
| I-2 | HTTPS on API | `curl -I https://admin-api.beautybilen.com` | 200, `strict-transport-security` header present |
| I-3 | HTTPS on frontend | Visit `https://admin.beautybilen.com` | Padlock shown, cert valid for `admin.beautybilen.com` |
| I-4 | HTTP redirect | `curl -I http://admin-api.beautybilen.com` | 301 → HTTPS |
| I-5 | EC2 Docker | SSH to EC2, `docker ps` | `snaptik-admin-api` container running, status "Up" |
| I-6 | Container logs | `docker logs snaptik-admin-api --tail 50` | No ERROR lines at startup |

---

## Section 7 — Regression Checklist

After every deployment, run this quick smoke test (5 minutes):

- [ ] `GET /health` returns 200
- [ ] Login with `admin@snaptik.com` → dashboard loads with non-zero KPI cards
- [ ] `/users` table shows real users (not empty)
- [ ] `/admins` list shows real admin accounts (not 5 fake seed entries)
- [ ] Invite URL in a test invite = `https://admin.beautybilen.com/...` (not localhost)
- [ ] `/audit` shows real audit logs
- [ ] Moderator login → cannot access `/settings` or `/admins`
- [ ] `pnpm build` (or Vercel build) passes with 0 TypeScript errors

---

## Section 8 — Known Limitations (Phase 1)

These are intentional non-bugs for Phase 1:

| Feature | Status | Notes |
|---------|--------|-------|
| Analytics charts (growth/engagement) | Empty | Need analytics pipeline connected; shows placeholder message |
| 2FA / TOTP | Disabled | Speakeasy scaffolded, `totpEnabled: false` |
| Content moderation queue | May be empty | Needs flagged videos from main SnapTik app |
| Real-time Socket.io alerts | Basic | Change Streams emit events; volume depends on app activity |
| Live stream moderation | Not in scope | Phase 2 |
| GDPR delete / compliance export | Not in scope | Phase 2 |

---

## Reporting Bugs

File bugs with:
1. **Page/endpoint** affected
2. **Role used** (which test account)
3. **Steps to reproduce** (numbered)
4. **Expected vs. actual** behaviour
5. **Screenshot or API response body**
6. **Severity:** P0 (production down) / P1 (major feature broken) / P2 (minor issue) / P3 (cosmetic)
