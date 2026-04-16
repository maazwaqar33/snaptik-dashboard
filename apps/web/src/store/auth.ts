import { create } from 'zustand';
import type { AdminUser, AdminRole } from '@snaptik/types';

// ─── Hardcoded demo credentials ───────────────────────────────────────────────
const DEMO_USERS: Array<{ email: string; password: string; role: AdminRole; name: string }> = [
  { email: 'admin@snaptik.com',     password: 'Admin@1234!',  role: 'super_admin', name: 'Super Admin'   },
  { email: 'moderator@snaptik.com', password: 'Mod@1234!',    role: 'moderator',   name: 'Moderator'     },
  { email: 'support@snaptik.com',   password: 'Support@1',    role: 'support',     name: 'Support Agent' },
  { email: 'analyst@snaptik.com',   password: 'Analyst@1',    role: 'analyst',     name: 'Analyst'       },
  { email: 'auditor@snaptik.com',   password: 'Auditor@1',    role: 'auditor',     name: 'Auditor'       },
];

const STORAGE_KEY = 'snaptik_demo_user';

function buildMockUser(cred: (typeof DEMO_USERS)[0]): AdminUser {
  return {
    _id: `mock-${cred.role}-001`,
    email: cred.email,
    name: cred.name,
    role: cred.role,
    customPermissions: [],
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    lastActionAt: new Date().toISOString(),
    lastLoginIp: '127.0.0.1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
  };
}

// ─── Read existing session from localStorage SYNCHRONOUSLY at module load ─────
function loadPersistedAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface AuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAdmin: (admin: AdminUser) => void;
  clearAuth: () => void;
}

const persistedAdmin = loadPersistedAdmin();

export const useAuthStore = create<AuthState>()((set) => ({
  admin: persistedAdmin,
  isAuthenticated: persistedAdmin !== null,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    // Small delay so the spinner shows
    await new Promise((r) => setTimeout(r, 500));

    const match = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );

    if (!match) {
      set({ isLoading: false });
      throw { response: { data: { error: 'Invalid email or password. Please try again.' } } };
    }

    const admin = buildMockUser(match);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
    set({ admin, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ admin: null, isAuthenticated: false });
  },

  setAdmin: (admin: AdminUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(admin));
    set({ admin, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ admin: null, isAuthenticated: false });
  },
}));
