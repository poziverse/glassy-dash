import React, { useState, memo } from 'react'
import { getEmbedUrl, getYouTubeThumbnails } from '../utils/youtube'
import { useSettings } from '../contexts/SettingsContext'

/**
 * YouTubeCard - Premium YouTube video embed notecard
 * Features:
 * - Lazy-loaded iframe (click to play for performance)
 * - High-quality thumbnail preview
 * - Picture-in-picture support
 * - Responsive 16:9 aspect ratio
 * - Dark mode support
 */
export const YouTubeCard = memo(function YouTubeCard({ data, isPreview = false, onError }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)
  const { dark } = useSettings()

  // Safely parse data with error handling
  let parsedData = null
  try {
    if (typeof data === 'string' && data.trim()) {
      parsedData = JSON.parse(data)
    } else if (typeof data === 'object' && data !== null) {
      parsedData = data
    }
  } catch (err) {
    console.error('YouTubeCard: Failed to parse data:', err.message)
    if (onError) onError(err)
  }

  const { videoId, title, channelName, embedSettings = {}, startTime } = parsedData || {}

  if (!videoId) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-sm text-red-600">
        Invalid YouTube video
      </div>
    )
  }

  const thumbnails = getYouTubeThumbnails(videoId)
  // Use fallback thumbnail if maxres fails (not all videos have maxres)
  const thumbnailSrc = thumbnailError ? thumbnails.high : thumbnails.maxres

  // Preview mode - compact thumbnail only (for NoteCard)
  if (isPreview) {
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
        <img
          src={thumbnailSrc}
          alt={title || 'YouTube video'}
          className="w-full h-full object-cover"
          onError={() => setThumbnailError(true)}
          loading="lazy"
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Title overlay */}
        {title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="text-white text-sm font-medium truncate">{title}</p>
            {channelName && <p className="text-gray-300 text-xs truncate">{channelName}</p>}
          </div>
        )}
      </div>
    )
  }

  // Full player mode (for Modal)
  return (
    <div className="youtube-player rounded-xl overflow-hidden shadow-lg">
      <div className="relative aspect-video bg-black">
        {!isPlaying ? (
          // Thumbnail with play button - click to load iframe
          <>
            <img
              src={thumbnailSrc}
              alt={title || 'YouTube video'}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setIsPlaying(true)}
              onError={() => setThumbnailError(true)}
            />
            <button
              onClick={() => setIsPlaying(true)}
              className="absolute inset-0 flex items-center justify-center group"
              aria-label="Play video"
            >
              <div className="w-20 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-200">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          </>
        ) : (
          // Embedded iframe player (loaded on click for performance)
          <iframe
            src={getEmbedUrl(videoId, {
              autoplay: true,
              startTime,
              ...embedSettings,
            })}
            title={title || 'YouTube video'}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>

      {/* Video info bar */}
      {title && (
        <div className={`p-4 ${dark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
          {channelName && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{channelName}</p>
          )}
        </div>
      )}
    </div>
  )
})

export default YouTubeCard
