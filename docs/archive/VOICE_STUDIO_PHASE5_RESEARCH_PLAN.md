# Voice Studio Phase 5: Advanced Features - Research-Based Plan

**Date:** January 25, 2026  
**Research Sources:** Descript, Otter.ai, Riverside.fm, Adobe Podcast, 2025-2026 AI/ML trends  
**Timeline:** Week 5

---

## Executive Summary

Phase 5 focuses on advanced AI-powered features, audio editing capabilities, and enhanced integrations. Based on research of cutting-edge audio tools and 2025-2026 AI/ML trends.

## Research Findings

### Best Practices from Advanced Audio Tools

**1. Audio Editing (Descript, Adobe Podcast)**
- ✅ Non-destructive editing
- ✅ Waveform visualization with edit points
- ✅ Delete filler words (um, uh, like)
- ✅ Noise reduction
- ✅ Volume normalization
- ✅ Cut/Copy/Paste segments
- ✅ Undo/Redo for edits
- ✅ Export edited versions

**2. Speaker Diarization (Otter.ai, Riverside)**
- ✅ Automatic speaker identification
- ✅ Speaker labels (Speaker A, Speaker B)
- ✅ Custom speaker names
- ✅ Highlight speaker segments
- ✅ Filter by speaker
- ✅ Speaker statistics

**3. AI-Powered Enhancements (Adobe Podcast, Descript)**
- ✅ Noise removal (background noise)
- ✅ Speech enhancement (clarify)
- ✅ Auto-leveling (volume normalization)
- ✅ Echo cancellation
- ✅ Reverb reduction
- ✅ Real-time preview

**4. Cross-Feature Integration (Notion, Evernote)**
- ✅ Link voice notes to documents
- ✅ Embed audio in notes
- ✅ @mention recordings in documents
- ✅ Create tasks from voice notes
- ✅ Extract action items
- ✅ Sync with calendar

**5. Collaboration & Sharing (Google Drive, Dropbox)**
- ✅ Share recordings via link
- ✅ Collaborative editing
- ✅ Comment on transcripts
- ✅ Version history
- ✅ Access controls
- ✅ Activity feed

**6. Analytics & Insights (Otter.ai Enterprise)**
- ✅ Recording statistics
- ✅ Usage patterns
- ✅ Word frequency analysis
- ✅ Speaking time distribution
- ✅ Audio quality metrics
- ✅ Engagement metrics

---

## Phase 5 Implementation Plan

### 1. Audio Editing

**Priority:** High  
**Impact:** Transform voice memos into edited content

**Features:**
- Waveform visualization with zoom
- Cut/Delete segments
- Trim start/end
- Remove filler words (um, uh, like)
- Noise reduction
- Volume normalization
- Export edited version

**Implementation:**

