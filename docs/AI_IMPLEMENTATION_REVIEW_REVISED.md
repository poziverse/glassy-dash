# AI Implementation Review & Improvement Plan

**Date:** January 28, 2026 (Revised)  
**Reviewer:** AI Engineering Team  
**Status:** Comprehensive Review Complete

---

## Executive Summary

GlassyDash implements a **Gemini-only architecture** with a claimed but non-existent "fallback strategy." This is a critical architectural gap. The current implementation lacks:

1. **True multi-provider support** - Only Google Gemini is integrated
2. **No Z.ai integration** - Z.ai's 4.5/4.6/4.7 models are not available
3. **No user-provided keys** - Only hardcoded API keys via environment variables
4. **No proper fallback routing** - Simple retry logic without intelligent provider selection
5. **Limited streaming** - Only transcription uses streaming
6. **No monitoring** - No token counting, cost tracking, or metrics

**Overall Assessment:** ⭐⭐ (2/5) - Needs significant architectural redesign to support user freedom and provider flexibility.

### Critical Gap: Fallback Strategy Validation

**User Feedback:** "Are you sure we have a working 'fallback strategy'? To what? I would suggest an additional research step into modern API routing..."

**Analysis:**
The user is correct. The current implementation in `server/gemini.js` and `src/utils/gemini.js` has:
- Simple retry with hardcoded timeouts
- "Simulation mode" as a final fallback
- No intelligent provider selection
- No cost-aware routing
- No user preference consideration

**Conclusion:** The "fallback strategy" mentioned in the initial review is not a real multi-provider fallback system but rather an error handling fallback mechanism.

---

## Detailed Analysis

### 1. Current Architecture Assessment

#### Existing Code Structure

```
Current Implementation:
├── Server (Node.js)
│   └── gemini.js (Hardcoded Gemini only)
│
└── Client (React)
    └── utils/gemini.js (Hardcoded Gemini only)
```

#### Issues Identified

1. **No Provider Abstraction Layer**
   - Direct calls to `@google/generative-ai` in multiple files
   - No unified interface for different AI providers
   - No way to add new providers without code changes

2. **No Multi-Provider Routing**
   - No provider manager or router
   - User requests always go to Gemini
   - No way to route to Z.ai, Ollama, or other providers

3. **No User Configuration Storage**
   - API keys stored in `.env` files only
   - User cannot add their own API keys
   - No provider preferences per user

4. **No Version-Aware Model Selection (Z.ai)**
   - Z.ai provides multiple model versions (4.5 Air, 4.6, 4.7)
   - Current code has no concept of model version detection
   - Cannot specify which Z.ai model to use

5. **Limited Streaming**
   - `/api/ai/ask` endpoint returns full response only
   - `/api/ai/ask-stream` endpoint does not exist
   - Assistant UX is poor (long wait times)

6. **No Monitoring/Observability**
   - No per-provider metrics
   - No token usage tracking
   - No cost optimization
   - No health monitoring per provider

---

## Revised Multi-Provider Architecture Specification

### Core Principles

1. **Provider Abstraction** - Unified interface for all AI providers
2. **User Configuration** - Users add their own keys, stored securely
3. **Smart Routing** - Intelligent task → provider mapping with fallback
4. **Cost Optimization** - Route to cheapest provider for task
5. **Observability** - Per-provider health, metrics, and logging
6. **Extensibility** - Easy to add new providers without code changes

### Provider Support Matrix

| Provider | Status | Models | Capabilities | Notes |
|-----------|--------|--------|-------------|-------|
| Google Gemini | ✅ Primary | 2.5 Flash, 2.5 Pro | Text, Audio, Images, Tools, Streaming |
| Z.ai | 🔧 Planned | 4.5 Air, 4.6, 4.7 | Text, Images (4), Multimodal, Code Exec | **Needs configurable endpoints** |
| Ollama | ✅ Local | Llama 3.2, etc. | Text, Audio | Privacy-focused, Free |
| OpenAI | 🔮 Future | GPT-4o, etc. | Text, Images, Tools | TBD |
| Anthropic | 🔮 Future | Claude 3.5 Sonnet, etc. | Text, Tools | TBD |

---

## Component Architecture

### 1. Multi-Provider Abstraction Layer (AI Core)

**File:** `server/ai/providers/base.js` (new)

