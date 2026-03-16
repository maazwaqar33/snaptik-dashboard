import mongoose, { Schema, type Document } from 'mongoose';

export interface IAppUser extends Document {
  username:       string;
  email:          string;
  displayName:    string;
  isVerified:     boolean;
  isBanned:       boolean;
  followersCount: number;
  followingCount: number;
  uploadsCount:   number;
  joinedAt:       Date;
  lastActiveAt:   Date;
  bio:            string;
  avatarUrl:      string;
  totalLikes:     number;
  totalViews:     number;
  warningCount:   number;
  banReason?:     string;
  banHistory:     Array<{
    reason:      string;
    bannedAt:    Date;
    bannedBy:    string;
    unbannedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AppUserSchema = new Schema<IAppUser>(
  {
    username:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName:    { type: String, required: true, trim: true },
    isVerified:     { type: Boolean, default: false },
    isBanned:       { type: Boolean, default: false },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    uploadsCount:   { type: Number, default: 0 },
    joinedAt:       { type: Date, default: Date.now },
    lastActiveAt:   { type: Date, default: Date.now },
    bio:            { type: String, default: '' },
    avatarUrl:      { type: String, default: '' },
    totalLikes:     { type: Number, default: 0 },
    totalViews:     { type: Number, default: 0 },
    warningCount:   { type: Number, default: 0 },
    banReason:      String,
    banHistory: [
      {
        reason:      { type: String, required: true },
        bannedAt:    { type: Date, required: true },
        bannedBy:    { type: String, required: true },
        unbannedAt:  Date,
      },
    ],
  },
  { timestamps: true, collection: 'app_users' },
);

AppUserSchema.index({ username: 1 });
AppUserSchema.index({ email: 1 });
AppUserSchema.index({ isBanned: 1 });
AppUserSchema.index({ isVerified: 1 });

export const AppUser = mongoose.model<IAppUser>('AppUser', AppUserSchema);
