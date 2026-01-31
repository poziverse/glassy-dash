import React, { createContext, useState, useCallback, useContext, useEffect } from 'react'
import { AuthContext } from './AuthContext'
import { useCollaboration } from '../hooks/useCollaboration'
import { downloadText } from '../utils/helpers'
import { api } from '../lib/api'
import logger from '../utils/logger'
import { exportNotesToJson, importNotesFromJson, exportSecretKey } from '../utils/fileSystem'
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
    refetch: _refetchNotes,
  } = useNotesQuery(queryOptions)
  const {
    data: trashData,
    isLoading: trashLoading,
    refetch: _refetchTrash,
  } = useTrash(queryOptions)
  const {
    data: archivedData,
    isLoading: archivedLoading,
    refetch: _refetchArchived,
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
      } catch (_) {}
    })
  }, [userId])

  // SSE
  const handleNotesUpdated = useCallback(() => {
    // Invalidate all notes queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: notesKeys.all })
  }, [queryClient])

  const { sseConnected, isOnline, activeUsers, reportPresence, broadcastTyping, typingUsers } =
    useCollaboration({
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
    if (!selectedIds.length) return
    const ids = [...selectedIds]
    try {
      await Promise.allSettled(ids.map(id => deleteNoteMutation.mutateAsync(id)))
      onExitMulti()
    } catch (e) {
      logger.error('bulk_delete_failed', {}, e)
    }
  }, [selectedIds, deleteNoteMutation, onExitMulti])

  const onBulkPin = useCallback(
    async pinned => {
      if (!selectedIds.length) return
      const ids = [...selectedIds]
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
    if (!selectedIds.length) return
    const ids = [...selectedIds]
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
      if (!selectedIds.length) return
      const ids = [...selectedIds]
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
    if (!selectedIds.length) return
    const selectedNotesArr = notes.filter(n => selectedIds.includes(String(n.id)))
    const json = JSON.stringify(selectedNotesArr, null, 2)
    const fname = `glassy-dash-notes-${selectedIds.length}-${Date.now()}.json`
    downloadText(fname, json)
    logger.info('bulk_download', { count: selectedIds.length })
  }, [selectedIds, notes])

  const updateChecklistItem = useCallback(
    async (noteId, itemId, checked) => {
      // Search in all lists
      const note =
        notes.find(n => String(n.id) === String(noteId)) ||
        archivedNotes.find(n => String(n.id) === String(noteId))

      if (!note) return

      // Ensure items is always an array
      const items = Array.isArray(note.items) ? note.items : []
      const updatedItems = items.map(item =>
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
    async ({ pinnedIds, otherIds }) => {
      try {
        await reorderNotesMutation.mutateAsync({ pinnedIds, otherIds })
        invalidateNotesCache()
      } catch (e) {
        logger.error(
          'reorder_notes_failed',
          { pinned: pinnedIds?.length, others: otherIds?.length },
          e
        )
        throw e
      }
    },
    [reorderNotesMutation, invalidateNotesCache]
  )

  // Drag and drop handlers
  const onDragStart = useCallback((e, noteId) => {
    if (e?.dataTransfer) {
      e.stopPropagation()
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(noteId))
    }
  }, [])

  const onDragOver = useCallback(e => {
    if (e && typeof e.preventDefault === 'function') {
      e.stopPropagation()
      e.preventDefault()
    }
    if (e?.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }, [])

  const onDragLeave = useCallback(e => {
    // Only handle if actually leaving the element (not moving to child)
    if (e && typeof e.preventDefault === 'function' && 
        e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
      e.preventDefault()
    }
  }, [])

  const onDrop = useCallback(
    async (e, targetNoteId) => {
      if (e && typeof e.preventDefault === 'function') {
        e.stopPropagation()
        e.preventDefault()
      }
      
      // Get dragged ID with fallback
      let draggedId = null
      try {
        draggedId = e?.dataTransfer?.getData('text/plain')
      } catch (err) {
        logger.warn('drag_data_retrieval_failed', {}, err)
        return
      }

      if (draggedId && String(draggedId) !== String(targetNoteId)) {
        const draggedNote = [...pinned, ...others].find(n => String(n.id) === draggedId)
        const targetNote = [...pinned, ...others].find(n => String(n.id) === String(targetNoteId))

        if (!draggedNote || !targetNote) return

        let newPinnedNotes = [...pinned]
        let newOtherNotes = [...others]

        // Remove from current
        newPinnedNotes = newPinnedNotes.filter(n => String(n.id) !== draggedId)
        newOtherNotes = newOtherNotes.filter(n => String(n.id) !== draggedId)

        const willBePinned = !!targetNote.pinned
        const updatedNote = { ...draggedNote, pinned: willBePinned }

        // Insert into target
        if (willBePinned) {
          const idx = newPinnedNotes.findIndex(n => String(n.id) === String(targetNoteId))
          if (idx !== -1) newPinnedNotes.splice(idx, 0, updatedNote)
          else newPinnedNotes.push(updatedNote)
        } else {
          const idx = newOtherNotes.findIndex(n => String(n.id) === String(targetNoteId))
          if (idx !== -1) newOtherNotes.splice(idx, 0, updatedNote)
          else newOtherNotes.push(updatedNote)
        }

        const pinnedIds = newPinnedNotes.map(n => String(n.id))
        const otherIds = newOtherNotes.map(n => String(n.id))

        try {
          await reorderNotes({ pinnedIds, otherIds })
        } catch (e) {
          logger.error('drop_reorder_failed', { from: draggedId, to: targetNoteId }, e)
        }
      }
    },
    [pinned, others, reorderNotes]
  )

  const onDragEnd = useCallback(e => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }
  }, [])

  // Export/Import functions
  const exportAllNotes = useCallback(async () => {
    if (!token) throw new Error('Not authenticated')
    try {
      const notesToExport = notes || []
      await exportNotesToJson(notesToExport, userId || 'user')
      logger.info('notes_exported', { count: notesToExport.length })
      return true
    } catch (error) {
      logger.error('notes_export_failed', { userId }, error)
      throw error
    }
  }, [notes, token, userId])

  const importNotes = useCallback(async () => {
    if (!token) throw new Error('Not authenticated')
    try {
      const importedData = await importNotesFromJson()
      if (!importedData) return 0

      const notesArr = Array.isArray(importedData.notes)
        ? importedData.notes
        : Array.isArray(importedData)
          ? importedData
          : []

      if (!notesArr.length) throw new Error('No notes found in file')

      // Import notes via API
      await api('/notes/import', { method: 'POST', token, body: { notes: notesArr } })

      // Refresh notes
      if (window.queryClient) {
        window.queryClient.invalidateQueries({ queryKey: ['notes'] })
      }

      logger.info('notes_imported', { count: notesArr.length })
      return notesArr.length
    } catch (error) {
      logger.error('notes_import_failed', {}, error)
      throw error
    }
  }, [token])

  const downloadSecretKeyFn = useCallback(async () => {
    if (!token) throw new Error('Not authenticated')
    try {
      const data = await api('/secret-key', { method: 'POST', token })
      if (!data?.key) throw new Error('Secret key not returned by server')
      await exportSecretKey(data.key)
      return true
    } catch (error) {
      logger.error('secret_key_download_failed', {}, error)
      throw error
    }
  }, [token])

  const value = {
    notes,
    setNotes,
    pinned,
    others,
    trashNotes,
    archivedNotes,
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
    exportAllNotes,
    importNotes,
    downloadSecretKey: downloadSecretKeyFn,
    sseConnected,
    isOnline,
    activeUsers,
    reportPresence,
    broadcastTyping,
    typingUsers,
  }

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

export const useNotes = () => {
  const context = useContext(NotesContext)
  if (!context) throw new Error('useNotes must be used within NotesProvider')
  return context
}
