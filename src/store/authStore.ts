// Bu dosya, Zustand ile kimlik doğrulama (auth) state yönetimini sağlar.
import { create } from 'zustand';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (
    user: AuthUser,
    accessToken: string,
    refreshToken: string,
  ) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

const loadStoredAccessToken = (): string | null =>
  localStorage.getItem('access_token');

const loadStoredRefreshToken = (): string | null =>
  localStorage.getItem('refresh_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: loadStoredAccessToken(),
  refreshToken: loadStoredRefreshToken(),
  isAuthenticated: Boolean(loadStoredAccessToken()),
  isLoading: false,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearAuth: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
