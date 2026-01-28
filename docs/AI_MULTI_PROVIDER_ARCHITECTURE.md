# AI Multi-Provider Architecture

**Date:** January 28, 2026  
**Status:** Architectural Design Specification

---

## Executive Summary

This document defines a comprehensive multi-provider AI architecture for GlassyDash, supporting Google Gemini, Z.ai (with version awareness), and future extensibility for other providers (OpenAI, Anthropic, etc.).

### Critical Findings from Current Implementation

**Current State (from AI_IMPLEMENTATION_REVIEW.md):**
- ❌ **No multi-provider architecture** - Only Google Gemini is integrated
- ❌ **No Z.ai integration** - Only Pollinations for images (non-AI provider)
- ❌ **No user-provided keys** - Only hardcoded API keys via environment variables
- ❌ **No fallback strategy** - Claimed "Gemini-First with fallback strategy" doesn't actually implement multi-provider fallback
- ❌ **No streaming for assistant** - Only transcription uses streaming
- ❌ **Basic error handling** - Simple try-catch without retry logic
- ❌ **No monitoring/observability** - No token counting, cost tracking, or metrics

### Architectural Goals

1. **User Freedom & Control**
   - Allow users to add their own API keys for any supported provider
   - Enable/disable providers per user preference
   - Support multiple providers simultaneously (e.g., Gemini for text + Z.ai for vision)

2. **Provider Abstraction**
   - Unified interface for all AI providers
   - Provider-agnostic application logic
   - Consistent request/response handling

3. **Smart Routing**
   - Automatic provider selection based on capabilities and user configuration
   - Intelligent fallback: primary → secondary → tertiary
   - Task-aware routing (e.g., Z.ai for images, Gemini for voice)

4. **Performance & Cost Optimization**
   - Streaming for all long-running operations
   - Token counting per provider
   - Response caching with provider-aware invalidation
   - Model cost optimization (use cheaper models where possible)

5. **Developer Experience**
   - Provider-agnostic debugging and monitoring
   - Comprehensive error tracking and retry logic
   - Standardized logging across all providers

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GlassyDash Application Layer                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                    User Interface & Settings Layer     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
├─────────────────────────────────────────────────────────────┤
│              Multi-Provider Abstraction Layer (AI Core)   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    Provider Adapters Layer (AI Providers) │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│              ┌────────────────────────────────────────────┐   │
├─────────────────────────────────────────────────────┤   │
│              │  Google Gemini Adapter         │  Z.ai Adapter  │  OpenAI Adapter (Future)  │
├─────────────────────────────────────────────────────┤   │   │  │  │  │  Anthropic Adapter (Future) │
│              │  │  │  │  │  │
│              └────────────────────────────────────────────┘   │
│              │  │  │  │  │  │
└───────────────────────────────────────────────────────────┘
│                                                              │
└─────────────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────────────┘
                    Database & Data Persistence Layer (SQLite + Files)
