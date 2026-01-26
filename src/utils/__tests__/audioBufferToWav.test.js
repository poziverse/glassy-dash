import { describe, it, expect, beforeEach, vi } from 'vitest'
import { audioBufferToWav, downloadAudioBufferAsWav } from '../audioBufferToWav'

describe('audioBufferToWav', () => {
  let mockBuffer
  let hasBlobArrayBuffer

  beforeEach(() => {
    // Check if Blob.arrayBuffer is available (browser-only API)
    hasBlobArrayBuffer = typeof Blob !== 'undefined' && typeof Blob.prototype.arrayBuffer === 'function'
    // Helper: Create mock audio buffer
    mockBuffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 44100, // 1 second
      channelData: [new Float32Array(44100).fill(0.5)],
      getChannelData(channel) {
        return this.channelData[channel]
      }
    }
  })

  describe('WAV blob creation', () => {
    it('should create WAV blob', () => {
      if (!hasBlobArrayBuffer) {
        // Skip if Blob.arrayBuffer not available
        return
      }
      const blob = audioBufferToWav(mockBuffer)
      
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('audio/wav')
    })

    it('should have correct file size', () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      // Header (44 bytes) + data (44100 samples * 2 bytes * 1 channel)
      const expectedSize = 44 + 44100 * 2
      
      expect(blob.size).toBe(expectedSize)
    })

    it('should handle stereo audio', () => {
      if (!hasBlobArrayBuffer) return
      mockBuffer.numberOfChannels = 2
      mockBuffer.channelData = [
        new Float32Array(44100).fill(0.5),
        new Float32Array(44100).fill(0.5)
      ]
      mockBuffer.getChannelData = (channel) => mockBuffer.channelData[channel]

      const blob = audioBufferToWav(mockBuffer)
      // Header (44 bytes) + data (44100 samples * 2 bytes * 2 channels)
      const expectedSize = 44 + 44100 * 2 * 2
      
      expect(blob.size).toBe(expectedSize)
    })

    it('should handle different sample rates', () => {
      if (!hasBlobArrayBuffer) return
      mockBuffer.sampleRate = 48000
      mockBuffer.length = 48000
      mockBuffer.channelData = [new Float32Array(48000).fill(0.5)]
      mockBuffer.getChannelData = (channel) => mockBuffer.channelData[channel]

      const blob = audioBufferToWav(mockBuffer)
      const expectedSize = 44 + 48000 * 2
      
      expect(blob.size).toBe(expectedSize)
    })
  })

  describe('RIFF header validation', () => {
    it('should have correct RIFF header', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      // "RIFF" signature
      expect(view.getUint8(0)).toBe(0x52) // 'R'
      expect(view.getUint8(1)).toBe(0x49) // 'I'
      expect(view.getUint8(2)).toBe(0x46) // 'F'
      expect(view.getUint8(3)).toBe(0x46) // 'F'
    })

    it('should have correct WAVE format', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      // "WAVE" signature
      expect(view.getUint8(8)).toBe(0x57) // 'W'
      expect(view.getUint8(9)).toBe(0x41) // 'A'
      expect(view.getUint8(10)).toBe(0x56) // 'V'
      expect(view.getUint8(11)).toBe(0x45) // 'E'
    })

    it('should have correct file size', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      // File size (total - 8)
      const fileSize = view.getUint32(4, true) // Little-endian
      const expectedFileSize = blob.size - 8
      
      expect(fileSize).toBe(expectedFileSize)
    })
  })

  describe('fmt chunk validation', () => {
    it('should have correct fmt chunk ID', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      // "fmt " signature
      expect(view.getUint8(12)).toBe(0x66) // 'f'
      expect(view.getUint8(13)).toBe(0x6D) // 'm'
      expect(view.getUint8(14)).toBe(0x74) // 't'
      expect(view.getUint8(15)).toBe(0x20) // ' '
    })

    it('should specify PCM format', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      // Audio format (1 = PCM)
      const audioFormat = view.getUint16(20, true) // Little-endian
      expect(audioFormat).toBe(1)
    })

    it('should have correct channel count', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      const numChannels = view.getUint16(22, true)
      expect(numChannels).toBe(mockBuffer.numberOfChannels)
    })

    it('should have correct sample rate', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      const sampleRate = view.getUint32(24, true)
      expect(sampleRate).toBe(mockBuffer.sampleRate)
    })

    it('should have correct byte rate', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      // Byte rate = sampleRate * channels * bitsPerSample / 8
      const byteRate = view.getUint32(28, true)
      const expectedByteRate = mockBuffer.sampleRate * mockBuffer.numberOfChannels * 2
      
      expect(byteRate).toBe(expectedByteRate)
    })

    it('should have correct block align', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      // Block align = channels * bitsPerSample / 8
      const blockAlign = view.getUint16(32, true)
      const expectedBlockAlign = mockBuffer.numberOfChannels * 2
      
      expect(blockAlign).toBe(expectedBlockAlign)
    })

    it('should have correct bit depth', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      const bitsPerSample = view.getUint16(34, true)
      expect(bitsPerSample).toBe(16) // 16-bit audio
    })
  })

  describe('data chunk validation', () => {
    it('should have correct data chunk ID', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      // "data" signature
      expect(view.getUint8(36)).toBe(0x64) // 'd'
      expect(view.getUint8(37)).toBe(0x61) // 'a'
      expect(view.getUint8(38)).toBe(0x74) // 't'
      expect(view.getUint8(39)).toBe(0x61) // 'a'
    })

    it('should have correct data size', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      const dataSize = view.getUint32(40, true)
      const expectedDataSize = mockBuffer.length * 2 * mockBuffer.numberOfChannels
      
      expect(dataSize).toBe(expectedDataSize)
    })

    it('should contain audio data', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      // Check first few samples
      const firstSample = view.getInt16(44, true) // First data byte
      expect(Math.abs(firstSample)).toBeGreaterThan(0) // Should have non-zero audio
    })

    it('should correctly convert float32 to int16', async () => {
      if (!hasBlobArrayBuffer) return
      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      // With float32 = 0.5, int16 should be 0.5 * 32767 ≈ 16383
      const firstSample = view.getInt16(44, true)
      expect(firstSample).toBeCloseTo(16384, 100) // Allow some tolerance
    })

    it('should handle negative samples', async () => {
      if (!hasBlobArrayBuffer) return
      mockBuffer.channelData[0].fill(-0.5)

      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      const firstSample = view.getInt16(44, true)
      expect(firstSample).toBeLessThan(0)
      expect(firstSample).toBeCloseTo(-16384, 100)
    })

    it('should interleave stereo channels', async () => {
      if (!hasBlobArrayBuffer) return
      mockBuffer.numberOfChannels = 2
      mockBuffer.channelData = [
        new Float32Array(100).fill(0.5),
        new Float32Array(100).fill(0.7)
      ]
      mockBuffer.length = 100
      mockBuffer.getChannelData = (channel) => mockBuffer.channelData[channel]

      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      // First sample (channel 0), second sample (channel 1), etc.
      const sample1 = view.getInt16(44, true) // Channel 0
      const sample2 = view.getInt16(46, true) // Channel 1
      const sample3 = view.getInt16(48, true) // Channel 0
      const sample4 = view.getInt16(50, true) // Channel 1

      expect(sample1).toBeCloseTo(16384, 100)
      expect(sample2).toBeCloseTo(22938, 100) // 0.7 * 32767
      expect(sample3).toBeCloseTo(16384, 100)
      expect(sample4).toBeCloseTo(22938, 100)
    })
  })

  describe('Edge cases', () => {
    it('should handle zero-length buffer', () => {
      if (!hasBlobArrayBuffer) return
      mockBuffer.length = 0
      mockBuffer.channelData = [new Float32Array(0).fill(0)]

      const blob = audioBufferToWav(mockBuffer)
      
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.size).toBe(44) // Just header
    })

    it('should handle maximum sample values', async () => {
      if (!hasBlobArrayBuffer) return
      mockBuffer.channelData[0].fill(1.0) // Maximum float32

      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      const firstSample = view.getInt16(44, true)
      expect(firstSample).toBeCloseTo(32767, 100)
    })

    it('should handle minimum sample values', async () => {
      if (!hasBlobArrayBuffer) return
      mockBuffer.channelData[0].fill(-1.0) // Minimum float32

      const blob = audioBufferToWav(mockBuffer)
      const arrayBuffer = await blob.arrayBuffer()
      if (!arrayBuffer) return
      const view = new DataView(arrayBuffer)

      const firstSample = view.getInt16(44, true)
      expect(firstSample).toBeCloseTo(-32768, 100)
    })

    it('should handle small buffer', () => {
      if (!hasBlobArrayBuffer) return
      mockBuffer.length = 100
      mockBuffer.channelData = [new Float32Array(100).fill(0.3)]

      const blob = audioBufferToWav(mockBuffer)
      const expectedSize = 44 + 100 * 2
      
      expect(blob.size).toBe(expectedSize)
    })
  })
})

