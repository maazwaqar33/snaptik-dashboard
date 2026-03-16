import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { can }         from '../middleware/rbac';
import { auditLog }    from '../middleware/audit';
import * as reports    from '../controllers/reports.controller';

const router: Router = Router();
router.use(requireAuth);

router.get('/',              can('read','reports'),   reports.listReports);
router.get('/kanban',        can('read','reports'),   reports.getKanban);
router.get('/:id',           can('read','reports'),   reports.getReport);
router.patch('/:id/resolve', can('handle','reports'), auditLog('report.resolve','report'), reports.resolveReport);
router.patch('/:id/assign',  can('assign','reports'), auditLog('report.assign','report'),  reports.assignReport);
router.patch('/:id/status',  can('handle','reports'), auditLog('report.update','report'),  reports.updateReportStatus);

export default router;
