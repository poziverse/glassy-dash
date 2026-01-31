import React, { useState, useMemo } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { bgFor } from '../themes'
import DashboardLayout from './DashboardLayout'
import { useAuthStore } from '../stores/authStore'
import { useDocsStore } from '../stores/docsStore'
import { useDocsFolderStore } from '../stores/docsFolderStore'
import { useUIStore } from '../stores/uiStore'
import logger from '../utils/logger'
import ErrorMessage from './ErrorMessage'
import GlassyEditor from './editor/Editor'
import DocsSidebar from './DocsSidebar'
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  MoreVertical,
  ChevronRight,
  Search,
  RotateCcw,
  XCircle,
  Folder,
  LayoutGrid,
  List as ListIcon,
  SortAsc,
  CheckSquare,
  Square,
  Pin,
  Edit,
} from 'lucide-react'
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from './ContextMenu'
import { safeUserMarkdown } from '../utils/safe-markdown'

export default function DocsView() {
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.logout)
  const setSettingsPanelOpen = useUIStore(state => state.setSettingsPanelOpen)
  const isAdmin = currentUser?.is_admin === true
  const { dark, cardTransparency } = useSettingsStore()

  // Store usage
  const {
    docs,
    activeDocId,
    createDoc,
    updateDoc,
    deleteDoc,
    restoreDoc,
    permanentDeleteDoc,
    clearTrash,
    setActiveDoc,
    togglePin,
    bulkDeleteDocs,
  } = useDocsStore()

  const { activeFolderId, getFolder } = useDocsFolderStore()

  // Local state
  const [searchTerm, setSearchTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [toastMessage, setToastMessage] = useState(null)
  const [deletingDocId, setDeletingDocId] = useState(null)
  const [showTrash, setShowTrash] = useState(false)

  // New features state
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('updatedAt') // 'updatedAt' | 'title' | 'createdAt'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' | 'desc'
  const [selectedDocIds, setSelectedDocIds] = useState([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [error, setError] = useState(null)
  const [contextMenu, setContextMenu] = useState(null) // { x, y, docId }

  // Derived state
  const activeDoc = docs?.find(d => d.id === activeDocId)
  const activeFolder = getFolder(activeFolderId) || { name: 'All Documents' }

  const filteredDocs = useMemo(() => {
    let result = showTrash
      ? docs.filter(d => d.deletedAt)
      : docs.filter(
          d =>
            !d.deletedAt &&
            (d.folderId === activeFolderId || (!d.folderId && activeFolderId === 'root'))
        )

    // Filter by search
    if (searchTerm) {
      result = result.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Sort
    return result.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '')
      } else {
        comparison = new Date(b[sortBy] || 0) - new Date(a[sortBy] || 0)
      }
      return sortOrder === 'asc' ? -comparison : comparison
    })
  }, [docs, showTrash, activeFolderId, searchTerm, sortBy, sortOrder])

  // Handlers
  const handleCreate = async () => {
    try {
      setError(null)
      createDoc(activeFolderId)
      setToastMessage('New document created')
      setTimeout(() => setToastMessage(null), 4000)
    } catch (error) {
      logger.error('docs_create_failed', { folderId: activeFolderId }, error)
      setError('Failed to create document. Please try again.')
    }
  }

  const toggleSelection = docId => {
    setSelectedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedDocIds.length} documents?`)) {
      try {
        setError(null)
        bulkDeleteDocs(selectedDocIds)
        setSelectedDocIds([])
        setIsSelectionMode(false)
        setToastMessage('Documents moved to trash')
        setTimeout(() => setToastMessage(null), 3000)
      } catch (error) {
        logger.error('docs_bulk_delete_failed', { docIds: selectedDocIds }, error)
        setError('Failed to delete documents. Please try again.')
      }
    }
  }

  const formatDate = iso => {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
  }

  // ... (Existing handlers specific to this component logic) ...
  const showDeleteConfirm = docId => setDeletingDocId(docId)
  const handleCancelDelete = () => setDeletingDocId(null)

  const handleDeleteConfirm = async () => {
    if (deletingDocId) {
      try {
        setError(null)
        deleteDoc(deletingDocId)
        if (activeDocId === deletingDocId) setActiveDoc(null)
        setDeletingDocId(null)
        setToastMessage(showTrash ? 'Document moved to trash' : 'Document deleted')
        setTimeout(() => setToastMessage(null), 4000)
      } catch (error) {
        logger.error('docs_delete_failed', { docId: deletingDocId }, error)
        setError('Failed to delete document. Please try again.')
      }
    }
  }

  const handleRestore = async docId => {
    try {
      setError(null)
      restoreDoc(docId)
      setToastMessage('Document restored')
      setTimeout(() => setToastMessage(null), 3000)
    } catch (error) {
      logger.error('docs_restore_failed', { docId }, error)
      setError('Failed to restore document. Please try again.')
    }
  }

  const handlePermanentDelete = async docId => {
    try {
      setError(null)
      permanentDeleteDoc(docId)
      setToastMessage('Document permanently deleted')
      setTimeout(() => setToastMessage(null), 3000)
    } catch (error) {
      logger.error('docs_permanent_delete_failed', { docId }, error)
      setError('Failed to permanently delete document. Please try again.')
    }
  }

  const handleClearTrash = async () => {
    if (docs.filter(d => d.deletedAt).length > 0 && confirm('Empty trash?')) {
      try {
        setError(null)
        clearTrash()
        setToastMessage('Trash cleared')
        setTimeout(() => setToastMessage(null), 3000)
      } catch (error) {
        logger.error('docs_clear_trash_failed', {}, error)
        setError('Failed to clear trash. Please try again.')
      }
    }
  }

  const handleContextMenu = (e, docId) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      docId,
    })
  }

  return (
    <DashboardLayout
      activeSection="docs"
      onNavigate={section => {
        if (['health', 'alerts', 'admin', 'trash', 'docs', 'voice', 'settings'].includes(section)) {
          window.location.hash = `#/${section}`
        } else if (section === 'overview') {
          window.location.hash = '#/notes'
        }
      }}
      user={currentUser}
      isAdmin={isAdmin}
      title="Documents"
      onSignOut={signOut}
      onOpenSettings={() => setSettingsPanelOpen(true)}
      onSearch={setSearchTerm}
    >
      <div className="h-full flex overflow-hidden">
        {/* Sidebar */}
        {!activeDoc && (
          <div
            className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-white/10 hidden md:block`}
          >
            <DocsSidebar />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-transparent">
          {/* Error Message */}
          {error && (
            <div className="mx-4 mt-4">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            </div>
          )}
          {activeDoc ? (
            // --- EDITOR TOOLBAR & CANVAS ---
            <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
              <div className="flex items-center gap-4 bg-black/20 p-2 border-b border-white/10 backdrop-blur-md">
                <button
                  onClick={() => setActiveDoc(null)}
                  data-testid="back-to-docs"
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-300 transition-colors"
                  title="Back to Docs"
                >
                  <ChevronRight className="rotate-180" size={20} />
                </button>
                <input
                  type="text"
                  value={activeDoc.title}
                  onChange={e => updateDoc(activeDoc.id, { title: e.target.value })}
                  data-testid="doc-title-input"
                  placeholder="Untitled Document"
                  className="bg-transparent border-none outline-none text-lg font-semibold text-gray-100 placeholder-gray-500 flex-1"
                />
                <span className="text-xs text-gray-500 hidden sm:inline mr-2">
                  {activeDoc.updatedAt ? `Saved ${formatDate(activeDoc.updatedAt)}` : 'Unsaved'}
                </span>
                <button
                  onClick={() => showDeleteConfirm(activeDoc.id)}
                  data-testid="delete-doc-button"
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex-1 relative overflow-hidden bg-black/5">
                <div className="absolute inset-0 overflow-y-auto p-4 md:p-8 lg:p-12 scrollbar-thin scrollbar-thumb-white/10">
                  <div
                    className="max-w-4xl mx-auto glass-card rounded-2xl min-h-[800px] p-8 md:p-12 shadow-2xl border border-white/10 transition-all duration-300"
                    style={{
                      backgroundColor: bgFor('default', dark, cardTransparency),
                      backdropFilter: 'blur(var(--glass-blur))',
                      WebkitBackdropFilter: 'blur(var(--glass-blur))',
                    }}
                  >
                    <GlassyEditor
                      content={activeDoc.content}
                      onChange={content => updateDoc(activeDoc.id, { content })}
                      data-testid="doc-editor"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // --- GRID/LIST VIEW ---
            <div className="flex-1 flex flex-col h-full p-4 overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="md:hidden p-2 hover:bg-white/10 rounded-lg text-gray-400"
                  >
                    <LayoutGrid size={20} />
                  </button>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {showTrash ? 'Trash' : activeFolder.name}
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({filteredDocs.length})
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTrash(!showTrash)}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${showTrash ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Trash</span>
                  </button>

                  <div className="h-6 w-px bg-white/10 mx-1" />

                  {/* Sorting */}
                  <button
                    onClick={() =>
                      setSortBy(prev => (prev === 'updatedAt' ? 'title' : 'updatedAt'))
                    }
                    className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors text-xs font-medium flex items-center gap-1"
                    title={`Sort by ${sortBy === 'updatedAt' ? 'Date' : 'Name'}`}
                  >
                    {sortBy === 'updatedAt' ? 'Date' : 'Name'}
                  </button>
                  <button
                    onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                    className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    title={`Sort Order: ${sortOrder === 'desc' ? 'Desc' : 'Asc'}`}
                  >
                    <SortAsc size={18} className={sortOrder === 'desc' ? 'rotate-180' : ''} />
                  </button>

                  <div className="h-6 w-px bg-white/10 mx-1" />

                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                  >
                    <ListIcon size={18} />
                  </button>

                  <button
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`p-2 rounded-lg transition-colors ${isSelectionMode ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    title="Select Multiple"
                  >
                    {isSelectionMode ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {isSelectionMode && selectedDocIds.length > 0 && (
                <div className="mb-4 p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                  <span className="text-indigo-300 font-medium px-2">
                    {selectedDocIds.length} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Delete Selected
                    </button>
                    {/* Move to folder could be added here */}
                  </div>
                </div>
              )}

              {/* Docs Grid/List */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 pb-20">
                {showTrash && filteredDocs.length > 0 && (
                  <div className="mb-4 flex justify-end">
                    <button
                      onClick={handleClearTrash}
                      className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm"
                    >
                      Empty Trash
                    </button>
                  </div>
                )}

                <div
                  className={`
                  grid gap-4 
                  ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                      : 'grid-cols-1'
                  }
                `}
                >
                  {/* Create New Card (Only if not trash and grid mode) */}
                  {!showTrash && viewMode === 'grid' && (
                    <button
                      onClick={handleCreate}
                      data-testid="create-doc-button"
                      className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-300 h-[220px]"
                    >
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus size={24} className="text-indigo-400" />
                      </div>
                      <span className="font-semibold text-gray-200">New Document</span>
                    </button>
                  )}

                  {/* Create New List Item */}
                  {!showTrash && viewMode === 'list' && (
                    <button
                      onClick={handleCreate}
                      data-testid="create-doc-button"
                      className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-colors w-full text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <Plus size={16} className="text-indigo-400" />
                      </div>
                      <span className="font-semibold text-gray-200">Create New Document</span>
                    </button>
                  )}

                  {filteredDocs.map(doc => (
                    <div
                      key={doc.id}
                      data-testid="doc-card"
                      data-doc-id={doc.id}
                      onClick={() => {
                        if (isSelectionMode) toggleSelection(doc.id)
                        else if (!showTrash) setActiveDoc(doc.id)
                      }}
                      className={`
                        group relative flex rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden
                        ${viewMode === 'grid' ? 'flex-col h-[220px] p-5' : 'flex-row items-center p-4 h-auto'}
                        ${
                          selectedDocIds.includes(doc.id)
                            ? 'bg-indigo-600/20 border-indigo-500'
                            : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 hover:shadow-xl'
                        }
                      `}
                      onContextMenu={e => handleContextMenu(e, doc.id)}
                    >
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <div
                          className={`absolute top-3 left-3 z-10 ${viewMode === 'list' ? 'relative top-0 left-0 mr-4' : ''}`}
                        >
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center ${selectedDocIds.includes(doc.id) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-500 bg-black/40'}`}
                          >
                            {selectedDocIds.includes(doc.id) && (
                              <CheckSquare size={14} className="text-white" />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Icon */}
                      <div
                        className={`
                         rounded-lg flex items-center justify-center flex-shrink-0
                         ${viewMode === 'grid' ? 'w-10 h-10 mb-3' : 'w-10 h-10 mr-4'}
                         ${doc.pinned ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-400'}
                      `}
                      >
                        <FileText size={20} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-100 truncate mb-1">
                          {doc.title || 'Untitled'}
                        </h3>
                        <div
                          className={`text-sm text-gray-400 prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-p:my-0 ${viewMode === 'grid' ? 'line-clamp-4' : 'line-clamp-1'}`}
                          dangerouslySetInnerHTML={{
                            __html: safeUserMarkdown(doc.content || '')
                              .replace(/<img[^>]*>/g, '') // Remove images from previews
                              .replace(/<h[1-6][^>]*>.*?<\/h[1-6]>/g, s =>
                                s.replace(/<h[1-6]/g, '<p').replace(/<\/h[1-6]>/g, '</p>')
                              ), // Convert headers to paragraphs for preview
                          }}
                        />
                      </div>

                      {/* Footer/Meta */}
                      <div
                        className={`
                        flex items-center text-xs text-gray-500
                        ${viewMode === 'grid' ? 'mt-auto pt-3 border-t border-white/5 justify-between w-full' : 'ml-4 gap-4'}
                      `}
                      >
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(doc.updatedAt)}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!showTrash && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                togglePin(doc.id)
                              }}
                              className={`p-1.5 rounded hover:bg-white/10 ${doc.pinned ? 'text-yellow-500' : 'text-gray-400'}`}
                              title="Pin"
                            >
                              {doc.pinned ? (
                                <Pin size={14} className="fill-current" />
                              ) : (
                                <Pin size={14} />
                              )}
                            </button>
                          )}
                          {showTrash ? (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                handleRestore(doc.id)
                              }}
                              className="p-1.5 rounded hover:bg-green-500/20 text-green-400"
                            >
                              <RotateCcw size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                showDeleteConfirm(doc.id)
                              }}
                              className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredDocs.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                      {showTrash ? 'Trash is empty' : 'No documents found in this folder'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-300 z-50">
              <CheckSquare size={20} />
              <span className="font-medium">{toastMessage}</span>
            </div>
          )}

          {/* Delete Confirm */}
          {deletingDocId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
              <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Confirm Delete</h3>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to move this document to trash?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelDelete}
                    className="flex-1 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          dark={dark}
        >
          {showTrash ? (
            <>
              <ContextMenuItem
                icon={<RotateCcw size={16} />}
                label="Restore"
                onClick={() => {
                  handleRestore(contextMenu.docId)
                  setContextMenu(null)
                }}
              />
              <ContextMenuItem
                icon={<Trash2 size={16} />}
                label="Delete Permanently"
                danger
                onClick={() => {
                  handlePermanentDelete(contextMenu.docId)
                  setContextMenu(null)
                }}
              />
            </>
          ) : (
            <>
              <ContextMenuItem
                icon={<Edit size={16} />}
                label="Open / Rename"
                onClick={() => {
                  const doc = docs.find(d => d.id === contextMenu.docId)
                  if (doc) {
                    setActiveDoc(doc.id)
                    // Optional: could trigger rename state here if we had a quick rename
                  }
                  setContextMenu(null)
                }}
              />
              <ContextMenuItem
                icon={
                  <Pin
                    size={16}
                    className={
                      docs.find(d => d.id === contextMenu.docId)?.pinned ? 'fill-current' : ''
                    }
                  />
                }
                label={docs.find(d => d.id === contextMenu.docId)?.pinned ? 'Unpin' : 'Pin'}
                onClick={() => {
                  togglePin(contextMenu.docId)
                  setContextMenu(null)
                }}
              />
              <ContextMenuSeparator dark={dark} />
              <ContextMenuItem
                icon={<Trash2 size={16} />}
                label="Move to Trash"
                danger
                onClick={() => {
                  showDeleteConfirm(contextMenu.docId)
                  setContextMenu(null)
                }}
              />
            </>
          )}
        </ContextMenu>
      )}
    </DashboardLayout>
  )
}
