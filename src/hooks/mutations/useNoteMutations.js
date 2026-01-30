/**
 * Notes Mutation Hooks
 * Declarative mutations for notes with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { notesKeys } from '../queries/useNotes'
import { useNotesStore } from '../../stores/notesStore'

/**
 * Create a new note with optimistic update and retry logic
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useCreateNote(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async noteData => {
      return await api('/notes', { method: 'POST', body: noteData })
    },
    onMutate: async newNote => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: notesKeys.lists() })

      // Snapshot previous value
      const previousNotes = queryClient.getQueryData(notesKeys.list({ type: 'active' }))

      const tempNote = {
        ...newNote,
        id: newNote.id || 'temp-' + Date.now(),
        items: newNote.items || [],
        tags: newNote.tags || [],
        images: newNote.images || [],
      }

      // Optimistically update store
      useNotesStore.getState().addNote(tempNote)

      // Optimistically add note with temp ID to the active list
      queryClient.setQueryData(notesKeys.list({ type: 'active' }), old => {
        if (!old) return [tempNote]
        return [tempNote, ...old]
      })

      return { previousNotes }
    },
    onError: (err, newNote, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(notesKeys.list({ type: 'active' }), context.previousNotes)
        // Store will be synced by useEffect in NotesContext
      }

      // Log error for debugging
      console.error('[useCreateNote] Error:', {
        error: err.message,
        status: err.status,
        isValidationError: err.isValidationError,
        isApiError: err.isApiError,
        isNetworkError: err.isNetworkError,
        validationErrors: err.validationErrors,
        noteData: {
          type: newNote.type,
          hasImages: !!newNote.images,
          imagesCount: newNote.images?.length || 0,
        },
      })
    },
    onSuccess: () => {
      // Refetch to get server data (replaces temp ID)
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() })
    },
    // Retry logic: retry on network errors or 5xx server errors
    retry: (failureCount, error) => {
      const shouldRetry =
        failureCount < 3 &&
        (error.isNetworkError ||
          (error.status >= 500 && error.status < 600) ||
          error.isValidationError)

      if (shouldRetry) {
        console.log(`[useCreateNote] Retrying (attempt ${failureCount + 1}/3):`, error.message)
      }

      return shouldRetry
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  })
}

/**
 * Update a note with optimistic update
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useUpdateNote(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      // PUT is for full updates (used by Modal)
      return await api(`/notes/${id}`, { method: 'PUT', body: updates })
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: notesKeys.all })

      const previousNotes = queryClient.getQueryData(notesKeys.list({ type: 'active' }))
      const previousArchived = queryClient.getQueryData(notesKeys.archived())

      const updateFn = old => {
        if (!old) return old
        return old.map(note => (String(note.id) === String(id) ? { ...note, ...updates } : note))
      }

      // Optimistically update store
      useNotesStore.getState().updateNote(id, updates)

      // Optimistically update note in active lists and archived
      queryClient.setQueriesData({ queryKey: notesKeys.lists() }, updateFn)
      queryClient.setQueryData(notesKeys.archived(), updateFn)

      return { previousNotes, previousArchived }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(notesKeys.list({ type: 'active' }), context.previousNotes)
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(notesKeys.archived(), context.previousArchived)
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate specific note query and lists
      queryClient.invalidateQueries({ queryKey: notesKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() })
    },
    ...options,
  })
}

/**
 * Partial update for a note with optimistic update
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function usePatchNote(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      // PATCH is for partial updates (used by card actions, bulk color, etc)
      return await api(`/notes/${id}`, { method: 'PATCH', body: updates })
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: notesKeys.all })

      const previousNotes = queryClient.getQueryData(notesKeys.list({ type: 'active' }))
      const previousArchived = queryClient.getQueryData(notesKeys.archived())

      const updateFn = old => {
        if (!old) return old
        return old.map(note => (String(note.id) === String(id) ? { ...note, ...updates } : note))
      }

      // Optimistically update store
      useNotesStore.getState().updateNote(id, updates)

      // Optimistically update note in active lists and archived
      queryClient.setQueriesData({ queryKey: notesKeys.lists() }, updateFn)
      queryClient.setQueryData(notesKeys.archived(), updateFn)

      return { previousNotes, previousArchived }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(notesKeys.list({ type: 'active' }), context.previousNotes)
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(notesKeys.archived(), context.previousArchived)
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate specific note query and lists
      queryClient.invalidateQueries({ queryKey: notesKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() })
    },
    ...options,
  })
}

/**
 * Delete a note (soft delete to trash)
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useDeleteNote(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async id => {
      return await api(`/notes/${id}`, { method: 'DELETE' })
    },
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: notesKeys.all })

      const previousNotes = queryClient.getQueryData(notesKeys.list({ type: 'active' }))
      const previousArchived = queryClient.getQueryData(notesKeys.archived())

      const filterFn = old => {
        if (!old) return old
        return old.filter(note => String(note.id) !== String(id))
      }

      // Optimistically remove note from active lists and archived
      queryClient.setQueriesData({ queryKey: notesKeys.lists() }, filterFn)
      queryClient.setQueryData(notesKeys.archived(), filterFn)

      return { previousNotes, previousArchived }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(notesKeys.list({ type: 'active' }), context.previousNotes)
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(notesKeys.archived(), context.previousArchived)
      }
    },
    onSuccess: () => {
      // Refetch lists and trash
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notesKeys.trash() })
    },
    ...options,
  })
}

/**
 * Restore a note from trash
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useRestoreNote(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async id => {
      return await api(`/notes/${id}/restore`, { method: 'POST' })
    },
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: notesKeys.all })

      const previousNotes = queryClient.getQueryData(notesKeys.list({ type: 'active' }))
      const previousArchived = queryClient.getQueryData(notesKeys.archived())
      const previousTrash = queryClient.getQueryData(notesKeys.trash())

      // Find note in trash to move it back
      const noteToRestore = previousTrash?.find(n => String(n.id) === String(id))

      if (noteToRestore) {
        // Optimistically remove from trash
        queryClient.setQueryData(notesKeys.trash(), old => {
          if (!old) return old
          return old.filter(n => String(n.id) !== String(id))
        })

        // Determine where it goes based on its archived status
        if (noteToRestore.archived) {
          queryClient.setQueryData(notesKeys.archived(), old => {
            if (!old) return [noteToRestore]
            return [noteToRestore, ...old]
          })
        } else {
          queryClient.setQueryData(notesKeys.list({ type: 'active' }), old => {
            if (!old) return [noteToRestore]
            return [noteToRestore, ...old]
          })
        }
      }

      return { previousNotes, previousArchived, previousTrash }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(notesKeys.list({ type: 'active' }), context.previousNotes)
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(notesKeys.archived(), context.previousArchived)
      }
      if (context?.previousTrash) {
        queryClient.setQueryData(notesKeys.trash(), context.previousTrash)
      }
    },
    onSuccess: () => {
      // Refetch lists and trash
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notesKeys.archived() })
      queryClient.invalidateQueries({ queryKey: notesKeys.trash() })
    },
    ...options,
  })
}

/**
 * Permanently delete a note from trash
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function usePermanentDeleteNote(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async id => {
      return await api(`/notes/${id}/permanent`, { method: 'DELETE' })
    },
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: notesKeys.trash() })

      const previousTrash = queryClient.getQueryData(notesKeys.trash())

      // Optimistically remove from trash
      queryClient.setQueryData(notesKeys.trash(), old => {
        if (!old) return old
        return old.filter(note => String(note.id) !== String(id))
      })

      return { previousTrash }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousTrash) {
        queryClient.setQueryData(notesKeys.trash(), context.previousTrash)
      }
    },
    onSuccess: () => {
      // Refetch trash
      queryClient.invalidateQueries({ queryKey: notesKeys.trash() })
    },
    ...options,
  })
}

/**
 * Empty trash (delete all notes in trash)
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useEmptyTrash(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await api('/notes/trash', { method: 'DELETE' })
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notesKeys.trash() })

      const previousTrash = queryClient.getQueryData(notesKeys.trash())

      // Optimistically empty trash
      queryClient.setQueryData(notesKeys.trash(), [])

      return { previousTrash }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTrash) {
        queryClient.setQueryData(notesKeys.trash(), context.previousTrash)
      }
    },
    onSuccess: () => {
      // Refetch trash
      queryClient.invalidateQueries({ queryKey: notesKeys.trash() })
    },
    ...options,
  })
}

/**
 * Toggle pin status of a note
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useTogglePin(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, pinned }) => {
      return await api(`/notes/${id}`, { method: 'PATCH', body: { pinned } })
    },
    onMutate: async ({ id, pinned }) => {
      await queryClient.cancelQueries({ queryKey: notesKeys.all })

      const previousNotes = queryClient.getQueryData(notesKeys.list({ type: 'active' }))
      const previousArchived = queryClient.getQueryData(notesKeys.archived())

      const updateFn = old => {
        if (!old) return old
        return old.map(note => (String(note.id) === String(id) ? { ...note, pinned } : note))
      }

      // Optimistically update pin status in all lists
      queryClient.setQueriesData({ queryKey: notesKeys.lists() }, updateFn)
      queryClient.setQueryData(notesKeys.archived(), updateFn)

      return { previousNotes, previousArchived }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotes) {
        queryClient.setQueryData(notesKeys.list({ type: 'active' }), context.previousNotes)
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(notesKeys.archived(), context.previousArchived)
      }
    },
    onSuccess: () => {
      // Refetch lists
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() })
    },
    ...options,
  })
}

/**
 * Toggle archive status of a note
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useToggleArchive(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, archived }) => {
      // Archive uses the specific /archive endpoint
      return await api(`/notes/${id}/archive`, { method: 'POST', body: { archived } })
    },
    onMutate: async ({ id, archived }) => {
      await queryClient.cancelQueries({ queryKey: notesKeys.all })

      const previousNotes = queryClient.getQueryData(notesKeys.list({ type: 'active' }))
      const previousArchived = queryClient.getQueryData(notesKeys.archived())

      // Optimistically move between lists if we have data
      if (archived) {
        // Moving to archive: Find in active, remove, add to archived
        const note = previousNotes?.find(n => String(n.id) === String(id))
        const updatedNote = note ? { ...note, archived: true } : null

        queryClient.setQueryData(notesKeys.list({ type: 'active' }), old => {
          if (!old) return old
          return old.filter(n => String(n.id) !== String(id))
        })

        if (updatedNote) {
          queryClient.setQueryData(notesKeys.archived(), old => {
            if (!old) return [updatedNote]
            return [updatedNote, ...old]
          })
        }
      } else {
        // Moving away from archive: Find in archived, remove, add to active
        const note = previousArchived?.find(n => String(n.id) === String(id))
        const updatedNote = note ? { ...note, archived: false } : null

        queryClient.setQueryData(notesKeys.archived(), old => {
          if (!old) return old
          return old.filter(n => String(n.id) !== String(id))
        })

        if (updatedNote) {
          queryClient.setQueryData(notesKeys.list({ type: 'active' }), old => {
            if (!old) return [updatedNote]
            return [updatedNote, ...old]
          })
        }
      }

      return { previousNotes, previousArchived }
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousNotes) {
        queryClient.setQueryData(notesKeys.list({ type: 'active' }), context.previousNotes)
      }
      if (context?.previousArchived) {
        queryClient.setQueryData(notesKeys.archived(), context.previousArchived)
      }
    },
    onSettled: () => {
      // Refetch both lists
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notesKeys.archived() })
    },
    ...options,
  })
}

/**
 * Reorder notes (update positions)
 * @param {Object} options - Additional useMutation options
 * @returns {UseMutationResult} Mutation result
 */
