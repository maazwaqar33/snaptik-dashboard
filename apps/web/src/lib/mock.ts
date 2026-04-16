import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// ─── Shared axios instance ─────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

const mock = new MockAdapter(apiClient, { delayResponse: 350 });

// ─── Helpers ───────────────────────────────────────────────────────────────────
const rnd   = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick  = <T>(arr: T[]): T => arr[rnd(0, arr.length - 1)]!;
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

// ─── Dashboard stats ───────────────────────────────────────────────────────────
mock.onGet('/analytics/dashboard').reply(200, {
  mau: 128_400, dau: 34_201, totalUsers: 512_388,
  flaggedContent: 1_247, openReports: 83, openTickets: 42,
  totalVideos: 3_812_900, processingVideos: 14,
});

// ─── Users ─────────────────────────────────────────────────────────────────────
const STATUSES   = ['active', 'warned', 'banned'] as const;
const mockUsers  = Array.from({ length: 60 }, (_, i) => ({
  _id:            `user-${i + 1}`,
  username:       `user${i + 1}`,
  email:          `user${i + 1}@example.com`,
  displayName:    `User ${i + 1}`,
  status:         pick(STATUSES),
  followersCount: rnd(10, 100_000),
  videoCount:     rnd(0, 500),
  createdAt:      daysAgo(rnd(0, 365)),
  lastActiveAt:   daysAgo(rnd(0, 30)),
  isVerified:     rnd(0, 1) === 1,
}));

mock.onGet(/\/users(\?.*)?$/).reply((cfg) => {
  const url   = cfg.url ?? '';
  const qp    = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  const page  = Number(cfg.params?.page  ?? qp.get('page')  ?? 1);
  const limit = Number(cfg.params?.limit ?? qp.get('limit') ?? 200);
  const start = (page - 1) * limit;
  const sliced = mockUsers.slice(start, start + limit);
  return [200, {
    // Support both access patterns used by different pages
    users: sliced,
    data:  sliced,
    total: mockUsers.length, page, limit,
    totalPages: Math.ceil(mockUsers.length / limit),
  }];
});
mock.onGet(/\/users\/.+/).reply(200, mockUsers[0]);
mock.onPatch(/\/users\/.+/).reply(200, { success: true });
mock.onPost(/\/users\/.+\/(ban|warn|unban)/).reply(200, { success: true });

// ─── Content (videos) ──────────────────────────────────────────────────────────
const FLAG_REASONS    = ['spam', 'nudity', 'violence', 'harassment', 'misinformation', 'copyright', 'other'] as const;
const CONTENT_STATUSES = ['pending', 'approved', 'removed', 'deferred'] as const;
const AI_LABELS_POOL  = ['explicit_content', 'violence_detected', 'spam_pattern', 'hate_speech', 'copyright_match', 'misleading_content', 'self_harm', 'graphic_violence'];

const mockVideos = Array.from({ length: 40 }, (_, i) => {
  const userId = rnd(1, 60);
  return {
    _id:          `video-${i + 1}`,
    videoUrl:     undefined,
    hlsUrl:       undefined,
    thumbnailUrl: `https://picsum.photos/seed/vid${i + 1}/320/180`,
    duration:     rnd(15, 300),
    status:       pick(CONTENT_STATUSES),
    flagReason:   pick(FLAG_REASONS),
    reportCount:  rnd(1, 150),
    aiConfidence: rnd(40, 98),
    aiLabels:     AI_LABELS_POOL.slice(0, rnd(1, 3)),
    flaggedAt:    daysAgo(rnd(0, 14)),
    uploadedAt:   daysAgo(rnd(14, 90)),
    uploader: {
      _id:         `user-${userId}`,
      username:    `user${userId}`,
      displayName: `User ${userId}`,
      isVerified:  rnd(0, 1) === 1,
    },
  };
});


mock.onGet('/content').reply((cfg) => {
  const page  = Number(cfg.params?.page  ?? 1);
  const limit = Number(cfg.params?.limit ?? 10);
  const start = (page - 1) * limit;
  return [200, { data: mockVideos.slice(start, start + limit), total: mockVideos.length, page, limit, totalPages: Math.ceil(mockVideos.length / limit) }];
});

// Moderation queue — used by content/page.tsx as /content/moderation-queue
// Return all items as queue (pending + recently actioned for demo purposes)
mock.onGet('/content/moderation-queue').reply(200, {
  items: mockVideos,
});

mock.onPatch(/\/content\/.+/).reply(200, { success: true });
mock.onDelete(/\/content\/.+/).reply(200, { success: true });

// ─── Reports (Kanban) ──────────────────────────────────────────────────────────
const REPORT_TYPES     = ['spam', 'harassment', 'misinformation', 'nsfw', 'violence', 'copyright', 'other'] as const;
const REPORT_STATUSES  = ['pending', 'in_review', 'resolved'] as const;
const REPORT_PRIORITIES = ['low', 'medium', 'high'] as const;
const SUBJECT_TYPES    = ['user', 'video', 'comment'] as const;

