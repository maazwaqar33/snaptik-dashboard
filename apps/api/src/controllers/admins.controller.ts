import type { Request, Response } from 'express';
import type { FlattenMaps } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { Admin, type IAdmin } from '../models/admin.model';
import { AuditLog } from '../models/audit.model';

// An admin is considered "online" if they acted within the last 5 minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isOnline(lastActionAt?: Date): boolean {
  if (!lastActionAt) return false;
  return Date.now() - lastActionAt.getTime() < ONLINE_THRESHOLD_MS;
}

// Fields we always exclude from responses
const EXCLUDED_FIELDS = '-passwordHash -refreshTokens -resetToken -resetExpiry';

// ---------------------------------------------------------------------------
// GET /admins
// ---------------------------------------------------------------------------
export async function listAdmins(_req: Request, res: Response): Promise<void> {
  const admins = await Admin.find({}).select(EXCLUDED_FIELDS).lean();

  const result = admins.map((a: FlattenMaps<IAdmin>) => ({
    ...a,
    isOnline: isOnline(a.lastActionAt),
  }));

  res.json({ admins: result });
}

// ---------------------------------------------------------------------------
// POST /admins/invite
// ---------------------------------------------------------------------------
export async function inviteAdmin(req: Request, res: Response): Promise<void> {
  const { email, name, role } = req.body ?? {};

  if (!email || !name || !role) {
    res.status(400).json({ error: 'email, name, and role are required' });
    return;
  }

  const validRoles = ['super_admin', 'moderator', 'support', 'analyst', 'auditor'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
    return;
  }

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ error: 'An admin with that email already exists' });
    return;
  }

  const inviteToken  = crypto.randomBytes(32).toString('hex');
  const inviteExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

  // New invitees are inactive until they complete registration
  // passwordHash is required by schema — use a random placeholder they can never log in with
  const placeholderHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);

  const newAdmin = await Admin.create({
    email:       email.toLowerCase().trim(),
    name:        name.trim(),
    passwordHash: placeholderHash,
    role,
    isActive:    false,
    inviteToken,
    inviteExpiry,
    invitedBy:   req.admin.sub,
  });

  const inviteUrl = `http://localhost:3000/register?token=${inviteToken}`;

  // Log to console for local dev (SES not yet integrated)
  console.log(`[DEV] Invite URL for ${newAdmin.email}: ${inviteUrl}`);

  await AuditLog.create({
    adminId:    req.admin.sub,
    adminName:  req.admin.name,
    adminEmail: req.admin.email,
    adminRole:  req.admin.role,
    action:     'admin.invite',
    targetId:   String(newAdmin._id),
    targetType: 'admin',
    detail:     `Invited ${newAdmin.email} as ${role}`,
    ipAddress:  req.ip,
    userAgent:  req.headers['user-agent'],
  });

  res.status(201).json({
    message:     'Invite created. Send the inviteUrl to the new admin.',
    inviteToken,
    inviteUrl,
  });
}

// ---------------------------------------------------------------------------
// PATCH /admins/:id
// ---------------------------------------------------------------------------
export async function updateAdmin(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { isActive, role, customPermissions } = req.body ?? {};

  // Prevent self-deactivation
  if (isActive === false && req.admin.sub === id) {
    res.status(400).json({ error: 'You cannot deactivate your own account' });
    return;
  }

  const validRoles = ['super_admin', 'moderator', 'support', 'analyst', 'auditor'];
  if (role !== undefined && !validRoles.includes(role)) {
    res.status(400).json({ error: `role must be one of: ${validRoles.join(', ')}` });
    return;
  }

  if (customPermissions !== undefined && !Array.isArray(customPermissions)) {
    res.status(400).json({ error: 'customPermissions must be an array of strings' });
    return;
  }

  const update: Record<string, unknown> = {};
  if (isActive           !== undefined) update.isActive           = isActive;
  if (role               !== undefined) update.role               = role;
  if (customPermissions  !== undefined) update.customPermissions  = customPermissions;

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  const admin = await Admin.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true },
  ).select(EXCLUDED_FIELDS);

  if (!admin) { res.status(404).json({ error: 'Admin not found' }); return; }

  await AuditLog.create({
    adminId:    req.admin.sub,
    adminName:  req.admin.name,
    adminEmail: req.admin.email,
    adminRole:  req.admin.role,
    action:     'admin.toggle',
    targetId:   String(admin._id),
    targetType: 'admin',
    detail:     `Updated admin fields: ${Object.keys(update).join(', ')}`,
    ipAddress:  req.ip,
    userAgent:  req.headers['user-agent'],
  });

  res.json({
    ...admin.toObject(),
    isOnline: isOnline(admin.lastActionAt),
  });
}

// ---------------------------------------------------------------------------
// GET /admins/online
// ---------------------------------------------------------------------------
export async function getOnlineAdmins(_req: Request, res: Response): Promise<void> {
  const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS);

  const admins = await Admin.find({ lastActionAt: { $gte: cutoff } })
    .select(EXCLUDED_FIELDS)
    .lean();

  const result = admins.map((a: FlattenMaps<IAdmin>) => ({ ...a, isOnline: true }));

  res.json({ admins: result, count: result.length });
}
