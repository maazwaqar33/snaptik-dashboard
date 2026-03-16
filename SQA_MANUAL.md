# SnapTik Admin Dashboard — SQA Manual

## 1. Environment Setup

### Prerequisites
- Node.js 20+, pnpm 9+, MongoDB 7 running on localhost:27017 (or Docker)

### Quick Start (Non-Docker)
```bash
cd F:/snaptik-dashboard
pnpm install
pnpm --filter @snaptik/api seed   # Creates QA test users
# Terminal 1: API
pnpm --filter @snaptik/api dev    # http://localhost:5001
# Terminal 2: Web
pnpm --filter @snaptik/web dev    # http://localhost:3000
```

### Quick Start (Docker)
```bash
docker compose -f docker-compose.local.yml up --build
docker compose -f docker-compose.local.yml exec api pnpm seed
```

---

## 2. QA Test Credentials

| Role | Email | Password | Key Permissions |
|------|-------|----------|-----------------|
| super_admin | admin@snaptik.com | Admin@1234! | All features — unrestricted |
| moderator | moderator@snaptik.com | Mod@1234! | Read/warn/ban users; moderate/delete content; handle reports; read analytics; read audit log |
| support | support@snaptik.com | Support@1 | Read/edit users; read/reply/update tickets; read reports |
| analyst | analyst@snaptik.com | Analyst@1 | Read and export analytics; read users (no PII actions) |
| auditor | auditor@snaptik.com | Auditor@1 | Read/export audit logs; read reports; export compliance |

---

## 3. RBAC Permission Matrix

| Permission | super_admin | moderator | support | analyst | auditor |
|---|---|---|---|---|---|
| read:users | ✓ | ✓ | ✓ | ✓ | — |
| warn:users | ✓ | ✓ | — | — | — |
| ban:users | ✓ | ✓ | — | — | — |
| edit:users | ✓ | — | ✓ | — | — |
| resetpassword:users | ✓ | — | ✓ | — | — |
| read:content | ✓ | ✓ | — | — | — |
| moderate:content | ✓ | ✓ | — | — | — |
| delete:content | ✓ | ✓ | — | — | — |
| read:reports | ✓ | ✓ | ✓ | — | ✓ |
| handle:reports | ✓ | ✓ | — | — | — |
| assign:reports | ✓ | ✓ | — | — | — |
| read:analytics | ✓ | ✓ | — | ✓ | — |
| export:analytics | ✓ | — | — | ✓ | — |
| read:tickets | ✓ | — | ✓ | — | — |
| reply:tickets | ✓ | — | ✓ | — | — |
| update:tickets | ✓ | — | ✓ | — | — |
| assign:tickets | ✓ | — | ✓ | — | — |
| read:auditlog | ✓ | ✓ | — | — | ✓ |
| export:compliance | ✓ | — | — | — | ✓ |

---

## 4. Functional Test Cases

### 4.1 Authentication (TC-001 to TC-010)

| TC# | Test Name | Role | Steps | Expected Result |
|-----|-----------|------|-------|----------------|
| TC-001 | Valid login (super_admin) | super_admin | POST /auth/login `{email: "admin@snaptik.com", password: "Admin@1234!"}` | 200, accessToken in body, refresh cookie set |
| TC-002 | Valid login (all 5 roles) | all roles | POST /auth/login with each role's credentials | All return 200, accessToken in body |
| TC-003 | Wrong password | super_admin | POST /auth/login `{email: "admin@snaptik.com", password: "wrongpass"}` | 401 "Invalid credentials or account inactive" |
| TC-004 | Unknown email | — | POST /auth/login `{email: "unknown@email.com", password: "anypass"}` | 401 (same message, no enum) |
| TC-005 | Inactive account | super_admin | Manually set `isActive: false` in DB, then POST /auth/login | 401 |
| TC-006 | Token refresh | any | Use refresh cookie in POST /auth/refresh | 200, new accessToken |
| TC-007 | Logout | any | POST /auth/logout (with auth) | 200, refresh cookie cleared |
| TC-008 | Forgot password (dev mode) | — | POST /auth/forgot-password `{email: "admin@snaptik.com"}` | 200, devToken in response body |
| TC-009 | Reset password | — | Use devToken from TC-008 → POST /auth/reset-password; then login with new password | 200 on reset; 200 on subsequent login |
| TC-010 | Register via invite | super_admin | super_admin invites new@test.com, copy inviteToken → POST /auth/register-invite `{token, name, password}` | 200; then login → 200 |