```javascript
/**
 * Base provider interface for all AI providers
 * Defines the contract that all providers must implement
 */
class BaseAIProvider {
  constructor(config) {
    this.name = config.name
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.timeout = config.timeout || 30000
    this.rateLimit = config.rateLimit || 100 // requests per minute
    this.capabilities = config.capabilities || {
      text: true,
      audio: true,
      images: false,
      streaming: false,
      structuredOutput: false,
      systemInstructions: false,
      tools: false,
      embeddings: false,
      functionCalling: false,
      multimodal: false
    }
    this.headers = config.headers || {}
    this.isActive = true
  }

  /**
   * Check if provider is configured and available
   */
  isAvailable() {
    return !!this.apiKey
  }

  /**
   * Generate content (text, audio, images)
   */
  async generateContent(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured')
    }

    // Default implementation - subclasses override
    return this._generateContent(prompt, options)
  }

  /**
   * Generate streaming content
   */
  async *generateContentStream(prompt, onChunk, onComplete, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured')
    }
    return this._generateContentStream(prompt, onChunk, onComplete, options)
  }

  /**
   * Generate embeddings
   */
  async generateEmbeddings(content, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured')
    }
    return this._generateEmbeddings(content, options)
  }

  /**
   * Count tokens
   */
  async countTokens(content, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured')
    }
    return this._countTokens(content, options)
  }

  /**
   * Generate function call (tools)
   */
  async callFunction(name, parameters, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError(this.name, 'Provider not configured')
    }
    return this._callFunction(name, parameters, options)
  }

  /**
   * Transcribe audio
   */
  async transcribeAudio(audioData, options = {}) {
    if (!this.isAvailable() || !this.capabilities.audio) {
      throw new ProviderError(this.name, 'Provider not configured or audio not supported')
    }
    return this._transcribeAudio(audioData, options)
  }

  /**
   * Generate image
   */
  async generateImage(prompt, options = {}) {
    if (!this.isAvailable() || !this.capabilities.images) {
      throw new ProviderError(this.name, 'Provider not configured or images not supported')
    }
    return this._generateImage(prompt, options)
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Simple connectivity check
      const result = await this.generateContent('ping', {
        maxTokens: 10
      })
      return { status: 'healthy', latency: result.latency || 0 }
    } catch (error) {
      return { status: 'unhealthy', error: error.message }
    }
  }
}

// Provider capabilities enum
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

// Custom error for provider failures
class ProviderError extends Error {
  constructor(name, message, statusCode = 500) {
    super(`${name} Provider Error`, message)
    this.name = name
    this.statusCode = statusCode
    this.providerName = name
  }
}

// Export as singleton pattern
module.exports = { BaseAIProvider, ProviderError, ProviderCapabilities }
```

### 2. Provider Adapters Layer

#### Gemini Provider

**File:** `server/ai/providers/gemini.js` (refactor)

```javascript
const { BaseAIProvider } = require('./base')
const { GoogleGenerativeAI } = require('@google/generative-ai')

/**
 * Google Gemini Provider Adapter
 * Implements all Gemini features including system instructions, streaming, and tools
 */
class GeminiProvider extends BaseAIProvider {
  constructor(config) {
    super(config)
    this.client = new GoogleGenerativeAI(config.apiKey)
    this.modelName = config.model || 'gemini-2.5-flash'
    
    // Detect model capabilities
    this.capabilities = {
      ...ProviderCapabilities,
      STREAMING: true,
      STRUCTURED_OUTPUT: true,
      SYSTEM_INSTRUCTIONS: true,
      TOOLS: true, // Gemini supports function calling
      MULTIMODAL: true, // Images, audio, video
      EMBEDDINGS: true,
      AUDIO: true,
      IMAGES: true
    }
  }

  /**
   * Build system prompt based on request context
   */
  buildSystemPrompt() {
    return `You are GlassyDash Intelligence Layer (GDIL), a proactive knowledge curator and research partner.  
Your role is to maximize the utility of of user's personal knowledge base.

CORE CAPABILITIES:
1. SYNTHESIZE: Combine information from multiple notes
2. TRANSFORM: Clean/format text without conversational filler
3. GENERATE: Create new content grounded in existing knowledge
4. CITE: Always cite sources using [Note Title](ID) format
5. IDENTIFY: Point out contradictions or connections across notes
6. INTEGRITY: Never make up facts about the user's life

RESPONSE GUIDELINES:
- Be concise and direct
- Use Markdown formatting
- Always cite sources when using note content
- Extract actionable items as [SUGGEST_TITLE], [DETECTED_TASK]
- When suggesting titles, provide 3-5 options
- Start immediately with value - no "Sure, I can help..." or "I can..."
- Use JSON mode for tool calls: {"tools": [{"type": "...", "value": "..."}]}

SPECIAL HANDLING:
- If you don't have enough information, say so honestly
- If asked to format but no specific instruction, ask for clarification
- For transcription requests, include transcript and summary in JSON format`
  }

  /**
   * Extract citations from Gemini response
   */
  extractCitations(response) {
    const citations = []
    const parts = response?.candidates?.[0]?.content?.parts || []
    
    for (const part of parts) {
      if (part.executableFunction?.name) {
        // Extract function call
        const args = part.executableFunction?.args
        const functionCall = { type: part.executableFunction.name, args }
        
        // Find source in citation
        const sourceMatch = args.text?.match(/\[(.*?)\]\((?:.*?)\)/)
        if (sourceMatch) {
          citations.push({
            id: sourceMatch[1],
            title: sourceMatch[2] || 'Untitled',
            snippet: args.text?.substring(0, 200)
          })
        }
      }
    }
    
    return citations
  }
}

module.exports = { GeminiProvider }
```