```

---

## Component Design

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
      streaming: true,
      structuredOutput: false
      systemInstructions: false
      tools: false
    embeddings: false
      functionCalling: false
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
  CODE_EXECUTION: 1 << 1, // Code interpreter/analysis
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

### 2. Provider Adapters Layer (AI Providers)

**File:** `server/ai/providers/gemini.js` (existing - enhance)

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
   * Generate content with system instructions
   */
  async generateContent(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError('Gemini', 'Provider not configured')
    }

    const { systemInstruction, includeSources, temperature, maxTokens } = options

    // Build system instruction from app-level persona
    const systemPrompt = this.buildSystemPrompt()

    const generationConfig = {
      contents: systemPrompt ? [systemPrompt] : [],
      systemInstruction: systemPrompt || undefined,
      generationConfig: {
        temperature: temperature || 0.3,
        maxOutputTokens: maxTokens || 4000,
        candidateCount: 1,
        responseMimeType: 'application/json', // Request structured output
      }
    }

    const result = await this.client.models.generateContent(generationConfig)
    
    // Parse response and sources
    const { text, finishReason } = result.response
    const citations = this.extractCitations(result.response)

    return {
      content: text,
      citations,
      model: this.modelName,
      provider: 'gemini',
      finishReason,
      usage: {
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0
      }
    }
  }

  /**
   * Generate streaming content with system instructions
   */
  async *generateContentStream(prompt, onChunk, onComplete, options = {}) {
    if (!this.isAvailable()) {
      throw new ProviderError('Gemini', 'Provider not configured')
    }

    const systemPrompt = this.buildSystemPrompt()

    const result = await this.client.models.generateContentStream({
      contents: systemPrompt ? [systemPrompt] : [],
      systemInstruction: systemPrompt || undefined,
      generationConfig: {
        temperature: options.temperature || 0.3,
        maxOutputTokens: options.maxTokens || 4000,
        responseMimeType: 'application/json'
      }
    })

    let fullResponse = ''

    for await (const chunk of result.stream) {
      const chunk = chunk.text()
      fullResponse += chunk
      
      onChunk({
        content: chunk,
        provider: 'gemini',
        isComplete: false
      })
    }

    onComplete({
      content: fullResponse,
      provider: 'gemini',
      isComplete: true,
      finishReason: result.response.candidates[0]?.finishReason
    })
  }

  /**
   * Build system prompt based on request context
   */
  buildSystemPrompt() {
    return `You are GlassyDash Intelligence Layer (GDIL), a proactive knowledge curator and research partner.
  
