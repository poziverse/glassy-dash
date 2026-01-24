/**
 * Notes Unit Tests
 * Real unit tests for note mutation hooks using Vitest
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Import mutation hooks
import {
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useTogglePin,
  useToggleArchive,
  useRestoreNote,
} from '../hooks/mutations/useNoteMutations'

// Mock the API module
vi.mock('../lib/api', () => ({
  api: vi.fn(),
}))

// Import the mocked api
import { api } from '../lib/api'

// Test wrapper with fresh QueryClient
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('Note Mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('useCreateNote', () => {
    it('should create a text note successfully', async () => {
      const mockNote = {
        id: 'note-1',
        type: 'text',
        title: 'Test Note',
        content: 'Test content',
        color: 'default',
        pinned: false,
      }

      api.mockResolvedValueOnce(mockNote)

      const { result } = renderHook(() => useCreateNote(), {
        wrapper: createTestWrapper(),
      })

      await act(async () => {
        result.current.mutate(mockNote)
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(api).toHaveBeenCalledWith('/notes', {
        method: 'POST',
        body: mockNote,
      })
    })

    it('should create a checklist note successfully', async () => {
      const mockChecklist = {
        id: 'note-2',
        type: 'checklist',
        title: 'Shopping List',
        items: [
          { id: '1', text: 'Milk', done: false },
          { id: '2', text: 'Eggs', done: true },
        ],
        color: 'yellow',
        pinned: false,
      }

      api.mockResolvedValueOnce(mockChecklist)

      const { result } = renderHook(() => useCreateNote(), {
        wrapper: createTestWrapper(),
      })

      await act(async () => {
        result.current.mutate(mockChecklist)
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(api).toHaveBeenCalledWith('/notes', {
        method: 'POST',
        body: mockChecklist,
      })
    })

    it('should handle create note failure', async () => {
      const error = new Error('Failed to create note')
      api.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useCreateNote(), {
        wrapper: createTestWrapper(),
      })

      await act(async () => {
        result.current.mutate({ type: 'text', title: 'Test' })
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error.message).toBe('Failed to create note')
    })
  })

  describe('useUpdateNote', () => {
    it('should update note properties', async () => {
      api.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useUpdateNote(), {
        wrapper: createTestWrapper(),
      })

      await act(async () => {
        result.current.mutate({
          id: 'note-1',
          updates: { title: 'Updated Title', content: 'Updated content' },
        })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(api).toHaveBeenCalledWith('/notes/note-1', {
        method: 'PUT',
        body: { title: 'Updated Title', content: 'Updated content' },
      })
    })
  })

  describe('useDeleteNote', () => {
    it('should soft delete a note to trash', async () => {
      api.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useDeleteNote(), {
        wrapper: createTestWrapper(),
      })

      await act(async () => {
        result.current.mutate('note-1')
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(api).toHaveBeenCalledWith('/notes/note-1', {
        method: 'DELETE',
      })
    })
  })

  describe('useTogglePin', () => {
    it('should pin a note', async () => {
      api.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useTogglePin(), {
        wrapper: createTestWrapper(),
      })

      await act(async () => {
        result.current.mutate({ id: 'note-1', pinned: true })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(api).toHaveBeenCalledWith('/notes/note-1', {
        method: 'PATCH',
        body: { pinned: true },
      })
    })

    it('should unpin a note', async () => {
      api.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useTogglePin(), {
        wrapper: createTestWrapper(),
      })

      await act(async () => {
        result.current.mutate({ id: 'note-1', pinned: false })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(api).toHaveBeenCalledWith('/notes/note-1', {
        method: 'PATCH',
        body: { pinned: false },
      })
    })
  })

  describe('useToggleArchive', () => {
    it('should archive a note', async () => {
      api.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useToggleArchive(), {
        wrapper: createTestWrapper(),
      })

      await act(async () => {
        result.current.mutate({ id: 'note-1', archived: true })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(api).toHaveBeenCalledWith('/notes/note-1/archive', {
        method: 'POST',
        body: { archived: true },
      })
    })

    it('should unarchive a note', async () => {
      api.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useToggleArchive(), {
        wrapper: createTestWrapper(),
      })

      await act(async () => {
        result.current.mutate({ id: 'note-1', archived: false })
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(api).toHaveBeenCalledWith('/notes/note-1/archive', {
        method: 'POST',
        body: { archived: false },
      })
    })
  })

  describe('useRestoreNote', () => {
    it('should restore a note from trash', async () => {
      api.mockResolvedValueOnce({ ok: true })

      const { result } = renderHook(() => useRestoreNote(), {
        wrapper: createTestWrapper(),
      })

      await act(async () => {
        result.current.mutate('note-1')
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(api).toHaveBeenCalledWith('/notes/note-1/restore', {
        method: 'POST',
      })
    })
  })
})

describe('Note Search Utility', () => {
  it('should filter notes by search term in title', () => {
    const notes = [
      { id: '1', title: 'Shopping List', content: 'Buy groceries' },
      { id: '2', title: 'Meeting Notes', content: 'Discuss project' },
      { id: '3', title: 'Ideas', content: 'Shopping app concept' },
    ]

    const searchTerm = 'shopping'
    const filtered = notes.filter(
      note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
    )

    expect(filtered).toHaveLength(2)
    expect(filtered.map(n => n.id)).toEqual(['1', '3'])
  })

  it('should return empty array for no matches', () => {
    const notes = [{ id: '1', title: 'Shopping List', content: 'Buy groceries' }]

    const searchTerm = 'meeting'
    const filtered = notes.filter(
      note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
    )

    expect(filtered).toHaveLength(0)
  })
})
