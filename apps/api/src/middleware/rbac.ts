import type { Request, Response, NextFunction } from 'express';
import { buildAbility } from '../lib/ability';

export function can(action: string, subject: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ability = buildAbility(req.admin);
    if (ability.can(action, subject)) {
      next();
    } else {
      res.status(403).json({
        error: `Forbidden: requires "${action}:${subject}"`,
      });
    }
  };
}
