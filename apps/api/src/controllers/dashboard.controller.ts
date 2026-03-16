import type { Request, Response } from 'express';
import { AuditLog } from '../models/audit.model';
import { Admin } from '../models/admin.model';

// GET /dashboard/stats
export async function getStats(_req: Request, res: Response): Promise<void> {
  const onlineCutoff = new Date(Date.now() - 5 * 60 * 1000);
  const [onlineAdmins, recentActions] = await Promise.all([
    Admin.countDocuments({ lastActionAt: { $gte: onlineCutoff }, isActive: true }),
    AuditLog.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
  ]);

  res.json({
    kpis: {
      mau:            284_000,
      dau:            47_300,
      totalUsers:     1_840_000,
      totalVideos:    9_200_000,
      flaggedPending: 247,
      openReports:    83,
      openTickets:    31,
    },
    system: {
      uptime:        process.uptime(),
      onlineAdmins,
      actionsLast24h: recentActions,
      status:        'healthy',
    },
  });
}

// GET /dashboard/alerts
export async function getAlerts(_req: Request, res: Response): Promise<void> {
  const recentLogs = await AuditLog
    .find({ action: { $in: ['user.ban', 'content.reject', 'content.delete', 'report.resolve'] } })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const staticAlerts = [
    { id: 'a1', type: 'ai_flag',    severity: 'high',   message: '3 videos flagged at 95%+ NSFW confidence',         createdAt: new Date(Date.now() - 2 * 60 * 1000) },
    { id: 'a2', type: 'report',     severity: 'medium', message: '12 new harassment reports in the last hour',        createdAt: new Date(Date.now() - 8 * 60 * 1000) },
    { id: 'a3', type: 'ticket',     severity: 'low',    message: '5 support tickets unassigned for over 24 hours',    createdAt: new Date(Date.now() - 25 * 60 * 1000) },
    { id: 'a4', type: 'user_spike', severity: 'low',    message: 'User signups up 34% compared to same time yesterday', createdAt: new Date(Date.now() - 60 * 60 * 1000) },
  ];

  const actionAlerts = recentLogs.slice(0, 5).map(l => ({
    id:        String(l._id),
    type:      'admin_action',
    severity:  'info',
    message:   `${l.adminName} performed ${l.action}`,
    createdAt: l.createdAt,
  }));

  res.json({ alerts: [...staticAlerts, ...actionAlerts] });
}
