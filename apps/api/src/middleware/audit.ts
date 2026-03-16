import type { Request, Response, NextFunction } from 'express';
import { AuditLog, type AuditAction } from '../models/audit.model';

export function auditLog(action: AuditAction, targetType?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Run after response
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.admin) {
        const rawId = req.params['id'] ?? req.params['userId'] ?? req.body?.targetId;
        const targetId: string | undefined = Array.isArray(rawId) ? rawId[0] : rawId;

        AuditLog.create({
          adminId:    req.admin.sub,
          adminName:  req.admin.name,
          adminEmail: req.admin.email,
          adminRole:  req.admin.role,
          action,
          targetId,
          targetType,
          detail:     req.body?.reason ?? req.body?.detail,
          ipAddress:  req.ip,
          userAgent:  req.headers['user-agent'],
        }).catch(() => {/* non-blocking */});
      }
    });
    next();
  };
}