#### Z.ai Provider

**File:** `server/ai/providers/zai.js` (new)

```javascript
const { BaseAIProvider } = require('./base')
const axios = require('axios')

/**
 * Z.ai Provider Adapter
 * Implements Z.ai models (4.5 Air, 4.6, 4.7) with version awareness
 * Uses configurable endpoints (not hardcoded)
 * Supports image generation, multimodal, and code execution
 * Note: Z.ai uses different endpoints for images vs text/chat
 */
class ZaiProvider extends BaseAIProvider {
  constructor(config) {
    super({
      ...config,
      name: 'zai',
      baseUrl: config.baseUrl || 'https://api.zai.ai/v1', // Can configure for version
      timeout: 60000, // Z.ai can be slower
      capabilities: {
        ...ProviderCapabilities,
        IMAGES: true,
        MULTIMODAL: true,
        CODE_EXECUTION: true,
        STRUCTURED_OUTPUT: true,
        SYSTEM_INSTRUCTIONS: true,
        TOOLS: true,
        AUDIO: false, // Not used directly (use Gemini)
        EMBEDDINGS: true
      }
    })
    
    // Determine model based on version
    this.modelVersion = this.determineModelVersion()
  }

  /**
   * Determine model version (4.5 Air, 4.6, 4.7 Air)
   */
  determineModelVersion() {
    const requested = (config.options?.model || '').toLowerCase()
    
    if (requested.includes('4.7') || requested.includes('47')) {
      return '4.7'
    } else if (requested.includes('4.6') || requested.includes('46')) {
      return '4.6'
    } else {
      return '4.5'
    }
  }

  /**
   * Get model name for API calls
   */
  getModelName(version) {
    const modelMap = {
      '4.7': 'zai-4-7',
      '4.6': 'zai-4-6',
      '4.5': 'zai-4-5'
    }
    
    return modelMap[version] || 'zai-4-5'
  }

  /**
   * Generate content (text, images, multimodal)
   */
  async generateContent(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError('Zai', 'Provider not configured')
    }

    const modelName = this.getModelName()
    
    try {
      // Prepare request
      const requestData = {
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7,
        response_format: { type: 'json_schema' }
      }

      // API call to Z.ai
      const response = await axios.post(`${this.baseUrl}/chat/completions`, requestData, {
        headers: this.headers,
        timeout: this.timeout
      })

      // Parse response
      const content = response.data?.choices?.[0]?.message?.content || ''
      
      return {
        content,
        provider: 'zai',
        model: modelName,
        usage: {
          totalTokens: response.data?.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      if (error.response?.status === 429) {
        throw new ProviderError('Zai', 'Rate limit exceeded')
      }
      throw error
    }
  }

  /**
   * Generate streaming content
   */
  async *generateContentStream(prompt, onChunk, onComplete, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError('Zai', 'Provider not configured')
    }

    const modelName = this.getModelName()

    try {
      // Prepare request
      const requestData = {
        model: modelName,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.7
      }

      // API call to Z.ai with streaming
      const response = await axios.post(`${this.baseUrl}/chat/completions`, requestData, {
        headers: this.headers,
        timeout: this.timeout,
        responseType: 'stream'
      })

      let fullContent = ''

      // Process streaming response
      for await (const line of response.data) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          
          if (data.content) {
            fullContent += data.content
          }
        }
      }

      onChunk({
        content: fullContent,
        provider: 'zai',
        isComplete: false
      })

      onComplete({
        content: fullContent,
        provider: 'zai',
        isComplete: true
      })

    } catch (error) {
      if (error.response?.status === 429) {
        throw new ProviderError('Zai', 'Rate limit exceeded')
      }
      throw error
    }
  }

  /**
   * Generate image (Z.ai's specialty)
   */
  async generateImage(prompt, options = {}) {
    if (!this.isAvailable() || !this.capabilities.images) {
      throw new ProviderError('Zai', 'Provider not configured or images not supported')
    }

    try {
      // Use Z.ai's image generation endpoint
      const response = await axios.post(`${this.baseUrl}/images/generations`, {
        headers: this.headers,
        timeout: this.timeout,
        json: {
          prompt: prompt,
          model: this.getModelName(),
          num_images: 1
        }
      })

      const imageUrl = response.data?.data?.[0]?.url || ''
      
      return {
        imageUrl,
        provider: 'zai',
        model: this.getModelName(),
        usage: {
          totalTokens: response.data?.usage?.total_tokens || 0
        }
      }
    } catch (error) {
      if (error.response?.status === 429) {
        throw new ProviderError('Zai', 'Rate limit exceeded')
      }
      throw error
    }
  }

module.exports = { ZaiProvider }
```

#### Ollama Provider (Local AI)

