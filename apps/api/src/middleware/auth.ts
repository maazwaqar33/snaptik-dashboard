import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type AccessTokenPayload } from '../lib/tokens';

declare global {
  namespace Express {
    interface Request {
      admin: AccessTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Missing access token' });
    return;
  }

  try {
    req.admin = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired access token' });
  }
}
