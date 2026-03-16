import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { can }         from '../middleware/rbac';
import { auditLog }    from '../middleware/audit';
import * as users      from '../controllers/users.controller';

const router: Router = Router();
router.use(requireAuth);

router.get('/',             can('read','users'),   users.listUsers);
router.get('/:id',          can('read','users'),   users.getUser);
router.patch('/:id',        can('ban','users'),    auditLog('user.ban','user'), users.updateUser);
router.delete('/:id',       can('ban','users'),    auditLog('user.delete','user'), users.deleteUser);
router.post('/bulk-action', can('ban','users'),    auditLog('user.ban','user'), users.bulkAction);

export default router;
