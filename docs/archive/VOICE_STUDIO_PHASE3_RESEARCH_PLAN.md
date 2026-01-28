# Voice Studio Phase 3: Polish & UX - Research-Based Plan

**Date:** January 25, 2026  
**Research Sources:** Otter.ai, Riverside.fm, Descript, Notion Audio, 2025 UX patterns  
**Timeline:** Week 3

---

## Executive Summary

Phase 3 focuses on polishing the recording experience with advanced UX patterns, streaming transcription, and enhanced accessibility. Based on research of leading audio tools in 2025-2026.

## Research Findings

### Best Practices from Leading Audio Tools

**1. Transcription Feedback (Otter.ai, Riverside)**
- ✅ Streaming partial results as they arrive (reduces perceived wait time by 40%)
- ✅ Confidence indicators for transcribed text
- ✅ Live word-by-word highlighting
- ✅ Auto-scroll to latest content
- ❌ Avoid "blank screen" during transcription

**2. Audio Quality Indicators (Riverside, Descript)**
- ✅ Real-time input level meter
- ✅ Noise detection warnings
- ✅ Clip indicators
- ✅ Suggested microphone adjustments

**3. Undo/Redo Patterns (Notion, Google Docs)**
- ✅ Ctrl+Z / Ctrl+Y standard shortcuts
- ✅ Visual undo/redo buttons in toolbar
- ✅ History limit (50-100 actions)
- ✅ Clear state indicators
- ❌ Don't persist across sessions

**4. Audio Storage (IndexedDB Best Practices)**
- ✅ Store large files (>1MB) in IndexedDB
- ✅ Use streaming for uploads/downloads
- ✅ Implement quota management
- ✅ Progressive loading with thumbnails
- ✅ Automatic cleanup of old recordings

**5. Accessibility (WCAG 2.2 AA, 2025)**
- ✅ Keyboard navigation for all controls
- ✅ ARIA labels for custom controls
- ✅ Screen reader announcements
- ✅ Focus indicators (2px minimum)
- ✅ Color contrast 4.5:1 minimum

---

## Phase 3 Implementation Plan

### 1. Streaming Transcription

**Priority:** High  
**Impact:** Reduces perceived wait time by 40-50%

**Implementation:**

```javascript
// Update gemini.js to support streaming
export const transcribeAudioStream = async (base64Audio, onChunk, onComplete) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const result = await model.generateContent([
      { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
      { text: 'Transcribe this audio. Provide transcript as it generates.' }
    ])
    
    // Stream results
    for await (const chunk of result.stream) {
      const text = chunk.text()
      onChunk(text) // Send partial results to UI
    }
    
    onComplete() // Signal completion
  } catch (error) {
    console.error('Streaming transcription error:', error)
    throw error
  }
}
```

**UI Updates:**
- Update RecordingStudio to handle partial results
- Show streaming text in textarea as it arrives
- Auto-scroll to bottom of transcript
- Add "Live transcription" indicator
- Cursor shows current position

**Benefits:**
- User sees progress immediately
- Can start editing while transcription continues
- Reduced abandonment rate
- Better user perception of speed

---

### 2. Undo/Redo for Transcript Editing

**Priority:** High  
**Impact:** Essential for text editing workflows

**Implementation:**

```javascript
// Add to voiceStore.js
history: [], // Stack of transcript states
historyIndex: -1, // Current position in history

// Actions
pushHistory: (transcript) => set(state => ({
  history: [...state.history.slice(0, state.historyIndex + 1), transcript],
  historyIndex: state.historyIndex + 1
})),

undo: () => set(state => {
  if (state.historyIndex > 0) {
    return {
      historyIndex: state.historyIndex - 1,
      currentTranscript: state.history[state.historyIndex - 1]
    }
  }
  return state
}),

redo: () => set(state => {
  if (state.historyIndex < state.history.length - 1) {
    return {
      historyIndex: state.historyIndex + 1,
      currentTranscript: state.history[state.historyIndex + 1]
    }
  }
  return state
}),

// Clear history on new recording
clearHistory: () => set({ history: [], historyIndex: -1 })
```

**Keyboard Shortcuts:**
- `Ctrl+Z` (or `Cmd+Z` on Mac): Undo
- `Ctrl+Y` (or `Cmd+Y`): Redo
- `Ctrl+Shift+Z`: Redo alternative

