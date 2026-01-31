import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useDocsStore } from '../src/stores/docsStore'

// Mock fetch to avoid actual API calls
global.fetch = vi.fn()

describe('useDocsStore', () => {
  const initialState = useDocsStore.getState()

  beforeEach(() => {
    // Reset state - manually reset data fields without using replace mode
    useDocsStore.setState({
      docs: [],
      trash: [],
      activeDocId: null,
      loading: false,
      error: null,
    })
    // Clear fetch mocks
    global.fetch.mockClear()
    // Mock successful API responses - return empty array for list endpoints
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
  })

  it('should start with empty docs', () => {
    const { result } = renderHook(() => useDocsStore())
    expect(result.current.docs).toEqual([])
  })

  it('should create a new document', async () => {
    const { result } = renderHook(() => useDocsStore())

    const newId = crypto.randomUUID()

    // Mock the POST request
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    // Mock the reload after create (GET request)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: newId, title: 'Untitled Document', content: '' }]),
    })

    let returnedId
    await act(async () => {
      returnedId = await result.current.createDoc()
    })

    // After reload, doc should be in array
    expect(result.current.docs.length).toBe(1)
    expect(result.current.docs[0].id).toBe(newId)
    // Create no longer auto-opens document (UX fix)
    expect(result.current.activeDocId).toBeNull()
  })

  it('should update a document', async () => {
    const { result } = renderHook(() => useDocsStore())

    // Mock the POST request for createDoc
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    // Mock the reload after create
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 'test-id', title: 'Untitled Document', content: '' }]),
    })

    const id = 'test-id'
    await act(async () => {
      await result.current.createDoc()
    })

    // Mock the PUT request
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    await act(async () => {
      await result.current.updateDoc(id, { title: 'New Title', content: 'New Content' })
    })

    const updatedDoc = result.current.docs.find(d => d.id === id)
    expect(updatedDoc).toBeDefined()
    expect(updatedDoc.title).toBe('New Title')
    expect(updatedDoc.content).toBe('New Content')
  })

  it('should soft-delete a document', async () => {
    const { result } = renderHook(() => useDocsStore())

    // Mock the POST request for createDoc
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    // Mock the reload after create
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 'test-id', title: 'Untitled Document', content: '' }]),
    })

    const id = 'test-id'
    await act(async () => {
      await result.current.createDoc()
    })

    // Mock the DELETE request
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    // Mock the reload after delete
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })

    await act(async () => {
      await result.current.deleteDoc(id)
    })

    // Soft-delete removes from docs array (moves to trash)
    expect(result.current.docs.length).toBe(0)
    expect(result.current.docs.find(d => d.id === id)).toBeUndefined()
    expect(result.current.activeDocId).toBeNull()
  })

  it('should permanently delete a document', async () => {
    const { result } = renderHook(() => useDocsStore())

    const id = 'test-id'

    // Mock for DELETE request for permanent delete
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    // Mock for trash reload after permanent delete
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })

    await act(async () => {
      await result.current.permanentDeleteDoc(id)
    })

    // permanentDeleteDoc should complete without error
    expect(result.current.error).toBeNull()
  })

  it('should restore a soft-deleted document', async () => {
    const { result } = renderHook(() => useDocsStore())

    // Mock for POST request for restore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    // Mock for reloads after restore
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 'test-id', title: 'Restored Doc' }]),
    })
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })

    const id = 'test-id'

    await act(async () => {
      await result.current.restoreDoc(id)
    })

    // Restore should complete without error
    expect(result.current.error).toBeNull()
  })
})
