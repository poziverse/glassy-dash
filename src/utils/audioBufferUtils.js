/**
 * AudioBufferUtils - Utility functions for audio buffer manipulation
 * Provides methods for slicing, concatenating, normalizing, and processing audio buffers
 */

/**
 * Create a new audio buffer with specified parameters
 * @param {number} sampleRate - Sample rate in Hz
 * @param {number} channels - Number of audio channels
 * @param {number} duration - Duration in seconds
 * @returns {AudioBuffer} Mock audio buffer object
 */
export class AudioBufferUtils {
  static createBuffer(sampleRate, channels, duration) {
    const length = Math.ceil(sampleRate * duration)
    return {
      numberOfChannels: channels,
      length,
      sampleRate,
      channelData: Array(channels)
        .fill(null)
        .map(() => new Float32Array(length).fill(0)),
      getChannelData(channel) {
        return this.channelData[channel]
      }
    }
  }

  /**
   * Slice audio buffer from start time to end time
   @param {AudioBuffer} buffer - Source audio buffer
   @param {number} startTime - Start time in seconds
   @param {number} endTime - End time in seconds
   @returns {AudioBuffer} New audio buffer with sliced data
   */
  static sliceBuffer(buffer, startTime, endTime) {
    const startSample = Math.floor(startTime * buffer.sampleRate)
    const endSample = Math.floor(endTime * buffer.sampleRate)
    const length = endSample - startSample

    const newBuffer = {
      numberOfChannels: buffer.numberOfChannels,
      length,
      sampleRate: buffer.sampleRate,
      channelData: []
    }

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const oldData = buffer.getChannelData(channel)
      const newData = new Float32Array(length)
      newBuffer.channelData[channel] = newData

      for (let i = 0; i < length; i++) {
        newData[i] = oldData[startSample + i]
      }
    }

    newBuffer.getChannelData = (channel) => newBuffer.channelData[channel]
    return newBuffer
  }

  /**
   * Concatenate multiple audio buffers
   * @param {AudioBuffer[]} buffers - Array of audio buffers to concatenate
   * @returns {AudioBuffer|null} Concatenated buffer or null if empty
   */
  static concatBuffers(buffers) {
    if (buffers.length === 0) return null

    const totalLength = buffers.reduce((sum, b) => sum + b.length, 0)
    const channels = buffers[0].numberOfChannels
    const sampleRate = buffers[0].sampleRate

    const newBuffer = {
      numberOfChannels: channels,
      length: totalLength,
      sampleRate,
      channelData: []
    }

    for (let channel = 0; channel < channels; channel++) {
      const newData = new Float32Array(totalLength)
      newBuffer.channelData[channel] = newData

      let offset = 0
      for (const buffer of buffers) {
        const oldData = buffer.getChannelData(channel)
        newData.set(oldData, offset)
        offset += buffer.length
      }
    }

    newBuffer.getChannelData = (channel) => newBuffer.channelData[channel]
    return newBuffer
  }

  /**
   * Normalize audio buffer to target level
   * @param {AudioBuffer} buffer - Audio buffer to normalize
   * @param {number} targetLevel - Target peak level (default: 0.89 = -1dBFS)
   * @returns {AudioBuffer} Normalized buffer (modified in place)
   */
  static normalizeBuffer(buffer, targetLevel = 0.89) {
    let peak = 0

    // Find peak amplitude
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < data.length; i++) {
        peak = Math.max(peak, Math.abs(data[i]))
      }
    }

    // Calculate normalization factor
    const factor = targetLevel / peak

    // Apply normalization
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < data.length; i++) {
        data[i] *= factor
      }
    }

    return buffer
  }

  /**
   * Remove silent portions from buffer
   * @param {AudioBuffer} buffer - Audio buffer to analyze
   * @param {number} threshold - Amplitude threshold for silence (default: 0.01)
   * @param {number} minDuration - Minimum duration for non-silent segments in seconds (default: 0.1)
   * @returns {Array<{start: number, end: number}>} Array of non-silent segments
   */
  static removeSilence(buffer, threshold = 0.01, minDuration = 0.1) {
    const data = buffer.getChannelData(0)
    const sampleRate = buffer.sampleRate
    const minSamples = minDuration * sampleRate

    const segments = []
    let inSilence = true
    let segmentStart = 0

    for (let i = 0; i < data.length; i++) {
      const amplitude = Math.abs(data[i])
      const isSilent = amplitude < threshold

      if (inSilence && !isSilent) {
        // Start of non-silent segment
        segmentStart = i
        inSilence = false
      } else if (!inSilence && isSilent) {
        // End of non-silent segment
        const segmentLength = i - segmentStart
        if (segmentLength >= minSamples) {
          segments.push({
            start: segmentStart / sampleRate,
            end: i / sampleRate
          })
        }
        inSilence = true
      }
    }

    // Handle last segment if not ended with silence
    if (!inSilence) {
      const segmentLength = data.length - segmentStart
      if (segmentLength >= minSamples) {
        segments.push({
          start: segmentStart / sampleRate,
          end: data.length / sampleRate
        })
      }
    }

    return segments
  }

  /**
   * Convert real AudioBuffer to mock format
   * Used when working with Web Audio API buffers
   * @param {AudioBuffer} buffer - Real Web Audio API AudioBuffer
   * @returns {AudioBuffer} Mock audio buffer object
   */
  static fromRealAudioBuffer(buffer) {
    const mockBuffer = {
      numberOfChannels: buffer.numberOfChannels,
      length: buffer.length,
      sampleRate: buffer.sampleRate,
      channelData: []
    }

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)
      mockBuffer.channelData[channel] = new Float32Array(data)
      mockBuffer.getChannelData = (ch) => mockBuffer.channelData[ch]
    }

    return mockBuffer
  }
}