### 4.2 Dashboard (TC-011 to TC-013)

| TC# | Test Name | Role | Steps | Expected Result |
|-----|-----------|------|-------|----------------|
| TC-011 | Get stats | super_admin | GET /dashboard/stats | 200, kpis.mau > 0, system.status = "healthy" |
| TC-012 | Get alerts | super_admin | GET /dashboard/alerts | 200, alerts array with items |
| TC-013 | Analyst can't see stats | analyst | GET /dashboard/stats | 200 (no permission check — dashboard is open to all authenticated admins) |

### 4.3 User Management (TC-014 to TC-023)

| TC# | Test Name | Role | Steps | Expected Result |
|-----|-----------|------|-------|----------------|
| TC-014 | List users | moderator | GET /users | 200, users array, total > 0, pagination fields |
| TC-015 | Search users | moderator | GET /users?search=john | 200, filtered results |
| TC-016 | Filter by status | moderator | GET /users?status=banned | 200, only banned users |
| TC-017 | Get user detail | moderator | GET /users/usr-001 | 200, full user object with banHistory |
| TC-018 | Ban user | moderator | PATCH /users/usr-001 `{action: "ban", reason: "Spam"}` | 200 |
| TC-019 | Unban user | moderator | PATCH /users/usr-001 `{action: "unban"}` | 200 |
| TC-020 | Analyst bans user | analyst | PATCH /users/usr-001 `{action: "ban"}` | 403 (analyst lacks ban:users) |
| TC-021 | Delete user | super_admin | DELETE /users/usr-001 `{reason: "GDPR"}` | 200 |
| TC-022 | Support deletes user | support | DELETE /users/usr-001 | 403 (support lacks ban:users) |
| TC-023 | Bulk ban | super_admin | POST /users/bulk-action `{ids: ["usr-001", "usr-002"], action: "ban"}` | 200, affected: 2 |

### 4.4 Content Moderation (TC-024 to TC-030)

| TC# | Test Name | Role | Steps | Expected Result |
|-----|-----------|------|-------|----------------|
| TC-024 | List flagged | moderator | GET /content/flagged | 200, items array |
| TC-025 | Filter by confidence | moderator | GET /content/flagged?minConfidence=0.85 | 200, only high-confidence items |
| TC-026 | Get signed URL | moderator | GET /content/vid-001/signed-url | 200, signedUrl string, expiresIn: 300 |
| TC-027 | Reject content | moderator | PATCH /content/vid-001/moderate `{action: "reject", reason: "NSFW"}` | 200 |
| TC-028 | Support moderates | support | PATCH /content/vid-001/moderate `{action: "approve"}` | 403 |
| TC-029 | Bulk reject | moderator | POST /content/bulk-moderate `{ids: ["vid-001"], action: "reject"}` | 200 |
| TC-030 | Analyst list flagged | analyst | GET /content/flagged | 403 (analyst lacks read:content) |

### 4.5 Reports (TC-031 to TC-035)

| TC# | Test Name | Role | Steps | Expected Result |
|-----|-----------|------|-------|----------------|
| TC-031 | List reports | moderator | GET /reports | 200 |
| TC-032 | Filter pending | moderator | GET /reports?status=pending | 200, only pending |
| TC-033 | Resolve report | moderator | PATCH /reports/rep-001/resolve `{action: "warn", notes: "warned"}` | 200 |
| TC-034 | Auditor resolves | auditor | PATCH /reports/rep-001/resolve | 403 |
| TC-035 | Assign report | moderator | PATCH /reports/rep-001/assign `{adminId: "some-id"}` | 200 |

### 4.6 Tickets (TC-036 to TC-040)

