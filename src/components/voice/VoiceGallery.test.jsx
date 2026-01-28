import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VoiceGallery from './VoiceGallery'
import { useVoiceStore } from '../../stores/voiceStore'

// Mock the store
vi.mock('../../stores/voiceStore', () => ({
  useVoiceStore: vi.fn(),
}))

// Mock child components to avoid deep rendering issues
vi.mock('./EditRecordingModal', () => ({
  default: ({ isOpen, onClose }) =>
    isOpen ? (
      <div data-testid="edit-modal">
        Edit Modal <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}))

vi.mock('./ImportButton', () => ({
  default: () => <button>Import</button>,
}))

vi.mock('./ImportDialog', () => ({
  default: () => null,
}))

describe('VoiceGallery Integration', () => {
  beforeEach(() => {
    useVoiceStore.mockReturnValue({
      recordings: [
        {
          id: 'rec-1',
          title: 'Test Recording',
          transcript: 'Test transcription content',
          createdAt: new Date().toISOString(),
          duration: 60,
          type: 'notes',
        },
      ],
      searchRecordings: vi.fn(term => [
        {
          id: 'rec-1',
          title: 'Test Recording',
          transcript: 'Test transcription content',
          createdAt: new Date().toISOString(),
          duration: 60,
          type: 'notes',
        },
      ]),
      deleteRecording: vi.fn(),
      editRecording: vi.fn(),
      loadRecordingForEdit: vi.fn(),
      importRecordings: vi.fn(),
    })
  })

  it('renders recordings from the store', () => {
    render(<VoiceGallery />)
    expect(screen.getByText('Test Recording')).toBeDefined()
  })

  it('opens edit modal when Edit button is clicked', () => {
    render(<VoiceGallery />)

    // Modal should not be visible initially
    expect(screen.queryByTestId('edit-modal')).toBeNull()

    // Find and click the edit button
    // Note: The edit button has title="Edit"
    const editButtons = screen.getAllByTitle('Edit')
    fireEvent.click(editButtons[0])

    // Modal should be visible now
    expect(screen.getByTestId('edit-modal')).toBeDefined()
  })

  it('closes edit modal when close is clicked', () => {
    render(<VoiceGallery />)

    // Open modal
    const editButtons = screen.getAllByTitle('Edit')
    fireEvent.click(editButtons[0])

    // Close modal
    fireEvent.click(screen.getByText('Close'))

    // Modal should be gone
    expect(screen.queryByTestId('edit-modal')).toBeNull()
  })
})