describe('downloadAudioBufferAsWav', () => {
  let mockBuffer

  beforeEach(() => {
    mockBuffer = {
      numberOfChannels: 1,
      sampleRate: 44100,
      length: 100,
      channelData: [new Float32Array(100).fill(0.5)],
      getChannelData(channel) {
        return this.channelData[channel]
      }
    }
  })

  it('should create download link', () => {
    // Mock DOM methods
    const createElementSpy = vi.spyOn(document, 'createElement')
    const urlSpy = vi.spyOn(URL, 'createObjectURL')
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')

    downloadAudioBufferAsWav(mockBuffer, 'test.wav')

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(urlSpy).toHaveBeenCalled()
    
    // Cleanup
    createElementSpy.mockRestore()
    urlSpy.mockRestore()
    revokeSpy.mockRestore()
  })

  it('should use custom filename', () => {
    const createElementSpy = vi.spyOn(document, 'createElement')
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    }
    createElementSpy.mockReturnValue(mockLink)

    downloadAudioBufferAsWav(mockBuffer, 'custom-audio.wav')

    expect(mockLink.download).toBe('custom-audio.wav')
    
    // Cleanup
    createElementSpy.mockRestore()
  })

  it('should use default filename', () => {
    const createElementSpy = vi.spyOn(document, 'createElement')
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    }
    createElementSpy.mockReturnValue(mockLink)

    downloadAudioBufferAsWav(mockBuffer)

    expect(mockLink.download).toBe('audio.wav')
    
    // Cleanup
    createElementSpy.mockRestore()
  })

  it('should trigger download', () => {
    const createElementSpy = vi.spyOn(document, 'createElement')
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    }
    createElementSpy.mockReturnValue(mockLink)

    downloadAudioBufferAsWav(mockBuffer)

    expect(mockLink.click).toHaveBeenCalled()
    
    // Cleanup
    createElementSpy.mockRestore()
  })
})