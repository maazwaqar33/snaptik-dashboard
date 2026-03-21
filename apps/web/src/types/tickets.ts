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
