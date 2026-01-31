import React, { createContext, useContext, useRef, useCallback } from 'react'

/**
 * AudioPlaybackContext - Manages global audio playback state
 * Prevents multiple audio instances from playing simultaneously
 */
const AudioPlaybackContext = createContext(null)

export function AudioPlaybackProvider({ children }) {
  const currentAudioRef = useRef(null)
  const currentPlaybackIdRef = useRef(null)

  /**
   * Play audio with the given ID
   * If another audio is playing, it will be stopped first
   */
  const playAudio = useCallback((audioElement, playbackId) => {
    // If the same audio is playing, do nothing
    if (currentPlaybackIdRef.current === playbackId && 
        currentAudioRef.current && 
        !currentAudioRef.current.paused) {
      return
    }

    // Stop any currently playing audio
    if (currentAudioRef.current && !currentAudioRef.current.paused) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
    }

    // Play the new audio
    currentAudioRef.current = audioElement
    currentPlaybackIdRef.current = playbackId
    audioElement.play()
  }, [])

  /**
   * Stop the currently playing audio
   */
  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    currentPlaybackIdRef.current = null
  }, [])

  /**
   * Check if a specific audio is currently playing
   */
  const isPlaying = useCallback((playbackId) => {
    return currentPlaybackIdRef.current === playbackId && 
           currentAudioRef.current && 
           !currentAudioRef.current.paused
  }, [])

  /**
   * Pause the currently playing audio without stopping it
   */
  const pauseAudio = useCallback(() => {
    if (currentAudioRef.current && !currentAudioRef.current.paused) {
      currentAudioRef.current.pause()
    }
  }, [])

  /**
   * Resume the currently paused audio
   */
  const resumeAudio = useCallback(() => {
    if (currentAudioRef.current && currentAudioRef.current.paused) {
      currentAudioRef.current.play()
    }
  }, [])

  const value = {
    playAudio,
    stopAudio,
    isPlaying,
    pauseAudio,
    resumeAudio,
  }

  return (
    <AudioPlaybackContext.Provider value={value}>
      {children}
    </AudioPlaybackContext.Provider>
  )
}

export function useAudioPlayback() {
  const context = useContext(AudioPlaybackContext)
  if (!context) {
    throw new Error('useAudioPlayback must be used within AudioPlaybackProvider')
  }
  return context
}