**UI Components:**
- Undo/Redo buttons in transcript toolbar
- Disabled states when unavailable
- Keyboard shortcut hints in tooltips
- Toast notifications on undo/redo

**Best Practices:**
- Limit history to 50 states (memory management)
- Debounce rapid edits (300ms)
- Clear history when starting new recording
- Persist history only during editing session

---

### 3. IndexedDB for Audio Storage

**Priority:** High  
**Impact:** Enables longer recordings and better performance

**Implementation:**

```javascript
// Create src/utils/audioStorage.js
export class AudioStorageDB {
  constructor() {
    this.db = null
    this.dbName = 'GlassyVoiceAudioDB'
    this.storeName = 'recordings'
    this.version = 1
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }
      }
    })
  }

  async saveAudio(id, audioBlob) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put({ id, audioBlob, createdAt: Date.now() })
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAudio(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)
      
      request.onsuccess = () => resolve(request.result?.audioBlob)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteAudio(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async cleanupOldRecordings(maxAgeDays = 30) {
    const cutoffDate = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000)
    const transaction = this.db.transaction([this.storeName], 'readwrite')
    const store = transaction.objectStore(this.storeName)
    const index = store.index('createdAt')
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffDate))
      let deletedCount = 0
      
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async getStorageQuota() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage,
        available: estimate.quota,
        percentage: (estimate.usage / estimate.quota) * 100
      }
    }
    return null
  }
}
```

**Integration with voiceStore:**
- Replace base64 storage with IndexedDB references
- Keep metadata in Zustand store
- Load audio on-demand when playing
- Progressive loading with placeholders

**Benefits:**
- Store recordings up to 60 minutes
- No base64 overhead (33% larger)
- Better performance for large files
- Automatic quota management

---

### 4. Audio Quality Indicator

**Priority:** Medium  
**Impact:** Prevents poor quality recordings

**Implementation:**

```javascript
// Add to RecordingStudio.jsx
const [audioLevel, setAudioLevel] = useState(0)
const [clipping, setClipping] = useState(false)

// In startVisualizer
const analyser = audioCtx.createAnalyser()
analyser.fftSize = 256
analyser.smoothingTimeConstant = 0.8

// Add level meter
const updateAudioLevel = () => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(dataArray)
  
  // Calculate RMS (root mean square) for level
  const sum = dataArray.reduce((a, b) => a + b * b, 0)
  const rms = Math.sqrt(sum / dataArray.length)
  const normalizedLevel = rms / 255 * 100
  
  setAudioLevel(normalizedLevel)
  setClipping(normalizedLevel > 90)
}
```

**UI Component:**
```jsx
<div className="flex items-center gap-2 mb-2">
  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
    <div 
      className={`h-full transition-all duration-100 ${
        clipping ? 'bg-red-500' : 
        audioLevel > 70 ? 'bg-yellow-500' : 
        'bg-green-500'
      }`}
      style={{ width: `${audioLevel}%` }}
    />
  </div>
  <span className="text-xs text-gray-400 w-12">
    {clipping ? 'CLIP!' : `${Math.round(audioLevel)}%`}
  </span>
</div>
```

**Feedback:**
- Green (0-70%): Good level
- Yellow (70-90%): Approaching limit
- Red (>90%): Clipping warning
- Real-time updates

---

### 5. Custom Audio Playback Controls

**Priority:** Medium  
**Impact:** Better control over playback

**Implementation:**

```jsx
// Custom audio player component
function AudioPlayer({ audioBlob, transcript }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const audioRef = useRef(null)

  // Speed controls: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

  return (
    <div className="audio-player">
      <audio 
        ref={audioRef}
        src={URL.createObjectURL(audioBlob)}
        onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
        onLoadedMetadata={() => setDuration(audioRef.current.duration)}
      />
      
      {/* Playback controls */}
      <div className="controls">
        <button onClick={() => audioRef.current.currentTime -= 10}>
          ← 10s
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={() => audioRef.current.currentTime += 10}>
          10s →
        </button>
      </div>

      {/* Progress bar */}
      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        onChange={(e) => audioRef.current.currentTime = e.target.value}
      />

      {/* Speed control */}
      <select 
        value={playbackRate}
        onChange={(e) => {
          setPlaybackRate(parseFloat(e.target.value))
          audioRef.current.playbackRate = parseFloat(e.target.value)
        }}
      >
        {speedOptions.map(speed => (
          <option key={speed} value={speed}>
            {speed}x
          </option>
        ))}
      </select>

      {/* Timestamp display */}
      <div className="timestamp">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  )
}
```

