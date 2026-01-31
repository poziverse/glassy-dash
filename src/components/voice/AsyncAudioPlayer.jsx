import React, { useState, useEffect } from 'react'
import { Play } from 'lucide-react'
import { useVoiceStore } from '../../stores/voiceStore'
import MinimalPlaybackControls from './PlaybackControls'

/**
 * Wrapper for MinimalPlaybackControls that loads audio asynchronously (IndexedDB)
 * Handles loading state and errors gracefully.
 * Lazy loads on hover/interaction to improve performance in lists.
 */
export default function AsyncMinimalPlaybackControls({
  recordingId,
  audioDataFallback,
  className = '',
}) {
  const { getRecordingAudioUrl } = useVoiceStore()
  const [audioUrl, setAudioUrl] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Initialize with fallback if available immediately
  useEffect(() => {
    if (audioDataFallback) {
      setAudioUrl(`data:audio/webm;base64,${audioDataFallback}`)
    }
  }, [audioDataFallback])

  // Cleanup blob URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      // Only revoke if it's a blob url we created (not the data uri fallback)
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const loadAudio = () => {
    if (!audioUrl && !isLoading && !hasError) {
      setIsLoading(true)
      getRecordingAudioUrl(recordingId)
        .then(url => {
          if (url) {
            setAudioUrl(url)
          } else {
            setHasError(true)
          }
        })
        .catch(err => {
          console.error('Failed to load audio for preview:', err)
          setHasError(true)
        })
        .finally(() => setIsLoading(false))
    }
  }

  // If we have a URL, show controls
  if (audioUrl) {
    return (
      <MinimalPlaybackControls 
        audioUrl={audioUrl} 
        playbackId={recordingId} 
        className={className} 
      />
    )
  }

  // If loading or waiting to load (show placeholder that triggers load on hover)
  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      onMouseEnter={loadAudio}
      onTouchStart={loadAudio}
      onClick={e => {
        e.stopPropagation()
        loadAudio()
      }}
    >
      <button
        className="p-2 hover:bg-white/10 rounded-lg transition-colors relative"
        disabled={isLoading || hasError}
        title={hasError ? 'Audio unavailable' : 'Load audio'}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Play size={16} className={hasError ? 'text-red-500 opacity-50' : 'text-gray-400'} />
        )}
      </button>

      {/* Ghost progress bar */}
      <div className="flex-1 min-w-0 h-1.5 bg-white/10 rounded-full w-24"></div>
    </div>
  )
}
