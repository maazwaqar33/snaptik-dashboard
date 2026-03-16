import type { Request, Response } from 'express';
import { Report, type ReportStatus, type ReportType, type ResolveAction } from '../models/report.model';
import { AuditLog } from '../models/audit.model';

function paginationParams(query: Record<string, unknown>): { page: number; limit: number; skip: number } {
  const page  = Math.max(1, parseInt(String(query.page  ?? 1),  10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10)));
  return { page, limit, skip: (page - 1) * limit };
}

// GET /reports
export async function listReports(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = paginationParams(req.query);
  const status = req.query.status as ReportStatus | undefined;
  const type   = req.query.type   as ReportType   | undefined;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (type)   filter.type   = type;

  const [reports, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Report.countDocuments(filter),
  ]);

  res.json({ reports, total, page, limit });
}

// GET /reports/:id
export async function getReport(req: Request, res: Response): Promise<void> {
  const report = await Report.findById(req.params.id).lean();
  if (!report) { res.status(404).json({ error: 'Report not found' }); return; }
  res.json(report);
}

// PATCH /reports/:id/resolve
export async function resolveReport(req: Request, res: Response): Promise<void> {
  const { action, notes } = req.body ?? {};
  const report = await Report.findById(req.params.id);
  if (!report) { res.status(404).json({ error: 'Report not found' }); return; }

  const allowed: ResolveAction[] = ['warn', 'remove', 'dismiss'];
  if (!allowed.includes(action as ResolveAction)) {
    res.status(400).json({ error: `action must be one of: ${allowed.join(', ')}` }); return;
  }

  report.status         = 'resolved';
  report.resolvedAction = action as ResolveAction;
  report.resolvedAt     = new Date();
  report.resolvedBy     = req.admin.email;
  if (notes) report.notes = notes;
  await report.save();

  await AuditLog.create({
    adminId: req.admin.sub, adminName: req.admin.name,
    adminEmail: req.admin.email, adminRole: req.admin.role,
    action: 'report.update',
    targetId: String(report._id), targetType: 'report',
    changes: { action, notes },
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  const actionMessages: Record<ResolveAction, string> = {
    warn:    'User warned and report resolved',
    remove:  'Content removed and report resolved',
    dismiss: 'Report dismissed — no action taken',
  };

  res.json({ message: actionMessages[action as ResolveAction], report });
}

// PATCH /reports/:id/assign
export async function assignReport(req: Request, res: Response): Promise<void> {
  const { adminId } = req.body ?? {};
  const report = await Report.findById(req.params.id);
  if (!report) { res.status(404).json({ error: 'Report not found' }); return; }
  if (!adminId) { res.status(400).json({ error: 'adminId is required' }); return; }

  report.assignedTo = { _id: req.admin.sub, name: req.admin.name, email: req.admin.email };
  report.status     = report.status === 'pending' ? 'in_review' : report.status;
  await report.save();

  res.json({ message: `Report assigned to ${req.admin.name}`, report });
}

// GET /reports/kanban
export async function getKanban(_req: Request, res: Response): Promise<void> {
  const [pending, in_review, resolved] = await Promise.all([
    Report.find({ status: 'pending'   }).sort({ createdAt: -1 }).lean(),
    Report.find({ status: 'in_review' }).sort({ createdAt: -1 }).lean(),
    Report.find({ status: 'resolved'  }).sort({ updatedAt: -1 }).limit(20).lean(),
  ]);
  res.json({ pending, in_review, resolved });
}

// PATCH /reports/:id/status
export async function updateReportStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body ?? {};
  const validStatuses = ['pending', 'in_review', 'resolved'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` }); return;
  }
  const report = await Report.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
  if (!report) { res.status(404).json({ error: 'Report not found' }); return; }
  res.json({ success: true, report });
}
