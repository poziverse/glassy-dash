/**
 * Z.ai Provider Adapter
 * Implements Z.ai API with model version detection (4.5 Air, 4.6, 4.7)
 * Focus on high-quality image generation with configurable endpoints
 */

const { BaseAIProvider } = require('./base')

/**
 * Z.ai Model Configuration
 * Models in order of preference (newer = better quality)
 */
const MODEL_VERSIONS = {
  // 4.7 - January 2026 Latest - Best quality, fastest inference
  '4.7': {
    name: '4.7',
    displayName: 'Z.ai 4.7',
    capabilities: {
      TEXT: true,
      AUDIO: true,
      IMAGES: true,
      STREAMING: true,
      MULTIMODAL: true,
      CODE_EXECUTION: true
    },
    baseUrl: 'https://api.z.ai',
    model: 'zai-4.7',
    contextWindow: 200000,
    maxTokens: 8192,
    supportsImageGen: true,
    supportsStreaming: true
  },
  // 4.6 - Latest stable - Excellent quality
  '4.6': {
    name: '4.6',
    displayName: 'Z.ai 4.6',
    capabilities: {
      TEXT: true,
      AUDIO: true,
      IMAGES: true,
      STREAMING: true,
      MULTIMODAL: true,
      CODE_EXECUTION: false
    },
    baseUrl: 'https://api.z.ai',
    model: 'zai-4.6',
    contextWindow: 200000,
    maxTokens: 8192,
    supportsImageGen: true,
    supportsStreaming: true
  },
  // 4.5 Air - High quality, good balance
  '4.5-air': {
    name: '4.5-air',
    displayName: 'Z.ai 4.5 Air',
    capabilities: {
      TEXT: true,
      AUDIO: true,
      IMAGES: true,
      STREAMING: true,
      MULTIMODAL: true,
      CODE_EXECUTION: false
    },
    baseUrl: 'https://api.z.ai',
    model: 'zai-4.5-air',
    contextWindow: 200000,
    maxTokens: 8192,
    supportsImageGen: true,
    supportsStreaming: true
  }
}

/**
 * Z.ai API Endpoints
 */
const ENDPOINTS = {
  TEXT: '/text',
  IMAGE: '/image',
  AUDIO: '/audio',
  STREAM: '/stream',
  EMBEDDINGS: '/embeddings'
}

class ZaiProvider extends BaseAIProvider {
  constructor(config) {
    super({
      ...config,
      name: 'zai',
      timeout: config.timeout || 30000,
      rateLimit: config.rateLimit || 100,
      capabilities: {
        TEXT: true,
        AUDIO: false, // Currently using Pollinations for audio
        IMAGES: true,
        STREAMING: true,
        STRUCTURED_OUTPUT: true,
        SYSTEM_INSTRUCTIONS: true,
        TOOLS: false,
        MULTIMODAL: false,
        EMBEDDINGS: false
      }
    })
    
    // User-provided base URL (default to Z.ai official)
    this.baseUrl = config.baseUrl || MODEL_VERSIONS['4.5-air'].baseUrl
    
    // Model selection (default to 4.5 Air for balance)
    this.modelName = config.model || '4.5-air'
    this.modelConfig = MODEL_VERSIONS[this.modelName] || MODEL_VERSIONS['4.5-air']
    
    console.log(`[Z.ai Provider] Initialized with ${this.modelConfig.displayName}, base URL: ${this.baseUrl}`)
  }

  /**
   * Check if provider is available
   * @returns {boolean} - True if Z.ai is configured
   */
  isAvailable() {
    return !!this.apiKey && !!this.baseUrl
  }

  /**
   * Build system prompt for Z.ai
   * @returns {string} - The system prompt
   */
  buildSystemPrompt() {
    return `You are Z.ai, a high-performance AI assistant.
Your capabilities:
- High-quality text generation
- Exceptional image generation (your specialty)
- Streaming responses
- Multimodal understanding (text and images)

Response Guidelines:
- Be concise and direct
- Use appropriate format for the task
- For text: Provide well-structured, informative responses
- For images: Generate visually appealing, relevant images
- Start responses immediately with value, no conversational filler
- Use Markdown for formatting when appropriate

Quality Standards:
- Ensure accuracy over creativity
- For factual queries, prioritize correctness
- For creative tasks, prioritize engagement and appeal
- Maintain consistent tone and style

Special Instructions:
- For image generation requests, always include visual description of what was generated
- If asked for something outside your capabilities, be transparent about limitations`
  }