Your role is to maximize the utility of the user's personal knowledge base.

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

  /**
   * Transcribe audio with streaming
   */
  async transcribeAudio(audioData, options = {}) {
    if (!this.isAvailable() || !this.capabilities.AUDIO) {
      throw new ProviderError('Gemini', 'Audio not supported')
    }

    const { onChunk, onComplete } = options

    // Build transcription prompt
    const prompt = `Transcribe this audio recording accurately.
    
OUTPUT FORMAT:
{
  "transcript": "Full text of what was said",
  "summary": ["Key point 1", "Key point 2", "Key point 3"],
  "language": "detected language (e.g., en, es, fr, de, ja, zh, etc.)",
  "speakers": ["Speaker A", "Speaker B"] // if multiple detected,
  "confidence": "high/medium/low"
}

SPECIAL INSTRUCTIONS:
- Use accurate timestamps for speaker changes
- Identify different speakers if multiple voices detected
- Preserve technical terms and proper nouns
- Note any filler words, hesitation, or unclear speech
- If the audio is very short (<5s), just provide a brief summary

The transcription should be streaming and displayed in real-time as it's being generated.`

    const generationConfig = {
      contents: [{
        inlineData: {
          data: audioData,
          mimeType: audioData.mimeType || 'audio/webm'
        }
        },
        {
          text: prompt
        }
      }],
      generationConfig: {
        temperature: 0.1, // Low temperature for accurate transcription
        maxOutputTokens: 8192, // Large token limit for full transcription
        responseMimeType: 'application/json' // Request JSON output
      }
    }

    const result = await this.client.models.generateContent(generationConfig)
    
    // Parse streaming JSON
    let fullTranscript = ''
    let fullSummary = []
    let fullLanguage = ''
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      
      try {
        const parsed = JSON.parse(chunkText)
        
        if (parsed.transcript) {
          fullTranscript += parsed.transcript
        }
        if (parsed.summary) {
          if (Array.isArray(parsed.summary)) {
            fullSummary = fullSummary.concat(parsed.summary)
          } else {
            fullSummary.push(parsed.summary)
          }
        }
        
        if (parsed.language) {
          fullLanguage = parsed.language
        }
        
        onChunk({
          transcript: fullTranscript,
          summary: fullSummary,
          language: fullLanguage,
          provider: 'gemini',
          isComplete: false
        })
      } catch {
        // JSON may be incomplete, send as-is
      }
    }
    
    onComplete({
      transcript: fullTranscript,
      summary: fullSummary,
      language: fullLanguage,
      provider: 'gemini',
      isComplete: true
    })
  }

  /**
   * Generate image (for now, using Pollinations - Z.ai later)
   */
  async generateImage(prompt, options = {}) {
    if (!this.isAvailable() || !this.capabilities.IMAGES) {
      throw new ProviderError('Gemini', 'Images not supported')
    }

    // Use Pollinations.ai for image generation (zero-config, high quality)
    const pollinationsPrompt = `Generate a high-quality, professional image for: ${prompt}. 
      Style: Clean, modern, minimalist. 
      Aspect ratio: 16:9.
      No text in image.`

    const encodedPrompt = encodeURIComponent(pollinationsPrompt)
    const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${Date.now()}`
    
    return {
      imageUrl,
      provider: 'pollinations', // Will be 'z.ai' when implemented
      isComplete: true
    }
  }

module.exports = { GeminiProvider }
```

### 3. Provider Router & Manager

**File:** `server/ai/providers/router.js` (new)

```javascript
const { BaseAIProvider } = require('./base')
const { GeminiProvider } = require('./gemini')
const { ZaiProvider } = require('./zai') // To be created

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
      ['zai', { provider: ZaiProvider, config: { capabilities: { IMAGES, MULTIMODAL } }], // Will add
      ['ollama', { provider: OllamaProvider, config: { capabilities: { TEXT, AUDIO } }] // Local option
    ])
    
    // Active provider selection
    this.activeProviders = new Set(['gemini']) // Default to Gemini
    
    // Task type to provider mapping
    this.taskMapping = {
      'text-generation': ['gemini', 'zai', 'ollama'],
      'image-generation': ['zai'],
      'audio-transcription': ['gemini', 'zai'],
      'embeddings': ['gemini'],
      'code-execution': ['gemini']
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
      base_url: baseUrl
      timeout: 30000,
      headers: providerConfig.headers || {}
      rate_limit: providerConfig.rateLimit || 100
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
      // If not in use, can remove the provider instance
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
   * Select provider for a specific task
   */
  selectProviderForTask(taskType) {
    const providerTypes = this.taskMapping[taskType] || []
    
    // Find first available provider that supports this task
    for (const providerId of this.activeProviders) {
      if (!providerTypes.includes(providerId)) continue
      
      const provider = this.providers.get(providerId)
      const capabilities = this.userProviders.get(providerId).capabilities
      
      // Check if provider supports the task
      const taskCheck = this.supportsTask(taskType, capabilities)
      if (taskCheck && provider.isAvailable()) {
        console.log(`[Provider Router] Selected ${providerId} for task: ${taskType}`)
        return provider
      }
    }
    
    // Fallback to default (usually Gemini)
    console.log(`[Provider Router] Using fallback provider for task: ${taskType}`)
    return this.providers.get(this.defaultProviders.keys().next())
  }

  /**
   * Check if provider supports a specific task
   */
  supportsTask(taskType, capabilities = this.capabilities) {
    const supported = this.taskMapping[taskType] || []
    
    for (const providerId of supported) {
      const providerCaps = capabilities || {}
      
      if (taskType === 'text-generation' && providerCaps.TEXT) return true
      if (taskType === 'image-generation' && providerCaps.IMAGES) return true
      if (taskType === 'audio-transcription' && providerCaps.AUDIO) return true
      if (taskType === 'embeddings' && providerCaps.EMBEDDINGS) return true
      if (taskType === 'code-execution' && providerCaps.CODE_EXECUTION) return true
      if (taskType === 'multimodal' && providerCaps.MULTIMODAL) return true
    }
    
    return false
  }

  /**
   * Execute a task with intelligent provider selection
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
   * Execute task with streaming
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

module.exports = { ProviderRouter }
```

### 4. Z.ai Provider Adapter

**File:** `server/ai/providers/zai.js` (new)

```javascript
const { BaseAIProvider } = require('./base')
const axios = require('axios')

/**
 * Z.ai Provider Adapter
 * Implements Z.ai models (4.5 Air, 4.6, 4.7 Air) with version awareness
 * Uses configurable endpoints (not hardcoded)
 * Supports image generation, multimodal, and code execution
 */
class ZaiProvider extends BaseAIProvider {
  constructor(config) {
    super({
      ...config,
      name: 'zai',
      baseUrl: config.baseUrl || 'https://api.zai.ai/v1',
      timeout: 60000, // Z.ai can be slower
      capabilities: {
        ...ProviderCapabilities,
        IMAGES: true,
        MULTIMODAL: true,
        CODE_EXECUTION: true,
        STRUCTURED_OUTPUT: true,
        SYSTEM_INSTRUCTIONS: true,
        TOOLS: true
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
        stream: true
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
   * Generate image (Zai's specialty)
   */
  async generateImage(prompt, options = {}) {
    if (!this.isAvailable() || !this.capabilities.IMAGES) {
      throw new ProviderError('Zai', 'Provider not configured or images not supported')
    }

    try {
      // Use Zai's image generation endpoint
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
        model: this.getModelName()
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

### 5. Ollama Provider (Local AI)

**File:** `server/ai/providers/ollama.js` (existing - enhance)

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

### 6. Application API Layer

**File:** `server/ai/api.js` (enhance existing)

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
  try {
    const { question, notes, options } = req.body
    
    // Log AI request
    console.log(`[AI API] ${req.user.id} - Ask:`, question.substring(0, 50))
    
    // Execute task through provider router
    const result = await router.executeTask('text-generation', question, {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens
    })
    
    res.json({
      answer: result.result.content,
      citations: result.result.citations || [],
      model: result.result.provider,
      provider: result.result.provider,
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
  const { question, notes } = req.body
  
  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  
  try {
    const startTime = Date.now()
    
    console.log(`[AI API] ${req.user.id} - Ask Stream:`, question.substring(0, 50))
    
    await router.executeTaskStream('text-generation', question, {
      onChunk: (chunk) => {
        // Send SSE chunk
        res.write(`data: ${JSON.stringify({ chunk, isComplete: false })}\n\n`)
      },
      onComplete: (result) => {
        res.write(`data: ${JSON.stringify({ content: result.content, isComplete: true, provider: result.provider, latency: Date.now() - startTime })}\n\n`)
      },
      temperature: options?.temperature,
      maxTokens: options?.maxTokens
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
    
    const result = await router.executeTask('text-generation', `Transform the following text according to this instruction: ${instruction}
  
  // The router handles provider selection (will use Gemini)
    
    res.json({
      transformed: result.result.content,
      provider: result.result.provider
    })
  } catch (error) {
    console.error('[AI API] Transform Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Image generation endpoint
router.post('/api/ai/generate-image', auth, async (req, res) => {
  const { prompt } = req.body
    
    console.log(`[AI API] ${req.user.id} - Generate Image:`, prompt.substring(0, 50))
    
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
  
  await router.addUserProvider({ type, apiKey, baseUrl, model, options, isActive })
  
  res.json({ success: true })
})

router.delete('/api/ai/providers/:type', auth, async (req, res) => {
  const userId = req.user.id
  const { type } = req.params
  
  console.log(`[AI API] ${userId} - Remove Provider:`, type)
  
  await router.removeUserProvider(type)
  
  res.json({ success: true })
})

// Provider health check
router.get('/api/ai/health', auth, async (req, res) => {
  const userId = req.user.id
  
  // Get all provider metrics
  const metrics = await router.getAllProviderMetrics()
  res.json({ metrics })
})

router.get('/api/ai/health/:type', auth, async (req, res) => {
  const { type } = req.params
  const userId = req.user.id
  
  const health = await router.getProviderHealth(type)
  res.json(health)
})

// Status check
router.get('/api/ai/status', auth, async (req, res) => {
  const userId = req.user.id
  
  res.json({ 
    status: 'operational',
    providers: await router.getAllProviderMetrics(),
    defaultProviders: await router.defaultProviders
  })
})
```

### 7. User Settings & Preferences

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
    const rows = await this.db.prepare('SELECT type, api_key, base_url, is_active FROM user_providers WHERE user_id = ?', [userId, taskType])
    
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
      'zai': { model: 'zai-4-7' }, // Newest, most capable
      'gemini': { model: 'gemini-2.5-flash' },
      'ollama': { model: 'llama3.2:1b' }
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

  /**
   * Save user provider preference
   */
  async saveProviderPreference(db, userId, providerConfig) {
    const { type, apiKey, baseUrl, model, options, isActive = true } = providerConfig
    
    // Upsert provider configuration
    await this.db.prepare(`INSERT INTO user_providers (user_id, type, api_key, base_url, model, options, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
        ON CONFLICT(user_id) DO UPDATE SET is_active = 0, api_key = excluded(api_key), base_url = excluded(base_url) 
        WHERE user_id = ?, userId, providerConfig.type`)
    
    console.log(`[User Settings] Saved ${providerConfig.type} provider for user`, userId)
    
    return { success: true }
  }

module.exports = { UserProvider }
```

### 8. Server Configuration

**File:** `.env` updates

```bash
# AI Provider Configuration
# Primary Provider (default)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Z.ai Provider (for images)
ZAI_API_KEY=your_zai_api_key_here
ZAI_BASE_URL=https://api.zai.ai/v1  # Can configure for version

# Optional: Ollama Provider (local)
OLLAMA_ENABLED=true
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b  # Or llama3.2:3b for better quality

# AI Settings
AI_ENABLED=true  # Master switch for AI features
AI_DEFAULT_PROVIDER=gemini  # Can be gemini, zai, or ollama

# Provider Options (will be stored in database)
# These are defaults - users can override via UI
GEMINI_DEFAULT_MODEL=gemini-2.5-flash
ZAI_DEFAULT_MODEL=zai-4-7
ZAI_DEFAULT_IMAGES=4  # Number of images to generate

# Feature Flags
ENABLE_STREAMING=true
ENABLE_STRUCTURED_OUTPUT=true
ENABLE_TOOLS=false  # Function calling
ENABLE_MULTIMODAL=false  # For Z.ai

# Rate Limiting
AI_RATE_LIMIT_PER_MINUTE=100
AI_RATE_LIMIT_PER_HOUR=5000

# Monitoring
AI_DEBUG=true
```

---

## Migration Plan

### Phase 1: Foundation (Week 1-2)

1. **Create base provider interface** (`server/ai/providers/base.js`)
   - Define contract for all providers
   - Implement error handling (ProviderError)
   - Add ProviderCapabilities enum

2. **Implement provider router** (`server/ai/providers/router.js`)
   - Provider registry pattern
   - Provider instance management
   - Task routing logic
   - Health monitoring

3. **Enhance existing Gemini provider** (`server/ai/providers/gemini.js`)
   - Add system instruction support
   - Implement streaming for text generation
   - Add citation extraction
   - Add JSON mode support
   - Add function calling support

4. **Create user settings model** (`server/models/userSettings.js`)
   - Database schema for user_providers
   - Provider preference per task type
   - Provider defaults (Z.ai 4.7 for images, etc.)
   - User API endpoints for provider management

### Phase 2: Z.ai Integration (Weeks 3-4)

5. **Create Z.ai provider** (`server/ai/providers/zai.js`)
   - Implement model version detection (4.5 Air, 4.6, 4.7)
   - Add image generation endpoint
   - Implement multimodal support
   - Add structured output for images
   - Support multiple images (num_images parameter)

6. **Update AI API layer** (`server/ai/api.js`)
   - Integrate ProviderRouter
   - Replace hardcoded Gemini calls
   - Implement streaming for `/api/ai/ask-stream`
   - Add user provider management endpoints
   - Integrate health monitoring

### Phase 3: Implementation (Weeks 5-8)

7. **Frontend integration**
   - Add provider selection UI to settings
   - Add Z.ai model selection
   - Display provider-specific options
   - Show active providers and their status

8. **Testing & Monitoring**
   - Implement provider health monitoring dashboard
   - Add per-provider latency and error tracking
   - Test failover scenarios (provider goes down → Z.ai takes over)

---

## Provider Configuration Schema

### Database Schema

```sql
CREATE TABLE user_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL DEFAULT 'gemini',
  api_key TEXT NOT NULL, -- Encrypted at rest
  base_url TEXT, -- Configurable for self-hosted
  model TEXT, -- Provider-specific model (e.g., gemini-2.5-flash, zai-4-7)
  options TEXT, -- Provider-specific options (JSON)
  is_active INTEGER DEFAULT 1, -- Whether provider is active
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  FOREIGN KEY (user_id) REFERENCES users(id)
  UNIQUE (user_id, type)
);

-- Indexes
CREATE INDEX idx_user_providers_user_id_type ON user_providers(user_id, type);
CREATE INDEX idx_user_providers_type_is_active ON user_providers(type, is_active);
```

### Provider Types

```javascript
const ProviderTypes = {
  GEMINI: 'gemini',
  ZAI: 'zai',
  OLLAMA: 'ollama'
}
```

---

## Usage Examples

### Client-side: Adding a Z.ai Provider

```javascript
import { addProvider } from './api/providers'

// Add Z.ai API key
await addProvider({
  type: 'zai',
  apiKey: 'your_zai_api_key',
  baseUrl: 'https://api.zai.ai/v1' // Can use v1 for latest models
  model: 'zai-4-7', // Use 4.7 for better image generation
  options: {
    images: 4, // Generate up to 4 images at once
    isActive: true
  }
})

// Use Z.ai for images (text-generation task routes to Z.ai)
const response = await fetch('/api/ai/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Generate an image of a futuristic city',
    options: {
      model: 'zai-4-7',
      num_images: 1
    }
  })
})

const { imageUrl, provider } = response.data
console.log('Generated image:', imageUrl, 'Provider:', provider)
```

### Server-side: User Provider Management

```javascript
// Get user's Z.ai configuration
const userProviders = await UserProvider.getAllProviders(req.user.id)
const zaiProvider = userProviders.find(p => p.type === 'zai')

console.log('Z.ai providers:', userProviders)

// Get Z.ai health
const health = await router.getProviderHealth('zai')
console.log('Z.ai health:', health)
```

---

## Key Features

### 1. Multi-Provider Support
- **3 providers out-of-the-box**: Gemini, Z.ai, Ollama
- **Pluggable architecture**: Easy to add new providers
- **Intelligent routing**: Automatic provider selection based on task and capabilities
- **Unified API**: Single interface (`/api/ai/ask`) for all providers

### 2. User-Provided API Keys
- Secure storage per user
- Encrypted at rest
- User can add/remove providers in settings
- API keys never logged or exposed

### 3. Version-Aware Model Selection (Z.ai)
- Z.ai supports multiple model versions
- Router automatically detects version in options
- Defaults to newest stable (4.7)
- User can override in settings

### 4. Streaming Support
- All text generation streams via SSE
- `/api/ai/ask-stream` endpoint
- Works with all providers that support streaming

### 5. Monitoring & Observability
- Per-provider health checks
- Latency and error tracking
- Usage metrics (tokens, requests)
- Provider status dashboard

### 6. Cost Optimization
- Token counting per provider
- User can monitor usage
- Smart routing to cheapest provider for task

### 7. Provider Configuration
- Provider defaults per task type
- User can customize model selection
- Enable/disable providers per user preference

---

## Benefits Over Current Implementation

1. **User Control**
   - Users choose their preferred AI providers
   - Support for privacy-focused deployments (Ollama)
   - Flexibility to use latest models

2. **Reliability**
   - Automatic failover between providers
   - Health monitoring prevents outages
   - Redundant provider options (multiple keys)

3. **Cost Efficiency**
   - Use Z.ai for images (cheaper than Gemini for image gen)
   - Use Ollama for local text (free)
   - Smart routing reduces unnecessary API calls

4. **Developer Experience**
   - Unified debugging and logging
   - Consistent error handling across providers
   - Easy to add new providers

5. **Future-Proof**
   - Architecture designed for extensibility
   - Easy to add OpenAI, Anthropic, etc.