const mockReports = Array.from({ length: 36 }, (_, i) => {
  const subjectType = pick(SUBJECT_TYPES);
  return {
    _id:       `report-${i + 1}`,
    reportId: `RPT-${1000 + i}`,
    type:      pick(REPORT_TYPES),
    status:    pick(REPORT_STATUSES),
    priority:  pick(REPORT_PRIORITIES),
    subject: {
      type:    subjectType,
      id:      `subject-${rnd(1, 100)}`,
      display: subjectType === 'user' ? `@user${rnd(1, 60)}` : subjectType === 'video' ? `Video title #${rnd(1, 200)}` : `Comment by @user${rnd(1, 60)}`,
    },
    reporter:   { _id: `user-${rnd(1, 60)}`, username: `user${rnd(1, 60)}` },
    assignedTo: rnd(0, 1) ? { _id: 'admin-2', name: 'Moderator' } : undefined,
    createdAt:  daysAgo(rnd(0, 30)),
    resolvedAt: rnd(0, 1) ? daysAgo(rnd(0, 7)) : null,
  };
});

mock.onGet('/reports').reply((cfg) => {
  const page  = Number(cfg.params?.page  ?? 1);
  const limit = Number(cfg.params?.limit ?? 20);
  const start = (page - 1) * limit;
  return [200, { data: mockReports.slice(start, start + limit), total: mockReports.length, page, limit, totalPages: Math.ceil(mockReports.length / limit) }];
});

// Kanban endpoint returns data grouped by status
mock.onGet('/reports/kanban').reply(200, {
  pending:   mockReports.filter(r => r.status === 'pending'),
  in_review: mockReports.filter(r => r.status === 'in_review'),
  resolved:  mockReports.filter(r => r.status === 'resolved'),
});

mock.onPatch(/\/reports\/.+/).reply(200, { success: true });
mock.onPost(/\/reports\/.+\/assign/).reply(200, { success: true });

// ─── Tickets ───────────────────────────────────────────────────────────────────
const TICKET_STATUSES    = ['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const;
const TICKET_PRIORITIES  = ['low', 'medium', 'high', 'urgent'] as const;
const TICKET_CATEGORIES  = ['account', 'billing', 'technical', 'content', 'other'] as const;
const TICKET_SUBJECTS    = [
  'Cannot log in to my account', 'Video upload failing', 'Account incorrectly banned',
  'Billing charge not recognized', 'Profile picture not updating', 'Feed not loading',
  'Two-factor auth issue', 'Content removed incorrectly', 'App crashing on startup', 'Password reset not working',
];

const mockTickets = Array.from({ length: 30 }, (_, i) => {
  const userId = rnd(1, 60);
  return {
    _id:       `ticket-${i + 1}`,
    ticketId:  `TKT-${1000 + i}`,
    subject:   pick(TICKET_SUBJECTS),
    category:  pick(TICKET_CATEGORIES),
    status:    pick(TICKET_STATUSES),
    priority:  pick(TICKET_PRIORITIES),
    user: {
      _id:      `user-${userId}`,
      username: `user${userId}`,
      email:    `user${userId}@example.com`,
    },
    assignedTo: rnd(0, 1) ? { _id: 'admin-3', name: 'Support Agent' } : null,
    messages: [
      {
        _id:        `msg-${i}-1`,
        authorId:   `user-${userId}`,
        authorName: `user${userId}`,
        isAgent:    false,
        body:       'Hello, I need help with my account.',
        createdAt:  daysAgo(rnd(1, 14)),
      },
      {
        _id:        `msg-${i}-2`,
        authorId:   'admin-3',
        authorName: 'Support Agent',
        isAgent:    true,
        body:       'Hi! Thanks for reaching out. We\'re looking into this for you.',
        createdAt:  daysAgo(rnd(0, 1)),
      },
    ],
    createdAt:  daysAgo(rnd(1, 14)),
    updatedAt:  daysAgo(rnd(0, 2)),
  };
});

mock.onGet(/\/tickets(\?.*)?$/).reply((cfg) => {
  // Parse limit from either cfg.params or raw URL
  const url  = cfg.url ?? '';
  const qp   = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  const page  = Number(cfg.params?.page  ?? qp.get('page')  ?? 1);
  const limit = Number(cfg.params?.limit ?? qp.get('limit') ?? 30);
  const start = (page - 1) * limit;
  const sliced = mockTickets.slice(start, start + limit);
  return [200, {
    tickets: sliced,
    data:    sliced,
    total: mockTickets.length, page, limit,
    totalPages: Math.ceil(mockTickets.length / limit),
  }];
});
mock.onPatch(/\/tickets\/.+\/status/).reply(200, { success: true });
mock.onPost(/\/tickets\/.+\/reply/).reply(200, { success: true });

// ─── Analytics ─────────────────────────────────────────────────────────────────
mock.onGet(/\/analytics\/overview/).reply(200, {
  growthData: Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return { date: d.toISOString().split('T')[0], mau: rnd(100_000, 150_000), newUsers: rnd(500, 3000), users: rnd(1000, 5000), videos: rnd(500, 2000) };
  }),
  retentionData: Array.from({ length: 4 }, (_, i) => ({ day: i + 1, d1: rnd(50, 70), d7: rnd(30, 50), d30: rnd(15, 30) })),
});

