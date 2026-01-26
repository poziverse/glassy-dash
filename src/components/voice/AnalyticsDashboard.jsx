/**
 * AnalyticsDashboard - Voice recording statistics and insights
 * Part of Phase 5: Advanced Features
 * Phase 6 Update: Added error handling, logger integration, React.memo, useCallback
 */

import { useMemo, useState, memo, useCallback } from 'react'
import { Mic, Clock, FileText, TrendingUp, BarChart3, Calendar, Hash, RotateCcw } from 'lucide-react'
import logger from '../../utils/logger'
import { ErrorMessage } from '../ErrorMessage'

/**
 * Format duration in MM:SS format with error handling
 */
function formatDuration(seconds) {
  try {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  } catch (error) {
    logger.error('duration_format_failed', { seconds }, error)
    return '0:00'
  }
}

/**
 * Format date with error handling
 */
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch (error) {
    logger.error('date_format_failed', { dateStr }, error)
    return 'Invalid Date'
  }
}

/**
 * Calculate word frequency with error handling
 */
function calculateWordFrequency(transcripts) {
  try {
    const frequency = {}
    
    transcripts.forEach(transcript => {
      try {
        const words = transcript.toLowerCase().match(/\b\w+\b/g) || []
        words.forEach(word => {
          try {
            if (word.length > 3) { // Ignore short words
              frequency[word] = (frequency[word] || 0) + 1
            }
          } catch (wordError) {
            logger.error('word_process_failed', { word }, wordError)
          }
        })
      } catch (transcriptError) {
        logger.error('transcript_process_failed', { transcript: transcript?.substring(0, 50) }, transcriptError)
      }
    })
    
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))
  } catch (error) {
    logger.error('word_frequency_calc_failed', { transcriptsLength: transcripts?.length }, error)
    throw error
  }
}

/**
 * Get recordings by day with error handling
 */
function getRecordingsByDay(recordings) {
  try {
    const byDay = {}
    
    recordings.forEach(recording => {
      try {
        const date = formatDate(recording.createdAt)
        if (!byDay[date]) {
          byDay[date] = 0
        }
        byDay[date]++
      } catch (recordingError) {
        logger.error('recording_day_failed', { recordingId: recording?.id }, recordingError)
      }
    })
    
    return Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .slice(-7) // Last 7 days
  } catch (error) {
    logger.error('recordings_by_day_failed', { recordingsLength: recordings?.length }, error)
    throw error
  }
}

/**
 * Get most used tags with error handling
 */
function getMostUsedTags(recordings) {
  try {
    const tagCounts = {}
    
    recordings.forEach(recording => {
      try {
        (recording.tags || []).forEach(tag => {
          try {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          } catch (tagError) {
            logger.error('tag_count_failed', { tag }, tagError)
          }
        })
      } catch (tagsError) {
        logger.error('recording_tags_failed', { recordingId: recording?.id }, tagsError)
      }
    })
    
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }))
  } catch (error) {
    logger.error('most_used_tags_failed', { recordingsLength: recordings?.length }, error)
    throw error
  }
}

/**
 * Analyze recording with error handling
 */
function analyzeRecording(recording) {
  try {
    const transcript = recording.transcript || ''
    
    return {
      wordCount: transcript.split(/\s+/).filter(w => w.length > 0).length,
      characterCount: transcript.length,
      duration: recording.duration || 0,
      speakingRate: transcript ? (transcript.split(/\s+/).length / (recording.duration || 1)) * 60 : 0,
      readingTime: transcript ? Math.ceil(transcript.split(/\s+/).length / 200 * 60) : 0
    }
  } catch (error) {
    logger.error('recording_analysis_failed', { recordingId: recording?.id }, error)
    // Return safe defaults
    return {
      wordCount: 0,
      characterCount: 0,
      duration: 0,
      speakingRate: 0,
      readingTime: 0
    }
  }
}

/**
 * StatCard component
 */
