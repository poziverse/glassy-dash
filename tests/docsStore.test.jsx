import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDocsStore } from '../src/stores/docsStore'

describe('useDocsStore', () => {
  const initialState = useDocsStore.getState()

  beforeEach(() => {
    useDocsStore.setState(initialState, true)
  })

  it('should start with empty docs', () => {
    const { result } = renderHook(() => useDocsStore())
    expect(result.current.docs).toEqual([])
  })

  it('should create a new document', () => {
    const { result } = renderHook(() => useDocsStore())

    let newId
    act(() => {
      newId = result.current.createDoc()
    })

    expect(result.current.docs.length).toBe(1)
    expect(result.current.docs[0].id).toBe(newId)
    // Create no longer auto-opens document (UX fix)
    expect(result.current.activeDocId).toBeNull()
  })

  it('should update a document', () => {
    const { result } = renderHook(() => useDocsStore())

    let id
    act(() => {
      id = result.current.createDoc()
    })

    act(() => {
      result.current.updateDoc(id, { title: 'New Title', content: 'New Content' })
    })

    expect(result.current.docs[0].title).toBe('New Title')
    expect(result.current.docs[0].content).toBe('New Content')
  })

  it('should soft-delete a document', () => {
    const { result } = renderHook(() => useDocsStore())

    let id
    act(() => {
      id = result.current.createDoc()
    })

    act(() => {
      result.current.deleteDoc(id)
    })

    // Soft-delete doesn't remove from docs array, just marks as deleted
    expect(result.current.docs.length).toBe(1)
    expect(result.current.docs[0].deletedAt).not.toBeNull()
    expect(result.current.activeDocId).toBeNull()
  })

  it('should permanently delete a document', () => {
    const { result } = renderHook(() => useDocsStore())

    let id
    act(() => {
      id = result.current.createDoc()
    })

    act(() => {
      result.current.permanentDeleteDoc(id)
    })

    expect(result.current.docs.length).toBe(0)
    expect(result.current.activeDocId).toBeNull()
  })

  it('should restore a soft-deleted document', () => {
    const { result } = renderHook(() => useDocsStore())

    let id
    act(() => {
      id = result.current.createDoc()
    })

    act(() => {
      result.current.deleteDoc(id)
    })

    expect(result.current.docs[0].deletedAt).not.toBeNull()

    act(() => {
      result.current.restoreDoc(id)
    })

    expect(result.current.docs[0].deletedAt).toBeNull()
  })
})
