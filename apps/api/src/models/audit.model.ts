import mongoose, { Schema, type Document } from 'mongoose';

export type AuditAction =
  | 'admin.login'
  | 'admin.logout'
  | 'admin.invite'
  | 'admin.toggle'
  | 'user.ban'
  | 'user.unban'
  | 'user.warn'
  | 'user.verify'
  | 'user.delete'
  | 'content.approve'
  | 'content.reject'
  | 'content.delete'
  | 'content.remove'
  | 'content.defer'
  | 'report.resolve'
  | 'report.assign'
  | 'report.update'
  | 'ticket.create'
  | 'ticket.reply'
  | 'ticket.update'
  | 'settings.update'
  | 'analytics.export'
  | 'audit.export';

export interface IAuditLog extends Document {
  adminId:    mongoose.Types.ObjectId;
  adminName:  string;
  adminEmail: string;
  adminRole:  string;
  action:     AuditAction;
  targetId?:  string;
  targetType?:string;
  detail?:    string;
  ipAddress?: string;
  userAgent?: string;
  createdAt:  Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId:    { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    adminName:  { type: String, required: true },
    adminEmail: { type: String, required: true },
    adminRole:  { type: String, required: true },
    action:     { type: String, required: true },
    targetId:   String,
    targetType: String,
    detail:     String,
    ipAddress:  String,
    userAgent:  String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
  },
);

// Immutable — no updates allowed
AuditLogSchema.pre('save', function (next) {
  if (!this.isNew) return next(new Error('AuditLog records are immutable'));
  next();
});

AuditLogSchema.index({ adminId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
