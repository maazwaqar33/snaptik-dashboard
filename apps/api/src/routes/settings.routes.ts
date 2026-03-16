import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { can }         from '../middleware/rbac';
import { auditLog }    from '../middleware/audit';
import * as settings   from '../controllers/settings.controller';

const router: Router = Router();
router.use(requireAuth);

router.get('/',         can('read','settings'),   settings.getSettings);
router.patch('/:key',   can('manage','settings'), auditLog('settings.update','setting'), settings.updateSetting);

export default router;
