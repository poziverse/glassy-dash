import React from 'react'
import { Mic, Search, Tag, Plus, ArrowUp } from 'lucide-react'

/**
 * Empty state component with different variants
 */
export default function EmptyState({ 
  type = 'noRecordings',
  onAction,
  className = ''
}) {
  const states = {
    noRecordings: {
      icon: <Mic size={48} className="text-gray-600" />,
      title: "No recordings yet",
      description: "Start recording to create your first voice note. Your recordings will appear here.",
      action: "Start Recording",
      actionIcon: <Mic size={16} />
    },
    noResults: {
      icon: <Search size={48} className="text-gray-600" />,
      title: "No results found",
      description: "We couldn't find any recordings matching your search. Try adjusting your filters or search terms.",
      action: "Clear Filters",
      actionIcon: <X size={16} />
    },
    noTags: {
      icon: <Tag size={48} className="text-gray-600" />,
      title: "No tags yet",
      description: "Create tags to organize your recordings. Tags help you filter and find recordings quickly.",
      action: "Create Tag",
      actionIcon: <Plus size={16} />
    },
    noRecordingsInType: {
      icon: <Mic size={48} className="text-gray-600" />,
      title: "No recordings here",
      description: "There are no recordings of this type yet. Record some and save them here.",
      action: "Start Recording",
      actionIcon: <Mic size={16} />
    }
  }

  const state = states[type] || states.noRecordings

  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="mb-4 text-gray-700 animate-in fade-in duration-500">
        {state.icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2 animate-in slide-in-from-bottom-2 fade-in duration-500">
        {state.title}
      </h3>
      <p className="text-gray-400 mb-6 max-w-md animate-in slide-in-from-bottom-2 fade-in duration-500 delay-100">
        {state.description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all transform hover:scale-105 active:scale-95 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-200"
        >
          {state.actionIcon}
          {state.action}
        </button>
      )}
    </div>
  )
}

/**
 * Compact empty state (for smaller spaces)
 */
export function CompactEmptyState({ 
  type = 'noRecordings',
  className = ''
}) {
  const states = {
    noRecordings: {
      icon: <Mic size={32} className="text-gray-600" />,
      text: "No recordings yet"
    },
    noResults: {
      icon: <Search size={32} className="text-gray-600" />,
      text: "No results found"
    }
  }

  const state = states[type] || states.noRecordings

  return (
    <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
      <div className="mb-3 text-gray-700">
        {state.icon}
      </div>
      <p className="text-sm text-gray-400">
        {state.text}
      </p>
    </div>
  )
}

/**
 * Loading skeleton for recordings
 */
export function RecordingCardSkeleton({ view = 'grid' }) {
  if (view === 'grid') {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/10 rounded w-1/2 mb-4" />
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-white/10 rounded" />
          <div className="h-3 bg-white/10 rounded w-5/6" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-white/10 rounded flex-1" />
          <div className="h-8 bg-white/10 rounded w-20" />
        </div>
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
        <div className="w-5 h-5 rounded bg-white/10 flex-shrink-0" />
        <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-1/3" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
        <div className="w-20 h-5 bg-white/10 rounded flex-shrink-0" />
      </div>
    )
  }

  if (view === 'timeline') {
    return (
      <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse">
        <div className="w-5 h-5 rounded bg-white/10 flex-shrink-0" />
        <div className="w-16 h-4 bg-white/10 rounded flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="h-3 bg-white/10 rounded w-3/4" />
        </div>
        <div className="w-32 h-8 bg-white/10 rounded flex-shrink-0" />
      </div>
    )
  }

  return null
}

/**
 * Loading state with multiple skeletons
 */
export function LoadingState({ 
  count = 6, 
  view = 'grid',
  className = ''
}) {
  return (
    <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
      {Array.from({ length: count }).map((_, index) => (
        <RecordingCardSkeleton 
          key={index} 
          view={view} 
        />
      ))}
    </div>
  )
}

/**
 * Inline loading indicator
 */
export function InlineLoading({ 
  text = 'Loading...',
  className = ''
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      <span className="text-sm text-gray-400">{text}</span>
    </div>
  )
}

/**
 * Centered loading spinner
 */
export function CenteredLoading({ 
  text = 'Loading...',
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-400">{text}</p>
    </div>
  )
}

/**
 * Empty search results with suggestions
 */
export function EmptySearchResults({ 
  searchQuery,
  onClear,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="mb-4 text-gray-700">
        <Search size={48} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        No results for "{searchQuery}"
      </h3>
      <p className="text-gray-400 mb-6 max-w-md">
        Try checking your spelling, using different search terms, or clearing your filters.
      </p>
      <button
        onClick={onClear}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
      >
        <ArrowUp size={16} />
        Clear Search
      </button>
    </div>
  )
}