import React from 'react'
import { Grid2x2, List, Clock, LayoutGrid } from 'lucide-react'
import { useVoiceStore } from '../../stores/voiceStore'

/**
 * View toggle component for switching between grid, list, and timeline views
 */
export default function ViewToggle() {
  const { galleryViewMode, setGalleryViewMode } = useVoiceStore()

  const views = [
    { id: 'grid', icon: Grid2x2, label: 'Grid View' },
    { id: 'list', icon: List, label: 'List View' },
    { id: 'timeline', icon: Clock, label: 'Timeline View' }
  ]

  return (
    <div className="flex bg-white/10 rounded-lg p-1">
      {views.map((view) => {
        const Icon = view.icon
        const isActive = galleryViewMode === view.id
        
        return (
          <button
            key={view.id}
            onClick={() => setGalleryViewMode(view.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all
              ${isActive 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
              }
            `}
            title={view.label}
          >
            <Icon size={18} />
            <span className="hidden sm:inline text-sm font-medium">
              {view.id.charAt(0).toUpperCase() + view.id.slice(1)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Compact view toggle (icon-only, suitable for mobile or tight spaces)
 */
export function CompactViewToggle({ className = '' }) {
  const { galleryViewMode, setGalleryViewMode } = useVoiceStore()

  const views = [
    { id: 'grid', icon: Grid2x2, label: 'Grid' },
    { id: 'list', icon: List, label: 'List' },
    { id: 'timeline', icon: Clock, label: 'Timeline' }
  ]

  return (
    <div className={`flex bg-white/10 rounded-lg p-1 ${className}`}>
      {views.map((view) => {
        const Icon = view.icon
        const isActive = galleryViewMode === view.id
        
        return (
          <button
            key={view.id}
            onClick={() => setGalleryViewMode(view.id)}
            className={`
              p-2 rounded-lg transition-all
              ${isActive 
                ? 'bg-indigo-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
              }
            `}
            title={view.label}
          >
            <Icon size={16} />
          </button>
        )
      })}
    </div>
  )
}

/**
 * View mode indicator (read-only, shows current view)
 */
export function ViewModeIndicator({ className = '' }) {
  const { galleryViewMode } = useVoiceStore()

  const viewConfig = {
    grid: { icon: Grid2x2, label: 'Grid View' },
    list: { icon: List, label: 'List View' },
    timeline: { icon: Clock, label: 'Timeline View' }
  }

  const { Icon, label } = viewConfig[galleryViewMode] || viewConfig.grid

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-400 ${className}`}>
      <Icon size={16} />
      <span>{label}</span>
    </div>
  )
}