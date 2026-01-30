import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react'
import { getServiceConnector } from '../lib/musicServices'
import { useSettings } from '../contexts/SettingsContext'
import { useLogger } from '../utils/logger'
import { toast } from 'react-hot-toast'

/**
 * MusicPlayerCard - Premium audio player for self-hosted music
 * Features:
 * - HTML5 Audio API with full controls
 * - Playlist Support (Albums)
 * - Progress bar with seek functionality
 * - Volume control
 * - Album art display
 * - Play/pause with keyboard support
 * - [NEW] Audio Visualizer
 * - [NEW] Lyrics Display (LRC support)
 * - [NEW] Compact "Mini" Mode
 */
export const MusicPlayerCard = memo(function MusicPlayerCard({ data, isPreview = false }) {
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const audioContextRef = useRef(null)
  const sourceRef = useRef(null)
  const analyzerRef = useRef(null)
  const animationRef = useRef(null)
  const logger = useLogger()

  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Premium Features State
  const [showLyrics, setShowLyrics] = useState(false)
  const [lyricsLines, setLyricsLines] = useState([])
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1)
  const [isCompact, setIsCompact] = useState(false)
  const [showVisualizer, setShowVisualizer] = useState(true)
  const [showCast, setShowCast] = useState(false)
  const [castSessions, setCastSessions] = useState([]) // Remote devices

  // Playlist State
  const [playlist, setPlaylist] = useState([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
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

  // Normalize Swing Music / Other credentials
  // Ensure we pass the right token structure to connector
  const unifiedCredentials = useMemo(() => {
    const creds = { ...credentials }
    if (service === 'swingmusic' && credentials?.token) {
      creds.accessToken = credentials.token
    }
    return creds
  }, [credentials, service])

  const connector = useMemo(() => getServiceConnector(service), [service])

  // Initialize Playlist
  useEffect(() => {
    if (!connector || !initialData) return

    const load = async () => {
      setError(null)
      setIsLoading(true)

      try {
        if (type === 'album') {
          // Fetch album tracks
          const tracks = await connector.getAlbumTracks(
            serverUrl,
            initialData.id,
            unifiedCredentials
          )
          if (tracks.length > 0) {
            setPlaylist(tracks)
          } else {
            logger.warn('music_player_empty_album', { albumId: initialData.id, service })
            setError('No tracks found in album')
          }
        } else {
          // Single track
          setPlaylist([initialData])
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
  }, [connector, serverUrl, type, initialData, unifiedCredentials, logger]) // Re-run if ID changes

  // Current Track
  const activeTrack = playlist[currentTrackIndex]

  // Derived URLs
  const streamUrl =
    connector && activeTrack && serverUrl
      ? `/api/music/stream?url=${encodeURIComponent(
          connector.getStreamUrl(serverUrl, activeTrack.id, unifiedCredentials)
        )}`
      : null

  const coverUrl =
    connector && (activeTrack || initialData) && serverUrl
      ? `/api/music/cover?url=${encodeURIComponent(
          // For albums, initialData has coverArt (id), activeTrack also has. Use activeTrack if available.
          connector.getCoverArt(
            serverUrl,
            activeTrack?.coverArt || initialData.coverArt || activeTrack?.albumId,
            unifiedCredentials
          )
        )}`
      : null

  // Fetch Lyrics
  useEffect(() => {
    if (!connector?.getLyrics || !activeTrack || !serverUrl) {
      setLyricsLines([])
      return
    }

    const fetchLyrics = async () => {
      try {
        const lrc = await connector.getLyrics(serverUrl, activeTrack.id, unifiedCredentials)
        if (lrc) {
          // Parse LRC
          const lines = lrc
            .split('\n')
            .map(line => {
              const match = line.match(/\[(\d{2}):(\d{2}\.\d{2})\](.*)/)
              if (match) {
                return {
                  time: parseInt(match[1]) * 60 + parseFloat(match[2]),
                  text: match[3].trim(),
                }
              }
              return null
            })
            .filter(Boolean)
          setLyricsLines(lines.length > 0 ? lines : [{ time: 0, text: lrc }]) // Fallback to raw text
        } else {
          setLyricsLines([])
        }
      } catch (e) {
        console.warn('Failed to fetch lyrics', e)
      }
    }
    fetchLyrics()
  }, [activeTrack, connector, serverUrl, unifiedCredentials])

  // Sync Lyrics
  useEffect(() => {
    if (lyricsLines.length === 0) return
    // Find current line
    const index = lyricsLines.findIndex((line, i) => {
      const nextLine = lyricsLines[i + 1]
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time)
    })
    if (index !== -1 && index !== currentLyricIndex) {
      setCurrentLyricIndex(index)
      // Auto-scroll if lyrics view is open
      const el = document.getElementById(`lyric-${index}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentTime, lyricsLines, currentLyricIndex])

  // Fetch Casting Sessions
  useEffect(() => {
    if (!showCast || !connector?.getSessions || !serverUrl) return

    const fetchSessions = async () => {
      try {
        const sessions = await connector.getSessions(serverUrl, unifiedCredentials)
        setCastSessions(sessions)
      } catch (e) {
        console.error('Failed to fetch cast sessions', e)
      }
    }

    fetchSessions()
    const interval = setInterval(fetchSessions, 5000) // Poll every 5s while menu open
    return () => clearInterval(interval)
  }, [showCast, connector, serverUrl, unifiedCredentials])

  // Handle Cast Command
  const handleCast = async sessionId => {
    if (!connector?.castCommand || !activeTrack) return
    try {
      // Send "Play" command with current item
      const itemIds = [activeTrack.id] // Jellyfin needs ItemIds
      await connector.castCommand(
        serverUrl,
        sessionId,
        'Play',
        { ItemIds: itemIds },
        unifiedCredentials
      )
      setShowCast(false)
      toast.success('Casting to device')
    } catch (e) {
      setError('Failed to cast: ' + e.message)
    }
  }

  // Audio Visualizer Setup
  useEffect(() => {
    if (!audioRef.current || !showVisualizer || isCompact) return

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }

      const ctx = audioContextRef.current
      if (!sourceRef.current) {
        try {
          sourceRef.current = ctx.createMediaElementSource(audioRef.current)
        } catch (e) {
          // Sometimes fails if already connected
          console.warn('MediaElementSource attach failed', e)
        }
        if (!sourceRef.current) return // Bail if failed

        analyzerRef.current = ctx.createAnalyser()
        analyzerRef.current.fftSize = 64
        sourceRef.current.connect(analyzerRef.current)
        analyzerRef.current.connect(ctx.destination)
      }

      const analyzer = analyzerRef.current
      const bufferLength = analyzer.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      const canvas = canvasRef.current

      if (!canvas) return
      const canvasCtx = canvas.getContext('2d')

      const draw = () => {
        if (!canvas) return
        animationRef.current = requestAnimationFrame(draw)

        analyzer.getByteFrequencyData(dataArray)

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height)

        const barWidth = (canvas.width / bufferLength) * 2.5
        let barHeight
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * canvas.height * 0.8 // Scale height

          // Gradient bar
          const gradient = canvasCtx.createLinearGradient(
            0,
            canvas.height,
            0,
            canvas.height - barHeight
          )
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)') // Purple
          gradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)') // Pink

          canvasCtx.fillStyle = gradient
          // Rounded top bars
          canvasCtx.beginPath()
          canvasCtx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 4)
          canvasCtx.fill()

          x += barWidth + 2
        }
      }
      draw()
    } catch (e) {
      console.warn('Visualizer init failed (CORS or Autoplay policy)', e)
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [showVisualizer, isCompact, streamUrl])

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
          // dont set error immediately to UI unless persistent
        }
      },
      play: () => {
        setIsPlaying(true)
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume()
        }
      },
      pause: () => setIsPlaying(false),
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      audio.addEventListener(event, handler)
    })

    // Auto-play when track changes if already playing (except first load)
    if (isPlaying && streamUrl) {
      audio.play().catch(err => {
        // Autoplay policy might block
        console.warn('Autoplay blocked', err)
      })
    }

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        audio.removeEventListener(event, handler)
      })
    }
  }, [activeTrack, streamUrl, currentTrackIndex, playlist.length, logger, isPlaying, service])

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
      className={`music-player relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${dark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}
    >
      <audio ref={audioRef} src={streamUrl} preload="metadata" crossOrigin="anonymous" />

      {/* COMPACT MINI MODE */}
      {isCompact && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
          <div
            className="w-10 h-10 rounded overflow-hidden relative group cursor-pointer"
            onClick={() => setIsCompact(false)}
          >
            {coverUrl ? (
              <img src={coverUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-purple-600"></div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs">↗</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{activeTrack?.title}</div>
            <div className="text-xs text-gray-400 truncate">{activeTrack?.artist}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={togglePlay} className="p-2 hover:text-purple-400 transition-colors">
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              onClick={() => changeTrack(1)}
              className="p-2 hover:text-purple-400 transition-colors"
            >
              ⏭
            </button>
          </div>
          {/* Progress Bar (Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div
              className="h-full bg-purple-500"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* FULL MODE */}
      {!isCompact && (
        <>
          {/* Top Bar Actions */}
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-between p-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
            <div className="flex gap-2 pointer-events-auto">
              <button
                onClick={() => setIsCompact(true)}
                className="p-1.5 rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white backdrop-blur-md transition-all"
                title="Mini Mode"
              >
                ↙
              </button>
            </div>
            <div className="flex gap-2 pointer-events-auto">
              {connector?.getSessions && (
                <button
                  onClick={() => setShowCast(!showCast)}
                  className={`p-1.5 px-3 rounded-full text-xs font-bold backdrop-blur-md transition-all ${showCast ? 'bg-blue-600 text-white' : 'bg-black/20 text-white/80 hover:bg-black/40'}`}
                >
                  📺
                </button>
              )}
              {lyricsLines.length > 0 && (
                <button
                  onClick={() => setShowLyrics(!showLyrics)}
                  className={`p-1.5 px-3 rounded-full text-xs font-bold backdrop-blur-md transition-all ${showLyrics ? 'bg-purple-600 text-white' : 'bg-black/20 text-white/80 hover:bg-black/40'}`}
                >
                  DYRICS
                </button>
              )}
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className={`p-1.5 px-3 rounded-full text-xs font-bold backdrop-blur-md transition-all ${showPlaylist ? 'bg-white text-black' : 'bg-black/20 text-white/80 hover:bg-black/40'}`}
              >
                LIST
              </button>
            </div>
          </div>

          {/* Visualizer Canvas (Behind Content) */}
          <canvas
            ref={canvasRef}
            width="300"
            height="100"
            className={`absolute bottom-[160px] left-0 right-0 z-10 w-full h-32 opacity-40 pointer-events-none transition-opacity duration-500 ${showVisualizer ? 'opacity-40' : 'opacity-0'}`}
          />

          {/* Main Content Area */}
          <div className="relative aspect-square bg-gray-900 group">
            {/* Background Blur */}
            {coverUrl && (
              <div className="absolute inset-0 opacity-30 select-none">
                <img src={coverUrl} className="w-full h-full object-cover blur-3xl scale-110" />
              </div>
            )}

            {/* Views: Playlist OR Lyrics OR Cover */}
            {showPlaylist ? (
              // PLAYLIST VIEW
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md overflow-y-auto custom-scrollbar p-14 pt-16 z-10">
                <h3 className="text-white font-bold mb-3 sticky top-0 bg-transparent pb-2 border-b border-white/10">
                  Up Next ({playlist.length})
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
                      className={`w-full text-left p-2 rounded flex items-center gap-3 ${i === currentTrackIndex ? 'bg-purple-600/30 text-purple-300' : 'text-gray-300 hover:bg-white/10'}`}
                    >
                      <span className="w-6 text-xs text-center opacity-50">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{t.title}</div>
                        <div className="truncate text-xs opacity-70">{formatTime(t.duration)}</div>
                      </div>
                      {i === currentTrackIndex && isPlaying && (
                        <span className="animate-pulse">🔊</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : showCast ? (
              // CASTING VIEW
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md overflow-y-auto custom-scrollbar p-14 pt-16 z-10">
                <h3 className="text-white font-bold mb-3 sticky top-0 bg-transparent pb-2 border-b border-white/10">
                  Remote Control
                </h3>
                <div className="space-y-1">
                  {castSessions.length === 0 && (
                    <p className="text-gray-400 text-sm">No active devices found.</p>
                  )}
                  {castSessions.map((s, i) => (
                    <button
                      key={s.Id || i}
                      onClick={() => handleCast(s.Id)}
                      className="w-full text-left p-3 rounded flex items-center gap-3 text-gray-200 hover:bg-blue-600/30 hover:text-white transition-colors border border-white/5"
                    >
                      <span className="text-xl">📺</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold">{s.DeviceName || 'Unknown Device'}</div>
                        <div className="text-xs opacity-70">
                          {s.Client} • {s.ApplicationVersion}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-center text-gray-500 mt-4 max-w-[200px] mx-auto">
                  Select a device to stream the current track to it.
                </p>
              </div>
            ) : showLyrics ? (
              // LYRICS VIEW
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md overflow-y-auto custom-scrollbar p-6 pt-16 z-10 text-center">
                <div className="space-y-6">
                  {lyricsLines.map((line, i) => (
                    <p
                      id={`lyric-${i}`}
                      key={i}
                      className={`text-lg transition-all duration-500 cursor-pointer ${i === currentLyricIndex ? 'text-white font-bold scale-110 blur-0' : 'text-gray-400 blur-[1px] hover:text-gray-200'}`}
                      onClick={() => {
                        if (audioRef.current) audioRef.current.currentTime = line.time
                      }}
                    >
                      {line.text}
                    </p>
                  ))}
                  {lyricsLines.length === 0 && (
                    <p className="text-gray-500 mt-20">No lyrics available</p>
                  )}
                </div>
              </div>
            ) : (
              // COVER ART VIEW
              <>
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={activeTrack?.album}
                    className="w-full h-full object-cover shadow-inner"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
                    <span className="text-9xl opacity-80">{type === 'album' ? '💿' : '🎵'}</span>
                  </div>
                )}
              </>
            )}

            {/* Loading/Error Overlay */}
            {isLoading && !showPlaylist && !showLyrics && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 text-center z-30">
                <p className="text-red-400 font-bold">⚠️ {error}</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className={`p-4 relative z-10 ${dark ? 'bg-gray-800/95' : 'bg-gray-50'}`}>
            <h3 className="font-bold text-lg truncate flex items-center gap-2">
              {activeTrack?.title || initialData?.title || 'Unknown Title'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {activeTrack?.artist || initialData?.artist}
              {(activeTrack?.album || initialData?.album) &&
                ` • ${activeTrack?.album || initialData?.album}`}
            </p>
          </div>

          {/* Seek */}
          <div className={`px-5 py-2 relative z-10 ${dark ? 'bg-gray-800/90' : 'bg-gray-100'}`}>
            <div
              className="relative h-2 bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer group"
              onClick={handleSeek}
            >
              <div
                className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              {/* Hover Scrub Preview (Optional - could add later) */}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div
            className={`px-5 py-4 flex items-center justify-center gap-6 relative z-10 ${dark ? 'bg-gray-800/80' : 'bg-gray-50'}`}
          >
            <button
              onClick={() => changeTrack(-1)}
              disabled={currentTrackIndex === 0}
              className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-transform active:scale-95"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-14 h-14 flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full shadow-lg shadow-purple-500/30 transform hover:scale-110 active:scale-95 transition-all"
              disabled={!streamUrl || isLoading}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={() => changeTrack(1)}
              disabled={currentTrackIndex === playlist.length - 1}
              className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-transform active:scale-95"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* Volume / Footer */}
          <div
            className={`px-5 py-3 flex items-center gap-3 border-t border-gray-200 dark:border-gray-700 relative z-10 ${dark ? 'bg-gray-900' : 'bg-gray-100'}`}
          >
            <button
              onClick={() => setShowVisualizer(!showVisualizer)}
              className={`text-xs ${showVisualizer ? 'text-purple-400' : 'text-gray-500'} hover:text-white`}
              title="Toggle Visualizer"
            >
              📊
            </button>
            <div className="flex-1 flex items-center gap-2 group">
              <span className="text-xs">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolume}
                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
            <div className="flex items-center gap-1 text-[10px] bg-black/20 px-2 py-1 rounded text-gray-400 uppercase tracking-wider font-bold">
              {connector?.icon} {connector?.name || service}
            </div>
          </div>
        </>
      )}
    </div>
  )
})

export default MusicPlayerCard
