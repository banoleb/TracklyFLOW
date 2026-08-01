import { create } from 'zustand';
import { User } from '../types';
import { authApi } from '../api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    set({ loading: true });
    try {
      const res = await authApi.me();
      set({ user: res.data.data, isAuthenticated: true, loading: false });
    } catch {
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },
}));
