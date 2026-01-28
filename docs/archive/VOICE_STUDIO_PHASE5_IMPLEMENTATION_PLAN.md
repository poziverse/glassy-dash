# Voice Studio Phase 5: Detailed Implementation Plan with Testing

**Date:** January 26, 2026  
**Status:** Ready for Implementation  
**Timeline:** 6 Weeks  
**Total Estimated Effort:** 30-40 hours

---

## Table of Contents

1. [Implementation Overview](#implementation-overview)
2. [Week 1-2: Audio Editor Foundation](#week-1-2-audio-editor-foundation)
3. [Week 3: Speaker Diarization](#week-3-speaker-diarization)
4. [Week 4: Audio Enhancements](#week-4-audio-enhancements)
5. [Week 5: Cross-Feature Integration](#week-5-cross-feature-integration)
6. [Week 6: Analytics Dashboard](#week-6-analytics-dashboard)
7. [Testing Strategy](#testing-strategy)
8. [Performance Considerations](#performance-considerations)
9. [Rollback Plan](#rollback-plan)

---

## Implementation Overview

### Dependencies Graph

```
Audio Editor (Foundation)
    ├── Waveform Visualization
    ├── Audio Buffer Utilities
    └── WAV Export
            ↓
Speaker Diarization (AI Feature)
    └── Uses Waveform + Transcript
            ↓
Audio Enhancements
    └── Uses Audio Editor
            ↓
Cross-Feature Integration
    └── Uses Speaker Diarization
            ↓
Analytics Dashboard
    └── Uses All Features
```

### Implementation Order (Critical Path)

1. **Week 1-2:** Audio Editor Foundation (MUST BE FIRST)
   - All other features depend on audio manipulation
   - Foundation for visualization and editing

2. **Week 3:** Speaker Diarization
   - Depends on audio editor (for visualization)
   - Independent of enhancements

3. **Week 4:** Audio Enhancements
   - Depends on audio editor
   - Independent of speaker features

4. **Week 5:** Cross-Feature Integration
   - Depends on speaker diarization (for task extraction)
   - Can be parallel with Week 4

5. **Week 6:** Analytics Dashboard
   - Depends on all features
   - Can be done incrementally

---

## Week 1-2: Audio Editor Foundation

### Objective
Create foundational audio editing infrastructure with waveform visualization, editing capabilities, and WAV export.

### Task List

#### Day 1-2: Audio Buffer Utilities

**Implementation:**
```jsx
// src/utils/audioBufferUtils.js
import { audioBufferToWav } from './audioBufferToWav'

export class AudioBufferUtils {
  /**
   * Create a new audio buffer with specified parameters
   */
  static createBuffer(sampleRate, channels, duration) {
    const length = Math.ceil(sampleRate * duration)
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData(channel) {
        return new Float32Array(length)
      }
    }
  }

  /**
   * Slice audio buffer from start time to end time
   */
  static sliceBuffer(buffer, startTime, endTime) {
    const startSample = Math.floor(startTime * buffer.sampleRate)
    const endSample = Math.floor(endTime * buffer.sampleRate)
    const length = endSample - startSample

    const newBuffer = {
      numberOfChannels: buffer.numberOfChannels,
      length,
      sampleRate: buffer.sampleRate
    }

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const oldData = buffer.getChannelData(channel)
      const newData = new Float32Array(length)
      newBuffer.getChannelData = () => newData

      for (let i = 0; i < length; i++) {
        newData[i] = oldData[startSample + i]
      }
    }

    return newBuffer
  }

  /**
   * Concatenate multiple audio buffers
   */
  static concatBuffers(buffers) {
    if (buffers.length === 0) return null

    const totalLength = buffers.reduce((sum, b) => sum + b.length, 0)
    const channels = buffers[0].numberOfChannels
    const sampleRate = buffers[0].sampleRate

    const newBuffer = {
      numberOfChannels: channels,
      length: totalLength,
      sampleRate
    }

    for (let channel = 0; channel < channels; channel++) {
      const newData = new Float32Array(totalLength)
      newBuffer.getChannelData = (ch) => ch === channel ? newData : newData

      let offset = 0
      for (const buffer of buffers) {
        const oldData = buffer.getChannelData(channel)
        newData.set(oldData, offset)
        offset += buffer.length
      }
    }

    return newBuffer
  }

  /**
   * Normalize audio buffer to target level
   */
  static normalizeBuffer(buffer, targetLevel = 0.89) {
    let peak = 0

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < data.length; i++) {
        peak = Math.max(peak, Math.abs(data[i]))
      }
    }

    const factor = targetLevel / peak

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < data.length; i++) {
        data[i] *= factor
      }
    }

    return buffer
  }

  /**
   * Remove silent portions from buffer
   */
  static removeSilence(buffer, threshold = 0.01, minDuration = 0.1) {
    const data = buffer.getChannelData(0)
    const sampleRate = buffer.sampleRate
    const minSamples = minDuration * sampleRate

    const segments = []
    let inSilence = true
    let segmentStart = 0

    for (let i = 0; i < data.length; i++) {
      const amplitude = Math.abs(data[i])
      const isSilent = amplitude < threshold

      if (inSilence && !isSilent) {
        // Start of non-silent segment
        segmentStart = i
        inSilence = false
      } else if (!inSilence && isSilent) {
        // End of non-silent segment
        const segmentLength = i - segmentStart
        if (segmentLength >= minSamples) {
          segments.push({
            start: segmentStart / sampleRate,
            end: i / sampleRate
          })
        }
        inSilence = true
      }
    }

    // Handle last segment
    if (!inSilence) {
      segments.push({
        start: segmentStart / sampleRate,
        end: data.length / sampleRate
      })
    }

    return segments
  }
}

// src/utils/audioBufferToWav.js
export function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const data = []
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i]
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
      data.push(intSample)
    }
  }

  const bufferLength = data.length * 2
  const headerLength = 44
  const totalLength = headerLength + bufferLength

  const arrayBuffer = new ArrayBuffer(totalLength)
  const view = new DataView(arrayBuffer)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, totalLength - 8, true)
  writeString(view, 8, 'WAVE')

  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // Chunk size
  view.setUint16(20, format, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * 2, true) // Byte rate
  view.setUint16(32, numChannels * 2, true) // Block align
  view.setUint16(34, bitDepth, true) // Bits per sample

  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, bufferLength, true)

  // Write audio data
  let offset = 44
  for (let i = 0; i < data.length; i++) {
    view.setInt16(offset, data[i], true)
    offset += 2
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
```

**Tests:**
```jsx
// src/utils/__tests__/audioBufferUtils.test.jsx
import { describe, it, expect } from 'vitest'
import { AudioBufferUtils } from '../audioBufferUtils'

describe('AudioBufferUtils', () => {
  describe('sliceBuffer', () => {
    it('should slice buffer correctly', () => {
      const buffer = createMockBuffer(44100, 1, 5) // 5 seconds
      const sliced = AudioBufferUtils.sliceBuffer(buffer, 1, 3)

      expect(sliced.length).toBe(88200) // 2 seconds * 44100
      expect(sliced.sampleRate).toBe(44100)
    })

    it('should handle start time zero', () => {
      const buffer = createMockBuffer(44100, 1, 5)
      const sliced = AudioBufferUtils.sliceBuffer(buffer, 0, 2)

      expect(sliced.length).toBe(88200)
    })

    it('should handle end time at buffer end', () => {
      const buffer = createMockBuffer(44100, 1, 5)
      const sliced = AudioBufferUtils.sliceBuffer(buffer, 3, 5)

      expect(sliced.length).toBe(88200)
    })
  })

  describe('concatBuffers', () => {
    it('should concatenate two buffers', () => {
      const buffer1 = createMockBuffer(44100, 1, 2)
      const buffer2 = createMockBuffer(44100, 1, 3)
      const concatenated = AudioBufferUtils.concatBuffers([buffer1, buffer2])

      expect(concatenated.length).toBe(220500) // 5 seconds
    })

    it('should handle multiple buffers', () => {
      const buffers = [
        createMockBuffer(44100, 1, 1),
        createMockBuffer(44100, 1, 1),
        createMockBuffer(44100, 1, 1)
      ]
      const concatenated = AudioBufferUtils.concatBuffers(buffers)

      expect(concatenated.length).toBe(132300) // 3 seconds
    })

    it('should return null for empty array', () => {
      const result = AudioBufferUtils.concatBuffers([])
      expect(result).toBeNull()
    })
  })

  describe('normalizeBuffer', () => {
    it('should normalize to target level', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      // Set peak to 0.5
      const data = buffer.getChannelData(0)
      data[0] = 0.5
      data[1] = -0.5

      const normalized = AudioBufferUtils.normalizeBuffer(buffer, 0.89)
      const newData = normalized.getChannelData(0)

      expect(newData[0]).toBeCloseTo(0.89, 2)
      expect(newData[1]).toBeCloseTo(-0.89, 2)
    })

    it('should handle already normalized buffer', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      const data = buffer.getChannelData(0)
      data[0] = 0.89
      data[1] = -0.89

      const normalized = AudioBufferUtils.normalizeBuffer(buffer)
      const newData = normalized.getChannelData(0)

      expect(newData[0]).toBeCloseTo(0.89, 2)
    })
  })

  describe('removeSilence', () => {
    it('should identify non-silent segments', () => {
      const buffer = createMockBuffer(44100, 1, 5)
      // Add some silence and non-silence
      const data = buffer.getChannelData(0)
      data[10000] = 0.5 // Non-silent
      data[50000] = 0.5 // Non-silent

      const segments = AudioBufferUtils.removeSilence(buffer, 0.01, 0.1)
      expect(segments.length).toBeGreaterThan(0)
    })

    it('should return empty array for silent buffer', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      const segments = AudioBufferUtils.removeSilence(buffer, 0.01, 0.1)
      expect(segments.length).toBe(0)
    })
  })
})

// Helper: Create mock audio buffer
function createMockBuffer(sampleRate, channels, duration) {
  const length = Math.ceil(sampleRate * duration)
  const buffer = {
    numberOfChannels: channels,
    length,
    sampleRate,
    channelData: Array(channels).fill(null).map(() => new Float32Array(length).fill(0)),
    getChannelData(channel) {
      return this.channelData[channel]
    }
  }
  return buffer
}
```

**Tests for WAV Export:**
```jsx
// src/utils/__tests__/audioBufferToWav.test.jsx
import { describe, it, expect, beforeEach } from 'vitest'
import { audioBufferToWav } from '../audioBufferToWav'

describe('audioBufferToWav', () => {
  let mockBuffer

  beforeEach(() => {
    mockBuffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 44100, // 1 second
      getChannelData() {
        return new Float32Array(44100).fill(0.5)
      }
    }
  })

  it('should create WAV blob', () => {
    const blob = audioBufferToWav(mockBuffer)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('audio/wav')
  })

  it('should have correct RIFF header', async () => {
    const blob = audioBufferToWav(mockBuffer)
    const arrayBuffer = await blob.arrayBuffer()
    const view = new DataView(arrayBuffer)

    expect(view.getUint8(0)).toBe(0x52) // 'R'
    expect(view.getUint8(1)).toBe(0x49) // 'I'
    expect(view.getUint8(2)).toBe(0x46) // 'F'
    expect(view.getUint8(3)).toBe(0x46) // 'F'
  })

  it('should have correct WAVE format', async () => {
    const blob = audioBufferToWav(mockBuffer)
    const arrayBuffer = await blob.arrayBuffer()
    const view = new DataView(arrayBuffer)

    expect(view.getUint8(8)).toBe(0x57) // 'W'
    expect(view.getUint8(9)).toBe(0x41) // 'A'
    expect(view.getUint8(10)).toBe(0x56) // 'V'
    expect(view.getUint8(11)).toBe(0x45) // 'E'
  })

  it('should handle stereo audio', () => {
    mockBuffer.numberOfChannels = 2
    mockBuffer.channelData = [
      new Float32Array(44100).fill(0.5),
      new Float32Array(44100).fill(0.5)
    ]

    const blob = audioBufferToWav(mockBuffer)
    expect(blob).toBeInstanceOf(Blob)
  })

  it('should have correct file size', async () => {
    const blob = audioBufferToWav(mockBuffer)
    expect(blob.size).toBe(44 + 44100 * 2) // Header + data
  })
})
```

---

#### Day 3-5: Waveform Visualization Component

**Implementation:**
```jsx
// src/components/voice/AudioEditor/WaveformVisualizer.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { AudioBufferUtils } from '../../../utils/audioBufferUtils'

export default function WaveformVisualizer({ 
  audioBuffer, 
  zoom = 1,
  onZoomChange,
  onRegionSelect,
  selection = null
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(0)
  const [hoverPosition, setHoverPosition] = useState(null)

  // Draw waveform
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !audioBuffer) return

    const ctx = canvas.getContext('2d')
    const container = containerRef.current

    // Set canvas size
    const width = Math.max(container.offsetWidth * zoom, container.offsetWidth)
    const height = 200
    canvas.width = width
    canvas.height = height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Get audio data
    const data = audioBuffer.getChannelData(0)
    const step = Math.ceil(data.length / width)
    const amp = height / 2

    // Draw waveform
    ctx.fillStyle = '#6366f1' // Indigo

    for (let i = 0; i < width; i++) {
      let min = 1.0
      let max = -1.0

      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j]
        if (datum < min) min = datum
        if (datum > max) max = datum
      }

      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp))
    }

    // Draw selection
    if (selection) {
      const startX = (selection.start / audioBuffer.duration) * width
      const endX = (selection.end / audioBuffer.duration) * width
      const x = Math.min(startX, endX)
      const w = Math.abs(endX - startX)

      ctx.fillStyle = 'rgba(99, 102, 241, 0.3)' // Transparent indigo
      ctx.fillRect(x, 0, w, height)

      ctx.strokeStyle = '#818cf8'
      ctx.lineWidth = 2
      ctx.strokeRect(x, 0, w, height)
    }

    // Draw hover position
    if (hoverPosition) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(hoverPosition, 0)
      ctx.lineTo(hoverPosition, height)
      ctx.stroke()
    }
  }, [audioBuffer, zoom, selection, hoverPosition])

  useEffect(() => {
    drawWaveform()
  }, [drawWaveform])

  // Handle mouse events for selection
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / canvasRef.current.width) * audioBuffer.duration

    setIsDragging(true)
    setDragStart(time)
    setHoverPosition(x)

    if (onRegionSelect) {
      onRegionSelect({ start: time, end: time })
    }
  }

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    setHoverPosition(x)

    if (isDragging && onRegionSelect) {
      const time = (x / canvasRef.current.width) * audioBuffer.duration
      onRegionSelect({ start: dragStart, end: time })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
    setHoverPosition(null)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onZoomChange && onZoomChange(Math.max(1, zoom * 0.5))}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <button
          onClick={() => onZoomChange && onZoomChange(zoom * 2)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <span className="text-sm text-gray-400 min-w-[60px]">
          {Math.round(zoom * 100)}%
        </span>
        <div className="h-6 w-px bg-gray-700" />
        <button
          onClick={() => onZoomChange && onZoomChange(1)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Reset Zoom"
        >
          <Maximize2 size={18} />
        </button>
      </div>

      {/* Waveform canvas */}
      <div className="relative rounded-lg overflow-hidden bg-black/20">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        {/* Time markers */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-black/40 flex">
          {Array.from({ length: 10 }).map((_, i) => {
            const time = (audioBuffer.duration / 10) * i
            const position = (i / 10) * 100
            return (
              <div
                key={i}
                className="absolute text-xs text-gray-400"
                style={{ left: `${position}%`, bottom: '4px' }}
              >
                {formatTime(time)}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selection info */}
      {selection && (
        <div className="text-sm text-gray-400">
          Selected: {formatTime(selection.start)} - {formatTime(selection.end)}
          {' '}({formatTime(Math.abs(selection.end - selection.start))})
        </div>
      )}
    </div>
  )
}
```

**Tests:**
```jsx
// src/components/voice/AudioEditor/__tests__/WaveformVisualizer.test.jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WaveformVisualizer from '../WaveformVisualizer'

describe('WaveformVisualizer', () => {
  const mockBuffer = {
    duration: 10,
    getChannelData: () => new Float32Array(441000).fill(0.5),
    sampleRate: 44100,
    numberOfChannels: 1
  }

  it('should render waveform', () => {
    render(<WaveformVisualizer audioBuffer={mockBuffer} />)
    expect(screen.getByRole('img')).toBeInTheDocument() // Canvas
  })

  it('should handle zoom in', () => {
    const onZoomChange = vi.fn()
    render(
      <WaveformVisualizer 
        audioBuffer={mockBuffer} 
        zoom={1}
        onZoomChange={onZoomChange}
      />
    )

    const zoomInButton = screen.getByTitle('Zoom In')
    fireEvent.click(zoomInButton)

    expect(onZoomChange).toHaveBeenCalledWith(2)
  })

  it('should handle zoom out', () => {
    const onZoomChange = vi.fn()
    render(
      <WaveformVisualizer 
        audioBuffer={mockBuffer} 
        zoom={2}
        onZoomChange={onZoomChange}
      />
    )

    const zoomOutButton = screen.getByTitle('Zoom Out')
    fireEvent.click(zoomOutButton)

    expect(onZoomChange).toHaveBeenCalledWith(1)
  })

  it('should call onRegionSelect on drag', () => {
    const onRegionSelect = vi.fn()
    render(
      <WaveformVisualizer 
        audioBuffer={mockBuffer} 
        onRegionSelect={onRegionSelect}
      />
    )

    const canvas = screen.getByRole('img')
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 100 })
    fireEvent.mouseUp(canvas)

    expect(onRegionSelect).toHaveBeenCalled()
  })

  it('should display selection info', () => {
    render(
      <WaveformVisualizer 
        audioBuffer={mockBuffer}
        selection={{ start: 0, end: 5 }}
      />
    )

    expect(screen.getByText(/Selected:/)).toBeInTheDocument()
  })

  it('should reset zoom', () => {
    const onZoomChange = vi.fn()
    render(
      <WaveformVisualizer 
        audioBuffer={mockBuffer} 
        zoom={3}
        onZoomChange={onZoomChange}
      />
    )

    const resetButton = screen.getByTitle('Reset Zoom')
    fireEvent.click(resetButton)

    expect(onZoomChange).toHaveBeenCalledWith(1)
  })
})
```

---

#### Day 6-8: Audio Editor Component

**Implementation:**
```jsx
// src/components/voice/AudioEditor.jsx
import React, { useState, useRef, useEffect } from 'react'
import { Scissors, Trash2, Save, Undo, Redo } from 'lucide-react'
import WaveformVisualizer from './AudioEditor/WaveformVisualizer'
import PlaybackControls from './PlaybackControls'
import { AudioBufferUtils } from '../../utils/audioBufferUtils'
import { audioBufferToWav } from '../../utils/audioBufferToWav'

export default function AudioEditor({ 
  audioBlob, 
  transcript,
  onSave,
  onCancel 
}) {
  const [audioBuffer, setAudioBuffer] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [selection, setSelection] = useState(null)
  const [edits, setEdits] = useState([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [editHistory, setEditHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const audioContextRef = useRef(null)

  // Load audio
  useEffect(() => {
    const loadAudio = async () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = ctx

      const arrayBuffer = await audioBlob.arrayBuffer()
      const buffer = await ctx.decodeAudioData(arrayBuffer)
      setAudioBuffer(buffer)
    }

    loadAudio()
  }, [audioBlob])

  // Apply edits
  const applyEdits = () => {
    if (edits.length === 0 || !audioBuffer) return

    let currentBuffer = audioBuffer
    const sortedEdits = [...edits].sort((a, b) => a.start - b.start)

    // Remove edited segments
    for (const edit of sortedEdits) {
      if (edit.type === 'cut') {
        const before = AudioBufferUtils.sliceBuffer(currentBuffer, 0, edit.start)
        const after = AudioBufferUtils.sliceBuffer(currentBuffer, edit.end, currentBuffer.duration)
        currentBuffer = AudioBufferUtils.concatBuffers([before, after])
      }
    }

    // Export as WAV
    const wavBlob = audioBufferToWav(currentBuffer)
    onSave(wavBlob, edits)
  }

  // Handle region selection
  const handleRegionSelect = (region) => {
    setSelection(region)
  }

  // Add cut edit
  const addCutEdit = () => {
    if (!selection || !audioBuffer) return

    const newEdit = {
      id: Date.now(),
      type: 'cut',
      start: Math.min(selection.start, selection.end),
      end: Math.max(selection.start, selection.end)
    }

    const newEdits = [...edits, newEdit]
    setEdits(newEdits)
    setSelection(null)
    saveToHistory(newEdits)
  }

  // Remove edit
  const removeEdit = (editId) => {
    const newEdits = edits.filter(e => e.id !== editId)
    setEdits(newEdits)
    saveToHistory(newEdits)
  }

  // Undo/Redo
  const saveToHistory = (newEdits) => {
    const newHistory = editHistory.slice(0, historyIndex + 1)
    newHistory.push(newEdits)
    setEditHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setCanUndo(historyIndex < editHistory.length - 1)
    setCanRedo(false)

    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift()
      setEditHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setEdits(editHistory[newIndex])
      setCanUndo(newIndex > 0)
      setCanRedo(true)
    }
  }

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setEdits(editHistory[newIndex])
      setCanUndo(true)
      setCanRedo(newIndex < editHistory.length - 1)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!audioBuffer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading audio...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Audio Editor</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo size={18} />
          </button>
        </div>
      </div>

      {/* Waveform visualization */}
      <WaveformVisualizer
        audioBuffer={audioBuffer}
        zoom={zoom}
        onZoomChange={setZoom}
        onRegionSelect={handleRegionSelect}
        selection={selection}
      />

      {/* Playback controls */}
      <PlaybackControls audioUrl={`data:audio/webm;base64,${audioBlob}`} />

      {/* Edit toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={addCutEdit}
            disabled={!selection}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Scissors size={18} />
            <span>Cut Selection</span>
          </button>
          <button
            onClick={() => setSelection(null)}
            disabled={!selection}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 size={18} />
            <span>Clear Selection</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={applyEdits}
            disabled={edits.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={18} />
            <span>Apply & Save</span>
          </button>
        </div>
      </div>

      {/* Edit list */}
      {edits.length > 0 && (
        <div className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            Edits ({edits.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {edits.map((edit) => (
              <div
                key={edit.id}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <Scissors size={16} className="text-indigo-400" />
                  <span className="text-sm text-gray-300">
                    Cut: {formatTime(edit.start)} - {formatTime(edit.end)}
                  </span>
                </div>
                <button
                  onClick={() => removeEdit(edit.id)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X size={16} className="text-gray-400 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

**Tests:**
```jsx
// src/components/voice/__tests__/AudioEditor.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AudioEditor from '../AudioEditor'
import { X } from 'lucide-react'

describe('AudioEditor', () => {
  const mockAudioBlob = new Blob(['audio data'], { type: 'audio/webm' })
  const mockTranscript = 'This is a test transcript'
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    mockOnSave.mockClear()
    mockOnCancel.mockClear()
  })

  it('should render editor', async () => {
    render(
      <AudioEditor 
        audioBlob={mockAudioBlob}
        transcript={mockTranscript}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Audio Editor')).toBeInTheDocument()
    })
  })

  it('should handle cut selection', async () => {
    render(
      <AudioEditor 
        audioBlob={mockAudioBlob}
        transcript={mockTranscript}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Audio Editor')).toBeInTheDocument()
    })

    // Simulate selection and cut
    const canvas = screen.getByRole('img')
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 100 })
    fireEvent.mouseUp(canvas)

    const cutButton = await screen.findByText('Cut Selection')
    fireEvent.click(cutButton)

    await waitFor(() => {
      expect(screen.getByText(/Edits \(1\)/)).toBeInTheDocument()
    })
  })

  it('should handle undo/redo', async () => {
    render(
      <AudioEditor 
        audioBlob={mockAudioBlob}
        transcript={mockTranscript}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Audio Editor')).toBeInTheDocument()
    })

    // Create an edit
    const canvas = screen.getByRole('img')
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 100 })
    fireEvent.mouseUp(canvas)

    const cutButton = await screen.findByText('Cut Selection')
    fireEvent.click(cutButton)

    await waitFor(() => {
      expect(screen.getByText(/Edits \(1\)/)).toBeInTheDocument()
    })

    // Test undo
    const undoButton = screen.getByTitle('Undo')
    fireEvent.click(undoButton)

    await waitFor(() => {
      expect(screen.queryByText(/Edits \(1\)/)).not.toBeInTheDocument()
    })
  })

  it('should save edits', async () => {
    render(
      <AudioEditor 
        audioBlob={mockAudioBlob}
        transcript={mockTranscript}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Audio Editor')).toBeInTheDocument()
    })

    // Create an edit
    const canvas = screen.getByRole('img')
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 })
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 100 })
    fireEvent.mouseUp(canvas)

    const cutButton = await screen.findByText('Cut Selection')
    fireEvent.click(cutButton)

    await waitFor(() => {
      expect(screen.getByText(/Edits \(1\)/)).toBeInTheDocument()
    })

    // Save
    const saveButton = screen.getByText('Apply & Save')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled()
    })
  })

  it('should cancel editing', () => {
    render(
      <AudioEditor 
        audioBlob={mockAudioBlob}
        transcript={mockTranscript}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })
})
```

---

## Week 3: Speaker Diarization

### Objective
Implement AI-powered speaker identification with custom labels and filtering.

### Task List

#### Day 1-2: Speaker Identification Service

**Implementation:**
```jsx
// src/services/speakerDiarization.js
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export class SpeakerDiarizationService {
  static async identifySpeakers(audioBlob, transcript) {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash' 
    })

    const prompt = `
      Analyze this transcript and identify different speakers.
      Speaker changes are indicated by context, pauses, and content shifts.
      
      Return a JSON array of segments with the following structure:
      [
        {
          "speaker": "Speaker 1",
          "startTime": 0.0,
          "endTime": 2.5,
          "text": "segment text",
          "confidence": 0.9
        }
      ]
      
      Guidelines:
      - Start with "Speaker 1" and increment for each new speaker
      - Use timestamps that match the natural flow of conversation
      - Each segment should be a complete thought or statement
      - Confidence should be between 0.0 and 1.0
      
      Transcript:
      ${transcript}
    `

    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Parse JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('Failed to parse speaker segments')
      }
      
      const segments = JSON.parse(jsonMatch[0])
      
      // Validate segments
      return segments.map((segment, index) => ({
        ...segment,
        id: crypto.randomUUID(),
        speakerId: `speaker-${segment.speaker.replace(/\s/g, '-').toLowerCase()}`,
        color: getSpeakerColor(segment.speaker),
        order: index
      }))
    } catch (error) {
      console.error('Speaker diarization failed:', error)
      throw error
    }
  }

  static async renameSpeaker(recordingId, oldName, newName) {
    // Implementation would update recording metadata
    // This would be stored in the recording's speakerLabels
  }

  static async mergeSpeakers(recordingId, speakerIds) {
    // Implementation would merge multiple speaker IDs into one
    // Useful when AI incorrectly splits one speaker into multiple
  }
}

