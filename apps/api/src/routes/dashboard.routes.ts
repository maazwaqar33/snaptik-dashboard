import { Router } from 'express';
import { requireAuth }  from '../middleware/auth';
import * as dashboard   from '../controllers/dashboard.controller';

const router: Router = Router();
router.use(requireAuth);

router.get('/stats',  dashboard.getStats);
router.get('/alerts', dashboard.getAlerts);

export default router;
