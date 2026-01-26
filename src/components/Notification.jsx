/**
 * Notification - Displays toast notifications with auto-dismiss
 * Part of Phase 6: Error Handling & Monitoring
 * Phase 6 Update: Added React.memo with custom comparison for performance optimization
 */

import { useState, useEffect, memo } from 'react'
import { X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'

function Notification({ type = 'success', message, duration = 3000, onDismiss }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Auto-dismiss after duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => onDismiss?.(), 300) // Wait for exit animation
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onDismiss])

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle
  }

  const colors = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
  }

  const Icon = icons[type] || CheckCircle2

  if (!visible) return null

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg text-sm flex items-start gap-3 max-w-md animate-in slide-in-from-right-5 ${colors[type]}`}
      role="alert"
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onDismiss?.(), 300)
        }}
        className="ml-auto flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Dismiss notification"
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default memo(Notification, (prevProps, nextProps) => {
  // Only re-render if type, message, or duration changes
  return (
    prevProps.type === nextProps.type &&
    prevProps.message === nextProps.message &&
    prevProps.duration === nextProps.duration
  )
})
