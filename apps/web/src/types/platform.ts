export type UserStatus = 'active' | 'warned' | 'banned' | 'suspended';

export interface AppUser {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  status: UserStatus;
  followersCount: number;
  videoCount: number;
  createdAt: string;
  lastActiveAt: string;
  bio?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export interface PaginatedUsers {
  data:        AppUser[];    // primary field returned by mock
  users?:      AppUser[];   // alias (some callers use this)
  total:       number;
  page:        number;
  limit:       number;
  totalPages:  number;
}
