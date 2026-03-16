import type { Request, Response } from 'express';

// ---------------------------------------------------------------------------
// Stub data — realistic shapes for QA before real app collections have data
// ---------------------------------------------------------------------------

type ReportType      = 'spam' | 'harassment' | 'nsfw' | 'misinformation' | 'other';
type ReportStatus    = 'pending' | 'in_review' | 'resolved';
type TargetType      = 'video' | 'comment' | 'user';
type ResolveAction   = 'warn' | 'remove' | 'dismiss';

interface AssignedAdmin {
  _id: string;
  name: string;
  email: string;
}

interface StubReport {
  _id: string;
  type: ReportType;
  status: ReportStatus;
  reporterId: string;
  reporterUsername: string;
  targetType: TargetType;
  targetId: string;
  reason: string;
  notes?: string;
  assignedTo?: AssignedAdmin;
  resolvedAction?: ResolveAction;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// A small pool of fake admins for the assignedTo field
const ADMIN_POOL: AssignedAdmin[] = [
  { _id: 'adm_001', name: 'Alex Kim',    email: 'alex.kim@snaptik.app' },
  { _id: 'adm_002', name: 'Priya Nair',  email: 'priya.nair@snaptik.app' },
  { _id: 'adm_003', name: 'Tom Eriksen', email: 'tom.eriksen@snaptik.app' },
];

const STUB_REPORTS: StubReport[] = [
  {
    _id: 'rep_001',
    type: 'spam',
    status: 'pending',
    reporterId: 'usr_004',
    reporterUsername: 'fitness_yara',
    targetType: 'comment',
    targetId: 'cnt_005',
    reason: 'This comment is pure spam — promoting get-rich-quick scheme.',
    createdAt: '2026-01-21T15:00:00Z',
    updatedAt: '2026-01-21T15:00:00Z',
  },
  {
    _id: 'rep_002',
    type: 'harassment',
    status: 'in_review',
    reporterId: 'usr_006',
    reporterUsername: 'travel_kai',
    targetType: 'user',
    targetId: 'usr_007',
    reason: 'User keeps sending hateful DMs and commenting on my videos with slurs.',
    notes: 'Multiple reports from different users against same account — escalate.',
    assignedTo: ADMIN_POOL[0],
    createdAt: '2025-12-08T10:00:00Z',
    updatedAt: '2025-12-09T14:00:00Z',
  },
  {
    _id: 'rep_003',
    type: 'nsfw',
    status: 'resolved',
    reporterId: 'usr_002',
    reporterUsername: 'chef_mario_g',
    targetType: 'video',
    targetId: 'cnt_007',
    reason: 'Dance video seems inappropriate — too suggestive for general audience.',
    notes: 'Reviewed — content is within community guidelines. No action taken.',
    assignedTo: ADMIN_POOL[1],
    resolvedAction: 'dismiss',
    resolvedAt: '2026-03-14T11:00:00Z',
    resolvedBy: ADMIN_POOL[1].email,
    createdAt: '2026-03-13T21:00:00Z',
    updatedAt: '2026-03-14T11:00:00Z',
  },
  {
    _id: 'rep_004',
    type: 'misinformation',
    status: 'pending',
    reporterId: 'usr_008',
    reporterUsername: 'bookworm_sofia',
    targetType: 'video',
    targetId: 'cnt_006',
    reason: 'Video claims pasta takes 20 min but requires 1hr dough rest — clickbait title.',
    createdAt: '2026-02-15T09:30:00Z',
    updatedAt: '2026-02-15T09:30:00Z',
  },
  {
    _id: 'rep_005',
    type: 'nsfw',
    status: 'resolved',
    reporterId: 'usr_005',
    reporterUsername: 'comedy_bro_raj',
    targetType: 'video',
    targetId: 'cnt_002',
    reason: 'Video contains extremely hateful content targeting ethnic groups.',
    notes: 'Confirmed hate speech. Video removed and user permanently banned.',
    assignedTo: ADMIN_POOL[2],
    resolvedAction: 'remove',
    resolvedAt: '2025-12-10T09:15:00Z',
    resolvedBy: ADMIN_POOL[2].email,
    createdAt: '2025-12-09T22:00:00Z',
    updatedAt: '2025-12-10T09:15:00Z',
  },
  {
    _id: 'rep_006',
    type: 'other',
    status: 'pending',
    reporterId: 'usr_001',
    reporterUsername: 'dance_queen_lena',
    targetType: 'video',
    targetId: 'cnt_001',
    reason: 'Someone copied my original choreography and posted it as their own without credit.',
    createdAt: '2026-03-05T14:00:00Z',
    updatedAt: '2026-03-05T14:00:00Z',
  },
  {
    _id: 'rep_007',
    type: 'harassment',
    status: 'in_review',
    reporterId: 'usr_004',
    reporterUsername: 'fitness_yara',
    targetType: 'comment',
    targetId: 'cnt_008',
    reason: 'Xenophobic comment under my workout video.',
    assignedTo: ADMIN_POOL[0],
    createdAt: '2025-11-30T09:00:00Z',
    updatedAt: '2025-12-01T10:00:00Z',
  },
  {
    _id: 'rep_008',
    type: 'spam',
    status: 'resolved',
    reporterId: 'usr_006',
    reporterUsername: 'travel_kai',
    targetType: 'user',
    targetId: 'usr_003',
    reason: 'Bot account — followed then unfollowed me 5 times in an hour. Pure automation.',
    notes: 'Confirmed bot behavior via log analysis. Account permanently banned.',
    assignedTo: ADMIN_POOL[1],
    resolvedAction: 'remove',
    resolvedAt: '2026-01-22T06:05:00Z',
    resolvedBy: ADMIN_POOL[1].email,
    createdAt: '2026-01-21T16:00:00Z',
    updatedAt: '2026-01-22T06:05:00Z',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paginationParams(query: Record<string, unknown>): { page: number; limit: number; skip: number } {
  const page  = Math.max(1, parseInt(String(query.page  ?? 1),  10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 20), 10)));
  return { page, limit, skip: (page - 1) * limit };
}

function findAdminById(id: string): AssignedAdmin | undefined {
  return ADMIN_POOL.find((a) => a._id === id);
}

// ---------------------------------------------------------------------------
// GET /reports
// ---------------------------------------------------------------------------
export async function listReports(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = paginationParams(req.query);
  const status = req.query.status as ReportStatus | undefined;
  const type   = req.query.type   as ReportType   | undefined;

  let filtered = STUB_REPORTS.slice();

  if (status) filtered = filtered.filter((r) => r.status === status);
  if (type)   filtered = filtered.filter((r) => r.type   === type);

  // Most recent first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total   = filtered.length;
  const reports = filtered.slice(skip, skip + limit);

  res.json({ reports, total, page, limit });
}

// ---------------------------------------------------------------------------
// GET /reports/:id
// ---------------------------------------------------------------------------
export async function getReport(req: Request, res: Response): Promise<void> {
  const report = STUB_REPORTS.find((r) => r._id === req.params.id);
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }
  res.json(report);
}

