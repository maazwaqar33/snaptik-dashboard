export type AdminRole = 'super_admin' | 'moderator' | 'support' | 'analyst' | 'auditor';

export interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: AdminRole;
  customPermissions: string[];
  isActive: boolean;
  lastLoginAt?: string;
  lastActionAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  moderator: 'Moderator',
  support: 'Support Agent',
  analyst: 'Analyst',
  auditor: 'Auditor',
};

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ['*'],
  moderator: [
    'read:users', 'warn:users', 'ban:users',
    'read:content', 'moderate:content', 'delete:content',
    'read:reports', 'handle:reports', 'assign:reports',
    'read:analytics', 'read:auditlog',
  ],
  support: [
    'read:users', 'edit:users', 'resetpassword:users',
    'read:tickets', 'reply:tickets', 'update:tickets', 'assign:tickets',
    'read:reports',
  ],
  analyst: ['read:analytics', 'export:analytics', 'read:users'],
  auditor: ['read:auditlog', 'read:reports', 'export:compliance'],
};
