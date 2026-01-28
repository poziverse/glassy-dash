import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react'
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
import { PinIcon, ArchiveIcon, CloseIcon } from './Icons'
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
  const overlayOpacity = useSettingsStore(state => state.overlayOpacity)

  const headerMenuOpen = useUIStore(state => state.headerMenuOpen)
  const setHeaderMenuOpen = useUIStore(state => state.setHeaderMenuOpen)
  const setSettingsPanelOpen = useUIStore(state => state.setSettingsPanelOpen)

  // Admin hooks logic moved to AdminView, but we might pass some status here if needed
  // For now, we only need to know if user is admin, which is on currentUser

  // --- Local State ---
  const [activeSection, setActiveSection] = useState('overview')
  const multiColorBtnRef = useRef(null)
  const [showMultiColorPop, setShowMultiColorPop] = useState(false)

  // Sorting state for archive
  const [sortBy, setSortBy] = useState('date-desc')

  // Sorted archived notes
  const sortedArchivedNotes = useMemo(() => {
    if (tagFilter !== 'ARCHIVED') return []

    return [...archivedNotes].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return (b.timestamp || 0) - (a.timestamp || 0)
      }
      if (sortBy === 'date-asc') {
        return (a.timestamp || 0) - (b.timestamp || 0)
      }
      if (sortBy === 'title-asc') {
        return (a.title || '').localeCompare(b.title || '')
      }
      if (sortBy === 'title-desc') {
        return (b.title || '').localeCompare(a.title || '')
      }
      if (sortBy === 'tag-asc' || sortBy === 'tag-desc') {
        const tagA = a.tags && a.tags.length > 0 ? a.tags[0] : ''
        const tagB = b.tags && b.tags.length > 0 ? b.tags[0] : ''

        // Notes without tags go to the bottom in both cases
        if (!tagA && tagB) return 1
        if (tagA && !tagB) return -1
        if (!tagA && !tagB) return 0

        if (sortBy === 'tag-asc') {
          return tagA.localeCompare(tagB)
        } else {
          return tagB.localeCompare(tagA)
        }
      }
      return 0
    })
  }, [archivedNotes, tagFilter, sortBy])

  // Ensure archive view is preserved when component mounts/remounts
  useEffect(() => {
    if (tagFilter === 'ARCHIVED' && activeSection !== 'overview') {
      setActiveSection('overview')
    }
  }, [tagFilter, activeSection])

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
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">Loading notes...</div>
        </div>
      }
    >
      <DashboardLayout
        activeSection={activeSection}
        onNavigate={section => {
          if (
            ['health', 'alerts', 'admin', 'docs', 'voice', 'trash', 'settings'].includes(section)
          ) {
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
        onOpenSettings={() => setSettingsPanelOpen(true)}
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

              {/* Composer (Create Note) - Only show if NOT archived */}
              {tagFilter !== 'ARCHIVED' && (
                <div className="px-4 sm:px-6 md:px-8 lg:px-12">
                  <div className="w-full">
                    <Composer />
                  </div>
                </div>
              )}

              {/* Notes Lists */}
              <main className="px-4 sm:px-6 md:px-8 lg:px-12 pb-12 mt-8">
                {/* ARCHIVED VIEW */}
                {tagFilter === 'ARCHIVED' && (
                  <section>
                    <div className="flex items-center justify-between mb-4 w-full">
                      <h2 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 ml-1">
                        Archived
                      </h2>

                      {/* Sorting Controls */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Sort by:</span>
                        <select
                          value={sortBy}
                          onChange={e => setSortBy(e.target.value)}
                          className="bg-white/50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs px-2 py-1 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-accent"
                        >
                          <option value="date-desc">Newest First</option>
                          <option value="date-asc">Oldest First</option>
                          <option value="title-asc">Title (A-Z)</option>
                          <option value="title-desc">Title (Z-A)</option>
                          <option value="tag-asc">Tag (A-Z)</option>
                          <option value="tag-desc">Tag (Z-A)</option>
                        </select>
                      </div>
                    </div>

                    <div className={listView ? 'w-full space-y-6' : 'masonry-grid'}>
                      {sortedArchivedNotes.length === 0 ? (
                        <p className="text-center text-gray-400 mt-8 col-span-full">
                          No archived notes.
                        </p>
                      ) : (
                        sortedArchivedNotes.map(n => (
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
                        <h2 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 ml-1 w-full">
                          Pinned
                        </h2>
                        <div className={listView ? 'w-full space-y-6' : 'masonry-grid'}>
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
                          <h2 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 ml-1 w-full">
                            Others
                          </h2>
                        )}
                        <div className={listView ? 'w-full space-y-6' : 'masonry-grid'}>
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
        </div>
      </DashboardLayout>
    </Suspense>
  )
}
