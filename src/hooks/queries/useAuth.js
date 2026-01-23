/**
 * Auth Query Hooks
 * Declarative data fetching for authentication settings
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

/**
 * Query keys for auth-related cache management
 */
export const authKeys = {
  all: ['auth'],
  settings: () => [...authKeys.all, 'settings'],
  allowRegistration: () => [...authKeys.all, 'allowRegistration'],
  currentUser: () => [...authKeys.all, 'currentUser'],
};

/**
 * Check if new account registration is allowed
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result with allowRegistration boolean
 */
export function useAllowRegistration(options = {}) {
  return useQuery({
    queryKey: authKeys.allowRegistration(),
    queryFn: async () => {
      const data = await api('/auth/settings');
      return data.allow_registration;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Fetch authentication settings
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result with auth settings
 */
export function useAuthSettings(options = {}) {
  return useQuery({
    queryKey: authKeys.settings(),
    queryFn: async () => {
      const settings = await api('/auth/settings');
      return settings;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}