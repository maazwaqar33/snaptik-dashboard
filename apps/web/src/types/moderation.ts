export type FlagReason =
  | 'hate_speech'
  | 'nudity'
  | 'violence'
  | 'spam'
  | 'misinformation'
  | 'harassment'
  | 'other';

export type ModerationStatus = 'pending' | 'approved' | 'removed' | 'deferred';

export interface FlaggedVideo {
  _id: string;
  videoId: string;
  /** Display title — may be undefined for untitled videos */
  title?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  hlsUrl?: string;
  /** Duration in seconds */
  duration: number;
  uploadedAt: string;
  flaggedAt: string;
  uploader: {
    _id: string;
    username: string;
    displayName: string;
    isVerified: boolean;
  };
  flagReason: FlagReason;
  /** AI model confidence 0–100 */
  aiConfidence: number;
  /** Labels returned by AI content classifier */
  aiLabels: string[];
  /** Number of user reports */
  reportCount: number;
  status: ModerationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  /** Admin note added during review */
  reviewNote?: string;
}

export const FLAG_REASON_LABELS: Record<FlagReason, string> = {
  hate_speech:    'Hate Speech',
  nudity:         'Nudity / Sexual',
  violence:       'Violence / Gore',
  spam:           'Spam',
  misinformation: 'Misinformation',
  harassment:     'Harassment',
  other:          'Other',
};

export const FLAG_REASON_COLORS: Record<FlagReason, string> = {
  hate_speech:    'text-danger border-danger/30 bg-danger/10',
  nudity:         'text-warning border-warning/30 bg-warning/10',
  violence:       'text-danger border-danger/30 bg-danger/10',
  spam:           'text-muted border-white/10 bg-white/5',
  misinformation: 'text-warning border-warning/30 bg-warning/10',
  harassment:     'text-warning border-warning/30 bg-warning/10',
  other:          'text-muted border-white/10 bg-white/5',
};
