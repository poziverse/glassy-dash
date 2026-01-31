# Audio Recording Error Handling Investigation & Fix Plan

**Date:** January 30, 2026  
**Investigation:** Graceful error handling for audio recording failures

---

## Executive Summary

This investigation identifies critical gaps in error handling for the audio recording features. Users must delete cache (localStorage/IndexedDB) to recover from failures, indicating poor error recovery mechanisms. The issues span across recording state management, storage persistence, and resource cleanup.

---

## Root Cause Analysis

### 1. **No State Validation on Store Initialization**
**Location:** `src/stores/voiceStore.js`

**Problem:** The voiceStore uses Zustand's persist middleware to load state from localStorage (`glassy-voice-storage`), but there's no validation to ensure the loaded state is:
- Structurally valid
- Not corrupted from previous failures
- Free of stale/incomplete recordings

**Impact:** Corrupted state from previous recording failures persists across page reloads, causing the application to fail to load or function properly.

```javascript
// Current implementation - no validation
export const useVoiceStore = create(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'glassy-voice-storage',
    }
  )
)
```

### 2. **Incomplete Resource Cleanup on Errors**
**Location:** `src/components/voice/RecordingStudio.jsx`

**Problem:** MediaRecorder, audio streams, and Web Audio API resources are not properly cleaned up when errors occur during recording or transcription.

**Issues:**
- `streamRef.current` tracks may not be stopped on errors
- `audioContextRef.current` may not be closed
- `animationFrameRef.current` may continue running
- `mediaRecorderRef.current` may not be properly stopped

**Impact:** Resources remain active after errors, causing memory leaks and preventing new recordings from starting properly.

```javascript
// Current cleanup - only runs on unmount, not on error
useEffect(() => {
  return () => {
    stopVisualizer()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }, [])
})
```

### 3. **No Storage Recovery Mechanism**
**Location:** `src/utils/audioStorage.js`

**Problem:** IndexedDB operations can fail silently or leave the database in an inconsistent state. There's no mechanism to:
- Detect corrupted audio blobs
- Clear incomplete recordings on startup
- Fall back gracefully when storage operations fail
- Repair corrupted databases

**Impact:** Failed audio storage operations leave orphaned or corrupted data that breaks subsequent operations.

### 4. **Inconsistent Error State Management**
**Location:** `src/components/voice/RecordingStudio.jsx`

**Problem:** Error handling is inconsistent across different failure scenarios:
- Microphone access errors set error state but don't reset recording state
- Transcription failures may not properly transition to idle state
- Audio processing errors leave the app in an indeterminate state
- State refs (`lastProcessedTranscriptRef`, etc.) are not cleared on errors

**Impact:** The app can get stuck in `processing` or other non-idle states after errors, requiring manual cache deletion.

### 5. **No Corruption Detection on Startup**
**Problem:** There's no startup validation to check for:
- Corrupted localStorage data
- Orphaned IndexedDB records
- Recordings stuck in `processing` state
- Malformed audio blobs

**Impact:** The app tries to load and use corrupted data from previous sessions, causing immediate failures on page load.

---

## Detailed Findings

### RecordingStudio.jsx Issues

1. **handleStartRecording Error Handling:**
   ```javascript
   } catch (err) {
     console.error('Error accessing microphone:', err)
     setError('Could not access microphone. Please check permissions.')
   }
   ```
   - Sets error but doesn't reset `recordingState` to 'idle'
   - Doesn't clean up any partially initialized resources

2. **processTranscription Error Handling:**
   ```javascript
   } catch (err) {
     logger.error('transcription_error', {}, err)
     console.error('Transcription error:', err)
     setError('Failed to transcribe audio. Please try again.')
   }
   ```
   - Sets error but may leave `recordingState` in 'processing'
   - Doesn't clear `lastProcessedTranscriptRef`, `lastProcessedSummaryRef`
   - Doesn't clean up audio blobs or resources

3. **MediaRecorder onstop Handler:**
   ```javascript
   mediaRecorder.onstop = async () => {
     stopVisualizer()
     const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
     // ... processing logic
   }
   ```
   - If processing fails, the audio blob is lost
   - No try-catch around the entire onstop logic
   - Errors during processing don't reset state

