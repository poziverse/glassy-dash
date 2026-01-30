const { BaseAIProvider, ProviderCapabilities } = require('./base')

/**
 * Provider Router & Manager
 * Handles intelligent routing between providers
 * Manages provider selection, fallback, and health monitoring
 */
class ProviderRouter {
  constructor() {
    // User-provided provider configurations
    this.userProviders = new Map() // Maps providerId -> { type, apiKey, baseUrl, model, options }
    
    // Provider instances (lazy-loaded)
    this.providers = new Map() // Maps providerId -> Provider instance
    
    // Provider registry
    this.registry = new Map()
    
    // Default providers
    this.defaultProviders = new Map()
    
    // Active provider selection
    this.activeProviders = new Set(['gemini']) // Default to Gemini
    
    // Task type to provider mapping
    this.taskMapping = {
      'text-generation': ['gemini', 'zai', 'ollama'],
      'image-generation': ['zai'], // Z.ai is best for images
      'audio-transcription': ['gemini', 'zai'],
      'embeddings': ['gemini', 'zai', 'ollama'],
      'code-execution': ['gemini', 'zai'],
      'transform': ['gemini', 'zai'],
      'vision': ['gemini', 'zai']
    }
    
    // Health monitoring
    this.providerHealth = new Map() // Tracks provider health status
    this.metrics = new Map() // Tracks provider metrics (latency, errors, usage)
  }

  /**
   * Initialize with default providers
   * @returns {Promise<void>}
   */
  async initialize() {
    // Note: Provider classes are registered via registerProvider() call during init.js
    // This method sets up the framework but providers are registered separately
    
    console.log('[Provider Router] Initialized with default provider: Gemini')
  }

  /**
   * Register a provider class
   * @param {string} type - The provider type (e.g., 'gemini')
   * @param {class} ProviderClass - The provider class to register
   * @param {Object} config - Default configuration for this provider
   * @returns {void}
   */
  registerProvider(type, ProviderClass, config) {
    this.registry.set(type, { providerClass: ProviderClass, config })
    console.log(`[Provider Router] Registered provider: ${type}`)
  }

  /**
   * Add user-provided provider
   * @param {Object} providerConfig - Provider configuration
   * @param {string} providerConfig.type - The provider type
   * @param {string} providerConfig.apiKey - The API key
   * @param {string} providerConfig.baseUrl - The base URL
   * @param {string} providerConfig.model - The model name
   * @param {Object} providerConfig.options - Additional options
   * @param {boolean} providerConfig.isActive - Whether provider is active
   * @returns {Promise<Object>} - Provider instance
   */
  async addUserProvider(providerConfig) {
    const { type, apiKey, baseUrl, model, options, isActive = true } = providerConfig
    
    // Validate provider exists
    const registration = this.registry.get(type)
    if (!registration) {
      throw new Error(`Unsupported provider type: ${type}`)
    }
    
    const { providerClass, config: defaultConfig } = registration
    if (!providerClass) {
      throw new Error(`Provider class not found for type: ${type}`)
    }
    
    // Merge default config with user config
    const mergedConfig = {
      ...defaultConfig,
      ...providerConfig,
      apiKey,
      baseUrl: baseUrl || defaultConfig.baseUrl,
      model: model || defaultConfig.model,
      isActive
    }
    
    // Create provider instance
    const provider = new providerClass(mergedConfig)
    
    // Store user's provider configuration
    this.userProviders.set(type, mergedConfig)
    
    // Store provider instance
    this.providers.set(type, provider)
    
    // Activate if requested
    if (isActive) {
      this.activeProviders.add(type)
    }
    
    console.log(`[Provider Router] Added ${type} provider`)
    return provider
  }

  /**
   * Remove user-provided provider
   * @param {string} type - The provider type to remove
   * @returns {Promise<boolean>} - Success status
   */
  async removeUserProvider(type) {
    // Remove from user's config
    this.userProviders.delete(type)
    
    // Deactivate
    this.activeProviders.delete(type)
    
    // Check if other users are using this provider
    const inUse = this.isProviderInUse(type)
    if (!inUse) {
      // If not in use, can remove provider instance
      this.providers.delete(type)
      // Remove from registry
      this.registry.delete(type)
    }
    
    console.log(`[Provider Router] Removed ${type} provider`)
    return true
  }

  /**
   * Get provider instance by type
   * @param {string} type - The provider type
   * @returns {BaseAIProvider|null} - Provider instance
   */
  getProviderInstance(type) {
    if (this.providers.has(type)) {
      return this.providers.get(type)
    }
    
    // Try to lazy-load provider
    const { providerClass, config } = this.registry.get(type)
    if (providerClass && this.userProviders.has(type)) {
      const ProviderClass = require(`./${type}`)
      const provider = new ProviderClass(this.userProviders.get(type))
      this.providers.set(type, provider)
      return provider
    }
    
    return null
  }

  /**
   * Check if provider is active
   * @param {string} type - The provider type
   * @returns {boolean} - True if active
   */
  isProviderActive(type) {
    return this.activeProviders.has(type)
  }

