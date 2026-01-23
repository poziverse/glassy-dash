/**
 * Admin Mutation Hooks
 * Declarative mutations for admin operations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { adminKeys } from '../queries/useAdmin';

/**
 * Update admin settings
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useUpdateAdminSettings(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings) => {
      return await api('/admin/settings', { method: 'PATCH', body: settings });
    },
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.settings() });
      
      const previousSettings = queryClient.getQueryData(adminKeys.settings());

      // Optimistically update settings
      queryClient.setQueryData(adminKeys.settings(), (old) => {
        if (!old) return old;
        return { ...old, ...newSettings };
      });

      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(adminKeys.settings(), context.previousSettings);
      }
    },
    onSuccess: () => {
      // Refetch settings
      queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
    },
    ...options,
  });
}

/**
 * Create user
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useCreateUser(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      return await api('/admin/users', { method: 'POST', body: userData });
    },
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.users() });
      
      const previousUsers = queryClient.getQueryData(adminKeys.users());

      // Optimistically add user with temp ID
      queryClient.setQueryData(adminKeys.users(), (old) => {
        if (!old) return old;
        const tempUser = { ...newUser, id: 'temp-' + Date.now() };
        return [tempUser, ...old];
      });

      return { previousUsers };
    },
    onError: (err, newUser, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(adminKeys.users(), context.previousUsers);
      }
    },
    onSuccess: () => {
      // Refetch users
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
    ...options,
  });
}

/**
 * Delete user
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useDeleteUser(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId) => {
      return await api(`/admin/users/${userId}`, { method: 'DELETE' });
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.users() });
      
      const previousUsers = queryClient.getQueryData(adminKeys.users());

      // Optimistically remove user
      queryClient.setQueryData(adminKeys.users(), (old) => {
        if (!old) return old;
        return old.filter(user => String(user.id) !== String(userId));
      });

      return { previousUsers };
    },
    onError: (err, userId, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(adminKeys.users(), context.previousUsers);
      }
    },
    onSuccess: () => {
      // Refetch users
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
    ...options,
  });
}

/**
 * Update user
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useUpdateUser(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }) => {
      return await api(`/admin/users/${userId}`, { method: 'PATCH', body: updates });
    },
    onMutate: async ({ userId, updates }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.users() });
      
      const previousUsers = queryClient.getQueryData(adminKeys.users());

      // Optimistically update user
      queryClient.setQueryData(adminKeys.users(), (old) => {
        if (!old) return old;
        return old.map(user => 
          String(user.id) === String(userId) ? { ...user, ...updates } : user
        );
      });

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(adminKeys.users(), context.previousUsers);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate users query and specific user query
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.user(variables.userId) });
    },
    ...options,
  });
}