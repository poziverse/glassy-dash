import React, { useState, useRef, useEffect } from 'react'
import { useVoiceStore } from '../../stores/voiceStore'
import { Mic, Square, Pause, Play, ChevronDown, ChevronUp, Clock, Sparkles, Save, X } from 'lucide-react'

export default function RecordingStudio() {
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

  // Local state
  const [timer, setTimer] = useState('00:00')
  const [localTranscript, setLocalTranscript] = useState(currentTranscript)

  // Refs
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const timerIntervalRef = useRef(null)

  // Sync transcript from store
  useEffect(() => {
    setLocalTranscript(currentTranscript)
  }, [currentTranscript])

  // Timer effect
  useEffect(() => {
    if (recordingState === 'recording') {
      timerIntervalRef.current = setInterval(() => {
        setTimer(formatTime(recordingDuration))
      }, 1000)
    } else {
      clearInterval(timerIntervalRef.current)
    }

    return () => clearInterval(timerIntervalRef.current)
  }, [recordingState, recordingDuration])

  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start recording handler
  const handleStartRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

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
        stopVisualizer()
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Convert to base64 for storage
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1]
          // Trigger transcription (this would call Gemini API)
          processTranscription(base64String)
        }
      }

      mediaRecorder.start()
      startRecording()
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('Could not access microphone. Please check permissions.')
    }
  }

  // Stop recording handler
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop()
      stopRecording()
    }
  }

  // Transcription (placeholder - would call Gemini API)
  const processTranscription = async (audioData) => {
    // This is where you'd call your Gemini API
    // For now, we'll simulate with a timeout
    setTimeout(() => {
      const sampleTranscript = "This is a sample transcription. In production, this would be the actual transcribed text from Gemini API."
      const sampleSummary = "Sample recording with audio content."
      setTranscript(sampleTranscript)
      setSummary(sampleSummary)
    }, 1000)
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

  // Cleanup
  useEffect(() => {
    return () => stopVisualizer()
  }, [])

  // Save handlers
  const handleSaveToNotes = () => {
    saveRecording('notes', { title: `Voice Note ${new Date().toLocaleDateString()}` })
    clearActiveRecording()
  }

  const handleSaveToGallery = () => {
    saveRecording('gallery', { title: `Recording ${new Date().toLocaleDateString()}` })
    clearActiveRecording()
  }

  return (
    <div className={`
      mb-6 rounded-2xl border transition-all duration-300
      ${studioCollapsed 
        ? 'bg-white/5 border-white/10' 
        : 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20'
      }
    `}>
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
              <Clock size={16} className={recordingState === 'recording' ? 'text-red-400 animate-pulse' : 'text-gray-400'} />
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
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <X size={16} />
              {error}
            </div>
          )}

          {/* Visualizer */}
          <div className="relative w-full h-32 bg-black/20 rounded-xl overflow-hidden border border-white/5">
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
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Sparkles size={24} className="animate-spin" />
                  <span>Transcribing...</span>
                </div>
              </div>
            )}
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
                  onClick={handleSaveToNotes}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                >
                  <Save size={18} />
                  Save to Notes
                </button>
                <button
                  onClick={handleSaveToGallery}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
                >
                  <Save size={18} />
                  Save to Gallery
                </button>
              </div>
            )}
          </div>

          {/* Transcript Preview */}
          {(currentTranscript || recordingState === 'processing') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Transcript</label>
              <textarea
                value={localTranscript}
                onChange={(e) => {
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
                onChange={(e) => setSummary(e.target.value)}
                placeholder="AI summary will appear here..."
                className="w-full h-20 p-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}