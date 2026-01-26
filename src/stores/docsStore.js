import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useDocsStore = create(
  persist(
    (set, get) => ({
      docs: [],
      activeDocId: null,

      createDoc: () => {
        const newDoc = {
          id: crypto.randomUUID(),
          title: 'Untitled Document',
          content: '',
          updatedAt: new Date().toISOString(),
          deletedAt: null, // Track deletion status
        }
        set(state => ({
          docs: [newDoc, ...state.docs],
          // Don't auto-open - stay in grid view (UX fix)
          activeDocId: state.activeDocId,
        }))
        return newDoc.id
      },

      updateDoc: (id, updates) => {
        set(state => ({
          docs: state.docs.map(doc =>
            doc.id === id ? { ...doc, ...updates, updatedAt: new Date().toISOString() } : doc
          ),
        }))
      },

      // Soft-delete - moves to trash instead of permanent deletion
      deleteDoc: id => {
        set(state => ({
          docs: state.docs.map(doc =>
            doc.id === id 
              ? { ...doc, deletedAt: new Date().toISOString() }
              : doc
          ),
          activeDocId: state.activeDocId === id ? null : state.activeDocId,
        }))
      },

      // Restore from trash
      restoreDoc: id => {
        set(state => ({
          docs: state.docs.map(doc =>
            doc.id === id 
              ? { ...doc, deletedAt: null, updatedAt: new Date().toISOString() }
              : doc
          ),
        }))
      },

      // Permanently delete (irreversible)
      permanentDeleteDoc: id => {
        set(state => ({
          docs: state.docs.filter(doc => doc.id !== id),
        }))
      },

      // Clear all trash
      clearTrash: () => {
        set(state => ({
          docs: state.docs.filter(doc => !doc.deletedAt),
        }))
      },

      setActiveDoc: id => set({ activeDocId: id }),
    }),
    {
      name: 'glassy-docs-storage',
    }
  )
)
