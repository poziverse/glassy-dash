import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import RecordingStudio from '../src/components/voice/RecordingStudio'
import { useVoiceStore } from '../src/stores/voiceStore'
import { useNotesCompat } from '../src/hooks/useNotesCompat'

// Mock stores and hooks
vi.mock('../src/stores/voiceStore')
vi.mock('../src/hooks/useNotesCompat')

describe('RecordingStudio Component', () => {
  const mockStore = {
    studioCollapsed: false,
    recordingState: 'idle',
    currentTranscript: '',
    currentSummary: '',
    currentAudio: null,
    recordingDuration: 0,
    error: null,
    transcriptHistory: [],
    historyIndex: -1,
    recordings: [],
    activeRecordingId: null,
    setStudioCollapsed: vi.fn(),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    pauseRecording: vi.fn(),
    resumeRecording: vi.fn(),
    setTranscript: vi.fn(),
    undoTranscript: vi.fn(),
    redoTranscript: vi.fn(),
    setSummary: vi.fn(),
    saveRecording: vi.fn(),
    clearActiveRecording: vi.fn(),
    setError: vi.fn(),
    setAudioData: vi.fn(),
    setRecordingDuration: vi.fn(),
    setRecordingState: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useVoiceStore.mockReturnValue(mockStore)
    useNotesCompat.mockReturnValue({ createNote: vi.fn() })
  })

  it('renders correctly in idle state', () => {
    render(<RecordingStudio />)
    expect(screen.getByText('Voice Recorder')).toBeDefined()
    // Check if Mic button is present (it doesn't have text, but is a button)
    const startButton = screen.getByRole('button', { name: '' }) // Mic button has no name in the code
    expect(startButton).toBeDefined()
  })

  it('toggles collapse/expand', () => {
    render(<RecordingStudio />)
    const toggleButton = screen.getByText('Voice Recorder')
    fireEvent.click(toggleButton)
    expect(mockStore.setStudioCollapsed).toHaveBeenCalled()
  })

  it('shows timer when recording', () => {
    useVoiceStore.mockReturnValue({
      ...mockStore,
      recordingState: 'recording',
    })
    render(<RecordingStudio />)
    // Timer is formatted as 00:00 initially
    expect(screen.getByText('00:00')).toBeDefined()
  })

  it('shows transcript and summary in reviewing state', () => {
    useVoiceStore.mockReturnValue({
      ...mockStore,
      recordingState: 'reviewing',
      currentTranscript: 'Hello world',
      currentSummary: 'Greeting',
      currentAudio: 'base64audio',
    })
    render(<RecordingStudio />)
    expect(screen.getByDisplayValue('Hello world')).toBeDefined()
    expect(screen.getByDisplayValue('Greeting')).toBeDefined()
  })
})
