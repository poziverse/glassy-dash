import React from 'react'
import { groupRecordingsByDate, formatDuration, formatFileSize } from '../../utils/voiceSearch'
import { TagChips } from './TagPicker'
import MinimalPlaybackControls from './PlaybackControls'
import { Clock, MoreVertical, FileText, Images, Check } from 'lucide-react'

/**
 * Grid view component for recordings
 */
export function GridView({ 
  recordings,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {recordings.map(recording => (
        <RecordingCard
          key={recording.id}
          recording={recording}
          view="grid"
          selected={selectedIds?.includes(recording.id)}
          onSelect={() => onToggleSelect?.(recording.id)}
          onEdit={() => onEdit?.(recording.id)}
          onDelete={() => onDelete?.(recording.id)}
        />
      ))}
    </div>
  )
}

/**
 * List view component for recordings
 */
export function ListView({ 
  recordings,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete
}) {
  return (
    <div className="space-y-2">
      {recordings.map(recording => (
        <RecordingCard
          key={recording.id}
          recording={recording}
          view="list"
          selected={selectedIds?.includes(recording.id)}
          onSelect={() => onToggleSelect?.(recording.id)}
          onEdit={() => onEdit?.(recording.id)}
          onDelete={() => onDelete?.(recording.id)}
        />
      ))}
    </div>
  )
}

/**
 * Timeline view component for recordings
 */
export function TimelineView({ 
  recordings,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete
}) {
  const groupedRecordings = groupRecordingsByDate(recordings)

  return (
    <div className="space-y-8">
      {groupedRecordings.map(([date, items]) => (
        <div key={date} className="space-y-2">
          {/* Date Header */}
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm py-2 text-sm font-semibold text-gray-400 border-b border-white/10">
            {date}
          </div>
          
          {/* Recordings for this date */}
          {items.map(recording => (
            <RecordingCard
              key={recording.id}
              recording={recording}
              view="timeline"
              selected={selectedIds?.includes(recording.id)}
              onSelect={() => onToggleSelect?.(recording.id)}
              onEdit={() => onEdit?.(recording.id)}
              onDelete={() => onDelete?.(recording.id)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Recording card component (supports multiple views)
 */
function RecordingCard({ 
  recording, 
  view,
  selected,
  onSelect,
  onEdit,
  onDelete
}) {
  const [showMenu, setShowMenu] = React.useState(false)

  const handleCardClick = (e) => {
    // Don't trigger card click if clicking on interactive elements
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
      return
    }
    onEdit?.(recording.id)
  }

  if (view === 'grid') {
    return (
      <div 
        className={`
          group relative rounded-xl bg-white/5 border transition-all
          ${selected ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-white/10 hover:border-white/20'}
        `}
        onClick={handleCardClick}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="absolute top-3 left-3 z-10 w-5 h-5 rounded border-2 border-gray-600 bg-transparent checked:bg-indigo-600 checked:border-indigo-600 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Card Content */}
        <div className="p-4 pt-12">
          {/* Type Badge */}
          <div className="absolute top-3 right-3">
            <span className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${recording.type === 'notes' 
                ? 'bg-indigo-500/20 text-indigo-400' 
                : 'bg-purple-500/20 text-purple-400'
              }
            `}>
              {recording.type === 'notes' ? (
                <span className="flex items-center gap-1">
                  <FileText size={12} />
                  Note
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Images size={12} />
                  Gallery
                </span>
              )}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-white mb-2 line-clamp-1">
            {recording.title}
          </h3>

          {/* Preview */}
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
            {recording.summary || recording.transcript?.substring(0, 100) || 'No transcript'}
          </p>

          {/* Tags */}
          <TagChips 
            tagIds={recording.tags} 
            className="mb-3"
          />

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDuration(recording.duration)}
              </span>
              <span>
                {formatFileSize(recording.audioData?.length || 0)}
              </span>
            </div>
            <span>
              {new Date(recording.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Audio Player (on hover) */}
          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <MinimalPlaybackControls 
              audioUrl={`data:audio/webm;base64,${recording.audioData}`}
            />
          </div>
        </div>
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div 
        className={`
          group relative flex items-center gap-4 p-4 rounded-xl border transition-all
          ${selected ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:bg-white/5'}
        `}
        onClick={handleCardClick}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-5 h-5 rounded border-2 border-gray-600 bg-transparent checked:bg-indigo-600 checked:border-indigo-600 cursor-pointer flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Type Icon */}
        <div className={`
          p-2 rounded-lg flex-shrink-0
          ${recording.type === 'notes' 
            ? 'bg-indigo-500/20 text-indigo-400' 
            : 'bg-purple-500/20 text-purple-400'
          }
        `}>
          {recording.type === 'notes' ? (
            <FileText size={20} />
          ) : (
            <Images size={20} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base font-semibold text-white line-clamp-1">
              {recording.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatDuration(recording.duration)}
              </span>
              <span>
                {formatFileSize(recording.audioData?.length || 0)}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-2 line-clamp-1">
            {recording.summary || recording.transcript?.substring(0, 80) || 'No transcript'}
          </p>

          <TagChips 
            tagIds={recording.tags}
            className="flex-wrap"
          />
        </div>

        {/* Date */}
        <div className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
          {new Date(recording.createdAt).toLocaleDateString()}
        </div>
      </div>
    )
  }

  if (view === 'timeline') {
    return (
      <div 
        className={`
          group relative flex items-start gap-4 p-4 rounded-xl border transition-all
          ${selected ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:bg-white/5'}
        `}
        onClick={handleCardClick}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="w-5 h-5 rounded border-2 border-gray-600 bg-transparent checked:bg-indigo-600 checked:border-indigo-600 cursor-pointer flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Time */}
        <div className="text-sm text-gray-400 flex-shrink-0 font-mono">
          {new Date(recording.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white mb-1 line-clamp-1">
            {recording.title}
          </h3>

          <p className="text-sm text-gray-400 mb-2 line-clamp-1">
            {recording.summary || recording.transcript?.substring(0, 100) || 'No transcript'}
          </p>

          <div className="flex items-center gap-3">
            <TagChips 
              tagIds={recording.tags}
              className="flex-wrap"
            />
            <span className="text-xs text-gray-500">
              {formatDuration(recording.duration)}
            </span>
          </div>
        </div>

        {/* Audio Player (compact) */}
        <MinimalPlaybackControls 
          audioUrl={`data:audio/webm;base64,${recording.audioData}`}
          className="flex-shrink-0"
        />
      </div>
    )
  }

  return null
}