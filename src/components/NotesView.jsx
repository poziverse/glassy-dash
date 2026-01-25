import React, { useState, useRef, useMemo, useEffect } from 'react'
import { useNotesCompat } from '../hooks/useNotesCompat'
import { useAdmin } from '../hooks'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUIStore } from '../stores/uiStore'
import { useModalStore } from '../stores/modalStore'
import { BACKGROUNDS } from '../backgrounds'
import { LIGHT_COLORS, COLOR_ORDER } from '../themes'
import { NoteCard } from './NoteCard'
import { Composer } from './Composer'
import { SettingsPanel } from './SettingsPanel'
import DashboardLayout from './DashboardLayout'
import { Popover } from './Popover'
import { ColorDot } from './ColorDot'
import { PinIcon, ArchiveIcon, CloseIcon, Sparkles } from './Icons'
import { safeAiMarkdown } from '../utils/safe-markdown'
import { ALL_IMAGES } from '../utils/helpers'

export default function NotesView() {
  // --- Context Consumption ---
  const { currentUser, signOut } = useNotesCompat()
  const {
    pinned,
    others,
    archivedNotes,
    setSearch,
    tagFilter,
    setTagFilter,
    tagsWithCounts,
    notesLoading,
    filteredEmptyWithSearch,
    allEmpty,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    togglePin,
    multiMode,
    selectedIds,
    onExitMulti,
    onToggleSelect,
    onBulkDelete,
    onBulkPin,
    onBulkArchive,
    onBulkColor,
    onBulkDownloadZip,
    updateChecklistItem,
    isOnline,
  } = useNotesCompat()

  const dark = useSettingsStore(state => state.dark)
  const backgroundImage = useSettingsStore(state => state.backgroundImage)
  const backgroundOverlay = useSettingsStore(state => state.backgroundOverlay)
  const cardTransparency = useSettingsStore(state => state.cardTransparency)
  const listView = useSettingsStore(state => state.listView)
  const localAiEnabled = useSettingsStore(state => state.localAiEnabled)
  const overlayOpacity = useSettingsStore(state => state.overlayOpacity)

  const headerMenuOpen = useUIStore(state => state.headerMenuOpen)
  const setHeaderMenuOpen = useUIStore(state => state.setHeaderMenuOpen)
  const aiResponse = useUIStore(state => state.aiResponse)
  const setAiResponse = useUIStore(state => state.setAiResponse)
  const isAiLoading = useUIStore(state => state.isAiLoading)
  const aiLoadingProgress = useUIStore(state => state.aiLoadingProgress)
  const onAiSearch = useUIStore(state => state.onAiSearch)

  // Admin hooks logic moved to AdminView, but we might pass some status here if needed
  // For now, we only need to know if user is admin, which is on currentUser

  // --- Local State ---
  const [activeSection, setActiveSection] = useState('overview')
  const multiColorBtnRef = useRef(null)
  const [showMultiColorPop, setShowMultiColorPop] = useState(false)

  // --- Derived State ---
  const tagLabel =
    tagFilter === ALL_IMAGES
      ? 'All Images'
      : tagFilter === 'ARCHIVED'
        ? 'Archived Notes'
        : tagFilter

  const dashboardTitle =
    activeSection === 'overview'
      ? tagLabel || 'All Notes'
      : activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')

  const currentBg = useMemo(
    () => BACKGROUNDS.find(b => b.id === backgroundImage),
    [backgroundImage]
  )

  // --- Effects ---
  // Close header menu when scrolling
  useEffect(() => {
    if (!headerMenuOpen) return // Early return - no listeners needed

    const handleScroll = () => setHeaderMenuOpen(false)
    const scrollContainer = document.querySelector('.min-h-screen') // Adjust selector as needed

    // Single cleanup function for both potential listeners
    const cleanup = () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('scroll', handleScroll)
    }

    // Add appropriate listener based on container availability
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    } else {
      // Fallback if scrolling happens on window
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    return cleanup
  }, [headerMenuOpen, setHeaderMenuOpen])

  // --- Render ---
  return (
    <>
      {/* Golden Gradient Background */}
      {backgroundImage === 'golden_gradient' && (
        <div
          className="fixed inset-0 z-[-1] pointer-events-none animate-in fade-in duration-700"
          style={{
            background: `
              radial-gradient(circle at 15% 50%, rgba(251, 191, 36, 0.2), transparent 30%),
              radial-gradient(circle at 85% 30%, rgba(253, 224, 71, 0.15), transparent 30%),
              linear-gradient(to bottom, #FFFBEB, #FEF3C7, #FDE68A)
            `,
          }}
        >
          {backgroundOverlay && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background: dark
                  ? `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.2), transparent 40%), linear-gradient(to bottom, #000000, #1a1a1a)` // Darker overlay for contrast
                  : `rgba(255, 255, 255, 0.2)`,
                overflow: 'hidden',
                opacity: overlayOpacity,
              }}
            />
          )}
        </div>
      )}

      {backgroundImage?.startsWith('custom:') ? (
        <CustomBackgroundRenderer
          id={backgroundImage.split(':')[1]}
          dark={dark}
          backgroundOverlay={backgroundOverlay}
          overlayOpacity={overlayOpacity}
        />
      ) : (
        currentBg &&
        currentBg.paths?.desktop && (
          <div className="fixed inset-0 z-[-1] pointer-events-none">
            <img
              src={currentBg.paths.desktop}
              srcSet={
                currentBg.paths.mobile && currentBg.paths.xl
                  ? `${currentBg.paths.mobile} 800w, ${currentBg.paths.desktop} 1920w, ${currentBg.paths.xl} 3840w`
                  : undefined
              }
              sizes="100vw"
              alt="Background"
              className="w-full h-full object-cover animate-in fade-in duration-700"
            />
            {backgroundOverlay && (
              <div
                className="absolute inset-0 transition-opacity duration-700"
                style={{
                  background: dark
                    ? `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.2), transparent 40%), 
                      radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 40%),
                      linear-gradient(to bottom, #050505, #121212, #0a0a0a)`
                    : `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.15), transparent 25%), 
                      radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.1), transparent 25%),
                      linear-gradient(to bottom, #0f0c29, #302b63, #24243e)`,
                  overflow: 'hidden',
                  opacity: overlayOpacity,
                }}
              />
            )}
            {dark && !backgroundOverlay && <div className="absolute inset-0 bg-black/40" />}
          </div>
        )
      )}

      <DashboardLayout
        activeSection={activeSection}
        onNavigate={section => {
          if (['health', 'alerts', 'admin'].includes(section)) {
            window.location.hash = `#/${section}`
          } else {
            setActiveSection(section)
          }
        }}
        user={currentUser}
        onSearch={setSearch}
        tags={tagsWithCounts}
        onTagSelect={setTagFilter}
        activeTag={tagFilter}
        isAdmin={currentUser?.is_admin}
        title={dashboardTitle}
        onSignOut={signOut}
      >
        <div className="pb-20">
          {/* Render content based on activeSection */}
          {activeSection === 'overview' && (
            <>
              {/* Multi-Select Toolbar */}
              {multiMode && (
                <div
                  className="p-3 sm:p-4 flex items-center justify-between sticky top-0 z-[50] glass-card mb-2 mx-4"
                  style={{ position: 'sticky' }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-sm"
                      onClick={onBulkDownloadZip}
                    >
                      Download (.zip)
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm"
                      onClick={onBulkDelete}
                    >
                      Delete
                    </button>
                    <button
                      ref={multiColorBtnRef}
                      type="button"
                      onClick={() => setShowMultiColorPop(v => !v)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-sm"
                      title="Color"
                    >
                      🎨 Color
                    </button>
                    <Popover
                      anchorRef={multiColorBtnRef}
                      open={showMultiColorPop}
                      onClose={() => setShowMultiColorPop(false)}
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
                              selected={false}
                              onClick={e => {
                                e.stopPropagation()
                                onBulkColor(name)
                                setShowMultiColorPop(false)
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </Popover>
                    {tagFilter !== 'ARCHIVED' && (
                      <button
                        className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-sm flex items-center gap-1"
                        onClick={() => onBulkPin(true)}
                      >
                        <PinIcon />
                        Pin
                      </button>
                    )}
                    <button
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-sm flex items-center gap-1"
                      onClick={onBulkArchive}
                    >
                      <ArchiveIcon />
                      {tagFilter === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                    </button>
                    <span className="text-xs opacity-70 ml-2">Selected: {selectedIds.size}</span>
                  </div>
                  <button
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Exit multi-select"
                    onClick={onExitMulti}
                  >
                    <CloseIcon />
                  </button>
                </div>
              )}

              {/* AI Response Box */}
              {localAiEnabled && (aiResponse || isAiLoading) && (
                <div className="px-4 sm:px-6 md:px-8 lg:px-12 mb-6">
                  <div className="max-w-2xl mx-auto glass-card rounded-xl shadow-lg p-5 border border-accent/30 relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30">
                    {isAiLoading && (
                      <div
                        className="absolute top-0 left-0 h-1 bg-accent transition-all duration-300"
                        style={{ width: aiLoadingProgress ? `${aiLoadingProgress}%` : '5%' }}
                      />
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="text-accent dark:text-indigo-400" />
                      <h3 className="font-semibold text-accent dark:text-accent">AI Assistant</h3>
                      {aiResponse && !isAiLoading && (
                        <button
                          onClick={() => {
                            setAiResponse(null)
                            setSearch('')
                          }}
                          className="ml-auto p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                          title="Clear response"
                        >
                          <CloseIcon />
                        </button>
                      )}
                    </div>
                    <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                      {isAiLoading ? (
                        <p className="animate-pulse text-gray-500 italic flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
                          AI Assistant is thinking...
                        </p>
                      ) : (
                        <div
                          className="text-gray-800 dark:text-gray-200 note-content"
                          dangerouslySetInnerHTML={{ __html: safeAiMarkdown(aiResponse || '') }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Composer (Create Note) */}
              <div className="px-4 sm:px-6 md:px-8 lg:px-12">
                <div className="max-w-2xl mx-auto">
                  <Composer />
                </div>
              </div>

              {/* Notes Lists */}
              <main className="px-4 sm:px-6 md:px-8 lg:px-12 pb-12 mt-8">
                {/* ARCHIVED VIEW */}
                {tagFilter === 'ARCHIVED' && (
                  <section>
                    <h2 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 ml-1 max-w-2xl mx-auto">
                      Archived
                    </h2>
                    <div className={listView ? 'max-w-2xl mx-auto space-y-6' : 'masonry-grid'}>
                      {archivedNotes.length === 0 ? (
                        <p className="text-center text-gray-400 mt-8 col-span-full">
                          No archived notes.
                        </p>
                      ) : (
                        archivedNotes.map(n => (
                          <NoteCard
                            key={n.id}
                            n={n}
                            multiMode={multiMode}
                            selected={selectedIds.has(String(n.id))}
                            onToggleSelect={onToggleSelect}
                            disablePin={true}
                            onDragStart={onDragStart}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onDragEnd={onDragEnd}
                          />
                        ))
                      )}
                    </div>
                  </section>
                )}

                {/* STANDARD VIEW (Pinned + Others) - Only show if NOT archived */}
                {tagFilter !== 'ARCHIVED' && (
                  <>
                    {pinned.length > 0 && (
                      <section className="mb-10">
                        <h2 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 ml-1 max-w-2xl mx-auto">
                          Pinned
                        </h2>
                        <div className={listView ? 'max-w-2xl mx-auto space-y-6' : 'masonry-grid'}>
                          {pinned.map(n => (
                            <NoteCard
                              key={n.id}
                              n={n}
                              multiMode={multiMode}
                              selected={selectedIds.has(String(n.id))}
                              onToggleSelect={onToggleSelect}
                              disablePin={'ontouchstart' in window || navigator.maxTouchPoints > 0}
                              onDragStart={onDragStart}
                              onDragOver={onDragOver}
                              onDragLeave={onDragLeave}
                              onDrop={onDrop}
                              onDragEnd={onDragEnd}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {(others.length > 0 || pinned.length > 0) && others.length > 0 && (
                      <section>
                        {pinned.length > 0 && (
                          <h2 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 ml-1 max-w-2xl mx-auto">
                            Others
                          </h2>
                        )}
                        <div className={listView ? 'max-w-2xl mx-auto space-y-6' : 'masonry-grid'}>
                          {others.map(n => (
                            <NoteCard
                              key={n.id}
                              n={n}
                              multiMode={multiMode}
                              selected={selectedIds.has(String(n.id))}
                              onToggleSelect={onToggleSelect}
                              disablePin={'ontouchstart' in window || navigator.maxTouchPoints > 0}
                              onDragStart={onDragStart}
                              onDragOver={onDragOver}
                              onDragLeave={onDragLeave}
                              onDrop={onDrop}
                              onDragEnd={onDragEnd}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}

                {notesLoading && pinned.length + others.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
                    Loading Notes...
                  </p>
                )}

                {!notesLoading && filteredEmptyWithSearch && (
                  <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
                    No matching notes found.
                  </p>
                )}

                {!notesLoading && allEmpty && (
                  <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
                    No notes yet. Add one to get started!
                  </p>
                )}
              </main>
            </>
          )}

          {/* Placeholder Views for other sections */}
          {activeSection === 'admin' && currentUser?.is_admin && (
            <div className="p-8 text-center">
              <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
              <p className="mb-4">Use the main navigation to access the full Admin Dashboard.</p>
              <button
                onClick={() => (window.location.hash = '#/admin')}
                className="px-4 py-2 bg-accent text-white rounded-lg"
              >
                Go to Admin Dashboard
              </button>
            </div>
          )}

          {activeSection === 'settings' && <SettingsPanel inline={true} />}
        </div>
      </DashboardLayout>
    </>
  )
}

function CustomBackgroundRenderer({ id, dark, backgroundOverlay, overlayOpacity }) {
  const [url, setUrl] = React.useState(null)

  React.useEffect(() => {
    let active = true
    import('../utils/userStorage').then(({ getCustomBackground }) => {
      getCustomBackground(id).then(blob => {
        if (active && blob) {
          setUrl(URL.createObjectURL(blob))
        }
      })
    })
    return () => (active = false)
  }, [id])

  if (!url) return <div className="fixed inset-0 z-[-1] bg-black/90" />

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
      <img
        src={url}
        alt="Custom Background"
        className="w-full h-full object-cover animate-in fade-in duration-700"
      />
      {backgroundOverlay && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background: dark
              ? `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.2), transparent 40%), 
                  radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 40%),
                  linear-gradient(to bottom, #050505, #121212, #0a0a0a)`
              : `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.15), transparent 25%), 
                  radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.1), transparent 25%),
                  linear-gradient(to bottom, #0f0c29, #302b63, #24243e)`,
            overflow: 'hidden',
            opacity: overlayOpacity,
          }}
        />
      )}
      {dark && !backgroundOverlay && <div className="absolute inset-0 bg-black/40" />}
    </div>
  )
}
