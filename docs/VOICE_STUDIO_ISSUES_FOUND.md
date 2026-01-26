# Voice Studio - Issues Found in Code Review

**Date:** January 25, 2026  
**Status:** Issues Identified - Need Fixes

---

## Critical Issues

### 1. Missing Store Import - RecordingStudio.jsx

**Location:** `src/components/voice/RecordingStudio.jsx`  
**Line:** ~120

**Issue:**
```javascript
// Called on line 120 but not imported
setAudioData(base64String)  // ✗ Function not in destructured imports
```

**Current Imports:**
```javascript
const {
  studioCollapsed,
  recordingState,
  currentTranscript,
  currentSummary,
  recordingDuration,
  error,
  setStudioCollapsed,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  setTranscript,
  setSummary,
  saveRecording,
  clearActiveRecording,
  setError,
} = useVoiceStore()
```

**Fix Required:**
Add `setAudioData` to the destructured imports.

---

### 2. Recording Duration Not Updated

**Location:** `src/components/voice/RecordingStudio.jsx`  
**Issue:** The timer displays `recordingDuration` from store, but it's never updated during recording.

**Current Behavior:**
- Timer displays "00:00" throughout recording
- `recordingDuration` remains 0 in store
- Only shows correct time if manually set elsewhere

**Fix Required:**
Implement duration tracking in RecordingStudio component and update store periodically.

---

## Medium Issues

### 3. No Audio Data Saving

**Location:** `src/components/voice/RecordingStudio.jsx`  
**Issue:** `setAudioData` is called but may not be working due to Issue #1.

**Impact:**
- Audio may not be saved to recordings
- Playback may not work
- Storage missing audio blobs

**Fix Required:**
After fixing Issue #1, verify audio is properly saved.

---

### 4. Timer Uses Store Duration but Not Updated

**Location:** `src/components/voice/RecordingStudio.jsx`  
**Lines:** Timer effect (~line 44)

**Current Code:**
```javascript
useEffect(() => {
  if (recordingState === 'recording') {
    timerIntervalRef.current = setInterval(() => {
      setTimer(formatTime(recordingDuration))  // ✗ recordingDuration is 0
    }, 1000)
  } else {
    clearInterval(timerIntervalRef.current)
  }

  return () => clearInterval(timerIntervalRef.current)
}, [recordingState, recordingDuration])
```

**Issue:** `recordingDuration` from store is never updated, so timer always shows 00:00.

**Fix Required:**
Track duration locally and update store on stop.

---

## Minor Issues

### 5. No Recording Duration on Save

**Location:** `src/stores/voiceStore.js`  
**Issue:** `saveRecording` uses `get().recordingDuration` but it's not being set during recording.

**Impact:**
- Saved recordings show 0s duration
- Gallery cards show incorrect duration

**Fix Required:**
Update recording duration when recording stops.

---

## Recommended Fixes

### Priority 1: Fix Recording Duration

**Solution:**
1. Track duration locally in RecordingStudio
2. Update store duration when recording stops
3. Use local duration for timer display

### Priority 2: Fix Store Import

**Solution:**
Add `setAudioData` to destructured imports in RecordingStudio.jsx.

### Priority 3: Verify Audio Saving

**Solution:**
After fixing import, verify audio is saved correctly.

---

## Fix Implementation Plan

### Fix 1: Recording Duration Tracking

```javascript
// In RecordingStudio.jsx
const [localDuration, setLocalDuration] = useState(0)

// Update duration every second
useEffect(() => {
  let interval
  if (recordingState === 'recording') {
    interval = setInterval(() => {
      setLocalDuration(prev => prev + 1)
    }, 1000)
  }
  return () => clearInterval(interval)
}, [recordingState])

// Update timer display
useEffect(() => {
  setTimer(formatTime(localDuration))
}, [localDuration])

// When stopping recording, update store
const handleStopRecording = () => {
  if (mediaRecorderRef.current && recordingState === 'recording') {
    mediaRecorderRef.current.stop()
    // Update store with final duration
    setRecordingDuration(localDuration)
    stopRecording()
  }
}
```

### Fix 2: Add Missing Import

```javascript
// In RecordingStudio.jsx
const {
  // ... existing imports
  setAudioData,  // ✗ ADD THIS
} = useVoiceStore()
```

---

## Testing After Fixes

1. [ ] Timer increments during recording
2. [ ] Timer shows correct duration
3. [ ] Saved recordings have correct duration
4. [ ] Audio is saved to recordings
5. [ ] Playback works from gallery
6. [ ] No console errors

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026