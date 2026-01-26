/**
 * DocumentLinker - Link voice notes to documents
 * Part of Phase 5: Cross-Feature Integration
 * Phase 6 Update: Added error handling, logger integration, React.memo, useMemo, useCallback
 */

import { useState, memo, useMemo, useCallback } from 'react'
import { Link, FileText, Search, Plus, Trash2, ExternalLink, RotateCcw } from 'lucide-react'
import logger from '../../utils/logger'
import { ErrorMessage } from '../ErrorMessage'

function DocumentLinker({ recording, documents, onLink, onUnlink, onCreateDocument }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [error, setError] = useState(null)
  
  // Filter documents with error handling - memoized
  const filteredDocs = useMemo(() => {
    try {
      return documents.filter(doc => {
        try {
          const query = searchQuery.toLowerCase()
          return (
            doc.title.toLowerCase().includes(query) ||
            (doc.content && doc.content.toLowerCase().includes(query))
          )
        } catch (filterError) {
          logger.error('document_filter_failed', { docId: doc.id }, filterError)
          return false
        }
      })
    } catch (error) {
      logger.error('documents_filter_failed', { documentsLength: documents?.length, searchQuery }, error)
      setError('Failed to filter documents. Please try again.')
      return []
    }
  }, [documents, searchQuery])
  
  // Get linked documents with error handling - memoized
  const linkedDocs = useMemo(() => {
    try {
      return documents.filter(doc => 
        recording.linkedDocuments?.includes(doc.id)
      )
    } catch (error) {
      logger.error('linked_docs_failed', { recordingId: recording?.id, linkedDocs: recording?.linkedDocuments }, error)
      setError('Failed to load linked documents. Please try refreshing.')
      return []
    }
  }, [documents, recording?.linkedDocuments])
  
  // Get unlinked documents with error handling - memoized
  const unlinkedDocs = useMemo(() => {
    try {
      return filteredDocs.filter(doc => 
        !recording.linkedDocuments?.includes(doc.id)
      )
    } catch (error) {
      logger.error('unlinked_docs_failed', { recordingId: recording?.id }, error)
      setError('Failed to load available documents. Please try refreshing.')
      return []
    }
  }, [filteredDocs, recording?.linkedDocuments])
  
  // Handle link with error handling - memoized
  const handleLink = useCallback((docId) => {
    try {
      if (!recording?.id || !docId) {
        throw new Error('Missing recording ID or document ID')
      }
      onLink?.(recording.id, docId)
      setError(null)
    } catch (error) {
      logger.error('document_link_failed', { recordingId: recording?.id, docId }, error)
      setError('Failed to link document. Please try again.')
    }
  }, [recording?.id, onLink])
  
  // Handle unlink with error handling - memoized
  const handleUnlink = useCallback((docId) => {
    try {
      if (!recording?.id || !docId) {
        throw new Error('Missing recording ID or document ID')
      }
      onUnlink?.(recording.id, docId)
      setError(null)
    } catch (error) {
      logger.error('document_unlink_failed', { recordingId: recording?.id, docId }, error)
      setError('Failed to unlink document. Please try again.')
    }
  }, [recording?.id, onUnlink])
  
  // Handle create new document with error handling - memoized
  const handleCreateDocument = useCallback(() => {
    try {
      if (!newDocTitle.trim()) {
        setError('Please enter a document title')
        return
      }
      
      if (!recording) {
        throw new Error('No recording data available')
      }
      
      const durationMinutes = Math.floor(recording.duration / 60)
      const durationSeconds = recording.duration % 60
      
      onCreateDocument?.({
        title: newDocTitle,
        content: `## Voice Note: ${recording.title || 'Untitled'}\n\n` +
                  `**Date:** ${new Date(recording.createdAt).toLocaleString()}\n` +
                  `**Duration:** ${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}\n\n` +
                  `### Transcript\n\n${recording.transcript || 'No transcript available'}`,
        folderId: null,
        tags: ['voice-note', `voice-${recording.id}`]
      })
      
      setNewDocTitle('')
      setShowCreate(false)
      setError(null)
    } catch (error) {
      logger.error('document_create_failed', { 
        recordingId: recording?.id, 
        title: newDocTitle 
      }, error)
      setError('Failed to create document. Please try again.')
    }
  }, [newDocTitle, recording, onCreateDocument])
  
  // Format duration with error handling - memoized
  const formatDuration = useCallback((seconds) => {
    try {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    } catch (error) {
      logger.error('duration_format_failed', { seconds }, error)
      return '0:00'
    }
  }, [])
  
  // Format date with error handling - memoized
  const formatDate = useCallback((timestamp) => {
    try {
      return new Date(timestamp).toLocaleDateString()
    } catch (error) {
      logger.error('date_format_failed', { timestamp }, error)
      return 'Invalid date'
    }
  }, [])
  
  // Handle reload - memoized
  const handleReload = useCallback(() => {
    try {
      setError(null)
      window.location.reload()
    } catch (error) {
      logger.error('reload_failed', {}, error)
      setError('Failed to reload. Please refresh the page manually.')
    }
  }, [])
  
  if (error) {
    return (
      <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
        <div className="flex justify-center">
          <button
            onClick={handleReload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RotateCcw size={16} />
            Reload Component
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
      {/* Header */}
      <div>
        <h4 className="text-base font-semibold text-white flex items-center gap-2">
          <Link size={18} className="text-indigo-400" />
          Link to Documents
        </h4>
        <p className="text-xs text-gray-400 mt-1">
          Connect this voice note to related documents
        </p>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/20 border border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none text-sm"
        />
      </div>
      
      {/* Create new document button */}
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="w-full py-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 flex items-center justify-center gap-2 text-sm"
      >
        <Plus size={16} />
        {showCreate ? 'Cancel' : 'Create New Document'}
      </button>
      
      {/* Create new document form */}
      {showCreate && (
        <div className="space-y-3 p-3 rounded-lg bg-black/20 border border-gray-700">
          <input
            type="text"
            placeholder="Document title..."
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateDocument()
              }
            }}
            className="w-full px-3 py-2 rounded bg-black/30 border border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none text-sm"
            autoFocus
          />
          
          <button
            onClick={handleCreateDocument}
            disabled={!newDocTitle.trim()}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Document
          </button>
        </div>
      )}
      
      {/* Linked documents */}
      {linkedDocs.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Linked Documents ({linkedDocs.length})
          </h5>
          
          <div className="space-y-2">
            {linkedDocs.map(doc => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText size={16} className="text-indigo-400 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {doc.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {doc.wordCount || 0} words
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleUnlink(doc.id)}
                  className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-red-400"
                  title="Unlink"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Available documents */}
      {unlinkedDocs.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Available Documents ({unlinkedDocs.length})
          </h5>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {unlinkedDocs.map(doc => (
              <button
                key={doc.id}
                onClick={() => handleLink(doc.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-indigo-500/30 text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {doc.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {doc.wordCount || 0} words • {doc.folder || 'No folder'}
                    </div>
                  </div>
                </div>
                
                <Plus size={16} className="text-indigo-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* No documents */}
      {linkedDocs.length === 0 && unlinkedDocs.length === 0 && (
        <div className="py-8 text-center">
          <FileText size={32} className="text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-300">
            {documents.length === 0 ? 'No documents available' : 'No matching documents'}
          </p>
          {documents.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Create your first document
            </button>
          )}
        </div>
      )}
      
      {/* Voice note info */}
      <div className="p-3 rounded-lg bg-black/20 space-y-2">
        <div className="text-xs text-gray-400">
          <span className="font-medium text-gray-300">Voice Note:</span> {recording?.title || 'Untitled'}
        </div>
        <div className="text-xs text-gray-400">
          <span className="font-medium text-gray-300">Duration:</span>{' '}
          {recording?.duration ? formatDuration(recording.duration) : '0:00'}
        </div>
        <div className="text-xs text-gray-400">
          <span className="font-medium text-gray-300">Created:</span>{' '}
          {recording?.createdAt ? formatDate(recording.createdAt) : 'Unknown'}
        </div>
      </div>
      
      {/* Help text */}
      <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
        <div className="flex items-start gap-2">
          <ExternalLink size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-300">
            Linking documents allows you to easily reference related content when reviewing voice notes.
            Click on a document to link it, or create a new document from this voice note.
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(DocumentLinker)