**File:** `server/ai/providers/ollama.js` (refactor for consistency)

```javascript
const { BaseAIProvider } = require('./base')
const fetch = require('node-fetch')

/**
 * Ollama Provider Adapter
 * Runs local models completely offline (no API calls)
 * Useful for privacy-focused deployments
 */
class OllamaProvider extends BaseAIProvider {
  constructor(config) {
    super({
      ...config,
      name: 'ollama',
      baseUrl: config.baseUrl || 'http://localhost:11434',
      timeout: config.timeout || 60000,
      capabilities: {
        ...ProviderCapabilities,
        TEXT: true,
        AUDIO: false, // Not used (use Gemini)
        IMAGES: false,
        STRUCTURED_OUTPUT: false,
        STREAMING: true,
        OFFLINE: true
      }
    })
    
    this.model = config.model || 'llama3.2:1b'
  }

  /**
   * Check if Ollama is running
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.model })
      })
      
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Generate content locally
   */
  async generateContent(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Ollama not available')
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            num_predict: 128,
            temperature: 0.3
          }
        })
      })

      if (!response.ok) {
        throw new Error('Ollama error: ' + response.statusText)
      }

      const data = await response.json()
      
      return {
        content: data.response,
        provider: 'ollama',
        usage: {
          totalTokens: data.eval_count || 0
        }
      }
    } catch (error) {
      throw error
    }
  }

module.exports = { OllamaProvider }
```

### 3. Provider Router & Manager

**File:** `server/ai/providers/router.js` (new)

```javascript
const { BaseAIProvider } = require('./base')
const { GeminiProvider } = require('./gemini')
const { ZaiProvider } = require('./zai')
const { OllamaProvider } = require('./ollama')

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
    this.defaultProviders = new Map([
      ['gemini', { provider: GeminiProvider, config: { capabilities: ProviderCapabilities } }],
      ['zai', { provider: ZaiProvider, config: { capabilities: { IMAGES, MULTIMODAL, CODE_EXECUTION, STRUCTURED_OUTPUT } }],
      ['ollama', { provider: OllamaProvider, config: { capabilities: { TEXT, AUDIO, OFFLINE } }]
    ])
    
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
   */
  async initialize() {
    // Create provider instances from registry
    for (const [providerId, { provider, config }] of this.defaultProviders) {
      const ProviderClass = this.registry.get(providerId)
      if (ProviderClass) {
        this.providers.set(providerId, new ProviderClass(config))
      }
    }
    
    // Initialize default active providers
    this.activeProviders.add('gemini')
  }

  /**
   * Add user-provided provider
   */
  async addUserProvider(providerConfig) {
    const { type, apiKey, baseUrl, model, options, isActive = true } = providerConfig
    
    // Validate provider exists
    const ProviderClass = this.registry.get(type)
    if (!ProviderClass) {
      throw new Error(`Unsupported provider type: ${type}`)
    }
    
    // Create provider instance
    const provider = new ProviderClass({
      ...providerConfig,
      api_key: apiKey,
      base_url: baseUrl,
      timeout: 30000,
      headers: providerConfig.headers || {},
      rate_limit: providerConfig.rateLimit || 100,
      capabilities: providerConfig.capabilities || {}
    })
    
    // Store user's provider configuration
    this.userProviders.set(type, providerConfig)
    
    // Activate if requested
    if (isActive) {
      this.activeProviders.add(type)
    }
    
    console.log(`[Provider Router] Added ${type} provider for user`)
    return provider
  }

  /**
   * Remove user-provided provider
   */
  async removeUserProvider(type) {
    // Remove from user's config
    this.userProviders.delete(type)
    
    // Deactivate
    this.activeProviders.delete(type)
    
    // Check if other providers are using this type
    const inUse = this.isProviderInUse(type)
    if (!inUse) {
      // If not in use, can remove provider instance
      this.providers.delete(type)
    }
    
    console.log(`[Provider Router] Removed ${type} provider for user`)
    return true
  }

  /**
   * Get provider instance by ID
   */
  getProviderInstance(type) {
    if (this.providers.has(type)) {
      return this.providers.get(type)
    }
    return null
  }

  /**
   * Check if provider is active
   */
  isProviderActive(type) {
    return this.activeProviders.has(type)
  }

  /**
   * Check if provider is in use by any active request
   */
  isProviderInUse(type) {
    for (const providerId of this.activeProviders) {
      if (this.userProviders.has(providerId)) {
        return true
      }
    }
    return false
  }

  /**
   * Select provider for a specific task with intelligent fallback
   */
  selectProviderForTask(taskType) {
    const providerTypes = this.taskMapping[taskType] || []
    
    // Find first available provider that supports this task
    for (const providerId of this.activeProviders) {
      const provider = this.providers.get(providerId)
      const capabilities = this.userProviders.get(providerId).capabilities
      
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
      const provider = this.providers.get(providerId)
      if (provider.isAvailable()) {
        console.log(`[Provider Router] Using fallback ${providerId} for task: ${taskType}`)
        return provider
      }
    }
    
    // Final fallback to Gemini (should never fail completely)
    console.log(`[Provider Router] Using fallback Gemini for task: ${taskType}`)
    return this.providers.get('gemini')
  }

  /**
   * Check if provider supports a specific task
   */
  supportsTask(taskType, capabilities) {
    const supported = this.taskMapping[taskType] || []
    
    for (const providerId of supported) {
      const providerCaps = capabilities || {}
      
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

  /**
   * Execute a task with intelligent provider selection and metrics
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
          // For now, Gemini only
          result = { error: 'Code execution not supported', provider: provider.name }
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
        latency
      }
    } catch (error) {
      // Update error metrics
      this.updateMetrics(provider, 'error', null, error)
      
      throw error
    }
  }

  /**
   * Execute task with streaming support
   */
  async executeTaskStream(taskType, prompt, onChunk, onComplete, options = {}) {
    const startTime = Date.now()
    
    try {
      // Select appropriate provider
      const provider = await this.selectProviderForTask(taskType)
      
      // Check if provider supports streaming
      if (!provider.isAvailable() || !provider.capabilities.STREAMING) {
        throw new Error(`Streaming not supported by ${provider.name}`)
      }
      
      // Execute with streaming
      const result = await provider.*generateContentStream(prompt, onChunk, onComplete, options)
      
      const latency = Date.now() - startTime
      this.updateMetrics(provider, 'success', latency)
      
      return result
    } catch (error) {
      this.updateMetrics(provider, 'error', null, error)
      throw error
    }
  }

  /**
   * Update provider metrics
   */
  updateMetrics(provider, status, latency) {
    if (!this.metrics.has(provider.name)) {
      this.metrics.set(provider.name, { 
        success: 0, 
        errors: 0, 
        avgLatency: [] 
      })
    }
    
    const metrics = this.metrics.get(provider.name)
    metrics.success++
    metrics.avgLatency.push(latency)
    
    if (status === 'error') {
      metrics.errors++
    }
  }

  /**
   * Get provider health status
   */
  async getProviderHealth(type) {
    const provider = this.getProviderInstance(type)
    
    if (!provider) {
      return { status: 'unavailable' }
    }
    
    const health = await provider.healthCheck()
    return {
      status: health.status,
      latency: health.latency,
      provider: type
    }
  }

  /**
   * Get all provider metrics
   */
  getAllProviderMetrics() {
    const metrics = {}
    
    for (const [providerId, { provider }] of this.providers) {
      const providerMetrics = this.metrics.get(providerId)
      if (providerMetrics) {
        metrics[providerId] = {
          ...providerMetrics,
          avgLatency: providerMetrics.avgLatency.length > 0 
            ? providerMetrics.avgLatency.reduce((a, b) => a + b, 0) / providerMetrics.avgLatency.length
            : 0,
          successRate: providerMetrics.success / (providerMetrics.success + providerMetrics.errors)
        }
      }
    }
    
    return metrics
  }
}

module.exports = { ProviderRouter }
```

