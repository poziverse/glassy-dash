/**
 * WaveformVisualizer - Displays audio waveform with zoom and selection
 * Part of Phase 5: Advanced Features
 * Phase 6 Update: Added error handling, logger integration, React.memo optimization
 */

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { ZoomIn, ZoomOut, Scissors, Volume2, XCircle, RotateCcw } from 'lucide-react'
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

/**
 * Extract waveform data from AudioBuffer
 */
function extractWaveformData(buffer, samplesPerPixel) {
  try {
    const channelData = buffer.getChannelData(0)
    const length = channelData.length
    const peaks = []

    for (let i = 0; i < length; i += samplesPerPixel) {
      let min = 1.0
      let max = -1.0

      for (let j = 0; j < samplesPerPixel && i + j < length; j++) {
        const value = channelData[i + j]
        if (value < min) min = value
        if (value > max) max = value
      }

      peaks.push({ min, max })
    }

    return peaks
  } catch (error) {
    logger.error('waveform_extract_failed', { samplesPerPixel, duration: buffer?.duration }, error)
    throw error
  }
}

function WaveformVisualizer({ audioBuffer, onSelection, onEdit }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [waveformData, setWaveformData] = useState([])
  const [zoom, setZoom] = useState(1)
  const [selection, setSelection] = useState(null) // { start, end } in pixels
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [error, setError] = useState(null)

  // Load and process audio
  useEffect(() => {
    if (!audioBuffer) return

    try {
      const samplesPerPixel = Math.ceil(audioBuffer.sampleRate / 100) // 100 pixels per second
      const peaks = extractWaveformData(audioBuffer, samplesPerPixel)
      setWaveformData(peaks)
      setError(null)
    } catch (error) {
      logger.error(
        'waveform_load_failed',
        { duration: audioBuffer?.duration, sampleRate: audioBuffer?.sampleRate },
        error
      )
      setError('Failed to load waveform. The audio file may be corrupted.')
    }
  }, [audioBuffer])

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || waveformData.length === 0) return

    try {
      const ctx = canvas.getContext('2d')
      const container = containerRef.current

      // Set canvas size
      canvas.width = container.clientWidth * zoom
      canvas.height = container.clientHeight

      const width = canvas.width
      const height = canvas.height
      const centerY = height / 2

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw waveform
      ctx.fillStyle = '#6366f1' // Indigo

      const step = width / waveformData.length
      waveformData.forEach((peak, i) => {
        const x = i * step
        const yMin = centerY + peak.min * centerY * 0.9
        const yMax = centerY - peak.max * centerY * 0.9
        const barHeight = Math.max(1, yMax - yMin)

        // Draw bar with rounded corners
        const radius = Math.min(2, barHeight / 2)
        ctx.beginPath()
        ctx.roundRect(x, yMin, Math.max(1, step - 1), barHeight, [radius, radius, radius, radius])
        ctx.fill()
      })

      // Draw selection
      if (selection) {
        const startX = Math.min(selection.start, selection.end)
        const endX = Math.max(selection.start, selection.end)

        ctx.fillStyle = 'rgba(99, 102, 241, 0.3)'
        ctx.fillRect(startX, 0, endX - startX, height)

        // Draw selection handles
        ctx.fillStyle = '#818cf8'
        ctx.beginPath()
        ctx.arc(startX, centerY, 6, 0, Math.PI * 2)
        ctx.arc(endX, centerY, 6, 0, Math.PI * 2)
        ctx.fill()
      }

      setError(null)
    } catch (error) {
      logger.error(
        'waveform_render_failed',
        { zoom, selection, dataPoints: waveformData.length },
        error
      )
      setError('Failed to render waveform. Please try refreshing the page.')
    }
  }, [waveformData, zoom, selection])

  // Handle mouse down
  const handleMouseDown = useCallback(e => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left

    setIsDragging(true)
    setDragStart(x)
    setSelection({ start: x, end: x })
  }, [])

  // Handle mouse move
  const handleMouseMove = useCallback(
    e => {
      if (!isDragging) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left

      setSelection(prev => (prev ? { ...prev, end: x } : null))
    },
    [isDragging]
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (!isDragging || !selection) return

    setIsDragging(false)

    const startPx = Math.min(selection.start, selection.end)
    const endPx = Math.max(selection.start, selection.end)
    const duration = ((endPx - startPx) / canvasRef.current.width) * (audioBuffer.duration * zoom)

    if (duration > 0.1) {
      // Minimum 100ms selection
      const startTime = (startPx / canvasRef.current.width) * audioBuffer.duration * zoom
      const endTime = startTime + duration

      onSelection?.({ start: startTime, end: endTime })
    }

    setSelection(null)
  }, [isDragging, selection, audioBuffer, onSelection])

  // Handle zoom
  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(10, prev * 2)), [])
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(0.5, prev / 2)), [])

  // Handle edit actions
  const handleCut = useCallback(() => {
    try {
      if (selection && canvasRef.current) {
        const startPx = Math.min(selection.start, selection.end)
        const endPx = Math.max(selection.start, selection.end)
        const startTime = (startPx / canvasRef.current.width) * audioBuffer.duration * zoom
        const endTime = (endPx / canvasRef.current.width) * audioBuffer.duration * zoom
        onEdit?.({ type: 'cut', start: startTime, end: endTime })
      }
    } catch (error) {
      logger.error(
        'waveform_cut_failed',
        { selection, zoom, duration: audioBuffer?.duration },
        error
      )
      setError('Failed to cut selection. Please try again.')
    }
  }, [selection, audioBuffer, zoom, onEdit])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.key === 'Delete' || e.key === 'Backspace' || e.key === 'x') && selection) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
        e.preventDefault()
        handleCut()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selection, handleCut])

  if (error) {
    return (
      <div className="space-y-3">
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
        <div className="flex justify-center">
          <button
            onClick={() => {
              setError(null)
              onEdit?.({ type: 'reload' })
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RotateCcw size={16} />
            Reload Waveform
          </button>
        </div>
      </div>
    )
  }

  if (!audioBuffer || waveformData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-xl bg-white/5 text-gray-400">
        No audio loaded
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
        <button
          onClick={handleZoomOut}
          className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>

        <button
          onClick={handleZoomIn}
          className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>

        <span className="text-sm text-gray-400 ml-2">{Math.round(zoom * 100)}%</span>

        <div className="flex-1" />

        <button
          onClick={handleCut}
          disabled={!selection}
          className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          title="Cut Selection"
        >
          <Scissors size={20} />
        </button>

        <button
          onClick={() => onEdit?.({ type: 'normalize' })}
          className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white"
          title="Normalize Volume"
        >
          <Volume2 size={20} />
        </button>

        <button
          onClick={() => onEdit?.({ type: 'reduceNoise' })}
          className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white"
          title="Reduce Noise"
        >
          <XCircle size={20} />
        </button>
      </div>

      {/* Waveform canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-48 rounded-xl bg-black/20 overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Timeline */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/40 to-transparent">
          {Array.from({ length: 10 }).map((_, i) => {
            const time = (audioBuffer.duration / 10) * i
            return (
              <div
                key={i}
                className="absolute bottom-1 text-xs text-gray-400 font-mono"
                style={{ left: `${i * 10}%` }}
              >
                {formatTime(time)}
              </div>
            )
          })}
        </div>
      </div>

      {/* Duration info */}
      <div className="text-center text-sm text-gray-400">
        Duration: {formatTime(audioBuffer.duration)}
      </div>
    </div>
  )
}

export default memo(WaveformVisualizer, (prevProps, nextProps) => {
  // Only re-render if audioBuffer changes
  return prevProps.audioBuffer === nextProps.audioBuffer
})
