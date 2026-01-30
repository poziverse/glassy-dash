import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * MasonryLayout
 * A flexible masonry layout that distributes items into columns based on their order.
 * This ensures that items are added left-to-right, then down.
 * 
 * Uses framer-motion for smooth layout transitions when reordering.
 *
 * @param {Array} notes - The list of note objects to display
 * @param {Function} renderItem - Render prop that takes a note and returns JSX
 */
export function MasonryLayout({ notes = [], renderItem }) {
  const [columns, setColumns] = useState(4)

  // Breakpoints to generic column mapping
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth
      if (width >= 1200) setColumns(4) // lg -> xl
      else if (width >= 996) setColumns(3) // md -> lg
      else if (width >= 768) setColumns(2) // sm -> md
      else setColumns(1) // xs
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  // Distribute notes into columns
  const stats = useMemo(() => {
    const cols = Array.from({ length: columns }, () => [])
    notes.forEach((note, index) => {
      const colIndex = index % columns
      cols[colIndex].push(note)
    })
    return cols
  }, [notes, columns])

  return (
    <div className="flex w-full gap-6 items-start transition-all duration-300">
      {stats.map((colNotes, colIndex) => (
        <div key={colIndex} className="flex flex-col gap-6 flex-1 min-w-0">
          <AnimatePresence mode="popLayout">
            {colNotes.map(note => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                {renderItem ? renderItem(note) : null}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
