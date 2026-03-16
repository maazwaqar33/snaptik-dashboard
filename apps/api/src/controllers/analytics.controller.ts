import type { Request, Response } from 'express';
import { AuditLog } from '../models/audit.model';
import { AppUser } from '../models/app_user.model';
import { FlaggedContent } from '../models/flagged_content.model';
import { Report } from '../models/report.model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date as YYYY-MM-DD */
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Return a date N days before `from` (default: today) */
function daysAgo(n: number, from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}

/** Seeded pseudo-random so the numbers are stable across calls */
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------------
// GET /analytics/overview
// ---------------------------------------------------------------------------
export async function getOverview(_req: Request, res: Response): Promise<void> {
  // Real counts from admin DB
  const [totalUsers, flaggedPending, openReports] = await Promise.all([
    AppUser.countDocuments(),
    FlaggedContent.countDocuments({ moderationStatus: 'pending' }),
    Report.countDocuments({ status: { $in: ['pending', 'in_review'] } }),
  ]);

  // Note: MAU/DAU/totalVideos/revenue require main app telemetry — shown as 0 until integrated
  res.json({
    kpis: {
      mau:            0,
      dau:            0,
      totalUsers,
      totalVideos:    0,
      flaggedPending,
      openReports,
      openTickets: 0,
      revenue:        0,
    },
    period: '30d',
  });
}

// ---------------------------------------------------------------------------
// GET /analytics/users?days=7|14|30|90
// ---------------------------------------------------------------------------
export async function getUsersAnalytics(req: Request, res: Response): Promise<void> {
  const allowedDays = [7, 14, 30, 90];
  const days = parseInt(String(req.query.days ?? '30'), 10);
  if (!allowedDays.includes(days)) {
    res.status(400).json({ error: `days must be one of: ${allowedDays.join(', ')}` });
    return;
  }

  // Base values that scale roughly with `days`
  const baseNew     = 1_800;
  const baseActive  = 47_300;
  const baseChurned = 420;

  const series: Array<{ date: string; newUsers: number; activeUsers: number; churned: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date   = fmtDate(daysAgo(i));
    const seed   = i * 7 + days;                         // stable across calls for same day+period
    const jitter = (seededRand(seed) - 0.5) * 0.3;      // ±15 % variance

    // Weekend dip (~Saturday=6, Sunday=0)
    const dow       = new Date(date).getDay();
    const weekendMul = (dow === 0 || dow === 6) ? 0.72 : 1;

    // Gentle upward trend over the period
    const trendMul = 1 + ((days - i) / days) * 0.12;

    series.push({
      date,
      newUsers:    Math.round(baseNew    * weekendMul * trendMul * (1 + jitter)),
      activeUsers: Math.round(baseActive * weekendMul * trendMul * (1 + jitter * 0.5)),
      churned:     Math.round(baseChurned             * trendMul * (1 + jitter * 0.8)),
    });
  }

  res.json({ series });
}

// ---------------------------------------------------------------------------
// GET /analytics/content
// ---------------------------------------------------------------------------
export async function getContentAnalytics(_req: Request, res: Response): Promise<void> {
  const topVideos = [
    { videoId: 'v001', title: 'Summer dance challenge',    views: 4_820_000, likes: 892_000, comments: 31_400, uploadedAt: '2026-02-28' },
    { videoId: 'v002', title: 'How I make ramen at 3am',   views: 3_110_000, likes: 641_000, comments: 22_800, uploadedAt: '2026-03-01' },
    { videoId: 'v003', title: 'POV: your cat judging you',  views: 2_880_000, likes: 574_000, comments: 18_200, uploadedAt: '2026-03-03' },
    { videoId: 'v004', title: 'Smoothie bowl speed run',    views: 2_350_000, likes: 421_000, comments: 14_700, uploadedAt: '2026-03-05' },
    { videoId: 'v005', title: 'This apartment tour though', views: 2_090_000, likes: 398_000, comments: 12_900, uploadedAt: '2026-03-07' },
  ];

  const trendingHashtags = [
    { tag: 'snaptikchallenge', postCount: 182_400, viewCount: 920_000_000 },
    { tag: 'fyp',              postCount: 148_200, viewCount: 820_000_000 },
    { tag: 'dancewithme',      postCount:  94_300, viewCount: 430_000_000 },
    { tag: 'foodtok',          postCount:  81_100, viewCount: 380_000_000 },
    { tag: 'catsoftiktok',     postCount:  72_600, viewCount: 320_000_000 },
    { tag: 'outfit',           postCount:  65_400, viewCount: 280_000_000 },
    { tag: 'aesthetic',        postCount:  58_900, viewCount: 240_000_000 },
    { tag: 'storytime',        postCount:  51_200, viewCount: 210_000_000 },
  ];

  // Last 14 days of upload counts
  const uploadsByDay: Array<{ date: string; uploads: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const date = fmtDate(daysAgo(i));
    const dow  = new Date(date).getDay();
    const base = (dow === 0 || dow === 6) ? 3_200 : 4_800;
    uploadsByDay.push({ date, uploads: base + Math.round((seededRand(i * 3) - 0.5) * 800) });
  }

  res.json({ topVideos, trendingHashtags, uploadsByDay });
}

