import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { can }         from '../middleware/rbac';
import { auditLog }    from '../middleware/audit';
import * as analytics  from '../controllers/analytics.controller';

const router: Router = Router();
router.use(requireAuth);

router.get('/overview',   can('read','analytics'),   analytics.getOverview);
router.get('/dashboard',  can('read','analytics'),   analytics.getOverview); // alias for /overview
router.get('/users',      can('read','analytics'),   analytics.getUsersAnalytics);
router.get('/content',  can('read','analytics'),   analytics.getContentAnalytics);
router.post('/export',  can('export','analytics'), auditLog('analytics.export'), analytics.exportAnalytics);

export default router;
