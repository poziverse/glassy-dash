import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Store for managing document folders and hierarchy
 */
export const useDocsFolderStore = create(
  persist(
    (set, get) => ({
      // Default structure has a root folder
      folders: [{ id: 'root', name: 'All Documents', parentId: null, isSystem: true }],
      expandedFolders: ['root'], // IDs of expanded folders in sidebar
      activeFolderId: 'root', // Currently selected folder

      // Actions
      setActiveFolder: folderId => set({ activeFolderId: folderId }),

      createFolder: (name, parentId = 'root') => {
        const newFolder = {
          id: crypto.randomUUID(),
          name: name.trim() || 'Untitled Folder',
          parentId,
          createdAt: new Date().toISOString(),
          isSystem: false,
        }

        set(state => ({
          folders: [...state.folders, newFolder],
          expandedFolders: [...state.expandedFolders, parentId], // Auto-expand parent
        }))

        return newFolder.id
      },

      renameFolder: (id, newName) => {
        set(state => ({
          folders: state.folders.map(f =>
            f.id === id && !f.isSystem ? { ...f, name: newName.trim() } : f
          ),
        }))
      },

      deleteFolder: id => {
        // Note: Moving docs out of this folder is handled by the component or docsStore
        set(state => ({
          folders: state.folders.filter(f => f.id !== id),
          activeFolderId: state.activeFolderId === id ? 'root' : state.activeFolderId,
        }))
      },

      toggleFolder: id => {
        set(state => {
          const isExpanded = state.expandedFolders.includes(id)
          return {
            expandedFolders: isExpanded
              ? state.expandedFolders.filter(fid => fid !== id)
              : [...state.expandedFolders, id],
          }
        })
      },

      // Helpers
      getFolder: id => get().folders.find(f => f.id === id),

      getChildFolders: parentId =>
        get()
          .folders.filter(f => f.parentId === parentId)
          .sort((a, b) => a.name.localeCompare(b.name)),

      getFolderPath: folderId => {
        const path = []
        let current = get().folders.find(f => f.id === folderId)

        while (current) {
          path.unshift(current)
          current = get().folders.find(f => f.id === current.parentId)
        }

        return path
      },
    }),
    {
      name: 'glassy-docs-folders',
      version: 1,
    }
  )
)
