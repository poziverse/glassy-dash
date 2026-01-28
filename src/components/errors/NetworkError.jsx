/**
 * NetworkError Component
 * Displays a user-friendly error message for network connectivity issues
 * Part of Phase 2: Enhanced Error Handling Architecture
 */

import { WifiOff, RefreshCw, Home } from 'lucide-react'

export default function NetworkError({ error, onRetry, onHome }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mb-6">
        <WifiOff className="text-orange-400" size={32} />
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">
        Connection Problem
      </h2>

      <p className="text-gray-400 mb-6 max-w-md">
        {error?.message || 'Unable to connect to the server. Please check your internet connection and try again.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        )}

        {onHome && (
          <button
            onClick={onHome}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 text-gray-300 transition-colors"
          >
            <Home size={18} />
            Go to Home
          </button>
        )}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10 max-w-md text-left">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Troubleshooting Tips:</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Check your internet connection</li>
          <li>• Try refreshing the page</li>
          <li>• If the problem persists, contact support</li>
        </ul>
      </div>
    </div>
  )
}