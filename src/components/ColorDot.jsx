import React from 'react'
import { bgFor, solid } from '../themes'

/**
 * ColorDot Component
 * A button that displays a color dot with optional selection indicator
 * Used in color picker interfaces
 *
 * Color definitions are imported from helpers.js to ensure consistency across the app
 */
export const ColorDot = ({ name, selected, onClick, darkMode }) => (
  <button
    type="button"
    onClick={onClick}
    title={name}
    className={`w-6 h-6 rounded-full border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${name === 'default' ? 'flex items-center justify-center' : ''} ${selected ? 'ring-2 ring-accent' : ''}`}
    style={{
      backgroundColor: name === 'default' ? 'transparent' : solid(bgFor(name, darkMode)),
      borderColor: name === 'default' ? '#d1d5db' : 'transparent',
    }}
  >
    {name === 'default' && (
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: darkMode ? '#1f2937' : '#fff' }}
      />
    )}
  </button>
)

export default ColorDot
