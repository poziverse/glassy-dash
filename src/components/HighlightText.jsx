import React from 'react'

/**
 * HighlightText Component
 * Renders text with highlighted sections based on Fuse.js indices
 *
 * @param {string} text - The original text to render
 * @param {Array<[number, number]>} indices - Array of [start, end] indices to highlight
 * @param {string} className - Optional base class name
 */
export function HighlightText({ text, indices, className = '' }) {
  if (!text) return null
  if (!indices || indices.length === 0) return <span className={className}>{text}</span>

  const parts = []
  let lastIndex = 0

  // Merge overlapping or adjacent indices to prevent fragmented highlighting
  const sortedIndices = [...indices].sort((a, b) => a[0] - b[0])
  const mergedIndices = []

  if (sortedIndices.length > 0) {
    let current = sortedIndices[0]

    for (let i = 1; i < sortedIndices.length; i++) {
      const next = sortedIndices[i]
      // Check overlap or adjacency (Fuse indices are inclusive)
      // If next starts before or immediately after current ends (e.g. [0,0] and [1,1] should merge)
      if (next[0] <= current[1] + 1) {
        current = [current[0], Math.max(current[1], next[1])]
      } else {
        mergedIndices.push(current)
        current = next
      }
    }
    mergedIndices.push(current)
  }

  mergedIndices.forEach(([start, end], i) => {
    // Text before the match
    if (start > lastIndex) {
      parts.push(
        <span key={`text-${i}`} className={className}>
          {text.substring(lastIndex, start)}
        </span>
      )
    }

    // The matched text
    // Fuse indices are inclusive: [start, end]
    parts.push(
      <mark
        key={`mark-${i}`}
        className="bg-yellow-500/30 text-yellow-200 rounded px-0.5 mx-px font-medium"
      >
        {text.substring(start, end + 1)}
      </mark>
    )

    lastIndex = end + 1
  })

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key="text-end" className={className}>
        {text.substring(lastIndex)}
      </span>
    )
  }

  return <>{parts}</>
}
