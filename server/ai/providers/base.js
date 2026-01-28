/**
 * Base provider interface for all AI providers
 * Defines the contract that all providers must implement
 */

/**
 * Provider capabilities enum
 * Bit flags for provider capabilities
 */
const ProviderCapabilities = {
  TEXT: 1 << 1,
  AUDIO: 1 << 1,
  IMAGES: 1 << 1,
  STREAMING: 1 << 1,
  STRUCTURED_OUTPUT: 1 << 1, // JSON mode support
  SYSTEM_INSTRUCTIONS: 1 << 1, // System instruction field
  TOOLS: 1 << 1, // Function calling
  EMBEDDINGS: 1 << 1,
  FUNCTION_CALLING: 1 << 1,
  MULTIMODAL: 1 << 1, // Images, audio, video, documents
  CODE_EXECUTION: 1 << 1 // Code interpreter/analysis
}

/**
 * Custom error for provider failures
 * Extends Error to provide provider-specific information
 */
class ProviderError extends Error {
  /**
   * @param {string} name - The name of the provider
   * @param {string} message - The error message
   * @param {number} statusCode - HTTP status code if applicable
   */
  constructor(name, message, statusCode = 500) {
    super(`${name} Provider Error: ${message}`)
    this.name = name
    this.statusCode = statusCode
    this.providerName = name
    this.timestamp = new Date().toISOString()
  }
}

/**
 * Base AI Provider class
 * All provider adapters must extend this class
 */
class BaseAIProvider {
  /**
   * Constructor
   * @param {Object} config - Provider configuration object
   */
  constructor(config) {
    this.name = config.name
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.timeout = config.timeout || 30000
    this.rateLimit = config.rateLimit || 100 // requests per minute
    this.isActive = true
    
    // Default capabilities - subclasses should override
    this.capabilities = config.capabilities || {
      text: false,
      audio: false,
      images: false,
      streaming: false,
      structuredOutput: false,
      systemInstructions: false,
      tools: false,
      embeddings: false,
      functionCalling: false,
      multimodal: false,
      codeExecution: false
    }
    
    // Default headers
    this.headers = config.headers || {
      'Content-Type': 'application/json',
      'User-Agent': 'GlassyDash/1.1.6'
    }
  }

  /**
   * Check if provider is configured and available
   * @returns {boolean} - True if provider is available
   */
  isAvailable() {
    return !!this.apiKey && this.isActive
  }

  /**
   * Generate content (text, audio, images)
   * @abstract
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generateContent(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured or not active', 503)
    }

    // Default implementation - subclasses should override
    throw new Error('generateContent must be implemented by subclass')
  }

  /**
   * Generate streaming content
   * @abstract
   * @param {string} prompt - The input prompt
   * @param {Function} onChunk - Callback for each chunk
   * @param {Function} onComplete - Callback when complete
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async *generateContentStream(prompt, onChunk, onComplete, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured or not active', 503)
    }

    if (!this.capabilities.streaming) {
      throw new ProviderError(this.name, 'Streaming not supported by this provider', 400)
    }

    // Default implementation - subclasses should override
    throw new Error('generateContentStream must be implemented by subclass')
  }

  /**
   * Generate embeddings
   * @abstract
   * @param {string} content - The content to embed
   * @param {Object} options - Embedding options
   * @returns {Promise<Object>} - Embedding result
   */
  async generateEmbeddings(content, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured or not active', 503)
    }

    if (!this.capabilities.embeddings) {
      throw new ProviderError(this.name, 'Embeddings not supported by this provider', 400)
    }

    // Default implementation - subclasses should override
    throw new Error('generateEmbeddings must be implemented by subclass')
  }

  /**
   * Count tokens
   * @abstract
   * @param {string} content - The content to count tokens for
   * @param {Object} options - Token counting options
   * @returns {Promise<number>} - Token count
   */
  async countTokens(content, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured or not active', 503)
    }

    // Default implementation - subclasses should override
    throw new Error('countTokens must be implemented by subclass')
  }

  /**
   * Generate function call (tools)
   * @abstract
   * @param {string} name - The function name
   * @param {Object} parameters - The function parameters
   * @param {Object} options - Function call options
   * @returns {Promise<Object>} - Function call result
   */
  async callFunction(name, parameters, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured or not active', 503)
    }

    if (!this.capabilities.functionCalling) {
      throw new ProviderError(this.name, 'Function calling not supported by this provider', 400)
    }

    // Default implementation - subclasses should override
    throw new Error('callFunction must be implemented by subclass')
  }

  /**
   * Transcribe audio
   * @abstract
   * @param {Buffer|Object} audioData - The audio data to transcribe
   * @param {Object} options - Transcription options
   * @returns {Promise<Object>} - Transcription result
   */
  async transcribeAudio(audioData, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured or not active', 503)
    }

    if (!this.capabilities.audio) {
      throw new ProviderError(this.name, 'Audio not supported by this provider', 400)
    }

    // Default implementation - subclasses should override
    throw new Error('transcribeAudio must be implemented by subclass')
  }

  /**
   * Generate image
   * @abstract
   * @param {string} prompt - The image prompt
   * @param {Object} options - Image generation options
   * @returns {Promise<Object>} - Image generation result
   */
  async generateImage(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured or not active', 503)
    }

    if (!this.capabilities.images) {
      throw new ProviderError(this.name, 'Images not supported by this provider', 400)
    }

    // Default implementation - subclasses should override
    throw new Error('generateImage must be implemented by subclass')
  }

  /**
   * Health check
   * Performs a simple connectivity check
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    try {
      const startTime = Date.now()
      
      // Simple ping check
      await this.generateContent('ping', {
        maxTokens: 10
      })
      
      const latency = Date.now() - startTime
      
      return {
        status: 'healthy',
        latency,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Mask API key for logging
   * @param {string} apiKey - The API key to mask
   * @returns {string} - Masked API key
   */
  maskApiKey(apiKey) {
    if (!apiKey) return '****'
    
    // Show first 8 and last 4 characters
    return apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
  }

  /**
   * Get provider info
   * @returns {Object} - Provider information
   */
  getInfo() {
    return {
      name: this.name,
      capabilities: this.capabilities,
      isActive: this.isActive,
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      rateLimit: this.rateLimit
    }
  }
}

module.exports = {
  BaseAIProvider,
  ProviderError,
  ProviderCapabilities
}