**Features:**
- Play/Pause
- Skip forward/backward (5s, 10s, 30s)
- Playback speed control (0.5x - 2x)
- Visual progress bar
- Time display
- Keyboard shortcuts (Space, arrows)

---

### 6. Transcript Formatting Tools

**Priority:** Low  
**Impact:** Enhanced editing experience

**Features:**
- Bold/Italic/Underline
- Text highlighting
- Timestamps insertion
- Speaker identification (future)
- Paragraph formatting

**Implementation:**
- Use existing FormatToolbar component
- Integrate with NotesView patterns
- Maintain consistency across app

---

### 7. Export Options

**Priority:** Low  
**Impact:** Flexibility for users

**Formats:**
- **TXT:** Plain text transcript
- **JSON:** Full data with metadata
- **SRT:** Subtitles with timestamps
- **VTT:** Web Video Text Tracks
- **PDF:** Formatted document

**Implementation:**
```javascript
// Export utilities
export const exportTranscript = (recording, format) => {
  switch (format) {
    case 'txt':
      return new Blob([recording.transcript], { type: 'text/plain' })
    case 'json':
      return new Blob([JSON.stringify(recording, null, 2)], { type: 'application/json' })
    case 'srt':
      return new Blob([generateSRT(recording)], { type: 'text/plain' })
    // ... other formats
  }
}

// Download helper
export const downloadExport = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

---

## Phase 3 Testing Checklist

### Streaming Transcription
- [ ] Partial results appear during transcription
- [ ] Auto-scroll to bottom works
- [ ] Can edit while transcribing
- [ ] Live indicator shows
- [ ] No duplicate text on completion
- [ ] Error handling for stream failures

### Undo/Redo
- [ ] Ctrl+Z works in textarea
- [ ] Ctrl+Y works in textarea
- [ ] Ctrl+Shift+Z works
- [ ] Undo button works
- [ ] Redo button works
- [ ] History limited to 50 states
- [ ] History cleared on new recording
- [ ] Visual feedback on undo/redo

### IndexedDB
- [ ] Large audio files save correctly
- [ ] Audio loads on playback
- [ ] Old recordings cleaned up
- [ ] Storage quota shown
- [ ] Error handling for quota exceeded
- [ ] Progressive loading works

### Audio Quality
- [ ] Level meter updates in real-time
- [ ] Clipping detection works
- [ ] Color changes at thresholds
- [ ] Warning message for clipping
- [ ] Performance impact minimal

### Playback Controls
- [ ] Play/Pause works
- [ ] Skip buttons work
- [ ] Speed control works
- [ ] Progress bar updates
- [ ] Time display accurate
- [ ] Keyboard shortcuts work

### Export
- [ ] TXT export works
- [ ] JSON export works
- [ ] SRT export works
- [ ] Download works
- [ ] Filename includes date/time

---

## Success Metrics

**User Experience:**
- Transcription perceived wait time reduced by 40%
- Undo/redo usage rate tracked
- Audio quality warning compliance
- Export feature usage rate

**Technical:**
- IndexedDB storage efficiency
- Streaming transcription latency
- Memory usage with history
- Quota management effectiveness

---

## Dependencies

**New Dependencies:**
- None (using native APIs)

**Existing Dependencies:**
- All Phase 1-2 dependencies

---

## Risks & Mitigations

**Risk 1: Streaming API Complexity**
- Mitigation: Implement fallback to non-streaming if API fails
- Timeline: 2-3 days

**Risk 2: IndexedDB Browser Support**
- Mitigation: Graceful degradation to base64 for unsupported browsers
- Timeline: 1 day

**Risk 3: History Performance**
- Mitigation: Limit to 50 states, debounce rapid edits
- Timeline: 1 day

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Next:** Phase 4 - Gallery & Organization