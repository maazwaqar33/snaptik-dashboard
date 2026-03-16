# SnapTik Admin Dashboard — Local Setup Guide

## Quick Start (2 minutes)

### Prerequisites
- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- MongoDB 7 running locally OR Docker Desktop

---

## Option A — Manual Setup

### 1. Install dependencies
```bash
cd F:/snaptik-dashboard
pnpm install
```

### 2. Configure API environment
```bash
cp apps/api/.env.example apps/api/.env
# The default .env already works for local MongoDB — no edits needed
```

### 3. Start MongoDB (if not already running)
```bash
# macOS/Linux with Homebrew
brew services start mongodb-community

# Windows — start MongoDB service or run:
mongod --dbpath C:/data/db
```

### 4. Seed QA test users
```bash
pnpm --filter @snaptik/api seed
```

Output will show:
```
✓  Created  admin@snaptik.com  [super_admin]
✓  Created  moderator@snaptik.com  [moderator]
✓  Created  support@snaptik.com  [support]
✓  Created  analyst@snaptik.com  [analyst]
✓  Created  auditor@snaptik.com  [auditor]

────────────────────────────────────────────────────────────
QA TEST CREDENTIALS
────────────────────────────────────────────────────────────
super_admin     admin@snaptik.com               Admin@1234!
moderator       moderator@snaptik.com           Mod@1234!
support         support@snaptik.com             Support@1
analyst         analyst@snaptik.com             Analyst@1
auditor         auditor@snaptik.com             Auditor@1
────────────────────────────────────────────────────────────
```

### 5. Start the API
```bash
pnpm --filter @snaptik/api dev
# API running at http://localhost:5001
# Health check: http://localhost:5001/health
```

### 6. Start the web frontend (new terminal)
```bash
pnpm --filter @snaptik/web dev
# Web running at http://localhost:3000
```

---

## Option B — Docker (One Command)

```bash
cd F:/snaptik-dashboard

# Start everything (MongoDB + API + Web)
docker compose -f docker-compose.local.yml up --build

# In another terminal — seed the QA users
docker compose -f docker-compose.local.yml exec api pnpm seed
```

Services:
- Web: http://localhost:3000
- API: http://localhost:5001
- MongoDB: localhost:27017

---

## URLs

| Service | URL |
|---------|-----|
| Admin Dashboard | http://localhost:3000 |
| API Base | http://localhost:5001/api/v1 |
| API Health | http://localhost:5001/health |
| MongoDB | mongodb://localhost:27017/snaptik |

---

## QA Test Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Super Admin | admin@snaptik.com | Admin@1234! | Full access — all features |
| Moderator | moderator@snaptik.com | Mod@1234! | Users, Content, Reports, Analytics |
| Support | support@snaptik.com | Support@1 | Users (limited), Tickets |
| Analyst | analyst@snaptik.com | Analyst@1 | Analytics only |
| Auditor | auditor@snaptik.com | Auditor@1 | Audit logs + Reports read |

---

## Postman Collection

Import `snaptik-admin-api.postman_collection.json` into Postman.

Set up a Postman Environment with:
```
base_url  = http://localhost:5001/api/v1
access_token = (auto-set by Login request test script)
```

Run the **Login** request first — the test script automatically saves the access token to `{{access_token}}` for all subsequent requests.

---

## MongoDB Direct Access (for DB manipulation tests)

```bash
# Connect to local MongoDB
mongosh mongodb://localhost:27017/snaptik

# Useful queries
db.admin_users.find({}, {email:1, role:1, isActive:1, lastLoginAt:1})
db.audit_logs.find().sort({createdAt:-1}).limit(10)
db.admin_settings.find().sort({category:1, key:1})
```

---

## Resetting / Re-seeding

If you need a clean slate:
```bash
# Drop admin collections and re-seed
mongosh mongodb://localhost:27017/snaptik --eval "
  db.admin_users.deleteMany({});
  db.audit_logs.deleteMany({});
  db.admin_settings.deleteMany({});
"

# Re-seed
pnpm --filter @snaptik/api seed
```
