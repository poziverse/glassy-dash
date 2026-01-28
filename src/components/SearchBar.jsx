import React from 'react'

/**
 * SearchBar Component
 * Handles search input for filtering notes
 */
export function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative w-full max-w-lg">
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-transparent border border-[var(--border-light)] rounded-lg pl-4 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 dark:placeholder-gray-400"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            className="h-6 w-6 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
            onClick={() => onChange('')}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