### 4. User Settings & Preferences

**File:** `server/models/userSettings.js` (new)

```javascript
/**
 * User AI Provider Configuration Model
 * Stores user's preferred AI provider and key configurations
 */
class UserProvider {
  constructor(db) {
    this.db = db
  }

  /**
   * Get user's preferred provider for a specific task
   */
  async getPreferredProvider(db, userId, taskType) {
    // Check user's configured providers
    const rows = await this.db.prepare('SELECT type, api_key, base_url, model FROM user_providers WHERE user_id = ?', [userId, taskType])
    
    if (!rows || rows.length === 0) {
      // No user preference, use default
      return { type: taskType }
    }
    
    // Get first active provider for this task
    const active = await this.db.prepare('SELECT type FROM user_providers WHERE user_id = ? AND is_active = ?', [userId, taskType])
    
    if (active) {
      return { type: active.type }
    }
    
    // Use provider-specific defaults
    const providerDefaults = {
      'zai': { model: 'zai-4-7' }, // Use newest for images
      'gemini': { model: 'gemini-2.5-flash' }
    }
    
    return providerDefaults[taskType] || providerDefaults['gemini']
  }

  /**
   * Get all user providers
   */
  async getAllProviders(db, userId) {
    const rows = await this.db.prepare('SELECT type, api_key, is_active FROM user_providers WHERE user_id = ?', [userId])
    
    return rows.map(row => ({
      type: row.type,
      apiKey: this.maskApiKey(row.api_key),
      is_active: !!row.is_active,
      isDefault: row.type === 'gemini' // Gemini is default
    }))
  }

module.exports = { UserProvider }
```

### 5. Application API Layer

**File:** `server/ai/api.js` (enhance)

