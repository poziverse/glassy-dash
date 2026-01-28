import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import EditRecordingModal from './EditRecordingModal'
import { useVoiceStore } from '../../stores/voiceStore'

// Mock the store
vi.mock('../../stores/voiceStore', () => ({
  useVoiceStore: vi.fn(),
}))

// Mock UI Context
vi.mock('../../contexts/UIContext', () => ({
  useUI: () => ({ showToast: vi.fn() }),
}))

// Mock components
vi.mock('./MinimalPlaybackControls', () => ({
  default: () => <div>Controls</div>,
}))
vi.mock('./FormatToolbar', () => ({
  default: () => <div>Toolbar</div>,
}))
vi.mock('./TagPicker', () => ({
  default: () => <div>Tags</div>,
}))
vi.mock('./TranscriptSegmentEditor', () => ({
  default: () => <div>Segments</div>,
}))

describe('EditRecordingModal', () => {
  const mockRecording = {
    id: 'rec-1',
    title: 'Test Recording',
    transcript: 'Content',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    duration: 60,
    audioData: 'base64data',
  }

  const mockLoadRecordingForEdit = vi.fn()
  const mockClose = vi.fn()

  beforeEach(() => {
    useVoiceStore.mockReturnValue({
      recordings: [mockRecording],
      editRecording: vi.fn(),
      updateRecordingTags: vi.fn(),
      loadRecordingForEdit: mockLoadRecordingForEdit,
      getRecordingAudioUrl: vi.fn().mockResolvedValue('blob:test-url'),
    })

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders with accessibility attributes', async () => {
    render(<EditRecordingModal isOpen={true} recordingId="rec-1" onClose={mockClose} />)

    // Wait for the useEffect effects (audio load, focus)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
    })
  })

  it('focuses title input on open', async () => {
    render(<EditRecordingModal isOpen={true} recordingId="rec-1" onClose={mockClose} />)

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText('Recording Title'))
    })
  })

  it('calls loadRecordingForEdit when "Open in Studio" is clicked', async () => {
    render(<EditRecordingModal isOpen={true} recordingId="rec-1" onClose={mockClose} />)

    await waitFor(() => {
      expect(screen.getByText('Open in Studio')).toBeDefined()
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Open in Studio'))
    })

    expect(mockLoadRecordingForEdit).toHaveBeenCalledWith('rec-1')
    expect(mockClose).toHaveBeenCalled()
  })
})