  /**
   * Detect model version from response
   * @param {Object} response - The API response
   * @returns {string} - The detected model version
   */
  detectModelVersion(response) {
    // Check response headers or metadata for model version info
    const headers = response.headers || {}
    const modelVersion = headers['x-model-version'] || '4.5-air'
    
    // Validate it's a known version
    if (MODEL_VERSIONS[modelVersion]) {
      console.log(`[Z.ai Provider] Detected model version: ${MODEL_VERSIONS[modelVersion].displayName}`)
      return modelVersion
    }
    
    console.warn(`[Z.ai Provider] Unknown model version: ${modelVersion}, using default 4.5-air`)
    return '4.5-air'
  }

  /**
   * Generate content (text, audio, images)
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generateContent(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Z.ai Provider not configured or not available')
    }

    const { temperature = 0.7, maxTokens = 2048, includeSources = false } = options
    
    try {
      // Determine if this is an image generation task
      const isImageRequest = prompt.toLowerCase().startsWith('generate image') ||
                          prompt.toLowerCase().startsWith('create image') ||
                          prompt.toLowerCase().startsWith('make a picture') ||
                          options.forceImageGen === true
      
      if (isImageRequest && this.modelConfig.supportsImageGen) {
        return await this.generateImage(prompt, options)
      }
      
      // Build request
      const requestBody = {
        model: this.modelConfig.model,
        prompt: prompt,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false
      }
      
      const url = `${this.baseUrl}${ENDPOINTS.TEXT}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Z.ai API error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      const detectedModel = this.detectModelVersion(response)
      
      return {
        content: data.text || data.content || '',
        model: detectedModel,
        provider: 'zai',
        finishReason: data.finish_reason || 'stop',
        usage: {
          totalTokens: data.usage?.total_tokens || 0,
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0
        }
      }
    } catch (error) {
      console.error('[Z.ai Provider] generateContent error:', error)
      throw error
    }
  }

  /**
   * Generate image with Z.ai
   * @param {string} prompt - The image prompt
   * @param {Object} options - Image generation options
   * @returns {Promise<Object>} - Image generation result
   */
  async generateImage(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Z.ai Provider not configured or not available')
    }

    const { 
      width = 1024, 
      height = 768, 
      seed, 
      steps = 20,
      negativePrompt,
      style
    } = options
    
    try {
      const requestBody = {
        model: this.modelConfig.model,
        prompt: `A professional, visually appealing image. ${prompt}`,
        width: width,
        height: height,
        num_images: 1,
        seed: seed || Math.floor(Math.random() * 1000000),
        steps: steps,
        negative_prompt: negativePrompt,
        style: style || 'vivid'
      }
      
      const url = `${this.baseUrl}${ENDPOINTS.IMAGE}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Z.ai Image API error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      
      // Z.ai returns image as URL (we can use this directly)
      return {
        imageUrl: data.image || data.images?.[0]?.url || '',
        provider: 'zai',
        model: this.modelConfig.model,
        width,
        height,
        seed
      }
    } catch (error) {
      console.error('[Z.ai Provider] generateImage error:', error)
      throw error
    }
  }

  /**
   * Generate streaming content
   * @param {string} prompt - The input prompt
   * @param {Function} onChunk - Callback for each chunk
   * @param {Function} onComplete - Callback when complete
   * @param {Object} options - Generation options
   * @returns {AsyncGenerator} - Streaming result generator
   */
  async *generateContentStream(prompt, onChunk, onComplete, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Z.ai Provider not configured or not available')
    }

    if (!this.capabilities.STREAMING) {
      throw new Error('Streaming not supported by this provider configuration')
    }

    const { temperature = 0.7, maxTokens = 4096 } = options
    
    try {
      const requestBody = {
        model: this.modelConfig.model,
        prompt: prompt,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: true
      }
      
      const url = `${this.baseUrl}${ENDPOINTS.STREAM}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        onComplete({ error: errorText, isComplete: true })
        return
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            break
          }
          
