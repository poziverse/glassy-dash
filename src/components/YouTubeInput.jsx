import React, { useState, useCallback } from 'react'
import { parseYouTubeUrl, getYouTubeThumbnails, createYouTubeNoteContent } from '../utils/youtube'
import { api } from '../lib/api'

/**
 * YouTubeInput - URL input with automatic metadata fetching
 * Used in Composer when creating YouTube note type
 */
export function YouTubeInput({ value, onChange, onMetadataFetched }) {
  const [url, setUrl] = useState(value?.url || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(value || null)

  const handleUrlChange = useCallback(
    async inputUrl => {
      setUrl(inputUrl)
      setError(null)

      // Parse URL to extract video ID
      const parsed = parseYouTubeUrl(inputUrl)
      if (!parsed) {
        if (inputUrl.trim()) {
          setError('Please enter a valid YouTube URL')
        }
        setPreview(null)
        onChange(null)
        return
      }

      // Show immediate preview with thumbnail (before metadata loads)
      const quickPreview = createYouTubeNoteContent(parsed.videoId, inputUrl, {
        title: 'Loading...',
        channelName: '',
      })
      setPreview(quickPreview)

      // Fetch full metadata from our server proxy
      setLoading(true)
      try {
        const metadata = await api(`/youtube/metadata/${parsed.videoId}`)
        const fullData = createYouTubeNoteContent(parsed.videoId, inputUrl, {
          title: metadata.title,
          channelName: metadata.channelName,
        })
        setPreview(fullData)
        onChange(fullData)
        onMetadataFetched?.(fullData)
      } catch (err) {
        // Use basic data without metadata if fetch fails
        const basicData = createYouTubeNoteContent(parsed.videoId, inputUrl)
        setPreview(basicData)
        onChange(basicData)
      } finally {
        setLoading(false)
      }
    },
    [onChange, onMetadataFetched]
  )

  return (
    <div className="youtube-input space-y-4">
      {/* URL Input */}
      <div className="relative">
        <input
          type="url"
          value={url}
          onChange={e => handleUrlChange(e.target.value)}
          placeholder="Paste YouTube URL (youtube.com/watch?v=... or youtu.be/...)"
          className="w-full bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:border-red-500 dark:focus:border-red-500 focus:outline-none p-3 pr-12 text-base transition-colors"
        />
        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {/* YouTube icon */}
        {!loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Video Preview */}
      {preview && (
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-black">
            <img
              src={preview.thumbnail}
              alt={preview.title}
              className="w-full h-full object-cover"
              onError={e => {
                // Fallback to lower quality thumbnail
                e.target.src = getYouTubeThumbnails(preview.videoId).high
              }}
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-11 bg-red-600 rounded-xl flex items-center justify-center opacity-90 shadow-lg">
                <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
          {/* Video info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800">
            <p className="font-semibold truncate">{preview.title}</p>
            {preview.channelName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                {preview.channelName}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default YouTubeInput