```jsx
// Create AudioEditor component
import { useEffect, useRef, useState } from 'react'

export default function AudioEditor({ audioBlob, transcript, onSave }) {
  const canvasRef = useRef(null)
  const audioContextRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [selection, setSelection] = useState(null) // { start, end }
  const [edits, setEdits] = useState([]) // Array of edit points
  
  const audioBuffer = useRef(null)
  const duration = useRef(0)
  
  // Load audio
  useEffect(() => {
    const loadAudio = async () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = ctx
      
      const arrayBuffer = await audioBlob.arrayBuffer()
      const buffer = await ctx.decodeAudioData(arrayBuffer)
      audioBuffer.current = buffer
      duration.current = buffer.duration
      
      drawWaveform()
    }
    
    loadAudio()
  }, [audioBlob])
  
  // Draw waveform
  const drawWaveform = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const buffer = audioBuffer.current
    const data = buffer.getChannelData(0)
    
    const width = canvas.width
    const height = canvas.height
    const step = Math.ceil(data.length / width)
    const amp = height / 2
    
    ctx.clearRect(0, 0, width, height)
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
  }
  
  // Handle click/drag for selection
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / canvasRef.current.width) * duration.current * zoom
    
    setSelection({ start: time, end: time })
  }
  
  const handleMouseMove = (e) => {
    if (!selection) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = (x / canvasRef.current.width) * duration.current * zoom
    
    setSelection({ ...selection, end: time })
  }
  
  const handleMouseUp = () => {
    if (selection) {
      // Add edit point
      setEdits([...edits, {
        type: 'cut',
        start: Math.min(selection.start, selection.end),
        end: Math.max(selection.start, selection.end)
      }])
      setSelection(null)
    }
  }
  
  // Apply edits and export
  const applyEdits = async () => {
    const ctx = audioContextRef.current
    const originalBuffer = audioBuffer.current
    
    // Calculate new length after edits
    const totalRemoved = edits.reduce((sum, edit) => sum + (edit.end - edit.start), 0)
    const newLength = originalBuffer.length - totalRemoved
    
    // Create new buffer
    const newBuffer = ctx.createBuffer(
      originalBuffer.numberOfChannels,
      newLength,
      originalBuffer.sampleRate
    )
    
    // Copy data, skipping edited regions
    let writeOffset = 0
    for (let channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
      const oldData = originalBuffer.getChannelData(channel)
      const newData = newBuffer.getChannelData(channel)
      
      let readOffset = 0
      for (let i = 0; i < oldData.length; i++) {
        // Check if current position is in an edited region
        const inEdit = edits.some(
          edit => i >= edit.start * originalBuffer.sampleRate && 
                  i <= edit.end * originalBuffer.sampleRate
        )
        
        if (!inEdit) {
          newData[writeOffset++] = oldData[i]
        }
        readOffset++
      }
    }
    
    // Export as blob
    const offlineCtx = new OfflineAudioContext(newBuffer.sampleRate, newBuffer.length)
    const source = offlineCtx.createBufferSource()
    source.buffer = newBuffer
    source.connect(offlineCtx.destination)
    source.start()
    
    const renderedBuffer = await offlineCtx.startRendering()
    
    // Convert to WAV
    const wavBlob = await audioBufferToWav(renderedBuffer)
    onSave(wavBlob)
  }
  
  return (
    <div className="audio-editor space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button onClick={() => setZoom(Math.max(1, zoom * 0.5))} title="Zoom Out">
          <ZoomOut size={20} />
        </button>
        <button onClick={() => setZoom(zoom * 2)} title="Zoom In">
          <ZoomIn size={20} />
        </button>
        <span className="text-sm text-gray-400">{Math.round(zoom * 100)}%</span>
        
        <div className="h-6 w-px bg-gray-700" />
        
        <button onClick={() => removeFillerWords()} title="Remove Filler Words">
          <Scissors size={20} />
        </button>
        <button onClick={() => normalizeVolume()} title="Normalize Volume">
          <Volume2 size={20} />
        </button>
        <button onClick={() => reduceNoise()} title="Reduce Noise">
          <XCircle size={20} />
        </button>
      </div>
      
      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        width={800 * zoom}
        height={200}
        className="w-full rounded-lg bg-black/20 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      
      {/* Timeline */}
      <div className="relative h-6 bg-white/5 rounded">
        {Array.from({ length: 10 }).map((_, i) => {
          const time = (duration.current / 10) * i
          return (
            <div
              key={i}
              className="absolute top-0 text-xs text-gray-500"
              style={{ left: `${i * 10}%` }}
            >
              {formatTime(time)}
            </div>
          )
        })}
      </div>
      
      {/* Edit list */}
      {edits.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-400">Edits</h4>
          <div className="space-y-1">
            {edits.map((edit, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-white/5">
                <span className="text-sm text-gray-300">
                  Cut: {formatTime(edit.start)} - {formatTime(edit.end)}
                </span>
                <button onClick={() => removeEdit(index)}>
                  <X size={16} className="text-gray-400 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Save button */}
      <button
        onClick={applyEdits}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
      >
        Apply Edits & Export
      </button>
    </div>
  )
}

// Helper: Remove filler words
const removeFillerWords = () => {
  const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically']
  const transcript = useVoiceStore.getState().currentTranscript
  
  // Use regex to find and mark filler words
  fillerWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    const matches = transcript.match(regex)
    
    if (matches) {
      // Add edit points for each filler word occurrence
      // (Simplified - in reality, need timestamps)
    }
  })
}

// Helper: Normalize volume
const normalizeVolume = async () => {
  const buffer = audioBuffer.current
  const channelData = buffer.getChannelData(0)
  
  // Find peak amplitude
  let peak = 0
  for (let i = 0; i < channelData.length; i++) {
    peak = Math.max(peak, Math.abs(channelData[i]))
  }
  
  // Calculate normalization factor (target -1dBFS = 0.89)
  const targetAmplitude = 0.89
  const normalizationFactor = targetAmplitude / peak
  
  // Apply normalization
  for (let i = 0; i < channelData.length; i++) {
    channelData[i] *= normalizationFactor
  }
  
  drawWaveform() // Redraw with normalized audio
}

// Helper: Reduce noise (simple implementation)
const reduceNoise = async () => {
  const buffer = audioBuffer.current
  const channelData = buffer.getChannelData(0)
  
  // Simple noise gate (silence low-amplitude sections)
  const noiseThreshold = 0.02
  const fadeLength = 100 // samples
  
  for (let i = 0; i < channelData.length; i++) {
    const amplitude = Math.abs(channelData[i])
    
    if (amplitude < noiseThreshold) {
      // Apply fade out/in
      if (i > fadeLength && i < channelData.length - fadeLength) {
        const prevAmp = Math.abs(channelData[i - fadeLength])
        const nextAmp = Math.abs(channelData[i + fadeLength])
        
        if (prevAmp > noiseThreshold || nextAmp > noiseThreshold) {
          // Crossfade
          channelData[i] *= 0.1 // Reduce noise
        }
      }
    }
  }
  
  drawWaveform()
}
```

