import React, { useEffect, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useDocsStore } from '../stores/docsStore'
import GlassyEditor from './editor/Editor'
import { FileText, Plus, Trash2, Calendar, MoreVertical, ChevronRight, Search, RotateCcw, XCircle } from 'lucide-react'

export default function DocsView() {
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.signOut)
  const dark = useSettingsStore(state => state.dark)

  // Store usage
  const { docs, activeDocId, createDoc, updateDoc, deleteDoc, restoreDoc, permanentDeleteDoc, clearTrash, setActiveDoc } = useDocsStore()

  // Local state
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [toastMessage, setToastMessage] = useState(null)
  const [deletingDocId, setDeletingDocId] = useState(null)
  const [editingDocId, setEditingDocId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [showTrash, setShowTrash] = useState(false)

  // Derived state
  const activeDoc = docs.find(d => d.id === activeDocId)
  const activeDocs = docs.filter(d => !d.deletedAt)
  const trashDocs = docs.filter(d => d.deletedAt)
  const filteredDocs = showTrash 
    ? trashDocs.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : activeDocs.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCreate = () => {
    createDoc()
    setToastMessage(' New document created')
    setTimeout(() => setToastMessage(null), 4000)
  }

  const formatDate = iso => {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  }

  const showDeleteConfirm = (docId) => {
    setDeletingDocId(docId)
  }

  const handleDeleteConfirm = () => {
    if (deletingDocId) {
      deleteDoc(deletingDocId)
      // Clear active doc if we're deleting it
      if (activeDocId === deletingDocId) {
        setActiveDoc(null)
      }
      setDeletingDocId(null)
      setToastMessage(showTrash ? 'Document moved to trash' : 'Document deleted')
      setTimeout(() => setToastMessage(null), 4000)
    }
  }

  const handleRestore = (docId) => {
    restoreDoc(docId)
    setToastMessage('Document restored')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handlePermanentDelete = (docId) => {
    permanentDeleteDoc(docId)
    setToastMessage('Document permanently deleted')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleClearTrash = () => {
    if (trashDocs.length > 0 && confirm(`Permanently delete ${trashDocs.length} item(s) from trash? This cannot be undone.`)) {
      clearTrash()
      setToastMessage('Trash cleared')
      setTimeout(() => setToastMessage(null), 3000)
    }
  }

  const handleCancelDelete = () => {
    setDeletingDocId(null)
  }

  const startEditTitle = (doc) => {
    setEditingDocId(doc.id)
    setEditTitle(doc.title || 'Untitled')
  }

  const saveEditedTitle = () => {
    if (editingDocId) {
      updateDoc(editingDocId, { title: editTitle })
      setEditingDocId(null)
      setEditTitle('')
      setToastMessage(' Title updated')
      setTimeout(() => setToastMessage(null), 4000)
    }
  }

  const cancelEditTitle = () => {
    setEditingDocId(null)
    setEditTitle('')
  }

  return (
    <DashboardLayout
      activeSection="docs"
      onNavigate={page => {
        window.location.hash = page === 'overview' ? '#/notes' : `#/${page}`;
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }}
      user={currentUser}
      title="Documents"
      onSignOut={signOut}
    >
      <div className="h-full flex flex-col">
        {activeDoc ? (
          // --- EDITOR VIEW ---
          <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
            {/* Editor Toolbar / Header */}
            <div className="mb-4 flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setActiveDoc(null)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
                title="Back to Docs"
              >
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <input
                type="text"
                value={activeDoc.title}
                onChange={e => updateDoc(activeDoc.id, { title: e.target.value })}
                placeholder="Untitled Document"
                className="bg-transparent border-none outline-none text-lg font-semibold text-gray-100 placeholder-gray-500 flex-1"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 hidden sm:inline">
                  {activeDoc.updatedAt ? `Saved ${formatDate(activeDoc.updatedAt)}` : 'Unsaved'}
                </span>
                <button
                  onClick={() => showDeleteConfirm(activeDoc.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Editor Container */}
            <div className="flex-1 glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative">
              <div className="absolute inset-0 overflow-y-auto p-6 md:p-12 scrollbar-thin scrollbar-thumb-white/10">
                <GlassyEditor
                  content={activeDoc.content}
                  onChange={content => updateDoc(activeDoc.id, { content })}
                />
              </div>
            </div>
          </div>
        ) : (
          // --- GRID VIEW (Home) ---
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            {/* Search & Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {showTrash ? 'Trash' : 'My Documents'}
                </h1>
                {trashDocs.length > 0 && (
                  <button
                    onClick={() => setShowTrash(!showTrash)}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                      showTrash 
                        ? 'bg-white/10 text-gray-300' 
                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    <Trash2 size={16} className="inline-block mr-2" />
                    {trashDocs.length} in Trash
                  </button>
                )}
              </div>
              <div className="relative w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-accent/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {showTrash && trashDocs.length > 0 && (
              <button
                onClick={handleClearTrash}
                className="mb-6 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
              >
                Clear All Trash
              </button>
            )}

            {/* The Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Create New Card */}
              <button
                onClick={handleCreate}
                className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent/50 transition-all duration-300 min-h-[200px]"
              >
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus size={32} className="text-accent" />
                </div>
                <span className="font-semibold text-lg text-gray-200">New Document</span>
                <span className="text-sm text-gray-500 mt-1">Create a rich text doc</span>
              </button>

              {/* Doc Cards */}
              {filteredDocs.map(doc => (
                <div key={doc.id} className="group relative">
                  {showTrash ? (
                    // Trash View - Restore Option
                    <button
                      onClick={() => handleRestore(doc.id)}
                      className="relative flex flex-col items-center justify-center p-6 rounded-2xl glass-card border border-white/10 min-h-[200px] hover:border-green-500/50 transition-all duration-300"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <RotateCcw size={32} className="text-green-400" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-100 mb-2 truncate w-full text-center">
                        {doc.title || 'Untitled'}
                      </h3>
                      <span className="text-sm text-green-400">Click to restore</span>
                    </button>
                  ) : editingDocId === doc.id ? (
                    // Edit Title Mode
                    <div className="flex flex-col p-6 rounded-2xl glass-card border border-white/10 min-h-[200px]">
                      <div className="flex-1 flex items-start">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEditedTitle()
                            if (e.key === 'Escape') cancelEditTitle()
                          }}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-lg font-bold mb-3 focus:outline-none focus:border-accent/50"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={saveEditedTitle}
                          className="flex-1 px-3 py-2 rounded-lg bg-accent hover:bg-accent/80 text-white text-sm font-medium transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditTitle}
                          className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal Card View
                    <button
                      onClick={() => setActiveDoc(doc.id)}
                      onDoubleClick={() => startEditTitle(doc)}
                      className="relative flex flex-col p-6 rounded-2xl glass-card border border-white/10 hover:border-accent/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left min-h-[200px]"
                    >
                      <div className="mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                          <FileText size={20} />
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-gray-100 mb-2 truncate w-full">
                        {doc.title || 'Untitled'}
                      </h3>
                      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between w-full text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(doc.updatedAt)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              startEditTitle(doc)
                            }}
                            className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-accent transition-colors"
                            title="Rename (double-click)"
                          >
                            <MoreVertical size={14} />
                          </button>
                          {showTrash ? (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handlePermanentDelete(doc.id)
                              }}
                              className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                              title="Permanently Delete"
                            >
                              <XCircle size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                showDeleteConfirm(doc.id)
                              }}
                              className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          <ChevronRight
                            size={14}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-accent"
                          />
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {docs.length === 0 && (
              <div className="text-center py-20">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center">
                    <FileText size={40} className="text-gray-500" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No documents yet</h3>
                <p className="text-gray-500 mb-4">Click "New Document" to create your first rich text document.</p>
              </div>
            )}
            {filteredDocs.length === 0 && docs.length > 0 && (
              <div className="text-center text-gray-500 mt-12">No documents match your search.</div>
            )}
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-300 z-50">
            <CheckCircle size={20} />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingDocId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white/10 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold text-gray-100 mb-2">Delete Document?</h3>
              <p className="text-gray-400 mb-6">This action cannot be undone. The document will be permanently deleted.</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function CheckCircle({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1 0-20 0v-1.5a10 10 0 1 1 0 20 0V12a10 10 0 1 1 0-20 0v-0.92a10 10 0 1 1 0 20 0z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}
