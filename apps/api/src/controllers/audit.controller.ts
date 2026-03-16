import type { Request, Response } from 'express';
import { AuditLog } from '../models/audit.model';

// GET /audit
export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const page    = Math.max(1, Number(req.query['page'])  || 1);
  const limit   = Math.min(100, Number(req.query['limit']) || 20);
  const skip    = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query['action'])  filter['action']  = req.query['action'];
  if (req.query['adminId']) filter['adminId'] = req.query['adminId'];
  if (req.query['from'] || req.query['to']) {
    filter['createdAt'] = {};
    if (req.query['from']) (filter['createdAt'] as Record<string, unknown>)['$gte'] = new Date(String(req.query['from']));
    if (req.query['to'])   (filter['createdAt'] as Record<string, unknown>)['$lte'] = new Date(String(req.query['to']));
  }
  if (req.query['search']) {
    const q = String(req.query['search']);
    filter['$or'] = [
      { adminName: { $regex: q, $options: 'i' } },
      { adminEmail: { $regex: q, $options: 'i' } },
      { targetId: { $regex: q, $options: 'i' } },
      { detail: { $regex: q, $options: 'i' } },
    ];
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ logs, total, page, limit });
}

// POST /audit/export
export async function exportAuditLogs(req: Request, res: Response): Promise<void> {
  const filter: Record<string, unknown> = {};
  if (req.body?.from || req.body?.to) {
    filter['createdAt'] = {};
    if (req.body?.from) (filter['createdAt'] as Record<string, unknown>)['$gte'] = new Date(req.body.from);
    if (req.body?.to)   (filter['createdAt'] as Record<string, unknown>)['$lte'] = new Date(req.body.to);
  }

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(5000).lean();

  const header = 'timestamp,adminName,adminEmail,adminRole,action,targetId,targetType,detail,ipAddress\n';
  const rows = logs.map(l =>
    [
      new Date(l.createdAt).toISOString(),
      l.adminName, l.adminEmail, l.adminRole, l.action,
      l.targetId ?? '', l.targetType ?? '', (l.detail ?? '').replace(/,/g, ';'),
      l.ipAddress ?? '',
    ].join(',')
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
  res.send(header + rows);
}
