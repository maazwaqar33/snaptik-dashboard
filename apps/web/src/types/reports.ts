export type ReportType =
  | 'spam'
  | 'harassment'
  | 'impersonation'
  | 'hate_speech'
  | 'violence'
  | 'misinformation'
  | 'other';

export type ReportStatus = 'pending' | 'in_review' | 'resolved';
export type ReportPriority = 'high' | 'medium' | 'low';

export type ReportSubjectType = 'user' | 'video' | 'comment';

export interface Report {
  _id: string;
  /** Human-readable ID e.g. "RPT-0042" */
  reportId: string;
  type: ReportType;
  status: ReportStatus;
  priority: ReportPriority;
  subject: {
    type: ReportSubjectType;
    id: string;
    /** Username or video title */
    display: string;
  };
  reporter: {
    _id: string;
    username: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
  };
  description?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface KanbanColumns {
  pending: Report[];
  in_review: Report[];
  resolved: Report[];
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  spam:           'Spam',
  harassment:     'Harassment',
  impersonation:  'Impersonation',
  hate_speech:    'Hate Speech',
  violence:       'Violence',
  misinformation: 'Misinformation',
  other:          'Other',
};

export const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  spam:           'border-white/10  bg-white/5   text-muted',
  harassment:     'border-warning/30 bg-warning/10 text-warning',
  impersonation:  'border-accent/30  bg-accent/10  text-accent',
  hate_speech:    'border-danger/30  bg-danger/10  text-danger',
  violence:       'border-danger/30  bg-danger/10  text-danger',
  misinformation: 'border-warning/30 bg-warning/10 text-warning',
  other:          'border-white/10  bg-white/5   text-muted',
};

export const PRIORITY_CONFIG: Record<ReportPriority, { dot: string; label: string }> = {
  high:   { dot: 'bg-danger',  label: 'High' },
  medium: { dot: 'bg-warning', label: 'Medium' },
  low:    { dot: 'bg-muted',   label: 'Low' },
};

/** Mock moderator list for assignment dropdown */
export const MOCK_MODERATORS = [
  { _id: 'mod-1', name: 'Alex Chen' },
  { _id: 'mod-2', name: 'Sam Rivera' },
  { _id: 'mod-3', name: 'Jordan Kim' },
  { _id: 'mod-4', name: 'Taylor Smith' },
];