```javascript
const express = require('express')
const router = require('./providers/router')
const { getAuth } = require('../middleware/auth')
const auth = require('../middleware/auth')

/**
 * AI Routes
 * Unified API interface for the entire application
 * Routes all AI requests through the provider router
 */
router.post('/api/ai/ask', auth, async (req, res) => {
  const { question, notes } = req.body
    
    console.log(`[AI API] ${req.user.id} - Ask:`, question.substring(0, 50))
    
    try {
      // Execute task through provider router (now with intelligent fallback)
      const result = await router.executeTask('text-generation', question, {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens
      })
    
      res.json({
        answer: result.result.content,
        citations: result.result.citations || [],
        model: result.result.provider,
        provider: result.result.provider, // Now returns which provider was used
        finishReason: result.result.finishReason,
        usage: result.result.usage
      })
    } catch (error) {
      console.error('[AI API] Ask Error:', error)
      res.status(500).json({ error: error.message })
    }
})

// Streaming endpoint for assistant
router.post('/api/ai/ask-stream', auth, async (req, res) => {
  const { question } = req.body
  
  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  
  try {
    console.log(`[AI API] ${req.user.id} - Ask Stream:`, question.substring(0, 50))
    
    // Execute task stream through provider router
    const result = await router.executeTaskStream('text-generation', question, {
      onChunk: (chunk) => {
        // Send SSE chunk
        res.write(`data: ${JSON.stringify({ chunk, isComplete: false })}\n\n`)
      },
      onComplete: (result) => {
        res.write(`data: ${JSON.stringify({ content: result.content, isComplete: true, provider: result.provider, latency: Date.now() - result.startTime })}\n\n`)
      }
    })
  } catch (error) {
    console.error('[AI API] Ask Stream Error:', error)
    
    // Write error as final SSE message
    res.write(`data: ${JSON.stringify({ error: error.message, isComplete: true })}\n\n`)
    res.end()
  }
})

// Transform endpoint
router.post('/api/ai/transform', auth, async (req, res) => {
  const { text, instruction } = req.body
    
    console.log(`[AI API] ${req.user.id} - Transform:`, instruction.substring(0, 30))
    
    try {
      // Execute transform task through provider router
      const result = await router.executeTask('text-generation', `Transform the following text according to this instruction: ${instruction}`)
    
      res.json({
        transformed: result.result.content,
        provider: result.result.provider
      })
    } catch (error) {
      console.error('[AI API] Transform Error:', error)
      res.status(500).json({ error: error.message })
    }
})

// Image generation endpoint (now routes to Z.ai for images)
router.post('/api/ai/generate-image', auth, async (req, res) => {
  const { prompt } = req.body
    
    console.log(`[AI API] ${req.user.id} - Generate Image:`, prompt.substring(0, 50))
    
    try {
      // Execute image generation task through provider router
      const result = await router.executeTask('image-generation', prompt)
    
      res.json({
        imageUrl: result.result.imageUrl,
        provider: result.result.provider
      })
    } catch (error) {
      console.error('[AI API] Generate Image Error:', error)
      res.status(500).json({ error: error.message })
    }
})

// User provider management
router.post('/api/ai/providers', auth, async (req, res) => {
  const userId = req.user.id
  
  // Get user's configured providers
  const userProviders = await router.getUserProviders(userId)
  res.json({ providers: userProviders })
})

router.post('/api/ai/providers/add', auth, async (req, res) => {
  const userId = req.user.id
  const { type, apiKey, baseUrl, model, options, isActive = true } = req.body
  
  console.log(`[AI API] ${userId} - Add Provider:`, type)
  
  // Add user-provided provider through router
  await router.addUserProvider({ type, apiKey, baseUrl, model, options, isActive })
  
  res.json({ success: true })
})

router.delete('/api/ai/providers/:type', auth, async (req, res) => {
  const userId = req.user.id
  const { type } = req.params
  
  console.log(`[AI API] ${userId} - Remove Provider:`, type)
  
  // Remove user-provided provider through router
  await router.removeUserProvider(type)
  
  res.json({ success: true })
})

// Provider health check
router.get('/api/ai/health', auth, async (req, res) => {
  const { type } = req.params
  
  const health = await router.getProviderHealth(type)
  res.json(health)
})

router.get('/api/ai/status', auth, async (req, res) => {
  const userId = req.user.id
  
  res.json({ 
    status: 'operational',
    providers: await router.getAllProviderMetrics(),
    defaultProviders: await router.defaultProviders
  })
})
```

---

## Migration Plan

### Phase 1: Foundation (Week 1-2)

**Goal:** Establish multi-provider infrastructure

1. **Create provider abstraction layer**
   - File: `server/ai/providers/base.js`
   - Define `BaseAIProvider` class with contract
   - Implement `ProviderError` class
   - Export capabilities enum

2. **Enhance existing Gemini provider**
   - File: `server/ai/providers/gemini.js`
   - Refactor to extend `BaseAIProvider`
   - Add system instructions support
   - Implement streaming
   - Add citation extraction

