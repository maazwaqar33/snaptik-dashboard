import type { AdminUser } from './admin';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  admin: AdminUser;
}

export interface DashboardStats {
  mau: number;
  dau: number;
  totalUsers: number;
  flaggedContent: number;
  openReports: number;
  openTickets: number;
  totalVideos: number;
  processingVideos: number;
}

export interface Alert {
  id: string;
  type: 'new_report' | 'video_flagged' | 'ticket_created' | 'user_banned';
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
