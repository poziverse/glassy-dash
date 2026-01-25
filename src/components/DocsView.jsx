import React, { useEffect, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useDocsStore } from '../stores/docsStore'
import GlassyEditor from './editor/Editor'
import { FileText, Plus, Trash2, Calendar, MoreVertical, ChevronRight, Search } from 'lucide-react'

export default function DocsView() {
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.signOut)
  const dark = useSettingsStore(state => state.dark)

  // Store usage
  const { docs, activeDocId, createDoc, updateDoc, deleteDoc, setActiveDoc } = useDocsStore()

  // Local state
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Derived state
  const activeDoc = docs.find(d => d.id === activeDocId)
  const filteredDocs = docs.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCreate = () => {
    createDoc()
  }

  // Removed auto-select to ensure Grid View is visible by default

  const formatDate = iso => {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <DashboardLayout
      activeSection="docs"
      onNavigate={page => (window.location.hash = `#/${page}`)}
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
                  onClick={() => {
                    if (confirm('Delete this document?')) {
                      deleteDoc(activeDoc.id)
                    }
                  }}
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                My Documents
              </h1>
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
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc.id)}
                  className="group relative flex flex-col p-6 rounded-2xl glass-card border border-white/10 hover:border-accent/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left min-h-[200px]"
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
                    <ChevronRight
                      size={14}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-accent"
                    />
                  </div>
                </button>
              ))}
            </div>

            {filteredDocs.length === 0 && docs.length > 0 && (
              <div className="text-center text-gray-500 mt-12">No documents match your search.</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
