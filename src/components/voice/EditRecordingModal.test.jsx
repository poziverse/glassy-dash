import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import EditRecordingModal from './EditRecordingModal'
import { useVoiceStore } from '../../stores/voiceStore'
import { renderWithProviders } from '../../../tests/test-utils.jsx'

// Mock the store
vi.mock('../../stores/voiceStore', () => ({
  useVoiceStore: vi.fn(),
}))

// Mock UI Context
vi.mock('../../contexts/UIContext', () => ({
  useUI: () => ({ showToast: vi.fn() }),
}))

// Mock components - match actual imports from component
vi.mock('./PlaybackControls', () => ({
  default: ({ audioUrl }) => <div data-testid="playback-controls">Audio: {audioUrl}</div>,
}))
vi.mock('./FormatToolbar', () => ({
  default: () => <div data-testid="format-toolbar">Toolbar</div>,
}))
vi.mock('./TagPicker', () => ({
  default: ({ selectedTags }) => <div data-testid="tag-picker">Tags: {selectedTags?.length}</div>,
}))
vi.mock('./TranscriptSegmentEditor', () => ({
  default: () => <div data-testid="segment-editor">Segments</div>,
}))
vi.mock('./ExportSaveModal', () => ({
  default: ({ recording, onClose, onSave }) => (
    <div data-testid="export-modal">
      Export Modal
      <button onClick={onClose}>Close</button>
      <button onClick={onSave}>Save</button>
    </div>
  ),
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
    renderWithProviders(<EditRecordingModal isOpen={true} recordingId="rec-1" onClose={mockClose} />)

    // Wait for the useEffect effects (audio load, focus)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
    })
  })

  it('focuses title input on open', async () => {
    renderWithProviders(<EditRecordingModal isOpen={true} recordingId="rec-1" onClose={mockClose} />)

    await waitFor(() => {
      const titleInput = screen.getByRole('textbox', { name: /title/i })
      expect(titleInput).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('calls loadRecordingForEdit when "Open in Studio" is clicked', async () => {
    renderWithProviders(<EditRecordingModal isOpen={true} recordingId="rec-1" onClose={mockClose} />)

    await waitFor(() => {
      expect(screen.getByText('Open in Studio')).toBeDefined()
    }, { timeout: 3000 })

    await act(async () => {
      fireEvent.click(screen.getByText('Open in Studio'))
    })

    expect(mockLoadRecordingForEdit).toHaveBeenCalledWith('rec-1')
    expect(mockClose).toHaveBeenCalled()
  })
})