// Generate consistent color for speakers
function getSpeakerColor(speaker) {
  const colors = [
    '#6366f1', // indigo
    '#a855f7', // purple
    '#ec4899', // pink
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#64748b'  // gray
  ]
  
  const hash = speaker.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  return colors[hash % colors.length]
}
```

**Tests:**
```jsx
// src/services/__tests__/speakerDiarization.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpeakerDiarizationService } from '../speakerDiarization'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Mock Gemini
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(),
  getGenerativeModel: vi.fn()
}))

describe('SpeakerDiarizationService', () => {
  const mockAudioBlob = new Blob(['audio'], { type: 'audio/webm' })
  const mockTranscript = 'Hello, how are you? I am good, thanks.'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should identify speakers', async () => {
    // Mock Gemini response
    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify([
            {
              speaker: 'Speaker 1',
              startTime: 0,
              endTime: 2,
              text: 'Hello, how are you?',
              confidence: 0.9
            },
            {
              speaker: 'Speaker 2',
              startTime: 2,
              endTime: 4,
              text: 'I am good, thanks.',
              confidence: 0.85
            }
          ])
        }
      })
    }

    const segments = await SpeakerDiarizationService.identifySpeakers(
      mockAudioBlob,
      mockTranscript
    )

    expect(segments).toHaveLength(2)
    expect(segments[0].speaker).toBe('Speaker 1')
    expect(segments[1].speaker).toBe('Speaker 2')
    expect(segments[0].id).toBeDefined()
    expect(segments[0].speakerId).toBeDefined()
    expect(segments[0].color).toBeDefined()
  })

  it('should handle single speaker', async () => {
    const mockSegments = [
      {
        speaker: 'Speaker 1',
        startTime: 0,
        endTime: 5,
        text: 'Single speaker text',
        confidence: 0.95
      }
    ]

    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockSegments)
        }
      })
    }

    const segments = await SpeakerDiarizationService.identifySpeakers(
      mockAudioBlob,
      mockTranscript
    )

    expect(segments).toHaveLength(1)
    expect(segments[0].speaker).toBe('Speaker 1')
  })

  it('should assign consistent colors', async () => {
    const mockSegments = [
      { speaker: 'Speaker 1', startTime: 0, endTime: 2, text: 'Test', confidence: 0.9 },
      { speaker: 'Speaker 2', startTime: 2, endTime: 4, text: 'Test', confidence: 0.9 }
    ]

    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockSegments)
        }
      })
    }

    const segments = await SpeakerDiarizationService.identifySpeakers(
      mockAudioBlob,
      mockTranscript
    )

    const color1 = segments[0].color
    const color2 = segments[1].color

    expect(color1).toBeDefined()
    expect(color2).toBeDefined()
    expect(typeof color1).toBe('string')
    expect(color1).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('should handle API errors', async () => {
    const mockModel = {
      generateContent: vi.fn().mockRejectedValue(new Error('API Error'))
    }

    await expect(
      SpeakerDiarizationService.identifySpeakers(mockAudioBlob, mockTranscript)
    ).rejects.toThrow('API Error')
  })

  it('should validate segments structure', async () => {
    const invalidSegments = 'invalid json'

    const mockModel = {
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => invalidSegments
        }
      })
    }

    await expect(
      SpeakerDiarizationService.identifySpeakers(mockAudioBlob, mockTranscript)
    ).rejects.toThrow('Failed to parse speaker segments')
  })
})
```

---

#### Day 3-5: Speaker Labeling UI Component

**Implementation:**
```jsx
// src/components/voice/SpeakerLabeler.jsx
import React, { useState, useEffect } from 'react'
import { User, Edit2, Check, X, Filter } from 'lucide-react'
import { SpeakerDiarizationService } from '../../services/speakerDiarization'
import PlaybackControls from './PlaybackControls'

