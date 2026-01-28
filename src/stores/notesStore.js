import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useNotesStore = create(
  persist(
    (set, _get) => ({
      // Initial state
      notes: [],
      pinned: [],
      others: [],
      trashNotes: [],
      archivedNotes: [],
      tags: [],
      selectedIds: new Set(),
      multiMode: false,
      search: '',
      tagFilter: null,
      notesLoading: false,
      trashLoading: false,
      sseConnected: false,
      isOnline: navigator.onLine,

      // Actions
      setNotes: notes => {
        const pinned = notes.filter(n => n.pinned && !n.deleted_at)
        const others = notes.filter(n => !n.pinned && !n.deleted_at)
        const tags = extractTags(notes)

        set({ notes, pinned, others, tags })
      },

      setTrashNotes: trashNotes => {
        set({ trashNotes })
      },

      setArchivedNotes: archivedNotes => {
        set({ archivedNotes })
      },

      addNote: note => {
        set(state => ({
          notes: [note, ...state.notes],
          pinned: note.pinned ? [note, ...state.pinned] : state.pinned,
          others: !note.pinned ? [note, ...state.others] : state.others,
        }))
      },

      updateNote: (id, updates) => {
        set(state => {
          const updateList = list =>
            list.map(n => (String(n.id) === String(id) ? { ...n, ...updates } : n))

          return {
            notes: updateList(state.notes),
            pinned: updateList(state.pinned),
            others: updateList(state.others),
            trashNotes: updateList(state.trashNotes),
            archivedNotes: updateList(state.archivedNotes),
          }
        })
      },

      deleteNote: id => {
        set(state => {
          const filterList = list => list.filter(n => String(n.id) !== String(id))

          return {
            notes: filterList(state.notes),
            pinned: filterList(state.pinned),
            others: filterList(state.others),
            trashNotes: filterList(state.trashNotes),
            archivedNotes: filterList(state.archivedNotes),
          }
        })
      },

      softDeleteNote: noteId => {
        set(state => {
          // Find the note and add deleted_at timestamp
          const deletedAt = Math.floor(Date.now() / 1000)
          const updateWithDelete = list =>
            list.map(n => (String(n.id) === String(noteId) ? { ...n, deleted_at: deletedAt } : n))

          // Move from active lists to trash
          const updatedPinned = state.pinned.filter(n => String(n.id) !== String(noteId))
          const updatedOthers = state.others.filter(n => String(n.id) !== String(noteId))

          // Find the deleted note
          const allUpdated = updateWithDelete(state.notes)
          const deletedNote = allUpdated.find(n => String(n.id) === String(noteId))

          return {
            notes: allUpdated.filter(n => String(n.id) !== String(noteId)),
            pinned: updatedPinned,
            others: updatedOthers,
            trashNotes: deletedNote ? [deletedNote, ...state.trashNotes] : state.trashNotes,
          }
        })
      },

      restoreNote: noteId => {
        set(state => {
          // Find note in trash and remove deleted_at
          const noteToRestore = state.trashNotes.find(n => String(n.id) === String(noteId))

          if (!noteToRestore) return state

          const restoredNote = { ...noteToRestore, deleted_at: null }

          // Remove from trash
          const updatedTrash = state.trashNotes.filter(n => String(n.id) !== String(noteId))

          // Add back to appropriate list
          const addToPinned = restoredNote.pinned
          const updatedPinned = addToPinned ? [restoredNote, ...state.pinned] : state.pinned
          const updatedOthers = !addToPinned ? [restoredNote, ...state.others] : state.others

          return {
            notes: [...state.notes, restoredNote],
            pinned: updatedPinned,
            others: updatedOthers,
            trashNotes: updatedTrash,
          }
        })
      },

      emptyTrash: () => {
        set({ trashNotes: [] })
      },

      permanentDeleteNote: noteId => {
        set(state => ({
          notes: state.notes.filter(n => String(n.id) !== String(noteId)),
          pinned: state.pinned.filter(n => String(n.id) !== String(noteId)),
          others: state.others.filter(n => String(n.id) !== String(noteId)),
          trashNotes: state.trashNotes.filter(n => String(n.id) !== String(noteId)),
          archivedNotes: state.archivedNotes.filter(n => String(n.id) !== String(noteId)),
        }))
      },

      togglePin: (id, toPinned) => {
        set(state => {
          const note = state.notes.find(n => String(n.id) === String(id))
          if (!note) return state

          const isPinned = !!toPinned

          // Remove from current list
          const updatedPinned = state.pinned.filter(n => String(n.id) !== String(id))
          const updatedOthers = state.others.filter(n => String(n.id) !== String(id))

          // Add to appropriate list
          if (isPinned) {
            return {
              notes: state.notes.map(n =>
                String(n.id) === String(id) ? { ...n, pinned: true } : n
              ),
              pinned: [{ ...note, pinned: true }, ...updatedPinned],
              others: updatedOthers,
            }
          } else {
            return {
              notes: state.notes.map(n =>
                String(n.id) === String(id) ? { ...n, pinned: false } : n
              ),
              pinned: updatedPinned,
              others: [{ ...note, pinned: false }, ...updatedOthers],
            }
          }
        })
      },

      setSearch: search => set({ search }),

      setTagFilter: tag => set({ tagFilter: tag }),

      setSelectedIds: ids => set({ selectedIds: ids }),

      toggleNoteSelection: (id, checked) => {
        set(state => {
          const sid = String(id)
          const newSelected = new Set(state.selectedIds)
          if (checked) {
            newSelected.add(sid)
          } else {
            newSelected.delete(sid)
          }
          return { selectedIds: newSelected }
        })
      },

      setMultiMode: mode => set({ multiMode: mode }),

      setNotesLoading: loading => set({ notesLoading: loading }),

      setTrashLoading: loading => set({ trashLoading: loading }),

      setSSEConnected: connected => set({ sseConnected: connected }),

      setIsOnline: online => set({ isOnline: online }),
    }),
    {
      name: 'glassy-dash-notes',
      partialize: state => ({
        notes: state.notes,
        tags: state.tags,
        search: state.search,
        tagFilter: state.tagFilter,
      }),
    }
  )
)

// Helper function to extract tags
function extractTags(notes) {
  const tagMap = {}
  notes.forEach(n => {
    if (Array.isArray(n.tags)) {
      n.tags.forEach(tag => {
        tagMap[tag] = (tagMap[tag] || 0) + 1
      })
    }
  })
  return Object.entries(tagMap).map(([name, count]) => ({ name, count }))
}