### voiceStore.js Issues

1. **Persist Middleware Configuration:**
   - No `onRehydrateStorage` callback to validate loaded state
   - No error handling for corrupt localStorage
   - No migration strategy for schema changes

2. **saveRecording Error Handling:**
   ```javascript
   try {
     audioStorageId = await storeAudio(recordingId, audioBlob, ...)
   } catch (error) {
     console.warn('[VoiceStore] IndexedDB storage failed, using fallback:', error)
     audioDataFallback = currentAudio
   }
   ```
   - Falls back to inline storage (bad for large files)
   - Doesn't clear the failed IndexedDB record
   - Doesn't alert the user about storage issues

3. **No Cleanup for Orphaned Records:**
   - No function to remove recordings stuck in 'processing' state
   - No mechanism to detect and clear incomplete recordings

### audioStorage.js Issues

1. **No Transaction Timeout Handling:**
   - IndexedDB transactions can hang indefinitely
   - No timeout or retry logic for database operations

2. **No Schema Validation:**
   - No validation that stored blobs are valid audio
   - No size limits or quota management

3. **No Recovery Function:**
   - No function to rebuild database if corrupted
   - No way to clear all voice-related storage

---

## Fix Plan

### Phase 1: Add State Validation & Recovery (High Priority)

#### 1.1 Add Storage Health Check on App Load
**File:** `src/stores/voiceStore.js`

```javascript
export const useVoiceStore = create(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'glassy-voice-storage',
      onRehydrateStorage: () => (state) => {
        // Validate loaded state
        if (!state) return
        
        const issues = []
        
        // Check for stuck processing states
        const stuckRecordings = state.recordings?.filter(
          r => r.recordingState === 'processing' || r.recordingState === 'recording'
        )
        if (stuckRecordings?.length > 0) {
          issues.push(`Found ${stuckRecordings.length} recordings in stuck state`)
        }
        
        // Validate recordings structure
        if (state.recordings?.some(r => !r.id || !r.title)) {
          issues.push('Found recordings with invalid structure')
        }
        
        // Reset problematic state if issues found
        if (issues.length > 0) {
          console.warn('[VoiceStore] Storage issues detected:', issues)
          return {
            ...state,
            recordingState: 'idle',
            currentTranscript: '',
            currentSummary: '',
            currentAudio: null,
            error: null,
          }
        }
      },
      onRehydrateStorageError: (error) => {
        console.error('[VoiceStore] Failed to load storage:', error)
        // Return default state on error
        return defaultState
      },
    }
  )
)
```

#### 1.2 Add Storage Reset Utility
**File:** `src/utils/audioStorage.js`

```javascript
/**
 * Reset all voice-related storage (localStorage + IndexedDB)
 * Use with caution - deletes all recordings
 */
export async function resetVoiceStorage() {
  try {
    // Clear IndexedDB
    await clearAllAudio()
    
    // Clear localStorage for voice store
    localStorage.removeItem('glassy-voice-storage')
    
    console.log('Voice storage reset successfully')
    return { success: true }
  } catch (error) {
    console.error('Failed to reset voice storage:', error)
    return { success: false, error }
  }
}

/**
 * Clean up orphaned/incomplete recordings
 */
export async function cleanupOrphanedRecordings() {
  try {
    const db = await initDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const recordings = await getAllAudioRecords()
    
    // Find recordings without corresponding metadata
    // This would need integration with voiceStore to get recording IDs
    // For now, this is a placeholder
    
    return { success: true, cleaned: 0 }
  } catch (error) {
    console.error('Failed to cleanup orphaned recordings:', error)
    return { success: false, error }
  }
}
```

### Phase 2: Improve Error Handling in RecordingStudio (High Priority)

#### 2.1 Add Comprehensive Cleanup Function
**File:** `src/components/voice/RecordingStudio.jsx`