| TC# | Test Name | Role | Steps | Expected Result |
|-----|-----------|------|-------|----------------|
| TC-036 | List tickets | support | GET /tickets | 200 |
| TC-037 | Moderator views tickets | moderator | GET /tickets | 403 |
| TC-038 | Get ticket detail | support | GET /tickets/tkt-001 | 200, messages array |
| TC-039 | Reply to ticket | support | POST /tickets/tkt-001/reply `{text: "Looking into this"}` | 200 |
| TC-040 | Update status | support | PATCH /tickets/tkt-001 `{status: "resolved"}` | 200 |

### 4.7 Analytics (TC-041 to TC-045)

| TC# | Test Name | Role | Steps | Expected Result |
|-----|-----------|------|-------|----------------|
| TC-041 | Overview | analyst | GET /analytics/overview | 200, kpis object |
| TC-042 | Auditor views analytics | auditor | GET /analytics/overview | 403 |
| TC-043 | Users series 7d | analyst | GET /analytics/users?days=7 | 200, series with 7 entries |
| TC-044 | Export CSV | analyst | POST /analytics/export `{type: "users", days: 30}` | 200, csv string, filename |
| TC-045 | Moderator exports | moderator | POST /analytics/export | 403 |

### 4.8 Audit Logs (TC-046 to TC-050)

| TC# | Test Name | Role | Steps | Expected Result |
|-----|-----------|------|-------|----------------|
| TC-046 | List logs | auditor | GET /audit | 200, logs array with recent entries |
| TC-047 | Support views audit | support | GET /audit | 403 |
| TC-048 | Filter by action | auditor | GET /audit?action=user.ban | 200, only ban actions |
| TC-049 | Date range filter | auditor | GET /audit?from=2026-03-01&to=2026-03-15 | 200 |
| TC-050 | Export CSV | auditor | POST /audit/export | CSV download (Content-Type: text/csv) |

### 4.9 Settings (TC-051 to TC-054)

| TC# | Test Name | Role | Steps | Expected Result |
|-----|-----------|------|-------|----------------|
| TC-051 | Get settings | super_admin | GET /settings | 200, grouped by category |
| TC-052 | Moderator gets settings | moderator | GET /settings | 403 |
| TC-053 | Update threshold | super_admin | PATCH /settings/moderation.nsfw_threshold `{value: 0.90}` | 200, setting.value = 0.90 |
| TC-054 | Unknown key | super_admin | PATCH /settings/nonexistent `{value: 1}` | 404 |

### 4.10 Admin Management (TC-055 to TC-061)

| TC# | Test Name | Role | Steps | Expected Result |
|-----|-----------|------|-------|----------------|
| TC-055 | List admins | super_admin | GET /admins | 200, all 5 seeded admins |
| TC-056 | Moderator lists admins | moderator | GET /admins | 403 |
| TC-057 | Invite admin | super_admin | POST /admins/invite `{email: "new@test.com", name: "New", role: "analyst"}` | 201, inviteToken |
| TC-058 | Duplicate invite | super_admin | POST /admins/invite same email again | 409 |
| TC-059 | Invalid role | super_admin | POST /admins/invite `{role: "hacker"}` | 400 |
| TC-060 | Toggle inactive | super_admin | PATCH /admins/:id `{isActive: false}` | 200 |
| TC-061 | Self-deactivate | super_admin | PATCH /admins/:own-id `{isActive: false}` | 400 "cannot deactivate your own account" |

---

## 5. Security Test Cases

### 5.1 Authentication (TC-S001 to TC-S005)

| TC# | Test Name | Steps | Expected Result |
|-----|-----------|-------|----------------|
| TC-S001 | No token | GET /users (no Authorization header) | 401 "Missing access token" |
| TC-S002 | Invalid JWT signature | Authorization: Bearer tampered.token.here | 401 "Invalid or expired access token" |
| TC-S003 | Expired token | Use a token that has expired (wait 15min or create with past exp) | 401 |
| TC-S004 | Wrong secret | Craft JWT with different secret | 401 |
| TC-S005 | Valid token, role check | analyst token on POST /content/bulk-moderate | 403 |

### 5.2 RBAC Bypass Attempts (TC-S006 to TC-S012)

