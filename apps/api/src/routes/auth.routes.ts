import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth';
import * as auth from '../controllers/auth.controller';

const router: Router = Router();

const authLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

router.post('/login',           authLimiter, auth.login);
router.post('/refresh',                      auth.refresh);
router.post('/logout',          requireAuth, auth.logout);
router.post('/forgot-password', authLimiter, auth.forgotPassword);
router.post('/reset-password',  authLimiter, auth.resetPassword);
router.post('/register-invite', authLimiter, auth.registerInvite);

export default router;
