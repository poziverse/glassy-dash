/**
 * Admin Query Hooks
 * Declarative data fetching for admin panel
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

/**
 * Query keys for admin-related cache management
 */
export const adminKeys = {
  all: ['admin'],
  settings: () => [...adminKeys.all, 'settings'],
  users: () => [...adminKeys.all, 'users'],
  user: (id) => [...adminKeys.all, 'users', id],
  logs: () => [...adminKeys.all, 'logs'],
  stats: () => [...adminKeys.all, 'stats'],
};

/**
 * Fetch admin settings
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result with admin settings
 */
export function useAdminSettings(options = {}) {
  return useQuery({
    queryKey: adminKeys.settings(),
    queryFn: async () => {
      const settings = await api('/admin/settings');
      return settings;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Fetch all users
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result with users array
 */
export function useAdminUsers(options = {}) {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: async () => {
      const users = await api('/admin/users');
      return users;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch single user by ID
 * @param {string} id - User ID
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result with user data
 */
export function useAdminUser(id, options = {}) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: async () => {
      const user = await api(`/admin/users/${id}`);
      return user;
    },
    enabled: !!id, // Only run if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch admin stats (user count, note count, etc.)
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result with stats
 */
export function useAdminStats(options = {}) {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const stats = await api('/admin/stats');
      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch admin logs
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result with logs
 */
export function useAdminLogs(options = {}) {
  return useQuery({
    queryKey: adminKeys.logs(),
    queryFn: async () => {
      const logs = await api('/admin/logs');
      return logs;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
}