| TC# | Test Name | Steps | Expected Result |
|-----|-----------|-------|----------------|
| TC-S006 | Analyst bans user | PATCH /users/:id `{action: "ban"}` with analyst token | 403 |
| TC-S007 | Support moderates content | PATCH /content/:id/moderate with support token | 403 |
| TC-S008 | Support views audit log | GET /audit with support token | 403 |
| TC-S009 | Auditor resolves report | PATCH /reports/:id/resolve with auditor token | 403 |
| TC-S010 | Analyst invites admin | POST /admins/invite with analyst token | 403 |
| TC-S011 | Moderator reads tickets | GET /tickets with moderator token | 403 |
| TC-S012 | Support exports analytics | POST /analytics/export with support token | 403 |

### 5.3 Input Validation (TC-S013 to TC-S018)

| TC# | Test Name | Steps | Expected Result |
|-----|-----------|-------|----------------|
| TC-S013 | Empty login body | POST /auth/login `{}` | 400 "email and password are required" |
| TC-S014 | Short password on reset | POST /auth/reset-password `{token, password: "short"}` | 400 min 8 chars |
| TC-S015 | Invalid role on invite | POST /admins/invite `{role: "superuser"}` | 400 |
| TC-S016 | Missing value on settings update | PATCH /settings/moderation.nsfw_threshold `{}` | 400 "value is required" |
| TC-S017 | Expired invite token | POST /auth/register-invite `{token: "expired-or-fake"}` | 400 |
| TC-S018 | Invalid customPermissions type | PATCH /admins/:id `{customPermissions: "notanarray"}` | 400 |

### 5.4 Injection Tests (TC-S019 to TC-S021)

| TC# | Test Name | Steps | Expected Result |
|-----|-----------|-------|----------------|
| TC-S019 | NoSQL injection in login | POST /auth/login `{"email": {"$gt": ""}, "password": "anything"}` | 401 (mongoose sanitizes operators) |
| TC-S020 | XSS in reason field | PATCH /users/:id `{action: "ban", reason: "<script>alert(1)</script>"}` | 200 (stored as string, not rendered) |
| TC-S021 | Large payload | POST with 3MB JSON body | 413 (express json limit is 2mb) |

### 5.5 Rate Limiting (TC-S022 to TC-S024)

| TC# | Test Name | Steps | Expected Result |
|-----|-----------|-------|----------------|
| TC-S022 | Auth rate limit | Send POST /auth/login 11 times in 1 minute | 11th request returns 429 Too Many Requests |
| TC-S023 | Global rate limit | Send GET /users 31 times in 1 minute | 31st returns 429 |
| TC-S024 | Check headers | Send any valid request | Response includes X-RateLimit-Limit and X-RateLimit-Remaining headers |

### 5.6 Cookie Security (TC-S025 to TC-S027)

| TC# | Test Name | Steps | Expected Result |
|-----|-----------|-------|----------------|
| TC-S025 | Refresh cookie flags | After login, inspect Set-Cookie header | Must include HttpOnly, Path=/api/v1/auth/refresh |
| TC-S026 | Cookie not sent on other routes | GET /users | Should NOT include the refresh cookie |
| TC-S027 | After logout | POST /auth/logout | Set-Cookie clears the refresh cookie (expires in past) |

---

## 6. Database Verification Tests

Connect: `mongosh mongodb://localhost:27017/snaptik`

### 6.1 After Login
```js
// Run this after logging in as admin@snaptik.com
db.admin_users.findOne({email:"admin@snaptik.com"}, {lastLoginAt:1, lastLoginIp:1, refreshTokens:1})
// Expected: lastLoginAt = recent timestamp, refreshTokens array has 1 SHA-256 hash entry
```

### 6.2 After Ban Action
```js
// After PATCH /users/usr-001 {action:"ban"}
db.audit_logs.findOne({action:"user.ban"}, {sort:{createdAt:-1}})
// Expected: adminId, adminName, adminEmail, action:"user.ban", targetId:"usr-001", ipAddress
```

### 6.3 After Settings Update
```js
// After PATCH /settings/moderation.nsfw_threshold {value:0.90}
db.admin_settings.findOne({key:"moderation.nsfw_threshold"})
// Expected: value: 0.90, updatedBy: <admin ObjectId>
```

