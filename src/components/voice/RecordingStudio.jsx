import React, { useState, useRef, useEffect } from 'react'
import { useVoiceStore } from '../../stores/voiceStore'
import { transcribeAudio, transcribeAudioStream } from '../../utils/gemini'
import { retryOperation } from '../../utils/retryOperation'
import logger from '../../utils/logger'
import AudioQualityIndicator from './AudioQualityIndicator'
import PlaybackControls from './PlaybackControls'
import FormatToolbar from './FormatToolbar'
import ExportButton from './ExportButton'
import {
  Mic,
  Square,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Save,
  X,
  Loader2,
  Undo,
  Redo,
  Edit2,
  Download,
  CheckCircle,
} from 'lucide-react'

export default function RecordingStudio() {
  const {
    studioCollapsed,
    recordingState,
    currentTranscript,
    currentSummary,
    currentAudio,
    recordingDuration,
    error,
    transcriptHistory,
    historyIndex,
    recordings,
    activeRecordingId,
    setStudioCollapsed,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    setTranscript,
    updateTranscript,
    undoTranscript,
    redoTranscript,
    setSummary,
    saveRecording,
    clearActiveRecording,
    setError,
    setAudioData,
    setRecordingDuration,
    setRecordingState,
  } = useVoiceStore()

  // Local state
  const [timer, setTimer] = useState('00:00')
  const [localTranscript, setLocalTranscript] = useState(currentTranscript)
  const [localDuration, setLocalDuration] = useState(recordingDuration)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const audioRef = useRef(null)

  // Refs
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const streamRef = useRef(null)
  const audioElementRef = useRef(null)
  const lastProcessedTranscriptRef = useRef(null)
  const lastProcessedSummaryRef = useRef(null)
  const lastProcessedStateRef = useRef(null)

  // Comprehensive cleanup function
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

  // Sync transcript from store
  useEffect(() => {
    setLocalTranscript(currentTranscript)
  }, [currentTranscript])

  // Sync duration from store (for editing)
  useEffect(() => {
    setLocalDuration(recordingDuration)
  }, [recordingDuration])

  // Duration tracking effect
  useEffect(() => {
    let interval
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        setLocalDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [recordingState])

  // Sync local duration to store during recording
  useEffect(() => {
    if (recordingState === 'recording') {
      setRecordingDuration(localDuration)
    }
  }, [localDuration, recordingState, setRecordingDuration])

  // Debounce transcript history updates from user typing
  useEffect(() => {
    if (recordingState !== 'reviewing') return
    const debounceTimer = setTimeout(() => {
      if (localTranscript !== currentTranscript) {
        setTranscript(localTranscript)
      }
    }, 800)
    return () => clearTimeout(debounceTimer)
  }, [localTranscript, currentTranscript, recordingState, setTranscript])

  // Timer display effect
  useEffect(() => {
    setTimer(formatTime(localDuration))
  }, [localDuration])

  // Format time helper
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start recording handler
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

          // Set processing state
          setError(null)

          // Convert to base64 for transcription
          const reader = new FileReader()
          reader.readAsDataURL(audioBlob)
          reader.onloadend = async () => {
            const base64String = reader.result.split(',')[1]

            // Set audio data in store
            setAudioData(base64String)

            // Trigger transcription via Gemini API
            await processTranscription(base64String)
          }
          reader.onerror = () => {
            console.error('FileReader error:', reader.error)
            setError('Failed to process audio. Please try again.')
            stopRecording()
            cleanupRecordingResources()
          }
        } catch (err) {
          console.error('Error in onstop handler:', err)
          setError('An error occurred while processing the recording.')
          stopRecording()
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

  // Stop recording handler
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop()
      // Update store with final duration
      setRecordingDuration(localDuration)
      stopRecording()
    }
  }

  // Transcription via Gemini API (with streaming support and retry logic)
  const processTranscription = async base64Audio => {
    try {
      logger.info('transcription_start_attempt', { audioLength: base64Audio.length })
      setError(null)

      // Use streaming transcription for better UX with retry logic
      await retryOperation(
        () =>
          transcribeAudioStream(
            base64Audio,
            // onChunk - partial results
            chunk => {
              // Use refs to prevent redundant updates
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
            // onComplete - final results
            result => {
              logger.info('transcription_complete', {
                transcriptLength: result?.transcript?.length,
                summaryLength: typeof result?.summary === 'string' 
                  ? result.summary.length 
                  : (Array.isArray(result?.summary) ? result.summary.length : 0),
              })
              if (result && result.transcript) {
                // Only update state if values have changed
                if (result.transcript !== currentTranscript) {
                  setTranscript(result.transcript)
                }
                
                const rawSummary = result.summary || 'No summary available'
                const summary = Array.isArray(rawSummary) ? rawSummary.join('\n') : rawSummary
                
                if (summary !== currentSummary) {
                  setSummary(summary)
                }
                
                // Transition to reviewing state to dismiss spinner
                if (recordingState !== 'reviewing' && recordingState !== lastProcessedStateRef.current) {
                  lastProcessedStateRef.current = 'reviewing'
                  setRecordingState('reviewing')
                }
              } else {
                logger.warn('transcription_failed_no_result', {})
                setError('Transcription failed. Please try again.')
                if (recordingState !== 'idle' && recordingState !== lastProcessedStateRef.current) {
                  lastProcessedStateRef.current = 'idle'
                  setRecordingState('idle')
                }
              }
            },
            // onError - error handling
            err => {
              logger.error('transcription_stream_error', {}, err)
              console.error('Streaming transcription error:', err)
              setError('Failed to transcribe audio. Please try again.')
              if (recordingState !== 'idle' && recordingState !== lastProcessedStateRef.current) {
                lastProcessedStateRef.current = 'idle'
                setRecordingState('idle')
              }
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
    }
  }

  // Visualizer
  const startVisualizer = stream => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    audioContextRef.current = audioCtx

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    drawVisualizer()
  }

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!analyserRef.current) return

      animationFrameRef.current = requestAnimationFrame(draw)
      analyserRef.current.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const width = canvas.width
      const height = canvas.height
      const barWidth = (width / bufferLength) * 2.5
      let x = 0

      // Gradient for bars
      const gradient = ctx.createLinearGradient(0, height, 0, 0)
      gradient.addColorStop(0, '#4f46e5') // Indigo
      gradient.addColorStop(0.5, '#a855f7') // Purple
      gradient.addColorStop(1, '#ec4899') // Pink

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.8

        ctx.fillStyle = gradient
        // Rounded bars
        roundRect(ctx, x, height - barHeight, barWidth, barHeight, 5)

        x += barWidth + 2
      }
    }
    draw()
  }

  const roundRect = (ctx, x, y, w, h, radius) => {
    if (w < 2 * radius) radius = w / 2
    if (h < 2 * radius) radius = h / 2
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + w, y, x + w, y + h, radius)
    ctx.arcTo(x + w, y + h, x, y + h, radius)
    ctx.arcTo(x, y + h, x, y, radius)
    ctx.arcTo(x, y, x + w, y, radius)
    ctx.closePath()
    ctx.fill()
  }

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    if (audioContextRef.current) audioContextRef.current.close()

    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  // Keyboard shortcuts for transcript editing
  useEffect(() => {
    const handleTranscriptKeyDown = e => {
      // Only handle Ctrl+Z and Ctrl+Y in transcript textarea
      if (e.target.tagName === 'TEXTAREA') {
        if (e.ctrlKey || e.metaKey) {
          if (e.key === 'z' && !e.shiftKey) {
            e.preventDefault()
            undoTranscript()
          } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
            e.preventDefault()
            redoTranscript()
          }
        }
      }
    }

    // Keyboard shortcuts for controls
    const handleKeyDown = e => {
      // Ignore if in input field (except for Ctrl+Z/Y which are handled separately)
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        return
      }

      // Space to toggle recording (if idle or recording)
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        if (recordingState === 'idle') {
          handleStartRecording()
        } else if (recordingState === 'recording') {
          pauseRecording()
        } else if (recordingState === 'paused') {
          resumeRecording()
        }
      }

      // Escape to stop recording
      if (e.code === 'Escape' && (recordingState === 'recording' || recordingState === 'paused')) {
        e.preventDefault()
        handleStopRecording()
      }

      // S to save to notes (if reviewing)
      if (e.code === 'KeyS' && recordingState === 'reviewing') {
        e.preventDefault()
        handleSave('notes')
      }

      // G to save to gallery (if reviewing)
      if (e.code === 'KeyG' && recordingState === 'reviewing') {
        e.preventDefault()
        handleSave('gallery')
      }

      // C to collapse/expand
      if (e.code === 'KeyC') {
        e.preventDefault()
        setStudioCollapsed(!studioCollapsed)
      }
    }

    window.addEventListener('keydown', handleTranscriptKeyDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleTranscriptKeyDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [recordingState, studioCollapsed, historyIndex, transcriptHistory])

  // Cleanup
  useEffect(() => {
    return () => {
      stopVisualizer()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Save handlers
  const [saveMessage, setSaveMessage] = useState(null)
  const [saveToBoth, setSaveToBoth] = useState(false)

  // Get recording being edited
  const editingRecording = recordings.find(r => r.id === activeRecordingId)

  const showSaveMessage = message => {
    setSaveMessage(message)
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleSave = destination => {
    saveRecording(destination, {
      title:
        destination === 'notes'
          ? `Voice Note ${new Date().toLocaleDateString()}`
          : `Recording ${new Date().toLocaleDateString()}`,
      duration: localDuration,
    })

    if (saveToBoth) {
      // Save to other location too
      saveRecording(destination === 'notes' ? 'gallery' : 'notes', {
        title: `Recording ${new Date().toLocaleDateString()}`,
        duration: localDuration,
      })
      showSaveMessage('Saved to Notes & Gallery')
    } else {
      showSaveMessage(destination === 'notes' ? 'Saved to Notes' : 'Saved to Gallery')
    }

    clearActiveRecording()
    setLocalDuration(0)
  }

  return (
    <div
      className={`
      mb-6 rounded-2xl border transition-all duration-300
      ${
        studioCollapsed
          ? 'bg-white/5 border-white/10'
          : 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20'
      }
    `}
    >
      {/* Header - Always Visible */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setStudioCollapsed(!studioCollapsed)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          {studioCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          <span className="font-semibold">Voice Recorder</span>
        </button>

        <div className="flex items-center gap-3">
          {recordingState !== 'idle' && (
            <div className="flex items-center gap-2 text-sm">
              <Clock
                size={16}
                className={
                  recordingState === 'recording' ? 'text-red-400 animate-pulse' : 'text-gray-400'
                }
              />
              <span className={recordingState === 'recording' ? 'text-red-400' : 'text-gray-400'}>
                {timer}
              </span>
            </div>
          )}

          {/* Recording indicator */}
          {recordingState === 'recording' && (
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
      </div>

      {!studioCollapsed && (
        <div className="p-6 space-y-6">
          {/* Export Button (in review mode) */}
          {recordingState === 'reviewing' && currentAudio && (
            <ExportButton
              recording={{
                title: `Voice Note ${new Date().toLocaleDateString()}`,
                transcript: currentTranscript,
                summary: currentSummary,
                duration: localDuration,
                createdAt: new Date().toISOString(),
                audioData: currentAudio,
              }}
              className="w-full"
            />
          )}

          {/* Edit Confirmation Banner */}
          {editingRecording && (
            <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm flex items-center gap-2">
              <Edit2 size={16} />
              <span>
                Editing: <strong>{editingRecording.title}</strong>
              </span>
              <button
                onClick={() => clearActiveRecording()}
                className="ml-auto px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs transition-colors"
              >
                Cancel Edit
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <X size={16} />
              {error}
            </div>
          )}

          {/* Visualizer & Quality Indicator */}
          <div className="flex gap-4">
            {/* Audio Quality Indicator */}
            {recordingState === 'recording' && (
              <AudioQualityIndicator
                stream={streamRef.current}
                isRecording={recordingState === 'recording'}
              />
            )}

            {/* Visualizer */}
            <div className="flex-1 h-32 bg-black/20 rounded-xl overflow-hidden border border-white/5 relative">
              <canvas
                ref={canvasRef}
                width={600}
                height={128}
                className="w-full h-full object-cover"
              />

              {recordingState === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <Mic size={32} className="opacity-30" />
                </div>
              )}

              {recordingState === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="text-indigo-400 animate-spin" />
                    <span className="text-indigo-400 font-medium">Transcribing with AI...</span>
                    <span className="text-xs text-gray-400">This may take a few seconds</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {recordingState === 'idle' ? (
              <button
                onClick={handleStartRecording}
                className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
              >
                <Mic size={32} className="text-white" />
              </button>
            ) : recordingState === 'recording' ? (
              <>
                <button
                  onClick={pauseRecording}
                  className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors"
                  title="Pause"
                >
                  <Pause size={20} className="text-white" />
                </button>
                <button
                  onClick={handleStopRecording}
                  className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
                >
                  <Square size={32} className="text-white fill-white" />
                </button>
              </>
            ) : recordingState === 'paused' ? (
              <>
                <button
                  onClick={resumeRecording}
                  className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors"
                  title="Resume"
                >
                  <Play size={20} className="text-white fill-white" />
                </button>
                <button
                  onClick={handleStopRecording}
                  className="p-4 rounded-full bg-red-600 hover:bg-red-500 transition-colors"
                  title="Stop"
                >
                  <Square size={20} className="text-white fill-white" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSave('notes')}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  <Save size={18} />
                  Save to Notes
                </button>
                <button
                  onClick={() => handleSave('gallery')}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
                >
                  <Save size={18} />
                  Save to Gallery
                </button>
              </div>
            )}
          </div>

          {/* Audio Player in Review Mode */}
          {(currentAudio || recordingState === 'reviewing') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Audio Playback</label>
              <PlaybackControls
                audioUrl={`data:audio/webm;base64,${currentAudio}`}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          )}

          {/* Save Options */}
          {recordingState === 'reviewing' && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                id="saveToBoth"
                checked={saveToBoth}
                onChange={e => setSaveToBoth(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 focus:ring-indigo-500"
              />
              <label
                htmlFor="saveToBoth"
                className="cursor-pointer hover:text-white transition-colors"
              >
                Save to both Notes & Gallery
              </label>
            </div>
          )}

          {/* Transcript Preview with Formatting Toolbar */}
          {(currentTranscript || recordingState === 'processing') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-400">Transcript</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={undoTranscript}
                    disabled={historyIndex <= 0}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo size={16} className="text-gray-400" />
                  </button>
                  <button
                    onClick={redoTranscript}
                    disabled={historyIndex >= transcriptHistory.length - 1}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Format Toolbar */}
              <FormatToolbar
                value={localTranscript}
                onChange={newValue => {
                  setLocalTranscript(newValue)
                  setTranscript(newValue)
                }}
                className="mb-2"
              />

              <textarea
                value={localTranscript}
                onChange={e => {
                  setLocalTranscript(e.target.value)
                  setTranscript(e.target.value)
                }}
                placeholder="Transcript will appear here..."
                className="w-full h-32 p-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          )}

          {/* Summary Preview */}
          {(currentSummary || recordingState === 'processing') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">AI Summary</label>
              <textarea
                value={currentSummary}
                onChange={e => setSummary(e.target.value)}
                placeholder="AI summary will appear here..."
                className="w-full h-20 p-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          )}
        </div>
      )}

      {/* Save Confirmation Toast */}
      {saveMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-300 z-50">
          <CheckCircle size={20} />
          <span className="font-medium">{saveMessage}</span>
        </div>
      )}
    </div>
  )
}