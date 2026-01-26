/**
 * audioBufferToWav - Convert AudioBuffer to WAV format
 * Implements WAV file format specification for PCM audio
 * 
 * WAV Format:
 * - RIFF header: "RIFF" + file size + "WAVE"
 * - fmt chunk: format info (sample rate, channels, bit depth)
 * - data chunk: actual audio data
 */

/**
 * Convert AudioBuffer to WAV Blob
 * @param {AudioBuffer} buffer - Audio buffer to convert
 * @returns {Blob} WAV file blob
 */
export function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM format
  const bitDepth = 16 // 16-bit audio

  // Interleave audio data from all channels
  const data = []
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      // Convert float32 (-1.0 to 1.0) to int16 (-32768 to 32767)
      const sample = buffer.getChannelData(channel)[i]
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
      data.push(intSample)
    }
  }

  // Calculate sizes
  const bufferLength = data.length * 2 // 2 bytes per sample (16-bit)
  const headerLength = 44
  const totalLength = headerLength + bufferLength

  // Create ArrayBuffer for WAV file
  const arrayBuffer = new ArrayBuffer(totalLength)
  const view = new DataView(arrayBuffer)

  // ==================== RIFF HEADER ====================
  // Chunk ID "RIFF"
  writeString(view, 0, 'RIFF')
  
  // Chunk size (file size - 8)
  view.setUint32(4, totalLength - 8, true)
  
  // Format "WAVE"
  writeString(view, 8, 'WAVE')

  // ==================== fmt CHUNK ====================
  // Chunk ID "fmt "
  writeString(view, 12, 'fmt ')
  
  // Chunk size (16 for PCM)
  view.setUint32(16, 16, true)
  
  // Audio format (1 = PCM)
  view.setUint16(20, format, true)
  
  // Number of channels
  view.setUint16(22, numChannels, true)
  
  // Sample rate
  view.setUint32(24, sampleRate, true)
  
  // Byte rate (sampleRate * channels * bitsPerSample / 8)
  view.setUint32(28, sampleRate * numChannels * 2, true)
  
  // Block align (channels * bitsPerSample / 8)
  view.setUint16(32, numChannels * 2, true)
  
  // Bits per sample
  view.setUint16(34, bitDepth, true)

  // ==================== data CHUNK ====================
  // Chunk ID "data"
  writeString(view, 36, 'data')
  
  // Chunk size (data size in bytes)
  view.setUint32(40, bufferLength, true)

  // Write audio data
  let offset = 44
  for (let i = 0; i < data.length; i++) {
    view.setInt16(offset, data[i], true)
    offset += 2
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

/**
 * Write string to DataView
 * @param {DataView} view - DataView to write to
 * @param {number} offset - Byte offset
 * @param {string} string - String to write
 */
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

/**
 * Convert AudioBuffer to WAV and download
 * @param {AudioBuffer} buffer - Audio buffer to convert
 * @param {string} filename - Download filename
 */
export function downloadAudioBufferAsWav(buffer, filename = 'audio.wav') {
  const wavBlob = audioBufferToWav(buffer)
  const url = URL.createObjectURL(wavBlob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 100)
}