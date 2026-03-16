import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { Admin } from '../models/admin.model';
import { AuditLog } from '../models/audit.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/tokens';
import { config } from '../config';

const REFRESH_COOKIE = 'admin_refresh_token';
const cookieOpts = {
  httpOnly: true,
  secure:   config.cookieSecure,
  sameSite: config.cookieSameSite,
  path:     '/',
  maxAge:   7 * 24 * 60 * 60 * 1000,
} as const;

// POST /auth/login
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid credentials' });
    return;
  }
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() })
    .select('+passwordHash +refreshTokens');
  if (!admin || !admin.isActive) {
    res.status(401).json({ error: 'Invalid credentials or account inactive' });
    return;
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials or account inactive' });
    return;
  }

  const accessToken  = signAccessToken({
    sub: String(admin._id), email: admin.email, name: admin.name,
    role: admin.role, customPermissions: admin.customPermissions,
  });
  const refreshToken = signRefreshToken(String(admin._id));
  const tokenHash    = crypto.createHash('sha256').update(refreshToken).digest('hex');

  admin.refreshTokens.push(tokenHash);
  admin.lastLoginAt = new Date();
  admin.lastLoginIp = req.ip;
  await admin.save();

  res.cookie(REFRESH_COOKIE, refreshToken, cookieOpts);

  await AuditLog.create({
    adminId: admin._id, adminName: admin.name, adminEmail: admin.email,
    adminRole: admin.role, action: 'admin.login',
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  });

  res.json({
    accessToken,
    admin: {
      _id: admin._id, email: admin.email, name: admin.name,
      role: admin.role, customPermissions: admin.customPermissions,
      isActive: admin.isActive,
    },
  });
}

// POST /auth/refresh
export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) { res.status(401).json({ error: 'No refresh token' }); return; }

  let payload: { sub: string };
  try { payload = verifyRefreshToken(token); }
  catch { res.status(401).json({ error: 'Invalid refresh token' }); return; }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const admin = await Admin.findById(payload.sub).select('+refreshTokens');

  if (!admin || !admin.isActive || !admin.refreshTokens.includes(tokenHash)) {
    res.status(401).json({ error: 'Refresh token revoked' });
    return;
  }

  const accessToken = signAccessToken({
    sub: String(admin._id), email: admin.email, name: admin.name,
    role: admin.role, customPermissions: admin.customPermissions,
  });

  res.json({ accessToken });
}

// POST /auth/logout
export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await Admin.findByIdAndUpdate(req.admin?.sub, {
      $pull: { refreshTokens: tokenHash },
    });
    await AuditLog.create({
      adminId: req.admin.sub, adminName: req.admin.name,
      adminEmail: req.admin.email, adminRole: req.admin.role,
      action: 'admin.logout', ipAddress: req.ip,
    });
  }
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth/refresh' });
  res.json({ message: 'Logged out' });
}

// POST /auth/forgot-password
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body ?? {};
  const admin = await Admin.findOne({ email: email?.toLowerCase() });
  // Always 200 to prevent email enumeration
  if (!admin) { res.json({ message: 'If that email exists, a reset link was sent.' }); return; }

  const token  = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
  admin.resetToken  = token;
  admin.resetExpiry = expiry;
  await admin.save();

  // TODO: integrate SES to send email — token logged here for local dev
  console.log(`[DEV] Password reset token for ${admin.email}: ${token}`);
  res.json({ message: 'If that email exists, a reset link was sent.', devToken: config.nodeEnv === 'development' ? token : undefined });
}

// POST /auth/reset-password
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body ?? {};
  if (!token || !password || password.length < 8) {
    res.status(400).json({ error: 'token and password (min 8 chars) are required' });
    return;
  }

  const admin = await Admin.findOne({
    resetToken: token,
    resetExpiry: { $gt: new Date() },
  }).select('+passwordHash');

  if (!admin) { res.status(400).json({ error: 'Invalid or expired reset token' }); return; }

  admin.passwordHash = await bcrypt.hash(password, 12);
  admin.resetToken   = undefined;
  admin.resetExpiry  = undefined;
  await admin.save();

  res.json({ message: 'Password reset successfully' });
}

// POST /auth/register-invite  — called from /register?token=xxx
export async function registerInvite(req: Request, res: Response): Promise<void> {
  const { token, name, password } = req.body ?? {};
  if (!token || !name || !password || password.length < 8) {
    res.status(400).json({ error: 'token, name, and password (min 8 chars) required' });
    return;
  }

  const admin = await Admin.findOne({
    inviteToken: token,
    inviteExpiry: { $gt: new Date() },
  }).select('+passwordHash');

  if (!admin) { res.status(400).json({ error: 'Invalid or expired invite token' }); return; }

  admin.name         = name.trim();
  admin.passwordHash = await bcrypt.hash(password, 12);
  admin.isActive     = true;
  admin.inviteToken  = undefined;
  admin.inviteExpiry = undefined;
  await admin.save();

  res.json({ message: 'Account activated. Please login.' });
}
