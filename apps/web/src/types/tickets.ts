export type TicketStatus   = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TicketCategory = 'account' | 'billing' | 'content' | 'bug' | 'safety' | 'other';

export interface TicketMessage {
  _id: string;
  authorId: string;
  authorName: string;
  isAgent: boolean;
  body: string;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  ticketId: string; // TKT-0001
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  user: { _id: string; username: string; email: string };
  assignedTo?: { _id: string; name: string };
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  firstReplyAt?: string;
  /** SLA breach if unresolved after this */
  slaDeadline?: string;
}

// ─── Display config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; text: string }> = {
  open:        { label: 'Open',        bg: 'bg-[#007AFF]/20', text: 'text-[#007AFF]' },
  in_progress: { label: 'In Progress', bg: 'bg-[#FF9500]/15', text: 'text-[#FF9500]' },
  waiting:     { label: 'Waiting',     bg: 'bg-white/10',      text: 'text-[#AAAAAA]' },
  resolved:    { label: 'Resolved',    bg: 'bg-[#34C759]/15', text: 'text-[#34C759]' },
  closed:      { label: 'Closed',      bg: 'bg-white/5',       text: 'text-[#666]'    },
};

export const PRIORITY_CONFIG: Record<TicketPriority, { label: string; dot: string }> = {
  urgent: { label: 'Urgent', dot: 'bg-[#FF3B30]' },
  high:   { label: 'High',   dot: 'bg-[#FF9500]' },
  medium: { label: 'Medium', dot: 'bg-[#007AFF]' },
  low:    { label: 'Low',    dot: 'bg-[#AAAAAA]' },
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  account: 'Account',
  billing: 'Billing',
  content: 'Content',
  bug:     'Bug',
  safety:  'Safety',
  other:   'Other',
};

// ─── Mock seed ────────────────────────────────────────────────────────────────

const SUBJECTS = [
  'Cannot log into my account',
  'Video upload stuck at 99%',
  'Account banned without warning',
  'Payment charged twice this month',
  'Profile picture not updating',
  'Comments disabled on my videos',
  'Follower count dropped suddenly',
  'Live stream keeps disconnecting',
  'Cannot reset my password',
  'Wrong video appearing on my profile',
];

const STATUSES: TicketStatus[]   = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
const PRIORITIES: TicketPriority[] = ['urgent', 'high', 'medium', 'medium', 'low'];
const CATEGORIES: TicketCategory[] = ['account', 'bug', 'content', 'billing', 'safety', 'other'];

export function seedTickets(n = 40): Ticket[] {
  return Array.from({ length: n }, (_, i) => {
    const createdAt = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000);
    const status    = STATUSES[i % STATUSES.length]!;
    return {
      _id:       `tkt-${i}`,
      ticketId:  `TKT-${String(i + 1).padStart(4, '0')}`,
      subject:   SUBJECTS[i % SUBJECTS.length]!,
      status,
      priority:  PRIORITIES[i % PRIORITIES.length]!,
      category:  CATEGORIES[i % CATEGORIES.length]!,
      user: {
        _id:      `usr-${i}`,
        username: `user_${i + 1}`,
        email:    `user${i + 1}@example.com`,
      },
      assignedTo: status !== 'open'
        ? { _id: 'agent-1', name: 'Alex Chen' }
        : undefined,
      messages: [
        {
          _id:        `msg-${i}-0`,
          authorId:   `usr-${i}`,
          authorName: `user_${i + 1}`,
          isAgent:    false,
          body:       'Hi, I need help with my account. ' + SUBJECTS[i % SUBJECTS.length],
          createdAt:  createdAt.toISOString(),
        },
        ...(status !== 'open'
          ? [{
              _id:        `msg-${i}-1`,
              authorId:   'agent-1',
              authorName: 'Alex Chen',
              isAgent:    true,
              body:       "Thanks for reaching out! I'm looking into this right now and will update you shortly.",
              createdAt:  new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString(),
            }]
          : []),
      ],
      createdAt: createdAt.toISOString(),
      updatedAt: new Date(createdAt.getTime() + Math.random() * 4 * 60 * 60 * 1000).toISOString(),
      resolvedAt: status === 'resolved' || status === 'closed'
        ? new Date(createdAt.getTime() + Math.random() * 48 * 60 * 60 * 1000).toISOString()
        : undefined,
      slaDeadline: status === 'open' || status === 'in_progress'
        ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    };
  });
}
