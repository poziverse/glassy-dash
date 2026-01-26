/**
 * ErrorMessage - Displays error messages with optional dismiss action
 * Part of Phase 6: Error Handling & Monitoring
 * Phase 6 Update: Added React.memo for performance optimization
 */

import { memo } from 'react'
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react'

function ErrorMessage({ message, type = 'error', onDismiss }) {
  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }

  const Icon = icons[type] || AlertCircle

  const colors = {
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  }

  return (
    <div className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${colors[type]}`}>
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Dismiss error"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export default memo(ErrorMessage)