          if (value) {
            const chunk = decoder.decode(value)
            fullResponse += chunk
            
            try {
              // Try to parse as JSON (may be partial)
              const parsed = JSON.parse(chunk)
              
              if (parsed.choices && parsed.choices[0]) {
                const { delta, finish_reason: finishReason } = parsed.choices[0]
                
                if (delta && delta.content) {
                  const content = delta.content
                  
                  onChunk({
                    content,
                    isComplete: false
                  })
                }
                
                if (finish_reason === 'stop' || finish_reason === 'length' || finish_reason === 'content_filter') {
                  const finalResult = JSON.parse(fullResponse)
                  
                  onComplete({
                    content: finalResult.choices?.[0]?.message?.content || finalResult.choices?.[0]?.text || '',
                    isComplete: true,
                    finishReason: finish_reason,
                    usage: finalResult.usage
                  })
                  return
                }
              }
            } catch (e) {
              // Not valid JSON yet, that's okay - continue accumulating
              // Just send raw text for display
              onChunk({
                content: chunk,
                isComplete: false,
                isRaw: true
              })
            }
          }
        }
      } catch (error) {
        console.error('[Z.ai Provider] generateContentStream error:', error)
        onComplete({ error: error.message, isComplete: true })
        return
      }
      
      // Try to get final result if we have accumulated data
      try {
        const finalResult = JSON.parse(fullResponse)
        
        if (finalResult.choices && finalResult.choices[0]) {
          const { text, message } = finalResult.choices[0]
          
          onComplete({
            content: text || message?.content || '',
            isComplete: true,
            usage: finalResult.usage
          })
        }
      } catch (e) {
        console.warn('[Z.ai Provider] Could not parse final streaming response:', e)
        onComplete({
          content: fullResponse,
          isComplete: true
        })
      }
    } catch (error) {
      console.error('[Z.ai Provider] generateContentStream fetch error:', error)
      onComplete({ error: error.message, isComplete: true })
      return
    }
  }

  /**
   * Generate embeddings
   * @param {string} content - The content to embed
   * @param {Object} options - Embedding options
   * @returns {Promise<Object>} - Embedding result
   */
  async generateEmbeddings(content, options = {}) {
    // Z.ai does not currently support embeddings via public API
    // This is a placeholder for future implementation
    throw new Error('Embeddings not supported by Z.ai provider')
  }

  /**
   * Count tokens
   * @param {string} content - The content to count tokens for
   * @returns {Promise<number>} - Token count
   */
  async countTokens(content, options = {}) {
    // Z.ai does not currently provide token counting via public API
    // Estimate based on character count
    const estimatedTokens = Math.ceil(content.length / 4)
    return estimatedTokens
  }

  /**
   * Transcribe audio
   * Z.ai currently doesn't support audio transcription via public API
   * @param {Buffer|Object} audioData - The audio data to transcribe
   * @param {Object} options - Transcription options
   * @returns {Promise<Object>} - Transcription result
   */
  async transcribeAudio(audioData, options = {}) {
    // Z.ai does not currently support audio transcription via public API
    throw new Error('Audio transcription not supported by Z.ai provider')
  }

  /**
   * Health check
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    try {
      const startTime = Date.now()
      
      // Simple ping to text generation endpoint
      const result = await this.generateContent('ping', {
        maxTokens: 10
      })
      
      const latency = Date.now() - startTime
      
      return {
        status: 'healthy',
        latency,
        model: this.modelConfig.model,
        provider: 'zai',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        latency: Date.now() - startTime,
        provider: 'zai',
        timestamp: new Date().toISOString()
      }
    }
  }
}

module.exports = { ZaiProvider, MODEL_VERSIONS, ENDPOINTS }