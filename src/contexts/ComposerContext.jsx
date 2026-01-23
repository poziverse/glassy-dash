import React, { createContext, useCallback, useContext, useRef } from 'react'
import { useNotes } from './NotesContext'
import { useComposerStore } from '../stores/composerStore'
import { uid, runFormat, fileToCompressedDataURL, handleSmartEnter } from '../utils/helpers'

export const ComposerContext = createContext()

/**
 * ComposerProvider Component
 * Manages the state of the note composer for creating new notes
 * Now bridged to useComposerStore for better persistence and stability.
 */
export function ComposerProvider({ children }) {
  const { createNote, isOnline } = useNotes()

  // Connect to Zustand store
  const {
    composerType: type,
    setComposerType: setType,
    composerTitle: title,
    setComposerTitle: setTitle,
    composerContent: content,
    setComposerContent: setContent,
    composerTags: tags,
    setComposerTags: setTags,
    composerColor: color,
    setComposerColor: setColor,
    composerImages: images,
    setComposerImages: setImages,
    collapsed,
    setCollapsed,
    composerItems: clItems,
    setComposerItems: setClItems,
    clInput,
    setClInput,
    composerDrawingData: drawingData,
    setComposerDrawingData: setDrawingData,
    showFormatting,
    setShowFormatting,
    showColorPicker,
    setShowColorPicker,
    resetComposer: resetStore,
  } = useComposerStore()

  // Refs
  const titleRef = useRef(null)
  const contentRef = useRef(null)
  const fileInputRef = useRef(null)
  const fmtBtnRef = useRef(null)
  const colorBtnRef = useRef(null)

  const reset = useCallback(() => {
    resetStore()
    if (contentRef.current) contentRef.current.style.height = 'auto'
  }, [resetStore])

  const addChecklistItem = useCallback(() => {
    if (!clInput.trim()) return
    const newItem = {
      id: uid(),
      text: clInput.trim(),
      done: false,
    }
    setClItems([...clItems, newItem])
    setClInput('')
  }, [clInput, clItems, setClItems, setClInput])

  const save = useCallback(async () => {
    if (!isOnline) return

    const isText = type === 'text'
    const isChecklist = type === 'checklist'
    const isDraw = type === 'draw'

    // Validation
    if (isText) {
      if (!title.trim() && !content.trim() && !tags.trim() && images.length === 0) return
    } else if (isChecklist) {
      if (!title.trim() && clItems.length === 0) return
    } else if (isDraw) {
      const drawPaths = Array.isArray(drawingData) ? drawingData : drawingData?.paths || []
      if (!title.trim() && drawPaths.length === 0) return
    }

    const nowIso = new Date().toISOString()
    const newNote = {
      id: uid(),
      type: type,
      title: title.trim(),
      content: isText ? content : isDraw ? JSON.stringify(drawingData) : '',
      items: isChecklist ? clItems : [],
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
      images: images,
      color: color,
      pinned: false,
      position: Date.now(),
      timestamp: nowIso,
      updated_at: nowIso,
    }

    try {
      await createNote(newNote)
      reset()
    } catch (e) {
      alert(e.message || 'Failed to add note')
    }
  }, [isOnline, type, title, content, tags, images, clItems, drawingData, color, createNote, reset])

  const onKeyDown = useCallback(
    e => {
      // Ctrl+Enter or Cmd+Enter to save
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        save()
        return
      }

      // Smart Enter
      if (e.key !== 'Enter' || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return
      const el = contentRef.current
      if (!el) return
      const value = content
      const start = el.selectionStart ?? value.length
      const end = el.selectionEnd ?? value.length
      const res = handleSmartEnter(value, start, end)
      if (res) {
        e.preventDefault()
        setContent(res.text)
        requestAnimationFrame(() => {
          try {
            el.setSelectionRange(res.range[0], res.range[1])
          } catch (e) {}
          if (el) {
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
          }
        })
      }
    },
    [content, setContent, save]
  )

  const format = useCallback(
    t => {
      runFormat(() => content, setContent, contentRef, t)
    },
    [content, setContent]
  )

  const handleImageUpload = useCallback(
    async files => {
      const results = []
      for (const f of files) {
        try {
          const src = await fileToCompressedDataURL(f)
          results.push({ id: uid(), src, name: f.name })
        } catch (e) {}
      }
      if (results.length) setImages([...images, ...results])
    },
    [images, setImages]
  )

  const removeImage = useCallback(
    id => {
      setImages(images.filter(im => im.id !== id))
    },
    [images, setImages]
  )

  const value = {
    // State
    type,
    setType,
    title,
    setTitle,
    content,
    setContent,
    tags,
    setTags,
    color,
    setColor,
    images,
    setImages,
    collapsed,
    setCollapsed,
    clItems,
    setClItems,
    clInput,
    setClInput,
    drawingData,
    setDrawingData,
    showFormatting,
    setShowFormatting,
    showColorPicker,
    setShowColorPicker,

    // Refs
    titleRef,
    contentRef,
    fileInputRef,
    fmtBtnRef,
    colorBtnRef,

    // Actions
    reset,
    addChecklistItem,
    onKeyDown,
    format,
    handleImageUpload,
    removeImage,
    save,
  }

  return <ComposerContext.Provider value={value}>{children}</ComposerContext.Provider>
}

export function useComposer() {
  const context = useContext(ComposerContext)
  if (!context) {
    throw new Error('useComposer must be used within ComposerProvider')
  }
  return context
}
