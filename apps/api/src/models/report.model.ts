import mongoose, { Schema, type Document } from 'mongoose';

export type ReportType    = 'spam' | 'harassment' | 'nsfw' | 'misinformation' | 'other';
export type ReportStatus  = 'pending' | 'in_review' | 'resolved';
export type TargetType    = 'video' | 'comment' | 'user';
export type ResolveAction = 'warn' | 'remove' | 'dismiss';

export interface IReport extends Document {
  type:              ReportType;
  status:            ReportStatus;
  reporterId:        string;
  reporterUsername:  string;
  targetType:        TargetType;
  targetId:          string;
  reason:            string;
  notes?:            string;
  assignedTo?: {
    _id:   string;
    name:  string;
    email: string;
  };
  resolvedAction?: ResolveAction;
  resolvedAt?:     Date;
  resolvedBy?:     string;
  createdAt:       Date;
  updatedAt:       Date;
}

const ReportSchema = new Schema<IReport>(
  {
    type:             { type: String, enum: ['spam', 'harassment', 'nsfw', 'misinformation', 'other'], required: true },
    status:           { type: String, enum: ['pending', 'in_review', 'resolved'], default: 'pending' },
    reporterId:       { type: String, required: true },
    reporterUsername: { type: String, required: true },
    targetType:       { type: String, enum: ['video', 'comment', 'user'], required: true },
    targetId:         { type: String, required: true },
    reason:           { type: String, required: true },
    notes:            String,
    assignedTo: {
      _id:   String,
      name:  String,
      email: String,
    },
    resolvedAction: { type: String, enum: ['warn', 'remove', 'dismiss'] },
    resolvedAt:     Date,
    resolvedBy:     String,
  },
  { timestamps: true, collection: 'reports' },
);

ReportSchema.index({ status: 1 });
ReportSchema.index({ type: 1 });
ReportSchema.index({ createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
