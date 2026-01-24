import React, { useState, useMemo, memo } from 'react'
import * as LucideIcons from 'lucide-react'

const ICON_NAMES = Object.keys(LucideIcons).filter(
  name => name !== 'default' && name !== 'createLucideIcon'
)

// Memoized Icon Item to prevent re-renders
const IconItem = memo(({ name, onClick }) => {
  const Icon = LucideIcons[name]
  if (!Icon) return null

  return (
    <button
      className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10 flex flex-col items-center gap-1 transition-colors"
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
    if (!q) return ICON_NAMES.slice(0, 100) // Show top 100 default
    return ICON_NAMES.filter(n => n.toLowerCase().includes(q)).slice(0, 100) // Limit results
  }, [search])

  return (
    <div className="w-[320px] h-[400px] flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 search-wrapper">
        <input
          autoFocus
          className="w-full px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-900 border-none outline-none focus:ring-2 focus:ring-accent text-sm"
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
          <div className="text-center text-gray-500 py-4 text-sm">No icons found</div>
        )}
      </div>

      <div className="p-2 bg-gray-50 dark:bg-gray-900/50 text-xs text-center text-gray-500 border-t border-gray-200 dark:border-gray-700">
        Premium Icons via Lucide
      </div>
    </div>
  )
}
