'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { apiClient } from '@/lib/api';
import type { AdminUser } from '@snaptik/types';

interface AuthState {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAdmin: (admin: AdminUser, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.post<{ accessToken: string; admin: AdminUser }>(
            '/auth/login',
            { email, password },
          );
          Cookies.set('admin_access_token', data.accessToken, {
            sameSite: 'strict',
            // secure: true — enforced in production by HTTPS
          });
          set({ admin: data.admin, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          // Tell the server to invalidate the refresh token
          await apiClient.post('/auth/logout');
        } catch {
          // Always clear client state even if server call fails
        }
        Cookies.remove('admin_access_token');
        set({ admin: null, isAuthenticated: false });
      },

      setAdmin: (admin: AdminUser, token: string) => {
        Cookies.set('admin_access_token', token, { sameSite: 'strict' });
        set({ admin, isAuthenticated: true });
      },

      clearAuth: () => {
        Cookies.remove('admin_access_token');
        set({ admin: null, isAuthenticated: false });
      },
    }),
    {
      name: 'snaptik-admin-auth',
      // Only persist the admin profile — not loading/action state
      partialize: (state) => ({ admin: state.admin, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
