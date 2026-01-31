import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  base64ToBlob,
} from '../utils/audioStorage'

// API base URLs
const VOICE_API_BASE = '/api/voice/recordings'

// Helper function to get auth token
const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('glassy-dash-token')
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
  }
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  
  return headers
}

// API wrapper with error handling
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(options.isFormData),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'API request failed' }))
      throw new Error(error.error || 'API request failed')
    }

    return response.json()
  } catch (error) {
    console.error('[voiceStore] API error:', error)
    throw error
  }
}

// Load recordings from API
async function loadRecordingsFromAPI() {
  try {
    const response = await apiRequest(`${VOICE_API_BASE}`)
    return response || []
  } catch (error) {
    console.error('[voiceStore] Failed to load recordings:', error)
    return []
  }
}

// Load archived recordings from API
async function loadArchivedFromAPI() {
  try {
    const response = await apiRequest(`${VOICE_API_BASE}/archived`)
    return response || []
  } catch (error) {
    console.error('[voiceStore] Failed to load archived:', error)
    return []
  }
}

// Default state for recovery
const defaultVoiceState = {
  recordings: [],
  archivedRecordings: [],
  activeRecordingId: null,
  tags: [],
  studioCollapsed: false,
  galleryViewMode: 'grid',
  recordingState: 'idle',
  selectedIds: [],
  currentTranscript: '',
  currentSummary: '',
  currentAudio: null,
  recordingStartTime: null,
  recordingDuration: 0,
  error: null,
  transcriptHistory: [],
  historyIndex: -1,
  loading: false,
}