```javascript
// Add a centralized cleanup function
const cleanupRecordingResources = () => {
  // Stop media recorder
  if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
    try {
      mediaRecorderRef.current.stop()
    } catch (e) {
      console.warn('[RecordingStudio] Error stopping recorder:', e)
    }
    mediaRecorderRef.current = null
  }
  
  // Stop all stream tracks
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => {
      try {
        track.stop()
      } catch (e) {
        console.warn('[RecordingStudio] Error stopping track:', e)
      }
    })
    streamRef.current = null
  }
  
  // Close audio context
  if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
    try {
      audioContextRef.current.close()
    } catch (e) {
      console.warn('[RecordingStudio] Error closing audio context:', e)
    }
    audioContextRef.current = null
  }
  
  // Cancel animation frame
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = null
  }
  
  // Clear refs
  audioChunksRef.current = []
  lastProcessedTranscriptRef.current = null
  lastProcessedSummaryRef.current = null
  lastProcessedStateRef.current = null
  
  // Clear canvas
  if (canvasRef.current) {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }
}
```

#### 2.2 Wrap Error Scenarios with Cleanup
**File:** `src/components/voice/RecordingStudio.jsx`

```javascript
// Updated handleStartRecording with proper error cleanup
const handleStartRecording = async () => {
  try {
    setError(null)
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    // Start visualizer
    startVisualizer(stream)

    // Start recorder
    const mediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder
    audioChunksRef.current = []

    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      try {
        stopVisualizer()
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

        setError(null)

        try {
          const reader = new FileReader()
          reader.readAsDataURL(audioBlob)
          reader.onloadend = async () => {
            const base64String = reader.result.split(',')[1]
            setAudioData(base64String)
            await processTranscription(base64String)
          }
          reader.onerror = () => {
            throw new Error('Failed to process audio')
          }
        } catch (err) {
          console.error('Error processing audio:', err)
          setError('Failed to process audio. Please try again.')
          // Reset state
          setRecordingState('idle')
          cleanupRecordingResources()
        }
      } catch (err) {
        console.error('Error in onstop handler:', err)
        setError('An error occurred while processing the recording.')
        setRecordingState('idle')
        cleanupRecordingResources()
      }
    }

    mediaRecorder.start()
    startRecording()
  } catch (err) {
    console.error('Error accessing microphone:', err)
    setError('Could not access microphone. Please check permissions.')
    setRecordingState('idle')
    cleanupRecordingResources()
  }
}

// Updated processTranscription with proper error handling
const processTranscription = async base64Audio => {
  try {
    logger.info('transcription_start_attempt', { audioLength: base64Audio.length })
    setError(null)

    await retryOperation(
      () => transcribeAudioStream(
        base64Audio,
        chunk => {
          if (chunk.transcript && chunk.transcript !== lastProcessedTranscriptRef.current) {
            logger.debug('transcription_chunk_received', {
              transcriptLength: chunk.transcript.length,
            })
            lastProcessedTranscriptRef.current = chunk.transcript
            updateTranscript(chunk.transcript)
            
            if (chunk.summary && chunk.summary !== lastProcessedSummaryRef.current) {
              const normalizedSummary = Array.isArray(chunk.summary)
                ? chunk.summary.join('\n')
                : chunk.summary
              
              if (normalizedSummary !== lastProcessedSummaryRef.current) {
                logger.debug('transcription_summary_received', {
                  summaryLength: normalizedSummary.length,
                })
                lastProcessedSummaryRef.current = normalizedSummary
                setSummary(normalizedSummary)
              }
            }
          }
        },
        result => {
          logger.info('transcription_complete', {
            transcriptLength: result?.transcript?.length,
            summaryLength: typeof result?.summary === 'string' 
              ? result.summary.length 
              : (Array.isArray(result?.summary) ? result.summary.length : 0),
          })
          if (result && result.transcript) {
            if (result.transcript !== currentTranscript) {
              setTranscript(result.transcript)
            }
            
            const rawSummary = result.summary || 'No summary available'
            const summary = Array.isArray(rawSummary) ? rawSummary.join('\n') : rawSummary
            
            if (summary !== currentSummary) {
              setSummary(summary)
            }
            
            if (recordingState !== 'reviewing' && recordingState !== lastProcessedStateRef.current) {
              lastProcessedStateRef.current = 'reviewing'
              setRecordingState('reviewing')
            }
          } else {
            logger.warn('transcription_failed_no_result', {})
            throw new Error('Transcription returned no result')
          }
        },
        err => {
          logger.error('transcription_stream_error', {}, err)
          console.error('Streaming transcription error:', err)
          throw err // Re-throw to be caught by outer try-catch
        }
      ),
      {
        maxRetries: 3,
        delay: 1000,
        onRetry: (attempt, error, waitTime) => {
          logger.warn('transcription_retry_attempt', { attempt, waitTime, error: error.message })
        },
      }
    )
  } catch (err) {
    logger.error('transcription_error', {}, err)
    console.error('Transcription error:', err)
    setError('Failed to transcribe audio. Please try again.')
    setRecordingState('idle')
    // Clean up refs
    lastProcessedTranscriptRef.current = null
    lastProcessedSummaryRef.current = null
    lastProcessedStateRef.current = null
  }
}
```