  /**
   * Check if provider is in use by any user
   * @param {string} type - The provider type
   * @returns {boolean} - True if in use
   */
  isProviderInUse(type) {
    return this.userProviders.has(type)
  }

  /**
   * Select provider for a specific task with intelligent fallback
   * @param {string} taskType - The task type
   * @returns {BaseAIProvider} - Selected provider instance
   */
  selectProviderForTask(taskType) {
    const providerTypes = this.taskMapping[taskType] || []
    
    // Find first available provider that supports this task
    for (const providerId of this.activeProviders) {
      if (!providerTypes.includes(providerId)) continue
      
      const provider = this.getProviderInstance(providerId)
      if (!provider) continue
      
      const config = this.userProviders.get(providerId) || {}
      const capabilities = config.capabilities || provider.capabilities
      
      // Check if provider supports task
      const taskCheck = this.supportsTask(taskType, capabilities)
      if (taskCheck && provider.isAvailable()) {
        console.log(`[Provider Router] Selected ${providerId} for task: ${taskType}`)
        return provider
      }
    }
    
    // Fallback hierarchy: task-specific → general purpose → local
    const generalPurposeProviders = ['gemini', 'zai', 'ollama']
    for (const providerId of generalPurposeProviders) {
      const provider = this.getProviderInstance(providerId)
      if (provider && provider.isAvailable()) {
        console.log(`[Provider Router] Using fallback ${providerId} for task: ${taskType}`)
        return provider
      }
    }
    
    // Final fallback to Gemini (should never fail completely)
    const provider = this.getProviderInstance('gemini')
    if (provider) {
      console.log(`[Provider Router] Using fallback Gemini for task: ${taskType}`)
      return provider
    }
    
    throw new Error('No available providers')
  }

  /**
   * Check if provider supports a specific task
   * @param {string} taskType - The task type
   * @param {Object} capabilities - Provider capabilities
   * @returns {boolean} - True if supported
   */
  supportsTask(taskType, capabilities) {
    if (!capabilities) return false
    
    const supported = this.taskMapping[taskType] || []
    
    for (const providerId of supported) {
      const providerCaps = capabilities
      
      if (taskType === 'text-generation' && providerCaps.TEXT) return true
      if (taskType === 'image-generation' && providerCaps.IMAGES) return true
      if (taskType === 'audio-transcription' && providerCaps.AUDIO) return true
      if (taskType === 'embeddings' && providerCaps.EMBEDDINGS) return true
      if (taskType === 'code-execution' && providerCaps.CODE_EXECUTION) return true
      if (taskType === 'multimodal' && providerCaps.MULTIMODAL) return true
      if (taskType === 'transform' && capabilities.MULTIMODAL) return true
      if (taskType === 'vision' && capabilities.MULTIMODAL) return true
      
      return false
    }
    
    return false
  }

  /**
   * Execute a task with intelligent provider selection and metrics
   * @param {string} taskType - The task type
   * @param {string} prompt - The prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Execution result
   */
  async executeTask(taskType, prompt, options = {}) {
    const startTime = Date.now()
    
    try {
      // Select appropriate provider
      const provider = await this.selectProviderForTask(taskType)
      
      // Execute task
      let result
      switch (taskType) {
        case 'text-generation':
        case 'transform':
        case 'vision':
          result = await provider.generateContent(prompt, options)
          break
        case 'image-generation':
          result = await provider.generateImage(prompt, options)
          break
        case 'audio-transcription':
          result = await provider.transcribeAudio(prompt, options)
          break
        case 'embeddings':
          result = await provider.generateEmbeddings(prompt, options)
          break
        case 'code-execution':
          // For now, only Gemini/Zai support this
          result = { error: 'Code execution not supported by provider', provider: provider.name }
          break
        default:
          result = await provider.generateContent(prompt, options)
      }
      
      // Update metrics
      const latency = Date.now() - startTime
      this.updateMetrics(provider, 'success', latency)
      
      return {
        result,
        provider: provider.name,
        latency,
        taskType
      }
    } catch (error) {
      // Update error metrics
      const provider = error.providerName || 'unknown'
      this.updateMetrics({ name: provider }, 'error', null, error)
      
      throw error
    }
  }

