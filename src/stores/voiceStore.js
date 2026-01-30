import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  storeAudio,
  getAudioByRecordingId,
  deleteAudioByRecordingId,
  base64ToBlob,
  initDB,
} from '../utils/audioStorage'

// Initialize IndexedDB on module load
initDB().catch(err => console.warn('[VoiceStore] IndexedDB init warning:', err))

export const useVoiceStore = create(
  persist(
    (set, get) => ({
      // Data
      recordings: [],
      activeRecordingId: null,
      tags: [], // Available tags: { id, name, color, count }
      archivedRecordings: [], // Archived recordings

      // UI State
      studioCollapsed: false,
      galleryViewMode: 'grid', // grid, list, timeline
      recordingState: 'idle', // idle, recording, paused, processing, reviewing
      selectedIds: [], // For bulk operations

      // Recording Data
      currentTranscript: '',
      currentSummary: '',
      currentAudio: null,
      recordingStartTime: null,
      recordingDuration: 0, // in seconds
      error: null,

      // Undo/Redo History for Transcript Editing
      transcriptHistory: [], // Stack of transcript states
      historyIndex: -1, // Current position in history

      // Actions
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
          // If transcript is exactly the same, do nothing
          if (state.currentTranscript === transcript) return state

          // Push to history if not at the end
          const newHistory = state.transcriptHistory.slice(0, state.historyIndex + 1)
          newHistory.push(transcript)

          // Limit history to 50 states
          if (newHistory.length > 50) {
            newHistory.shift()
          }

          return {
            currentTranscript: transcript,
            transcriptHistory: newHistory,
            historyIndex: newHistory.length - 1,
          }
        }),

      // For streaming transcription (doesn't affect history)
      updateTranscript: transcript => set({ currentTranscript: transcript }),

      // Undo/Redo Actions
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

        // Generate recording ID first (needed for IndexedDB reference)
        const recordingId = crypto.randomUUID()

        // Store audio in IndexedDB if present (for longer recordings)
        let audioStorageId = null
        let audioDataFallback = null

        if (currentAudio) {
          try {
            // Convert base64 to blob for efficient IndexedDB storage
            const audioBlob = base64ToBlob(currentAudio)
            console.log(
              `[VoiceStore] Storing audio in IndexedDB (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB)`
            )

            audioStorageId = await storeAudio(recordingId, audioBlob, {
              duration: get().recordingDuration,
              format: 'webm',
            })
            console.log(`[VoiceStore] Audio stored with ID: ${audioStorageId}`)
          } catch (error) {
            console.warn('[VoiceStore] IndexedDB storage failed, using fallback:', error)
            // Fallback: keep audioData in state (not recommended for long recordings)
            audioDataFallback = currentAudio
          }
        }

        // Convert transcript to segments for easier editing
        const transcriptSegments = currentTranscript
          .split(/\n\n+/) // Split by double newlines (paragraphs)
          .filter(segment => segment.trim().length > 0)
          .map((text, index) => ({
            id: crypto.randomUUID(),
            text: text.trim(),
            order: index,
            deleted: false,
            createdAt: new Date().toISOString(),
          }))

        const newRecording = {
          id: recordingId,
          title: metadata.title || `Voice Note ${recordings.length + 1}`,
          transcript: currentTranscript,
          transcriptSegments: transcriptSegments,
          summary: currentSummary,
          audioStorageId, // Reference to IndexedDB (null if fallback used)
          audioData: audioDataFallback, // Only set if IndexedDB failed
          createdAt: recordingStartTime || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          duration: get().recordingDuration,
          tags: [...(metadata.tags || []), 'voice-studio'],
          type: type, // 'notes' or 'gallery'
        }

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
        }))

        return newRecording
      },

      deleteRecording: async id => {
        const recording = get().recordings.find(r => r.id === id)

        // Delete audio from IndexedDB if stored there
        if (recording?.audioStorageId) {
          try {
            await deleteAudioByRecordingId(id)
            console.log(`[VoiceStore] Audio deleted from IndexedDB for recording: ${id}`)
          } catch (error) {
            console.warn('[VoiceStore] Failed to delete audio from IndexedDB:', error)
          }
        }

        set(state => ({
          recordings: state.recordings.filter(r => r.id !== id),
        }))
      },

      editRecording: (id, updates) => {
        set(state => ({
          recordings: state.recordings.map(r =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
          ),
        }))
      },

      // Transcript Segment Management
      deleteTranscriptSegment: (recordingId, segmentId) =>
        set(state => {
          const recording = state.recordings.find(r => r.id === recordingId)
          if (!recording || !recording.transcriptSegments) return state

          // Mark segment as deleted
          const updatedSegments = recording.transcriptSegments.map(seg =>
            seg.id === segmentId ? { ...seg, deleted: true } : seg
          )

          // Rebuild transcript from non-deleted segments
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

          // Restore segment
          const updatedSegments = recording.transcriptSegments.map(seg =>
            seg.id === segmentId ? { ...seg, deleted: false } : seg
          )

          // Rebuild transcript
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

          // Update segment text
          const updatedSegments = recording.transcriptSegments.map(seg =>
            seg.id === segmentId ? { ...seg, text: newText } : seg
          )

          // Rebuild transcript
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
            currentAudio: recording.audioData,
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

      // Get audio URL for a recording (from IndexedDB or inline fallback)
      getRecordingAudioUrl: async recordingId => {
        const recording = get().recordings.find(r => r.id === recordingId)
        if (!recording) return null

        // Try IndexedDB first (preferred for large files)
        if (recording.audioStorageId) {
          try {
            const blob = await getAudioByRecordingId(recordingId)
            if (blob) {
              const url = URL.createObjectURL(blob)
              console.log(`[VoiceStore] Audio loaded from IndexedDB for: ${recordingId}`)
              return url
            }
          } catch (error) {
            console.warn('[VoiceStore] Failed to get audio from IndexedDB:', error)
          }
        }

        // Fallback to inline audioData (legacy or failed IndexedDB storage)
        if (recording.audioData) {
          return `data:audio/webm;base64,${recording.audioData}`
        }

        return null
      },

      setStudioCollapsed: collapsed => set({ studioCollapsed: collapsed }),

      // View Mode
      setGalleryViewMode: mode => set({ galleryViewMode: mode }),

      // Tag Management
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
          // Remove tag from all recordings
          recordings: state.recordings.map(r => ({
            ...r,
            tags: (r.tags || []).filter(t => t !== tagId),
          })),
        })),

      updateRecordingTags: (id, tags) =>
        set(state => {
          const recording = state.recordings.find(r => r.id === id)
          if (!recording) return state

          const oldTags = recording.tags || []
          const newTags = tags

          // Update tag counts
          const tagUpdates = state.tags.map(tag => {
            const wasInOld = oldTags.includes(tag.id)
            const isInNew = newTags.includes(tag.id)
            if (wasInOld && !isInNew) return { ...tag, count: Math.max(0, tag.count - 1) }
            if (!wasInOld && isInNew) return { ...tag, count: tag.count + 1 }
            return tag
          })

          return {
            tags: tagUpdates,
            recordings: state.recordings.map(r =>
              r.id === id ? { ...r, tags: newTags, updatedAt: new Date().toISOString() } : r
            ),
          }
        }),

      // Bulk Operations
      setSelectedIds: ids => set({ selectedIds: ids }),
      clearSelectedIds: () => set({ selectedIds: [] }),

      bulkDelete: ids =>
        set(state => {
          // Decrease tag counts
          const recordingsToDelete = state.recordings.filter(r => ids.includes(r.id))
          const tagUpdates = state.tags.map(tag => {
            const countDecrease = recordingsToDelete.filter(r =>
              (r.tags || []).includes(tag.id)
            ).length
            return { ...tag, count: Math.max(0, tag.count - countDecrease) }
          })

          return {
            tags: tagUpdates,
            recordings: state.recordings.filter(r => !ids.includes(r.id)),
            selectedIds: [],
          }
        }),

      bulkMove: (ids, targetType) =>
        set(state => ({
          recordings: state.recordings.map(r =>
            ids.includes(r.id) ? { ...r, type: targetType, updatedAt: new Date().toISOString() } : r
          ),
          selectedIds: [],
        })),

      bulkAddTags: (ids, tagIds) =>
        set(state => {
          // Update tag counts
          const recordingsToUpdate = state.recordings.filter(r => ids.includes(r.id))
          const tagUpdates = state.tags.map(tag => {
            if (tagIds.includes(tag.id)) {
              const countIncrease = recordingsToUpdate.filter(
                r => !(r.tags || []).includes(tag.id)
              ).length
              return { ...tag, count: tag.count + countIncrease }
            }
            return tag
          })

          return {
            tags: tagUpdates,
            recordings: state.recordings.map(r =>
              ids.includes(r.id) ? { ...r, tags: [...new Set([...(r.tags || []), ...tagIds])] } : r
            ),
            selectedIds: [],
          }
        }),

      bulkRemoveTags: (ids, tagIds) =>
        set(state => {
          // Update tag counts
          const recordingsToUpdate = state.recordings.filter(r => ids.includes(r.id))
          const tagUpdates = state.tags.map(tag => {
            if (tagIds.includes(tag.id)) {
              const countDecrease = recordingsToUpdate.filter(r =>
                (r.tags || []).includes(tag.id)
              ).length
              return { ...tag, count: Math.max(0, tag.count - countDecrease) }
            }
            return tag
          })

          return {
            tags: tagUpdates,
            recordings: state.recordings.map(r =>
              ids.includes(r.id)
                ? { ...r, tags: (r.tags || []).filter(t => !tagIds.includes(t)) }
                : r
            ),
            selectedIds: [],
          }
        }),

      // Archive Operations
      archiveRecordings: ids =>
        set(state => {
          const recordingsToArchive = state.recordings.filter(r => ids.includes(r.id))

          return {
            archivedRecordings: [
              ...recordingsToArchive.map(r => ({
                ...r,
                archivedAt: new Date().toISOString(),
              })),
              ...state.archivedRecordings,
            ],
            recordings: state.recordings.filter(r => !ids.includes(r.id)),
            selectedIds: [],
          }
        }),

      unarchiveRecording: id =>
        set(state => {
          const archivedRecording = state.archivedRecordings.find(r => r.id === id)
          if (!archivedRecording) return state

          return {
            recordings: [
              {
                ...archivedRecording,
                updatedAt: new Date().toISOString(),
                // Remove archivedAt property
                archivedAt: undefined,
              },
              ...state.recordings,
            ],
            archivedRecordings: state.archivedRecordings.filter(r => r.id !== id),
          }
        }),

      bulkUnarchive: ids =>
        set(state => {
          const recordingsToUnarchive = state.archivedRecordings.filter(r => ids.includes(r.id))

          return {
            recordings: [
              ...recordingsToUnarchive.map(r => ({
                ...r,
                updatedAt: new Date().toISOString(),
                archivedAt: undefined,
              })),
              ...state.recordings,
            ],
            archivedRecordings: state.archivedRecordings.filter(r => !ids.includes(r.id)),
          }
        }),

      deleteArchived: id =>
        set(state => ({
          archivedRecordings: state.archivedRecordings.filter(r => r.id !== id),
        })),

      bulkDeleteArchived: ids =>
        set(state => ({
          archivedRecordings: state.archivedRecordings.filter(r => !ids.includes(r.id)),
        })),

      // Advanced Search with Filters
      searchRecordings: (query, filters = {}) => {
        const { recordings } = get()
        const lowerQuery = query.toLowerCase()

        return recordings.filter(r => {
          // Text search
          const matchesQuery =
            !query ||
            (r.title && r.title.toLowerCase().includes(lowerQuery)) ||
            (r.transcript && r.transcript.toLowerCase().includes(lowerQuery)) ||
            (r.summary && (Array.isArray(r.summary) ? r.summary.join(' ') : String(r.summary)).toLowerCase().includes(lowerQuery))

          if (!matchesQuery) return false

          // Date range filter
          if (filters.dateRange) {
            const recordingDate = new Date(r.createdAt)
            const { start, end } = filters.dateRange
            if (start && recordingDate < start) return false
            if (end && recordingDate > end) return false
          }

          // Duration filter
          if (filters.duration) {
            const { min, max } = filters.duration
            if (min && r.duration < min) return false
            if (max && r.duration > max) return false
          }

          // Type filter
          if (filters.type && r.type !== filters.type) {
            return false
          }

          // Tag filter (must match ALL tags)
          if (filters.tags && filters.tags.length > 0) {
            const hasAllTags = filters.tags.every(tag => (r.tags || []).includes(tag))
            if (!hasAllTags) return false
          }

          return true
        })
      },

      // Sort Recordings
      sortRecordings: (sortBy, sortOrder = 'desc') => {
        const { recordings } = get()
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
      },

      // Phase 5: Advanced Features Actions

      // Speaker Diarization
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

      // Cross-Feature Integration: Link to Documents
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

      // Audio Editing
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

      // AI Enhancements
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

      // Analytics Helpers
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
          readingTime: Math.ceil((wordCount / 200) * 60), // 200 words per minute
          hasTranscript: transcript.length > 0,
          hasSpeakerSegments: (recording.speakerSegments || []).length > 0,
          linkedDocumentsCount: (recording.linkedDocuments || []).length,
          editCount: (recording.edits || []).length,
          enhancementCount: (recording.enhancements || []).length,
        }
      },

      // Import/Export Actions
      importRecordings: newRecordings => {
        const { recordings } = get()
        let importedCount = 0
        let skippedCount = 0
        let errorCount = 0

        const validatedRecordings = newRecordings
          .filter(rec => {
            // Basic validation
            if (!rec.title || !rec.transcript) {
              errorCount++
              return false
            }

            // Check for duplicates by content or ID
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

        // Word frequency
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

        // Recordings by day
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
          .slice(-7) // Last 7 days

        // Tag usage
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
    }),
    {
      name: 'glassy-voice-storage',
    }
  )
)