#### 2.3 Add Error Recovery UI Component
**File:** `src/components/voice/RecordingErrorRecovery.jsx` (new file)

```javascript
import React from 'react'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'
import { resetVoiceStorage } from '../../utils/audioStorage'
import { useVoiceStore } from '../../stores/voiceStore'

export default function RecordingErrorRecovery() {
  const { error, setError } = useVoiceStore()
  const [isResetting, setIsResetting] = useState(false)

  if (!error) return null

  const handleReset = async () => {
    if (!confirm('This will delete all recordings. Are you sure?')) return
    
    setIsResetting(true)
    try {
      await resetVoiceStorage()
      setError(null)
      window.location.reload()
    } catch (err) {
      console.error('Failed to reset:', err)
      alert('Failed to reset storage. Please try clearing browser cache.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-red-400">Recording Error</h4>
          <p className="text-sm text-red-300 mt-1">{error}</p>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setError(null)}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Dismiss
            </button>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {isResetting ? 'Resetting...' : 'Reset All Recordings'}
            </button>
          </div>
          
          <p className="text-xs text-red-400 mt-2">
            If errors persist, try clearing your browser cache or using "Reset All Recordings".
          </p>
        </div>
      </div>
    </div>
  )
}
```

### Phase 3: Add IndexedDB Error Recovery (Medium Priority)

#### 3.1 Add Database Health Check
**File:** `src/utils/audioStorage.js`

```javascript
/**
 * Check database health and repair if needed
 */
export async function checkDatabaseHealth() {
  try {
    const db = await initDB()
    
    // Test read operation
    const testResult = await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const countRequest = store.count()
      
      countRequest.onsuccess = () => resolve(countRequest.result)
      countRequest.onerror = () => reject(countRequest.error)
    })
    
    return { healthy: true, count: testResult }
  } catch (error) {
    console.error('Database health check failed:', error)
    return { healthy: false, error }
  }
}

/**
 * Repair database by deleting and recreating it
 */
export async function repairDatabase() {
  try {
    // Delete existing database
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
    
    await new Promise((resolve, reject) => {
      deleteRequest.onsuccess = resolve
      deleteRequest.onerror = () => reject(deleteRequest.error)
    })
    
    // Reinitialize
    await initDB()
    
    return { success: true }
  } catch (error) {
    console.error('Database repair failed:', error)
    return { success: false, error }
  }
}
```

#### 3.2 Add Timeout for Transactions
**File:** `src/utils/audioStorage.js`

```javascript
/**
 * Execute a transaction with timeout
 */
function executeWithTimeout(promise, timeoutMs = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

// Update all async functions to use timeout
export async function storeAudio(recordingId, audioBlob, metadata = {}) {
  if (!db) {
    await initDB()
  }

  return executeWithTimeout(
    new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const audioRecord = {
        id: crypto.randomUUID(),
        recordingId,
        audioBlob,
        size: audioBlob.size,
        format: metadata.format || 'webm',
        duration: metadata.duration || 0,
        createdAt: new Date().toISOString(),
        ...metadata,
      }

      const request = store.add(audioRecord)

      request.onsuccess = () => {
        console.log(`Audio stored: ${audioRecord.id} (${formatBytes(audioBlob.size)})`)
        resolve(audioRecord.id)
      }

      request.onerror = () => {
        console.error('Error storing audio:', request.error)
        reject(request.error)
      }
    }),
    10000 // 10 second timeout
  )
}
```

### Phase 4: Add Startup Validation (High Priority)

#### 4.1 Create Health Check Component
**File:** `src/components/StorageHealthCheck.jsx` (new file)

