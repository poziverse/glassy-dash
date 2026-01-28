/**
 * AudioError Component
 * Displays user-friendly error message for audio/recording issues
 * Part of Phase 2: Enhanced Error Handling Architecture
 */

import { MicOff, RefreshCw, X } from 'lucide-react'

export default function AudioError({ error, onRetry, onDismiss }) {
  return (
    <div className="relative p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <MicOff size={20} className="flex-shrink-0" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Audio Recording Error</h3>
          <p className="text-sm opacity-90">
            {error?.message || 'Unable to access microphone or record audio.'}
          </p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-red-500/20 transition-colors"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {onRetry && (
        <div className="mt-3 pt-3 border-t border-red-500/20">
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} />
            Try Recording Again
          </button>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-red-500/20">
        <h4 className="text-xs font-semibold mb-2">Common Solutions:</h4>
        <ul className="text-xs space-y-1 opacity-90">
          <li>• Grant microphone permissions in browser settings</li>
          <li>• Check that no other app is using the microphone</li>
          <li>• Try using a different browser</li>
          <li>• Ensure your device has a working microphone</li>
        </ul>
      </div>
    </div>
  )
}