### 6.4 After Logout
```js
// After POST /auth/logout
db.admin_users.findOne({email:"admin@snaptik.com"}, {refreshTokens:1})
// Expected: refreshTokens array is empty []
```

### 6.5 After Admin Invite
```js
// After POST /admins/invite
db.admin_users.findOne({email:"new@test.com"}, {inviteToken:1, isActive:1, inviteExpiry:1})
// Expected: inviteToken present (hex string), isActive: false, inviteExpiry ~ 24h from now
```

### 6.6 After Register via Invite
```js
// After POST /auth/register-invite
db.admin_users.findOne({email:"new@test.com"}, {isActive:1, inviteToken:1})
// Expected: isActive: true, inviteToken: undefined
```

### 6.7 Audit Log Count Verification
```js
// After running 5 write operations (ban, warn, etc.)
db.audit_logs.countDocuments()
// Expected: increases by 1 for each write operation
```

---

## 7. Frontend UI Verification Checklist

### 7.1 Login Page (http://localhost:3000/login)
- [ ] Page loads without errors
- [ ] Submit wrong credentials → error message visible
- [ ] Submit correct credentials → redirects to /dashboard
- [ ] Forgot password link present

### 7.2 Sidebar RBAC (verify for each role after login)

| Sidebar Item | super_admin | moderator | support | analyst | auditor |
|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Users | ✓ | ✓ | ✓ | ✓ | — |
| Moderation | ✓ | ✓ | — | — | — |
| Reports | ✓ | ✓ | ✓ | — | ✓ |
| Analytics | ✓ | ✓ | — | ✓ | — |
| Tickets | ✓ | — | ✓ | — | — |
| Settings | ✓ | — | — | — | — |
| Audit Log | ✓ | ✓ | — | — | ✓ |
| Admins | ✓ | — | — | — | — |

### 7.3 Dashboard Page (/dashboard)
- [ ] 6 KPI cards render with numbers
- [ ] Growth chart visible
- [ ] Alerts feed has items

### 7.4 Users Page (/dashboard/users)
- [ ] Table with data
- [ ] Search input works
- [ ] Ban/Warn/Verify action buttons visible to moderator
- [ ] Action buttons NOT visible to analyst

### 7.5 Content Moderation (/dashboard/moderation)
- [ ] Queue table loads
- [ ] AI confidence badges show (e.g. "95% NSFW")
- [ ] Keyboard shortcut A = approve, R = reject, D = delete
- [ ] Bulk select checkboxes work

### 7.6 Analytics (/dashboard/analytics)
- [ ] Date range pills (7/14/30/90 days) work
- [ ] 4 charts render
- [ ] Export CSV button triggers download

### 7.7 Audit Log (/dashboard/audit)
- [ ] Timeline table shows recent entries
- [ ] Search by admin name works
- [ ] Export CSV downloads file
- [ ] No edit/delete buttons present

---

## 8. Final QA Sign-off Checklist

Run all of these before marking the release as QA-cleared:

**Authentication**
- [ ] All 5 role logins succeed
- [ ] Wrong password → 401
- [ ] Token refresh works
- [ ] Logout clears cookie

**RBAC**
- [ ] All 12 RBAC bypass tests return 403
- [ ] Super admin can access every endpoint

**Security**
- [ ] Rate limit triggers at 10/min for auth routes
- [ ] Rate limit triggers at 30/min for other routes
- [ ] No-token requests → 401
- [ ] Invalid JWT → 401

**Audit Trail**
- [ ] Every write operation creates an audit log entry
- [ ] Audit log entries have correct adminId, action, targetId, ipAddress
- [ ] Audit log export produces valid CSV

**Data Integrity**
- [ ] Settings changes persist in DB
- [ ] Admin invite creates inactive user with token
- [ ] After registration, inviteToken cleared from DB
- [ ] After logout, refresh token hash removed from DB

**Health**
- [ ] GET /health → `{ status: "ok", uptime > 0 }`
- [ ] No 500 errors on any happy-path request

---

*SQA Manual Version: 1.0 | API Version: 0.0.1 | Date: 2026-03-15*
