import { create } from 'zustand';
import { API_BASE } from '../config';

interface User {
  id: string;
  username: string;
  email: string;
  ratings?: Record<string, { rating: number; rd: number }>;
}

interface UserState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;

  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // API helpers
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  fetchMe: () => Promise<void>;
}


export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  setAuth: (user, accessToken) => set({ user, accessToken, isLoading: false }),
  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {}
    set({ user: null, accessToken: null, isLoading: false });
  },
  setLoading: (isLoading) => set({ isLoading }),

  login: async (username, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    const data = await res.json();
    set({ user: data.user, accessToken: data.accessToken, isLoading: false });
  },

  register: async (username, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Registration failed');
    }
    const data = await res.json();
    set({ user: data.user, accessToken: data.accessToken, isLoading: false });
  },

  refreshToken: async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return false;
      const data = await res.json();
      set({ accessToken: data.accessToken });
      return true;
    } catch {
      return false;
    }
  },

  fetchMe: async () => {
    const token = get().accessToken;
    if (!token) {
      // Try refresh
      const refreshed = await get().refreshToken();
      if (!refreshed) {
        set({ isLoading: false });
        return;
      }
    }

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${get().accessToken}` },
      });
      if (!res.ok) {
        set({ user: null, accessToken: null, isLoading: false });
        return;
      }
      const user = await res.json();
      set({ user, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
