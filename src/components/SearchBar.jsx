import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * SearchBar Component
 * Handles search input with optional AI search integration
 */
export function SearchBar({
  value,
  onChange,
  onAiSearch,
  localAiEnabled,
  dark,
  placeholder = "Search..."
}) {
  return (
    <div className="relative w-full max-w-lg">
      <input
        type="text"
        placeholder={localAiEnabled ? "Search or Ask AI..." : placeholder}
        className={`w-full bg-transparent border border-[var(--border-light)] rounded-lg pl-4 ${localAiEnabled ? 'pr-14' : 'pr-8'} py-2 focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 dark:placeholder-gray-400`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && localAiEnabled && value.trim().length > 0) {
            onAiSearch?.(value);
          }
        }}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {localAiEnabled && value.trim().length > 0 && (
          <button
            type="button"
            title="Ask AI"
            className="h-7 w-7 rounded-full flex items-center justify-center text-accent hover:bg-accent/10 transition-colors"
            onClick={() => onAiSearch?.(value)}
          >
            <Sparkles size={16} />
          </button>
        )}
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            className="h-6 w-6 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
            onClick={() => onChange("")}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
