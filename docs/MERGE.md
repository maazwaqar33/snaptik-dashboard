# Merging Admin API into Main Backend

When the admin API (`apps/api/`) is complete and ready to merge into `snaptik-backend/`:

## Pre-Merge Checklist

- [ ] All E2E tests passing in `snaptik-dashboard`
- [ ] Admin API code reviewed and approved
- [ ] No hardcoded credentials or secrets
- [ ] All environment variables documented in `.env.example`

## Migration Steps

### 1. Copy New MongoDB Models

Copy `apps/api/src/models/` new admin-specific models into `snaptik-backend/src/models/`:
- `AdminUser.ts`
- `AdminRefreshToken.ts`
- `SupportTicket.ts`
- `AppSettings.ts`

### 2. Copy Routes

Copy `apps/api/src/routes/` into `snaptik-backend/src/routes/admin/`:
```bash
cp -r apps/api/src/routes/* snaptik-backend/src/routes/admin/
cp -r apps/api/src/controllers/* snaptik-backend/src/controllers/admin/
cp -r apps/api/src/middlewares/rbac.middleware.ts snaptik-backend/src/middlewares/
cp -r apps/api/src/middlewares/audit.middleware.ts snaptik-backend/src/middlewares/
```

### 3. Mount Admin Router

In `snaptik-backend/src/app.ts`, add:
```typescript
import adminRouter from './routes/admin';
app.use('/api/v1/admin', adminRouter);
```

### 4. Add New Dependencies

Add to `snaptik-backend/package.json`:
- `@casl/ability`
- `bullmq` (if not already present)
- `@aws-sdk/cloudfront-signer`

### 5. Copy Services

Copy admin-specific services:
- `apps/api/src/services/changeStreams.ts`
- `apps/api/src/services/ses.service.ts`
- `apps/api/src/services/signedUrl.service.ts`
- `apps/api/src/services/export.service.ts`

### 6. Update Environment Variables

Add all admin-specific env vars from `apps/api/.env` to the main backend's `.env`.

### 7. Test

- Run `npm test` on merged backend
- Verify admin endpoints are accessible at `/api/v1/admin/*`
- Verify app endpoints are unaffected

### 8. Update Frontend

Update `apps/web/.env.production`:
```
NEXT_PUBLIC_API_URL=https://api.snaptik.com/api/v1
NEXT_PUBLIC_WS_URL=https://api.snaptik.com
```

### 9. Decommission

- Remove separate EC2 admin API instance
- Remove `apps/api/` from monorepo (or archive it)
- Update GitHub Actions to remove `deploy-api.yml`