// ---------------------------------------------------------------------------
// PATCH /reports/:id/resolve
// ---------------------------------------------------------------------------
export async function resolveReport(req: Request, res: Response): Promise<void> {
  const { action, notes } = req.body ?? {};
  const report = STUB_REPORTS.find((r) => r._id === req.params.id);

  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  const allowed: ResolveAction[] = ['warn', 'remove', 'dismiss'];
  if (!allowed.includes(action as ResolveAction)) {
    res.status(400).json({ error: `action must be one of: ${allowed.join(', ')}` });
    return;
  }

  const now = new Date().toISOString();

  report.status         = 'resolved';
  report.resolvedAction = action as ResolveAction;
  report.resolvedAt     = now;
  report.resolvedBy     = req.admin.email;
  report.updatedAt      = now;
  if (notes) report.notes = notes;

  const actionMessages: Record<ResolveAction, string> = {
    warn:    'User warned and report resolved',
    remove:  'Content removed and report resolved',
    dismiss: 'Report dismissed — no action taken',
  };

  res.json({
    message: actionMessages[action as ResolveAction],
    report,
  });
}

// ---------------------------------------------------------------------------
// PATCH /reports/:id/assign
// ---------------------------------------------------------------------------
export async function assignReport(req: Request, res: Response): Promise<void> {
  const { adminId } = req.body ?? {};
  const report = STUB_REPORTS.find((r) => r._id === req.params.id);

  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  if (!adminId) {
    res.status(400).json({ error: 'adminId is required' });
    return;
  }

  // Try to find the admin in the stub pool; if not found (e.g. a real admin ID
  // passed by the front-end) fall back to the requester's info from the JWT.
  const assignee = findAdminById(adminId) ?? {
    _id:   req.admin.sub,
    name:  req.admin.name,
    email: req.admin.email,
  };

  report.assignedTo = assignee;
  report.status     = report.status === 'pending' ? 'in_review' : report.status;
  report.updatedAt  = new Date().toISOString();

  res.json({
    message: `Report assigned to ${assignee.name}`,
    report,
  });
}

// ---------------------------------------------------------------------------
// GET /reports/kanban — returns reports grouped by status for drag-and-drop board
// ---------------------------------------------------------------------------
export async function getKanban(_req: Request, res: Response): Promise<void> {
  const columns: Record<string, typeof STUB_REPORTS> = {
    pending:   [],
    in_review: [],
    resolved:  [],
  };
  for (const r of STUB_REPORTS) {
    if (columns[r.status]) columns[r.status].push(r);
  }
  res.json(columns);
}

// ---------------------------------------------------------------------------
// PATCH /reports/:id/status — updates status of a report
// ---------------------------------------------------------------------------
export async function updateReportStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body ?? {};
  const validStatuses = ['pending', 'in_review', 'resolved'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    return;
  }
  const report = STUB_REPORTS.find((r) => r._id === req.params.id);
  if (!report) { res.status(404).json({ error: 'Report not found' }); return; }
  report.status = status as 'pending' | 'in_review' | 'resolved';
  report.updatedAt = new Date().toISOString();
  res.json({ success: true, report });
}
