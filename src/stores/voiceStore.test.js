import { describe, it, expect, beforeEach } from 'vitest'
import { useVoiceStore } from './voiceStore'

// Mock crypto.randomUUID if not available in the test environment
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  }
}

describe('voiceStore - importRecordings', () => {
  beforeEach(() => {
    // Reset the store state before each test
    // Use clearActiveRecording or similar if available, or just reset recordings
    useVoiceStore.setState({ recordings: [] })
  })

  it('should import valid recordings', () => {
    const mockRecordings = [
      { id: '1', title: 'Test 1', transcript: 'Transcript 1' },
      { id: '2', title: 'Test 2', transcript: 'Transcript 2' },
    ]

    const results = useVoiceStore.getState().importRecordings(mockRecordings)

    expect(results.importedCount).toBe(2)
    expect(results.skippedCount).toBe(0)
    expect(results.errorCount).toBe(0)

    const state = useVoiceStore.getState()
    expect(state.recordings).toHaveLength(2)
    expect(state.recordings[0].title).toBe('Test 1')
    expect(state.recordings[1].title).toBe('Test 2')
  })

  it('should reject invalid recordings', () => {
    const mockRecordings = [
      { id: '1', title: '', transcript: 'Only transcript' },
      { id: '2', title: 'Only title', transcript: '' },
      { id: '3', title: 'Valid', transcript: 'Valid' },
    ]

    const results = useVoiceStore.getState().importRecordings(mockRecordings)

    expect(results.importedCount).toBe(1)
    expect(results.errorCount).toBe(2)

    const state = useVoiceStore.getState()
    expect(state.recordings).toHaveLength(1)
    expect(state.recordings[0].title).toBe('Valid')
  })

  it('should skip duplicate recordings by ID', () => {
    // Initial state
    useVoiceStore.setState({
      recordings: [{ id: 'dup-id', title: 'Existing', transcript: 'Existing content' }],
    })

    const mockRecordings = [
      { id: 'dup-id', title: 'Duplicate ID', transcript: 'Different content' },
      { id: 'new-id', title: 'New', transcript: 'New content' },
    ]

    const results = useVoiceStore.getState().importRecordings(mockRecordings)

    expect(results.importedCount).toBe(1)
    expect(results.skippedCount).toBe(1)

    const state = useVoiceStore.getState()
    expect(state.recordings).toHaveLength(2)
  })

  it('should skip duplicate recordings by content (title + transcript)', () => {
    // Initial state
    useVoiceStore.setState({
      recordings: [{ id: '1', title: 'Same Title', transcript: 'Same Content' }],
    })

    const mockRecordings = [
      { id: 'new-uuid', title: 'Same Title', transcript: 'Same Content' },
      { id: 'another-uuid', title: 'Unique Title', transcript: 'Unique Content' },
    ]

    const results = useVoiceStore.getState().importRecordings(mockRecordings)

    expect(results.importedCount).toBe(1)
    expect(results.skippedCount).toBe(1)

    const state = useVoiceStore.getState()
    expect(state.recordings).toHaveLength(2)
  })

  it('should add "imported" tag to imported recordings', () => {
    const mockRecordings = [{ id: '1', title: 'Test', transcript: 'Content', tags: ['custom'] }]

    useVoiceStore.getState().importRecordings(mockRecordings)

    const state = useVoiceStore.getState()
    expect(state.recordings[0].tags).toContain('imported')
    expect(state.recordings[0].tags).toContain('custom')
  })
})
