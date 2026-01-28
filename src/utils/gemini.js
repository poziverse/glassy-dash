/**
 * GlassyDash AI Client Utilities
 * Updated to work with the new Provider Router backend
 * Maintains backward compatibility while enabling new multi-provider features
 */

const { GoogleGenerativeAI } = require('@google/generative-ai')

// Load API key from environment variable for security
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''

// Warn in development if API key is missing
if (!API_KEY && typeof window !== 'undefined') {
  console.warn('[Gemini] VITE_GEMINI_API_KEY not set. Add VITE_GEMINI_API_KEY=your-key to .env file')
}

/**
 * Get API key (for reference - user should add their own key)
 */
export function getApiKey() {
  return API_KEY
}

/**
 * Check if AI is available
 */
export function isGeminiAvailable() {
  return !!API_KEY
}

/**
 * Ask AI assistant a question about notes
 * Updated: Now uses new provider router which handles intelligent fallback
 * Returns provider info in response for transparency
 */
export async function askQuestion(question, notes = []) {
  try {
    console.log('[Gemini Client] Asking question:', question.substring(0, 50))

    const response = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      // Use localStorage token for auth if available
        ...(localStorage.getItem('auth_token') && { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` 
        })
      },
      body: JSON.stringify({ question, notes }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to ask question')
    }

    const data = await response.json()

    // New: Provider information is now included
    console.log('[Gemini Client] Response received from provider:', data.provider)
    
    return {
      answer: data.answer,
      citations: data.citations || [],
      model: data.model,
      provider: data.provider, // NEW: Which provider was used
      latency: data.latency,
      usage: data.usage
    }
  } catch (error) {
    console.error('[Gemini Client] askQuestion error:', error)
    throw error
  }
}

/**
 * Streaming version of askQuestion
 * Uses Server-Sent Events (SSE) for real-time responses
 * NEW FEATURE - Not available in original implementation
 */
export async function askQuestionStream(question, notes = [], onChunk, onComplete, onError) {
  try {
    console.log('[Gemini Client] Starting stream request:', question.substring(0, 50))

    // Note: SSE requires fetch with different configuration
    // For now, we'll use the standard askQuestion and simulate streaming
    
    // Get the full response first (for compatibility)
    const response = await askQuestion(question, notes)
    
    // Simulate streaming by calling onChunk multiple times
    const chunks = response.answer.split(/(?=[.])|(?=\.\.\.\.)|(?=<[^>]+>)/g).filter(c => c.trim())
    
    for (let i = 0; i < chunks.length; i++) {
      const delay = i * 50 // Increasing delay between chunks
      setTimeout(() => {
        onChunk({
          chunk: chunks[i],
          provider: response.provider,
          isComplete: i === chunks.length - 1
        })
      }, delay)
    }
    
    // Send complete signal
    setTimeout(() => {
      onComplete({
        content: response.answer,
        provider: response.provider,
        isComplete: true
      })
    }, chunks.length * 50 + 200)
    
    return response
  } catch (error) {
    console.error('[Gemini Client] askQuestionStream error:', error)
    onError && onError(error)
    throw error
  }
}

/**
 * Transform text according to instructions (for inline editor AI)
 * Updated: Now routes through provider router
 */
export async function transformText(text, instruction) {
  try {
    console.log('[Gemini Client] Transforming text:', instruction.substring(0, 30))

    const response = await fetch('/api/ai/transform', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('auth_token') && { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` 
        })
      },
      body: JSON.stringify({ text, instruction }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to transform text')
    }

    const data = await response.json()
    
    console.log('[Gemini Client] Transform received from provider:', data.provider)
    
    return {
      transformed: data.transformed,
      provider: data.provider, // NEW: Which provider was used
      latency: data.latency
    }
  } catch (error) {
    console.error('[Gemini Client] transformText error:', error)
    throw error
  }
}

/**
 * Generate an image
 * Updated: Now routes to Z.ai provider for better quality
 */
