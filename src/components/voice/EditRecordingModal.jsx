import React, { useState, useEffect } from 'react'
import { X, Save, Mic, Calendar, Clock, Tag as TagIcon } from 'lucide-react'
import { useVoiceStore } from '../../stores/voiceStore'
import TagPicker from './TagPicker'
import MinimalPlaybackControls from './PlaybackControls'
import { formatDuration, formatFileSize } from '../../utils/voiceSearch'

/**
 * Modal for editing voice recordings
 */
export default function EditRecordingModal({ 
  isOpen, 
  onClose, 
  recordingId,
  onSave
}) {
  const {
    recordings,
    editRecording,
    updateRecordingTags
  } = useVoiceStore()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [transcript, setTranscript] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [type, setType] = useState('notes')
  const [hasChanges, setHasChanges] = useState(false)

  // Load recording data when opened
  useEffect(() => {
    if (isOpen && recordingId) {
      const recording = recordings.find(r => r.id === recordingId)
      if (recording) {
        setTitle(recording.title || '')
        setSummary(recording.summary || '')
        setTranscript(recording.transcript || '')
        setSelectedTags(recording.tags || [])
        setType(recording.type || 'notes')
        setHasChanges(false)
      }
    }
  }, [isOpen, recordingId, recordings])

  // Track changes
  useEffect(() => {
    const recording = recordings.find(r => r.id === recordingId)
    if (recording) {
      const changed = 
        title !== (recording.title || '') ||
        summary !== (recording.summary || '') ||
        transcript !== (recording.transcript || '') ||
        type !== (recording.type || 'notes') ||
        JSON.stringify(selectedTags) !== JSON.stringify(recording.tags || [])
      setHasChanges(changed)
    }
  }, [title, summary, transcript, selectedTags, type, recordingId, recordings])

  if (!isOpen) return null

  const recording = recordings.find(r => r.id === recordingId)
  if (!recording) return null

  const handleSave = () => {
    const updates = {
      title,
      summary,
      transcript,
      type
    }
    
    editRecording(recordingId, updates)
    updateRecordingTags(recordingId, selectedTags)
    
    onSave?.(recordingId, updates, selectedTags)
    onClose()
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Content */}
      <div className="relative bg-gray-800 border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Edit Recording
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(recording.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatDuration(recording.duration)}
              </span>
              <span className="flex items-center gap-1">
                <TagIcon size={14} />
                {formatFileSize(recording.audioData?.length || 0)}
              </span>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Audio Player */}
        <div className="px-6 py-4 border-b border-white/10">
          <MinimalPlaybackControls 
            audioUrl={`data:audio/webm;base64,${recording.audioData}`}
          />
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Recording title..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setType('notes')}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all
                    ${type === 'notes'
                      ? 'border-indigo-600 bg-indigo-600/20 text-indigo-400'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                    }
                  `}
                >
                  <Mic size={18} />
                  <span>Voice Note</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('gallery')}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all
                    ${type === 'gallery'
                      ? 'border-purple-600 bg-purple-600/20 text-purple-400'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                    }
                  `}
                >
                  <TagIcon size={18} />
                  <span>Voice Gallery</span>
                </button>
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary of the recording..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors"
              />
            </div>

            {/* Transcript */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Transcript
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Full transcript of the recording..."
                rows={10}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 resize-none transition-colors font-mono text-sm"
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>{transcript.length} characters</span>
                <span>{transcript.split(/\s+/).filter(w => w.length > 0).length} words</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Tags
              </label>
              <TagPicker 
                selectedTags={selectedTags}
                onChange={setSelectedTags}
                showCount={true}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              />
            </div>

            {/* Metadata */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-3">
                Recording Metadata
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Created</div>
                  <div className="text-white">
                    {new Date(recording.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Last Updated</div>
                  <div className="text-white">
                    {new Date(recording.updatedAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Duration</div>
                  <div className="text-white">
                    {formatDuration(recording.duration)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">File Size</div>
                  <div className="text-white">
                    {formatFileSize(recording.audioData?.length || 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-gray-900/50">
          <button
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}