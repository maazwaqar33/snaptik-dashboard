import type { Request, Response } from 'express';
import { FlaggedContent, type ModerationStatus } from '../models/flagged_content.model';
import { AuditLog } from '../models/audit.model';

function paginationParams(query: Record<string, unknown>): { page: number; limit: number; skip: number } {
  const page  = Math.max(1, parseInt(String(query.page  ?? 1),  10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10)));
  return { page, limit, skip: (page - 1) * limit };
}

// GET /content/flagged  AND  GET /content/moderation-queue
export async function listFlagged(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = paginationParams(req.query);
  const status        = req.query.status as ModerationStatus | undefined;
  const minConfidence = parseFloat(String(req.query.minConfidence ?? 0));

  const filter: Record<string, unknown> = {};
  if (status) filter.moderationStatus = status;
  if (minConfidence > 0) {
    filter.$or = [
      { 'aiFlags.nsfw':       { $gte: minConfidence } },
      { 'aiFlags.violence':   { $gte: minConfidence } },
      { 'aiFlags.spam':       { $gte: minConfidence } },
      { 'aiFlags.hateSpeech': { $gte: minConfidence } },
    ];
  }

  const [items, total] = await Promise.all([
    FlaggedContent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    FlaggedContent.countDocuments(filter),
  ]);

  res.json({ items, total, page, limit });
}

export { listFlagged as getModerationQueue };

// GET /content/:id/signed-url
export async function getSignedUrl(req: Request, res: Response): Promise<void> {
  const item = await FlaggedContent.findById(req.params.id).lean();
  if (!item) { res.status(404).json({ error: 'Content item not found' }); return; }
  res.json({
    signedUrl: item.videoUrl || null,
    expiresIn: 300,
    note: 'CloudFront signing not configured — raw URL returned',
  });
}

// PATCH /content/:id/moderate
export async function moderateContent(req: Request, res: Response): Promise<void> {
  const { action, reason } = req.body ?? {};
  const item = await FlaggedContent.findById(req.params.id);
  if (!item) { res.status(404).json({ error: 'Content item not found' }); return; }

  const allowed = ['approve', 'reject', 'delete'] as const;
  type ModAction = (typeof allowed)[number];
  if (!allowed.includes(action as ModAction)) {
    res.status(400).json({ error: `action must be one of: ${allowed.join(', ')}` });
    return;
  }

  const statusMap: Record<ModAction, ModerationStatus> = { approve: 'approved', reject: 'rejected', delete: 'deleted' };
  item.moderationStatus = statusMap[action as ModAction];
  item.moderatedAt      = new Date();
  item.moderatedBy      = req.admin.email;
  if (reason) item.moderationReason = reason;
  await item.save();

  await AuditLog.create({
    adminId: req.admin.sub, adminName: req.admin.name,
    adminEmail: req.admin.email, adminRole: req.admin.role,
    action: 'content.remove',
    targetId: String(item._id), targetType: 'content',
    changes: { action, reason },
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.json({ message: `Content ${action}d successfully`, item: { _id: item._id, moderationStatus: item.moderationStatus } });
}

// POST /content/bulk-moderate
export async function bulkModerate(req: Request, res: Response): Promise<void> {
  const { ids, action, reason } = req.body ?? {};
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids must be a non-empty array' }); return;
  }

  const allowed = ['approve', 'reject', 'delete'] as const;
  type ModAction = (typeof allowed)[number];
  if (!allowed.includes(action as ModAction)) {
    res.status(400).json({ error: `action must be one of: ${allowed.join(', ')}` }); return;
  }

  const statusMap: Record<ModAction, ModerationStatus> = { approve: 'approved', reject: 'rejected', delete: 'deleted' };
  const result = await FlaggedContent.updateMany(
    { _id: { $in: ids } },
    { $set: { moderationStatus: statusMap[action as ModAction], moderatedAt: new Date(), moderatedBy: req.admin.email, ...(reason ? { moderationReason: reason } : {}) } },
  );

  const actionLabel = (action as ModAction) === 'delete' ? 'deleted' : `${action}d`;
  res.json({ affected: result.modifiedCount, message: `${result.modifiedCount} item(s) ${actionLabel}` });
}

// POST /content/:id/approve
export async function approveContent(req: Request, res: Response): Promise<void> {
  const item = await FlaggedContent.findById(req.params.id);
  if (!item) { res.status(404).json({ error: 'Content item not found' }); return; }
  item.moderationStatus = 'approved';
  item.moderatedAt = new Date();
  item.moderatedBy = req.admin?.email ?? 'unknown';
  await item.save();
  res.json({ success: true, item });
}

// POST /content/:id/remove
export async function removeContent(req: Request, res: Response): Promise<void> {
  const { reason } = req.body ?? {};
  const item = await FlaggedContent.findById(req.params.id);
  if (!item) { res.status(404).json({ error: 'Content item not found' }); return; }
  item.moderationStatus = 'rejected';
  item.moderatedAt = new Date();
  item.moderatedBy = req.admin?.email ?? 'unknown';
  if (reason) item.moderationReason = reason;
  await item.save();
  res.json({ success: true, item });
}

// POST /content/:id/defer
export async function deferContent(req: Request, res: Response): Promise<void> {
  const item = await FlaggedContent.findById(req.params.id);
  if (!item) { res.status(404).json({ error: 'Content item not found' }); return; }
  item.moderationStatus = 'pending';
  item.moderatedAt = new Date();
  item.moderatedBy = req.admin?.email ?? 'unknown';
  item.moderationReason = 'Deferred for further review';
  await item.save();
  res.json({ success: true, item });
}
