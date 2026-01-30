import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export function ContextMenu({ position, onClose, children, dark }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = event => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose()
      }
    }

    const handleScroll = () => onClose()

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  if (!position) return null

  // Adjust position to prevent overflow
  const style = {
    top: position.y,
    left: position.x,
  }

  // Simple adjustment if near right edge (assuming 200px width)
  if (position.x + 200 > window.innerWidth) {
    style.left = position.x - 200
  }

  // Simple adjustment if near bottom edge
  if (position.y + 300 > window.innerHeight) {
    style.top = position.y - 300
  }

  return createPortal(
    <div
      ref={menuRef}
      className={`fixed z-[9999] min-w-[180px] rounded-lg shadow-xl overflow-hidden border py-1 animate-in fade-in zoom-in-95 duration-100 ${
        dark
          ? 'bg-gray-800 border-gray-700 text-gray-200'
          : 'bg-white border-gray-200 text-gray-700'
      }`}
      style={style}
      onContextMenu={e => e.preventDefault()}
    >
      {children}
    </div>,
    document.body
  )
}

export function ContextMenuItem({ icon, label, onClick, danger, dark, disabled }) {
  return (
    <button
      className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : dark
            ? 'hover:bg-white/10'
            : 'hover:bg-gray-100'
      } ${danger ? 'text-red-500' : ''}`}
      onClick={e => {
        if (disabled) return
        e.stopPropagation()
        onClick()
      }}
      disabled={disabled}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
    </button>
  )
}

export function ContextMenuSeparator({ dark }) {
  return <div className={`h-px my-1 ${dark ? 'bg-gray-700' : 'bg-gray-200'}`} />
}
