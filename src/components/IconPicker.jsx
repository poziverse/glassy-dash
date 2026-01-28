import React, { useState, useMemo, memo } from 'react'
import * as LucideIcons from 'lucide-react'

const ICON_NAMES = Object.keys(LucideIcons).filter(
  name => name !== 'default' && name !== 'createLucideIcon'
)

const POPULAR_ICONS = [
  'Star',
  'Heart',
  'User',
  'Settings',
  'Menu',
  'Home',
  'Search',
  'Bell',
  'Calendar',
  'Camera',
  'Mail',
  'Trash',
  'Edit',
  'Plus',
  'Minus',
  'Check',
  'X',
  'ArrowRight',
  'ArrowLeft',
  'ChevronDown',
  'ChevronUp',
  'ChevronLeft',
  'ChevronRight',
  'Download',
  'Upload',
  'Share',
  'Copy',
  'Save',
  'File',
  'Folder',
  'Image',
  'Link',
  'List',
  'Grid',
  'Clock',
  'MapPin',
  'Tag',
  'Lock',
  'Unlock',
  'Phone',
  'MessageCircle',
  'AlertCircle',
  'Info',
  'HelpCircle',
  'MoreHorizontal',
  'MoreVertical',
]

// Filter valid icons ensuring they exist in Lucide
const VALID_POPULAR_ICONS = POPULAR_ICONS.filter(name => ICON_NAMES.includes(name))

// Memoized Icon Item to prevent re-renders
const IconItem = memo(({ name, onClick }) => {
  const Icon = LucideIcons[name]
  if (!Icon) return null

  return (
    <button
      className="p-2 rounded hover:bg-white/10 flex flex-col items-center gap-1 transition-colors"
      onClick={() => onClick(name)}
      title={name}
    >
      <Icon size={20} />
    </button>
  )
})

export function IconPicker({ onSelect }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return VALID_POPULAR_ICONS
    return ICON_NAMES.filter(n => n.toLowerCase().includes(q)).slice(0, 100)
  }, [search])

  return (
    <div className="w-[320px] h-[400px] flex flex-col bg-gray-800 text-white rounded-lg overflow-hidden border border-gray-700 shadow-xl">
      <div className="p-3 border-b border-gray-700 search-wrapper">
        <input
          autoFocus
          className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-600 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Search icons (e.g. star, user)..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <div className="grid grid-cols-5 gap-1">
          {filtered.map(name => (
            <IconItem key={name} name={name} onClick={onSelect} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-4 text-sm">No icons found</div>
        )}
      </div>

      <div className="p-2 bg-gray-900/50 text-xs text-center text-gray-500 border-t border-gray-700">
        Premium Icons via Lucide
      </div>
    </div>
  )
}
