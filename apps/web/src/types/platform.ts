/** Platform user (SnapTik app user — NOT an admin) */
export interface AppUser {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  status: 'active' | 'banned' | 'suspended' | 'pending';
  isVerified: boolean;
  isEmailVerified: boolean;
  followersCount: number;
  followingCount: number;
  videosCount: number;
  likesCount: number;
  /** ISO date string */
  createdAt: string;
  /** ISO date string */
  lastActiveAt?: string;
  /** Reason stored when banned/suspended */
  statusReason?: string;
  reportCount: number;
  country?: string;
}

export type UserStatus = AppUser['status'];

export interface UserActionPayload {
  userId: string;
  reason?: string;
}

export interface PaginatedUsers {
  users: AppUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
