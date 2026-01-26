import Fuse from 'fuse.js'

/**
 * Tag color palette for UI
 */
export const TAG_COLORS = {
  indigo: '#6366f1',
  purple: '#a855f7',
  pink: '#ec4899',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  gray: '#6b7280'
}

/**
 * Get background color for tag (with opacity)
 */
export const getTagBackgroundColor = (color) => {
  const hex = TAG_COLORS[color] || TAG_COLORS.gray
  // Add opacity (20%)
  return hex + '33' // 33 = 20% in hex
}

/**
 * Create fuzzy search index for recordings
 */
export const createSearchIndex = (recordings) => {
  return new Fuse(recordings, {
    keys: [
      { name: 'title', weight: 2.0 },
      { name: 'transcript', weight: 1.0 },
      { name: 'summary', weight: 0.5 }
    ],
    threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
    ignoreLocation: true
  })
}

/**
 * Perform fuzzy search on recordings
 */
export const fuzzySearch = (recordings, query) => {
  if (!query || query.length < 2) {
    return recordings
  }

  const fuse = createSearchIndex(recordings)
  const results = fuse.search(query)
  
  return results.map(result => ({
    ...result.item,
    score: result.score
  }))
}

/**
 * Group recordings by date for timeline view
 */
export const groupRecordingsByDate = (recordings) => {
  const groups = {}
  
  recordings.forEach(recording => {
    const date = new Date(recording.createdAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    let groupKey
    
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday'
    } else if (date.getFullYear() === today.getFullYear()) {
      groupKey = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'short'
      })
    } else {
      groupKey = date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric'
      })
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(recording)
  })
  
  // Convert to array and sort by date (newest first)
  return Object.entries(groups)
    .sort(([dateA, itemsA], [dateB, itemsB]) => {
      // Special handling for "Today" and "Yesterday"
      if (dateA === 'Today') return -1
      if (dateB === 'Today') return 1
      if (dateA === 'Yesterday' && dateB !== 'Today') return -1
      if (dateB === 'Yesterday' && dateA !== 'Today') return 1
      
      // Sort by the date of the first item in each group
      const dateA_time = new Date(itemsA[0].createdAt)
      const dateB_time = new Date(itemsB[0].createdAt)
      return dateB_time - dateA_time
    })
}

/**
 * Format duration for display
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format file size for display
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Debounce utility
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Get tag suggestions based on recording content
 */
export const suggestTags = async (transcript, existingTags = []) => {
  if (!transcript || transcript.length < 50) {
    return []
  }
  
  // This is a simple heuristic-based suggestion
  // In production, you'd use AI/ML for better suggestions
  const keywords = extractKeywords(transcript)
  
  // Find matching existing tags
  const matchedTags = existingTags.filter(tag => 
    keywords.some(keyword => 
      keyword.toLowerCase().includes(tag.name.toLowerCase()) ||
      tag.name.toLowerCase().includes(keyword.toLowerCase())
    )
  )
  
  return matchedTags.map(tag => tag.id)
}

/**
 * Extract keywords from text
 */
const extractKeywords = (text) => {
  // Simple keyword extraction
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
  
  const wordCount = {}
  words.forEach(word => {
    if (word.length > 3) {
      wordCount[word] = (wordCount[word] || 0) + 1
    }
  })
  
  // Return top 5 most frequent words
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
}

/**
 * Apply filters to recordings
 */
export const applyFilters = (recordings, filters) => {
  return recordings.filter(recording => {
    // Date range filter
    if (filters.dateRange) {
      const recordingDate = new Date(recording.createdAt)
      const { start, end } = filters.dateRange
      if (start && recordingDate < start) return false
      if (end && recordingDate > end) return false
    }
    
    // Duration filter
    if (filters.duration) {
      const { min, max } = filters.duration
      if (min && recording.duration < min) return false
      if (max && recording.duration > max) return false
    }
    
    // Type filter
    if (filters.type && recording.type !== filters.type) {
      return false
    }
    
    // Tag filter (must match ALL tags)
    if (filters.tags && filters.tags.length > 0) {
      const hasAllTags = filters.tags.every(tag => 
        (recording.tags || []).includes(tag)
      )
      if (!hasAllTags) return false
    }
    
    return true
  })
}

/**
 * Sort recordings
 */
export const sortRecordings = (recordings, sortBy, sortOrder = 'desc') => {
  return [...recordings].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(b.createdAt) - new Date(a.createdAt)
        break
      case 'duration':
        comparison = b.duration - a.duration
        break
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
      case 'size':
        comparison = (b.audioData?.length || 0) - (a.audioData?.length || 0)
        break
      default:
        comparison = 0
    }
    
    return sortOrder === 'asc' ? -comparison : comparison
  })
}

/**
 * Get recording preview text
 */
export const getPreviewText = (recording, maxLength = 100) => {
  if (!recording.transcript) {
    return 'No transcript available'
  }
  
  const text = recording.transcript.trim()
  if (text.length <= maxLength) {
    return text
  }
  
  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Get recording statistics
 */
export const getRecordingStats = (recordings) => {
  const totalRecordings = recordings.length
  const totalDuration = recordings.reduce((sum, r) => sum + (r.duration || 0), 0)
  const totalSize = recordings.reduce((sum, r) => sum + (r.audioData?.length || 0), 0)
  const uniqueTags = new Set(recordings.flatMap(r => r.tags || [])).size
  
  return {
    totalRecordings,
    totalDuration,
    totalSize,
    uniqueTags,
    avgDuration: totalRecordings > 0 ? totalDuration / totalRecordings : 0
  }
}