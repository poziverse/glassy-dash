/**
 * Virtual Scroll Hook
 * Provides virtual scrolling for large lists using @tanstack/react-virtual
 * Only renders visible items + buffer for optimal performance
 */
import { useVirtualizer } from '@tanstack/react-virtual'

/**
 * Custom hook for virtual scrolling of note lists
 *
 * @param {Object} options - Hook options
 * @param {React.RefObject} options.containerRef - Ref to the scroll container
 * @param {Array} options.items - Array of items to virtualize
 * @param {number} options.estimateSize - Estimated height of each item (default: 200)
 * @param {number} options.overscan - Number of items to render outside viewport (default: 5)
 * @returns {Object} Virtual scroll state and helpers
 */
export function useVirtualScroll({ containerRef, items, estimateSize = 200, overscan = 5 }) {
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  return {
    // Virtual items to render (with index, start position, size)
    virtualItems: virtualizer.getVirtualItems(),

    // Total height needed for all items
    totalSize: virtualizer.getTotalSize(),

    // Function to measure actual element size after render
    measureElement: virtualizer.measureElement,

    // Scroll to a specific index
    scrollToIndex: virtualizer.scrollToIndex,

    // Get current scroll offset
    scrollOffset: virtualizer.scrollOffset,

    // Check if list is scrolling
    isScrolling: virtualizer.isScrolling,
  }
}

/**
 * Hook for horizontal virtual scrolling (e.g., image galleries)
 */
export function useHorizontalVirtualScroll({
  containerRef,
  items,
  estimateSize = 150,
  overscan = 3,
}) {
  const virtualizer = useVirtualizer({
    horizontal: true,
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateSize,
    overscan,
  })

  return {
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
    measureElement: virtualizer.measureElement,
  }
}
