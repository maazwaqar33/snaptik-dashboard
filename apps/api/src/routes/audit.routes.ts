import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { can }         from '../middleware/rbac';
import * as audit      from '../controllers/audit.controller';

const router: Router = Router();
router.use(requireAuth);

router.get('/',    can('read','auditlog'),     audit.listAuditLogs);
router.post('/export', can('export','compliance'), audit.exportAuditLogs);

export default router;
