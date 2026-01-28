import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useDocsStore = create(
  persist(
    (set, _get) => ({
      docs: [],
      activeDocId: null,

      createDoc: (folderId = 'root') => {
        const newDoc = {
          id: crypto.randomUUID(),
          title: 'Untitled Document',
          content: '',
          updatedAt: new Date().toISOString(),
          deletedAt: null, // Track deletion status
          folderId, // Folder organization
          tags: [], // Tags/Constraints
          pinned: false, // Favorites
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
            doc.id === id ? { ...doc, deletedAt: new Date().toISOString() } : doc
          ),
          activeDocId: state.activeDocId === id ? null : state.activeDocId,
        }))
      },

      // Restore from trash
      restoreDoc: id => {
        set(state => ({
          docs: state.docs.map(doc =>
            doc.id === id ? { ...doc, deletedAt: null, updatedAt: new Date().toISOString() } : doc
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

      // --- Enhanced Features ---

      moveDocToFolder: (docId, folderId) => {
        set(state => ({
          docs: state.docs.map(doc =>
            doc.id === docId ? { ...doc, folderId, updatedAt: new Date().toISOString() } : doc
          ),
        }))
      },

      togglePin: docId => {
        set(state => ({
          docs: state.docs.map(doc =>
            doc.id === docId
              ? { ...doc, pinned: !doc.pinned, updatedAt: new Date().toISOString() }
              : doc
          ),
        }))
      },

      addTag: (docId, tag) => {
        set(state => ({
          docs: state.docs.map(doc => {
            if (doc.id !== docId) return doc
            const tags = doc.tags || []
            if (tags.includes(tag)) return doc
            return { ...doc, tags: [...tags, tag], updatedAt: new Date().toISOString() }
          }),
        }))
      },

      removeTag: (docId, tag) => {
        set(state => ({
          docs: state.docs.map(doc => {
            if (doc.id !== docId) return doc
            return {
              ...doc,
              tags: (doc.tags || []).filter(t => t !== tag),
              updatedAt: new Date().toISOString(),
            }
          }),
        }))
      },

      // Bulk Operations
      bulkDeleteDocs: ids => {
        set(state => ({
          docs: state.docs.map(doc =>
            ids.includes(doc.id) ? { ...doc, deletedAt: new Date().toISOString() } : doc
          ),
        }))
      },

      bulkMoveDocs: (ids, folderId) => {
        set(state => ({
          docs: state.docs.map(doc =>
            ids.includes(doc.id) ? { ...doc, folderId, updatedAt: new Date().toISOString() } : doc
          ),
        }))
      },
    }),
    {
      name: 'glassy-docs-storage',
    }
  )
)
