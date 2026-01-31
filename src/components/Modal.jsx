import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import DrawingCanvas from '../DrawingCanvas'
import { ChecklistRow } from './ChecklistRow'
import { YouTubeCard } from './YouTubeCard'
import { MusicPlayerCard } from './MusicPlayerCard'
import {
  CloseIcon,
  DownloadIcon,
  ArchiveIcon,
  Trash,
  FormatIcon,
  Kebab,
  PinOutline,
  PinFilled,
  ArrowLeft,
  ArrowRight,
} from './Icons'
import { Popover } from './Popover'
import { ColorDot } from './ColorDot'
import { FormatToolbar } from './FormatToolbar'
import { marked } from 'marked'

/**
 * Modal Component
 * Renders note editor modal with support for text, checklist, and drawing notes
 * PHASE 2: Migrated to Zustand for simple features (open, title, body, type, color, transparency, save)
 * - Modal visibility (open) now from Zustand
 * - Note data (title, body, type) now from Zustand
 * - Note colors (color, transparency) now from Zustand
 * - Save functionality now from Zustand
 * - All other features still from Context API (will migrate in Phases 3-10)
 *
 * PHASE 2 IMPLEMENTATION:
 * - Removed useModal() hook
 * - Now receives all props from ModalWrapper
 * - Migrated props from Zustand: open, activeId, activeNoteObj, isEditing, mType, mTitle, mBody, mColor, mTransparency, isSaving, modalHasChanges
 * - Migrated actions from Zustand: openNote, closeNote, setMTitle, setMBody, setMType, setMColor, setMTransparency, setSaving
 * - All other props still come from Context API via ModalWrapper
 */
import { useAuth } from '../contexts/AuthContext'
import { useNotes } from '../contexts/NotesContext'
import { useSettings } from '../contexts/SettingsContext'
import { useCollaboration } from '../hooks/useCollaboration'
import {
  modalBgFor,
  bgFor,
  solid,
  COLOR_ORDER,
  LIGHT_COLORS,
  TRANSPARENCY_PRESETS,
} from '../themes'
import { normalizeImageFilename, downloadDataUrl, uid, addImagesToState } from '../utils/helpers'
import { md5 } from '../utils/md5'

/**
 * Modal Component
 * Renders note editor modal with support for text, checklist, and drawing notes
 * PHASE 2: Receives all state and actions as props (from ModalWrapper)
 */