---

### 2. Speaker Diarization

**Priority:** High  
**Impact:** Multi-speaker recordings

**Features:**
- Automatic speaker identification
- Speaker labels (Speaker 1, Speaker 2)
- Custom speaker names
- Highlight speaker segments
- Filter by speaker
- Speaker statistics

**Implementation:**

```javascript
// Use Gemini or specialized API for speaker diarization
export const identifySpeakers = async (audioBlob, transcript) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const prompt = `
    Analyze this transcript and identify different speakers.
    Return a JSON array of segments with speaker labels.
    
    Transcript: ${transcript}
    
    Format:
    [
      {
        "speaker": "Speaker 1",
        "startTime": 0.5,
        "endTime": 2.3,
        "text": "...",
        "speakerName": "optional custom name"
      }
    ]
  `
  
  const result = await model.generateContent(prompt)
  const response = await result.response
  const segments = JSON.parse(response.text())
  
  return segments
}

// UI for speaker labeling
const SpeakerLabeler = ({ segments, onSpeakerRename }) => (
  <div className="space-y-4">
    {Object.entries(groupBySpeaker(segments)).map(([speaker, speakerSegments]) => (
      <div key={speaker} className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-3 h-3 rounded-full ${getSpeakerColor(speaker)}`} />
          <input
            type="text"
            defaultValue={speaker}
            onBlur={(e) => onSpeakerRename(speaker, e.target.value)}
            className="bg-transparent border-b border-gray-600 text-white focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-xs text-gray-400">
            {speakerSegments.length} segments
          </span>
        </div>
        
        <div className="space-y-2">
          {speakerSegments.map((segment, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg cursor-pointer hover:bg-white/5 ${getSpeakerColor(speaker)}`}
              onClick={() => playSegment(segment.startTime, segment.endTime)}
            >
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                <Clock size={12} />
                <span>{formatTime(segment.startTime)} - {formatTime(segment.endTime)}</span>
              </div>
              <p className="text-sm text-gray-200">{segment.text}</p>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)
```

---

### 3. AI-Powered Audio Enhancements

**Priority:** High  
**Impact:** Improve audio quality automatically

**Features:**
- Noise removal (background noise)
- Speech enhancement (clarify)
- Auto-leveling (volume normalization)
- Echo cancellation
- Real-time preview

**Implementation:**

```javascript
// Use Web Audio API for audio processing
export class AudioEnhancer {
  constructor(audioContext) {
    this.audioContext = audioContext
    this.sourceNode = null
    this.gainNode = null
    this.filterNode = null
    this.compressorNode = null
  }
  
  setup(audioBuffer) {
    // Create nodes
    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = audioBuffer
    
    this.gainNode = this.audioContext.createGain()
    this.filterNode = this.audioContext.createBiquadFilter()
    this.compressorNode = this.audioContext.createDynamicsCompressor()
    
    // Connect nodes
    this.sourceNode.connect(this.filterNode)
    this.filterNode.connect(this.gainNode)
    this.gainNode.connect(this.compressorNode)
    this.compressorNode.connect(this.audioContext.destination)
  }
  
  // Remove background noise
  removeNoise(threshold = 0.02) {
    this.filterNode.type = 'highpass'
    this.filterNode.frequency.value = 80 // Remove low-frequency noise
    this.filterNode.Q.value = 0.5
  }
  
  // Enhance speech
  enhanceSpeech() {
    // Boost speech frequencies (300-3400 Hz)
    this.filterNode.type = 'peaking'
    this.filterNode.frequency.value = 2000
    this.filterNode.Q.value = 1
    this.filterNode.gain.value = 3 // +3dB boost
  }
  
  // Auto-leveling
  autoLevel() {
    this.compressorNode.threshold.value = -20
    this.compressorNode.knee.value = 40
    this.compressorNode.ratio.value = 12
    this.compressorNode.attack.value = 0
    this.compressorNode.release.value = 0.25
  }
  
  // Remove echo
  removeEcho() {
    this.compressorNode.threshold.value = -30
    this.compressorNode.ratio.value = 3
    this.compressorNode.attack.value = 0.001
    this.compressorNode.release.value = 0.05
  }
  
  // Export enhanced audio
  async export() {
    const duration = this.sourceNode.buffer.duration
    const offlineCtx = new OfflineAudioContext(
      this.audioContext.sampleRate,
      duration
    )
    
    // Recreate node chain in offline context
    const source = offlineCtx.createBufferSource()
    source.buffer = this.sourceNode.buffer
    
    const filter = offlineCtx.createBiquadFilter()
    filter.type = this.filterNode.type
    filter.frequency.value = this.filterNode.frequency.value
    filter.Q.value = this.filterNode.Q.value
    filter.gain.value = this.filterNode.gain.value
    
    const gain = offlineCtx.createGain()
    gain.gain.value = this.gainNode.gain.value
    
    const compressor = offlineCtx.createDynamicsCompressor()
    compressor.threshold.value = this.compressorNode.threshold.value
    compressor.knee.value = this.compressorNode.knee.value
    compressor.ratio.value = this.compressorNode.ratio.value
    compressor.attack.value = this.compressorNode.attack.value
    compressor.release.value = this.compressorNode.release.value
    
    source.connect(filter)
    filter.connect(gain)
    gain.connect(compressor)
    compressor.connect(offlineCtx.destination)
    
    source.start()
    
    const renderedBuffer = await offlineCtx.startRendering()
    return audioBufferToWav(renderedBuffer)
  }
}

// UI for audio enhancements
const AudioEnhancements = ({ audioBlob, onEnhanced }) => {
  const [enhancer, setEnhancer] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  
  useEffect(() => {
    const ctx = new AudioContext()
    const enhancerInstance = new AudioEnhancer(ctx)
    
    audioBlob.arrayBuffer().then(buffer => {
      ctx.decodeAudioData(buffer).then(audioBuffer => {
        enhancerInstance.setup(audioBuffer)
        setEnhancer(enhancerInstance)
      })
    })
  }, [audioBlob])
  
  const applyEnhancement = (type) => {
    if (!enhancer) return
    
    switch (type) {
      case 'noise':
        enhancer.removeNoise()
        break
      case 'speech':
        enhancer.enhanceSpeech()
        break
      case 'leveling':
        enhancer.autoLevel()
        break
      case 'echo':
        enhancer.removeEcho()
        break
    }
    
    if (previewing) {
      enhancer.sourceNode.start(0)
    }
  }
  
  const handleSave = async () => {
    const enhancedBlob = await enhancer.export()
    onEnhanced(enhancedBlob)
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Audio Enhancements</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => applyEnhancement('noise')}
          className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left"
        >
          <XCircle size={24} className="text-indigo-400 mb-2" />
          <div className="font-medium text-white">Remove Noise</div>
          <div className="text-xs text-gray-400">Background noise reduction</div>
        </button>
        
        <button
          onClick={() => applyEnhancement('speech')}
          className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left"
        >
          <Sparkles size={24} className="text-purple-400 mb-2" />
          <div className="font-medium text-white">Enhance Speech</div>
          <div className="text-xs text-gray-400">Clarify speech frequencies</div>
        </button>
        
        <button
          onClick={() => applyEnhancement('leveling')}
          className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left"
        >
          <Volume2 size={24} className="text-green-400 mb-2" />
          <div className="font-medium text-white">Auto-Level</div>
          <div className="text-xs text-gray-400">Normalize volume</div>
        </button>
        
        <button
          onClick={() => applyEnhancement('echo')}
          className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left"
        >
          <Waves size={24} className="text-pink-400 mb-2" />
          <div className="font-medium text-white">Remove Echo</div>
          <div className="text-xs text-gray-400">Cancel echo effects</div>
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={previewing}
            onChange={(e) => setPreviewing(e.target.checked)}
            className="rounded border-gray-600"
          />
          Preview changes
        </label>
        
        <button
          onClick={handleSave}
          disabled={!enhancer}
          className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export Enhanced Audio
        </button>
      </div>
    </div>
  )
}
```

---

### 4. Cross-Feature Integration

**Priority:** Medium  
**Impact:** Connect voice notes to other features

**Features:**
- Link voice notes to documents
- Embed audio in notes
- @mention recordings in documents
- Create tasks from voice notes
- Extract action items
- Sync with calendar

**Implementation:**

```javascript
// voiceStore.js additions
// Link voice recording to document
linkToDocument: (voiceId, documentId) => set(state => ({
  recordings: state.recordings.map(r =>
    r.id === voiceId
      ? { ...r, linkedDocuments: [...(r.linkedDocuments || []), documentId] }
      : r
  )
})),

// Create task from voice note
createTaskFromVoice: (voiceId, taskData) => {
  const recording = get().recordings.find(r => r.id === voiceId)
  if (!recording) return
  
  // Extract action items from transcript using AI
  const actionItems = await extractActionItems(recording.transcript)
  
  // Create tasks for each action item
  actionItems.forEach(item => {
    useTasksStore.getState().addTask({
      ...taskData,
      title: item.text,
      description: item.context,
      voiceNoteId: voiceId,
      timestamp: item.timestamp
    })
  })
},

// Extract action items using AI
export const extractActionItems = async (transcript) => {
  const prompt = `
    Extract action items from this transcript.
    Return JSON array with:
    - text: the action item
    - context: surrounding context
    - priority: high/medium/low
    
    Transcript: ${transcript}
  `
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  const response = await result.response
  const actionItems = JSON.parse(response.text())
  
  return actionItems
}

// UI component: Voice to Task
const VoiceToTask = ({ recording }) => {
  const [extracted, setExtracted] = useState(false)
  const [actionItems, setActionItems] = useState([])
  
  const handleExtract = async () => {
    const items = await extractActionItems(recording.transcript)
    setActionItems(items)
    setExtracted(true)
  }
  
  const handleCreateTask = (item) => {
    useTasksStore.getState().addTask({
      title: item.text,
      description: item.context,
      voiceNoteId: recording.id,
      priority: item.priority
    })
  }
  
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <h4 className="text-sm font-semibold text-gray-400 mb-3">
        Create Tasks from Voice Note
      </h4>
      
      {!extracted ? (
        <button
          onClick={handleExtract}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
        >
          <CheckCircle size={18} className="inline mr-2" />
          Extract Action Items
        </button>
      ) : (
        <div className="space-y-2">
          {actionItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5"
            >
              <div className="flex-1">
                <div className="text-sm text-white mb-1">{item.text}</div>
                <div className="text-xs text-gray-400">{item.context}</div>
              </div>
              <button
                onClick={() => handleCreateTask(item)}
                className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm"
              >
                Create Task
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

### 5. Collaboration & Sharing

**Priority:** Low  
**Impact:** (Future phase - Week 6+)

**Features:**
- Share recordings via link
- Collaborative editing
- Comment on transcripts
- Version history
- Access controls

---

### 6. Analytics & Insights

**Priority:** Low  
**Impact:** Track usage and patterns

**Features:**
- Recording statistics
- Usage patterns
- Word frequency analysis
- Speaking time distribution
- Audio quality metrics

**Implementation:**

```javascript
// Analytics utilities
export const analyzeRecording = (recording) => {
  const transcript = recording.transcript
  
  return {
    // Basic stats
    wordCount: transcript.split(/\s+/).length,
    characterCount: transcript.length,
    duration: recording.duration,
    
    // Word frequency
    wordFrequency: calculateWordFrequency(transcript),
    
    // Speaking rate (words per minute)
    speakingRate: (transcript.split(/\s+/).length / recording.duration) * 60,
    
    // Estimated reading time
    readingTime: transcript.split(/\s+/).length / 200 * 60, // 200 words per minute
    
    // Audio quality (simplified)
    audioQuality: estimateAudioQuality(recording.audioData)
  }
}

const calculateWordFrequency = (text) => {
  const words = text.toLowerCase().match(/\b\w+\b/g) || []
  const frequency = {}
  
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))
}

const estimateAudioQuality = (audioData) => {
  // Simplified quality estimation
  const fileSize = audioData.length
  const duration = 10 // Placeholder
  const bitrate = (fileSize * 8) / duration // bits per second
  
  if (bitrate > 320000) return 'High'
  if (bitrate > 128000) return 'Medium'
  return 'Low'
}

// Analytics Dashboard
const AnalyticsDashboard = () => {
  const { recordings } = useVoiceStore()
  
  const stats = useMemo(() => {
    const totalRecordings = recordings.length
    const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0)
    const avgDuration = totalDuration / totalRecordings || 0
    const notesCount = recordings.filter(r => r.type === 'notes').length
    const galleryCount = recordings.filter(r => r.type === 'gallery').length
    
    return {
      totalRecordings,
      totalDuration,
      avgDuration,
      notesCount,
      galleryCount,
      mostUsedTags: getMostUsedTags(recordings),
      recordingsByDay: getRecordingsByDay(recordings)
    }
  }, [recordings])
  
  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Recordings"
          value={stats.totalRecordings}
          icon={<Mic size={24} />}
          color="indigo"
        />
        <StatCard
          label="Total Duration"
          value={formatDuration(stats.totalDuration)}
          icon={<Clock size={24} />}
          color="purple"
        />
        <StatCard
          label="Avg Duration"
          value={formatDuration(stats.avgDuration)}
          icon={<Clock size={24} />}
          color="pink"
        />
        <StatCard
          label="Notes vs Gallery"
          value={`${stats.notesCount} / ${stats.galleryCount}`}
          icon={<FileText size={24} />}
          color="green"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard
          title="Recordings by Day"
          data={stats.recordingsByDay}
        />
        <ChartCard
          title="Most Used Tags"
          data={stats.mostUsedTags}
        />
      </div>
    </div>
  )
}
```

---

## Phase 5 Testing Checklist

### Audio Editing
- [ ] Waveform displays correctly
- [ ] Zoom in/out works
- [ ] Select region works
- [ ] Cut/Delete works
- [ ] Trim start/end works
- [ ] Remove filler words works
- [ ] Noise reduction works
- [ ] Volume normalization works
- [ ] Export edited audio works

### Speaker Diarization
- [ ] Speakers identified correctly
- [ ] Speaker labels display
- [ ] Custom names work
- [ ] Filter by speaker works
- [ ] Speaker stats accurate

### Audio Enhancements
- [ ] Noise removal works
- [ ] Speech enhancement works
- [ ] Auto-leveling works
- [ ] Echo removal works
- [ ] Preview plays correctly
- [ ] Export enhanced audio works

### Cross-Feature Integration
- [ ] Link to document works
- [ ] Embed in notes works
- [ ] Create tasks from voice works
- [ ] Action items extracted
- [ ] Calendar sync works

### Analytics
- [ ] Stats calculate correctly
- [ ] Charts display data
- [ ] Word frequency accurate
- [ ] Speaking rate correct

---

## Success Metrics

**User Adoption:**
- Audio editing usage rate
- Speaker diarization accuracy
- Enhancement feature usage
- Cross-feature integration rate

**Technical:**
- Audio processing time
- Enhancement quality scores
- Speaker identification accuracy
- Action item extraction precision

---

## Dependencies

**New Dependencies:**
- None (using native APIs + Gemini)

**Existing Dependencies:**
- All Phase 1-4 dependencies

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Next:** Documents Rebuild (Phase 6-10)