  /**
   * Execute task with streaming support
   * @param {string} taskType - The task type
   * @param {string} prompt - The prompt
   * @param {Function|Object} onChunkOrOptions - Chunk callback or options object
   * @param {Function} [onComplete] - Complete callback
   * @param {Object} [options={}] - Generation options
   * @returns {Promise<Object>} - Execution result
   */
  async executeTaskStream(taskType, prompt, onChunkOrOptions, onComplete, options = {}) {
    const startTime = Date.now()
    
    // Normalize arguments (handle positional or options object)
    let finalOnChunk = onChunkOrOptions
    let finalOnComplete = onComplete
    let finalOptions = options

    if (typeof onChunkOrOptions === 'object' && onChunkOrOptions !== null && !Array.isArray(onChunkOrOptions)) {
      finalOnChunk = onChunkOrOptions.onChunk
      finalOnComplete = onChunkOrOptions.onComplete
      finalOptions = onChunkOrOptions
    }
    
    try {
      // Select appropriate provider
      const provider = await this.selectProviderForTask(taskType)
      
      // Check if provider supports streaming
      if (!provider.capabilities.STREAMING) {
        throw new Error(`Streaming not supported by ${provider.name}`)
      }
      
      // Execute with streaming
      const streamResult = provider.generateContentStream(prompt, finalOnChunk, finalOnComplete, finalOptions)
      
      const latency = Date.now() - startTime
      this.updateMetrics(provider, 'success', latency)
      
      return {
        streamResult,
        provider: provider.name,
        latency,
        taskType
      }
    } catch (error) {
      // Update error metrics
      const provider = error.providerName || 'unknown'
      this.updateMetrics({ name: provider }, 'error', null, error)
      
      throw error
    }
  }

  /**
   * Update provider metrics
   * @param {Object} provider - Provider instance or object with name
   * @param {string} status - Status ('success' or 'error')
   * @param {number} latency - Request latency
   * @param {Error} error - Error object
   */
  updateMetrics(provider, status, latency, error) {
    const providerName = provider.name || provider
    
    if (!this.metrics.has(providerName)) {
      this.metrics.set(providerName, { 
        success: 0, 
        errors: 0, 
        totalLatency: 0,
        avgLatency: [],
        errorRate: 0
      })
    }
    
    const metrics = this.metrics.get(providerName)
    
    if (status === 'success') {
      metrics.success++
      metrics.totalLatency += latency
      metrics.avgLatency.push(latency)
      
      // Calculate rolling average (last 100 requests)
      if (metrics.avgLatency.length > 100) {
        metrics.avgLatency.shift()
      }
      
      // Update error rate
      metrics.errorRate = metrics.errors / (metrics.success + metrics.errors)
    } else {
      metrics.errors++
      metrics.errorRate = metrics.errors / (metrics.success + metrics.errors)
    }
    
    // Log warnings
    if (metrics.errorRate > 0.1) {
      console.warn(`[Provider Router] ${providerName} error rate: ${(metrics.errorRate * 100).toFixed(2)}%`)
    }
    
    if (metrics.avgLatency.length > 0) {
      const avgLatency = metrics.avgLatency.reduce((a, b) => a + b, 0) / metrics.avgLatency.length
      if (avgLatency > 10000) { // 10 seconds
        console.warn(`[Provider Router] ${providerName} avg latency: ${(avgLatency / 1000).toFixed(2)}s`)
      }
    }
  }

  /**
   * Get provider health status
   * @param {string} type - The provider type
   * @returns {Promise<Object>} - Health status
   */
  async getProviderHealth(type) {
    const provider = this.getProviderInstance(type)
    
    if (!provider) {
      return { 
        status: 'unavailable',
        type,
        timestamp: new Date().toISOString()
      }
    }
    
    try {
      const health = await provider.healthCheck()
      this.providerHealth.set(type, health)
      
      return {
        ...health,
        type,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        type,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get all provider metrics
   * @returns {Object} - All provider metrics
   */
  getAllProviderMetrics() {
    const metrics = {}
    
    for (const [providerId, provider] of this.providers) {
      const providerMetrics = this.metrics.get(provider.name)
      const health = this.providerHealth.get(providerId)
      
      const avgLatency = providerMetrics && providerMetrics.avgLatency.length > 0 
        ? providerMetrics.avgLatency.reduce((a, b) => a + b, 0) / providerMetrics.avgLatency.length
        : 0
      
      metrics[providerId] = {
        name: provider.name,
        type: providerId,
        isActive: this.activeProviders.has(providerId),
        isAvailable: provider.isAvailable(),
        ...providerMetrics,
        avgLatency,
        successRate: providerMetrics 
          ? providerMetrics.success / (providerMetrics.success + providerMetrics.errors)
          : 0,
        health: health || { status: 'unknown' },
        capabilities: provider.capabilities,
        timestamp: new Date().toISOString()
      }
    }
    
    return metrics
  }

  /**
   * Get all active providers
   * @returns {Array} - Array of active provider types
   */
  getActiveProviders() {
    return Array.from(this.activeProviders)
  }

  /**
   * Get all registered providers
   * @returns {Array} - Array of registered provider types
   */
  getRegisteredProviders() {
    return Array.from(this.registry.keys())
  }

  /**
   * Get task mapping
   * @returns {Object} - Task to provider mapping
   */
  getTaskMapping() {
    return this.taskMapping
  }

  /**
   * Set task mapping for a specific task type
   * @param {string} taskType - The task type
   * @param {Array} providers - Array of provider types to use for this task
   * @returns {void}
   */
  setTaskMapping(taskType, providers) {
    this.taskMapping[taskType] = providers
    console.log(`[Provider Router] Updated task mapping for ${taskType}: ${providers.join(', ')}`)
  }
}

// Export singleton instance
module.exports = new ProviderRouter()
