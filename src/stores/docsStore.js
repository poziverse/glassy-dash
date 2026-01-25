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
        }
        set(state => ({
          docs: [newDoc, ...state.docs],
          activeDocId: newDoc.id,
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

      deleteDoc: id => {
        set(state => ({
          docs: state.docs.filter(doc => doc.id !== id),
          activeDocId: state.activeDocId === id ? null : state.activeDocId,
        }))
      },

      setActiveDoc: id => set({ activeDocId: id }),
    }),
    {
      name: 'glassy-docs-storage',
    }
  )
)
