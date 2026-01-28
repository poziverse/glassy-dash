import React, { createContext, useCallback, useContext, useRef, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useNotes } from './NotesContext'
import { useUI } from './UIContext'
import { useModalStore } from '../stores/modalStore'
import { api } from '../lib/api'
import {
  uid,
  runFormat,
  downloadText,
  mdForDownload,
  sanitizeFilename,
  fileToCompressedDataURL,
  handleSmartEnter,
} from '../utils/helpers'

export const ModalContext = createContext()

/**
 * ModalProvider Component
 * Manages the state and logic for the note editor modal
 * Now bridged to useModalStore for stability and better state synchronization.
 */
export function ModalProvider({ children }) {
  const { token, currentUser } = useAuth()
  const { updateNote, deleteNote } = useNotes()
  const { showToast } = useUI()

  // Connect to Zustand store
  const {
    open,
    activeId,
    activeNoteObj,
    mType,
    setMType,
    mTitle,
    setMTitle,
    mBody,
    setMBody,
    mTagList,
    setMTagList,
    mColor,
    setMColor,
    mTransparency,
    setMTransparency,
    mImages,
    setMImages,
    mItems,
    setMItems,
    mInput,
    setMInput,
    mDrawingData,
    setMDrawingData,
    viewMode,
    setViewMode,
    showModalFmt,
    setShowModalFmt,
    modalMenuOpen,
    setModalMenuOpen,
    showModalColorPop,
    setShowModalColorPop,
    showModalTransPop,
    setShowModalTransPop,
    imgViewOpen,
    setImgViewOpen,
    mImagesViewIndex,
    setMImagesViewIndex,
    tagInput,
    setTagInput,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    isSaving,
    setSaving: setIsSaving,
    checklistDragId,
    setChecklistDragId,
    modalHasChanges,
    setModalHasChanges,
    originalValues,
    collaborationModalOpen,
    setCollaborationModalOpen,
    collaboratorUsername,
    setCollaboratorUsername,
    showUserDropdown,
    setShowUserDropdown,
    filteredUsers,
    setFilteredUsers,
    addModalCollaborators,
    setAddModalCollaborators,
    loadingUsers,
    setLoadingUsers,
    dropdownPosition,
    setDropdownPosition,
    openNote: openNoteStore,
    closeNote: closeNoteStore,
  } = useModalStore()

  // --- Refs ---
  const modalScrollRef = useRef(null)
  const modalFmtBtnRef = useRef(null)
  const modalMenuBtnRef = useRef(null)
  const modalColorBtnRef = useRef(null)
  const modalTransBtnRef = useRef(null)
  const modalFileRef = useRef(null)
  const mBodyRef = useRef(null)
  const noteViewRef = useRef(null)
  const collaboratorInputRef = useRef(null)
  const scrimClickStartRef = useRef(null)

  const resizeModalTextarea = useCallback(() => {
    if (mBodyRef.current) {
      mBodyRef.current.style.height = 'auto'
      mBodyRef.current.style.height = mBodyRef.current.scrollHeight + 'px'
    }
  }, [])

  // Detect changes when modal values change
  useEffect(() => {
    if (!open) {
      setModalHasChanges(false)
      return
    }

    const hasChanges =
      originalValues.title !== mTitle ||
      originalValues.body !== mBody ||
      JSON.stringify(originalValues.tags) !== JSON.stringify(mTagList) ||
      originalValues.color !== mColor ||
      originalValues.transparency !== mTransparency ||
      JSON.stringify(originalValues.images) !== JSON.stringify(mImages) ||
      JSON.stringify(originalValues.items) !== JSON.stringify(mItems) ||
      JSON.stringify(originalValues.drawingData) !== JSON.stringify(mDrawingData)

    setModalHasChanges(hasChanges)
  }, [
    mTitle,
    mBody,
    mTagList,
    mColor,
    mTransparency,
    mImages,
    mItems,
    mDrawingData,
    open,
    originalValues,
    setModalHasChanges,
  ])

  const openNote = useCallback(
    async noteData => {
      openNoteStore(noteData)

      // Fetch collaborators
      try {
        const collaborators = await api(`/notes/${noteData.id}/collaborators`, { token })
        setAddModalCollaborators(collaborators || [])
      } catch (e) {
        console.error('Failed to load collaborators:', e)
      }
    },
    [openNoteStore, token, setAddModalCollaborators]
  )

  const saveModal = useCallback(async () => {
    if (!activeId || isSaving) return
    const base = {
      id: activeId,
      title: mTitle.trim(),
      tags: mTagList,
      images: mImages,
      color: mColor,
      transparency: mTransparency,
      pinned: !!activeNoteObj?.pinned,
    }
    const payload =
      mType === 'text'
        ? { ...base, type: 'text', content: mBody, items: [] }
        : mType === 'checklist'
          ? { ...base, type: 'checklist', content: '', items: mItems }
          : mType === 'youtube' || mType === 'music'
            ? { ...base, type: mType, content: mBody, items: [] }
            : { ...base, type: 'draw', content: JSON.stringify(mDrawingData), items: [] }

    try {
      setIsSaving(true)
      await updateNote(activeId, payload)
      closeNoteStore() // Force close after successful save
    } catch (_e) {
      showToast('Could not save your changes. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }, [
    activeId,
    activeNoteObj,
    isSaving,
    mTitle,
    mTagList,
    mImages,
    mColor,
    mTransparency,
    mType,
    mBody,
    mItems,
    mDrawingData,
    updateNote,
    closeNoteStore,
    showToast,
    setIsSaving,
  ])

  const closeModal = useCallback(() => {
    // Autosave on close if there are changes
    const { modalHasChanges } = useModalStore.getState()
    if (modalHasChanges && !isSaving) {
      saveModal()
    } else {
      closeNoteStore()
    }
  }, [closeNoteStore, isSaving, saveModal])

  const deleteModal = useCallback(async () => {
    if (!activeId) return
    try {
      const note = activeNoteObj
      if (note && note.user_id && currentUser?.id && note.user_id !== currentUser.id) {
        showToast("You can't delete this note as you don't own it", 'error')
        return
      }
      await deleteNote(activeId)
      closeModal()
      showToast('Note deleted successfully', 'success')
    } catch (_e) {
      showToast('Could not delete this note. Please try again.', 'error')
    }
  }, [activeId, activeNoteObj, currentUser, deleteNote, closeModal, showToast])

  const formatModal = useCallback(
    (type, payload) => {
      // Handle Icon Insertion
      if (type === 'icon' && payload) {
        const el = mBodyRef.current
        if (!el) return

        const val = mBody || '' // Ensure string
        const start = el.selectionStart ?? val.length
        const end = el.selectionEnd ?? val.length

        // Construct markdown image
        // ![icon:star](/api/icons/lucide/star.svg)
        const textToInsert = `![icon:${payload}](/api/icons/lucide/${payload}.svg)`

        const newText = val.slice(0, start) + textToInsert + val.slice(end)
        setMBody(newText)

        // Use setTimeout to ensure state update has flushed to DOM
        setTimeout(() => {
          if (el) {
            el.focus()
            // Move cursor after inserted image
            const newPos = start + textToInsert.length
            el.setSelectionRange(newPos, newPos)
          }
        }, 0)
        return
      }

      const result = runFormat(() => mBody, setMBody, mBodyRef, type)
      if (result && typeof result === 'object' && result.text !== undefined) {
        setMBody(result.text)
      }
    },
    [mBody, setMBody]
  )

  const handleDownloadNote = useCallback(() => {
    if (!activeNoteObj) return
    const filename = sanitizeFilename(mTitle || 'note') + '.md'
    const contentText = mdForDownload({
      ...activeNoteObj,
      title: mTitle,
      content: mBody,
      tags: mTagList,
      items: mItems,
    })
    downloadText(filename, contentText)
  }, [activeNoteObj, mTitle, mBody, mTagList, mItems])

  const addTags = useCallback(
    raw => {
      const parts = raw
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      setMTagList(prev => {
        const set = new Set(prev.map(x => x.toLowerCase()))
        const merged = [...prev]
        for (const p of parts) {
          if (!set.has(p.toLowerCase())) {
            merged.push(p)
            set.add(p.toLowerCase())
          }
        }
        return merged
      })
    },
    [setMTagList]
  )

  const handleTagKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
        e.preventDefault()
        if (tagInput.trim()) {
          addTags(tagInput)
          setTagInput('')
        }
      } else if (e.key === 'Backspace' && !tagInput) {
        setMTagList(mTagList.slice(0, -1))
      }
    },
    [tagInput, addTags, mTagList, setMTagList, setTagInput]
  )

  const handleTagBlur = useCallback(() => {
    if (tagInput.trim()) {
      addTags(tagInput)
      setTagInput('')
    }
  }, [tagInput, addTags, setTagInput])

  const handleTagPaste = useCallback(
    e => {
      const text = e.clipboardData?.getData('text')
      if (text && text.includes(',')) {
        e.preventDefault()
        addTags(text)
      }
    },
    [addTags]
  )

  const onModalBodyClick = useCallback(
    e => {
      if (!(viewMode === 'view' && mType === 'text')) return
      const a = e.target.closest('a')
      if (a) {
        const href = a.getAttribute('href') || ''
        if (/^(https?:|mailto:|tel:)/i.test(href)) {
          e.preventDefault()
          e.stopPropagation()
          window.open(href, '_blank', 'noopener,noreferrer')
        }
        return
      }
      setViewMode('edit')
      setTimeout(() => {
        if (mBodyRef.current) {
          mBodyRef.current.focus()
          resizeModalTextarea()
        }
      }, 0)
    },
    [viewMode, mType, setViewMode, resizeModalTextarea]
  )

  const addCollaborator = useCallback(
    async username => {
      if (!activeId) return
      try {
        const res = await api(`/notes/${activeId}/collaborate`, {
          method: 'POST',
          token,
          body: { username },
        })
        setAddModalCollaborators([...addModalCollaborators, res.collaborator])
        setCollaboratorUsername('')
        setShowUserDropdown(false)
        showToast(res.message, 'success')
      } catch (e) {
        showToast(e.message || 'Failed to add collaborator', 'error')
      }
    },
    [
      activeId,
      token,
      addModalCollaborators,
      setAddModalCollaborators,
      setCollaboratorUsername,
      setShowUserDropdown,
      showToast,
    ]
  )

  const removeCollaborator = useCallback(
    async userId => {
      if (!activeId) return
      try {
        await api(`/notes/${activeId}/collaborate/${userId}`, { method: 'DELETE', token })
        setAddModalCollaborators(addModalCollaborators.filter(c => c.id !== userId))
        showToast('Collaborator removed', 'success')
      } catch (_e) {
        showToast('Failed to remove collaborator', 'error')
      }
    },
    [activeId, token, addModalCollaborators, setAddModalCollaborators, showToast]
  )

  const openImageViewer = useCallback(
    index => {
      setMImagesViewIndex(index)
      setImgViewOpen(true)
    },
    [setMImagesViewIndex, setImgViewOpen]
  )

  const closeImageViewer = useCallback(() => setImgViewOpen(false), [setImgViewOpen])

  const nextImage = useCallback(() => {
    setMImagesViewIndex((mImagesViewIndex + 1) % mImages.length)
  }, [mImagesViewIndex, mImages.length, setMImagesViewIndex])

  const prevImage = useCallback(() => {
    setMImagesViewIndex((mImagesViewIndex - 1 + mImages.length) % mImages.length)
  }, [mImagesViewIndex, mImages.length, setMImagesViewIndex])

  const addImagesToModal = useCallback(
    async fileList => {
      const files = Array.from(fileList || [])
      const results = []
      for (const f of files) {
        try {
          const src = await fileToCompressedDataURL(f)
          results.push({ id: uid(), src, name: f.name })
        } catch (e) {
          console.error('Image load failed', e)
        }
      }
      if (results.length) {
        setMImages([...mImages, ...results])
      }
    },
    [mImages, setMImages]
  )

  const onMChecklistDragStart = useCallback(
    (e, itemId) => {
      setChecklistDragId(itemId)
      e.dataTransfer.setData(
        'application/json',
        JSON.stringify({ source: 'checklist-modal', id: itemId })
      )
    },
    [setChecklistDragId]
  )

  const onMChecklistDragOver = useCallback(e => {
    e.preventDefault()
  }, [])

  const onMChecklistDrop = useCallback(
    (e, targetId) => {
      e.preventDefault()
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}')
        if (data.source !== 'checklist-modal') return
        const sourceId = data.id
        if (String(sourceId) === String(targetId)) return

        const items = [...mItems]
        const sourceIdx = items.findIndex(i => String(i.id) === String(sourceId))
        const targetIdx = items.findIndex(i => String(i.id) === String(targetId))
        if (sourceIdx === -1 || targetIdx === -1) return

        const [removed] = items.splice(sourceIdx, 1)
        items.splice(targetIdx, 0, removed)
        setMItems(items)
      } catch (_err) {}
      setChecklistDragId(null)
    },
    [mItems, setMItems, setChecklistDragId]
  )

  const value = {
    // State
    open,
    setOpen: v => (v ? null : closeModal()), // Handle only close
    activeId,
    setActiveId: () => {}, // Managed by openNote
    activeNoteObj,
    setActiveNoteObj: () => {},
    mType,
    setMType,
    mTitle,
    setMTitle,
    mBody,
    setMBody,
    mTagList,
    setMTagList,
    mColor,
    setMColor,
    mTransparency,
    setMTransparency,
    mImages,
    setMImages,
    mItems,
    setMItems,
    mInput,
    setMInput,
    mDrawingData,
    setMDrawingData,
    viewMode,
    setViewMode,
    showModalFmt,
    setShowModalFmt,
    modalMenuOpen,
    setModalMenuOpen,
    showModalColorPop,
    setShowModalColorPop,
    showModalTransPop,
    setShowModalTransPop,
    imgViewOpen,
    setImgViewOpen,
    mImagesViewIndex,
    setMImagesViewIndex,
    tagInput,
    setTagInput,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    isSaving,
    setIsSaving,
    modalHasChanges,
    setModalHasChanges,
    checklistDragId,
    setChecklistDragId,
    collaborationModalOpen,
    setCollaborationModalOpen,
    collaboratorUsername,
    setCollaboratorUsername,
    showUserDropdown,
    setShowUserDropdown,
    filteredUsers,
    setFilteredUsers,
    addModalCollaborators,
    setAddModalCollaborators,
    loadingUsers,
    setLoadingUsers,
    dropdownPosition,
    setDropdownPosition,

    // Refs
    modalScrollRef,
    modalFmtBtnRef,
    modalMenuBtnRef,
    modalColorBtnRef,
    modalTransBtnRef,
    modalFileRef,
    mBodyRef,
    noteViewRef,
    collaboratorInputRef,
    scrimClickStartRef,

    // Actions
    openNote,
    closeModal,
    saveModal,
    deleteModal,
    formatModal,
    handleDownloadNote,
    addCollaborator,
    removeCollaborator,
    addTags,
    handleTagKeyDown,
    handleTagBlur,
    handleTagPaste,
    onModalBodyClick,
    openImageViewer,
    closeImageViewer,
    nextImage,
    prevImage,
    addImagesToModal,
    resizeModalTextarea,
    handleSmartEnter,
    onMChecklistDragStart,
    onMChecklistDragOver,
    onMChecklistDrop,
  }

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within ModalProvider')
  }
  return context
}
