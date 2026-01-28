/**
 * AudioEditor - Non-destructive audio editing with waveform visualization
 * Part of Phase 5: Advanced Features
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Pause, RotateCcw, Download, Save, Trash2, Check, Scissors, Volume2, XCircle } from 'lucide-react'
import WaveformVisualizer from './WaveformVisualizer'
import { AudioBufferUtils } from '../../utils/audioBufferUtils'
import { audioBufferToWav } from '../../utils/audioBufferToWav'
import logger from '../../utils/logger'
import ErrorMessage from '../ErrorMessage'

/**
 * Format time in MM:SS format
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function AudioEditor({ audioBlob, transcript, onSave, onCancel }) {
  const audioContextRef = useRef(null)
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [duration, setDuration] = useState(0)
  const [edits, setEdits] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [appliedEdits, setAppliedEdits] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [error, setError] = useState(null)

  const audioElementRef = useRef(null)
  const animationFrameRef = useRef(null)

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Load audio
  useEffect(() => {
    if (!audioBlob || !audioContextRef.current) return

    const loadAudio = async () => {
      try {
        const arrayBuffer = await audioBlob.arrayBuffer()
        const buffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
        setAudioBuffer(buffer)
        setDuration(buffer.duration)
        setError(null)
      } catch (error) {
        logger.error('audio_editor_load_failed', { audioBlob }, error)
        setError('Failed to load audio. The file may be corrupted or unsupported.')
      }
    }

    loadAudio()
  }, [audioBlob])

  // Update playback time
  useEffect(() => {
    if (!isPlaying || !audioElementRef.current) return

    const updateTime = () => {
      if (audioElementRef.current) {
        setCurrentTime(audioElementRef.current.currentTime)
        animationFrameRef.current = requestAnimationFrame(updateTime)
      }
    }

    updateTime()
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying])

  // Handle selection
  const handleSelection = useCallback(selection => {
    // console.log('Selected region:', selection)
  }, [])

  // Handle edit actions
  const handleEdit = useCallback(edit => {
    const newEdit = {
      id: Date.now(),
      ...edit,
      timestamp: new Date().toISOString(),
    }
    setEdits(prev => [...prev, newEdit])
    setAppliedEdits(true)
  }, [])

  // Remove edit
  const removeEdit = useCallback(editId => {
    setEdits(prev => prev.filter(e => e.id !== editId))
  }, [])

  // Clear all edits
  const clearEdits = useCallback(() => {
    setEdits([])
    setAppliedEdits(false)
  }, [])

  // Undo last edit
  const undoEdit = useCallback(() => {
    setEdits(prev => {
      const newEdits = prev.slice(0, -1)
      setAppliedEdits(newEdits.length > 0)
      return newEdits
    })
  }, [])

  // Play/pause audio
  const togglePlayback = useCallback(() => {
    const audio = audioElementRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }, [isPlaying])

  // Seek to time
  const handleSeek = useCallback(time => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  // Apply all edits and export
  const handleApplyEdits = useCallback(async () => {
    if (!audioBuffer || edits.length === 0) return

    const ctx = audioContextRef.current
    const originalBuffer = audioBuffer

    try {
      // Filter out non-cut edits
      const cutEdits = edits.filter(e => e.type === 'cut')

      if (cutEdits.length === 0) {
        // Only normalize or noise reduction
        let processedBuffer = originalBuffer

        // Apply normalize
        if (edits.some(e => e.type === 'normalize')) {
          processedBuffer = AudioBufferUtils.normalizeBuffer(processedBuffer, 0.89)
        }

        // Apply noise reduction (simple noise gate)
        if (edits.some(e => e.type === 'reduceNoise')) {
          const threshold = 0.02
          for (let channel = 0; channel < processedBuffer.numberOfChannels; channel++) {
            const data = processedBuffer.getChannelData(channel)
            for (let i = 0; i < data.length; i++) {
              if (Math.abs(data[i]) < threshold) {
                data[i] *= 0.1 // Reduce noise
              }
            }
          }
        }

        const wavBlob = await audioBufferToWav(processedBuffer)
        onSave?.(wavBlob, edits)
        return
      }

      // Calculate new length after cuts
      const totalRemoved = cutEdits.reduce((sum, edit) => sum + (edit.end - edit.start), 0)
      const newLength = Math.floor(originalBuffer.length - totalRemoved * originalBuffer.sampleRate)

      if (newLength <= 0) {
        logger.error('audio_editor_remove_all_content', { edits })
        setError('Cannot remove all audio content. Please add some audio first.')
        return
      }

      // Create new buffer
      const newBuffer = ctx.createBuffer(
        originalBuffer.numberOfChannels,
        newLength,
        originalBuffer.sampleRate
      )

      // Copy data, skipping edited regions
      for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
        const oldData = originalBuffer.getChannelData(channel)
        const newData = newBuffer.getChannelData(channel)

        let writeOffset = 0
        const sampleRate = originalBuffer.sampleRate

        for (let i = 0; i < oldData.length; i++) {
          const currentTime = i / sampleRate

          // Check if current position is in a cut region
          const inCut = cutEdits.some(edit => currentTime >= edit.start && currentTime < edit.end)

          if (!inCut && writeOffset < newLength) {
            newData[writeOffset++] = oldData[i]
          }
        }
      }

      // Apply normalize and noise reduction if needed
      let processedBuffer = newBuffer
      if (edits.some(e => e.type === 'normalize')) {
        processedBuffer = AudioBufferUtils.normalizeBuffer(processedBuffer, 0.89)
      }

      if (edits.some(e => e.type === 'reduceNoise')) {
        const threshold = 0.02
        for (let channel = 0; channel < processedBuffer.numberOfChannels; channel++) {
          const data = processedBuffer.getChannelData(channel)
          for (let i = 0; i < data.length; i++) {
            if (Math.abs(data[i]) < threshold) {
              data[i] *= 0.1
            }
          }
        }
      }

      // Export as WAV
      const wavBlob = await audioBufferToWav(processedBuffer)
      onSave?.(wavBlob, edits)
      setError(null)
    } catch (error) {
      logger.error('audio_editor_apply_edits_failed', { edits, audioBuffer }, error)
      setError('Failed to apply edits. Please try again.')
    }
  }, [audioBuffer, edits, onSave])

  // Preview changes
  const handlePreview = async () => {
    if (!audioBuffer || edits.length === 0) return

    setPreviewing(true)
    await handleApplyEdits()
    setPreviewing(false)
  }

  // Export original audio
  const handleExportOriginal = async () => {
    const wavBlob = await audioBufferToWav(audioBuffer)

    const url = URL.createObjectURL(wavBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audio-${Date.now()}.wav`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = e => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlayback()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undoEdit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlayback, undoEdit, onCancel])

  if (!audioBuffer) {
    return (
      <div className="flex items-center justify-center h-96 rounded-xl bg-white/5 text-gray-400">
        Loading audio...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 rounded-2xl bg-white/5 border border-white/10">
      {/* Error Message */}
      {error && (
        <div className="space-y-3">
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Audio Editor</h2>
          <p className="text-sm text-gray-400">Edit and enhance your recording</p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300"
        >
          Cancel
        </button>
      </div>

      {/* Playback controls */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-black/20">
        <button
          onClick={togglePlayback}
          className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={e => handleSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500"
          />
        </div>

        <span className="text-sm font-mono text-gray-400 min-w-[100px] text-right">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <audio
          ref={audioElementRef}
          src={URL.createObjectURL(audioBlob)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>

      {/* Waveform visualizer */}
      <WaveformVisualizer
        audioBuffer={audioBuffer}
        onSelection={handleSelection}
        onEdit={handleEdit}
      />

      {/* Edit list */}
      {edits.length > 0 && (
        <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">Applied Edits ({edits.length})</h3>
            <button onClick={clearEdits} className="text-sm text-red-400 hover:text-red-300">
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {edits.map(edit => (
              <div
                key={edit.id}
                className="flex items-center justify-between p-3 rounded-lg bg-black/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    {edit.type === 'cut' && <Scissors size={16} className="text-indigo-400" />}
                    {edit.type === 'normalize' && <Volume2 size={16} className="text-green-400" />}
                    {edit.type === 'reduceNoise' && <XCircle size={16} className="text-pink-400" />}
                  </div>

                  <div>
                    <div className="text-sm text-white capitalize">
                      {edit.type === 'cut' && `Cut Region`}
                      {edit.type === 'normalize' && `Normalize Volume`}
                      {edit.type === 'reduceNoise' && `Reduce Noise`}
                    </div>
                    {edit.type === 'cut' && (
                      <div className="text-xs text-gray-400">
                        {formatTime(edit.start)} - {formatTime(edit.end)}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => removeEdit(edit.id)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/10">
            <button
              onClick={undoEdit}
              disabled={edits.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={16} />
              Undo
            </button>

            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"
            >
              <Play size={16} />
              Preview
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleExportOriginal}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
        >
          <Download size={20} />
          Export Original
        </button>

        <button
          onClick={handleApplyEdits}
          disabled={edits.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check size={20} />
          {appliedEdits ? 'Save Edited' : 'Save'}
        </button>
      </div>

      {/* Transcript preview */}
      {transcript && (
        <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-gray-300">Transcript</h3>
          <p className="text-sm text-gray-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
            {transcript}
          </p>
        </div>
      )}
    </div>
  )
}