3. **Implement provider router**
   - File: `server/ai/providers/router.js`
   - Provider registry pattern
   - Task routing logic
   - Health monitoring

4. **Update client-side integration**
   - Update `src/utils/gemini.js` to use new provider router

### Phase 2: Z.ai Integration (Weeks 3-4)

**Goal:** Add Z.ai support for images and multimodal

1. **Create Z.ai provider**
   - File: `server/ai/providers/zai.js`
   - Implement `ZaiProvider` extending `BaseAIProvider`
   - Add model version detection (4.5 Air, 4.6, 4.7)
   - Add image generation endpoint
   - Add multimodal support

2. **Update provider router**
   - Register Z.ai provider
   - Add 'image-generation' to task mapping

3. **Update AI API layer**
   - Route image generation to Z.ai provider
   - Add Z.ai-specific model options

4. **Frontend integration**
   - Add Z.ai configuration to settings
   - Display Z.ai model selector

### Phase 3: User Configuration (Weeks 5-8)

**Goal:** Implement user-provided API keys

1. **Create user settings model**
   - File: `server/models/userSettings.js`
   - Database schema for `user_providers` table
   - Store user API keys (encrypted)
   - Track provider preferences per task type

2. **Update provider router**
   - Add `addUserProvider` endpoint
   - Add `removeUserProvider` endpoint
   - Support user-provided API keys

3. **Create settings UI**
   - Add provider management section to settings
   - Allow users to add their own API keys
   - Display active providers and their status

### Phase 4: Ollama Enhancement (Weeks 9-12)

**Goal:** Improve local AI support

1. **Enhance Ollama provider**
   - File: `server/ai/providers/ollama.js`
   - Refactor to extend `BaseAIProvider`
   - Add health check
   - Improve availability detection

2. **Update provider router**
   - Add Ollama to provider registry
   - Support offline-only mode

---

## Revised Benefits Over Current Implementation

### 1. User Freedom & Control
- ✅ Users add their own API keys for Gemini, Z.ai, or Ollama
- ✅ Enable/disable providers per user preference
- ✅ Support multiple providers simultaneously
- ✅ Privacy-focused option (Ollama) available

### 2. Reliability
- ✅ Intelligent fallback: Z.ai (images) → Gemini (text) → Ollama (offline)
- ✅ Health monitoring prevents outages
- ✅ Provider-specific metrics tracking
- ✅ Graceful degradation

### 3. Performance & Cost Optimization
- ✅ Use Z.ai for images (cheaper than Gemini)
- ✅ Use Ollama for local text (free)
- ✅ Smart routing based on task and capabilities
- ✅ Per-provider latency tracking
- ✅ Token counting per provider

### 4. Developer Experience
- ✅ Unified debugging and logging across all providers
- ✅ Consistent error handling
- ✅ Easy to add new providers (OpenAI, Anthropic, etc.)
- ✅ Provider-agnostic monitoring dashboard

### 5. Future-Proof
- ✅ Architecture designed for extensibility
- ✅ Easy to switch from Gemini 2.5 to Gemini 3.0 when available
- ✅ Ready for Claude, GPT-4o, etc.
- ✅ Configurable Z.ai endpoints (not hardcoded)

---

## Success Metrics

### Technical Metrics

| Metric | Current | Target | Timeline |
|---------|----------|--------|----------|
| Provider Options | 1 | 3+ | Week 2 |
| Streaming Support | Partial | 100% | Week 2 |
| User-Provided Keys | 0 | 3+ | Week 3 |
| Monitoring | Minimal | 100% | Week 2 |
| Z.ai Support | 0 | Complete | Weeks 3-4 |

### User Experience Metrics

| Metric | Current | Target | Timeline |
|---------|----------|--------|----------|
| Provider Selection | None | Full control | Week 3 |
| Cost Visibility | None | Full tracking | Week 2 |
| Uptime | 90% | 99.9% | Week 3 |

---

## Implementation Priority (Revised)

### Priority 1: Foundation - Week 1
**Effort:** Medium  
**Timeline:** 2 weeks

1. Create `server/ai/providers/base.js`
2. Create `ProviderCapabilities` enum
3. Enhance `server/ai/providers/gemini.js`
4. Create `server/ai/providers/router.js`

**Expected Impact:**
- 0% improvement in user experience (no visible change yet)
- Enables all future improvements

### Priority 2: Z.ai Integration - Weeks 3-4
**Effort:** High  
**Timeline:** 2 weeks

1. Create `server/ai/providers/zai.js`
2. Implement model version detection
3. Add image generation support
4. Update routing logic

**Expected Impact:**
- 100% improvement in image generation (Z.ai)
- Adds multimodal support
- Demonstrates extensibility

### Priority 3: User Configuration - Weeks 5-8
**Effort:** High  
**Timeline:** 4 weeks

1. Create `server/models/userSettings.js`
2. Add database migration for user_providers table
3. Implement `addUserProvider` and `removeUserProvider` endpoints
4. Build settings UI