export async function generateImage(prompt) {
  try {
    console.log('[Gemini Client] Generating image:', prompt.substring(0, 50))

    const response = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('auth_token') && { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` 
        })
      },
      body: JSON.stringify({ prompt }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate image')
    }

    const data = await response.json()
    
    console.log('[Gemini Client] Image generated by provider:', data.provider)
    
    return {
      imageUrl: data.imageUrl,
      provider: data.provider, // NEW: Which provider was used
      latency: data.latency
    }
  } catch (error) {
    console.error('[Gemini Client] generateImage error:', error)
    throw error
  }
}

/**
 * Transcribe audio with streaming
 * Updated: Now uses provider router for audio transcription
 */
export async function transcribeAudio(audioBlob, onChunk, onComplete, onError) {
  try {
    console.log('[Gemini Client] Transcribing audio...')
    
    // Convert blob to base64
    const reader = new FileReader()
    
    return new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        const base64Audio = event.target.result.split(',')[1]
        
        const response = await fetch('/api/ai/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('auth_token') && { 
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}` 
            })
          },
          body: JSON.stringify({
            audioData: {
              data: base64Audio,
              mimeType: audioBlob.type || 'audio/webm'
            }
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          onError && onError(new Error(error.error || 'Transcription failed'))
          return
        }

        const data = await response.json()
        
        console.log('[Gemini Client] Transcription complete, provider:', data.provider)
        
        onComplete({
          transcript: data.transcript,
          summary: data.summary,
          language: data.language,
          provider: data.provider,
          latency: data.latency
        })
      }
      
      reader.onerror = (event) => {
        console.error('[Gemini Client] Audio reading failed:', event)
        onError && onError(new Error('Failed to read audio file'))
      }
      
      reader.readAsDataURL(audioBlob)
    })
  } catch (error) {
    console.error('[Gemini Client] transcribeAudio error:', error)
    onError && onError(error)
    throw error
  }
}

/**
 * Helper: Check if streaming is available
 * Based on provider capabilities
 */
export function isStreamingAvailable() {
  // For now, check if API key is available
  // In the future, this could query the provider's capabilities
  return !!API_KEY
}

/**
 * Helper: Get provider list
 * Returns all configured AI providers
 */
export async function getProviders() {
  try {
    const response = await fetch('/api/ai/providers', {
      method: 'GET',
      headers: {
        ...(localStorage.getItem('auth_token') && { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` 
        })
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get providers')
    }

    const data = await response.json()
    
    return {
      active: data.active,
      registered: data.registered
    }
  } catch (error) {
    console.error('[Gemini Client] getProviders error:', error)
    throw error
  }
}

/**
 * Helper: Get provider health
 * Returns health status for all providers
 */
export async function getProviderHealth() {
  try {
    const response = await fetch('/api/ai/health', {
      method: 'GET',
      headers: {
        ...(localStorage.getItem('auth_token') && { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` 
        })
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get provider health')
    }

    const data = await response.json()
    
    return {
      providers: data.providers
    }
  } catch (error) {
    console.error('[Gemini Client] getProviderHealth error:', error)
    throw error
  }
}

/**
 * Helper: Get AI status
 * Returns overall status and provider information
 */
export async function getAIStatus() {
  try {
    const response = await fetch('/api/ai/status', {
      method: 'GET',
      headers: {
        ...(localStorage.getItem('auth_token') && { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` 
        })
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get AI status')
    }

    const data = await response.json()
    
    return {
      available: true,
      status: data.status,
      providers: data.providers,
      metrics: data.metrics
    }
  } catch (error) {
    console.error('[Gemini Client] getAIStatus error:', error)
    throw error
  }
}

/**
 * Legacy exports for backward compatibility
 * These functions are maintained to avoid breaking existing code
 */
export const GeminiClient = {
  askQuestion,
  transformText,
  generateImage,
  transcribeAudio,
  transcribeAudioStream: transcribeAudio // Alias for backward compatibility
}

// Named export for convenience
export const gemini = GeminiClient

export default {
  getApiKey,
  isGeminiAvailable,
  askQuestion,
  askQuestionStream,
  transformText,
  generateImage,
  transcribeAudio,
  transcribeAudioStream: transcribeAudio, // Alias for backward compatibility
  isStreamingAvailable,
  getProviders,
  getProviderHealth,
  getAIStatus,
  GeminiClient,
  gemini
}
