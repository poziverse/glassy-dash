/**
 * Content Converter Utilities
 * Converts voice recordings to notes, documents, or export formats
 */

import { useNotesStore } from '../stores/notesStore'
import { useDocsStore } from '../stores/docsStore'
import { formatDuration } from './voiceSearch'

/**
 * Convert voice recording to a Note
 * @param {Object} recording - Voice recording object
 * @returns {string} Note ID
 */
export async function convertToNote(recording) {
  try {
    const notesStore = useNotesStore.getState()

    const noteContent = buildNoteContent(recording)

    const noteId = crypto.randomUUID()
    const note = {
      id: noteId,
      title: recording.title || 'Voice Transcript',
      content: noteContent,
      tags: [...(recording.tags || []), 'voice-transcript'],
      background: 'indigo', // Distinctive color for voice notes
      pinned: false,
      deletedAt: null,
      deleted_at: null,
      createdAt: recording.createdAt,
      created_at: recording.createdAt,
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Create note using the store's addNote method
    notesStore.addNote(note)
    return noteId
  } catch (error) {
    console.error('Error converting to note:', error)
    throw new Error('Failed to convert to note')
  }
}

/**
 * Build formatted note content from recording
 * @param {Object} recording - Voice recording object
 * @returns {string} Formatted note content
 */
function buildNoteContent(recording) {
  const hasSummary = recording.summary && recording.summary.trim().length > 0

  let content = ''

  if (hasSummary) {
    content += `**Summary:** ${recording.summary}\n\n`
  }

  content += recording.transcript || ''

  // Add metadata footer
  content += '\n\n---\n'
  content += `🎙️ Voice Note | Recorded: ${new Date(recording.createdAt).toLocaleDateString()} | Duration: ${formatDuration(recording.duration)}`

  return content
}

/**
 * Convert voice recording to a Document
 * @param {Object} recording - Voice recording object
 * @returns {string} Document ID
 */
export async function convertToDocument(recording) {
  try {
    const docsStore = useDocsStore.getState()

    const docContent = buildDocumentContent(recording)

    const docId = docsStore.createDoc()

    docsStore.updateDoc(docId, {
      title: recording.title || 'Voice Transcript',
      content: docContent,
      updatedAt: new Date().toISOString(),
    })

    return docId
  } catch (error) {
    console.error('Error converting to document:', error)
    throw new Error('Failed to convert to document')
  }
}

/**
 * Build formatted document content from recording
 * @param {Object} recording - Voice recording object
 * @returns {string} Formatted document content
 */
function buildDocumentContent(recording) {
  const hasSummary = recording.summary && recording.summary.trim().length > 0

  let content = '# Voice Transcript\n\n'

  // Metadata section
  content += '## Recording Details\n\n'
  content += `- **Date:** ${new Date(recording.createdAt).toLocaleString()}\n`
  content += `- **Duration:** ${formatDuration(recording.duration)}\n`
  content += `- **Word Count:** ${(recording.transcript || '').split(/\s+/).filter(w => w.length > 0).length} words\n`

  if (recording.tags && recording.tags.length > 0) {
    content += `- **Tags:** ${recording.tags.join(', ')}\n`
  }

  content += '\n---\n\n'

  // Summary section
  if (hasSummary) {
    content += '## Summary\n\n'
    content += recording.summary + '\n\n'
    content += '---\n\n'
  }

  // Full transcript
  content += '## Full Transcript\n\n'
  content += recording.transcript || 'No transcript available.'

  return content
}

/**
 * Keep recording as voice note and mark as processed
 * @param {Object} recording - Voice recording object
 * @returns {string} Recording ID
 */
export async function keepAsVoiceNote(recording) {
  try {
    const { useVoiceStore } = await import('../stores/voiceStore')
    const voiceStore = useVoiceStore.getState()

    voiceStore.editRecording(recording.id, {
      processed: true,
      processedAt: new Date().toISOString(),
    })

    return recording.id
  } catch (error) {
    console.error('Error marking as processed:', error)
    throw new Error('Failed to mark as processed')
  }
}

/**
 * Generate Markdown export from recording
 * @param {Object} recording - Voice recording object
 * @returns {string} Markdown content
 */
export function generateMarkdown(recording) {
  return buildDocumentContent(recording)
}

/**
 * Generate plain text export from recording
 * @param {Object} recording - Voice recording object
 * @returns {string} Plain text content
 */
export function generatePlainText(recording) {
  const hasSummary = recording.summary && recording.summary.trim().length > 0

  let content = recording.title || 'Voice Transcript'
  content += '\n\n'

  if (hasSummary) {
    content += 'SUMMARY\n' + '='.repeat(50) + '\n'
    content += recording.summary + '\n\n'
  }

  content += 'TRANSCRIPT\n' + '='.repeat(50) + '\n'
  content += recording.transcript || 'No transcript available.'

  content += '\n\n'
  content += '-'.repeat(50) + '\n'
  content += `Recorded: ${new Date(recording.createdAt).toLocaleString()}\n`
  content += `Duration: ${formatDuration(recording.duration)}\n`

  return content
}

/**
 * Generate JSON export from recording
 * @param {Object} recording - Voice recording object
 * @returns {string} JSON content
 */
export function generateJSON(recording) {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    recording: {
      id: recording.id,
      title: recording.title,
      transcript: recording.transcript,
      summary: recording.summary,
      createdAt: recording.createdAt,
      updatedAt: recording.updatedAt,
      duration: recording.duration,
      tags: recording.tags || [],
      type: recording.type,
      // Don't include audioData in JSON export (too large)
      hasAudio: !!recording.audioData,
    },
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Download content as file
 * @param {string} content - File content
 * @param {string} filename - File name
 * @param {string} mimeType - MIME type
 */
export function downloadFile(content, filename, mimeType) {
  try {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file:', error)
    throw new Error('Failed to download file')
  }
}

/**
 * Export recording to file
 * @param {Object} recording - Voice recording object
 * @param {string} format - Export format (markdown, txt, json)
 */
export async function exportRecording(recording, format = 'markdown') {
  let content, filename, mimeType

  switch (format) {
    case 'markdown':
      content = generateMarkdown(recording)
      filename = `${sanitizeFilename(recording.title || 'transcript')}.md`
      mimeType = 'text/markdown'
      break
    case 'txt':
      content = generatePlainText(recording)
      filename = `${sanitizeFilename(recording.title || 'transcript')}.txt`
      mimeType = 'text/plain'
      break
    case 'json':
      content = generateJSON(recording)
      filename = `${sanitizeFilename(recording.title || 'transcript')}.json`
      mimeType = 'application/json'
      break
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }

  downloadFile(content, filename, mimeType)
}

/**
 * Sanitize filename for safe file system usage
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  return (
    filename
      .replace(/[^a-z0-9\s_-]/gi, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 100) // Limit length
      .trim() || 'transcript'
  )
}
