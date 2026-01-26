/**
 * AudioEnhancements - AI-powered audio enhancement controls
 * Part of Phase 5: Advanced Features
 */

import { useState, useRef, useEffect } from 'react'
import { XCircle, Sparkles, Volume2, Waves, Play, Save, Download } from 'lucide-react'

/**
 * AudioEnhancer class - Web Audio API audio processing
 */
export class AudioEnhancer {
  constructor(audioContext) {
    this.audioContext = audioContext
    this.sourceNode = null
    this.gainNode = null
    this.filterNode = null
    this.compressorNode = null
    this.originalBuffer = null
  }
  
  setup(audioBuffer) {
    this.originalBuffer = audioBuffer
    
    // Create nodes
    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = audioBuffer
    
    this.gainNode = this.audioContext.createGain()
    this.filterNode = this.audioContext.createBiquadFilter()
    this.compressorNode = this.audioContext.createDynamicsCompressor()
  }
  
  // Remove background noise
  removeNoise(threshold = 0.02) {
    this.filterNode.type = 'highpass'
    this.filterNode.frequency.value = 80 // Remove low-frequency noise
    this.filterNode.Q.value = 0.5
    this.gainNode.gain.value = 1.0
  }
  
  // Enhance speech frequencies
  enhanceSpeech() {
    this.filterNode.type = 'peaking'
    this.filterNode.frequency.value = 2000
    this.filterNode.Q.value = 1
    this.filterNode.gain.value = 3 // +3dB boost
    this.gainNode.gain.value = 1.0
  }
  
  // Auto-leveling (compression)
  autoLevel() {
    this.compressorNode.threshold.value = -20
    this.compressorNode.knee.value = 40
    this.compressorNode.ratio.value = 12
    this.compressorNode.attack.value = 0
    this.compressorNode.release.value = 0.25
    this.gainNode.gain.value = 1.0
  }
  
  // Remove echo
  removeEcho() {
    this.compressorNode.threshold.value = -30
    this.compressorNode.ratio.value = 3
    this.compressorNode.attack.value = 0.001
    this.compressorNode.release.value = 0.05
    this.gainNode.gain.value = 1.0
  }
  
  // Apply noise reduction directly to buffer
  applyNoiseReduction(threshold = 0.02) {
    if (!this.originalBuffer) return null
    
    const buffer = this.originalBuffer
    
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)
      const fadeLength = 100 // samples
      
      for (let i = 0; i < data.length; i++) {
        const amplitude = Math.abs(data[i])
        
        if (amplitude < threshold) {
          // Apply fade out/in for smooth transitions
          if (i > fadeLength && i < data.length - fadeLength) {
            const prevAmp = Math.abs(data[i - fadeLength])
            const nextAmp = Math.abs(data[i + fadeLength])
            
            if (prevAmp > threshold || nextAmp > threshold) {
              // Crossfade region - reduce noise smoothly
              data[i] *= 0.1
            } else {
              // Pure silence
              data[i] = 0
            }
          }
        }
      }
    }
    
    return buffer
  }
  
  // Export enhanced audio
  async export() {
    if (!this.originalBuffer) return null
    
    const duration = this.originalBuffer.duration
    const offlineCtx = new OfflineAudioContext(
      this.originalBuffer.sampleRate,
      this.originalBuffer.length
    )
    
    // Create source
    const source = offlineCtx.createBufferSource()
    source.buffer = this.originalBuffer
    
    // Create nodes
    const filter = offlineCtx.createBiquadFilter()
    filter.type = this.filterNode?.type || 'lowpass'
    filter.frequency.value = this.filterNode?.frequency?.value || 20000
    filter.Q.value = this.filterNode?.Q?.value || 0
    filter.gain.value = this.filterNode?.gain?.value || 0
    
    const gain = offlineCtx.createGain()
    gain.gain.value = this.gainNode?.gain?.value || 1
    
    const compressor = offlineCtx.createDynamicsCompressor()
    if (this.compressorNode) {
      compressor.threshold.value = this.compressorNode.threshold.value
      compressor.knee.value = this.compressorNode.knee.value
      compressor.ratio.value = this.compressorNode.ratio.value
      compressor.attack.value = this.compressorNode.attack.value
      compressor.release.value = this.compressorNode.release.value
    }
    
    // Connect nodes
    source.connect(filter)
    filter.connect(gain)
    gain.connect(compressor)
    compressor.connect(offlineCtx.destination)
    
    // Render
    source.start()
    const renderedBuffer = await offlineCtx.startRendering()
    
    return renderedBuffer
  }
}

