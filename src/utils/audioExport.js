/**
 * Audio and transcript export utilities
 * Supports multiple export formats: TXT, JSON, SRT, VTT, PDF
 */

/**
 * Export recording data as plain text
 * @param {Object} recording - Recording object with transcript, summary, metadata
 * @returns {string} Plain text content
 */
export function exportToText(recording) {
  const lines = []
  
  lines.push('=' .repeat(50))
  lines.push('VOICE RECORDING EXPORT')
  lines.push('=' .repeat(50))
  lines.push('')
  
  // Metadata
  lines.push('Title:', recording.title || 'Untitled')
  lines.push('Date:', new Date(recording.createdAt).toLocaleString())
  lines.push('Duration:', formatDuration(recording.duration))
  lines.push('')
  
  // Summary
  if (recording.summary) {
    lines.push('-'.repeat(30))
    lines.push('SUMMARY')
    lines.push('-'.repeat(30))
    lines.push(recording.summary)
    lines.push('')
  }
  
  // Transcript
  lines.push('-'.repeat(30))
  lines.push('TRANSCRIPT')
  lines.push('-'.repeat(30))
  lines.push(recording.transcript || '')
  
  return lines.join('\n')
}

/**
 * Export recording data as JSON
 * @param {Object} recording - Recording object
 * @returns {string} JSON string
 */
