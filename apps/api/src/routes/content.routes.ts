import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { can }         from '../middleware/rbac';
import { auditLog }    from '../middleware/audit';
import * as content    from '../controllers/content.controller';

const router: Router = Router();
router.use(requireAuth);

router.get('/flagged',           can('read','content'),     content.listFlagged);
router.get('/moderation-queue',  can('read','content'),     content.listFlagged); // alias for /flagged
router.get('/:id/signed-url',    can('read','content'),     content.getSignedUrl);
router.patch('/:id/moderate',    can('moderate','content'), auditLog('content.approve','content'), content.moderateContent);
router.post('/bulk-moderate',    can('moderate','content'), auditLog('content.approve','content'), content.bulkModerate);
router.post('/:id/approve',      can('moderate','content'), auditLog('content.approve','content'), content.approveContent);
router.post('/:id/remove',       can('moderate','content'), auditLog('content.remove','content'),  content.removeContent);
router.post('/:id/defer',        can('moderate','content'), auditLog('content.defer','content'),   content.deferContent);

export default router;