export default function AudioEnhancements({ audioBlob, onEnhanced }) {
  const [enhancer, setEnhancer] = useState(null)
  const [enhancedBuffer, setEnhancedBuffer] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeEnhancements, setActiveEnhancements] = useState([])
  const audioElementRef = useRef(null)
  
  // Initialize enhancer
  useEffect(() => {
    const initEnhancer = async () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const enhancerInstance = new AudioEnhancer(ctx)
        
        const arrayBuffer = await audioBlob.arrayBuffer()
        const buffer = await ctx.decodeAudioData(arrayBuffer)
        enhancerInstance.setup(buffer)
        
        setEnhancer(enhancerInstance)
      } catch (error) {
        console.error('Failed to initialize enhancer:', error)
      }
    }
    
    initEnhancer()
  }, [audioBlob])
  
  // Apply enhancement
  const applyEnhancement = async (type) => {
    if (!enhancer) return
    
    setActiveEnhancements(prev => {
      const exists = prev.includes(type)
      return exists ? prev.filter(t => t !== type) : [...prev, type]
    })
    
    try {
      let buffer = enhancer.originalBuffer
      
      // Apply noise reduction directly
      if (type === 'noise') {
        buffer = enhancer.applyNoiseReduction(0.02)
        if (buffer) setEnhancedBuffer(buffer)
      }
      
      // For preview, use Web Audio API
      if (previewing && ['speech', 'leveling', 'echo'].includes(type)) {
        switch (type) {
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
        
        // Play preview
        const ctx = enhancer.audioContext
        const offlineCtx = new OfflineAudioContext(
          ctx.sampleRate,
          buffer.length
        )
        const source = offlineCtx.createBufferSource()
        source.buffer = buffer
        
        // Recreate node chain
        const filter = offlineCtx.createBiquadFilter()
        filter.type = enhancer.filterNode.type
        filter.frequency.value = enhancer.filterNode.frequency.value
        filter.Q.value = enhancer.filterNode.Q.value
        filter.gain.value = enhancer.filterNode.gain.value
        
        const gain = offlineCtx.createGain()
        gain.gain.value = enhancer.gainNode.gain.value
        
        const compressor = offlineCtx.createDynamicsCompressor()
        if (enhancer.compressorNode) {
          compressor.threshold.value = enhancer.compressorNode.threshold.value
          compressor.knee.value = enhancer.compressorNode.knee.value
          compressor.ratio.value = enhancer.compressorNode.ratio.value
          compressor.attack.value = enhancer.compressorNode.attack.value
          compressor.release.value = enhancer.compressorNode.release.value
        }
        
        source.connect(filter)
        filter.connect(gain)
        gain.connect(compressor)
        compressor.connect(offlineCtx.destination)
        
        source.start()
        const renderedBuffer = await offlineCtx.startRendering()
        
        // Create blob and play
        const wavBlob = await import('../../utils/audioBufferToWav').then(m => m.audioBufferToWav(renderedBuffer))
        const url = URL.createObjectURL(wavBlob)
        
        if (audioElementRef.current) {
          audioElementRef.current.src = url
          audioElementRef.current.play()
          setIsPlaying(true)
        }
      }
    } catch (error) {
      console.error('Failed to apply enhancement:', error)
      alert('Failed to apply enhancement. Please try again.')
    }
  }
  
  // Export enhanced audio
  const handleExport = async () => {
    if (!enhancer || activeEnhancements.length === 0) return
    
    try {
      const renderedBuffer = await enhancer.export()
      
      if (!renderedBuffer) return
      
      // Convert to WAV
      const { audioBufferToWav } = await import('../../utils/audioBufferToWav')
      const wavBlob = await audioBufferToWav(renderedBuffer)
      
      onEnhanced?.(wavBlob, activeEnhancements)
    } catch (error) {
      console.error('Failed to export:', error)
      alert('Failed to export enhanced audio. Please try again.')
    }
  }
  
  // Export to file
  const handleDownload = async () => {
    if (!enhancer) return
    
    const renderedBuffer = await enhancer.export()
    if (!renderedBuffer) return
    
    const { audioBufferToWav } = await import('../../utils/audioBufferToWav')
    const wavBlob = await audioBufferToWav(renderedBuffer)
    
    const url = URL.createObjectURL(wavBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enhanced-audio-${Date.now()}.wav`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  // Toggle preview
  const togglePreview = (checked) => {
    setPreviewing(checked)
    if (!checked && audioElementRef.current) {
      audioElementRef.current.pause()
      setIsPlaying(false)
    }
  }
  
  const enhancements = [
    {
      id: 'noise',
      title: 'Remove Noise',
      description: 'Background noise reduction',
      icon: XCircle,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/20'
    },
    {
      id: 'speech',
      title: 'Enhance Speech',
      description: 'Clarify speech frequencies',
      icon: Sparkles,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      id: 'leveling',
      title: 'Auto-Level',
      description: 'Normalize volume',
      icon: Volume2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      id: 'echo',
      title: 'Remove Echo',
      description: 'Cancel echo effects',
      icon: Waves,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20'
    }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Audio Enhancements
        </h3>
        <p className="text-sm text-gray-400">
          Apply AI-powered enhancements to improve audio quality
        </p>
      </div>
      
      {/* Enhancement cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {enhancements.map((enhancement) => {
          const Icon = enhancement.icon
          const isActive = activeEnhancements.includes(enhancement.id)
          
          return (
            <button
              key={enhancement.id}
              onClick={() => applyEnhancement(enhancement.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                isActive
                  ? `${enhancement.bgColor} border-2 border-${enhancement.color.replace('text-', '')}`
                  : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  size={24}
                  className={`${enhancement.color} ${
                    isActive ? '' : 'opacity-60'
                  }`}
                />
                <div className="flex-1">
                  <div className={`font-medium text-white ${isActive ? 'font-semibold' : ''}`}>
                    {enhancement.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {enhancement.description}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      
      {/* Preview controls */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
        <label className="flex items-center gap-3 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={previewing}
            onChange={(e) => togglePreview(e.target.checked)}
            className="rounded border-gray-600 w-4 h-4 accent-indigo-600"
          />
          <span>Preview changes in real-time</span>
        </label>
        
        {previewing && isPlaying && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Play size={16} />
            Playing preview
          </div>
        )}
      </div>
      
      {/* Hidden audio element for preview */}
      <audio
        ref={audioElementRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      
      {/* Export buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          disabled={activeEnhancements.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={20} />
          Download File
        </button>
        
        <button
          onClick={handleExport}
          disabled={activeEnhancements.length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={20} />
          Apply & Save
        </button>
      </div>
      
      {/* Info text */}
      {activeEnhancements.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-400">
            {activeEnhancements.length} enhancement{activeEnhancements.length > 1 ? 's' : ''} selected
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Click "Apply & Save" to process and save enhanced audio
          </p>
        </div>
      )}
    </div>
  )
}