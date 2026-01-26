import React, { useState, useRef, useEffect } from 'react'
import DashboardLayout from './DashboardLayout'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useCreateNote } from '../hooks/mutations/useNoteMutations'
import { useNotes } from '../hooks/queries/useNotes'
import { transcribeAudio } from '../utils/gemini'
import { Mic, Square, Loader2, Sparkles, AlertCircle, ChevronRight } from 'lucide-react'

export default function VoiceView() {
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.signOut)
  const dark = useSettingsStore(state => state.dark)
  
  // Query for notes
  const { data: notes, isLoading: notesLoading } = useNotes()
  
  // Mutation to create notes
  const createNoteMutation = useCreateNote()

  // State
  const [isRecordingActive, setIsRecordingActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [transcriptData, setTranscriptData] = useState(null)

  // Derived
  const voiceNotes = notes?.filter(n => n.tags?.includes('voice-studio')) || []

  // Refs
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const canvasRef = useRef(null)
  const animationFrameRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)

  // --- Visualizer Logic ---
  const startVisualizer = stream => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    audioContextRef.current = audioCtx

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    analyserRef.current = analyser

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)
    sourceRef.current = source

    drawVisualizer()
  }

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      // If component unmounted or stopped, stop loop
      if (!isRecording && !canvasRef.current) return

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

  // Helper for rounded rect in canvas
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

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }

  // --- Recorder Logic ---
  const startRecording = async () => {
    try {
      setError(null)
      setTranscriptData(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Start Visualizer
      startVisualizer(stream)

      // Start Recorder
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

        // Combine chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' })
        await processAudio(audioBlob)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setError('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async audioBlob => {
    setIsProcessing(true)
    try {
      // Convert Blob to Base64
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      reader.onloadend = async () => {
        const base64String = reader.result.split(',')[1]

        // Call Gemini
        const result = await transcribeAudio(base64String)
        setTranscriptData(result)

        // Create Note automatically
        const content = `**Transcript:**\n\n${result.transcript}\n\n---\n\n**Summary:**\n${result.summary}`

        await createNoteMutation.mutateAsync({
          title: 'Voice Note',
          content,
          tags: ['voice-studio', 'gemini'],
          is_pinned: false,
          bg: 'white',
          type: 'text',
        })

        // On success, go back to grid
        setIsRecordingActive(false)
      }
    } catch (err) {
      console.error('Processing failed:', err)
      setError('Failed to process audio with Gemini. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  useEffect(() => {
    return () => stopVisualizer()
  }, [])

  return (
    <DashboardLayout
      activeSection="voice"
      onNavigate={section => {
        if (['health', 'alerts', 'admin', 'trash', 'docs', 'voice'].includes(section)) {
          window.location.hash = `#/${section}`
        } else if (section === 'overview') {
          window.location.hash = '#/notes'
        }
      }}
      user={currentUser}
      title="Voice Studio"
      onSignOut={signOut}
    >
      <div className="h-full flex flex-col">
        {isRecordingActive ? (
          // --- RECORDER VIEW ---
          <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-300 max-w-2xl mx-auto w-full">
            <div className="w-full flex justify-between items-center mb-12">
              <button
                onClick={() => setIsRecordingActive(false)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="rotate-180" size={20} />
                <span>Back to Library</span>
              </button>
              <h2 className="text-xl font-semibold text-gray-200">Recording Studio</h2>
              <div className="w-20" /> {/* Spacer */}
            </div>

            <div className="mb-12 text-center">
              <p className="text-gray-400">
                {isRecording
                  ? 'Gemini is listening...'
                  : isProcessing
                    ? 'Transcribing and summarizing...'
                    : 'Ready to capture your thoughts'}
              </p>
            </div>

            {/* VISUALIZER CANVAS */}
            <div className="relative w-full h-40 mb-12 bg-black/20 rounded-2xl overflow-hidden border border-white/5">
              <canvas
                ref={canvasRef}
                width={600}
                height={160}
                className="w-full h-full object-cover"
              />
            </div>

            {/* MAIN ACTION BUTTON */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`
                    group relative flex items-center justify-center w-32 h-32 rounded-full 
                    transition-all duration-300 transform hover:scale-105 active:scale-95
                    ${
                      isRecording
                        ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)]'
                        : 'bg-gradient-to-br from-indigo-600 to-purple-600 shadow-[0_0_40px_rgba(79,70,229,0.4)]'
                    }
                    ${isProcessing ? 'opacity-50 cursor-wait' : ''}
                `}
            >
              {isProcessing ? (
                <Loader2 size={48} className="text-white animate-spin" />
              ) : isRecording ? (
                <Square size={40} className="text-white fill-white" />
              ) : (
                <Mic size={48} className="text-white group-hover:drop-shadow-lg" />
              )}
            </button>

            {/* STATUS TEXT */}
            <div className="mt-8 h-12">
              {isRecording ? (
                <span className="text-xl font-medium text-red-400 animate-pulse">
                  Recording in progress...
                </span>
              ) : isProcessing ? (
                <span className="text-xl font-medium text-indigo-300 flex items-center justify-center gap-2">
                  <Sparkles size={20} /> Processing Transcript...
                </span>
              ) : (
                <span className="text-gray-500">Tap the microphone to start</span>
              )}
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 text-red-400 flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>
        ) : (
          // --- GRID VIEW ---
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Voice Gallery
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Record New Card */}
              <button
                onClick={() => setIsRecordingActive(true)}
                className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all duration-300 min-h-[200px]"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mic size={32} className="text-indigo-400" />
                </div>
                <span className="font-semibold text-lg text-gray-200">Record Note</span>
                <span className="text-sm text-gray-500 mt-1">Transcribe with Gemini</span>
              </button>

              {/* Voice Notes */}
              {voiceNotes.map(note => (
                <div
                  key={note.id}
                  className="group relative flex flex-col p-6 rounded-2xl glass-card border border-white/10 hover:border-purple-500/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left min-h-[200px]"
                >
                  <div className="mb-4 flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                      <Mic size={20} />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-100 mb-2 truncate w-full">
                    {note.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-3 flex-1 mb-4">
                    {note.content.replace(/\*+/g, '').replace(/^-+/gm, '').trim()}
                  </p>
                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between w-full text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Sparkles size={12} />
                      AI Summarized
                    </span>
                    <button
                      onClick={() => (window.location.hash = '#/notes')}
                      className="text-indigo-400 hover:underline"
                    >
                      View in Notes
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {voiceNotes.length === 0 && !notesLoading && (
              <div className="text-center text-gray-500 mt-20">
                <Mic className="mx-auto mb-4 opacity-20" size={48} />
                <p>No voice notes yet. Start recording your ideas!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