function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    purple: 'bg-purple-500/20 text-purple-400',
    pink: 'bg-pink-500/20 text-pink-400',
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400'
  }
  
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors[color] || colors.indigo}`}>
          <Icon size={20} />
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

/**
 * ChartCard component with error handling
 */
function ChartCard({ title, data, icon: Icon }) {
  try {
    const maxValue = Math.max(...data.map(d => d.count), 1)
    
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Icon size={20} className="text-gray-400" />
          <h4 className="text-base font-semibold text-white">{title}</h4>
        </div>
        
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = (item.count / maxValue) * 100
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{item.date || item.word || item.tag}</span>
                  <span className="text-gray-400">{item.count}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  } catch (error) {
    logger.error('chart_render_failed', { title, dataLength: data?.length }, error)
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-red-500/30">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={20} className="text-red-400" />
          <h4 className="text-base font-semibold text-red-400">{title}</h4>
        </div>
        <p className="text-sm text-gray-400">Failed to load chart data</p>
      </div>
    )
  }
}

function AnalyticsDashboard({ recordings }) {
  const [error, setError] = useState(null)
  
  // Calculate overall statistics with error handling
  const stats = useMemo(() => {
    try {
      if (!Array.isArray(recordings)) {
        throw new Error('Recordings must be an array')
      }
      
      const totalRecordings = recordings.length
      const notesCount = recordings.filter(r => r.type === 'notes').length
      const galleryCount = recordings.filter(r => r.type === 'gallery').length
      const totalDuration = recordings.reduce((sum, r) => sum + (r.duration || 0), 0)
      const avgDuration = totalRecordings > 0 ? totalDuration / totalRecordings : 0
      
      // Analyze all recordings
      const analyses = recordings.map(r => analyzeRecording(r))
      const totalWords = analyses.reduce((sum, a) => sum + a.wordCount, 0)
      const avgWords = analyses.length > 0 ? totalWords / analyses.length : 0
      const avgSpeakingRate = analyses.length > 0 
        ? analyses.reduce((sum, a) => sum + a.speakingRate, 0) / analyses.length 
        : 0
      
      const transcriptRecordings = recordings.filter(r => r.transcript)
      const wordFrequency = transcriptRecordings.length > 0
        ? calculateWordFrequency(transcriptRecordings.map(r => r.transcript))
        : []
      
      return {
        totalRecordings,
        totalDuration,
        avgDuration,
        notesCount,
        galleryCount,
        totalWords,
        avgWords,
        avgSpeakingRate,
        recordingsByDay: getRecordingsByDay(recordings),
        wordFrequency,
        mostUsedTags: getMostUsedTags(recordings)
      }
    } catch (error) {
      logger.error('analytics_calc_failed', { recordingsLength: recordings?.length }, error)
      setError('Failed to calculate analytics. Please try refreshing page.')
      // Return safe defaults
      return {
        totalRecordings: 0,
        totalDuration: 0,
        avgDuration: 0,
        notesCount: 0,
        galleryCount: 0,
        totalWords: 0,
        avgWords: 0,
        avgSpeakingRate: 0,
        recordingsByDay: [],
        wordFrequency: [],
        mostUsedTags: []
      }
    }
  }, [recordings])
  
  // Handle reload - memoized
  const handleReload = useCallback(() => {
    try {
      setError(null)
      window.location.reload()
    } catch (error) {
      logger.error('reload_failed', {}, error)
      setError('Failed to reload. Please refresh page manually.')
    }
  }, [])
  
  if (error) {
    return (
      <div className="space-y-6 p-6 rounded-xl bg-white/5 border border-white/10">
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
        <div className="flex justify-center">
          <button
            onClick={handleReload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RotateCcw size={16} />
            Reload Dashboard
          </button>
        </div>
      </div>
    )
  }
  
  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 rounded-xl bg-white/5 text-gray-400">
        <Mic size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">No recordings yet</p>
        <p className="text-sm">Start recording to see your analytics</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Analytics
        </h2>
        <p className="text-sm text-gray-400">
          Overview of your voice recordings
        </p>
      </div>
      
      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Recordings"
          value={stats.totalRecordings}
          icon={Mic}
          color="indigo"
        />
        
        <StatCard
          label="Total Duration"
          value={formatDuration(stats.totalDuration)}
          icon={Clock}
          color="purple"
        />
        
        <StatCard
          label="Avg Duration"
          value={formatDuration(stats.avgDuration)}
          icon={Clock}
          color="pink"
        />
        
        <StatCard
          label="Total Words"
          value={stats.totalWords.toLocaleString()}
          icon={FileText}
          color="green"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard
          title="Recordings by Day (Last 7 Days)"
          data={stats.recordingsByDay}
          icon={Calendar}
        />
        
        <ChartCard
          title="Most Used Words"
          data={stats.wordFrequency}
          icon={Hash}
        />
      </div>
      
      {/* Secondary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Notes vs Gallery"
          value={`${stats.notesCount} / ${stats.galleryCount}`}
          icon={FileText}
          color="blue"
        />
        
        <StatCard
          label="Avg Words/Recording"
          value={Math.round(stats.avgWords)}
          icon={TrendingUp}
          color="green"
        />
        
        <StatCard
          label="Speaking Rate (WPM)"
          value={Math.round(stats.avgSpeakingRate)}
          icon={BarChart3}
          color="pink"
        />
      </div>
      
      {/* Tags chart */}
      {stats.mostUsedTags.length > 0 && (
        <ChartCard
          title="Most Used Tags"
          data={stats.mostUsedTags}
          icon={Hash}
        />
      )}
      
      {/* Insights */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">
          Insights
        </h4>
        
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
            <span>
              You've recorded <strong className="text-white">{stats.totalRecordings}</strong> times
            </span>
          </div>
          
          <div className="flex items-start gap-2 text-sm text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
            <span>
              Total recording time: <strong className="text-white">{formatDuration(stats.totalDuration)}</strong>
            </span>
          </div>
          
          <div className="flex items-start gap-2 text-sm text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5" />
            <span>
              Average speaking rate: <strong className="text-white">{Math.round(stats.avgSpeakingRate)}</strong> words per minute
            </span>
          </div>
          
          {stats.wordFrequency.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
              <span>
                Most used word: <strong className="text-white">{stats.wordFrequency[0].word}</strong> ({stats.wordFrequency[0].count} times)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(AnalyticsDashboard)