import mongoose, { Schema, type Document } from 'mongoose';
import type { AdminRole } from '@snaptik/types';

export interface IAdmin extends Document {
  email:              string;
  name:               string;
  passwordHash:       string;
  role:               AdminRole;
  customPermissions:  string[];
  isActive:           boolean;
  refreshTokens:      string[];
  lastLoginAt?:       Date;
  lastLoginIp?:       string;
  lastActionAt?:      Date;
  inviteToken?:       string;
  inviteExpiry?:      Date;
  invitedBy?:         mongoose.Types.ObjectId;
  resetToken?:        string;
  resetExpiry?:       Date;
  createdAt:          Date;
  updatedAt:          Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:              { type: String, required: true, trim: true },
    passwordHash:      { type: String, required: true, select: false },
    role:              { type: String, enum: ['super_admin','moderator','support','analyst','auditor'], required: true },
    customPermissions: { type: [String], default: [] },
    isActive:          { type: Boolean, default: false },
    refreshTokens:     { type: [String], default: [], select: false },
    lastLoginAt:       Date,
    lastLoginIp:       String,
    lastActionAt:      Date,
    inviteToken:       String,
    inviteExpiry:      Date,
    invitedBy:         { type: Schema.Types.ObjectId, ref: 'Admin' },
    resetToken:        String,
    resetExpiry:       Date,
  },
  { timestamps: true, collection: 'admin_users' },
);

AdminSchema.index({ inviteToken: 1 }, { sparse: true });
AdminSchema.index({ resetToken: 1 }, { sparse: true });

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
