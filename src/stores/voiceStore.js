import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useVoiceStore = create(
  persist(
    (set, get) => ({
      // Data
      recordings: [],
      activeRecordingId: null,

      // UI State
      studioCollapsed: false,
      recordingState: 'idle', // idle, recording, paused, processing, reviewing

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
          recordingState: 'idle',
          recordingStartTime: null,
        })
      },

      pauseRecording: () => {
        set({ recordingState: 'paused' })
      },

      resumeRecording: () => {
        set({ recordingState: 'recording' })
      },

      setTranscript: (transcript) => set(state => {
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
          historyIndex: newHistory.length - 1
        }
      }),

      // Undo/Redo Actions
      undoTranscript: () => set(state => {
        if (state.historyIndex > 0) {
          return {
            historyIndex: state.historyIndex - 1,
            currentTranscript: state.transcriptHistory[state.historyIndex - 1]
          }
        }
        return state
      }),

      redoTranscript: () => set(state => {
        if (state.historyIndex < state.transcriptHistory.length - 1) {
          return {
            historyIndex: state.historyIndex + 1,
            currentTranscript: state.transcriptHistory[state.historyIndex + 1]
          }
        }
        return state
      }),

      clearTranscriptHistory: () => set({ transcriptHistory: [], historyIndex: -1 }),

      setSummary: (summary) => set({ currentSummary: summary }),

      setAudioData: (audioData) => set({ currentAudio: audioData }),

      setRecordingDuration: (duration) => set({ recordingDuration: duration }),

      setError: (error) => set({ error }),

      saveRecording: (type, metadata = {}) => {
        const { recordings, currentTranscript, currentSummary, currentAudio, recordingStartTime } = get()

        const newRecording = {
          id: crypto.randomUUID(),
          title: metadata.title || `Voice Note ${recordings.length + 1}`,
          transcript: currentTranscript,
          summary: currentSummary,
          audioData: currentAudio,
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

      deleteRecording: (id) => {
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

      loadRecordingForEdit: (id) => {
        const recording = get().recordings.find(r => r.id === id)
        if (recording) {
          set({
            activeRecordingId: id,
            currentTranscript: recording.transcript,
            currentSummary: recording.summary,
            currentAudio: recording.audioData,
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

      setStudioCollapsed: (collapsed) => set({ studioCollapsed: collapsed }),

      // Utility actions
      searchRecordings: (query) => {
        const { recordings } = get()
        const lowerQuery = query.toLowerCase()
        return recordings.filter(r =>
          r.title.toLowerCase().includes(lowerQuery) ||
          r.transcript.toLowerCase().includes(lowerQuery) ||
          r.summary.toLowerCase().includes(lowerQuery)
        )
      },
    }),
    {
      name: 'glassy-voice-storage',
    }
  )
)