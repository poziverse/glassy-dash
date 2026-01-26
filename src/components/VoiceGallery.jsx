import React, { useState, useEffect } from 'react'
import { useVoiceStore } from '../stores/voiceStore'
import { fuzzySearch, applyFilters, sortRecordings } from '../utils/voiceSearch'
import ViewToggle, { CompactViewToggle } from './voice/ViewToggle'
import SearchBar, { CompactSearchBar } from './voice/SearchBar'
import TagFilter from './voice/TagPicker'
import BulkActionsBar, { BulkDeleteConfirm } from './voice/BulkActionsBar'
import SortOptions from './voice/SortOptions'
import { GridView, ListView, TimelineView } from './voice/GalleryViews'
import EmptyState, { LoadingState } from './voice/EmptyState'
import EditRecordingModal from './voice/EditRecordingModal'

/**
 * Main Voice Gallery component with Phase 4 features
 */
export default function VoiceGallery({ type = 'all' }) {
  const {
    recordings,
    galleryViewMode,
    setGalleryViewMode,
    tags,
    selectedIds,
    setSelectedIds,
    clearSelectedIds,
    deleteRecording,
    bulkDelete,
    archiveRecordings
  } = useVoiceStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState({
    dateRange: null,
    duration: null,
    type: type === 'all' ? null : type,
    tags: []
  })
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editRecordingId, setEditRecordingId] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Filter and search recordings
  const filteredRecordings = React.useMemo(() => {
    let results = recordings

    // Apply type filter if specified
    if (type !== 'all') {
      results = results.filter(r => r.type === type)
    }

    // Apply search
    if (searchQuery) {
      results = fuzzySearch(results, searchQuery)
    }

    // Apply filters
    results = applyFilters(results, activeFilters)

    // Apply sorting
    results = sortRecordings(results, sortBy, sortOrder)

    return results
  }, [recordings, searchQuery, activeFilters, sortBy, sortOrder, type])

  // Handle search change
  const handleSearchChange = (query, filters) => {
    setSearchQuery(query)
    if (filters) {
      setActiveFilters(filters)
    }
    // Simulate loading for better UX
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 300)
  }

  // Handle filters change
  const handleFiltersChange = (filters) => {
    setActiveFilters(filters)
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 300)
  }

  // Handle sort change
  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  // Handle select/deselect recording
  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    setShowDeleteConfirm(true)
  }

  // Handle bulk archive
  const handleBulkArchive = () => {
    if (confirm(`Are you sure you want to archive ${selectedIds.length} recording(s)?`)) {
      archiveRecordings(selectedIds)
      clearSelectedIds()
    }
  }

  const confirmBulkDelete = () => {
    bulkDelete(selectedIds)
    setShowDeleteConfirm(false)
    clearSelectedIds()
  }

  // Handle edit recording
  const handleEditRecording = (id) => {
    setEditRecordingId(id)
    setShowEditModal(true)
  }

  // Handle save edit
  const handleSaveEdit = (id, updates, tags) => {
    console.log('Saved edit for recording:', id, updates, tags)
  }

  // Handle delete single recording
  const handleDeleteRecording = (id) => {
    if (confirm('Are you sure you want to delete this recording?')) {
      deleteRecording(id)
    }
  }

  // Render current view
  const renderCurrentView = () => {
    if (isLoading) {
      return <LoadingState view={galleryViewMode} />
    }

    if (filteredRecordings.length === 0) {
      if (searchQuery || Object.values(activeFilters).some(v => v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true))) {
        return (
          <EmptyState 
            type="noResults"
            onAction={() => {
              setSearchQuery('')
              setActiveFilters({ dateRange: null, duration: null, type: null, tags: [] })
            }}
          />
        )
      }
      return (
        <EmptyState 
          type="noRecordingsInType"
          onAction={() => {/* Navigate to recording view */}}
        />
      )
    }

    const viewProps = {
      recordings: filteredRecordings,
      selectedIds,
      onToggleSelect: handleToggleSelect,
      onEdit: handleEditRecording,
      onDelete: handleDeleteRecording
    }

    switch (galleryViewMode) {
      case 'grid':
        return <GridView {...viewProps} />
      case 'list':
        return <ListView {...viewProps} />
      case 'timeline':
        return <TimelineView {...viewProps} />
      default:
        return <GridView {...viewProps} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        {/* Title and Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {type === 'all' ? 'All Recordings' : type === 'notes' ? 'Voice Notes' : 'Voice Gallery'}
            </h1>
            <p className="text-sm text-gray-400">
              {filteredRecordings.length} {filteredRecordings.length === 1 ? 'recording' : 'recordings'}
              {searchQuery && ' matching search'}
            </p>
          </div>

          {/* View Toggle */}
          <div className="hidden sm:block">
            <ViewToggle />
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col gap-4">
          {/* Search and Sort */}
          <div className="flex gap-4">
            <div className="flex-1">
              <SearchBar 
                onSearchChange={handleSearchChange}
                onFiltersChange={handleFiltersChange}
              />
            </div>
            <div className="hidden lg:block">
              <SortOptions 
                sortBy={sortBy}
                sortOrder={sortOrder}
                onChange={handleSortChange}
              />
            </div>
          </div>

          {/* Tag Filter */}
          <TagFilter 
            activeTags={activeFilters.tags}
            onChange={(tags) => handleFiltersChange({ ...activeFilters, tags })}
            showClearButton={activeFilters.tags.length > 0}
          />
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="flex gap-2 lg:hidden">
        <CompactViewToggle className="flex-1" />
        <CompactSearchBar 
          className="flex-1"
          onSearchChange={handleSearchChange}
        />
      </div>

      {/* Recordings Grid */}
      {renderCurrentView()}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        onClear={clearSelectedIds}
        onDelete={handleBulkDelete}
        onArchive={handleBulkArchive}
        onMove={(ids, targetType) => {
          // Move recordings between notes and gallery
          const { bulkMove } = useVoiceStore.getState()
          bulkMove(ids, targetType)
        }}
        onAddTags={(ids) => {
          // Open bulk tag picker
          console.log('Add tags to:', ids)
        }}
        onRemoveTags={(ids) => {
          // Remove tags from selected recordings
          console.log('Remove tags from:', ids)
        }}
      />

      {/* Bulk Delete Confirmation */}
      <BulkDeleteConfirm
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        selectedIds={selectedIds}
      />

      {/* Edit Recording Modal */}
      <EditRecordingModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditRecordingId(null)
        }}
        recordingId={editRecordingId}
        onSave={handleSaveEdit}
      />
    </div>
  )
}

/**
 * Compact Voice Gallery (for embedding in other views)
 */
export function CompactVoiceGallery({ 
  type = 'all',
  limit = 10,
  showHeader = true 
}) {
  const {
    recordings,
    galleryViewMode,
    setGalleryViewMode,
    selectedIds,
    setSelectedIds
  } = useVoiceStore()

  const [searchQuery, setSearchQuery] = useState('')

  const filteredRecordings = React.useMemo(() => {
    let results = recordings

    if (type !== 'all') {
      results = results.filter(r => r.type === type)
    }

    if (searchQuery) {
      results = fuzzySearch(results, searchQuery)
    }

    return results.slice(0, limit)
  }, [recordings, searchQuery, type, limit])

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {type === 'all' ? 'Recent Recordings' : type === 'notes' ? 'Voice Notes' : 'Voice Gallery'}
          </h2>
          <CompactViewToggle />
        </div>
      )}

      <CompactSearchBar onSearchChange={setSearchQuery} />

      <GridView 
        recordings={filteredRecordings}
        selectedIds={selectedIds}
        onToggleSelect={(id) => {
          if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id))
          } else {
            setSelectedIds([...selectedIds, id])
          }
        }}
        onEdit={(id) => console.log('Edit:', id)}
        onDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  )
}