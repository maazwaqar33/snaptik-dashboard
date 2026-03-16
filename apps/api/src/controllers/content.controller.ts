import type { Request, Response } from 'express';

// ---------------------------------------------------------------------------
// Stub data — realistic shapes for QA before real app collections have data
// ---------------------------------------------------------------------------

type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'deleted';
type ContentType = 'video' | 'comment';

interface AiFlags {
  nsfw: number;
  violence: number;
  spam: number;
  hateSpeech: number;
}

interface StubContentItem {
  _id: string;
  type: ContentType;
  authorId: string;
  authorUsername: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  aiFlags: AiFlags;
  createdAt: string;
  moderationStatus: ModerationStatus;
  moderatedAt?: string;
  moderatedBy?: string;
  moderationReason?: string;
}

const STUB_CONTENT: StubContentItem[] = [
  {
    _id: 'cnt_001',
    type: 'video',
    authorId: 'usr_003',
    authorUsername: 'spammer_xbot99',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/cnt001/400/700',
    caption: 'Follow me for FREE iPhone!! Click link in bio 💸💸💸',
    aiFlags: { nsfw: 0.04, violence: 0.01, spam: 0.97, hateSpeech: 0.02 },
    createdAt: '2026-01-21T12:00:00Z',
    moderationStatus: 'pending',
  },
  {
    _id: 'cnt_002',
    type: 'video',
    authorId: 'usr_007',
    authorUsername: 'hatefull_user77',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/cnt002/400/700',
    caption: 'These people should not exist [slur removed by filter]',
    aiFlags: { nsfw: 0.12, violence: 0.31, spam: 0.05, hateSpeech: 0.91 },
    createdAt: '2025-12-09T21:00:00Z',
    moderationStatus: 'rejected',
    moderatedAt: '2025-12-10T09:00:00Z',
    moderatedBy: 'moderator@snaptik.app',
    moderationReason: 'Hate speech — targeted slurs',
  },
  {
    _id: 'cnt_003',
    type: 'video',
    authorId: 'usr_005',
    authorUsername: 'comedy_bro_raj',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/cnt003/400/700',
    caption: 'When bae says "we need to talk" 💀',
    aiFlags: { nsfw: 0.08, violence: 0.02, spam: 0.03, hateSpeech: 0.01 },
    createdAt: '2026-03-10T15:00:00Z',
    moderationStatus: 'approved',
    moderatedAt: '2026-03-10T16:30:00Z',
    moderatedBy: 'moderator@snaptik.app',
    moderationReason: 'Review: false positive — comedy content',
  },
  {
    _id: 'cnt_004',
    type: 'video',
    authorId: 'usr_008',
    authorUsername: 'bookworm_sofia',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/cnt004/400/700',
    caption: 'Reading wrap-up: 15 books in February (spoiler free)',
    aiFlags: { nsfw: 0.01, violence: 0.00, spam: 0.02, hateSpeech: 0.00 },
    createdAt: '2026-03-01T10:00:00Z',
    moderationStatus: 'pending',
  },
  {
    _id: 'cnt_005',
    type: 'comment',
    authorId: 'usr_003',
    authorUsername: 'spammer_xbot99',
    videoUrl: '',
    thumbnailUrl: '',
    caption: 'DM me for easy money, make $500/day from home guaranteed!!!',
    aiFlags: { nsfw: 0.02, violence: 0.00, spam: 0.99, hateSpeech: 0.01 },
    createdAt: '2026-01-21T14:30:00Z',
    moderationStatus: 'pending',
  },
  {
    _id: 'cnt_006',
    type: 'video',
    authorId: 'usr_002',
    authorUsername: 'chef_mario_g',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/cnt006/400/700',
    caption: 'Homemade pasta from scratch in 20 minutes',
    aiFlags: { nsfw: 0.03, violence: 0.01, spam: 0.01, hateSpeech: 0.00 },
    createdAt: '2026-02-14T18:00:00Z',
    moderationStatus: 'approved',
    moderatedAt: '2026-02-14T19:00:00Z',
    moderatedBy: 'moderator@snaptik.app',
    moderationReason: 'Reviewed — kitchen knife use, no concern',
  },
  {
    _id: 'cnt_007',
    type: 'video',
    authorId: 'usr_001',
    authorUsername: 'dance_queen_lena',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    thumbnailUrl: 'https://picsum.photos/seed/cnt007/400/700',
    caption: 'New choreo drop — which outfit is better? A or B?',
    aiFlags: { nsfw: 0.41, violence: 0.00, spam: 0.02, hateSpeech: 0.00 },
    createdAt: '2026-03-13T20:00:00Z',
    moderationStatus: 'pending',
  },
  {
    _id: 'cnt_008',
    type: 'comment',
    authorId: 'usr_007',
    authorUsername: 'hatefull_user77',
    videoUrl: '',
    thumbnailUrl: '',
    caption: 'Go back to your country [xenophobic remark]',
    aiFlags: { nsfw: 0.05, violence: 0.15, spam: 0.02, hateSpeech: 0.88 },
    createdAt: '2025-11-30T08:00:00Z',
    moderationStatus: 'rejected',
    moderatedAt: '2025-11-30T09:15:00Z',
    moderatedBy: 'admin@snaptik.app',
    moderationReason: 'Xenophobic harassment',
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
// GET /content/flagged
// ---------------------------------------------------------------------------
export async function listFlagged(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = paginationParams(req.query);
  const status = req.query.status as ModerationStatus | undefined;
  const minConfidence = parseFloat(String(req.query.minConfidence ?? 0));

  let filtered = STUB_CONTENT.slice();

  if (status) {
    filtered = filtered.filter((c) => c.moderationStatus === status);
  }

  if (minConfidence > 0) {
    filtered = filtered.filter((c) => {
      const maxFlag = Math.max(c.aiFlags.nsfw, c.aiFlags.violence, c.aiFlags.spam, c.aiFlags.hateSpeech);
      return maxFlag >= minConfidence;
    });
  }

  const total = filtered.length;
  const items = filtered.slice(skip, skip + limit);

  res.json({ items, total, page, limit });
}

// ---------------------------------------------------------------------------
// GET /content/:id/signed-url
// ---------------------------------------------------------------------------
export async function getSignedUrl(req: Request, res: Response): Promise<void> {
  const item = STUB_CONTENT.find((c) => c._id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Content item not found' });
    return;
  }

  // In production this would generate a CloudFront signed URL with a TTL.
  // For local dev we return the raw URL directly.
  res.json({
    signedUrl: item.videoUrl || null,
    expiresIn: 300,
    note: 'CloudFront signing not configured in local dev — raw URL returned',
  });
}

// ---------------------------------------------------------------------------
// PATCH /content/:id/moderate
// ---------------------------------------------------------------------------
export async function moderateContent(req: Request, res: Response): Promise<void> {
  const { action, reason } = req.body ?? {};
  const item = STUB_CONTENT.find((c) => c._id === req.params.id);

  if (!item) {
    res.status(404).json({ error: 'Content item not found' });
    return;
  }

  const allowed = ['approve', 'reject', 'delete'] as const;
  type ModAction = (typeof allowed)[number];

  if (!allowed.includes(action as ModAction)) {
    res.status(400).json({ error: `action must be one of: ${allowed.join(', ')}` });
    return;
  }

  const statusMap: Record<ModAction, ModerationStatus> = {
    approve: 'approved',
    reject: 'rejected',
    delete: 'deleted',
  };

  item.moderationStatus = statusMap[action as ModAction];
  item.moderatedAt      = new Date().toISOString();
  item.moderatedBy      = req.admin.email;
  if (reason) item.moderationReason = reason;

  res.json({
    message: `Content ${action}d successfully`,
    item: { _id: item._id, moderationStatus: item.moderationStatus },
  });
}

// ---------------------------------------------------------------------------
// POST /content/bulk-moderate
// ---------------------------------------------------------------------------
export async function bulkModerate(req: Request, res: Response): Promise<void> {
  const { ids, action, reason } = req.body ?? {};

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids must be a non-empty array' });
    return;
  }

  const allowed = ['approve', 'reject', 'delete'] as const;
  type ModAction = (typeof allowed)[number];

  if (!allowed.includes(action as ModAction)) {
    res.status(400).json({ error: `action must be one of: ${allowed.join(', ')}` });
    return;
  }

  const statusMap: Record<ModAction, ModerationStatus> = {
    approve: 'approved',
    reject: 'rejected',
    delete: 'deleted',
  };

  let affected = 0;

  for (const id of ids as string[]) {
    const item = STUB_CONTENT.find((c) => c._id === id);
    if (!item) continue;

    item.moderationStatus = statusMap[action as ModAction];
    item.moderatedAt      = new Date().toISOString();
    item.moderatedBy      = req.admin.email;
    if (reason) item.moderationReason = reason;

    affected++;
  }

  const actionLabel = (action as ModAction) === 'delete' ? 'deleted' : `${action}d`;
  res.json({ affected, message: `${affected} item(s) ${actionLabel}` });
}

// ---------------------------------------------------------------------------
// POST /content/:id/approve
// ---------------------------------------------------------------------------
export async function approveContent(req: Request, res: Response): Promise<void> {
  const item = STUB_CONTENT.find((c) => c._id === req.params.id);
  if (!item) { res.status(404).json({ error: 'Content item not found' }); return; }
  item.moderationStatus = 'approved';
  item.moderatedAt = new Date().toISOString();
  item.moderatedBy = req.admin?.email ?? 'unknown';
  res.json({ success: true, item });
}

// ---------------------------------------------------------------------------
// POST /content/:id/remove
// ---------------------------------------------------------------------------
export async function removeContent(req: Request, res: Response): Promise<void> {
  const { reason } = req.body ?? {};
  const item = STUB_CONTENT.find((c) => c._id === req.params.id);
  if (!item) { res.status(404).json({ error: 'Content item not found' }); return; }
  item.moderationStatus = 'rejected';
  item.moderatedAt = new Date().toISOString();
  item.moderatedBy = req.admin?.email ?? 'unknown';
  if (reason) item.moderationReason = reason;
  res.json({ success: true, item });
}

// ---------------------------------------------------------------------------
// POST /content/:id/defer
// ---------------------------------------------------------------------------
export async function deferContent(req: Request, res: Response): Promise<void> {
  const item = STUB_CONTENT.find((c) => c._id === req.params.id);
  if (!item) { res.status(404).json({ error: 'Content item not found' }); return; }
  item.moderationStatus = 'pending'; // keep pending, just note deferred
  item.moderatedAt = new Date().toISOString();
  item.moderatedBy = req.admin?.email ?? 'unknown';
  item.moderationReason = 'Deferred for further review';
  res.json({ success: true, item });
}
