export type ModerationStatus = 'pending' | 'approved' | 'removed' | 'deferred';
export type FlagReason = 'spam' | 'nudity' | 'violence' | 'harassment' | 'misinformation' | 'copyright' | 'other';

export interface FlaggedVideo {
  _id:          string;
  videoUrl?:    string;
  hlsUrl?:      string;
  thumbnailUrl?: string;
  duration:     number;   // seconds
  status:       ModerationStatus;
  flagReason:   FlagReason;
  reportCount:  number;
  aiConfidence: number;   // 0–100
  aiLabels:     string[];
  flaggedAt:    string;
  uploadedAt:   string;
  uploader: {
    _id:         string;
    username:    string;
    displayName: string;
    isVerified:  boolean;
  };
}

export const FLAG_REASON_LABELS: Record<FlagReason, string> = {
  spam:           'Spam',
  nudity:         'Nudity/Sexual',
  violence:       'Violence',
  harassment:     'Harassment',
  misinformation: 'Misinformation',
  copyright:      'Copyright',
  other:          'Other',
};

export const FLAG_REASON_COLORS: Record<FlagReason, string> = {
  spam:           'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  nudity:         'border-pink-500/30   bg-pink-500/10   text-pink-400',
  violence:       'border-red-500/30    bg-red-500/10    text-red-400',
  harassment:     'border-orange-500/30 bg-orange-500/10 text-orange-400',
  misinformation: 'border-blue-500/30   bg-blue-500/10   text-blue-400',
  copyright:      'border-purple-500/30 bg-purple-500/10 text-purple-400',
  other:          'border-white/20      bg-white/5       text-white/50',
};

export interface PaginatedContent {
  data:       FlaggedVideo[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}
