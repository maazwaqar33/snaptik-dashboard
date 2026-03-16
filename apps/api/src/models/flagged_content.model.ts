import mongoose, { Schema, type Document } from 'mongoose';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'deleted';
export type ContentType      = 'video' | 'comment';

export interface IFlaggedContent extends Document {
  type:               ContentType;
  authorId:           string;
  authorUsername:     string;
  videoUrl:           string;
  thumbnailUrl:       string;
  caption:            string;
  aiFlags: {
    nsfw:       number;
    violence:   number;
    spam:       number;
    hateSpeech: number;
  };
  moderationStatus:  ModerationStatus;
  moderatedAt?:      Date;
  moderatedBy?:      string;
  moderationReason?: string;
  createdAt:         Date;
  updatedAt:         Date;
}

const FlaggedContentSchema = new Schema<IFlaggedContent>(
  {
    type:            { type: String, enum: ['video', 'comment'], required: true },
    authorId:        { type: String, required: true },
    authorUsername:  { type: String, required: true },
    videoUrl:        { type: String, default: '' },
    thumbnailUrl:    { type: String, default: '' },
    caption:         { type: String, default: '' },
    aiFlags: {
      nsfw:       { type: Number, default: 0 },
      violence:   { type: Number, default: 0 },
      spam:       { type: Number, default: 0 },
      hateSpeech: { type: Number, default: 0 },
    },
    moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected', 'deleted'], default: 'pending' },
    moderatedAt:      Date,
    moderatedBy:      String,
    moderationReason: String,
  },
  { timestamps: true, collection: 'flagged_content' },
);

FlaggedContentSchema.index({ moderationStatus: 1 });
FlaggedContentSchema.index({ authorId: 1 });
FlaggedContentSchema.index({ createdAt: -1 });

export const FlaggedContent = mongoose.model<IFlaggedContent>('FlaggedContent', FlaggedContentSchema);