export function useReorderNotes(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pinnedIds = [], otherIds = [] }) => {
      return await api('/notes/reorder', {
        method: 'POST',
        body: { pinnedIds, otherIds },
      })
    },
    onMutate: async ({ pinnedIds = [], otherIds = [] }) => {
      await queryClient.cancelQueries({ queryKey: notesKeys.lists() })

      const previousNotes = queryClient.getQueryData(notesKeys.list({ type: 'active' }))

      // Optimistically reorder in active list
      if (previousNotes) {
        const base = Date.now()
        const noteMap = new Map(previousNotes.map(n => [String(n.id), n]))
        const reorderedPinned = pinnedIds
          .map((id, idx) => {
            const n = noteMap.get(String(id))
            if (!n) return null
            return { ...n, pinned: true, position: base + (pinnedIds.length - idx) }
          })
          .filter(Boolean)
        const reorderedOthers = otherIds
          .map((id, idx) => {
            const n = noteMap.get(String(id))
            if (!n) return null
            return { ...n, pinned: false, position: base - (idx + 1) }
          })
          .filter(Boolean)

        const updatedIds = new Set([...pinnedIds, ...otherIds].map(String))
        const remaining = previousNotes.filter(n => !updatedIds.has(String(n.id)))

        queryClient.setQueryData(notesKeys.list({ type: 'active' }), [
          ...reorderedPinned,
          ...reorderedOthers,
          ...remaining,
        ])
      }

      return { previousNotes }
    },
    onError: (err, _variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(notesKeys.list({ type: 'active' }), context.previousNotes)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.lists() })
    },
    ...options,
  })
}
