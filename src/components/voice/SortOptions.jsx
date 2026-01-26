import React from 'react'
import { ArrowUpDown, Calendar, Clock, FileText, HardDrive } from 'lucide-react'

/**
 * Sort options component
 */
export default function SortOptions({ 
  sortBy, 
  sortOrder, 
  onChange,
  className = ''
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm text-gray-400">Sort by:</label>
      
      <select
        value={sortBy}
        onChange={(e) => onChange(e.target.value, sortOrder)}
        className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white focus:outline-none focus:border-indigo-500/50"
      >
        <option value="date">Date</option>
        <option value="duration">Duration</option>
        <option value="title">Title</option>
        <option value="size">Size</option>
      </select>
      
      <button
        onClick={() => onChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sortOrder === 'asc' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  )
}

/**
 * Compact sort options (for mobile or tight spaces)
 */
export function CompactSortOptions({ 
  sortBy, 
  sortOrder, 
  onChange,
  className = ''
}) {
  const options = [
    { id: 'date', label: 'Date', icon: Calendar },
    { id: 'duration', label: 'Duration', icon: Clock },
    { id: 'title', label: 'Title', icon: FileText },
    { id: 'size', label: 'Size', icon: HardDrive }
  ]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {options.map(option => {
        const Icon = option.icon
        const isActive = sortBy === option.id
        
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id, sortOrder)}
            className={`
              flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all
              ${isActive 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }
            `}
            title={`Sort by ${option.label}`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline text-sm font-medium">
              {option.label}
            </span>
            {isActive && (
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="w-3 h-3 ml-1"
              >
                {sortOrder === 'asc' ? (
                  <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
                ) : (
                  <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                )}
              </svg>
            )}
          </button>
        )
      })}
      
      {/* Sort order toggle */}
      <button
        onClick={() => onChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
        className="p-2 rounded-lg bg-white/10 text-gray-400 hover:bg-white/20 transition-colors"
        title={`Toggle order (${sortOrder === 'asc' ? 'Ascending' : 'Descending'})`}
      >
        <ArrowUpDown size={16} />
      </button>
    </div>
  )
}

/**
 * Sort dropdown (for space-constrained layouts)
 */
export function SortDropdown({ 
  sortBy, 
  sortOrder, 
  onChange,
  className = ''
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const options = [
    { id: 'date', label: 'Date (Newest First)', order: 'desc' },
    { id: 'date', label: 'Date (Oldest First)', order: 'asc' },
    { id: 'duration', label: 'Duration (Longest First)', order: 'desc' },
    { id: 'duration', label: 'Duration (Shortest First)', order: 'asc' },
    { id: 'title', label: 'Title (A-Z)', order: 'asc' },
    { id: 'title', label: 'Title (Z-A)', order: 'desc' },
    { id: 'size', label: 'Size (Largest First)', order: 'desc' },
    { id: 'size', label: 'Size (Smallest First)', order: 'asc' }
  ]

  const currentOption = options.find(o => o.id === sortBy && o.order === sortOrder)
  const currentLabel = currentOption?.label || 'Sort by'

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
      >
        <ArrowUpDown size={16} />
        <span>{currentLabel}</span>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-gray-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
            <div className="p-2">
              {options.map((option, index) => {
                const isActive = option.id === sortBy && option.order === sortOrder
                
                return (
                  <button
                    key={`${option.id}-${option.order}-${index}`}
                    onClick={() => {
                      onChange(option.id, option.order)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                      ${isActive 
                        ? 'bg-indigo-600 text-white' 
                        : 'text-gray-300 hover:bg-white/10'
                      }
                    `}
                  >
                    {option.label}
                    {isActive && (
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        className="w-4 h-4 ml-2 inline"
                      >
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}