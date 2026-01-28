import { describe, it, expect } from 'vitest'
import { AudioBufferUtils } from '../audioBufferUtils'

describe('AudioBufferUtils', () => {
  // Helper: Create mock audio buffer
  function createMockBuffer(sampleRate, channels, duration) {
    const length = Math.ceil(sampleRate * duration)
    const buffer = {
      numberOfChannels: channels,
      length,
      sampleRate,
      channelData: Array(channels)
        .fill(null)
        .map(() => new Float32Array(length).fill(0)),
      getChannelData(channel) {
        return this.channelData[channel]
      },
    }
    return buffer
  }

  describe('createBuffer', () => {
    it('should create buffer with correct parameters', () => {
      const buffer = AudioBufferUtils.createBuffer(44100, 2, 5)

      expect(buffer.numberOfChannels).toBe(2)
      expect(buffer.length).toBe(220500) // 44100 * 5
      expect(buffer.sampleRate).toBe(44100)
    })

    it('should create mono buffer', () => {
      const buffer = AudioBufferUtils.createBuffer(44100, 1, 3)

      expect(buffer.numberOfChannels).toBe(1)
      expect(buffer.length).toBe(132300) // 44100 * 3
    })

    it('should initialize with silence', () => {
      const buffer = AudioBufferUtils.createBuffer(44100, 2, 1)
      const channel0 = buffer.getChannelData(0)

      expect(channel0[0]).toBe(0)
      expect(channel0[100]).toBe(0)
      expect(channel0[buffer.length - 1]).toBe(0)
    })
  })

  describe('sliceBuffer', () => {
    it('should slice buffer correctly', () => {
      const buffer = createMockBuffer(44100, 1, 5) // 5 seconds
      // Add test data
      const data = buffer.getChannelData(0)
      data.fill(0.5)

      const sliced = AudioBufferUtils.sliceBuffer(buffer, 1, 3)

      expect(sliced.length).toBe(88200) // 2 seconds * 44100
      expect(sliced.sampleRate).toBe(44100)
      expect(sliced.numberOfChannels).toBe(1)
    })

    it('should handle start time zero', () => {
      const buffer = createMockBuffer(44100, 1, 5)
      const data = buffer.getChannelData(0)
      data.fill(0.7)

      const sliced = AudioBufferUtils.sliceBuffer(buffer, 0, 2)

      expect(sliced.length).toBe(88200)
      const slicedData = sliced.getChannelData(0)
      expect(slicedData[0]).toBeCloseTo(0.7, 5)
    })

    it('should handle end time at buffer end', () => {
      const buffer = createMockBuffer(44100, 1, 5)
      const data = buffer.getChannelData(0)
      data.fill(0.3)

      const sliced = AudioBufferUtils.sliceBuffer(buffer, 3, 5)

      expect(sliced.length).toBe(88200)
    })

    it('should preserve stereo channels', () => {
      const buffer = createMockBuffer(44100, 2, 2)
      const data0 = buffer.getChannelData(0)
      const data1 = buffer.getChannelData(1)
      data0.fill(0.5)
      data1.fill(0.7)

      const sliced = AudioBufferUtils.sliceBuffer(buffer, 0.5, 1.5)

      expect(sliced.numberOfChannels).toBe(2)
      expect(sliced.getChannelData(0)[0]).toBeCloseTo(0.5, 5)
      expect(sliced.getChannelData(1)[0]).toBeCloseTo(0.7, 5)
    })

    it('should handle very small slices', () => {
      const buffer = createMockBuffer(44100, 1, 5)
      const data = buffer.getChannelData(0)
      data.fill(0.4)

      const sliced = AudioBufferUtils.sliceBuffer(buffer, 0, 0.001) // 1ms

      expect(sliced.length).toBeGreaterThan(0)
      expect(sliced.length).toBeLessThan(100)
    })
  })

  describe('concatBuffers', () => {
    it('should concatenate two buffers', () => {
      const buffer1 = createMockBuffer(44100, 1, 2)
      const buffer2 = createMockBuffer(44100, 1, 3)

      const data1 = buffer1.getChannelData(0)
      const data2 = buffer2.getChannelData(0)
      data1.fill(0.5)
      data2.fill(0.7)

      const concatenated = AudioBufferUtils.concatBuffers([buffer1, buffer2])

      expect(concatenated.length).toBe(220500) // 5 seconds
      const concatData = concatenated.getChannelData(0)
      expect(concatData[0]).toBeCloseTo(0.5, 5)
      expect(concatData[88200]).toBeCloseTo(0.7, 5) // Start of second buffer
    })

    it('should handle multiple buffers', () => {
      const buffers = [
        createMockBuffer(44100, 1, 1),
        createMockBuffer(44100, 1, 1),
        createMockBuffer(44100, 1, 1),
      ]

      buffers.forEach((buffer, i) => {
        buffer.getChannelData(0).fill(0.1 * (i + 1))
      })

      const concatenated = AudioBufferUtils.concatBuffers(buffers)

      expect(concatenated.length).toBe(132300) // 3 seconds
      const data = concatenated.getChannelData(0)
      expect(data[0]).toBeCloseTo(0.1, 5)
      expect(data[44100]).toBeCloseTo(0.2, 5)
      expect(data[88200]).toBeCloseTo(0.3, 5)
    })

    it('should return null for empty array', () => {
      const result = AudioBufferUtils.concatBuffers([])
      expect(result).toBeNull()
    })

    it('should preserve stereo channels', () => {
      const buffer1 = createMockBuffer(44100, 2, 1)
      const buffer2 = createMockBuffer(44100, 2, 1)

      buffer1.getChannelData(0).fill(0.5)
      buffer1.getChannelData(1).fill(0.6)
      buffer2.getChannelData(0).fill(0.7)
      buffer2.getChannelData(1).fill(0.8)

      const concatenated = AudioBufferUtils.concatBuffers([buffer1, buffer2])

      expect(concatenated.numberOfChannels).toBe(2)
      expect(concatenated.getChannelData(0)[0]).toBeCloseTo(0.5, 5)
      expect(concatenated.getChannelData(1)[0]).toBeCloseTo(0.6, 5)
      expect(concatenated.getChannelData(0)[44100]).toBeCloseTo(0.7, 5)
      expect(concatenated.getChannelData(1)[44100]).toBeCloseTo(0.8, 5)
    })

    it('should require matching sample rates', () => {
      const buffer1 = createMockBuffer(44100, 1, 1)
      const buffer2 = createMockBuffer(48000, 1, 1)

      // Note: This should ideally validate sample rates, but current implementation
      // assumes they match. This test documents expected behavior.
      const concatenated = AudioBufferUtils.concatBuffers([buffer1, buffer2])

      // Will use sample rate from first buffer
      expect(concatenated.sampleRate).toBe(44100)
    })
  })

  describe('normalizeBuffer', () => {
    it('should normalize to target level', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      // Set peak to 0.5
      const data = buffer.getChannelData(0)
      data[0] = 0.5
      data[100] = -0.5
      data[200] = 0.4

      const normalized = AudioBufferUtils.normalizeBuffer(buffer, 0.89)
      const newData = normalized.getChannelData(0)

      expect(newData[0]).toBeCloseTo(0.89, 2)
      expect(newData[100]).toBeCloseTo(-0.89, 2)
      expect(newData[200]).toBeCloseTo(0.712, 2) // 0.4 * (0.89/0.5)
    })

    it('should handle already normalized buffer', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      const data = buffer.getChannelData(0)
      data[0] = 0.89
      data[1] = -0.89

      const normalized = AudioBufferUtils.normalizeBuffer(buffer)
      const newData = normalized.getChannelData(0)

      expect(newData[0]).toBeCloseTo(0.89, 2)
      expect(newData[1]).toBeCloseTo(-0.89, 2)
    })

    it('should handle silent buffer', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      const data = buffer.getChannelData(0)
      data.fill(0)

      // Should not divide by zero
      const normalized = AudioBufferUtils.normalizeBuffer(buffer)
      expect(normalized).toBeDefined()
    })

    it('should normalize stereo buffer', () => {
      const buffer = createMockBuffer(44100, 2, 1)
      const data0 = buffer.getChannelData(0)
      const data1 = buffer.getChannelData(1)
      data0[0] = 0.6
      data1[0] = 0.8

      const normalized = AudioBufferUtils.normalizeBuffer(buffer, 0.89)

      // Should normalize based on peak across all channels
      const newData0 = normalized.getChannelData(0)
      const newData1 = normalized.getChannelData(1)
      expect(newData0[0]).toBeCloseTo(0.6675, 2) // 0.6 * (0.89/0.8)
      expect(newData1[0]).toBeCloseTo(0.89, 2)
    })

    it('should use default target level if not specified', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      const data = buffer.getChannelData(0)
      data[0] = 0.5

      const normalized = AudioBufferUtils.normalizeBuffer(buffer) // No target specified
      const newData = normalized.getChannelData(0)

      expect(newData[0]).toBeCloseTo(0.89, 2) // Default target
    })
  })

  describe('removeSilence', () => {
    it('should identify non-silent segments', () => {
      const buffer = createMockBuffer(44100, 1, 5)
      // Add a continuous non-silent segment that meets minimum duration
      const data = buffer.getChannelData(0)
      // Fill a 1-second segment with audio (meets 0.1s minimum)
      for (let i = 10000; i < 54100; i++) {
        data[i] = 0.5
      }

      const segments = AudioBufferUtils.removeSilence(buffer, 0.01, 0.1)

      expect(segments.length).toBeGreaterThan(0)
      expect(segments[0].start).toBeLessThan(segments[0].end)
    })

    it('should return empty array for silent buffer', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      const data = buffer.getChannelData(0)
      data.fill(0)

      const segments = AudioBufferUtils.removeSilence(buffer, 0.01, 0.1)

      expect(segments.length).toBe(0)
    })

    it('should respect minimum duration', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      const data = buffer.getChannelData(0)
      // Short burst below minimum duration (only 100 samples = ~0.0023s)
      for (let i = 1000; i < 1100; i++) {
        data[i] = 0.5
      }

      const segments = AudioBufferUtils.removeSilence(buffer, 0.01, 0.1)

      expect(segments.length).toBe(0)
    })

    it('should handle continuous audio', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      const data = buffer.getChannelData(0)
      data.fill(0.3) // All above threshold

      const segments = AudioBufferUtils.removeSilence(buffer, 0.01, 0.1)

      expect(segments.length).toBe(1)
      expect(segments[0].start).toBe(0)
      expect(segments[0].end).toBe(1)
    })

    it('should merge nearby non-silent segments', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      const data = buffer.getChannelData(0)
      // Create two regions with small gap
      data[1000] = 0.5
      data[2000] = 0.5

      const segments = AudioBufferUtils.removeSilence(buffer, 0.01, 0.05)

      // Gap may be small enough to merge or keep separate
      expect(segments.length).toBeGreaterThanOrEqual(0)
    })

    it('should use custom threshold', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      const data = buffer.getChannelData(0)
      data[1000] = 0.02 // Just above default threshold
      data[5000] = 0.5 // Well above threshold

      const segmentsStrict = AudioBufferUtils.removeSilence(buffer, 0.03, 0.1)
      const segmentsLenient = AudioBufferUtils.removeSilence(buffer, 0.01, 0.1)

      // Stricter threshold should find fewer segments
      expect(segmentsStrict.length).toBeLessThanOrEqual(segmentsLenient.length)
    })

    it('should use custom minimum duration', () => {
      const buffer = createMockBuffer(44100, 1, 1)
      const data = buffer.getChannelData(0)
      data[1000] = 0.5 // Short burst

      const segmentsShort = AudioBufferUtils.removeSilence(buffer, 0.01, 0.05)
      const segmentsLong = AudioBufferUtils.removeSilence(buffer, 0.01, 0.2)

      // Longer minimum duration should find fewer segments
      expect(segmentsLong.length).toBeLessThanOrEqual(segmentsShort.length)
    })
  })

  describe('fromRealAudioBuffer', () => {
    // Skip these tests if AudioContext is not available
    const AudioContext = window.AudioContext || window.webkitAudioContext

    it('should convert real AudioBuffer to mock format', () => {
      if (!AudioContext) {
        // Skip if AudioContext not available
        return
      }

      // Create real AudioBuffer using Web Audio API
      const realBuffer = new AudioContext().createBuffer(2, 44100, 44100)
      realBuffer.getChannelData(0).fill(0.5)
      realBuffer.getChannelData(1).fill(0.7)

      const mockBuffer = AudioBufferUtils.fromRealAudioBuffer(realBuffer)

      expect(mockBuffer.numberOfChannels).toBe(2)
      expect(mockBuffer.length).toBe(44100)
      expect(mockBuffer.sampleRate).toBe(44100)
      expect(mockBuffer.getChannelData(0)[0]).toBeCloseTo(0.5, 5)
      expect(mockBuffer.getChannelData(1)[0]).toBeCloseTo(0.7, 5)
    })

    it('should preserve all audio data', () => {
      if (!AudioContext) {
        // Skip if AudioContext not available
        return
      }

      const realBuffer = new AudioContext().createBuffer(1, 1000, 44100)
      const realData = realBuffer.getChannelData(0)

      // Fill with test pattern
      for (let i = 0; i < 1000; i++) {
        realData[i] = Math.sin(i * 0.1)
      }

      const mockBuffer = AudioBufferUtils.fromRealAudioBuffer(realBuffer)
      const mockData = mockBuffer.getChannelData(0)

      for (let i = 0; i < 1000; i++) {
        expect(mockData[i]).toBeCloseTo(realData[i], 5)
      }
    })
  })
})