```javascript
import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { checkDatabaseHealth, repairDatabase } from '../utils/audioStorage'

export default function StorageHealthCheck() {
  const [status, setStatus] = useState('checking')
  const [issues, setIssues] = useState([])
  const [isRepairing, setIsRepairing] = useState(false)

  useEffect(() => {
    performHealthCheck()
  }, [])

  const performHealthCheck = async () => {
    try {
      // Check IndexedDB health
      const dbHealth = await checkDatabaseHealth()
      
      const foundIssues = []
      
      if (!dbHealth.healthy) {
        foundIssues.push('IndexedDB database corrupted')
      }
      
      // Check localStorage
      try {
        const voiceStorage = localStorage.getItem('glassy-voice-storage')
        if (voiceStorage) {
          const parsed = JSON.parse(voiceStorage)
          
          // Check for stuck states
          if (parsed.state?.recordingState === 'processing' || 
              parsed.state?.recordingState === 'recording') {
            foundIssues.push('Found recording stuck in processing state')
          }
          
          // Check for invalid recordings
          if (parsed.state?.recordings?.some(r => !r.id || !r.title)) {
            foundIssues.push('Found recordings with invalid structure')
          }
        }
      } catch (err) {
        foundIssues.push('localStorage corrupted')
      }
      
      if (foundIssues.length > 0) {
        setStatus('error')
        setIssues(foundIssues)
      } else {
        setStatus('healthy')
      }
    } catch (err) {
      setStatus('error')
      setIssues(['Health check failed: ' + err.message])
    }
  }

  const handleRepair = async () => {
    if (!confirm('This will repair the database but may lose some recordings. Continue?')) return
    
    setIsRepairing(true)
    try {
      // Repair IndexedDB
      await repairDatabase()
      
      // Clear problematic localStorage
      const voiceStorage = localStorage.getItem('glassy-voice-storage')
      if (voiceStorage) {
        const parsed = JSON.parse(voiceStorage)
        if (parsed.state?.recordingState !== 'idle' || 
            parsed.state?.recordings?.some(r => !r.id)) {
          localStorage.removeItem('glassy-voice-storage')
        }
      }
      
      // Reload page
      window.location.reload()
    } catch (err) {
      console.error('Repair failed:', err)
      alert('Repair failed. Please try clearing browser cache.')
    } finally {
      setIsRepairing(false)
    }
  }

  if (status === 'checking') {
    return (
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-center gap-2 text-blue-400">
          <AlertCircle size={20} className="animate-pulse" />
          <span>Checking storage health...</span>
        </div>
      </div>
    )
  }

  if (status === 'healthy') {
    return null // Don't show anything if healthy
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-md">
      <div className="flex items-start gap-3">
        <AlertCircle className="text-yellow-400 mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-yellow-400">Storage Issues Detected</h4>
          <ul className="text-sm text-yellow-300 mt-2 space-y-1">
            {issues.map((issue, i) => (
              <li key={i}>• {issue}</li>
            ))}
          </ul>
          <button
            onClick={handleRepair}
            disabled={isRepairing}
            className="mt-3 px-4 py-2 text-sm rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50"
          >
            {isRepairing ? 'Repairing...' : 'Repair Storage'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### 4.2 Integrate Health Check into App
**File:** `src/App.jsx`

```javascript
import StorageHealthCheck from './components/StorageHealthCheck'

