/**
 * SpeakerLabeler - Speaker diarization and labeling
 * Part of Phase 5: Advanced Features
 * Phase 6 Update: Added error handling, logger integration, React.memo optimization
 */

import { useState, memo } from 'react'
import { User, Clock, Edit2, Filter, RotateCcw } from 'lucide-react'
import logger from '../../utils/logger'
import { ErrorMessage } from '../ErrorMessage'

/**
 * Color palette for speakers
 */
const SPEAKER_COLORS = [
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-blue-500',
  'bg-orange-500'
]

/**
 * Get speaker color by index
 */
function getSpeakerColor(speaker) {
  const index = speaker.replace('Speaker ', '').charCodeAt(0) % SPEAKER_COLORS.length
  return SPEAKER_COLORS[index]
}

/**
 * Group segments by speaker
 */
function groupBySpeaker(segments) {
  try {
    return segments.reduce((groups, segment) => {
      const speaker = segment.speaker
      if (!groups[speaker]) {
        groups[speaker] = []
      }
      groups[speaker].push(segment)
      return groups
    }, {})
  } catch (error) {
    logger.error('speaker_grouping_failed', { segmentsLength: segments?.length }, error)
    throw error
  }
}

/**
 * Format time in MM:SS format
 */
function formatTime(seconds) {
  try {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  } catch (error) {
    logger.error('time_format_failed', { seconds }, error)
    return '00:00'
  }
}

/**
 * Calculate speaker statistics
 */
function calculateSpeakerStats(speakerGroups, speakerNames) {
  try {
    const speakers = Object.keys(speakerGroups).sort()
    
    return speakers.map(speaker => {
      const speakerSegments = speakerGroups[speaker] || []
      const totalTime = speakerSegments.reduce((sum, s) => sum + (s.end - s.start), 0)
      const wordCount = speakerSegments.reduce((sum, s) => sum + s.text.split(/\s+/).length, 0)
      
      return {
        speaker,
        segmentCount: speakerSegments.length,
        totalTime,
        wordCount,
        avgSegmentLength: speakerSegments.length > 0 ? totalTime / speakerSegments.length : 0
      }
    })
  } catch (error) {
    logger.error('speaker_stats_failed', { speakerNames }, error)
    throw error
  }
}