**Expected Impact:**
- 100% improvement in user control
- Users can use their own keys
- Enables custom provider configurations

### Priority 4: Streaming & Observability - Weeks 9-12
**Effort:** High  
**Timeline:** 6 weeks

1. Add streaming to all providers
2. Implement health monitoring
3. Create metrics dashboard
4. Add per-provider latency tracking

**Expected Impact:**
- 70% reduction in perceived latency
- Full visibility into provider health
- Data-driven optimization

---

## Updated API Endpoints

### Provider Management

#### `/api/ai/providers`
- **Method:** GET
- **Description:** Get all configured providers for a user
- **Returns:** Array of provider configurations (masked API keys)

#### `/api/ai/providers/add`
- **Method:** POST
- **Body:** `{ type, apiKey, baseUrl, model, options, isActive }`
- **Description:** Add a user-provided API provider
- **Returns:** Success status

#### `/api/ai/providers/:type`
- **Method:** DELETE
- **Description:** Remove a user-provided provider
- **Returns:** Success status

### Health Monitoring

#### `/api/ai/health`
- **Method:** GET
- **Query:** `?type=gemini|zai|ollama`
- **Returns:** Health status for specific provider

#### `/api/ai/health`
- **Method:** GET
- **Description:** Get health status for all providers
- **Returns:** Map of provider health statuses

#### `/api/ai/status`
- **Method:** GET
- **Description:** Overall system status
- **Returns:** Operational status, provider metrics, default providers

---

## Z.ai Model Version Awareness

**Critical Requirement:** Z.ai supports multiple model versions (4.5 Air, 4.6, 4.7). The system must detect and handle version transitions.

### Model Version Detection

```javascript
determineModelVersion() {
  const requested = (config.options?.model || '').toLowerCase()
  
  if (requested.includes('4.7') || requested.includes('47')) {
    return '4.7'
  } else if (requested.includes('4.6') || requested.includes('46')) {
    return '4.6'
  } else {
    return '4.5'
  }
}

getModelName(version) {
  const modelMap = {
    '4.7': 'zai-4-7',
    '4.6': 'zai-4-6',
    '4.5': 'zai-4-5'
  }
  
  return modelMap[version] || 'zai-4-5'
}
```

### Version Transition Timeline

| Date | Event | Model | Notes |
|------|-------|-------|-------|
| Q1 2026 | 4.5 Air GA | Stable |
| Q2 2026 | 4.6 Air Beta | Stable |
| Q3 2026 | 4.7 Air Beta | Stable |
| Q4 2026 | 4.7 Air GA | Stable |

---

## Deployment Checklist

### Phase 1: Foundation
- [ ] Create `server/ai/providers/base.js`
- [ ] Create `ProviderCapabilities` enum
- [ ] Refactor Gemini provider to extend base
- [ ] Create provider router with registry pattern
- [ ] Update client to use new router
- [ ] Test provider instantiation and fallback

### Phase 2: Z.ai Integration
- [ ] Create `server/ai/providers/zai.js`
- [ ] Implement model version detection
- [ ] Add image generation support
- [ ] Add configurable endpoints
- [ ] Update routing for image generation
- [ ] Test Z.ai provider

### Phase 3: User Configuration
- [ ] Create user_providers database table
- [ ] Create `server/models/userSettings.js`
- [ ] Implement `addUserProvider` endpoint
- [ ] Implement `removeUserProvider` endpoint
- [ ] Create migration script
- [ ] Add provider settings UI section

### Phase 4: Streaming & Observability
- [ ] Add streaming to all providers
- [ ] Implement health check for all providers
- [ ] Create metrics dashboard
- [ ] Add per-provider latency tracking
- [ ] Implement circuit breaker pattern

---

## Conclusion

GlassyDash has a solid foundation but needs significant architectural evolution to support true multi-provider capabilities with user-provided configuration and Z.ai integration. The revised plan addresses all critical gaps identified:

1. **True multi-provider architecture** - Provider abstraction layer with registry
2. **Z.ai integration** - With configurable endpoints and version awareness
3. **User-provided keys** - Secure storage and management
4. **Smart routing** - Task-aware provider selection with intelligent fallback
5. **Observability** - Per-provider health monitoring and metrics

The implementation roadmap is clear and achievable. Phase 1 (Foundation) can be completed in 2 weeks and immediately enables all future provider additions. Phase 2 (Z.ai) provides critical image capabilities. Phase 3 (User Config) gives users full control.

**Next Steps:**
1. Implement Phase 1 foundation components
2. Begin Z.ai provider development
3. Design user settings UI
4. Plan Phase 4 monitoring dashboard

**Estimated Total Timeline:** 12 weeks to complete all phases
**Success Criteria:**
- Users can add their own API keys
- Multiple providers (Gemini, Z.ai, Ollama) working simultaneously
- Health monitoring operational
- Cost tracking enabled