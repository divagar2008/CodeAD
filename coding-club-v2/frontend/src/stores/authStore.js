import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('cc_user') || 'null'),
  token: localStorage.getItem('cc_token') || null,
  loading: false,

  login: async (role, email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post(`/auth/${role}/login`, { email, password });
      const { token, user } = data.data;
      localStorage.setItem('cc_token', token);
      localStorage.setItem('cc_user', JSON.stringify(user));
      set({ user, token, loading: false });
      return user;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    set({ user: null, token: null });
  },

  updateUser: (updates) => {
    const user = { ...get().user, ...updates };
    localStorage.setItem('cc_user', JSON.stringify(user));
    set({ user });
  },
}));
