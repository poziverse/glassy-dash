/**
 * Notes Query Hooks
 * Declarative data fetching for notes using TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

/**
 * Query keys for cache management
 * Provides a structured way to reference and invalidate cached data
 */
export const notesKeys = {
  all: ['notes'],
  lists: () => [...notesKeys.all, 'list'],
  list: (filters) => [...notesKeys.lists(), { filters }],
  details: () => [...notesKeys.all, 'detail'],
  detail: (id) => [...notesKeys.details(), id],
  trash: () => [...notesKeys.all, 'trash'],
  archived: () => [...notesKeys.all, 'archived'],
  collaborated: () => [...notesKeys.all, 'collaborated'],
};

/**
 * Fetch all active notes (excluding trash and archived)
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result with data, isLoading, error, etc.
 */
export function useNotes(options = {}) {
  return useQuery({
    queryKey: notesKeys.list({ type: 'active' }),
    queryFn: async () => {
      const notes = await api('/notes');
      return notes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch notes in trash (deleted notes)
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result
 */
export function useTrash(options = {}) {
  return useQuery({
    queryKey: notesKeys.trash(),
    queryFn: async () => {
      const notes = await api('/notes/trash');
      return notes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch archived notes
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result
 */
export function useArchived(options = {}) {
  return useQuery({
    queryKey: notesKeys.archived(),
    queryFn: async () => {
      const notes = await api('/notes/archived');
      return notes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch collaborated notes (notes shared with user)
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result
 */
export function useCollaborated(options = {}) {
  return useQuery({
    queryKey: notesKeys.collaborated(),
    queryFn: async () => {
      const notes = await api('/notes/collaborated');
      return notes;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Fetch single note by ID
 * @param {string} id - Note ID
 * @param {Object} options - Additional useQuery options
 * @returns {UseQueryResult} Query result
 */
export function useNote(id, options = {}) {
  return useQuery({
    queryKey: notesKeys.detail(id),
    queryFn: async () => {
      const note = await api(`/notes/${id}`);
      return note;
    },
    enabled: !!id, // Only run if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}