mock.onGet('/analytics/growth').reply(200, {
  history: Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
    let prev = 10000;
    prev += rnd(-500, 2000);
    return { month: d.toLocaleString('default', { month: 'short' }), users: Math.max(0, prev) };
  }),
});

mock.onGet('/analytics/moderation').reply(200, {
  history: Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
    return { month: d.toLocaleString('default', { month: 'short' }), removed: rnd(20, 200), warned: rnd(10, 100) };
  }),
});

// ─── Audit logs ────────────────────────────────────────────────────────────────
const AUDIT_ACTIONS = ['user.ban', 'user.unban', 'user.warn', 'content.delete', 'content.flag', 'report.resolve', 'report.dismiss', 'ticket.close', 'admin.login', 'settings.update'];
const mockAuditLogs = Array.from({ length: 80 }, (_, i) => ({
  _id:        `audit-${i + 1}`,
  action:     pick(AUDIT_ACTIONS),
  adminEmail: pick(['admin@snaptik.com', 'moderator@snaptik.com', 'support@snaptik.com']),
  targetId:   `target-${rnd(1, 100)}`,
  targetType: pick(['user', 'video', 'report', 'ticket']),
  details:    'Action performed from admin panel.',
  ip:         `192.168.${rnd(0, 9)}.${rnd(1, 254)}`,
  createdAt:  daysAgo(rnd(0, 30)),
}));

mock.onGet('/audit').reply((cfg) => {
  const page  = Number(cfg.params?.page  ?? 1);
  const limit = Number(cfg.params?.limit ?? 20);
  const start = (page - 1) * limit;
  return [200, { data: mockAuditLogs.slice(start, start + limit), total: mockAuditLogs.length, page, limit, totalPages: Math.ceil(mockAuditLogs.length / limit) }];
});

// ─── Admins ────────────────────────────────────────────────────────────────────
const mockAdmins = [
  { _id: 'admin-1', email: 'admin@snaptik.com',     name: 'Super Admin',  role: 'super_admin', isActive: true, createdAt: '2024-01-01T00:00:00Z', lastLoginAt: daysAgo(0) },
  { _id: 'admin-2', email: 'moderator@snaptik.com', name: 'Moderator',    role: 'moderator',   isActive: true, createdAt: '2024-02-01T00:00:00Z', lastLoginAt: daysAgo(1) },
  { _id: 'admin-3', email: 'support@snaptik.com',   name: 'Support Agent',role: 'support',     isActive: true, createdAt: '2024-02-15T00:00:00Z', lastLoginAt: daysAgo(2) },
  { _id: 'admin-4', email: 'analyst@snaptik.com',   name: 'Analyst',      role: 'analyst',     isActive: true, createdAt: '2024-03-01T00:00:00Z', lastLoginAt: daysAgo(3) },
  { _id: 'admin-5', email: 'auditor@snaptik.com',   name: 'Auditor',      role: 'auditor',     isActive: true, createdAt: '2024-03-15T00:00:00Z', lastLoginAt: daysAgo(5) },
];

mock.onGet('/admins').reply(200, { admins: mockAdmins, data: mockAdmins, total: mockAdmins.length, page: 1, limit: 10, totalPages: 1 });
mock.onPost('/admins').reply(201, { success: true });
mock.onPatch(/\/admins\/.+/).reply(200, { success: true });
mock.onDelete(/\/admins\/.+/).reply(200, { success: true });
mock.onPost('/admins/invite').reply(200, { success: true });

// ─── Settings ──────────────────────────────────────────────────────────────────
mock.onGet('/settings').reply(200, {
  platformName: 'SnapTik', maintenanceMode: false, registrationEnabled: true,
  videoUploadEnabled: true, maxVideoSizeMb: 500, allowedRegions: ['US', 'EU', 'APAC'],
});
mock.onPatch('/settings').reply(200, { success: true });

// ─── Live ──────────────────────────────────────────────────────────────────────
mock.onGet('/live').reply(200, { activeSessions: rnd(50, 500), peakToday: rnd(500, 2000) });

// ─── Alerts ────────────────────────────────────────────────────────────────────
const ALERT_TYPES = ['new_report', 'video_flagged', 'ticket_created', 'user_banned'] as const;
mock.onGet('/alerts').reply(200, Array.from({ length: 8 }, (_, i) => ({
  id: `alert-${i + 1}`,
  type: pick(ALERT_TYPES),
  message: pick(['New report submitted', 'Video flagged for review', 'New support ticket', 'User banned for violations']),
  createdAt: new Date(Date.now() - rnd(0, 60) * 60_000).toISOString(),
})));

// ─── Auth (noop — handled by Zustand store) ────────────────────────────────────
mock.onPost('/auth/login').reply(200, {});
mock.onPost('/auth/logout').reply(200, {});
mock.onPost('/auth/forgot-password').reply(200, { message: 'If that email exists, a reset link has been sent.' });
mock.onPost('/auth/reset-password').reply(200, { success: true });

// ─── Catch-all passthrough ─────────────────────────────────────────────────────
mock.onAny().passThrough();