export default function App() {
  // ... existing code ...

  return (
    <>
      {/* Add health check for authenticated users */}
      {currentUser && <StorageHealthCheck />}
      
      {/* Main View */}
      {currentView}
      
      {/* ... existing code ... */}
    </>
  )
}
```

### Phase 5: Add Error Recovery Actions to VoiceStore (Medium Priority)

#### 5.1 Add Recovery Actions
**File:** `src/stores/voiceStore.js`

```javascript
export const useVoiceStore = create(
  persist(
    (set, get) => ({
      // ... existing actions ...

      // Recovery Actions
      resetRecordingState: () => {
        set({
          recordingState: 'idle',
          currentTranscript: '',
          currentSummary: '',
          currentAudio: null,
          recordingStartTime: null,
          recordingDuration: 0,
          error: null,
          activeRecordingId: null,
          transcriptHistory: [],
          historyIndex: -1,
        })
      },

      clearCorruptedRecordings: () => {
        const { recordings } = get()
        const validRecordings = recordings.filter(
          r => r.id && r.title && (r.transcript || r.audioData || r.audioStorageId)
        )
        
        set({
          recordings: validRecordings,
        })
        
        return {
          removed: recordings.length - validRecordings.length,
        }
      },

      recoverStuckRecording: (recordingId) => {
        const { recordings } = get()
        const recording = recordings.find(r => r.id === recordingId)
        
        if (recording) {
          const updatedRecording = {
            ...recording,
            recordingState: 'idle',
            updatedAt: new Date().toISOString(),
          }
          
          set({
            recordings: recordings.map(r =>
              r.id === recordingId ? updatedRecording : r
            ),
          })
          
          return { success: true }
        }
        
        return { success: false, error: 'Recording not found' }
      },
    }),
    {
      name: 'glassy-voice-storage',
      // ... existing config ...
    }
  )
)
```

---

## Implementation Priority

### Critical (Do First)
1. ✅ Add comprehensive cleanup function in RecordingStudio
2. ✅ Wrap all error scenarios with proper state reset
3. ✅ Add onRehydrateStorage validation to voiceStore
4. ✅ Add storage reset utility function

### High Priority
5. ✅ Add startup health check component
6. ✅ Add error recovery UI component
7. ✅ Add timeout handling to IndexedDB operations

### Medium Priority
8. ✅ Add database health check and repair
9. ✅ Add recovery actions to voiceStore
10. ✅ Add detailed error logging for debugging

### Low Priority (Nice to Have)
11. Add analytics for error tracking
12. Add user feedback mechanism for errors
13. Add automated tests for error scenarios

---

## Testing Strategy

### Unit Tests
1. Test cleanup function with various error states
2. Test state validation logic
3. Test storage reset functionality
4. Test error recovery UI interactions

### Integration Tests
1. Test recording failure scenarios
2. Test transcription failure scenarios
3. Test storage corruption scenarios
4. Test app load with corrupted state

### E2E Tests
1. Test full recording → failure → recovery flow
2. Test storage reset and reload
3. Test health check detection and repair

---

## Success Criteria

1. **No Cache Deletion Required:** Users should never need to manually delete cache to recover from failures
2. **Graceful Recovery:** All error scenarios should be automatically detectable and recoverable
3. **Clear User Feedback:** Users should understand what went wrong and how to fix it
4. **State Consistency:** App state should always be valid after any error
5. **Resource Cleanup:** All resources (streams, contexts, etc.) should be properly cleaned up on errors

---

## Risk Assessment

### Low Risk
- Adding validation functions
- Adding cleanup utilities
- Adding UI components for recovery

### Medium Risk
- Modifying persist middleware configuration
- Changing error handling flow in RecordingStudio
- Adding startup health checks

### Mitigation
- Implement changes incrementally with testing
- Add feature flags for new functionality
- Provide rollback strategy for localStorage changes

---

## Next Steps

1. Review and approve this plan
2. Implement Phase 1 changes (state validation)
3. Implement Phase 2 changes (error handling)
4. Test thoroughly with various error scenarios
5. Implement Phase 3 & 4 if needed
6. Add documentation for new error handling flows

---

## Appendix: Error Scenarios to Test

1. **Microphone Access Denied**
   - User denies permission
   - Permission is already denied from previous session
   - Browser blocks microphone access

2. **Transcription API Failure**
   - Network timeout
   - API returns error
   - API returns invalid response
   - API quota exceeded

3. **Storage Failure**
   - localStorage quota exceeded
   - IndexedDB quota exceeded
   - IndexedDB corrupted
   - File system error

4. **State Corruption**
   - Malformed JSON in localStorage
   - Recording stuck in 'processing' state
   - Invalid recording IDs
   - Orphaned IndexedDB records

5. **Resource Leaks**
   - MediaRecorder not stopped
   - Audio stream tracks not stopped
   - AudioContext not closed
   - Animation frames not cancelled

6. **Browser Crashes/Tab Closure**
   - Recording interrupted by tab close
   - App crashes during recording
   - Power loss during recording

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026