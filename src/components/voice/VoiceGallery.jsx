import React, { useState } from 'react'
import { useVoiceStore } from '../../stores/voiceStore'
import {
  Mic,
  Play,
  Edit2,
  Trash2,
  Search,
  Calendar,
  Sparkles,
  ExternalLink,
  FileText,
} from 'lucide-react'
import ImportButton from './ImportButton'
import ImportDialog from './ImportDialog'
import EditRecordingModal from './EditRecordingModal'
import ExportSaveModal from './ExportSaveModal'

export default function VoiceGallery() {
  const {
    recordings,
    searchRecordings,
    deleteRecording,
    editRecording,
    loadRecordingForEdit,
    importRecordings,
    getRecordingAudioUrl,
  } = useVoiceStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRecordingId, setEditingRecordingId] = useState(null)

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportRecording, setExportRecording] = useState(null)

  const filteredRecordings = searchTerm ? searchRecordings(searchTerm) : recordings

  const formatDate = iso => {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = seconds => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    if (confirm('Delete this recording?')) {
      deleteRecording(id)
    }
  }

  const handleEdit = (id, e) => {
    e.stopPropagation()
    setEditingRecordingId(id)
    setShowEditModal(true)
  }

  const handlePlay = async (recording, e) => {
    e.stopPropagation()
    try {
      const audioUrl = await getRecordingAudioUrl(recording.id)
      if (audioUrl) {
        const audio = new Audio(audioUrl)
        audio.play()
      }
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }

  const handleImport = async files => {
    setIsImporting(true)
    setShowImportDialog(true)

    try {
      const allRecordings = []
      for (const file of files) {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const text = await file.text()
          try {
            const data = JSON.parse(text)
            if (Array.isArray(data)) {
              allRecordings.push(...data)
            } else {
              allRecordings.push(data)
            }
          } catch (e) {
            console.error('Invalid JSON file:', file.name)
          }
        }
      }

      const results = importRecordings(allRecordings)
      setImportResults(results)
    } catch (err) {
      console.error('Import Error:', err)
    } finally {
      setIsImporting(false)
    }
  }

  const handleDragOver = e => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = e => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleImport(files)
    }
  }

  return (
    <div
      className={`space-y-6 min-h-[400px] transition-all duration-300 rounded-3xl p-4 ${isDragging ? 'bg-indigo-500/10 ring-2 ring-dashed ring-indigo-500' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header with Search and Import */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-100">Recent Recordings</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <ImportButton onImport={handleImport} isLoading={isImporting} />
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search recordings..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-indigo-500/50 focus:outline-none transition-colors text-white placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      <ImportDialog
        isOpen={showImportDialog}
        isProcessing={isImporting}
        results={importResults}
        onClose={() => {
          setShowImportDialog(false)
          setImportResults(null)
        }}
      />

      {/* Edit Modal */}
      <EditRecordingModal
        isOpen={showEditModal}
        recordingId={editingRecordingId}
        onClose={() => {
          setShowEditModal(false)
          setEditingRecordingId(null)
        }}
      />

      {/* Grid of recordings */}
      {filteredRecordings.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <Mic className="mx-auto mb-4 opacity-20" size={48} />
          <p>
            {searchTerm
              ? 'No recordings match your search.'
              : 'No recordings yet. Start recording your ideas!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredRecordings.map(recording => (
            <div
              key={recording.id}
              className="group relative flex flex-col p-6 rounded-2xl glass-card border border-white/10 hover:border-indigo-500/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left min-h-[240px]"
            >
              {/* Header with type badge */}
              <div className="mb-4 flex justify-between items-start">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Mic size={20} />
                </div>
                <span
                  className={`
                  text-xs font-medium px-2 py-1 rounded-full
                  ${
                    recording.type === 'notes'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-indigo-500/20 text-indigo-400'
                  }
                `}
                >
                  {recording.type === 'notes' ? 'Note' : 'Gallery'}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-lg text-gray-100 mb-2 line-clamp-2">
                {recording.title}
              </h3>

              {/* Transcript Preview */}
              <p className="text-sm text-gray-400 line-clamp-3 flex-1 mb-4">
                {recording.transcript.substring(0, 150)}...
              </p>

              {/* AI Summary Badge */}
              {recording.summary && (
                <div className="mb-4 flex items-center gap-1 text-xs text-indigo-400">
                  <Sparkles size={12} />
                  <span>AI Summarized</span>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between w-full text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{formatDate(recording.createdAt)}</span>
                </div>
                {recording.duration > 0 && <span>{formatDuration(recording.duration)}</span>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={e => handlePlay(recording, e)}
                  disabled={!recording.audioStorageId && !recording.audioData}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                    font-medium text-sm transition-all duration-200
                    ${
                      recording.audioStorageId || recording.audioData
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }
                  `}
                  title="Play Audio"
                >
                  <Play size={16} className="fill-current" />
                  Play
                </button>

                <button
                  onClick={e => handleEdit(recording.id, e)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
                  title="Edit"
                >
                  <Edit2 size={16} />
                  Edit
                </button>

                {recording.type === 'notes' && (
                  <button
                    onClick={() => (window.location.hash = `#/notes`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors"
                    title="View in Notes"
                  >
                    <ExternalLink size={16} />
                    Notes
                  </button>
                )}

                <button
                  onClick={e => {
                    e.stopPropagation()
                    setExportRecording(recording)
                    setShowExportModal(true)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-sm transition-colors"
                  title="Convert to Note/Doc"
                >
                  <FileText size={16} />
                  Convert
                </button>

                <button
                  onClick={e => handleDelete(recording.id, e)}
                  className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export/Save Modal */}
      {showExportModal && exportRecording && (
        <ExportSaveModal
          recording={exportRecording}
          onClose={() => {
            setShowExportModal(false)
            setExportRecording(null)
          }}
          onSave={() => {
            setShowExportModal(false)
            setExportRecording(null)
          }}
        />
      )}
    </div>
  )
}
