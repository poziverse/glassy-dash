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
    expect(result.current.activeDocId).toBe(newId)
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

  it('should delete a document', () => {
    const { result } = renderHook(() => useDocsStore())

    let id
    act(() => {
      id = result.current.createDoc()
    })

    act(() => {
      result.current.deleteDoc(id)
    })

    expect(result.current.docs.length).toBe(0)
    expect(result.current.activeDocId).toBeNull()
  })
})
