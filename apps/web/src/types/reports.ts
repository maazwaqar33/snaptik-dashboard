export type ReportStatus   = 'pending' | 'in_review' | 'resolved';
export type ReportPriority = 'low' | 'medium' | 'high';
export type ReportType     = 'spam' | 'harassment' | 'misinformation' | 'nsfw' | 'violence' | 'copyright' | 'other';

export interface Report {
  _id:       string;
  reportId:  string;       // human-readable e.g. "RPT-1001"
  type:      ReportType;
  status:    ReportStatus;
  priority:  ReportPriority;
  subject: {
    type:    'user' | 'video' | 'comment';
    id:      string;
    display: string;       // e.g. "@username" or "Video title"
  };
  reporter: {
    _id:      string;
    username: string;
  };
  assignedTo: { _id: string; name: string } | undefined;
  createdAt:  string;
  resolvedAt: string | null;
}

export type KanbanColumns = {
  pending:   Report[];
  in_review: Report[];
  resolved:  Report[];
};

export interface PaginatedReports {
  data:       Report[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ─── UI config maps ────────────────────────────────────────────────────────────
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  spam:           'Spam',
  harassment:     'Harassment',
  misinformation: 'Misinformation',
  nsfw:           'NSFW',
  violence:       'Violence',
  copyright:      'Copyright',
  other:          'Other',
};

export const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  spam:           'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  harassment:     'border-orange-500/30 bg-orange-500/10 text-orange-400',
  misinformation: 'border-blue-500/30   bg-blue-500/10   text-blue-400',
  nsfw:           'border-pink-500/30   bg-pink-500/10   text-pink-400',
  violence:       'border-red-500/30    bg-red-500/10    text-red-400',
  copyright:      'border-purple-500/30 bg-purple-500/10 text-purple-400',
  other:          'border-white/20      bg-white/5       text-white/50',
};

export const PRIORITY_CONFIG: Record<ReportPriority, { label: string; dot: string }> = {
  low:    { label: 'Low',    dot: 'bg-gray-400'   },
  medium: { label: 'Medium', dot: 'bg-orange-400' },
  high:   { label: 'High',   dot: 'bg-red-500'    },
};
