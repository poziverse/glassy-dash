import { useNotesStore } from '../stores/notesStore'
import { useAuthStore } from '../stores/authStore'
import { useCollaboration } from '../hooks/useCollaboration'
import { api } from '../lib/api'
import { mdForDownload, sanitizeFilename, downloadText } from '../utils/helpers'
import { useReorderNotes } from './mutations/useNoteMutations'
import logger from '../utils/logger'

const NOTES_CACHE_KEY = 'glassy-dash-notes-'
const ARCHIVED_NOTES_CACHE_KEY = 'glassy-dash-archived-notes-'
const TRASH_NOTES_CACHE_KEY = 'glassy-dash-trash-notes-'
const CACHE_TIMESTAMP_KEY = 'glassy-dash-notes-cache-timestamp'

/**
 * useNotesCompat Hook
 * Provides backward-compatible NotesContext API using Zustand store
 * Components can be migrated incrementally to use useNotesStore directly
 */
export function useNotesCompat() {
  const authStore = useAuthStore()
  const notesStore = useNotesStore()
  const reorderNotesMutation = useReorderNotes()

  const token = authStore.token
  const currentUser = authStore.currentUser
  const userId = currentUser?.id

  // Get state from Zustand store
  const notes = useNotesStore(state => state.notes)
  const pinned = useNotesStore(state => state.pinned)
  const others = useNotesStore(state => state.others)
  const archivedNotes = useNotesStore(state => state.archivedNotes)
  const trashNotes = useNotesStore(state => state.trashNotes)
  const tags = useNotesStore(state => state.tags)
  const notesLoading = useNotesStore(state => state.notesLoading)
  const trashLoading = useNotesStore(state => state.trashLoading)
  const search = useNotesStore(state => state.search)
  const tagFilter = useNotesStore(state => state.tagFilter)
  const multiMode = useNotesStore(state => state.multiMode)
  const selectedIds = useNotesStore(state => state.selectedIds)
  const viewTrash = useNotesStore(state => state.viewTrash)

  // Helper functions
  const getCacheKey = () => NOTES_CACHE_KEY + (userId || 'anon')
  const getArchivedCacheKey = () => ARCHIVED_NOTES_CACHE_KEY + (userId || 'anon')
  const getTrashCacheKey = () => TRASH_NOTES_CACHE_KEY + (userId || 'anon')

  const persistNotesCache = notesArray => {
    try {
      localStorage.setItem(getCacheKey(), JSON.stringify(notesArray))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch (_) {}
  }

  const persistTrashCache = notesArray => {
    try {
      localStorage.setItem(getTrashCacheKey(), JSON.stringify(notesArray))
    } catch (_) {}
  }

  const invalidateNotesCache = () => {
    try {
      localStorage.removeItem(getCacheKey())
      localStorage.removeItem(getArchivedCacheKey())
      localStorage.removeItem(getTrashCacheKey())
      localStorage.removeItem(CACHE_TIMESTAMP_KEY)
    } catch (_) {}
  }

  // Sort notes by recency
  // Sort notes by recency/position
  const sortNotesByRecency = arr => {
    if (!Array.isArray(arr)) return []
    return [...arr].sort((a, b) => {
      const aPos =
        typeof a.position === 'number'
          ? a.position
          : a.timestamp
            ? new Date(a.timestamp).getTime()
            : 0
      const bPos =
        typeof b.position === 'number'
          ? b.position
          : b.timestamp
            ? new Date(b.timestamp).getTime()
            : 0
      return (bPos || 0) - (aPos || 0)
    })
  }

  // Load notes
  const loadNotes = async () => {
    if (!token) return
    notesStore.setNotesLoading(true)
    try {
      const data = await api('/notes', { token })
      const notesArray = Array.isArray(data) ? data : []
      notesStore.setNotes(sortNotesByRecency(notesArray))
      persistNotesCache(notesArray)
    } catch (error) {
      logger.error('load_notes_failed', { status: error.status }, error)
      const cached = localStorage.getItem(getCacheKey())
      if (cached) notesStore.setNotes(sortNotesByRecency(JSON.parse(cached)))
    } finally {
      notesStore.setNotesLoading(false)
    }
  }

  // Load archived notes
  const loadArchivedNotes = async () => {
    if (!token) return
    notesStore.setNotesLoading(true)
    try {
      const data = await api('/notes/archived', { token })
      const notesArray = Array.isArray(data) ? data : []
      notesStore.setArchivedNotes(sortNotesByRecency(notesArray))
      localStorage.setItem(getArchivedCacheKey(), JSON.stringify(notesArray))
    } catch (error) {
      logger.error('load_archived_notes_failed', { status: error.status }, error)
      const cached = localStorage.getItem(getArchivedCacheKey())
      if (cached) notesStore.setArchivedNotes(sortNotesByRecency(JSON.parse(cached)))
    } finally {
      notesStore.setNotesLoading(false)
    }
  }

  // Load trash notes
  const loadTrashNotes = async () => {
    if (!token) return
    notesStore.setTrashLoading(true)
    try {
      const data = await api('/notes/trash', { token })
      const notesArray = Array.isArray(data) ? data : []
      const sorted = notesArray.sort((a, b) => (b.deleted_at || 0) - (a.deleted_at || 0))
      notesStore.setTrashNotes(sorted)
      persistTrashCache(notesArray)
    } catch (error) {
      logger.error('load_trash_notes_failed', { status: error.status }, error)
      const cached = localStorage.getItem(getTrashCacheKey())
      if (cached) {
        const sorted = JSON.parse(cached).sort((a, b) => (b.deleted_at || 0) - (a.deleted_at || 0))
        notesStore.setTrashNotes(sorted)
      }
    } finally {
      notesStore.setTrashLoading(false)
    }
  }

  // Note operations using store methods
  const toggleArchiveNote = async (noteId, archived) => {
    try {
      await api(`/notes/${noteId}/archive`, { method: 'POST', token, body: { archived } })
      invalidateNotesCache()
      if (tagFilter === 'ARCHIVED') {
        await loadArchivedNotes()
      } else {
        await loadNotes()
      }
    } catch (error) {
      logger.error('toggle_archive_failed', { noteId, archived }, error)
      throw error
    }
  }

  const deleteNote = async noteId => {
    try {
      await api(`/notes/${noteId}`, { method: 'DELETE', token })
      notesStore.deleteNote(noteId)
      invalidateNotesCache()
    } catch (error) {
      logger.error('delete_note_failed', { noteId }, error)
      throw error
    }
  }

  const createNote = async noteData => {
    try {
      const created = await api('/notes', { method: 'POST', body: noteData, token })
      notesStore.addNote(created)
      invalidateNotesCache()
      return created
    } catch (error) {
      logger.error('create_note_failed', { type: noteData.type }, error)
      throw error
    }
  }

  const updateChecklistItem = async (noteId, itemId, checked) => {
    const note = notes.find(n => String(n.id) === String(noteId))
    if (!note) return

    const originalItems = [...(note.items || [])]
    const updatedItems = originalItems.map(item =>
      item.id === itemId ? { ...item, done: checked } : item
    )

    notesStore.updateNote(noteId, { items: updatedItems })

    try {
      await api(`/notes/${noteId}`, {
        method: 'PATCH',
        token,
        body: { items: updatedItems, type: 'checklist', content: '' },
      })
      invalidateNotesCache()
    } catch (error) {
      logger.error('update_checklist_item_failed', { noteId, itemId }, error)
      notesStore.updateNote(noteId, { items: originalItems })
      throw error
    }
  }

  const exportAllNotes = async () => {
    if (!token) throw new Error('Not authenticated')
    try {
      const data = await api('/notes/export', { token })
      const json = JSON.stringify(data, null, 2)
      const ts = new Date().toISOString().replace(/[:.]/g, '-')
      const fname = sanitizeFilename(`glassy-dash-notes-${userId || 'user'}-${ts}`) + '.json'
      downloadText(fname, json)
      logger.info('notes_exported', {
        count: Array.isArray(data?.notes) ? data.notes.length : 0,
        filename: fname,
      })
    } catch (error) {
      logger.error('notes_export_failed', { userId }, error)
      throw error
    }
  }

  const importNotes = async fileList => {
    if (!token) throw new Error('Not authenticated')
    if (!fileList || !fileList.length) return
    const file = fileList[0]
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const notesArr = Array.isArray(parsed?.notes)
        ? parsed.notes
        : Array.isArray(parsed)
          ? parsed
          : []
      if (!notesArr.length) throw new Error('No notes found in file')
      await api('/notes/import', { method: 'POST', token, body: { notes: notesArr } })
      await loadNotes()
      logger.info('notes_imported', {
        count: notesArr.length,
        filename: file.name,
      })
      return notesArr.length
    } catch (error) {
      logger.error('notes_import_failed', { fileName: file.name }, error)
      throw error
    }
  }

  const downloadSecretKey = async () => {
    if (!token) throw new Error('Not authenticated')
    const data = await api('/secret-key', { method: 'POST', token })
    if (!data?.key) throw new Error('Secret key not returned by server')
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    const fname = `glassy-dash-secret-key-${ts}.txt`
    const content =
      `Glass Keep  Secret Recovery Key\n\n` +
      `Keep this key safe. Anyone with this key can sign in as you.\n\n` +
      `Secret Key:\n${data.key}\n\n` +
      `Instructions:\n` +
      `1) Go to login page.\n` +
      `2) Click "Forgot username/password?".\n` +
      `3) Choose "Sign in with Secret Key" and paste this key.\n`
    downloadText(fname, content)
  }

  const downloadNoteAsMarkdown = note => {
    const md = mdForDownload(note)
    const fname = sanitizeFilename(note.title || `note-${note.id}`) + '.md'
    downloadText(fname, md)
  }

  // Multi-select operations
  const onStartMulti = () => {
    notesStore.setMultiMode(true)
    notesStore.setSelectedIds(new Set())
  }

  const onExitMulti = () => {
    notesStore.setMultiMode(false)
    notesStore.setSelectedIds(new Set())
  }

  const onToggleSelect = (id, checked) => {
    notesStore.toggleNoteSelection(id, checked)
  }

  const onSelectAllPinned = () => {
    const ids = pinned.map(n => String(n.id))
    notesStore.setSelectedIds(new Set(ids))
  }

  const onSelectAllOthers = () => {
    const ids = others.map(n => String(n.id))
    notesStore.setSelectedIds(new Set(ids))
  }

  // Bulk operations
  const onBulkDelete = async () => {
    if (!selectedIds.size || !token) return
    const idsArray = Array.from(selectedIds)

    const failedIds = []
    try {
      for (const id of idsArray) {
        try {
          await api(`/notes/${id}`, { method: 'DELETE', token })
        } catch (err) {
          failedIds.push(id)
          logger.error('bulk_delete_item_failed', { id }, err)
        }
      }

      if (failedIds.length < idsArray.length) {
        const successIds = idsArray.filter(id => !failedIds.includes(id))
        successIds.forEach(id => notesStore.deleteNote(id))
        invalidateNotesCache()
      }

      if (failedIds.length > 0) {
        throw new Error(`${failedIds.length} of ${idsArray.length} notes failed to delete`)
      }

      onExitMulti()
      logger.info('bulk_delete_complete', {
        total: idsArray.length,
        success: idsArray.length - failedIds.length,
        failed: failedIds.length,
      })
    } catch (error) {
      logger.error('bulk_delete_failed', { count: idsArray.length }, error)
      throw error
    }
  }

  const onBulkPin = async pinned => {
    if (!selectedIds.size || !token) return
    const idsArray = Array.from(selectedIds)

    const failedIds = []
    try {
      for (const id of idsArray) {
        try {
          await api(`/notes/${id}`, { method: 'PATCH', token, body: { pinned } })
        } catch (err) {
          failedIds.push(id)
          logger.error('bulk_pin_item_failed', { id }, err)
        }
      }

      if (failedIds.length < idsArray.length) {
        const successIds = idsArray.filter(id => !failedIds.includes(id))
        successIds.forEach(id => notesStore.togglePin(id, pinned))
        invalidateNotesCache()
      }

      if (failedIds.length > 0) {
        throw new Error(`${failedIds.length} of ${idsArray.length} notes failed to update`)
      }

      onExitMulti()
      logger.info('bulk_pin_complete', {
        total: idsArray.length,
        success: idsArray.length - failedIds.length,
        failed: failedIds.length,
        pinned,
      })
    } catch (error) {
      logger.error('bulk_pin_failed', { count: idsArray.length }, error)
      throw error
    }
  }

  const onBulkArchive = async () => {
    if (!selectedIds.size || !token) return
    const idsArray = Array.from(selectedIds)

    const failedIds = []
    const archiving = tagFilter !== 'ARCHIVED'

    try {
      for (const id of idsArray) {
        try {
          await api(`/notes/${id}/archive`, {
            method: 'POST',
            token,
            body: { archived: archiving },
          })
        } catch (err) {
          failedIds.push(id)
          logger.error('bulk_archive_item_failed', { id }, err)
        }
      }

      if (failedIds.length < idsArray.length) {
        const successIds = idsArray.filter(id => !failedIds.includes(id))
        successIds.forEach(id => notesStore.deleteNote(id))
        invalidateNotesCache()
      }

      if (failedIds.length > 0) {
        throw new Error(
          `${failedIds.length} of ${idsArray.length} notes failed to ${archiving ? 'archive' : 'unarchive'}`
        )
      }

      onExitMulti()
      logger.info('bulk_archive_complete', {
        total: idsArray.length,
        success: idsArray.length - failedIds.length,
        failed: failedIds.length,
        archiving,
      })
    } catch (error) {
      logger.error('bulk_archive_failed', { count: idsArray.length }, error)
      throw error
    }
  }

  const onBulkColor = async color => {
    if (!selectedIds.size || !token) return
    const idsArray = Array.from(selectedIds)

    const failedIds = []
    try {
      for (const id of idsArray) {
        try {
          await api(`/notes/${id}`, { method: 'PATCH', token, body: { color } })
        } catch (err) {
          failedIds.push(id)
          logger.error('bulk_color_item_failed', { id }, err)
        }
      }

      if (failedIds.length < idsArray.length) {
        const successIds = idsArray.filter(id => !failedIds.includes(id))
        successIds.forEach(id => notesStore.updateNote(id, { color }))
        invalidateNotesCache()
      }

      if (failedIds.length > 0) {
        throw new Error(`${failedIds.length} of ${idsArray.length} notes failed to update`)
      }

      onExitMulti()
      logger.info('bulk_color_complete', {
        total: idsArray.length,
        success: idsArray.length - failedIds.length,
        failed: failedIds.length,
        color,
      })
    } catch (error) {
      logger.error('bulk_color_failed', { count: idsArray.length }, error)
      throw error
    }
  }

  const onBulkDownloadZip = () => {
    if (!selectedIds.size) return
    const selectedNotesArr = notes.filter(n => selectedIds.has(String(n.id)))
    const json = JSON.stringify(selectedNotesArr, null, 2)
    const fname = `glassy-dash-notes-${selectedIds.size}-${Date.now()}.json`
    downloadText(fname, json)
    logger.info('bulk_download', { count: selectedIds.size })
  }

  // SSE Collaboration
  const { sseConnected, isOnline } = useCollaboration({
    token,
    tagFilter,
    onNotesUpdated: loadNotes,
  })

  // Drag and drop operations
  const onDragStart = (e, noteId) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }
    if (e?.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(noteId))
    }
  }

  const onDragOver = e => {
    if (e && typeof e.preventDefault === 'function') {
      e.stopPropagation()
      e.preventDefault()
    }
    if (e?.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const onDragLeave = e => {
    // Only handle if actually leaving element (not moving to child)
    if (e && typeof e.preventDefault === 'function' && 
        e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) {
      e.preventDefault()
    }
  }

  const onDrop = async (e, targetNoteId) => {
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

    // Find target note first to ensure it exists
    const allNotes = [...pinned, ...others]
    const targetNote = allNotes.find(n => String(n.id) === String(targetNoteId))

    if (draggedId && targetNote && String(draggedId) !== String(targetNoteId)) {
      // Reorder logic:
      // We start with the full current lists
      let newPinnedNotes = [...pinned]
      let newOtherNotes = [...others]

      // Remove draggedNote from its current position in whichever list it was in
      newPinnedNotes = newPinnedNotes.filter(n => String(n.id) !== draggedId)
      newOtherNotes = newOtherNotes.filter(n => String(n.id) !== draggedId)

      const draggedNote = [...pinned, ...others].find(n => String(n.id) === draggedId)
      if (!draggedNote) return

      // Update pinned status if it changed
      const willBePinned = !!targetNote.pinned
      const updatedNote = { ...draggedNote, pinned: willBePinned }

      // Insert into the target list at the correct position
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
        // Optimistic update to store
        notesStore.reorderNotes(pinnedIds, otherIds)

        // Persistent update to backend
        await reorderNotesMutation.mutateAsync({ pinnedIds, otherIds })

        logger.info('note_reordered', {
          from: draggedId,
          to: targetNoteId,
          isPinned: willBePinned,
        })
      } catch (err) {
        logger.error('note_reorder_failed', { from: draggedId, to: targetNoteId }, err)
        // Note: query cancellation and error handling in mutation should revert RQ cache.
        // For Zustand store, we might need a refresh to restore state if it fails.
        loadNotes()
      }
    }
  }

  const onDragEnd = e => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }
  }

  // Computed values
  const tagsWithCounts = tags

  // Derived state for empty conditions
  const filteredEmptyWithSearch =
    search && pinned.length === 0 && others.length === 0 && archivedNotes.length === 0
  const allEmpty = pinned.length === 0 && others.length === 0 && archivedNotes.length === 0

  return {
    // Auth
    currentUser,
    signOut: authStore.logout,

    // State
    notes,
    pinned,
    others,
    archivedNotes,
    trashNotes,
    tags,
    tagsWithCounts,
    filteredEmptyWithSearch,
    allEmpty,
    notesLoading,
    trashLoading,
    search,
    setSearch: notesStore.setSearch,
    tagFilter,
    setTagFilter: notesStore.setTagFilter,
    multiMode,
    selectedIds,
    viewTrash,
    setViewTrash: notesStore.setViewTrash,

    // Actions
    loadNotes,
    loadArchivedNotes,
    loadTrashNotes,
    toggleArchiveNote,
    deleteNote,
    restoreNote: notesStore.restoreNote,
    emptyTrash: notesStore.emptyTrash,
    permanentDeleteNote: notesStore.permanentDeleteNote,
    createNote,
    updateChecklistItem,
    togglePin: notesStore.togglePin,
    reorderNotes: (pinnedIds, otherIds) =>
      reorderNotesMutation.mutateAsync({ pinnedIds, otherIds }),
    invalidateNotesCache,

    // Multi-select
    onStartMulti,
    onExitMulti,
    onToggleSelect,
    onSelectAllPinned,
    onSelectAllOthers,

    // Bulk operations
    onBulkDelete,
    onBulkPin,
    onBulkArchive,
    onBulkColor,
    onBulkDownloadZip,

    // Import/Export
    exportAllNotes,
    importNotes,
    downloadSecretKey,
    downloadNoteAsMarkdown,

    // Drag and drop
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,

    // SSE
    sseConnected,
    isOnline,
  }
}
