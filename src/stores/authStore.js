import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      token: null,
      isAuthenticated: false,

      // Actions
      login: (user, token) => {
        set({ currentUser: user, token, isAuthenticated: true });
        // Store token for API calls
        localStorage.setItem('glass-keep-token', token);
      },

      logout: () => {
        set({ currentUser: null, token: null, isAuthenticated: false });
        // Clear token from localStorage
        localStorage.removeItem('glass-keep-token');
        // Clear user data from localStorage
        localStorage.removeItem('glass-keep-user');
      },

      updateUser: (updates) => {
        set(state => ({
          currentUser: state.currentUser ? { ...state.currentUser, ...updates } : null
        }));
        // Update localStorage
        if (get().currentUser) {
          const updatedUser = { ...get().currentUser, ...updates };
          localStorage.setItem('glass-keep-user', JSON.stringify(updatedUser));
        }
      },

      setToken: (token) => {
        set({ token, isAuthenticated: !!token });
        if (token) {
          localStorage.setItem('glass-keep-token', token);
        } else {
          localStorage.removeItem('glass-keep-token');
        }
      },

      setCurrentUser: (user) => {
        const isAuthenticated = !!user;
        set({ currentUser: user, isAuthenticated });
        if (user) {
          localStorage.setItem('glass-keep-user', JSON.stringify(user));
        } else {
          localStorage.removeItem('glass-keep-user');
        }
      }
    }),
    {
      name: 'glass-keep-auth'
    }
  )
);