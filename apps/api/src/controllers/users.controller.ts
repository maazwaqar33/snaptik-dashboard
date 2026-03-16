import type { Request, Response } from 'express';

// ---------------------------------------------------------------------------
// Stub data — realistic shapes for QA before real app collections have data
// ---------------------------------------------------------------------------

interface BanRecord {
  reason: string;
  bannedAt: string;
  bannedBy: string;
  unbannedAt?: string;
}

interface StubUser {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  isVerified: boolean;
  isBanned: boolean;
  followersCount: number;
  followingCount: number;
  uploadsCount: number;
  joinedAt: string;
  lastActiveAt: string;
  bio: string;
  avatarUrl: string;
  totalLikes: number;
  totalViews: number;
  warningCount: number;
  banReason?: string;
  banHistory: BanRecord[];
}

const STUB_USERS: StubUser[] = [
  {
    _id: 'usr_001',
    username: 'dance_queen_lena',
    email: 'lena.kowalski@example.com',
    displayName: 'Lena K.',
    isVerified: true,
    isBanned: false,
    followersCount: 412_300,
    followingCount: 890,
    uploadsCount: 214,
    joinedAt: '2024-02-14T10:30:00Z',
    lastActiveAt: '2026-03-14T18:45:00Z',
    bio: 'Dance. Create. Repeat. 🎶',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=lena',
    totalLikes: 3_820_000,
    totalViews: 21_500_000,
    warningCount: 0,
    banHistory: [],
  },
  {
    _id: 'usr_002',
    username: 'chef_mario_g',
    email: 'mario.garcia@example.com',
    displayName: 'Mario Garcia',
    isVerified: false,
    isBanned: false,
    followersCount: 87_600,
    followingCount: 302,
    uploadsCount: 78,
    joinedAt: '2024-06-01T08:00:00Z',
    lastActiveAt: '2026-03-13T12:10:00Z',
    bio: 'Home chef. Italian food obsessed.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=mario',
    totalLikes: 540_000,
    totalViews: 3_200_000,
    warningCount: 1,
    banHistory: [],
  },
  {
    _id: 'usr_003',
    username: 'spammer_xbot99',
    email: 'xbot99@tempmail.io',
    displayName: 'xbot99',
    isVerified: false,
    isBanned: true,
    followersCount: 12,
    followingCount: 14_000,
    uploadsCount: 3,
    joinedAt: '2026-01-20T03:00:00Z',
    lastActiveAt: '2026-01-22T05:30:00Z',
    bio: '',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=xbot99',
    totalLikes: 2,
    totalViews: 180,
    warningCount: 2,
    banReason: 'Mass spam follow/unfollow automation',
    banHistory: [
      {
        reason: 'Mass spam follow/unfollow automation',
        bannedAt: '2026-01-22T06:00:00Z',
        bannedBy: 'admin@snaptik.app',
      },
    ],
  },
  {
    _id: 'usr_004',
    username: 'fitness_yara',
    email: 'yara.hassan@example.com',
    displayName: 'Yara Hassan',
    isVerified: true,
    isBanned: false,
    followersCount: 1_230_000,
    followingCount: 450,
    uploadsCount: 621,
    joinedAt: '2023-09-10T14:00:00Z',
    lastActiveAt: '2026-03-15T07:20:00Z',
    bio: 'Certified PT. Daily workouts, no excuses.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=yara',
    totalLikes: 14_800_000,
    totalViews: 89_000_000,
    warningCount: 0,
    banHistory: [],
  },
  {
    _id: 'usr_005',
    username: 'comedy_bro_raj',
    email: 'raj.patel@example.com',
    displayName: 'Raj Patel',
    isVerified: false,
    isBanned: false,
    followersCount: 33_400,
    followingCount: 215,
    uploadsCount: 102,
    joinedAt: '2024-11-05T09:45:00Z',
    lastActiveAt: '2026-03-10T21:00:00Z',
    bio: 'Making the internet laugh one clip at a time.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=raj',
    totalLikes: 210_000,
    totalViews: 1_900_000,
    warningCount: 0,
    banHistory: [],
  },
  {
    _id: 'usr_006',
    username: 'travel_kai',
    email: 'kai.nguyen@example.com',
    displayName: 'Kai Nguyen',
    isVerified: true,
    isBanned: false,
    followersCount: 560_000,
    followingCount: 720,
    uploadsCount: 388,
    joinedAt: '2023-05-22T11:00:00Z',
    lastActiveAt: '2026-03-14T09:30:00Z',
    bio: '60 countries. Counting.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=kai',
    totalLikes: 6_400_000,
    totalViews: 38_000_000,
    warningCount: 0,
    banHistory: [],
  },
  {
    _id: 'usr_007',
    username: 'hatefull_user77',
    email: 'hateful77@anon.net',
    displayName: 'user77',
    isVerified: false,
    isBanned: true,
    followersCount: 45,
    followingCount: 90,
    uploadsCount: 11,
    joinedAt: '2025-08-01T00:00:00Z',
    lastActiveAt: '2025-12-10T14:20:00Z',
    bio: '',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=user77',
    totalLikes: 30,
    totalViews: 900,
    warningCount: 3,
    banReason: 'Repeated harassment and hate speech after 3 warnings',
    banHistory: [
      {
        reason: 'First harassment warning',
        bannedAt: '2025-09-15T10:00:00Z',
        bannedBy: 'moderator@snaptik.app',
        unbannedAt: '2025-09-22T10:00:00Z',
      },
      {
        reason: 'Repeated harassment after reinstatement',
        bannedAt: '2025-11-01T12:00:00Z',
        bannedBy: 'admin@snaptik.app',
        unbannedAt: '2025-11-15T12:00:00Z',
      },
      {
        reason: 'Repeated harassment and hate speech after 3 warnings',
        bannedAt: '2025-12-10T14:30:00Z',
        bannedBy: 'admin@snaptik.app',
      },
    ],
  },
  {
    _id: 'usr_008',
    username: 'bookworm_sofia',
    email: 'sofia.andersson@example.com',
    displayName: 'Sofia A.',
    isVerified: false,
    isBanned: false,
    followersCount: 19_800,
    followingCount: 430,
    uploadsCount: 55,
    joinedAt: '2025-03-18T16:00:00Z',
    lastActiveAt: '2026-03-12T20:15:00Z',
    bio: 'BookTok. 200+ books a year.',
    avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=sofia',
    totalLikes: 98_000,
    totalViews: 760_000,
    warningCount: 0,
    banHistory: [],
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

// ---------------------------------------------------------------------------
// GET /users
// ---------------------------------------------------------------------------
export async function listUsers(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = paginationParams(req.query);
  const search = String(req.query.search ?? '').toLowerCase().trim();
  const status = req.query.status as string | undefined;

  let filtered = STUB_USERS.slice();

  if (search) {
    filtered = filtered.filter(
      (u) =>
        u.username.includes(search) ||
        u.displayName.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search),
    );
  }

  if (status === 'banned')   filtered = filtered.filter((u) => u.isBanned);
  if (status === 'active')   filtered = filtered.filter((u) => !u.isBanned);
  if (status === 'verified') filtered = filtered.filter((u) => u.isVerified && !u.isBanned);

  const total = filtered.length;
  const users = filtered.slice(skip, skip + limit).map(
    ({ _id, username, email, displayName, isVerified, isBanned, followersCount, uploadsCount, joinedAt, lastActiveAt }) => ({
      _id, username, email, displayName, isVerified, isBanned,
      followersCount, uploadsCount, joinedAt, lastActiveAt,
    }),
  );

  res.json({ users, total, page, limit });
}

// ---------------------------------------------------------------------------
// GET /users/:id
// ---------------------------------------------------------------------------
export async function getUser(req: Request, res: Response): Promise<void> {
  const user = STUB_USERS.find((u) => u._id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
}

// ---------------------------------------------------------------------------
// PATCH /users/:id
// ---------------------------------------------------------------------------
export async function updateUser(req: Request, res: Response): Promise<void> {
  const { action, reason } = req.body ?? {};
  const user = STUB_USERS.find((u) => u._id === req.params.id);

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
      user.isBanned   = true;
      user.banReason  = reason ?? 'Policy violation';
      user.banHistory.push({
        reason: reason ?? 'Policy violation',
        bannedAt: new Date().toISOString(),
        bannedBy: req.admin.email,
      });
      message = 'User banned';
      break;

    case 'unban':
      user.isBanned  = false;
      user.banReason = undefined;
      if (user.banHistory.length > 0) {
        user.banHistory[user.banHistory.length - 1].unbannedAt = new Date().toISOString();
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

  res.json({
    message,
    user: { _id: user._id, isBanned: user.isBanned, isVerified: user.isVerified },
  });
}

// ---------------------------------------------------------------------------
// DELETE /users/:id
// ---------------------------------------------------------------------------
export async function deleteUser(req: Request, res: Response): Promise<void> {
  const user = STUB_USERS.find((u) => u._id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Stub: in production this would queue a GDPR deletion job
  res.json({
    message: 'User queued for deletion',
    _id: user._id,
    scheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30-day grace
    requestedBy: req.admin.email,
  });
}

// ---------------------------------------------------------------------------
// POST /users/bulk-action
// ---------------------------------------------------------------------------
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
    const user = STUB_USERS.find((u) => u._id === id);
    if (!user) continue;

    if ((action as BulkAction) === 'ban') {
      user.isBanned  = true;
      user.banReason = reason ?? 'Bulk policy action';
      user.banHistory.push({
        reason: reason ?? 'Bulk policy action',
        bannedAt: new Date().toISOString(),
        bannedBy: req.admin.email,
      });
    } else {
      user.warningCount += 1;
    }

    affected++;
  }

  const actionLabel = (action as BulkAction) === 'ban' ? 'banned' : 'warned';
  res.json({ affected, message: `${affected} user(s) ${actionLabel}` });
}
