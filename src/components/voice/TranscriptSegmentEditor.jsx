import React from 'react'
import { Trash2, RotateCcw, Edit3, ChevronDown, ChevronUp } from 'lucide-react'
import { useVoiceStore } from '../../stores/voiceStore'

/**
 * Component for editing transcript segments
 * Allows viewing, deleting, and restoring individual segments
 */
export default function TranscriptSegmentEditor({ recordingId, onSegmentEdit }) {
  const { recordings, deleteTranscriptSegment, restoreTranscriptSegment, editTranscriptSegment } = useVoiceStore()
  const recording = recordings.find(r => r.id === recordingId)
  
  const segments = recording?.transcriptSegments || []
  const activeSegments = segments.filter(s => !s.deleted)
  const deletedSegments = segments.filter(s => s.deleted)
  const [showDeleted, setShowDeleted] = React.useState(false)
  const [editingSegment, setEditingSegment] = React.useState(null)
  const [editText, setEditText] = React.useState('')

  const handleDeleteSegment = (segmentId) => {
    if (confirm('Delete this segment?')) {
      deleteTranscriptSegment(recordingId, segmentId)
    }
  }

  const handleRestoreSegment = (segmentId) => {
    restoreTranscriptSegment(recordingId, segmentId)
  }

  const handleEditSegment = (segment) => {
    setEditingSegment(segment.id)
    setEditText(segment.text)
  }

  const handleSaveEdit = (segmentId) => {
    editTranscriptSegment(recordingId, segmentId, editText)
    setEditingSegment(null)
    setEditText('')
    onSegmentEdit?.()
  }

  const handleCancelEdit = () => {
    setEditingSegment(null)
    setEditText('')
  }

  if (!recording || segments.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
        <p className="text-gray-400">No transcript segments available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Active Segments */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center justify-between">
          <span>Transcript Segments ({activeSegments.length})</span>
        </h3>
        
        {activeSegments.length === 0 && deletedSegments.length > 0 ? (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
            All segments have been deleted. Restore segments to view the transcript.
          </div>
        ) : (
          <div className="space-y-3">
            {activeSegments.map((segment, index) => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                index={index}
                isEditing={editingSegment === segment.id}
                editText={editText}
                onEdit={() => handleEditSegment(segment)}
                onSave={() => handleSaveEdit(segment.id)}
                onCancel={handleCancelEdit}
                onEditChange={setEditText}
                onDelete={() => handleDeleteSegment(segment.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Deleted Segments Section */}
      {deletedSegments.length > 0 && (
        <div>
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <span>Deleted Segments ({deletedSegments.length})</span>
            {showDeleted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDeleted && (
            <div className="mt-3 space-y-3">
              {deletedSegments.map((segment, index) => (
                <DeletedSegmentCard
                  key={segment.id}
                  segment={segment}
                  index={index}
                  onRestore={() => handleRestoreSegment(segment.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {activeSegments.length > 0 && (
        <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
          <p className="font-medium mb-1">💡 How to Edit Segments</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>Click <Edit3 size={12} className="inline" /> to edit segment text</li>
            <li>Click <Trash2 size={12} className="inline" /> to delete a segment</li>
            <li>Expand "Deleted Segments" to restore deleted segments</li>
            <li>Changes are automatically saved to the full transcript</li>
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * Individual segment card
 */
function SegmentCard({ segment, index, isEditing, editText, onEdit, onSave, onCancel, onEditChange, onDelete }) {
  return (
    <div className="group relative p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/40 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-indigo-400">
              Segment {index + 1}
            </span>
            <span className="text-xs text-gray-500">
              • {new Date(segment.createdAt).toLocaleTimeString()}
            </span>
          </div>

          {isEditing ? (
            <textarea
              value={editText}
              onChange={(e) => onEditChange(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-black/20 border border-indigo-500/50 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              autoFocus
            />
          ) : (
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {segment.text}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={onCancel}
                className="p-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                title="Cancel"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={onSave}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                title="Save"
              >
                <Edit3 size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                title="Edit segment"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete segment"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Deleted segment card
 */
function DeletedSegmentCard({ segment, index, onRestore }) {
  return (
    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 opacity-60 hover:opacity-100 transition-opacity">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-red-400">
              Deleted Segment {index + 1}
            </span>
            <span className="text-xs text-gray-500">
              • {new Date(segment.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-gray-400 line-through">
            {segment.text}
          </p>
        </div>

        <button
          onClick={onRestore}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          title="Restore segment"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  )
}