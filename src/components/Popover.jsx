import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Popover Component
 * Renders content in a portal positioned relative to an anchor element
 * Automatically adjusts position to keep content visible in viewport
 */
export function Popover({ anchorRef, open, onClose, children, offset = 8 }) {
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const boxRef = useRef(null)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const a = anchorRef?.current
      if (!a) return
      const r = a.getBoundingClientRect()
      let top = r.bottom + offset
      let left = r.left
      setPos({ top, left })
      requestAnimationFrame(() => {
        const el = boxRef.current
        if (!el) return
        const bw = el.offsetWidth
        const bh = el.offsetHeight
        let t = top
        // Center horizontally relative to anchor
        let l = r.left + r.width / 2 - bw / 2

        const vw = window.innerWidth
        const vh = window.innerHeight

        // Clamp to viewport
        l = Math.max(8, Math.min(l, vw - bw - 8))

        if (t + bh + 8 > vh) {
          t = Math.max(8, r.top - bh - offset)
        }
        setPos({ top: t, left: l })
      })
    }
    place()
    const onWin = () => place()
    window.addEventListener('scroll', onWin, true)
    window.addEventListener('resize', onWin)
    return () => {
      window.removeEventListener('scroll', onWin, true)
      window.removeEventListener('resize', onWin)
    }
  }, [open, anchorRef, offset])

  useEffect(() => {
    if (!open) return
    const onDown = e => {
      const el = boxRef.current
      const a = anchorRef?.current
      if (el && el.contains(e.target)) return
      if (a && a.contains(e.target)) return

      // Allow interaction with other popovers (nesting support)
      if (
        e.target &&
        typeof e.target.closest === 'function' &&
        e.target.closest('[data-glass-popover]')
      )
        return

      onClose?.()
    }
    document.addEventListener('mousedown', onDown, true) // useCapture: true
    return () => document.removeEventListener('mousedown', onDown, true)
  }, [open, onClose, anchorRef])

  if (!open) return null
  return createPortal(
    <div
      ref={boxRef}
      data-glass-popover="true"
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 99999 }}
    >
      {children}
    </div>,
    document.body
  )
}

export default Popover