export function exportToJSON(recording) {
  const exportData = {
    format: 'glassy-voice-export',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    recording: {
      id: recording.id,
      title: recording.title || 'Untitled',
      transcript: recording.transcript || '',
      summary: recording.summary || '',
      duration: recording.duration || 0,
      createdAt: recording.createdAt,
      updatedAt: recording.updatedAt,
      type: recording.type || 'notes',
      tags: recording.tags || [],
      audioFormat: 'webm',
      audioSize: recording.audioData?.length || 0
    }
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Export transcript as SRT (SubRip) subtitle format
 * @param {Object} recording - Recording object with transcript
 * @param {Array} segments - Optional array of timestamped segments
 * @returns {string} SRT formatted content
 */
export function exportToSRT(recording, segments = []) {
  // If no segments provided, create single segment for entire transcript
  if (segments.length === 0) {
    const duration = recording.duration || 0
    return `1
00:00:00,000 --> ${formatSRTTime(duration)}
${recording.transcript || ''}
`
  }
  
  // Format segments with timestamps
  return segments.map((segment, index) => {
    const startTime = formatSRTTime(segment.startTime || 0)
    const endTime = formatSRTTime(segment.endTime || 0)
    return `${index + 1}
${startTime} --> ${endTime}
${segment.text || ''}
`
  }).join('\n')
}

/**
 * Format time for SRT format (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.floor((seconds % 1) * 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`
}

/**
 * Export transcript as WebVTT format
 * @param {Object} recording - Recording object with transcript
 * @param {Array} segments - Optional array of timestamped segments
 * @returns {string} WebVTT formatted content
 */
export function exportToVTT(recording, segments = []) {
  const lines = ['WEBVTT', '']
  
  // If no segments provided, create single cue for entire transcript
  if (segments.length === 0) {
    const duration = recording.duration || 0
    lines.push('00:00:00.000 --> ' + formatVTTTime(duration))
    lines.push(recording.transcript || '')
    lines.push('')
    return lines.join('\n')
  }
  
  // Format segments with timestamps
  segments.forEach((segment, index) => {
    const startTime = formatVTTTime(segment.startTime || 0)
    const endTime = formatVTTTime(segment.endTime || 0)
    lines.push(`${startTime} --> ${endTime}`)
    lines.push(segment.text || '')
    lines.push('')
  })
  
  return lines.join('\n')
}

/**
 * Format time for WebVTT format (HH:MM:SS.mmm)
 */
function formatVTTTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.floor((seconds % 1) * 1000)
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`
}

/**
 * Export recording as formatted text document
 * @param {Object} recording - Recording object
 * @param {Object} options - Export options
 * @returns {string} Formatted document content
 */
export function exportToDocument(recording, options = {}) {
  const {
    includeMetadata = true,
    includeSummary = true,
    includeTimestamps = false,
    dateFormat = 'long',
    wordCount = true
  } = options
  
  const lines = []
  
  // Header
  lines.push('═════════════════════════════════════════')
  lines.push(`           ${recording.title || 'Untitled Recording'}`)
  lines.push('═════════════════════════════════════════')
  lines.push('')
  
  // Metadata
  if (includeMetadata) {
    lines.push('📋 METADATA')
    lines.push('───────────────────────────────────────────────')
    
    const date = new Date(recording.createdAt)
    if (dateFormat === 'long') {
      lines.push('Date:       ' + date.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }))
      lines.push('Time:       ' + date.toLocaleTimeString())
    } else {
      lines.push('Date:       ' + date.toLocaleDateString())
    }
    
    lines.push('Duration:   ' + formatDuration(recording.duration))
    lines.push('Type:       ' + (recording.type || 'notes'))
    
    if (recording.tags && recording.tags.length > 0) {
      lines.push('Tags:       ' + recording.tags.join(', '))
    }
    
    if (wordCount) {
      const words = recording.transcript?.split(/\s+/).filter(w => w.length > 0).length || 0
      lines.push('Word Count: ' + words)
      lines.push('Est. Read: ' + Math.ceil(words / 200) + ' min (at 200 wpm)')
    }
    
    lines.push('')
  }
  
  // Summary
  if (includeSummary && recording.summary) {
    lines.push('📝 SUMMARY')
    lines.push('───────────────────────────────────────────────')
    lines.push(recording.summary)
    lines.push('')
  }
  
  // Transcript
  lines.push('💬 TRANSCRIPT')
  lines.push('───────────────────────────────────────────────')
  lines.push('')
  lines.push(recording.transcript || 'No transcript available.')
  lines.push('')
  
  // Footer
  lines.push('───────────────────────────────────────────────')
  lines.push('Exported from Glassy Voice Studio')
  lines.push('Generated: ' + new Date().toISOString())
  
  return lines.join('\n')
}

/**
 * Format duration in human-readable format
 */
function formatDuration(seconds) {
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
 * Trigger file download
 * @param {string} content - File content
 * @param {string} filename - Desired filename
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate timestamped segments from transcript
 * Uses heuristic to estimate timestamps based on word count
 * @param {string} transcript - Transcript text
 * @param {number} duration - Total duration in seconds
 * @param {number} wordsPerMinute - Average speaking rate (default: 150)
 * @returns {Array} Array of timestamped segments
 */
export function generateTimestampedSegments(transcript, duration, wordsPerMinute = 150) {
  if (!transcript) return []
  
  const words = transcript.split(/\s+/).filter(w => w.length > 0)
  const totalWords = words.length
  const totalMinutes = duration / 60
  const estimatedWPM = totalWords / totalMinutes
  
  // Use actual WPM if available, otherwise use default
  const wpm = estimatedWPM > 50 && estimatedWPM < 300 ? estimatedWPM : wordsPerMinute
  
  const segments = []
  const segmentDuration = 30 // Create 30-second segments
  
  let currentSegment = []
  let segmentStartTime = 0
  
  words.forEach((word, index) => {
    currentSegment.push(word)
    
    // Check if we've reached segment duration
    const wordTime = (index + 1) / wpm * 60 // Time in seconds for this word
    const segmentWordCount = Math.floor((segmentDuration * wpm) / 60) // Words in 30 seconds
    
    if (currentSegment.length >= segmentWordCount || index === totalWords - 1) {
      const segmentEndTime = Math.min(segmentStartTime + segmentDuration, duration)
      
      segments.push({
        startTime: segmentStartTime,
        endTime: segmentEndTime,
        text: currentSegment.join(' ')
      })
      
      segmentStartTime = segmentEndTime
      currentSegment = []
    }
  })
  
  return segments
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format) {
  const extensions = {
    txt: 'txt',
    json: 'json',
    srt: 'srt',
    vtt: 'vtt',
    doc: 'txt',
    pdf: 'txt' // PDF would require jsPDF library
  }
  return extensions[format] || 'txt'
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format) {
  const mimeTypes = {
    txt: 'text/plain',
    json: 'application/json',
    srt: 'text/plain',
    vtt: 'text/vtt',
    doc: 'text/plain',
    pdf: 'application/pdf'
  }
  return mimeTypes[format] || 'text/plain'
}

/**
 * Export recording with format selection
 * @param {Object} recording - Recording object
 * @param {string} format - Export format (txt, json, srt, vtt, doc)
 * @param {Object} options - Additional export options
 */
export function exportRecording(recording, format = 'txt', options = {}) {
  let content
  let mimeType
  let filename
  
  switch (format.toLowerCase()) {
    case 'json':
      content = exportToJSON(recording)
      mimeType = getMimeType('json')
      filename = `${recording.title || 'recording'}.json`
      break
      
    case 'srt':
      const srtSegments = options.segments || generateTimestampedSegments(
        recording.transcript,
        recording.duration
      )
      content = exportToSRT(recording, srtSegments)
      mimeType = getMimeType('srt')
      filename = `${recording.title || 'recording'}.srt`
      break
      
    case 'vtt':
      const vttSegments = options.segments || generateTimestampedSegments(
        recording.transcript,
        recording.duration
      )
      content = exportToVTT(recording, vttSegments)
      mimeType = getMimeType('vtt')
      filename = `${recording.title || 'recording'}.vtt`
      break
      
    case 'doc':
      content = exportToDocument(recording, options)
      mimeType = getMimeType('doc')
      filename = `${recording.title || 'recording'}.txt`
      break
      
    case 'txt':
    default:
      content = exportToText(recording)
      mimeType = getMimeType('txt')
      filename = `${recording.title || 'recording'}.txt`
      break
  }
  
  downloadFile(content, filename, mimeType)
}