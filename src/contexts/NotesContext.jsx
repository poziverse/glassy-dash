import React, { createContext, useState, useCallback, useContext, useEffect } from 'react'
import { AuthContext } from './AuthContext'
import { useCollaboration } from '../hooks/useCollaboration'
import { uid, mdForDownload, sanitizeFilename, downloadText } from '../utils/helpers'
import { api } from '../lib/api'
import logger from '../utils/logger'
import {
  useNotes as useNotesQuery,
  useTrash,
  useArchived,
  notesKeys,
} from '../hooks/queries/useNotes'
import { useNotesStore } from '../stores/notesStore'
import { useQueryClient } from '@tanstack/react-query'
import {
  useCreateNote,
  useUpdateNote,
  usePatchNote,
  useDeleteNote,
  useRestoreNote,
  useEmptyTrash,
  usePermanentDeleteNote,
  useTogglePin,
  useToggleArchive,
  useReorderNotes,
} from '../hooks/mutations/useNoteMutations'

export const NotesContext = createContext()

/**
 * NotesProvider Component
 * Provides notes state and operations to entire app
 * Bridged to useNotesStore for stability.
 */
export function NotesProvider({ children }) {
  const { token, currentUser } = useContext(AuthContext) || {}
  const userId = currentUser?.id
  const queryClient = useQueryClient()

  // Query hooks for data fetching - only enabled if logged in
  const queryOptions = { enabled: !!token }
  const {
    data: notesData,
    isLoading: notesLoading,
    refetch: refetchNotes,
  } = useNotesQuery(queryOptions)
  const { data: trashData, isLoading: trashLoading, refetch: refetchTrash } = useTrash(queryOptions)
  const {
    data: archivedData,
    isLoading: archivedLoading,
    refetch: refetchArchived,
  } = useArchived(queryOptions)

  // Mutation hooks
  const createNoteMutation = useCreateNote()
  const updateNoteMutation = useUpdateNote()
  const patchNoteMutation = usePatchNote()
  const deleteNoteMutation = useDeleteNote()
  const restoreNoteMutation = useRestoreNote()
  const emptyTrashMutation = useEmptyTrash()
  const permanentDeleteNoteMutation = usePermanentDeleteNote()
  const togglePinMutation = useTogglePin()
  const toggleArchiveMutation = useToggleArchive()
  const reorderNotesMutation = useReorderNotes()

  // Zustand Store
  const {
    notes,
    setNotes,
    pinned,
    others,
    trashNotes,
    setTrashNotes,
    archivedNotes,
    setArchivedNotes,
    tags,
    search,
    setSearch,
    tagFilter,
    setTagFilter,
    multiMode,
    setMultiMode,
    selectedIds,
    setSelectedIds,
    toggleNoteSelection,
  } = useNotesStore()

  // Calculated properties
  const allEmpty = !notes.length && !trashNotes.length && !archivedNotes.length
  const filteredEmptyWithSearch = notes.length === 0 && (search.length > 0 || tagFilter)

  const [viewTrash, setViewTrash] = useState(false)

  // Sync query data to store
  useEffect(() => {
    if (notesData) setNotes(notesData)
  }, [notesData, setNotes])
  useEffect(() => {
    if (trashData) setTrashNotes(trashData)
  }, [trashData, setTrashNotes])
  useEffect(() => {
    if (archivedData) setArchivedNotes(archivedData)
  }, [archivedData, setArchivedNotes])

  const isLoading = notesLoading || trashLoading || archivedLoading

  // Multi-select
  const onStartMulti = useCallback(() => {
    setMultiMode(true)
    setSelectedIds(new Set())
  }, [setMultiMode, setSelectedIds])

  const onExitMulti = useCallback(() => {
    setMultiMode(false)
    setSelectedIds(new Set())
  }, [setMultiMode, setSelectedIds])

  const onToggleSelect = useCallback(
    (id, checked) => {
      toggleNoteSelection(id, checked)
    },
    [toggleNoteSelection]
  )

  const onSelectAllPinned = useCallback(() => {
    const ids = notes.filter(n => n.pinned).map(n => String(n.id))
    setSelectedIds(new Set([...selectedIds, ...ids]))
  }, [notes, selectedIds, setSelectedIds])

  const onSelectAllOthers = useCallback(() => {
    const ids = notes.filter(n => !n.pinned).map(n => String(n.id))
    setSelectedIds(new Set([...selectedIds, ...ids]))
  }, [notes, selectedIds, setSelectedIds])

  // Cache/Persistence helpers (Legacy)
  const invalidateNotesCache = useCallback(() => {
    const keys = [
      `glassy-dash-notes-${userId || 'anon'}`,
      `glassy-dash-archived-notes-${userId || 'anon'}`,
      `glassy-dash-trash-notes-${userId || 'anon'}`,
      'glassy-dash-notes-cache-timestamp',
    ]
    keys.forEach(k => {
      try {
        localStorage.removeItem(k)
      } catch (e) {}
    })
  }, [userId])

  // SSE
  const handleNotesUpdated = useCallback(() => {
    // Invalidate all notes queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: notesKeys.all })
  }, [queryClient])

  const { sseConnected, isOnline } = useCollaboration({
    token,
    tagFilter,
    onNotesUpdated: handleNotesUpdated,
  })

  // Operations
  const toggleArchiveNote = useCallback(
    async (noteId, archived) => {
      try {
        await toggleArchiveMutation.mutateAsync({ id: noteId, archived: !!archived })
      } catch (e) {
        logger.error('toggle_archive_failed', { noteId }, e)
        throw e
      }
    },
    [toggleArchiveMutation]
  )

  const deleteNote = useCallback(
    async noteId => {
      try {
        await deleteNoteMutation.mutateAsync(noteId)
      } catch (e) {
        logger.error('delete_note_failed', { noteId }, e)
        throw e
      }
    },
    [deleteNoteMutation]
  )

  const restoreNote = useCallback(
    async noteId => {
      try {
        await restoreNoteMutation.mutateAsync(noteId)
      } catch (e) {
        logger.error('restore_note_failed', { noteId }, e)
        throw e
      }
    },
    [restoreNoteMutation]
  )

  const emptyTrash = useCallback(async () => {
    try {
      await emptyTrashMutation.mutateAsync()
    } catch (e) {
      logger.error('empty_trash_failed', {}, e)
      throw e
    }
  }, [emptyTrashMutation])

  const permanentDeleteNote = useCallback(
    async noteId => {
      try {
        await permanentDeleteNoteMutation.mutateAsync(noteId)
      } catch (e) {
        logger.error('perm_delete_failed', { noteId }, e)
        throw e
      }
    },
    [permanentDeleteNoteMutation]
  )

  const createNote = useCallback(
    async noteData => {
      try {
        return await createNoteMutation.mutateAsync(noteData)
      } catch (e) {
        logger.error('create_note_failed', noteData, e)
        throw e
      }
    },
    [createNoteMutation]
  )

  const togglePin = useCallback(
    async (id, toPinned) => {
      try {
        await togglePinMutation.mutateAsync({ id, pinned: !!toPinned })
      } catch (e) {
        logger.error('toggle_pin_failed', { id }, e)
        throw e
      }
    },
    [togglePinMutation]
  )

  const onBulkDelete = useCallback(async () => {
    if (!selectedIds.size) return
    const ids = Array.from(selectedIds)
    try {
      await Promise.allSettled(ids.map(id => deleteNoteMutation.mutateAsync(id)))
      onExitMulti()
    } catch (e) {
      logger.error('bulk_delete_failed', {}, e)
    }
  }, [selectedIds, deleteNoteMutation, onExitMulti])

  const onBulkPin = useCallback(
    async pinned => {
      if (!selectedIds.size) return
      const ids = Array.from(selectedIds)
      try {
        await Promise.allSettled(ids.map(id => togglePinMutation.mutateAsync({ id, pinned })))
        onExitMulti()
      } catch (e) {
        logger.error('bulk_pin_failed', { pinned }, e)
      }
    },
    [selectedIds, togglePinMutation, onExitMulti]
  )

  const onBulkArchive = useCallback(async () => {
    if (!selectedIds.size) return
    const ids = Array.from(selectedIds)
    const archiving = tagFilter !== 'ARCHIVED'
    try {
      await Promise.allSettled(
        ids.map(id => toggleArchiveMutation.mutateAsync({ id, archived: archiving }))
      )
      onExitMulti()
    } catch (e) {
      logger.error('bulk_archive_failed', { archiving }, e)
    }
  }, [selectedIds, toggleArchiveMutation, onExitMulti, tagFilter])

  const onBulkColor = useCallback(
    async color => {
      if (!selectedIds.size) return
      const ids = Array.from(selectedIds)
      try {
        await Promise.allSettled(
          ids.map(id => patchNoteMutation.mutateAsync({ id, updates: { color } }))
        )
        onExitMulti()
      } catch (e) {
        logger.error('bulk_color_failed', { color }, e)
      }
    },
    [selectedIds, patchNoteMutation, onExitMulti]
  )

  const onBulkDownloadZip = useCallback(() => {
    if (!selectedIds.size) return
    const selectedNotesArr = notes.filter(n => selectedIds.has(String(n.id)))
    const json = JSON.stringify(selectedNotesArr, null, 2)
    const fname = `glassy-dash-notes-${selectedIds.size}-${Date.now()}.json`
    downloadText(fname, json)
    logger.info('bulk_download', { count: selectedIds.size })
  }, [selectedIds, notes])

  const updateChecklistItem = useCallback(
    async (noteId, itemId, checked) => {
      // Search in all lists
      const note =
        notes.find(n => String(n.id) === String(noteId)) ||
        archivedNotes.find(n => String(n.id) === String(noteId))

      if (!note) return

      const updatedItems = note.items.map(item =>
        item.id === itemId ? { ...item, done: checked } : item
      )

      try {
        await patchNoteMutation.mutateAsync({
          id: noteId,
          updates: { items: updatedItems, type: 'checklist' },
        })
      } catch (e) {
        logger.error('update_checklist_item_failed', { noteId, itemId }, e)
      }
    },
    [notes, archivedNotes, patchNoteMutation]
  )

  const updateNote = useCallback(
    async (id, updates) => {
      try {
        return await updateNoteMutation.mutateAsync({ id, updates })
      } catch (e) {
        logger.error('update_note_failed', { id }, e)
        throw e
      }
    },
    [updateNoteMutation]
  )

  const reorderNotes = useCallback(
    async noteIds => {
      try {
        await reorderNotesMutation.mutateAsync(noteIds)
        invalidateNotesCache()
      } catch (e) {
        logger.error('reorder_notes_failed', { count: noteIds.length }, e)
        throw e
      }
    },
    [reorderNotesMutation, invalidateNotesCache]
  )

  // Drag and drop handlers
  const onDragStart = useCallback((e, noteId) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(noteId))
  }, [])

  const onDragOver = useCallback(e => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDragLeave = useCallback(e => {
    e.preventDefault()
  }, [])

  const onDrop = useCallback(
    async (e, targetNoteId) => {
      e.preventDefault()
      const draggedId = e.dataTransfer.getData('text/plain')

      if (draggedId && draggedId !== String(targetNoteId)) {
        const allNotes = [...pinned, ...others]
        const draggedIdx = allNotes.findIndex(n => String(n.id) === draggedId)
        const targetIdx = allNotes.findIndex(n => String(n.id) === String(targetNoteId))

        if (draggedIdx === -1 || targetIdx === -1) return

        const reorderedNotes = [...allNotes]
        const [draggedNote] = reorderedNotes.splice(draggedIdx, 1)
        reorderedNotes.splice(targetIdx, 0, draggedNote)

        const noteIds = reorderedNotes.map(n => String(n.id))
        try {
          // Optimistically update the store if possible,
          // but since reorder is complex let's just wait for the API
          await reorderNotes(noteIds)
        } catch (e) {
          logger.error('drop_reorder_failed', { from: draggedId, to: targetNoteId }, e)
        }
      }
    },
    [pinned, others, reorderNotes]
  )

  const onDragEnd = useCallback(e => {
    e.preventDefault()
  }, [])

  const value = {
    notes,
    setNotes,
    pinned,
    others,
    trashNotes,
    setTrashNotes,
    isLoading,
    search,
    setSearch,
    tagFilter,
    setTagFilter,
    tagsWithCounts: tags,
    filteredEmptyWithSearch,
    allEmpty,
    viewTrash,
    setViewTrash,
    multiMode,
    setMultiMode,
    selectedIds,
    setSelectedIds,
    onStartMulti,
    onExitMulti,
    onToggleSelect,
    onSelectAllPinned,
    onSelectAllOthers,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onBulkDelete,
    onBulkPin,
    onBulkArchive,
    onBulkColor,
    onBulkDownloadZip,
    updateChecklistItem,
    createNote,
    updateNote,
    deleteNote,
    toggleArchiveNote,
    restoreNote,
    emptyTrash,
    permanentDeleteNote,
    togglePin,
    invalidateNotesCache,
    sseConnected,
    isOnline,
  }

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

export const useNotes = () => {
  const context = useContext(NotesContext)
  if (!context) throw new Error('useNotes must be used within NotesProvider')
  return context
}
