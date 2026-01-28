import React, { useState } from 'react'
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Trash2,
  FolderPlus,
  Edit2,
} from 'lucide-react'
import { useDocsFolderStore } from '../stores/docsFolderStore'

export default function DocsSidebar({ onFolderSelect }) {
  const {
    folders,
    activeFolderId,
    expandedFolders,
    setActiveFolder,
    toggleFolder,
    createFolder,
    deleteFolder,
    renameFolder,
  } = useDocsFolderStore()

  const [isCreating, setIsCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState(null)
  const [editName, setEditName] = useState('')

  const handleCreateFolder = e => {
    e.preventDefault()
    if (newFolderName.trim()) {
      const newId = createFolder(newFolderName, activeFolderId || 'root')
      setNewFolderName('')
      setIsCreating(false)
    }
  }

  const handleStartEdit = (folder, e) => {
    e.stopPropagation()
    setEditingFolderId(folder.id)
    setEditName(folder.name)
  }

  const handleSaveEdit = e => {
    e.stopPropagation()
    if (editName.trim()) {
      renameFolder(editingFolderId, editName)
      setEditingFolderId(null)
    }
  }

  const handleDeleteFolder = (folderId, e) => {
    e.stopPropagation()
    if (confirm('Delete this folder? Documents inside will not be deleted but may be hidden.')) {
      deleteFolder(folderId)
    }
  }

  const renderFolderTree = (parentId = 'root', depth = 0) => {
    const childFolders = folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))

    if (childFolders.length === 0 && parentId !== 'root') return null

    return (
      <div className="pl-2">
        {childFolders.map(folder => {
          const isExpanded = expandedFolders.includes(folder.id)
          const isActive = activeFolderId === folder.id
          const isEditing = editingFolderId === folder.id

          return (
            <div key={folder.id}>
              <div
                className={`
                  group flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors mb-0.5
                  ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                `}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => {
                  setActiveFolder(folder.id)
                  onFolderSelect?.(folder.id)
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      toggleFolder(folder.id)
                    }}
                    className="p-0.5 rounded hover:bg-white/10"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  <Folder size={16} className={isActive ? 'text-indigo-200' : 'text-gray-500'} />

                  {isEditing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit(e)
                        if (e.key === 'Escape') setEditingFolderId(null)
                      }}
                      onClick={e => e.stopPropagation()}
                      className="bg-black/20 text-white rounded px-1.5 py-0.5 w-full min-w-0 focus:outline-none border border-indigo-500/50"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate text-sm font-medium">{folder.name}</span>
                  )}
                </div>

                {!folder.isSystem && (
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => handleStartEdit(folder, e)}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={e => handleDeleteFolder(folder.id, e)}
                      className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              {isExpanded && renderFolderTree(folder.id, depth + 1)}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-xl border-r border-white/10 w-64 flex-shrink-0 animate-in slide-in-from-left-4 duration-300">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Storage</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          title="New Folder"
        >
          <FolderPlus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10">
        {renderFolderTree('root')}

        {isCreating && (
          <div className="px-4 py-2 animate-in fade-in slide-in-from-top-2">
            <form onSubmit={handleCreateFolder} className="flex items-center gap-2">
              <Folder size={16} className="text-indigo-400" />
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder Name"
                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500 w-full"
                autoFocus
                onBlur={() => !newFolderName && setIsCreating(false)}
              />
            </form>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-3/4 rounded-full" />
          </div>
          <span>75%</span>
        </div>
        <div className="mt-1 text-xs text-gray-600">Storage Used</div>
      </div>
    </div>
  )
}
