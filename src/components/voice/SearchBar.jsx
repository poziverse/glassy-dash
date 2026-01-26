import React, { useState, useRef, useEffect } from 'react'
import { Search, X, Filter, Calendar, Clock, ArrowUpDown, ChevronDown } from 'lucide-react'
import { useVoiceStore } from '../../stores/voiceStore'
import { fuzzySearch, debounce } from '../../utils/voiceSearch'

/**
 * Advanced search bar with filters
 */
export default function SearchBar({ 
  className = '',
  onSearchChange,
  onFiltersChange 
}) {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  
  const [filters, setFilters] = useState({
    dateRange: null,
    duration: null,
    type: null,
    tags: []
  })
  
  const searchInputRef = useRef(null)

  // Debounced search
  const debouncedSearch = useRef(debounce((searchQuery) => {
    if (onSearchChange) {
      onSearchChange(searchQuery, filters)
    }
  }, 300))

  // Handle search input
  const handleSearch = (value) => {
    setQuery(value)
    debouncedSearch.current(value)
    
    // Save to recent searches
    if (value.length > 2 && value !== query) {
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s.toLowerCase() !== value.toLowerCase())
        return [value, ...filtered].slice(0, 5)
      })
    }
  }

  // Clear search
  const handleClear = () => {
    setQuery('')
    debouncedSearch.current('')
    searchInputRef.current?.focus()
  }

  // Update filters
  const updateFilters = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange?.(updatedFilters)
    debouncedSearch.current(query)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape' && query) {
        handleClear()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [query])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
          size={20} 
        />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search recordings... (Ctrl+F)"
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            title="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Recent Searches */}
      {query === '' && recentSearches.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">
            Recent Searches
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map(search => (
              <button
                key={search}
                onClick={() => handleSearch(search)}
                className="px-3 py-1.5 rounded-full bg-white/10 text-sm text-gray-300 hover:bg-white/20 hover:text-white transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <Filter size={16} />
        {showFilters ? 'Hide Filters' : 'Show Filters'}
        {showFilters && <ChevronDown size={16} className="rotate-180" />}
      </button>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel 
          filters={filters}
          onChange={updateFilters}
          onClear={() => {
            const clearedFilters = {
              dateRange: null,
              duration: null,
              type: null,
              tags: []
            }
            setFilters(clearedFilters)
            onFiltersChange?.(clearedFilters)
          }}
        />
      )}
    </div>
  )
}

/**
 * Filter panel with all filter options
 */
function FilterPanel({ filters, onChange, onClear }) {
  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
      {/* Date Range */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Calendar size={16} />
          Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filters.dateRange?.start?.toISOString().split('T')[0] || ''}
            onChange={(e) => onChange({
              dateRange: { 
                ...filters.dateRange, 
                start: e.target.value ? new Date(e.target.value) : null 
              }
            })}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50"
          />
          <input
            type="date"
            value={filters.dateRange?.end?.toISOString().split('T')[0] || ''}
            onChange={(e) => onChange({
              dateRange: { 
                ...filters.dateRange, 
                end: e.target.value ? new Date(e.target.value) : null 
              }
            })}
            className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Clock size={16} />
          Duration (seconds)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.duration?.min || ''}
            onChange={(e) => onChange({
              duration: { 
                ...filters.duration, 
                min: e.target.value ? parseInt(e.target.value) : null 
              }
            })}
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.duration?.max || ''}
            onChange={(e) => onChange({
              duration: { 
                ...filters.duration, 
                max: e.target.value ? parseInt(e.target.value) : null 
              }
            })}
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Type */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <ArrowUpDown size={16} />
          Type
        </label>
        <select
          value={filters.type || 'all'}
          onChange={(e) => onChange({ 
            type: e.target.value === 'all' ? null : e.target.value 
          })}
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50"
        >
          <option value="all">All Types</option>
          <option value="notes">Notes Only</option>
          <option value="gallery">Gallery Only</option>
        </select>
      </div>

      {/* Clear Filters Button */}
      <button
        onClick={onClear}
        className="w-full py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  )
}

/**
 * Compact search bar (for mobile or inline use)
 */
export function CompactSearchBar({ 
  className = '',
  onSearchChange 
}) {
  const [query, setQuery] = useState('')

  const handleSearch = debounce((value) => {
    onSearchChange?.(value)
  }, 300)

  return (
    <div className={`relative ${className}`}>
      <Search 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
        size={18} 
      />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          handleSearch(e.target.value)
        }}
        placeholder="Search..."
        className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 text-sm"
      />
      {query && (
        <button
          onClick={() => {
            setQuery('')
            onSearchChange?.('')
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}