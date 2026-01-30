import React, { useState, useEffect } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { NoteCard } from './NoteCard'

const ResponsiveGridLayout = WidthProvider(Responsive)

export function GridLayout({
  notes,
  isReadOnly = false,
  onLayoutChange,
  multiMode,
  selectedIds,
  onToggleSelect,
  onDragStart,
  onDragOver,
  onDragDrop,
  onDragEnd,
}) {
  // Move generateLayout definition BEFORE useState
  const generateLayout = (notes, cols) => {
    return notes.map((n, i) => {
      const stored = n.layout && n.layout[cols] ? n.layout[cols] : null

      let w = 1
      let h = 1

      // Defaults
      if (n.type === 'youtube') {
        w = 2
        h = 2
      } else if (n.type === 'music') {
        w = 2
        h = 1
      }

      if (stored) {
        return {
          i: n.id,
          x: stored.x,
          y: stored.y,
          w: stored.w,
          h: stored.h,
          minW: 1,
          minH: 1,
        }
      }

      return {
        i: n.id,
        x: (i * w) % cols,
        y: Math.floor(i / cols) * h,
        w: w,
        h: h,
        minW: 1,
        minH: 1,
      }
    })
  }

  // Generate layout from notes
  const [currentLayouts, setCurrentLayouts] = useState(() => ({
    lg: generateLayout(notes, 4),
    md: generateLayout(notes, 3),
    sm: generateLayout(notes, 2),
    xs: generateLayout(notes, 1),
    xxs: generateLayout(notes, 1),
  }))

  // Sync with notes if added/removed
  useEffect(() => {
    const newLayouts = {
      lg: generateLayout(notes, 4),
      md: generateLayout(notes, 3),
      sm: generateLayout(notes, 2),
      xs: generateLayout(notes, 1),
      xxs: generateLayout(notes, 1),
    }
    setCurrentLayouts(newLayouts)
  }, [notes.map(n => n.id).join(','), notes.map(n => JSON.stringify(n.layout)).join(',')])

  // Update layouts when notes change length?
  // We need to be careful not to reset user drags.

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={currentLayouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
      rowHeight={100} // Base row height
      onLayoutChange={(layout, layouts) => {
        setCurrentLayouts(layouts)
        if (onLayoutChange) {
          // Transform layout back to a map of { [noteId]: { [breakpoint]: {x,y,w,h} } }
          // Only save if changed meaningfully
          onLayoutChange(layout, layouts)
        }
      }}
      isDraggable={!isReadOnly && !multiMode}
      isResizable={!isReadOnly && !multiMode}
      margin={[16, 16]}
      draggableCancel=".no-drag" // Add class to interactive elements in NoteCard if needed
    >
      {notes.map(n => (
        <div key={n.id} className="relative group">
          {/* Wrapper to handle visual style if needed */}
          <div className="h-full w-full">
            <NoteCard
              n={n}
              multiMode={multiMode}
              selected={selectedIds?.has(String(n.id))}
              onToggleSelect={onToggleSelect}
              disablePin={false}
              disableDrag={true}
            />
          </div>
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
