/**
 * Auth Mutation Hooks
 * Declarative mutations for authentication
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { authKeys } from '../queries/useAuth';

/**
 * Login mutation
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useLogin(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      return await api('/login', { method: 'POST', body: { email, password } });
    },
    onSuccess: (data) => {
      // Store user and token in Zustand store
      // This is handled by the AuthContext, but we could also do it here
      // Invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    ...options,
  });
}

/**
 * Register mutation
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useRegister(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, email, password }) => {
      return await api('/register', { method: 'POST', body: { name, email, password } });
    },
    onSuccess: (data) => {
      // Store user and token in Zustand store
      // This is handled by the AuthContext
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    ...options,
  });
}

/**
 * Secret key login mutation
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useSecretKeyLogin(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key) => {
      return await api('/login/secret', { method: 'POST', body: { key } });
    },
    onSuccess: (data) => {
      // Store user and token in Zustand store
      // This is handled by the AuthContext
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
    ...options,
  });
}

/**
 * Logout mutation
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useLogout(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Clear auth state in Zustand store
      // This is handled by the AuthContext
      // Clear all query cache
      queryClient.clear();
    },
    onSuccess: () => {
      // All queries should be cleared, so nothing to invalidate
    },
    ...options,
  });
}