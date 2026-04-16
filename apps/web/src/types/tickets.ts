export type TicketStatus   = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'account' | 'billing' | 'technical' | 'content' | 'other';

export interface TicketMessage {
  _id:        string;
  authorId:   string;
  authorName: string;
  isAgent:    boolean;
  body:       string;
  createdAt:  string;
}

export interface Ticket {
  _id:        string;
  ticketId:   string;          // human-readable e.g. "TKT-1001"
  subject:    string;
  category:   TicketCategory;
  status:     TicketStatus;
  priority:   TicketPriority;
  user: {
    _id:      string;
    username: string;
    email:    string;
  };
  assignedTo: { _id: string; name: string } | null;
  messages:   TicketMessage[];
  createdAt:  string;
  updatedAt:  string;
}

export interface PaginatedTickets {
  data:        Ticket[];
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
}

// ─── UI config maps ────────────────────────────────────────────────────────────
export const STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; text: string }> = {
  open:        { label: 'Open',        bg: 'bg-blue-500/15',   text: 'text-blue-400'   },
  in_progress: { label: 'In Progress', bg: 'bg-yellow-500/15', text: 'text-yellow-400' },
  waiting:     { label: 'Waiting',     bg: 'bg-purple-500/15', text: 'text-purple-400' },
  resolved:    { label: 'Resolved',    bg: 'bg-green-500/15',  text: 'text-green-400'  },
  closed:      { label: 'Closed',      bg: 'bg-white/10',      text: 'text-white/40'   },
};

export const PRIORITY_CONFIG: Record<TicketPriority, { label: string; dot: string }> = {
  low:    { label: 'Low',    dot: 'bg-gray-400'   },
  medium: { label: 'Medium', dot: 'bg-blue-400'   },
  high:   { label: 'High',   dot: 'bg-orange-400' },
  urgent: { label: 'Urgent', dot: 'bg-red-500'    },
};

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  account:   'Account',
  billing:   'Billing',
  technical: 'Technical',
  content:   'Content',
  other:     'Other',
};
