import type { Request, Response } from 'express';
import { AppUser } from '../models/app_user.model';
import { AuditLog } from '../models/audit.model';

function paginationParams(query: Record<string, unknown>): { page: number; limit: number; skip: number } {
  const page  = Math.max(1, parseInt(String(query.page  ?? 1),  10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10)));
  return { page, limit, skip: (page - 1) * limit };
}

// GET /users
export async function listUsers(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = paginationParams(req.query);
  const search = String(req.query.search ?? '').trim();
  const status = req.query.status as string | undefined;

  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { username:    { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
      { email:       { $regex: search, $options: 'i' } },
    ];
  }

  if (status === 'banned')   filter.isBanned  = true;
  if (status === 'active')   filter.isBanned  = false;
  if (status === 'verified') { filter.isVerified = true; filter.isBanned = false; }

  const [users, total] = await Promise.all([
    AppUser.find(filter, {
      username: 1, email: 1, displayName: 1, isVerified: 1, isBanned: 1,
      followersCount: 1, uploadsCount: 1, joinedAt: 1, lastActiveAt: 1,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AppUser.countDocuments(filter),
  ]);

  res.json({ users, total, page, limit });
}

// GET /users/:id
export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await AppUser.findById(req.params.id).lean();
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
}

// PATCH /users/:id
export async function updateUser(req: Request, res: Response): Promise<void> {
  const { action, reason } = req.body ?? {};
  const user = await AppUser.findById(req.params.id);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const allowed = ['ban', 'unban', 'verify', 'warn', 'restrict'] as const;
  type Action = (typeof allowed)[number];

  if (!allowed.includes(action as Action)) {
    res.status(400).json({ error: `action must be one of: ${allowed.join(', ')}` });
    return;
  }

  let message = '';

  switch (action as Action) {
    case 'ban':
      user.isBanned  = true;
      user.banReason = reason ?? 'Policy violation';
      user.banHistory.push({
        reason:   reason ?? 'Policy violation',
        bannedAt: new Date(),
        bannedBy: req.admin.email,
      });
      message = 'User banned';
      break;

    case 'unban':
      user.isBanned  = false;
      user.banReason = undefined;
      if (user.banHistory.length > 0) {
        user.banHistory[user.banHistory.length - 1].unbannedAt = new Date();
      }
      message = 'User unbanned';
      break;

    case 'verify':
      user.isVerified = true;
      message = 'User verified';
      break;

    case 'warn':
      user.warningCount += 1;
      message = `Warning issued (total: ${user.warningCount})`;
      break;

    case 'restrict':
      message = 'User restricted (upload limit applied)';
      break;
  }

  await user.save();

  await AuditLog.create({
    adminId: req.admin.sub, adminName: req.admin.name,
    adminEmail: req.admin.email, adminRole: req.admin.role,
    action: 'user.update',
    targetId: String(user._id), targetType: 'user',
    changes: { action, reason, userId: user._id },
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.json({
    message,
    user: { _id: user._id, isBanned: user.isBanned, isVerified: user.isVerified },
  });
}

// DELETE /users/:id
export async function deleteUser(req: Request, res: Response): Promise<void> {
  const user = await AppUser.findById(req.params.id).lean();
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  await AuditLog.create({
    adminId: req.admin.sub, adminName: req.admin.name,
    adminEmail: req.admin.email, adminRole: req.admin.role,
    action: 'user.delete',
    targetId: String(user._id), targetType: 'user',
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.json({
    message: 'User queued for deletion',
    _id: user._id,
    scheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    requestedBy: req.admin.email,
  });
}

// POST /users/bulk-action
export async function bulkAction(req: Request, res: Response): Promise<void> {
  const { ids, action, reason } = req.body ?? {};

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids must be a non-empty array' });
    return;
  }

  const allowed = ['ban', 'warn'] as const;
  type BulkAction = (typeof allowed)[number];

  if (!allowed.includes(action as BulkAction)) {
    res.status(400).json({ error: `action must be one of: ${allowed.join(', ')}` });
    return;
  }

  let affected = 0;

  for (const id of ids as string[]) {
    try {
      const user = await AppUser.findById(id);
      if (!user) continue;

      if ((action as BulkAction) === 'ban') {
        user.isBanned  = true;
        user.banReason = reason ?? 'Bulk policy action';
        user.banHistory.push({
          reason: reason ?? 'Bulk policy action',
          bannedAt: new Date(),
          bannedBy: req.admin.email,
        });
      } else {
        user.warningCount += 1;
      }

      await user.save();
      affected++;
    } catch {
      // skip invalid IDs
    }
  }

  const actionLabel = (action as BulkAction) === 'ban' ? 'banned' : 'warned';
  res.json({ affected, message: `${affected} user(s) ${actionLabel}` });
}