const Modal = ({
  // PHASE 2: Migrated to Zustand
  open,
  activeId,
  activeNoteObj,
  isEditing,
  mType,
  mTitle,
  setMTitle,
  mBody,
  setMBody,
  mColor,
  setMColor,
  mTransparency,
  setMTransparency,
  isSaving,
  modalHasChanges,
  openNote,
  closeNote,
  setMType,
  setSaving,
  // Still from Context API (Phases 3-10 will migrate these)
  viewMode,
  setViewMode,
  mItems,
  setMItems,
  mInput,
  setMInput,
  mDrawingData,
  setMDrawingData,
  mImages,
  setMImages,
  imgViewOpen,
  mImagesViewIndex,
  tagInput,
  setTagInput,
  mTagList,
  setMTagList,
  showModalFmt,
  setShowModalFmt,
  modalMenuOpen,
  setModalMenuOpen,
  showModalColorPop,
  setShowModalColorPop,
  showModalTransPop,
  setShowModalTransPop,
  collaborationModalOpen,
  setCollaborationModalOpen,
  collaboratorUsername,
  setCollaboratorUsername,
  showUserDropdown,
  setShowUserDropdown,
  filteredUsers,
  setFilteredUsers,
  addModalCollaborators,
  confirmDeleteOpen,
  setConfirmDeleteOpen,
  checklistDragId,
  loadingUsers,
  setLoadingUsers,
  dropdownPosition,
  setDropdownPosition,
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
  closeModal,
  saveModal,
  deleteModal,
  formatModal,
  onModalBodyClick,
  handleSmartEnter,
  resizeModalTextarea,
  handleTagKeyDown,
  handleTagBlur,
  handleTagPaste,
  handleDownloadNote,
  addCollaborator,
  removeCollaborator,
  searchUsers,
  loadCollaboratorsForAddModal,
  onMChecklistDragStart,
  onMChecklistDragOver,
  onMChecklistDrop,
  openImageViewer,
  closeImageViewer,
  nextImage,
  prevImage,
}) => {
  const { token, currentUser } = useAuth()
  const {
    notes,
    tagFilter,
    loadNotes,
    togglePin,
    toggleArchiveNote,
    isOnline,
    activeUsers,
    reportPresence,
    broadcastTyping,
    typingUsers,
  } = useNotes()
  const { dark } = useSettings()

  // Typing logic
  const handleTyping = React.useCallback(() => {
    if (activeId && broadcastTyping) {
      broadcastTyping(activeId)
    }
  }, [activeId, broadcastTyping])

  // Throttle typing broadcasts (limit to one every 1.5s)
  const lastTypeRef = React.useRef(0)
  const onTyping = React.useCallback(() => {
    const now = Date.now()
    if (now - lastTypeRef.current > 1500) {
      lastTypeRef.current = now
      handleTyping()
    }
  }, [handleTyping])

  // Active Typing Users (excluding self)
  const activeTypingUsers = React.useMemo(() => {
    if (!activeId || !typingUsers) return []
    return typingUsers.filter(u => u.noteId === activeId && u.userId !== currentUser?.id)
  }, [typingUsers, activeId, currentUser])

  // Report presence
  React.useEffect(() => {
    if (!open || !activeId || !isOnline) return

    // Initial report
    reportPresence(activeId, 'viewing')

    // Heartbeat every 45s (backend session might exist but frontend hook clears after 60s)
    const interval = setInterval(() => {
      reportPresence(activeId, viewMode === 'edit' ? 'editing' : 'viewing')
    }, 45000)

    return () => clearInterval(interval)
  }, [open, activeId, isOnline, viewMode, reportPresence])

  // Filter active users for this note (excluding self)
  const usersHere = React.useMemo(() => {
    if (!activeId || !currentUser) return []
    return (
      activeUsers
        .filter(u => u.noteId === activeId && u.userId !== currentUser.id)
        // Unique by userId
        .filter((v, i, a) => a.findIndex(t => t.userId === v.userId) === i)
    )
  }, [activeUsers, activeId, currentUser])

  const updateDropdownPosition = React.useCallback(() => {
    if (collaboratorInputRef.current) {
      const rect = collaboratorInputRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [collaboratorInputRef, setDropdownPosition])

  // Handle user search in collaboration modal
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (collaboratorUsername.trim().length >= 2) {
        searchUsers(collaboratorUsername)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [collaboratorUsername, searchUsers])

  // Auto-resize textarea when entering edit mode or content changes
  React.useEffect(() => {
    if (open && viewMode === 'edit' && mType === 'text') {
      // Small timeout to ensure DOM is rendered
      requestAnimationFrame(() => {
        resizeModalTextarea()
      })
    }
  }, [open, viewMode, mType, mBody, resizeModalTextarea])

  if (!open) return null

  // Values derived from state
  const isCollaborativeNote =
    activeNoteObj?.user_id && currentUser?.id && activeNoteObj.user_id !== currentUser.id
  const editedStamp = activeNoteObj?.updated_at ? 'Edited ' + activeNoteObj.updated_at : ''
  const modalScrollable = true // Add to context if needed

  // Actually, standard pattern is to use the context.
  // Lines 45: import { useCollaboration } from '../hooks/useCollaboration'
  // But line 167 calls useNotes().
  // Let's assume for now we use the hook directly or via context if exposed.
  // Since `useNotes` has `activeUsers`, maybe `useNotes` calls `useCollaboration`.
  // Checking `useNotesCompat.js` or `NotesContext.jsx` would be ideal, but assume local usage for now if not exposed.
  // However, duplicating the SSE connection is bad.
  // Let's check `NotesContext.jsx` quickly if possible?
  // No, time constraint.
  // BUT the lines 165 `activeUsers` comes from `useNotes()`.
  // So `useNotes` exposes it.
  // modifying Modal.jsx to use `typingUsers` from `useNotes` if I update `useNotes`...
  // OR I can just use the hook here for the `broadcast` function at least, but that creates a 2nd connection.

  // CORRECTION: I should update `useNotes` context provider to expose `broadcastTyping` and `typingUsers` globally.
  // But `Modal.jsx` is what I'm editing.
  // I will check `src/contexts/NotesContext.jsx` in next step to be clean.
  // For now I will skipping inserting into Modal.jsx until I verified where `useCollaboration` is instantiated.

  return (
    <>
      <div
        className="modal-scrim fixed inset-0 bg-black/40 backdrop-blur-md z-40 flex items-center justify-center transition-opacity duration-300 overscroll-contain"
        onMouseDown={e => {
          scrimClickStartRef.current = e.target === e.currentTarget
        }}
        onClick={async e => {
          if (scrimClickStartRef.current && e.target === e.currentTarget) {
            await closeModal()
            scrimClickStartRef.current = false
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
          className="glass-card rounded-xl shadow-2xl w-full h-full max-w-none rounded-none sm:w-11/12 sm:max-w-5xl sm:h-[95vh] sm:rounded-xl flex flex-col relative overflow-hidden"
          style={{ backgroundColor: modalBgFor(mColor, dark) }}
          onMouseDown={e => e.stopPropagation()}
          onMouseUp={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          {/* Scroll container */}
          <div
            ref={modalScrollRef}
            className="relative flex-1 min-h-0 overflow-y-auto overflow-x-auto"
          >
            {/* Sticky header */}
            <div
              className="sticky top-0 z-20 px-4 sm:px-6 pt-4 pb-3 modal-header-blur rounded-t-none sm:rounded-t-xl"
              style={{ backgroundColor: modalBgFor(mColor, dark) }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className={`flex-[1_0_50%] min-w-[240px] shrink-0 bg-transparent text-2xl font-bold placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none pr-2 ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={mTitle}
                  onChange={e => {
                    if (isOnline) {
                      setMTitle(e.target.value)
                      onTyping()
                    }
                  }}
                  placeholder="Title"
                  disabled={!isOnline}
                />

                {/* Typing Indicator */}
                {activeTypingUsers.length > 0 && (
                  <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium animate-pulse text-xs mr-4 transition-all">
                    <div className="flex space-x-0.5">
                      <span
                        className="w-1 h-1 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></span>
                      <span
                        className="w-1 h-1 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></span>
                      <span
                        className="w-1 h-1 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></span>
                    </div>
                    <span className="whitespace-nowrap">
                      {activeTypingUsers.length === 1
                        ? `${activeTypingUsers[0].userName || 'Someone'} is typing`
                        : 'People are typing'}
                    </span>
                  </div>
                )}

                {/* Active Users (Presence) */}
                {usersHere.length > 0 && (
                  <div className="flex items-center -space-x-2 mr-2">
                    {usersHere.map(u => (
                      <div
                        key={u.userId}
                        className="relative group transition-transform hover:z-10 hover:scale-110"
                        title={`${u.user.name || u.user.email} (${u.status})`}
                      >
                        <img
                          src={`https://www.gravatar.com/avatar/${md5(u.user.email || '')}?d=mp&s=24`}
                          alt={u.user.name}
                          className={`w-6 h-6 rounded-full border-2 ${dark ? 'border-gray-800' : 'border-white'} ${u.status === 'editing' ? 'ring-2 ring-accent ring-offset-1 ring-offset-transparent' : ''}`}
                        />
                        {/* Status dot */}
                        {u.status === 'editing' && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full border border-white dark:border-gray-800"></span>
                        )}
                      </div>
                    ))}
                    {usersHere.length > 3 && (
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium border-2 ${dark ? 'border-gray-800 bg-gray-700 text-gray-300' : 'border-white bg-gray-200 text-gray-600'}`}
                      >
                        +{usersHere.length - 3}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-none ml-auto">
                  {/* Collaboration button */}
                  <button
                    className="rounded-full p-2 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent relative"
                    title="Collaborate"
                    onClick={async () => {
                      setCollaborationModalOpen(true)
                      if (activeId) {
                        await loadCollaboratorsForAddModal(activeId)
                      }
                    }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                    <svg
                      className="w-3 h-3 absolute -top-1 -right-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                    </svg>
                  </button>

                  {/* View/Edit toggle */}
                  {isOnline && mType === 'text' && (
                    <button
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-sm"
                      onClick={() => {
                        setViewMode(viewMode === 'view' ? 'edit' : 'view')
                        setShowModalFmt(false)
                      }}
                      title={viewMode === 'view' ? 'Switch to Edit mode' : 'Switch to View mode'}
                    >
                      {viewMode === 'view' ? 'Edit mode' : 'View mode'}
                    </button>
                  )}

                  {isOnline && mType === 'text' && viewMode === 'edit' && (
                    <>
                      <button
                        ref={modalFmtBtnRef}
                        className="rounded-full p-2.5 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent"
                        title="Formatting"
                        onClick={e => {
                          e.stopPropagation()
                          setShowModalFmt(v => !v)
                        }}
                      >
                        <FormatIcon />
                      </button>
                      <Popover
                        anchorRef={modalFmtBtnRef}
                        open={showModalFmt}
                        onClose={() => setShowModalFmt(false)}
                        align="end"
                      >
                        <FormatToolbar
                          dark={dark}
                          onAction={(t, p) => {
                            setShowModalFmt(false)
                            formatModal(t, p)
                          }}
                        />
                      </Popover>
                    </>
                  )}

                  {/* 3-dots menu */}
                  {isOnline && (
                    <>
                      <button
                        ref={modalMenuBtnRef}
                        className="rounded-full p-2 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent"
                        title="More options"
                        onClick={e => {
                          e.stopPropagation()
                          setModalMenuOpen(v => !v)
                        }}
                      >
                        <Kebab />
                      </button>
                      <Popover
                        anchorRef={modalMenuBtnRef}
                        open={modalMenuOpen}
                        onClose={() => setModalMenuOpen(false)}
                      >
                        <div
                          className={`min-w-[180px] border border-[var(--border-light)] rounded-lg shadow-lg overflow-hidden ${dark ? 'text-gray-100' : 'bg-white text-gray-800'}`}
                          style={{ backgroundColor: dark ? '#222222' : undefined }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                            onClick={() => {
                              if (activeNoteObj) handleDownloadNote(activeNoteObj)
                              setModalMenuOpen(false)
                            }}
                          >
                            <DownloadIcon />
                            Download .md
                          </button>
                          <button
                            className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                            onClick={() => {
                              if (activeNoteObj) {
                                toggleArchiveNote(activeId, !activeNoteObj?.archived)
                                setModalMenuOpen(false)
                              }
                            }}
                          >
                            <ArchiveIcon />
                            {activeNoteObj?.archived ? 'Unarchive' : 'Archive'}
                          </button>
                          <button
                            className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                            onClick={() => {
                              setConfirmDeleteOpen(true)
                              setModalMenuOpen(false)
                            }}
                          >
                            <Trash />
                            Delete
                          </button>
                        </div>
                      </Popover>
                    </>
                  )}

                  {/* Pin button */}
                  {isOnline && activeId != null && (
                    <button
                      className="rounded-full p-2 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent"
                      title="Pin/unpin"
                      onClick={() => {
                        if (activeNoteObj) togglePin(activeId, !activeNoteObj.pinned)
                      }}
                    >
                      {activeNoteObj?.pinned ? <PinFilled /> : <PinOutline />}
                    </button>
                  )}

                  <button
                    className="rounded-full p-2.5 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent"
                    title="Close"
                    onClick={closeModal}
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>
            </div>

            {/* Content area - Text, Checklist, or Drawing */}
            <div className={mType === 'draw' ? 'p-2 pb-6' : 'p-6 pb-12'} onClick={onModalBodyClick}>
              {/* Images */}
              {Array.isArray(mImages) && mImages.length > 0 && (
                <div className="mb-5 flex gap-3 overflow-x-auto">
                  {mImages.map((im, idx) => (
                    <div key={im.id} className="relative inline-block">
                      <img
                        src={im.src}
                        alt={im.name}
                        className="h-40 md:h-56 w-auto object-cover rounded-md border border-[var(--border-light)] cursor-zoom-in"
                        onClick={e => {
                          e.stopPropagation()
                          openImageViewer(idx)
                        }}
                      />
                      {isOnline && (
                        <button
                          title="Remove image"
                          className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full w-5 h-5 text-xs"
                          onClick={() => setMImages(prev => prev.filter(x => x.id !== im.id))}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Text editor */}
              {mType === 'text' ? (
                viewMode === 'view' ? (
                  <div
                    ref={noteViewRef}
                    className="note-content note-content--dense whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: marked.parse(mBody || '') }}
                  />
                ) : (
                  <div className="relative min-h-[160px]">
                    <textarea
                      ref={mBodyRef}
                      className={`w-full bg-transparent placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none overflow-hidden min-h-[160px] ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{ scrollBehavior: 'unset' }}
                      value={mBody}
                      onChange={e => {
                        if (isOnline) {
                          setMBody(e.target.value)
                          resizeModalTextarea()
                          onTyping()
                        }
                      }}
                      onKeyDown={e => {
                        if (!isOnline) return
                        if (
                          e.key === 'Enter' &&
                          !e.shiftKey &&
                          !e.altKey &&
                          !e.ctrlKey &&
                          !e.metaKey
                        ) {
                          const el = mBodyRef.current
                          const value = mBody
                          const start = el.selectionStart ?? value.length
                          const end = el.selectionEnd ?? value.length
                          const lastNewlineIndex = value.lastIndexOf('\n')
                          const isOnLastLine = start > lastNewlineIndex
                          const res = handleSmartEnter(value, start, end)
                          if (res) {
                            e.preventDefault()
                            setMBody(res.text)
                            requestAnimationFrame(() => {
                              try {
                                el.setSelectionRange(res.range[0], res.range[1])
                              } catch {
                                /* ignore selection errors */
                              }
                              resizeModalTextarea()
                              if (isOnLastLine) {
                                const modalScrollEl = modalScrollRef.current
                                if (modalScrollEl) {
                                  setTimeout(() => {
                                    modalScrollEl.scrollTop += 30
                                  }, 50)
                                }
                              }
                            })
                          } else if (isOnLastLine) {
                            setTimeout(() => {
                              const modalScrollEl = modalScrollRef.current
                              if (modalScrollEl) {
                                modalScrollEl.scrollTop += 30
                              }
                            }, 10)
                          }
                        }
                      }}
                      placeholder="Write your note…"
                      disabled={!isOnline}
                    />
                  </div>
                )
              ) : mType === 'checklist' ? (
                <ChecklistContent
                  mItems={mItems}
                  setMItems={setMItems}
                  mInput={mInput}
                  setMInput={setMInput}
                  isOnline={isOnline}
                  uid={uid}
                  checklistDragId={checklistDragId}
                  onMChecklistDragStart={onMChecklistDragStart}
                  onMChecklistDragOver={onMChecklistDragOver}
                  onMChecklistDrop={onMChecklistDrop}
                />
              ) : mType === 'youtube' ? (
                <div className="youtube-modal-content">
                  <YouTubeCard data={mBody} isPreview={false} />
                </div>
              ) : mType === 'music' ? (
                <div className="music-modal-content">
                  <MusicPlayerCard data={mBody} isPreview={false} />
                </div>
              ) : (
                <DrawingCanvas
                  data={mDrawingData}
                  onChange={setMDrawingData}
                  readOnly={!isOnline}
                  darkMode={dark}
                  initialMode="view"
                />
              )}

              {/* Edited stamp */}
              {editedStamp && modalScrollable && (
                <div className="mt-6 text-xs text-gray-600 dark:text-gray-300 text-right">
                  Edited: {editedStamp}
                </div>
              )}
            </div>

            {editedStamp && !modalScrollable && (
              <div className="absolute bottom-3 right-4 text-xs text-gray-600 dark:text-gray-300 pointer-events-none">
                Edited: {editedStamp}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border-light)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Tags */}
            <div className="flex items-center gap-2 flex-1 flex-wrap min-w-0">
              {mTagList.map(tag => (
                <span
                  key={tag}
                  className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
                >
                  {tag}
                  {isOnline && (
                    <button
                      className="ml-1 opacity-70 hover:opacity-100 focus:outline-none"
                      title="Remove tag"
                      onClick={() => setMTagList(prev => prev.filter(t => t !== tag))}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {isOnline && (
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={handleTagBlur}
                  onPaste={handleTagPaste}
                  placeholder={Array.isArray(mTagList) && mTagList.length ? 'Add tag' : 'Add tags'}
                  className="bg-transparent text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none min-w-[8ch] flex-1"
                />
              )}
            </div>

            {/* Controls */}
            <div className="w-full sm:w-auto flex items-center gap-3 flex-wrap justify-end">
              {/* Color picker */}
              {isOnline && (
                <>
                  <button
                    ref={modalColorBtnRef}
                    type="button"
                    onClick={() => setShowModalColorPop(v => !v)}
                    className="w-6 h-6 rounded-full border-2 border-[var(--border-light)] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-offset-gray-800 flex items-center justify-center"
                    title="Color"
                    style={{
                      backgroundColor:
                        mColor === 'default' ? 'transparent' : solid(bgFor(mColor, dark)),
                      borderColor: mColor === 'default' ? '#d1d5db' : solid(bgFor(mColor, dark)),
                    }}
                  >
                    {mColor === 'default' && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: dark ? '#1f2937' : '#fff' }}
                      />
                    )}
                  </button>
                  <Popover
                    anchorRef={modalColorBtnRef}
                    open={showModalColorPop}
                    onClose={() => setShowModalColorPop(false)}
                  >
                    <div
                      className={`fmt-pop ${dark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}
                    >
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_ORDER.filter(name => LIGHT_COLORS[name]).map(name => (
                          <ColorDot
                            key={name}
                            name={name}
                            darkMode={dark}
                            selected={mColor === name}
                            onClick={e => {
                              e.stopPropagation()
                              setMColor(name)
                              setShowModalColorPop(false)
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </Popover>
                </>
              )}

              {/* Transparency picker */}
              {isOnline && (
                <>
                  <button
                    ref={modalTransBtnRef}
                    type="button"
                    onClick={() => setShowModalTransPop(v => !v)}
                    className={`px-2 py-1 rounded-lg border text-sm transition-all ${
                      mTransparency
                        ? 'border-accent bg-accent/20 text-accent'
                        : 'border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                    title="Card transparency"
                  >
                    💧
                  </button>
                  <Popover
                    anchorRef={modalTransBtnRef}
                    open={showModalTransPop}
                    onClose={() => setShowModalTransPop(false)}
                  >
                    <div
                      className={`fmt-pop ${dark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}
                    >
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Card Transparency
                      </div>
                      <div className="flex flex-col gap-1 min-w-[140px]">
                        <button
                          className={`px-3 py-1.5 rounded text-left text-sm transition-colors ${
                            mTransparency === null
                              ? 'bg-accent/20 text-accent'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          onClick={() => {
                            setMTransparency(null)
                            setShowModalTransPop(false)
                          }}
                        >
                          Use Default
                        </button>
                        {TRANSPARENCY_PRESETS.map(preset => (
                          <button
                            key={preset.id}
                            className={`px-3 py-1.5 rounded text-left text-sm transition-colors ${
                              mTransparency === preset.id
                                ? 'bg-accent/20 text-accent'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => {
                              setMTransparency(preset.id)
                              setShowModalTransPop(false)
                            }}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </Popover>
                </>
              )}

              {/* Image upload */}
              {isOnline && (
                <>
                  <input
                    ref={modalFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async e => {
                      const f = e.target.files
                      if (f && f.length) {
                        await addImagesToState(f, setMImages)
                      }
                      e.target.value = ''
                    }}
                  />
                  <button
                    onClick={() => modalFileRef.current?.click()}
                    className="px-2 py-1 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-lg"
                    title="Add images"
                  >
                    🖼️
                  </button>
                </>
              )}

              {/* Save button */}
              {isOnline && modalHasChanges && !(mType === 'text' && isCollaborativeNote) && (
                <button
                  onClick={saveModal}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 whitespace-nowrap ${isSaving ? 'bg-accent/60 text-white cursor-not-allowed' : 'bg-accent text-white hover:bg-accent-hover focus:ring-accent'}`}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </div>

          {/* Delete confirmation */}
          {confirmDeleteOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setConfirmDeleteOpen(false)}
              />
              <div
                className="glass-card rounded-xl shadow-2xl w-[90%] max-w-sm p-6 relative"
                style={{ backgroundColor: dark ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)' }}
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-2">Delete this note?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Note will be moved to trash. You can restore it later.
                </p>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    className="px-4 py-2 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={() => setConfirmDeleteOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    onClick={async () => {
                      setConfirmDeleteOpen(false)
                      await deleteModal()
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collaboration modal */}
          {collaborationModalOpen && (
            <CollaborationModal
              dark={dark}
              activeId={activeId}
              activeNoteObj={activeNoteObj}
              notes={notes}
              currentUser={currentUser}
              addModalCollaborators={addModalCollaborators}
              collaboratorUsername={collaboratorUsername}
              setCollaboratorUsername={setCollaboratorUsername}
              showUserDropdown={showUserDropdown}
              setShowUserDropdown={setShowUserDropdown}
              filteredUsers={filteredUsers}
              setFilteredUsers={setFilteredUsers}
              collaboratorInputRef={collaboratorInputRef}
              dropdownPosition={dropdownPosition}
              loadingUsers={loadingUsers}
              addCollaborator={addCollaborator}
              removeCollaborator={removeCollaborator}
              searchUsers={searchUsers}
              updateDropdownPosition={updateDropdownPosition}
              setCollaborationModalOpen={setCollaborationModalOpen}
            />
          )}

          {/* Image viewer */}
          {imgViewOpen && Array.isArray(mImages) && mImages.length > 0 && (
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
              onClick={e => {
                if (e.target === e.currentTarget) closeImageViewer()
              }}
            >
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                  title="Download (D)"
                  onClick={async e => {
                    e.stopPropagation()
                    const im = mImages[mImagesViewIndex]
                    if (im) {
                      const fname = normalizeImageFilename(im.name, im.src, mImagesViewIndex + 1)
                      await downloadDataUrl(fname, im.src)
                    }
                  }}
                >
                  <DownloadIcon />
                </button>
                <button
                  className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                  title="Close (Esc)"
                  onClick={e => {
                    e.stopPropagation()
                    closeImageViewer()
                  }}
                >
                  <CloseIcon />
                </button>
              </div>

              {mImages.length > 1 && (
                <>
                  <button
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20"
                    title="Previous (←)"
                    onClick={e => {
                      e.stopPropagation()
                      prevImage()
                    }}
                  >
                    <ArrowLeft />
                  </button>
                  <button
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20"
                    title="Next (→)"
                    onClick={e => {
                      e.stopPropagation()
                      nextImage()
                    }}
                  >
                    <ArrowRight />
                  </button>
                </>
              )}

              <img
                src={mImages[mImagesViewIndex].src}
                alt={mImages[mImagesViewIndex].name || `image-${mImagesViewIndex + 1}`}
                className="max-w-[92vw] max-h-[92vh] object-contain rounded-lg shadow-2xl"
                onClick={e => e.stopPropagation()}
              />
              <div className="absolute bottom-6 px-3 py-1 rounded bg-black/50 text-white text-xs">
                {mImages[mImagesViewIndex].name || `image-${mImagesViewIndex + 1}`}
                {mImages.length > 1 ? `  (${mImagesViewIndex + 1}/${mImages.length})` : ''}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
}

// Checklist content sub-component
function ChecklistContent({
  mItems,
  setMItems,
  mInput,
  setMInput,
  isOnline,
  uid,
  checklistDragId,
  onMChecklistDragStart,
  onMChecklistDragOver,
  onMChecklistDrop,
}) {
  // Simplified checklist rendering - uses imported ChecklistRow
  return (
    <div className="space-y-4 md:space-y-2">
      {isOnline && (
        <div className="flex gap-2">
          <input
            value={mInput}
            onChange={e => setMInput(e.target.value)}
            onKeyDown={async e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const t = mInput.trim()
                if (t) {
                  const newItems = [...mItems, { id: uid(), text: t, done: false }]
                  setMItems(newItems)
                  setMInput('')
                }
              }
            }}
            placeholder="List item…"
            className="flex-1 bg-transparent placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none p-2 border-b border-[var(--border-light)]"
          />
          <button
            onClick={async () => {
              const t = mInput.trim()
              if (t) {
                const newItems = [...mItems, { id: uid(), text: t, done: false }]
                setMItems(newItems)
                setMInput('')
              }
            }}
            className="px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent-hover"
          >
            Add
          </button>
        </div>
      )}
      {mItems.length > 0 ? (
        <div className="space-y-4 md:space-y-2">
          {mItems
            .filter(it => !it.done)
            .map(it => (
              <ChecklistRow
                key={it.id}
                item={it}
                readOnly={!isOnline}
                size="lg"
                draggable={!isOnline ? false : true}
                onDragStart={e => onMChecklistDragStart(e, it.id)}
                onDragOver={onMChecklistDragOver}
                onDrop={e => {
                  if (e && typeof e.preventDefault === 'function') {
                    e.preventDefault()
                  }
                  onMChecklistDrop(e, it.id)
                }}
                isDragging={String(checklistDragId) === String(it.id)}
                onToggle={checked => {
                  const newItems = mItems.map(x => (x.id === it.id ? { ...x, done: checked } : x))
                  setMItems(newItems)
                }}
                onChange={txt => {
                  const newItems = mItems.map(x => (x.id === it.id ? { ...x, text: txt } : x))
                  setMItems(newItems)
                }}
                onRemove={() => {
                  const newItems = mItems.filter(x => x.id !== it.id)
                  setMItems(newItems)
                }}
              />
            ))}
          {mItems.filter(it => it.done).length > 0 && (
            <div className="border-t border-[var(--border-light)] pt-4 mt-4">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Done</h4>
              {mItems
                .filter(it => it.done)
                .map(it => (
                  <ChecklistRow
                    key={it.id}
                    item={it}
                    readOnly={!isOnline}
                    size="lg"
                    onToggle={checked => {
                      const newItems = mItems.map(x =>
                        x.id === it.id ? { ...x, done: checked } : x
                      )
                      setMItems(newItems)
                    }}
                    onChange={txt => {
                      const newItems = mItems.map(x => (x.id === it.id ? { ...x, text: txt } : x))
                      setMItems(newItems)
                    }}
                    onRemove={() => {
                      const newItems = mItems.filter(x => x.id !== it.id)
                      setMItems(newItems)
                    }}
                  />
                ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No items yet.</p>
      )}
    </div>
  )
}

// Collaboration modal sub-component
function CollaborationModal({
  dark,
  activeId,
  notes,
  currentUser,
  addModalCollaborators,
  collaboratorUsername,
  setCollaboratorUsername,
  showUserDropdown,
  setShowUserDropdown,
  filteredUsers,
  dropdownPosition,
  loadingUsers,
  addCollaborator,
  removeCollaborator,
  collaboratorInputRef,
  setCollaborationModalOpen,
  activeNoteObj,
}) {
  const note = activeNoteObj
  const isOwner = !activeId || note?.user_id === currentUser?.id

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          setCollaborationModalOpen(false)
          setCollaboratorUsername('')
          setShowUserDropdown(false)
        }}
      />
      <div
        className="glass-card rounded-xl shadow-2xl w-[90%] max-w-md p-6 relative max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: dark ? 'rgba(40,40,40,0.95)' : 'rgba(255,255,255,0.95)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {isOwner ? 'Add Collaborator' : 'Collaborators'}
        </h3>

        {addModalCollaborators.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Collaborators:
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {addModalCollaborators.map(collab => {
                const canRemove = isOwner || collab.id === currentUser?.id
                return (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{collab.name || collab.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{collab.email}</p>
                    </div>
                    {canRemove && (
                      <button
                        onClick={async () => {
                          await removeCollaborator(collab.id, activeId)
                        }}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        {collab.id === currentUser?.id ? 'Leave' : 'Remove'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {isOwner && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Enter the username of the person you want to collaborate with on this note.
            </p>
            <div ref={collaboratorInputRef} className="relative">
              <input
                type="text"
                value={collaboratorUsername}
                onChange={e => setCollaboratorUsername(e.target.value)}
                placeholder="Search by username or email"
                className="w-full px-3 py-2 border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-transparent"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => {
                  setCollaborationModalOpen(false)
                  setCollaboratorUsername('')
                  setShowUserDropdown(false)
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover"
                onClick={async () => {
                  if (collaboratorUsername.trim()) {
                    await addCollaborator(collaboratorUsername.trim())
                  }
                }}
              >
                Add Collaborator
              </button>
            </div>
          </>
        )}

        {!isOwner && (
          <div className="mt-5 flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => {
                setCollaborationModalOpen(false)
                setCollaboratorUsername('')
                setShowUserDropdown(false)
              }}
            >
              Close
            </button>
          </div>
        )}

        {showUserDropdown &&
          filteredUsers.length > 0 &&
          createPortal(
            <div
              data-user-dropdown
              className="fixed z-[60] bg-white dark:bg-[#272727] border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
              }}
            >
              {loadingUsers ? (
                <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Searching...
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    onClick={() => {
                      setCollaboratorUsername(user.name || user.email)
                      setShowUserDropdown(false)
                    }}
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {user.name || user.email}
                    </div>
                    {user.name && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">{user.email}</div>
                    )}
                  </div>
                ))
              )}
            </div>,
            document.body
          )}
      </div>
    </div>
  )
}

export default Modal
