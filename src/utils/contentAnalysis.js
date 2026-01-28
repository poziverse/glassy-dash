/**
 * Content Analysis Utilities
 * Analyzes voice recording content to recommend best save destination
 */

/**
 * Analyze a recording's content and recommend optimal save destination
 * @param {Object} recording - Voice recording object
 * @returns {Object} Analysis results with recommendations
 */
export function analyzeContent(recording) {
  const transcript = recording.transcript || ''
  const summary = recording.summary || ''
  const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length
  const lineCount = transcript.split('\n').filter(l => l.trim().length > 0).length
  const characterCount = transcript.length
  
  // Determine best destination based on content length
  let recommendation = 'voice-note'
  let reasoning = 'Keep as voice note to preserve audio reference'
  
  if (lineCount > 50 || wordCount > 500) {
    recommendation = 'document'
    reasoning = 'Long-form content - better suited for document format'
  } else if (lineCount > 10 || wordCount > 100) {
    recommendation = 'note'
    reasoning = 'Medium length - works well as a note card'
  }
  
  return {
    wordCount,
    lineCount,
    characterCount,
    readingTime: Math.ceil(wordCount / 200), // minutes at 200 wpm
    recommendation,
    reasoning,
    hasFormatting: /\*\*|`|==|#|__/.test(transcript),
    hasLists: /^[-*+]\s|^1\.\s/m.test(transcript),
    hasHeadings: /^#{1,6}\s/m.test(transcript),
    hasSummary: summary.length > 0,
    estimatedPages: Math.ceil(wordCount / 250), // ~250 words per page
    tags: recording.tags || []
  }
}

/**
 * Format reading time in human-readable format
 * @param {number} minutes - Reading time in minutes
 * @returns {string} Formatted reading time
 */
export function formatReadingTime(minutes) {
  if (minutes < 1) {
    return '< 1 min read'
  } else if (minutes < 60) {
    return `${Math.round(minutes)} min read`
  } else {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m read`
  }
}

/**
 * Get recommendation badge text and color
 * @param {string} recommendation - Recommendation type
 * @returns {Object} Badge configuration
 */
export function getRecommendationBadge(recommendation) {
  const badges = {
    'voice-note': {
      text: 'Recommended: Voice Note',
      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
    },
    'note': {
      text: 'Recommended: Note',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    },
    'document': {
      text: 'Recommended: Document',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    }
  }
  
  return badges[recommendation] || badges['voice-note']
}

/**
 * Check if content is too long for a note card
 * @param {number} wordCount - Word count
 * @returns {boolean} True if too long
 */
export function isTooLongForNote(wordCount) {
  return wordCount > 500
}

/**
 * Check if content is suitable for quick voice note
 * @param {number} wordCount - Word count
 * @returns {boolean} True if suitable
 */
export function isQuickVoiceNote(wordCount) {
  return wordCount <= 100
}

/**
 * Estimate preview text (first N characters)
 * @param {string} text - Full text
 * @param {number} maxLength - Maximum length
 * @returns {string} Preview text
 */
export function getPreviewText(text, maxLength = 150) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}