export default function SpeakerLabeler({ 
  recording, 
  onSpeakersUpdate,
  onSpeakerRename 
}) {
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingSpeaker, setEditingSpeaker] = useState(null)
  const [newName, setNewName] = useState('')
  const [filterBySpeaker, setFilterBySpeaker] = useState(null)
  const [currentSegment, setCurrentSegment] = useState(null)

  useEffect(() => {
    identifySpeakers()
  }, [recording])

  const identifySpeakers = async () => {
    setLoading(true)
    try {
      const audioBlob = new Blob([atob(recording.audioData)], { type: 'audio/webm' })
      const identified = await SpeakerDiarizationService.identifySpeakers(
        audioBlob,
        recording.transcript
      )
      setSegments(identified)
      onSpeakersUpdate?.(identified)
    } catch (error) {
      console.error('Failed to identify speakers:', error)
    } finally {
      setLoading(false)
    }
  }

  const uniqueSpeakers = React.useMemo(() => {
    const speakers = {}
    segments.forEach(segment => {
      if (!speakers[segment.speaker]) {
        speakers[segment.speaker] = {
          speaker: segment.speaker,
          speakerId: segment.speakerId,
          color: segment.color,
          count: 0,
          totalDuration: 0
        }
      }
      speakers[segment.speaker].count++
      speakers[segment.speaker].totalDuration += (segment.endTime - segment.startTime)
    })
    return Object.values(speakers)
  }, [segments])

  const handleStartEdit = (speaker) => {
    setEditingSpeaker(speaker)
    setNewName(speaker.speaker)
  }

  const handleSaveRename = () => {
    if (editingSpeaker && newName.trim()) {
      onSpeakerRename?.(recording.id, editingSpeaker.speaker, newName)
      
      // Update local segments
      setSegments(segments.map(seg =>
        seg.speaker === editingSpeaker.speaker
          ? { ...seg, speaker: newName }
          : seg
      ))
      
      setEditingSpeaker(null)
      setNewName('')
    }
  }

  const handleCancelEdit = () => {
    setEditingSpeaker(null)
    setNewName('')
  }

  const handleSegmentClick = (segment) => {
    setCurrentSegment(segment)
    // Jump to that position in playback
    // (would integrate with PlaybackControls)
  }

  const filteredSegments = React.useMemo(() => {
    if (!filterBySpeaker) return segments
    return segments.filter(s => s.speaker === filterBySpeaker)
  }, [segments, filterBySpeaker])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Analyzing speakers...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User size={20} className="text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Speaker Labeling</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {filterBySpeaker && (
            <button
              onClick={() => setFilterBySpeaker(null)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Clear filter"
            >
              <X size={18} />
            </button>
          )}
          <select
            value={filterBySpeaker || 'all'}
            onChange={(e) => setFilterBySpeaker(e.target.value === 'all' ? null : e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/10 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Speakers</option>
            {uniqueSpeakers.map(speaker => (
              <option key={speaker.speakerId} value={speaker.speaker}>
                {speaker.speaker}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Playback */}
      <PlaybackControls audioUrl={`data:audio/webm;base64,${recording.audioData}`} />

      {/* Speaker Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {uniqueSpeakers.map(speaker => (
          <div
            key={speaker.speakerId}
            className="p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: speaker.color }}
              />
              <div className="flex-1">
                {editingSpeaker?.speaker === speaker.speaker ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveRename()}
                      className="bg-transparent border-b border-indigo-500 text-white focus:outline-none w-full"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveRename}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <Check size={14} className="text-green-400" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X size={14} className="text-red-400" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="text-white font-medium cursor-pointer hover:text-indigo-400"
                    onClick={() => handleStartEdit(speaker)}
                  >
                    {speaker.speaker}
                  </div>
                )}
              </div>
              {!editingSpeaker && (
                <button
                  onClick={() => handleStartEdit(speaker)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Rename speaker"
                >
                  <Edit2 size={14} className="text-gray-400" />
                </button>
              )}
            </div>
            <div className="text-sm text-gray-400">
              {speaker.count} segments
            </div>
            <div className="text-sm text-gray-400">
              {formatDuration(speaker.totalDuration)}
            </div>
          </div>
        ))}
      </div>

      {/* Segments Timeline */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-400 mb-3">
          Transcript Segments ({filteredSegments.length})
        </h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredSegments.map((segment, index) => (
            <div
              key={segment.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                currentSegment?.id === segment.id
                  ? 'bg-indigo-600/30 border border-indigo-500'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
              }`}
              onClick={() => handleSegmentClick(segment)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">
                      {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400">
                      {segment.speaker}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-400">
                      {(segment.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 break-words">
                    {segment.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Tests:**
```jsx
// src/components/voice/__tests__/SpeakerLabeler.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import SpeakerLabeler from '../SpeakerLabeler'
import { SpeakerDiarizationService } from '../../../services/speakerDiarization'

vi.mock('../../../services/speakerDiarization')

describe('SpeakerLabeler', () => {
  const mockRecording = {
    id: 'test-recording',
    transcript: 'Hello, how are you? I am good, thanks.',
    audioData: 'base64encodedaudio'
  }

  const mockSegments = [
    {
      id: 'segment-1',
      speaker: 'Speaker 1',
      speakerId: 'speaker-1',
      startTime: 0,
      endTime: 2,
      text: 'Hello, how are you?',
      confidence: 0.9,
      color: '#6366f1'
    },
    {
      id: 'segment-2',
      speaker: 'Speaker 2',
      speakerId: 'speaker-2',
      startTime: 2,
      endTime: 4,
      text: 'I am good, thanks.',
      confidence: 0.85,
      color: '#a855f7'
    }
  ]

  const mockOnSpeakersUpdate = vi.fn()
  const mockOnSpeakerRename = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    SpeakerDiarizationService.identifySpeakers.mockResolvedValue(mockSegments)
  })

  it('should render speaker labeling', async () => {
    render(
      <SpeakerLabeler 
        recording={mockRecording}
        onSpeakersUpdate={mockOnSpeakersUpdate}
        onSpeakerRename={mockOnSpeakerRename}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Speaker Labeling')).toBeInTheDocument()
    })

    expect(screen.getByText('Speaker 1')).toBeInTheDocument()
    expect(screen.getByText('Speaker 2')).toBeInTheDocument()
  })

  it('should display segment count', async () => {
    render(
      <SpeakerLabeler 
        recording={mockRecording}
        onSpeakersUpdate={mockOnSpeakersUpdate}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('2 segments')).toBeInTheDocument()
    })
  })

  it('should handle speaker rename', async () => {
    render(
      <SpeakerLabeler 
        recording={mockRecording}
        onSpeakerRename={mockOnSpeakerRename}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Speaker 1')).toBeInTheDocument()
    })

    // Click on speaker name to edit
    const speakerName = screen.getByText('Speaker 1')
    fireEvent.click(speakerName)

    // Change name
    const input = await screen.findByRole('textbox')
    fireEvent.change(input, { target: { value: 'John' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' })

    expect(mockOnSpeakerRename).toHaveBeenCalledWith(
      mockRecording.id,
      'Speaker 1',
      'John'
    )
  })

  it('should filter by speaker', async () => {
    render(
      <SpeakerLabeler 
        recording={mockRecording}
        onSpeakersUpdate={mockOnSpeakersUpdate}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Speaker Labeling')).toBeInTheDocument()
    })

    // Select speaker filter
    const filter = screen.getByRole('combobox')
    fireEvent.change(filter, { target: { value: 'Speaker 1' } })

    await waitFor(() => {
      expect(screen.getByText('1 segments')).toBeInTheDocument()
    })
  })

  it('should handle segment click', async () => {
    render(
      <SpeakerLabeler 
        recording={mockRecording}
        onSpeakersUpdate={mockOnSpeakersUpdate}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
    })

    const segment = screen.getByText('Hello, how are you?')
    fireEvent.click(segment)

    expect(segment).toHaveClass('border-indigo-500')
  })
})
```

---

## Testing Strategy

### Testing Pyramid

```
                    /\
                   /  \   E2E Tests (5%)
                  /____\  Integration Tests (25%)
                 /      \ Unit Tests (70%)
                /________\
```

### Unit Tests (70%)

**Target Coverage:** 85%+  
**Framework:** Vitest  
**Location:** `src/**/__tests__/`

**Test Categories:**
1. Utilities (audioBufferUtils, audioBufferToWav)
2. Services (speakerDiarization)
3. Components (AudioEditor, WaveformVisualizer, SpeakerLabeler)
4. Store (voiceStore actions)

**Example Test Structure:**
```jsx
describe('ComponentName', () => {
  describe('Feature Area', () => {
    it('should do something specific', () => {
      // Arrange
      const props = { ... }
      
      // Act
      render(<ComponentName {...props} />)
      
      // Assert
      expect(screen.getByText('...')).toBeInTheDocument()
    })
    
    it('should handle edge case', () => {
      // Edge case testing
    })
    
    it('should trigger callback on interaction', () => {
      // User interaction testing
    })
  })
})
```

### Integration Tests (25%)

**Target Coverage:** 75%+  
**Framework:** Vitest + Testing Library  
**Location:** `tests/integration/`

**Test Scenarios:**
1. Audio Editor full workflow
2. Speaker diarization pipeline
3. Audio enhancement application
4. Cross-feature integration flows

**Example:**
```jsx
describe('Audio Editor Integration', () => {
  it('should complete edit workflow', async () => {
    // Load audio
    // Select region
    // Apply cut
    // Save changes
    // Verify output
  })
})
```

### E2E Tests (5%)

**Target Coverage:** Key user journeys  
**Framework:** Playwright  
**Location:** `tests/e2e/`

**Test Scenarios:**
1. Record → Edit → Save
2. Record → Identify Speakers → Rename
3. Edit → Enhance → Export
4. Record → Create Tasks

**Example:**
```jsx
test('complete audio editing workflow', async ({ page }) => {
  await page.goto('/')
  await page.click('[data-testid="record-button"]')
  // ... full user journey
})
```

---

## Performance Considerations

### 1. Large File Handling

**Challenge:** Audio files can be large (10MB+)  
**Solution:**
- Use Web Workers for processing
- Stream audio data in chunks
- Show progress indicators

**Implementation:**
```javascript
// src/utils/audioWorker.js
self.addEventListener('message', (e) => {
  const { type, data } = e.data
  
  switch (type) {
    case 'process-audio':
      // Process in background
      const result = processAudioChunk(data)
      self.postMessage({ type: 'progress', percent: 50 })
      self.postMessage({ type: 'complete', result })
      break
  }
})
```

### 2. Memory Management

**Challenge:** Audio buffers consume memory  
**Solution:**
- Reuse buffers when possible
- Clean up unused buffers
- Use OfflineAudioContext for processing

**Implementation:**
```javascript
useEffect(() => {
  const buffer = loadAudio()
  
  return () => {
    // Cleanup
    buffer = null
  }
}, [])
```

### 3. Rendering Performance

**Challenge:** Waveform drawing can be slow  
**Solution:**
- Use requestAnimationFrame
- Debounce redraws
- Canvas optimization

**Implementation:**
```javascript
const drawWaveform = useCallback(() => {
  requestAnimationFrame(() => {
    // Draw waveform
  })
}, [audioBuffer, zoom])
```

---

## Rollback Plan

### Trigger Conditions

1. **Performance Regression**
   - Audio processing >5 seconds
   - UI freezes during operations
   - Memory leaks detected

2. **Quality Issues**
   - Audio export produces corrupted files
   - Speaker diarization accuracy <60%
   - Audio enhancement degrades quality

3. **User Feedback**
   - Negative feedback on features
   - Low adoption rates
   - High bug reports

### Rollback Steps

1. **Disable Features via Feature Flags**
```javascript
const FEATURES = {
  AUDIO_EDITOR: import.meta.env.VITE_ENABLE_AUDIO_EDITOR === 'true',
  SPEAKER_DIARIZATION: import.meta.env.VITE_ENABLE_SPEAKER_DIARIZATION === 'true',
  AUDIO_ENHANCEMENTS: import.meta.env.VITE_ENABLE_AUDIO_ENHANCEMENTS === 'true'
}
```

2. **Revert to Previous Version**
```bash
git checkout phase-4-final
npm run build
```

3. **Monitor Metrics**
- Track error rates
- Monitor performance
- Collect user feedback

4. **Fix and Re-deploy**
- Address issues
- Test thoroughly
- Re-deploy with fixes

---

## Success Metrics

### User Adoption
- Audio editor usage rate: >30% of active users
- Speaker diarization usage rate: >20% of active users
- Feature satisfaction score: >4.0/5.0

### Technical Performance
- Audio processing time: <5 seconds for 5-minute recording
- Speaker identification accuracy: >75%
- Memory usage: <500MB for typical session

### Code Quality
- Test coverage: >85%
- Linter errors: 0
- Critical bugs: 0 within 30 days

---

## Next Steps

### Immediate (Week 1)
1. ✅ Create implementation plan
2. ⏳ Set up test infrastructure
3. ⏳ Implement AudioBuffer utilities
4. ⏳ Write unit tests

### Week 2-6
1. ⏳ Follow implementation plan
2. ⏳ Write tests as features are built
3. ⏳ Performance testing
4. ⏳ User acceptance testing

### Post-Implementation
1. ⏳ Monitor metrics
2. ⏳ Gather feedback
3. ⏳ Plan Phase 6

---

**Document Version:** 1.0  
**Last Updated:** January 26, 2026  
**Next:** Begin Week 1 Implementation
