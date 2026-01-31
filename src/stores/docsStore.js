import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// API base URL
const API_BASE = '/api/documents'

// Helper function to get auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('glassy-dash-token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// API wrapper with error handling
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'API request failed')
    }

    return response.json()
  } catch (error) {
    console.error('[docsStore] API error:', error)
    throw error
  }
}

// Load documents from API
async function loadDocumentsFromAPI() {
  try {
    const response = await apiRequest(`${API_BASE}`)
    return response || []
  } catch (error) {
    console.error('[docsStore] Failed to load documents:', error)
    return []
  }
}

// Load trash from API
async function loadTrashFromAPI() {
  try {
    const response = await apiRequest(`${API_BASE}/trash`)
    return response || []
  } catch (error) {
    console.error('[docsStore] Failed to load trash:', error)
    return []
  }
}

export const useDocsStore = create(
  persist(
    (set, get) => ({
      docs: [],
      trash: [],
      activeDocId: null,
      loading: false,
      error: null,

      // Load all documents
      loadDocuments: async () => {
        set({ loading: true, error: null })
        try {
          const docs = await loadDocumentsFromAPI()
          set({ docs, loading: false, error: null })
        } catch (error) {
          set({ loading: false, error: error.message })
        }
      },

      // Load trash
      loadTrash: async () => {
        set({ loading: true, error: null })
        try {
          const trash = await loadTrashFromAPI()
          set({ trash, loading: false, error: null })
        } catch (error) {
          set({ loading: false, error: error.message })
        }
      },

      createDoc: async (folderId = 'root') => {
        const newDoc = {
          id: crypto.randomUUID(),
          title: 'Untitled Document',
          content: '',
          folderId,
          tags: [],
          pinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        }

        try {
          set({ loading: true, error: null })

          // Optimistic update
          set(state => ({
            docs: [newDoc, ...state.docs],
            activeDocId: state.activeDocId,
          }))

          // API call
          await apiRequest(API_BASE, {
            method: 'POST',
            body: JSON.stringify(newDoc),
          })

          // Reload to get server response
          await get().loadDocuments()

          set({ loading: false, error: null })
          return newDoc.id
        } catch (error) {
          // Rollback on error
          set(state => ({
            docs: state.docs.filter(d => d.id !== newDoc.id),
            loading: false,
            error: error.message,
          }))
          throw error
        }
      },

      updateDoc: async (id, updates) => {
        const currentDoc = get().docs.find(d => d.id === id)
        if (!currentDoc) return

        const updatedDoc = {
          ...currentDoc,
          ...updates,
          updatedAt: new Date().toISOString(),
        }

        try {
          set({ loading: true, error: null })

          // Optimistic update
          set(state => ({
            docs: state.docs.map(d => (d.id === id ? updatedDoc : d)),
          }))

          // API call
          await apiRequest(`${API_BASE}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedDoc),
          })

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          set(state => ({
            docs: state.docs.map(d => (d.id === id ? currentDoc : d)),
            loading: false,
            error: error.message,
          }))
          throw error
        }
      },

      deleteDoc: async id => {
        try {
          set({ loading: true, error: null })

          // Optimistic update (soft delete)
          set(state => ({
            docs: state.docs.filter(d => d.id !== id),
            activeDocId: state.activeDocId === id ? null : state.activeDocId,
          }))

          // API call
          await apiRequest(`${API_BASE}/${id}`, { method: 'DELETE' })

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          await get().loadDocuments()
          set({ loading: false, error: error.message })
          throw error
        }
      },

      restoreDoc: async id => {
        try {
          set({ loading: true, error: null })

          // API call
          await apiRequest(`${API_BASE}/${id}/restore`, { method: 'POST' })

          // Reload both docs and trash
          await get().loadDocuments()
          await get().loadTrash()

          set({ loading: false, error: null })
        } catch (error) {
          set({ loading: false, error: error.message })
          throw error
        }
      },

      permanentDeleteDoc: async id => {
        try {
          set({ loading: true, error: null })

          // API call
          await apiRequest(`${API_BASE}/${id}/permanent`, { method: 'DELETE' })

          // Reload trash
          await get().loadTrash()

          set({ loading: false, error: null })
        } catch (error) {
          set({ loading: false, error: error.message })
          throw error
        }
      },

      clearTrash: async () => {
        try {
          set({ loading: true, error: null })

          // API call
          await apiRequest(`${API_BASE}/trash`, { method: 'DELETE' })

          // Reload trash
          await get().loadTrash()

          set({ loading: false, error: null })
        } catch (error) {
          set({ loading: false, error: error.message })
          throw error
        }
      },

      setActiveDoc: id => set({ activeDocId: id }),

      // --- Enhanced Features ---

      moveDocToFolder: async (docId, folderId) => {
        return get().updateDoc(docId, { folderId })
      },

      togglePin: async docId => {
        const currentDoc = get().docs.find(d => d.id === docId)
        if (!currentDoc) return

        const newPinned = !currentDoc.pinned

        try {
          set({ loading: true, error: null })

          // Optimistic update
          set(state => ({
            docs: state.docs.map(d =>
              d.id === docId ? { ...d, pinned: newPinned, updatedAt: new Date().toISOString() } : d
            ),
          }))

          // API call
          await apiRequest(`${API_BASE}/${docId}/pin`, { method: 'POST' })

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          set(state => ({
            docs: state.docs.map(d => (d.id === docId ? currentDoc : d)),
            loading: false,
            error: error.message,
          }))
          throw error
        }
      },

      addTag: async (docId, tag) => {
        const currentDoc = get().docs.find(d => d.id === docId)
        if (!currentDoc) return

        const tags = currentDoc.tags || []
        if (tags.includes(tag)) return

        const newTags = [...tags, tag]

        try {
          set({ loading: true, error: null })

          // Optimistic update
          set(state => ({
            docs: state.docs.map(d =>
              d.id === docId ? { ...d, tags: newTags, updatedAt: new Date().toISOString() } : d
            ),
          }))

          // API call
          await apiRequest(`${API_BASE}/${docId}`, {
            method: 'PATCH',
            body: JSON.stringify({ tags: newTags }),
          })

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          set(state => ({
            docs: state.docs.map(d => (d.id === docId ? currentDoc : d)),
            loading: false,
            error: error.message,
          }))
          throw error
        }
      },

      removeTag: async (docId, tag) => {
        const currentDoc = get().docs.find(d => d.id === docId)
        if (!currentDoc) return

        const newTags = (currentDoc.tags || []).filter(t => t !== tag)

        try {
          set({ loading: true, error: null })

          // Optimistic update
          set(state => ({
            docs: state.docs.map(d =>
              d.id === docId ? { ...d, tags: newTags, updatedAt: new Date().toISOString() } : d
            ),
          }))

          // API call
          await apiRequest(`${API_BASE}/${docId}`, {
            method: 'PATCH',
            body: JSON.stringify({ tags: newTags }),
          })

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          set(state => ({
            docs: state.docs.map(d => (d.id === docId ? currentDoc : d)),
            loading: false,
            error: error.message,
          }))
          throw error
        }
      },

      // Bulk Operations
      bulkDeleteDocs: async ids => {
        try {
          set({ loading: true, error: null })

          // Optimistic update
          set(state => ({
            docs: state.docs.filter(d => !ids.includes(d.id)),
          }))

          // API call for each ID
          await Promise.all(
            ids.map(id => apiRequest(`${API_BASE}/${id}`, { method: 'DELETE' }))
          )

          // Reload to ensure consistency
          await get().loadDocuments()

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          await get().loadDocuments()
          set({ loading: false, error: error.message })
          throw error
        }
      },

      bulkMoveDocs: async (ids, folderId) => {
        try {
          set({ loading: true, error: null })

          // Optimistic update
          set(state => ({
            docs: state.docs.map(d =>
              ids.includes(d.id) ? { ...d, folderId, updatedAt: new Date().toISOString() } : d
            ),
          }))

          // API call for each ID
          await Promise.all(
            ids.map(id =>
              apiRequest(`${API_BASE}/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ folderId }),
              })
            )
          )

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          await get().loadDocuments()
          set({ loading: false, error: error.message })
          throw error
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'glassy-docs-storage',
      partialize: state => ({
        activeDocId: state.activeDocId,
      }),
    }
  )
)