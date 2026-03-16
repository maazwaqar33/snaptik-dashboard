import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { can }         from '../middleware/rbac';
import { auditLog }    from '../middleware/audit';
import * as admins     from '../controllers/admins.controller';

const router: Router = Router();
router.use(requireAuth);

router.get('/',        can('manage','admins'), admins.listAdmins);
router.get('/online',  can('manage','admins'), admins.getOnlineAdmins);
router.post('/invite', can('manage','admins'), auditLog('admin.invite','admin'), admins.inviteAdmin);
router.patch('/:id',   can('manage','admins'), auditLog('admin.toggle','admin'), admins.updateAdmin);

export default router;
