import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { useAudioPlayback } from '../../contexts/AudioPlaybackContext'

/**
 * Minimal playback controls for audio recording
 */
export default function MinimalPlaybackControls({ audioUrl, playbackId, className = '' }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const audioRef = useRef(null)
  const progressBarRef = useRef(null)
  const { playAudio, stopAudio, isPlaying: isGloballyPlaying } = useAudioPlayback()

  // Initialize audio
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current
      audio.volume = volume
      audio.playbackRate = playbackRate
      
      const handleLoadedMetadata = () => setDuration(audio.duration)
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
      const handleEnded = () => setIsPlaying(false)
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('ended', handleEnded)
      }
    }
  }, [audioUrl, volume, playbackRate])

  // Update local isPlaying state when global state changes
  useEffect(() => {
    if (playbackId) {
      const globallyPlaying = isGloballyPlaying(playbackId)
      setIsPlaying(globallyPlaying)
    }
  }, [playbackId, isGloballyPlaying])

  const togglePlay = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (playbackId) {
        playAudio(audioRef.current, playbackId)
      } else {
        audioRef.current.play()
      }
      setIsPlaying(true)
    }
  }

  const handleProgressClick = (e) => {
    if (!audioRef.current || !progressBarRef.current) return
    
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const percentage = x / width
    
    audioRef.current.currentTime = percentage * duration
  }

  const skipForward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration)
  }

  const skipBackward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
      audioRef.current.muted = newVolume === 0
    }
  }

  const changePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextRate = rates[(currentIndex + 1) % rates.length]
    setPlaybackRate(nextRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <audio ref={audioRef} src={audioUrl} className="hidden" />
      
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Skip Backward */}
      <button
        onClick={skipBackward}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
        title="Skip back 10s"
      >
        <SkipBack size={14} />
      </button>

      {/* Skip Forward */}
      <button
        onClick={skipForward}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
        title="Skip forward 10s"
      >
        <SkipForward size={14} />
      </button>

      {/* Progress Bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex-shrink-0">{formatTime(currentTime)}</span>
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition-colors"
          >
            <div
              className="h-full bg-indigo-500 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow" />
            </div>
          </div>
          <span className="flex-shrink-0">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Rate */}
      <button
        onClick={changePlaybackRate}
        className="px-2 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        title={`Playback speed: ${playbackRate}x`}
      >
        {playbackRate}x
      </button>

      {/* Volume Control */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleMute}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors opacity-60 hover:opacity-100"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-16 h-1.5 accent-indigo-500 cursor-pointer"
        />
      </div>
    </div>
  )
}

/**
 * Compact playback controls (minimal UI)
 */
export function CompactPlaybackControls({ audioUrl, playbackId, className = '' }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const { playAudio, isPlaying: isGloballyPlaying } = useAudioPlayback()

  useEffect(() => {
    if (audioRef.current) {
      const handleEnded = () => setIsPlaying(false)
      audioRef.current.addEventListener('ended', handleEnded)
      return () => {
        audioRef.current?.removeEventListener('ended', handleEnded)
      }
    }
  }, [audioUrl])

  // Update local isPlaying state when global state changes
  useEffect(() => {
    if (playbackId) {
      const globallyPlaying = isGloballyPlaying(playbackId)
      setIsPlaying(globallyPlaying)
    }
  }, [playbackId, isGloballyPlaying])

  const togglePlay = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (playbackId) {
        playAudio(audioRef.current, playbackId)
      } else {
        audioRef.current.play()
      }
      setIsPlaying(true)
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <audio ref={audioRef} src={audioUrl} className="hidden" />
      
      <button
        onClick={togglePlay}
        className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors text-white"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
    </div>
  )
}

/**
 * Full playback controls with all features
 */
export function FullPlaybackControls({ audioUrl, playbackId, className = '' }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)

  const audioRef = useRef(null)
  const progressBarRef = useRef(null)
  const { playAudio, isPlaying: isGloballyPlaying } = useAudioPlayback()

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current
      audio.volume = volume
      audio.playbackRate = playbackRate
      
      const handleLoadedMetadata = () => setDuration(audio.duration)
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
      const handleEnded = () => setIsPlaying(false)
      
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('ended', handleEnded)
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('ended', handleEnded)
      }
    }
  }, [audioUrl, volume, playbackRate])

  // Update local isPlaying state when global state changes
  useEffect(() => {
    if (playbackId) {
      const globallyPlaying = isGloballyPlaying(playbackId)
      setIsPlaying(globallyPlaying)
    }
  }, [playbackId, isGloballyPlaying])

  const togglePlay = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (playbackId) {
        playAudio(audioRef.current, playbackId)
      } else {
        audioRef.current.play()
      }
      setIsPlaying(true)
    }
  }

  const handleProgressClick = (e) => {
    if (!audioRef.current || !progressBarRef.current) return
    
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const percentage = x / width
    
    audioRef.current.currentTime = percentage * duration
  }

  const skipForward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, duration)
  }

  const skipBackward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
      audioRef.current.muted = newVolume === 0
    }
  }

  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate)
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`p-4 bg-white/5 rounded-xl border border-white/10 ${className}`}>
      <audio ref={audioRef} src={audioUrl} className="hidden" />
      
      {/* Main Controls */}
      <div className="flex items-center gap-4 mb-3">
        {/* Restart */}
        <button
          onClick={restart}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Restart"
        >
          <RotateCcw size={18} />
        </button>

        {/* Skip Backward */}
        <button
          onClick={skipBackward}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Skip back 15s"
        >
          <SkipBack size={18} />
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full transition-colors text-white"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        {/* Skip Forward */}
        <button
          onClick={skipForward}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Skip forward 15s"
        >
          <SkipForward size={18} />
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-2 accent-indigo-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          className="h-2 bg-white/20 rounded-full cursor-pointer hover:bg-white/30 transition-colors"
        >
          <div
            className="h-full bg-indigo-500 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
          </div>
        </div>
      </div>

      {/* Playback Rate */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-sm text-gray-400">Speed:</span>
        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
          <button
            key={rate}
            onClick={() => changePlaybackRate(rate)}
            className={`
              px-2 py-1 text-sm rounded-lg transition-colors
              ${playbackRate === rate 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }
            `}
            title={`${rate}x speed`}
          >
            {rate}x
          </button>
        ))}
      </div>
    </div>
  )
}