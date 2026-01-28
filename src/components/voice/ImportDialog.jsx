import React from 'react'
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react'

/**
 * ImportDialog component for Voice Studio
 * Displays progress and results of the import process
 */
export default function ImportDialog({ isOpen, onClose, results, isProcessing }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md glass-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {isProcessing ? 'Importing Recordings...' : 'Import Results'}
            </h3>
            {!isProcessing && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {isProcessing ? (
            <div className="py-8 text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400">
                Processing files. This might take a moment if you're importing many recordings.
              </p>
            </div>
          ) : results ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-400">
                    {results.importedCount} Imported
                  </div>
                  <div className="text-xs text-emerald-400/70">
                    Successfully added to your gallery
                  </div>
                </div>
              </div>

              {results.skippedCount > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Info size={24} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-400">
                      {results.skippedCount} Skipped
                    </div>
                    <div className="text-xs text-amber-400/70">Already exist in your gallery</div>
                  </div>
                </div>
              )}

              {results.errorCount > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-400">
                      {results.errorCount} Failed
                    </div>
                    <div className="text-xs text-red-400/70">Malformed or invalid JSON data</div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Something went wrong. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
