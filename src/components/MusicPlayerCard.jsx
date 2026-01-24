import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { getServiceConnector } from '../lib/musicServices'
import { useSettings } from '../contexts/SettingsContext'
import { useLogger } from '../utils/logger'

/**
 * MusicPlayerCard - Premium audio player for self-hosted music
 * Features:
 * - HTML5 Audio API with full controls
 * - Playlist Support (Albums)
 * - Progress bar with seek functionality
 * - Volume control
 * - Album art display
 * - Play/pause with keyboard support
 */
export const MusicPlayerCard = memo(function MusicPlayerCard({ data, isPreview = false }) {
  const audioRef = useRef(null)
  const logger = useLogger()

  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Playlist State
  const [playlist, setPlaylist] = useState([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaylistLoaded, setIsPlaylistLoaded] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false) // Toggle playlist view

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
    logger.error('music_player_parse_error', { dataLength: data?.length }, err)
    console.error('MusicPlayerCard: Failed to parse data:', err.message)
    setError('Failed to load track data')
  }

  // Deconstruct data (handle both legacy 'track' and new 'data/type' schema)
  const { service, serverUrl, credentials, playbackSettings } = parsedData || {}
  const type = parsedData?.type || 'track'
  // Legacy: parsedData.track exists. New: parsedData.data exists
  const initialData = parsedData?.data || parsedData?.track

  const connector = getServiceConnector(service)

  // Initialize Playlist
  useEffect(() => {
    if (!connector || !initialData) return

    const load = async () => {
      setError(null)
      setIsLoading(true)

      try {
        if (type === 'album') {
          // Fetch album tracks
          const tracks = await connector.getAlbumTracks(serverUrl, initialData.id, credentials)
          if (tracks.length > 0) {
            setPlaylist(tracks)
            setIsPlaylistLoaded(true)
          } else {
            logger.warn('music_player_empty_album', { albumId: initialData.id, service })
            setError('No tracks found in album')
          }
        } else {
          // Single track
          setPlaylist([initialData])
          setIsPlaylistLoaded(true)
        }
      } catch (err) {
        logger.error(
          'music_player_load_error',
          {
            service,
            type,
            id: initialData.id,
          },
          err
        )
        console.error('Failed to load playlist:', err)
        setError('Failed to load album tracks')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [connector, serverUrl, credentials, type, initialData?.id, logger]) // Re-run if ID changes

  // Current Track
  const activeTrack = playlist[currentTrackIndex]

  // Derived URLs
  const streamUrl =
    connector && activeTrack && serverUrl && credentials
      ? `/api/music/stream?url=${encodeURIComponent(
          connector.getStreamUrl(serverUrl, activeTrack.id, credentials)
        )}`
      : null

  const coverUrl =
    connector && (activeTrack || initialData) && serverUrl && credentials
      ? `/api/music/cover?url=${encodeURIComponent(
          // For albums, initialData has coverArt (id), activeTrack also has. Use activeTrack if available.
          connector.getCoverArt(
            serverUrl,
            activeTrack?.coverArt || initialData.coverArt || activeTrack?.albumId,
            credentials
          )
        )}`
      : null

  // Format time display (mm:ss)
  const formatTime = seconds => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Set initial settings
  useEffect(() => {
    if (playbackSettings?.volume) {
      setVolume(playbackSettings.volume)
    }
  }, [playbackSettings?.volume])

  // Audio element event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlers = {
      timeupdate: () => setCurrentTime(audio.currentTime),
      loadedmetadata: () => setDuration(audio.duration || activeTrack?.duration || 0),
      // Auto-play next track
      ended: () => {
        if (currentTrackIndex < playlist.length - 1) {
          setCurrentTrackIndex(prev => prev + 1)
          setIsPlaying(true) // Ensure next plays
        } else {
          setIsPlaying(false)
        }
      },
      waiting: () => setIsLoading(true),
      canplay: () => setIsLoading(false),
      error: () => {
        // Only show error if we have a stream URL (avoid error on init)
        if (streamUrl) {
          logger.error('music_player_playback_error', { streamUrl, service })
          setError('Failed to load audio')
        }
      },
      play: () => setIsPlaying(true),
      pause: () => setIsPlaying(false),
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler)
    })

    // Auto-play when track changes if already playing (except first load)
    if (isPlaying && streamUrl) {
      audio.play().catch(err => {
        // Autoplay policy might block
        logger.warn('music_player_autoplay_blocked', { error: err.message })
      })
    }

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler)
      })
    }
  }, [activeTrack, streamUrl, currentTrackIndex, playlist.length, logger])

  // Play/pause toggle
  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !streamUrl) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(e => {
        logger.error('music_player_play_failed', { error: e.message }, e)
        setError('Playback failed: ' + e.message)
      })
    }
  }, [isPlaying, streamUrl, logger])

  // Handle seek
  const handleSeek = useCallback(
    e => {
      const audio = audioRef.current
      if (!audio || !duration) return
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      audio.currentTime = percent * duration
    },
    [duration]
  )

  // Handle volume
  const handleVolume = useCallback(e => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) audioRef.current.volume = newVolume
  }, [])

  // Skip
  const skip = useCallback(
    seconds => {
      const audio = audioRef.current
      if (!audio) return
      audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
    },
    [duration]
  )

  // Next/Prev Track
  const changeTrack = delta => {
    const newIndex = currentTrackIndex + delta
    if (newIndex >= 0 && newIndex < playlist.length) {
      setCurrentTrackIndex(newIndex)
      setIsPlaying(true)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'ArrowLeft') skip(-10)
      else if (e.code === 'ArrowRight') skip(10)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, skip])

  // --- RENDER ---

  // Preview mode
  if (isPreview) {
    const displayItem = activeTrack || initialData
    return (
      <div className="flex items-center gap-3 p-2">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 shadow-lg">
          {coverUrl ? (
            <img src={coverUrl} alt={displayItem?.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              {type === 'album' ? '💿' : '🎵'}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{displayItem?.title || 'Unknown'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {displayItem?.artist || 'Unknown Artist'}
          </p>
        </div>
      </div>
    )
  }

  // Full Player
  return (
    <div
      className={`music-player rounded-xl overflow-hidden shadow-2xl ${dark ? 'bg-gray-900' : 'bg-white'}`}
    >
      <audio ref={audioRef} src={streamUrl} preload="metadata" />

      {/* Album Art / Header */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-800 via-purple-900 to-gray-900 group">
        {/* Toggle Playlist Button (Overlay) */}
        {playlist.length > 1 && (
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
            title="Toggle Playlist"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}

        {!showPlaylist ? (
          // Cover Art View
          <>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={activeTrack?.album}
                className="w-full h-full object-cover"
                onError={() => {}}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                <span className="text-9xl opacity-80">{type === 'album' ? '💿' : '🎵'}</span>
              </div>
            )}
            {/* Now Playing Animation */}
            {isPlaying && (
              <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-black/50 px-3 py-2 rounded-full">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-green-400 rounded-full animate-pulse"
                    style={{
                      height: `${10 + Math.random() * 10}px`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
                <span className="text-white text-xs ml-2">Now Playing</span>
              </div>
            )}
          </>
        ) : (
          // Playlist View
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm overflow-y-auto custom-scrollbar p-4">
            <h3 className="text-white font-bold mb-3 sticky top-0 bg-black/80 pb-2">
              Tracks ({playlist.length})
            </h3>
            <div className="space-y-1">
              {playlist.map((t, i) => (
                <button
                  key={t.id || i}
                  onClick={() => {
                    setCurrentTrackIndex(i)
                    setIsPlaying(true)
                    setShowPlaylist(false)
                  }}
                  className={`w-full text-left p-2 rounded flex items-center gap-3 ${i === currentTrackIndex ? 'bg-accent/20 text-accent' : 'text-gray-300 hover:bg-white/10'}`}
                >
                  <span className="w-6 text-xs text-center opacity-50">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{t.title}</div>
                    <div className="truncate text-xs opacity-70">{formatTime(t.duration)}</div>
                  </div>
                  {i === currentTrackIndex && isPlaying && <span>🔊</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading/Error Overlay */}
        {isLoading && !showPlaylist && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 text-center">
            <p className="text-red-400">⚠️ {error}</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={`p-4 ${dark ? 'bg-gray-800/80' : 'bg-gray-50'}`}>
        <h3 className="font-bold text-lg truncate">
          {activeTrack?.title || initialData?.title || 'Unknown Title'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {activeTrack?.artist || initialData?.artist}
          {(activeTrack?.album || initialData?.album) &&
            ` • ${activeTrack?.album || initialData?.album}`}
        </p>
      </div>

      {/* Seek */}
      <div className={`px-5 py-2 ${dark ? 'bg-gray-800/60' : 'bg-gray-100'}`}>
        <div
          className="relative h-2 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer group"
          onClick={handleSeek}
        >
          <div
            className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div
        className={`px-5 py-4 flex items-center justify-center gap-6 ${dark ? 'bg-gray-800/40' : 'bg-gray-50'}`}
      >
        {/* Prev Track */}
        <button
          onClick={() => changeTrack(-1)}
          disabled={currentTrackIndex === 0}
          className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
        >
          ⏮
        </button>

        <button
          onClick={() => skip(-10)}
          className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          ↺
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-lg transform hover:scale-105 transition-all"
          disabled={!streamUrl || isLoading}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          onClick={() => skip(10)}
          className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          ↻
        </button>

        {/* Next Track */}
        <button
          onClick={() => changeTrack(1)}
          disabled={currentTrackIndex === playlist.length - 1}
          className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
        >
          ⏭
        </button>
      </div>

      {/* Volume / Footer */}
      <div
        className={`px-5 py-3 flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 ${dark ? 'bg-gray-800/20' : 'bg-gray-100'}`}
      >
        {/* Simple Volume */}
        <span className="text-xs">🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolume}
          className="flex-1 h-1"
        />
        <div className="text-xs text-gray-400">via {connector?.name || service}</div>
      </div>
    </div>
  )
})

export default MusicPlayerCard