function SpeakerLabeler({ segments, onSpeakerRename, onFilterSpeaker }) {
  const [speakerNames, setSpeakerNames] = useState({})
  const [editingSpeaker, setEditingSpeaker] = useState(null)
  const [activeFilter, setActiveFilter] = useState(null)
  const [error, setError] = useState(null)
  
  const speakerGroups = groupBySpeaker(segments)
  const speakers = Object.keys(speakerGroups).sort()
  
  // Calculate statistics with error handling
  const speakerStats = calculateSpeakerStats(speakerGroups, speakerNames)
  
  // Handle speaker name edit
  const handleNameEdit = (speaker) => {
    setEditingSpeaker(speaker)
  }
  
  // Save speaker name
  const handleNameSave = (speaker, newName) => {
    try {
      if (!newName.trim()) return
      
      setSpeakerNames(prev => ({ ...prev, [speaker]: newName }))
      onSpeakerRename?.(speaker, newName)
      setEditingSpeaker(null)
      setError(null)
    } catch (error) {
      logger.error('speaker_name_save_failed', { speaker, newName }, error)
      setError('Failed to save speaker name. Please try again.')
    }
  }
  
  // Play segment
  const handlePlaySegment = (startTime, endTime) => {
    try {
      // This would be connected to an audio player
      console.log(`Playing segment: ${formatTime(startTime)} - ${formatTime(endTime)}`)
      setError(null)
    } catch (error) {
      logger.error('segment_play_failed', { startTime, endTime }, error)
      setError('Failed to play segment. The audio player may not be available.')
    }
  }
  
  // Filter by speaker
  const handleFilter = (speaker) => {
    try {
      setActiveFilter(prev => prev === speaker ? null : speaker)
      onFilterSpeaker?.(speaker)
      setError(null)
    } catch (error) {
      logger.error('speaker_filter_failed', { speaker }, error)
      setError('Failed to filter by speaker. Please try again.')
    }
  }
  
  const filteredSegments = activeFilter
    ? segments.filter(s => s.speaker === activeFilter)
    : segments
  
  // Handle reload
  const handleReload = () => {
    try {
      setError(null)
      window.location.reload()
    } catch (error) {
      logger.error('reload_failed', {}, error)
      setError('Failed to reload. Please refresh the page manually.')
    }
  }
  
  if (error) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Speakers</h3>
          <p className="text-sm text-gray-400">
            {speakers.length} speaker{speakers.length > 1 ? 's' : ''} detected
          </p>
        </div>
        
        {activeFilter && (
          <button
            onClick={() => handleFilter(null)}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm"
          >
            Clear Filter
          </button>
        )}
      </div>
      
      {/* Speaker cards */}
      <div className="space-y-4">
        {speakerStats.map((stats) => {
          const customName = speakerNames[stats.speaker] || stats.speaker
          const isEditing = editingSpeaker === stats.speaker
          const color = getSpeakerColor(stats.speaker)
          const isActive = activeFilter === stats.speaker
          
          return (
            <div
              key={stats.speaker}
              className={`p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? `${color} border-white/20 bg-opacity-10`
                  : 'bg-white/5 border-transparent hover:bg-white/10'
              }`}
            >
              {/* Speaker header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-sm font-semibold`}>
                  {customName.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      defaultValue={customName}
                      onBlur={(e) => handleNameSave(stats.speaker, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleNameSave(stats.speaker, e.target.value)
                        }
                      }}
                      className="bg-transparent border-b border-gray-600 text-white text-lg font-semibold focus:border-indigo-500 focus:outline-none w-full"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-semibold text-white">
                        {customName}
                      </h4>
                      <button
                        onClick={() => handleNameEdit(stats.speaker)}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleFilter(stats.speaker)}
                  className={`p-2 rounded-lg ${
                    isActive
                      ? 'bg-white/20'
                      : 'hover:bg-white/10'
                  } text-gray-400`}
                  title={isActive ? 'Clear Filter' : 'Filter by Speaker'}
                >
                  <Filter size={16} />
                </button>
              </div>              
              {/* Statistics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-black/20">
                  <div className="text-xs text-gray-400 mb-1">Segments</div>
                  <div className="text-lg font-semibold text-white">
                    {stats.segmentCount}
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-black/20">
                  <div className="text-xs text-gray-400 mb-1">Speaking Time</div>
                  <div className="text-lg font-semibold text-white">
                    {formatTime(stats.totalTime)}
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-black/20">
                  <div className="text-xs text-gray-400 mb-1">Words</div>
                  <div className="text-lg font-semibold text-white">
                    {stats.wordCount}
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-black/20">
                  <div className="text-xs text-gray-400 mb-1">Avg Segment</div>
                  <div className="text-lg font-semibold text-white">
                    {formatTime(stats.avgSegmentLength)}
                  </div>
                </div>
              </div>              
              {/* Segments */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {speakerGroups[stats.speaker]?.map((segment, index) => (
                  <button
                    key={index}
                    onClick={() => handlePlaySegment(segment.startTime, segment.endTime)}
                    className="w-full text-left p-3 rounded-lg hover:bg-black/20 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-400 font-mono">
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 line-clamp-2 group-hover:text-white">
                      {segment.text}
                    </p>
                  </button>
                )) || <div className="p-3 text-sm text-gray-400">No segments for this speaker</div>}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Overall statistics */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">
          Overall Statistics
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-400">Total Speakers</div>
            <div className="text-2xl font-bold text-white">
              {speakers.length}
            </div>
          </div>          
          <div>
            <div className="text-xs text-gray-400">Total Segments</div>
            <div className="text-2xl font-bold text-white">
              {segments.length}
            </div>
          </div>          
          <div>
            <div className="text-xs text-gray-400">Total Duration</div>
            <div className="text-2xl font-bold text-white">
              {formatTime(
                segments.reduce((sum, s) => sum + (s.end - s.start), 0)
              )}
            </div>
          </div>          
          <div>
            <div className="text-xs text-gray-400">Dominant Speaker</div>
            <div className="text-xl font-semibold text-white truncate">
              {speakerNames[speakerStats[0]?.speaker] || speakerStats[0]?.speaker || 'N/A'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter indicator */}
      {activeFilter && (
        <div className="p-3 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
          <div className="flex items-center gap-2">
            <User size={16} className="text-indigo-400" />
            <span className="text-sm text-indigo-300">
              Showing segments by: <strong className="text-white">
                {speakerNames[activeFilter] || activeFilter}
              </strong>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(SpeakerLabeler)