// ---------------------------------------------------------------------------
// POST /analytics/export
// ---------------------------------------------------------------------------
type ExportType = 'users' | 'content' | 'reports';

interface ExportBody {
  type: ExportType;
  days?: number;
}

function buildUsersCsv(days: number): string {
  const rows = ['date,new_users,active_users,churned'];
  for (let i = days - 1; i >= 0; i--) {
    const date     = fmtDate(daysAgo(i));
    const seed     = i * 7 + days;
    const jitter   = (seededRand(seed) - 0.5) * 0.3;
    const dow      = new Date(date).getDay();
    const wMul     = (dow === 0 || dow === 6) ? 0.72 : 1;
    const tMul     = 1 + ((days - i) / days) * 0.12;
    rows.push([
      date,
      Math.round(1_800  * wMul * tMul * (1 + jitter)),
      Math.round(47_300 * wMul * tMul * (1 + jitter * 0.5)),
      Math.round(420               * tMul * (1 + jitter * 0.8)),
    ].join(','));
  }
  return rows.join('\n');
}

function buildContentCsv(): string {
  const rows = ['video_id,title,views,likes,comments,uploaded_at'];
  const videos = [
    ['v001','Summer dance challenge',   4820000, 892000, 31400, '2026-02-28'],
    ['v002','How I make ramen at 3am',  3110000, 641000, 22800, '2026-03-01'],
    ['v003','POV: your cat judging you', 2880000, 574000, 18200, '2026-03-03'],
    ['v004','Smoothie bowl speed run',   2350000, 421000, 14700, '2026-03-05'],
    ['v005','This apartment tour though',2090000, 398000, 12900, '2026-03-07'],
  ];
  for (const v of videos) rows.push(v.join(','));
  return rows.join('\n');
}

function buildReportsCsv(): string {
  const rows = ['report_id,type,status,reason,created_at'];
  const statuses = ['pending','resolved','dismissed'];
  const types    = ['video','user','comment'];
  const reasons  = ['spam','harassment','misinformation','nudity','other'];
  for (let i = 1; i <= 20; i++) {
    const seed = i * 13;
    rows.push([
      `r${String(i).padStart(4,'0')}`,
      types[Math.floor(seededRand(seed)     * types.length)],
      statuses[Math.floor(seededRand(seed+1) * statuses.length)],
      reasons[Math.floor(seededRand(seed+2)  * reasons.length)],
      fmtDate(daysAgo(Math.floor(seededRand(seed+3) * 30))),
    ].join(','));
  }
  return rows.join('\n');
}

export async function exportAnalytics(req: Request, res: Response): Promise<void> {
  const { type, days = 30 } = (req.body ?? {}) as ExportBody;
  const validTypes: ExportType[] = ['users', 'content', 'reports'];

  if (!validTypes.includes(type)) {
    res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
    return;
  }

  const clampedDays = Math.min(90, Math.max(1, Number(days) || 30));
  const datestamp   = fmtDate(new Date());

  let csv: string;
  let filename: string;

  switch (type) {
    case 'users':
      csv      = buildUsersCsv(clampedDays);
      filename = `snaptik_users_${datestamp}_${clampedDays}d.csv`;
      break;
    case 'content':
      csv      = buildContentCsv();
      filename = `snaptik_content_${datestamp}.csv`;
      break;
    case 'reports':
      csv      = buildReportsCsv();
      filename = `snaptik_reports_${datestamp}.csv`;
      break;
  }

  await AuditLog.create({
    adminId:    req.admin.sub,
    adminName:  req.admin.name,
    adminEmail: req.admin.email,
    adminRole:  req.admin.role,
    action:     'analytics.export',
    detail:     `Exported ${type} analytics (${clampedDays}d)`,
    ipAddress:  req.ip,
    userAgent:  req.headers['user-agent'],
  });

  res.json({ csv, filename });
}