export const useVoiceStore = create(
  persist(
    (set, get) => ({
      // Data
      recordings: [],
      archivedRecordings: [],
      activeRecordingId: null,
      tags: [],

      // UI State
      studioCollapsed: false,
      galleryViewMode: 'grid',
      recordingState: 'idle',
      selectedIds: [],

      // Recording Data
      currentTranscript: '',
      currentSummary: '',
      currentAudio: null,
      recordingStartTime: null,
      recordingDuration: 0,
      error: null,

      // Undo/Redo History for Transcript Editing
      transcriptHistory: [],
      historyIndex: -1,

      loading: false,

      // Load recordings
      loadRecordings: async () => {
        set({ loading: true, error: null })
        try {
          const recordings = await loadRecordingsFromAPI()
          set({ recordings, loading: false, error: null })
        } catch (error) {
          set({ loading: false, error: error.message })
        }
      },

      // Load archived recordings
      loadArchived: async () => {
        set({ loading: true, error: null })
        try {
          const archived = await loadArchivedFromAPI()
          set({ archivedRecordings: archived, loading: false, error: null })
        } catch (error) {
          set({ loading: false, error: error.message })
        }
      },

      startRecording: () => {
        set({
          recordingState: 'recording',
          recordingStartTime: new Date().toISOString(),
          currentTranscript: '',
          currentSummary: '',
          currentAudio: null,
          error: null,
        })
      },

      stopRecording: () => {
        set({
          recordingState: 'processing',
          recordingStartTime: null,
        })
      },

      pauseRecording: () => {
        set({ recordingState: 'paused' })
      },

      resumeRecording: () => {
        set({ recordingState: 'recording' })
      },

      setRecordingState: state => set({ recordingState: state }),

      setTranscript: transcript =>
        set(state => {
          if (state.currentTranscript === transcript) return state

          const newHistory = state.transcriptHistory.slice(0, state.historyIndex + 1)
          newHistory.push(transcript)

          if (newHistory.length > 50) {
            newHistory.shift()
          }

          return {
            currentTranscript: transcript,
            transcriptHistory: newHistory,
            historyIndex: newHistory.length - 1,
          }
        }),

      updateTranscript: transcript => set({ currentTranscript: transcript }),

      undoTranscript: () =>
        set(state => {
          if (state.historyIndex > 0) {
            return {
              historyIndex: state.historyIndex - 1,
              currentTranscript: state.transcriptHistory[state.historyIndex - 1],
            }
          }
          return state
        }),

      redoTranscript: () =>
        set(state => {
          if (state.historyIndex < state.transcriptHistory.length - 1) {
            return {
              historyIndex: state.historyIndex + 1,
              currentTranscript: state.transcriptHistory[state.historyIndex + 1],
            }
          }
          return state
        }),

      clearTranscriptHistory: () => set({ transcriptHistory: [], historyIndex: -1 }),

      setSummary: summary => set({ currentSummary: summary }),

      setAudioData: audioData => set({ currentAudio: audioData }),

      setRecordingDuration: duration => set({ recordingDuration: duration }),

      setError: error => set({ error }),

      saveRecording: async (type, metadata = {}) => {
        const { recordings, currentTranscript, currentSummary, currentAudio, recordingStartTime } =
          get()

        const recordingId = crypto.randomUUID()

        const newRecording = {
          id: recordingId,
          title: metadata.title || `Voice Note ${recordings.length + 1}`,
          transcript: currentTranscript,
          summary: currentSummary,
          duration: get().recordingDuration,
          tags: [...(metadata.tags || []), 'voice-studio'],
          type: type,
          createdAt: recordingStartTime || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        try {
          set({ loading: true, error: null })

          // Create recording metadata first
          const response = await apiRequest(VOICE_API_BASE, {
            method: 'POST',
            body: JSON.stringify(newRecording),
          })

          // If there's audio, upload it
          if (currentAudio) {
            try {
              // Convert base64 to blob
              const audioBlob = base64ToBlob(currentAudio)
              console.log(
                `[VoiceStore] Uploading audio (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB)`
              )

              // Create FormData for file upload
              const formData = new FormData()
              formData.append('audio', audioBlob, `recording-${recordingId}.webm`)
              formData.append('audio_file_path', `uploads/voice/${recordingId}.webm`)
              formData.append('audio_size', audioBlob.size)
              formData.append('audio_format', 'webm')

              await apiRequest(`${VOICE_API_BASE}/${recordingId}/audio`, {
                method: 'PUT',
                isFormData: true,
                body: formData,
              })

              console.log(`[VoiceStore] Audio uploaded successfully`)
            } catch (audioError) {
              console.warn('[VoiceStore] Audio upload failed:', audioError)
              // Continue even if audio upload fails - metadata is saved
            }
          }

          // Update recording with audio info
          newRecording.audio_file_path = response.audio_file_path
          newRecording.audio_size = response.audio_size

          // Reset state
          set(state => ({
            recordings: [newRecording, ...state.recordings],
            recordingState: 'idle',
            currentTranscript: '',
            currentSummary: '',
            currentAudio: null,
            recordingStartTime: null,
            recordingDuration: 0,
            transcriptHistory: [],
            historyIndex: -1,
            loading: false,
            error: null,
          }))

          // Reload to get server response
          await get().loadRecordings()

          return newRecording
        } catch (error) {
          set({
            loading: false,
            error: error.message,
            recordingState: 'idle',
          })
          throw error
        }
      },

      deleteRecording: async id => {
        try {
          set({ loading: true, error: null })

          // Optimistic update
          set(state => ({
            recordings: state.recordings.filter(r => r.id !== id),
          }))

          // API call
          await apiRequest(`${VOICE_API_BASE}/${id}`, { method: 'DELETE' })

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          await get().loadRecordings()
          set({ loading: false, error: error.message })
          throw error
        }
      },

      editRecording: async (id, updates) => {
        const currentRecording = get().recordings.find(r => r.id === id)
        if (!currentRecording) return

        const updatedRecording = {
          ...currentRecording,
          ...updates,
          updatedAt: new Date().toISOString(),
        }

        try {
          set({ loading: true, error: null })

          // Optimistic update
          set(state => ({
            recordings: state.recordings.map(r =>
              r.id === id ? updatedRecording : r
            ),
          }))

          // API call
          await apiRequest(`${VOICE_API_BASE}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedRecording),
          })

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          set(state => ({
            recordings: state.recordings.map(r =>
              r.id === id ? currentRecording : r
            ),
            loading: false,
            error: error.message,
          }))
          throw error
        }
      },

      deleteTranscriptSegment: (recordingId, segmentId) =>
        set(state => {
          const recording = state.recordings.find(r => r.id === recordingId)
          if (!recording || !recording.transcriptSegments) return state

          const updatedSegments = recording.transcriptSegments.map(seg =>
            seg.id === segmentId ? { ...seg, deleted: true } : seg
          )

          const newTranscript = updatedSegments
            .filter(seg => !seg.deleted)
            .sort((a, b) => a.order - b.order)
            .map(seg => seg.text)
            .join('\n\n')

          return {
            recordings: state.recordings.map(r =>
              r.id === recordingId
                ? {
                    ...r,
                    transcriptSegments: updatedSegments,
                    transcript: newTranscript,
                    updatedAt: new Date().toISOString(),
                  }
                : r
            ),
          }
        }),

      restoreTranscriptSegment: (recordingId, segmentId) =>
        set(state => {
          const recording = state.recordings.find(r => r.id === recordingId)
          if (!recording || !recording.transcriptSegments) return state

          const updatedSegments = recording.transcriptSegments.map(seg =>
            seg.id === segmentId ? { ...seg, deleted: false } : seg
          )

          const newTranscript = updatedSegments
            .filter(seg => !seg.deleted)
            .sort((a, b) => a.order - b.order)
            .map(seg => seg.text)
            .join('\n\n')

          return {
            recordings: state.recordings.map(r =>
              r.id === recordingId
                ? {
                    ...r,
                    transcriptSegments: updatedSegments,
                    transcript: newTranscript,
                    updatedAt: new Date().toISOString(),
                  }
                : r
            ),
          }
        }),

      editTranscriptSegment: (recordingId, segmentId, newText) =>
        set(state => {
          const recording = state.recordings.find(r => r.id === recordingId)
          if (!recording || !recording.transcriptSegments) return state

          const updatedSegments = recording.transcriptSegments.map(seg =>
            seg.id === segmentId ? { ...seg, text: newText } : seg
          )

          const newTranscript = updatedSegments
            .filter(seg => !seg.deleted)
            .sort((a, b) => a.order - b.order)
            .map(seg => seg.text)
            .join('\n\n')

          return {
            recordings: state.recordings.map(r =>
              r.id === recordingId
                ? {
                    ...r,
                    transcriptSegments: updatedSegments,
                    transcript: newTranscript,
                    updatedAt: new Date().toISOString(),
                  }
                : r
            ),
          }
        }),

      loadRecordingForEdit: id => {
        const recording = get().recordings.find(r => r.id === id)
        if (recording) {
          set({
            activeRecordingId: id,
            currentTranscript: recording.transcript,
            currentSummary: recording.summary,
            recordingDuration: recording.duration || 0,
            recordingState: 'reviewing',
          })
        }
      },

      clearActiveRecording: () => {
        set({
          activeRecordingId: null,
          currentTranscript: '',
          currentSummary: '',
          currentAudio: null,
          recordingState: 'idle',
          error: null,
        })
      },

      getRecordingAudioUrl: async recordingId => {
        const recording = get().recordings.find(r => r.id === recordingId)
        if (!recording) return null

        // Get audio URL from API
        try {
          const audioUrl = `${VOICE_API_BASE}/${recordingId}/audio`
          return audioUrl
        } catch (error) {
          console.warn('[voiceStore] Failed to get audio URL:', error)
          return null
        }
      },

      setStudioCollapsed: collapsed => set({ studioCollapsed: collapsed }),
      setGalleryViewMode: mode => set({ galleryViewMode: mode }),

      addTag: (name, color = 'indigo') =>
        set(state => {
          const existingTag = state.tags.find(t => t.name.toLowerCase() === name.toLowerCase())
          if (existingTag) return state

          return {
            tags: [
              ...state.tags,
              {
                id: crypto.randomUUID(),
                name,
                color,
                count: 0,
              },
            ],
          }
        }),

      deleteTag: tagId =>
        set(state => ({
          tags: state.tags.filter(t => t.id !== tagId),
          recordings: state.recordings.map(r => ({
            ...r,
            tags: (r.tags || []).filter(t => t !== tagId),
          })),
        })),

      updateRecordingTags: async (id, tags) => {
        const recording = get().recordings.find(r => r.id === id)
        if (!recording) return

        try {
          set({ loading: true, error: null })

          // Optimistic update
          set(state => ({
            recordings: state.recordings.map(r =>
              r.id === id ? { ...r, tags, updatedAt: new Date().toISOString() } : r
            ),
          }))

          // API call
          await apiRequest(`${VOICE_API_BASE}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ tags }),
          })

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          set(state => ({
            recordings: state.recordings.map(r => (r.id === id ? recording : r)),
            loading: false,
            error: error.message,
          }))
          throw error
        }
      },

      setSelectedIds: ids => set({ selectedIds: ids }),
      clearSelectedIds: () => set({ selectedIds: [] }),

      bulkDelete: async ids => {
        try {
          set({ loading: true, error: null })

          // Optimistic update
          set(state => ({
            recordings: state.recordings.filter(r => !ids.includes(r.id)),
            selectedIds: [],
          }))

          // API call for each ID
          await Promise.all(
            ids.map(id => apiRequest(`${VOICE_API_BASE}/${id}`, { method: 'DELETE' }))
          )

          // Reload to ensure consistency
          await get().loadRecordings()

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          await get().loadRecordings()
          set({ loading: false, error: error.message })
          throw error
        }
      },

      archiveRecordings: async ids => {
        try {
          set({ loading: true, error: null })

          // Optimistic update
          const recordingsToArchive = get().recordings.filter(r => ids.includes(r.id))
          set(state => ({
            archivedRecordings: [
              ...recordingsToArchive.map(r => ({
                ...r,
                archivedAt: new Date().toISOString(),
              })),
              ...state.archivedRecordings,
            ],
            recordings: state.recordings.filter(r => !ids.includes(r.id)),
            selectedIds: [],
          }))

          // API call for each ID
          await Promise.all(
            ids.map(id => apiRequest(`${VOICE_API_BASE}/${id}/archive`, { method: 'POST' }))
          )

          // Reload to ensure consistency
          await get().loadRecordings()
          await get().loadArchived()

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          await get().loadRecordings()
          await get().loadArchived()
          set({ loading: false, error: error.message })
          throw error
        }
      },

      unarchiveRecording: async id => {
        try {
          set({ loading: true, error: null })

          // Optimistic update
          const archivedRecording = get().archivedRecordings.find(r => r.id === id)
          if (!archivedRecording) {
            set({ loading: false, error: 'Recording not found' })
            return
          }

          set(state => ({
            recordings: [
              {
                ...archivedRecording,
                updatedAt: new Date().toISOString(),
              },
              ...state.recordings,
            ],
            archivedRecordings: state.archivedRecordings.filter(r => r.id !== id),
          }))

          // API call
          await apiRequest(`${VOICE_API_BASE}/${id}/unarchive`, { method: 'POST' })

          // Reload to ensure consistency
          await get().loadRecordings()
          await get().loadArchived()

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          await get().loadRecordings()
          await get().loadArchived()
          set({ loading: false, error: error.message })
          throw error
        }
      },

      bulkUnarchive: async ids => {
        try {
          set({ loading: true, error: null })

          const recordingsToUnarchive = get().archivedRecordings.filter(r => ids.includes(r.id))
          
          set(state => ({
            recordings: [
              ...recordingsToUnarchive.map(r => ({
                ...r,
                updatedAt: new Date().toISOString(),
              })),
              ...state.recordings,
            ],
            archivedRecordings: state.archivedRecordings.filter(r => !ids.includes(r.id)),
            selectedIds: [],
          }))

          // API call for each ID
          await Promise.all(
            ids.map(id => apiRequest(`${VOICE_API_BASE}/${id}/unarchive`, { method: 'POST' }))
          )

          // Reload to ensure consistency
          await get().loadRecordings()
          await get().loadArchived()

          set({ loading: false, error: null })
        } catch (error) {
          // Rollback on error
          await get().loadRecordings()
          await get().loadArchived()
          set({ loading: false, error: error.message })
          throw error
        }
      },

      deleteArchived: id =>
        set(state => ({
          archivedRecordings: state.archivedRecordings.filter(r => r.id !== id),
        })),

      bulkDeleteArchived: ids =>
        set(state => ({
          archivedRecordings: state.archivedRecordings.filter(r => !ids.includes(r.id)),
        })),

      searchRecordings: (query, filters = {}) => {
        const { recordings } = get()
        const lowerQuery = query.toLowerCase()

        return recordings.filter(r => {
          const matchesQuery =
            !query ||
            (r.title && r.title.toLowerCase().includes(lowerQuery)) ||
            (r.transcript && r.transcript.toLowerCase().includes(lowerQuery)) ||
            (r.summary && (Array.isArray(r.summary) ? r.summary.join(' ') : String(r.summary)).toLowerCase().includes(lowerQuery))

          if (!matchesQuery) return false

          if (filters.dateRange) {
            const recordingDate = new Date(r.createdAt)
            const { start, end } = filters.dateRange
            if (start && recordingDate < start) return false
            if (end && recordingDate > end) return false
          }

          if (filters.duration) {
            const { min, max } = filters.duration
            if (min && r.duration < min) return false
            if (max && r.duration > max) return false
          }

          if (filters.type && r.type !== filters.type) {
            return false
          }

          if (filters.tags && filters.tags.length > 0) {
            const hasAllTags = filters.tags.every(tag => (r.tags || []).includes(tag))
            if (!hasAllTags) return false
          }

          return true
        })
      },

      sortRecordings: (sortBy, sortOrder = 'desc') => {
        const { recordings } = get()
        return [...recordings].sort((a, b) => {
          let comparison = 0

          switch (sortBy) {
            case 'date':
              comparison = new Date(a.createdAt) - new Date(b.createdAt)
              break
            case 'duration':
              comparison = a.duration - b.duration
              break
            case 'title':
              comparison = a.title.localeCompare(b.title)
              break
            default:
              comparison = 0
          }

          // Return comparison for ascending, invert for descending
          return sortOrder === 'asc' ? comparison : -comparison
        })
      },

      // Phase 5: Advanced Features Actions
      setSpeakerSegments: (recordingId, segments) => {
        set(state => ({
          recordings: state.recordings.map(r =>
            r.id === recordingId
              ? { ...r, speakerSegments: segments, updatedAt: new Date().toISOString() }
              : r
          ),
        }))
      },

      setSpeakerName: (recordingId, speakerId, customName) => {
        set(state => {
          const recording = state.recordings.find(r => r.id === recordingId)
          if (!recording) return state

          const updatedSegments = (recording.speakerSegments || []).map(segment =>
            segment.speaker === speakerId ? { ...segment, speakerName: customName } : segment
          )

          return {
            recordings: state.recordings.map(r =>
              r.id === recordingId
                ? { ...r, speakerSegments: updatedSegments, updatedAt: new Date().toISOString() }
                : r
            ),
          }
        })
      },

      linkToDocument: (voiceId, documentId) =>
        set(state => ({
          recordings: state.recordings.map(r =>
            r.id === voiceId
              ? {
                  ...r,
                  linkedDocuments: [...new Set([...(r.linkedDocuments || []), documentId])],
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        })),

      unlinkFromDocument: (voiceId, documentId) =>
        set(state => ({
          recordings: state.recordings.map(r =>
            r.id === voiceId
              ? {
                  ...r,
                  linkedDocuments: (r.linkedDocuments || []).filter(id => id !== documentId),
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        })),

      updateAudioData: (recordingId, newAudioData, edits = []) => {
        set(state => ({
          recordings: state.recordings.map(r =>
            r.id === recordingId
              ? {
                  ...r,
                  audioData: newAudioData,
                  edits: [...(r.edits || []), ...edits],
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }))
      },

      applyEnhancements: (recordingId, enhancementTypes) => {
        set(state => ({
          recordings: state.recordings.map(r =>
            r.id === recordingId
              ? {
                  ...r,
                  enhancements: [...new Set([...(r.enhancements || []), ...enhancementTypes])],
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }))
      },

      removeEnhancement: (recordingId, enhancementType) => {
        set(state => ({
          recordings: state.recordings.map(r =>
            r.id === recordingId
              ? {
                  ...r,
                  enhancements: (r.enhancements || []).filter(e => e !== enhancementType),
                  updatedAt: new Date().toISOString(),
                }
              : r
          ),
        }))
      },

      getRecordingStats: recordingId => {
        const { recordings } = get()
        const recording = recordings.find(r => r.id === recordingId)
        if (!recording) return null

        const transcript = recording.transcript || ''
        const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length
        const characterCount = transcript.length

        return {
          wordCount,
          characterCount,
          duration: recording.duration || 0,
          speakingRate: (wordCount / (recording.duration || 1)) * 60,
          readingTime: Math.ceil((wordCount / 200) * 60),
          hasTranscript: transcript.length > 0,
          hasSpeakerSegments: (recording.speakerSegments || []).length > 0,
          linkedDocumentsCount: (recording.linkedDocuments || []).length,
          editCount: (recording.edits || []).length,
          enhancementCount: (recording.enhancements || []).length,
        }
      },

      importRecordings: newRecordings => {
        const { recordings } = get()
        let importedCount = 0
        let skippedCount = 0
        let errorCount = 0

        const validatedRecordings = newRecordings
          .filter(rec => {
            if (!rec.title || !rec.transcript) {
              errorCount++
              return false
            }

            const isDuplicate = recordings.some(
              r => r.id === rec.id || (r.title === rec.title && r.transcript === rec.transcript)
            )

            if (isDuplicate) {
              skippedCount++
              return false
            }

            importedCount++
            return true
          })
          .map(rec => ({
            ...rec,
            id: rec.id || crypto.randomUUID(),
            importedAt: new Date().toISOString(),
            createdAt: rec.createdAt || new Date().toISOString(),
            updatedAt: rec.updatedAt || new Date().toISOString(),
            tags: [...new Set([...(rec.tags || []), 'imported'])],
          }))

        if (validatedRecordings.length > 0) {
          set(state => ({
            recordings: [...validatedRecordings, ...state.recordings],
          }))
        }

        return { importedCount, skippedCount, errorCount }
      },

      getAllAnalytics: () => {
        const { recordings } = get()

        if (recordings.length === 0) return null

        const totalDuration = recordings.reduce((sum, r) => sum + (r.duration || 0), 0)
        const totalWords = recordings.reduce((sum, r) => {
          const transcript = r.transcript || ''
          return sum + transcript.split(/\s+/).filter(w => w.length > 0).length
        }, 0)

        const notesCount = recordings.filter(r => r.type === 'notes').length
        const galleryCount = recordings.filter(r => r.type === 'gallery').length

        const wordFrequency = {}
        recordings.forEach(r => {
          const words = (r.transcript || '').toLowerCase().match(/\b\w+\b/g) || []
          words.forEach(word => {
            if (word.length > 3) {
              wordFrequency[word] = (wordFrequency[word] || 0) + 1
            }
          })
        })

        const mostUsedWords = Object.entries(wordFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([word, count]) => ({ word, count }))

        const byDay = {}
        recordings.forEach(r => {
          const date = new Date(r.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
          byDay[date] = (byDay[date] || 0) + 1
        })

        const recordingsByDay = Object.entries(byDay)
          .map(([date, count]) => ({ date, count }))
          .slice(-7)

        const tagUsage = {}
        recordings.forEach(r => {
          ;(r.tags || []).forEach(tag => {
            if (typeof tag === 'string') {
              tagUsage[tag] = (tagUsage[tag] || 0) + 1
            }
          })
        })

        const mostUsedTags = Object.entries(tagUsage)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag, count]) => ({ tag, count }))

        return {
          totalRecordings: recordings.length,
          totalDuration,
          avgDuration: totalDuration / recordings.length,
          totalWords,
          avgWords: totalWords / recordings.length,
          notesCount,
          galleryCount,
          recordingsByDay,
          mostUsedWords,
          mostUsedTags,
          avgSpeakingRate: (totalWords / totalDuration) * 60,
        }
      },

      resetRecordingState: () => {
        set({
          recordingState: 'idle',
          currentTranscript: '',
          currentSummary: '',
          currentAudio: null,
          recordingStartTime: null,
          recordingDuration: 0,
          error: null,
          activeRecordingId: null,
          transcriptHistory: [],
          historyIndex: -1,
        })
      },

      clearCorruptedRecordings: () => {
        const { recordings } = get()
        const validRecordings = recordings.filter(
          r => r.id && r.title && (r.transcript || r.audioData || r.audio_file_path)
        )
        
        set({
          recordings: validRecordings,
        })
        
        return {
          removed: recordings.length - validRecordings.length,
        }
      },

      recoverStuckRecording: (recordingId) => {
        const { recordings } = get()
        const recording = recordings.find(r => r.id === recordingId)
        
        if (recording) {
          const updatedRecording = {
            ...recording,
            recordingState: 'idle',
            updatedAt: new Date().toISOString(),
          }
          
          set({
            recordings: recordings.map(r =>
              r.id === recordingId ? updatedRecording : r
            ),
          })
          
          return { success: true }
        }
        
        return { success: false, error: 'Recording not found' }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'glassy-voice-storage',
      onRehydrateStorage: () => (state) => {
        if (!state) return defaultVoiceState
        
        const issues = []
        
        if (state.recordingState === 'processing' || state.recordingState === 'recording') {
          issues.push('Recording stuck in processing state')
        }
        
        if (state.recordings && state.recordings.some(r => !r.id || !r.title)) {
          issues.push('Found recordings with invalid structure')
        }
        
        if (issues.length > 0) {
          console.warn('[VoiceStore] Storage issues detected:', issues)
          return {
            ...state,
            recordingState: 'idle',
            currentTranscript: '',
            currentSummary: '',
            currentAudio: null,
            error: null,
          }
        }
        
        return state
      },
      onRehydrateStorageError: (error) => {
        console.error('[VoiceStore] Failed to load storage:', error)
        return defaultVoiceState
      },
      partialize: state => ({
        activeRecordingId: state.activeRecordingId,
        studioCollapsed: state.studioCollapsed,
        galleryViewMode: state.galleryViewMode,
      }),
    }
  )
)