/**
 * AI Assistant Routes - Enhanced with User Provider Management
 * Integrates new Provider Router backend
 * Supports user-provided API keys for multiple AI services
 */

const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

// Import new Provider Router
const providerRouter = require('../ai/init')

// Import User Settings Model
const userSettings = require('../models/userSettings')

const nowISO = () => new Date().toISOString()

// ---------- AI Assistant (using new Provider Router) ----------

/**
 * POST /api/ai/ask
 * Ask ’ AI assistant a question about notes
 * Now uses ’ new multi-provider Provider Router (with intelligent fallback)
 */
router.post('/ask', auth, async (req, res) => {
  try {
    const { question, notes, options, provider: preferredProvider } = req.body || {}

    console.log(`[AI Router] ${req.user.id} - Ask:`, question.substring(0, 50))

    // Get provider router instance
    const router = providerRouter.getProviderRouter()

    // Get user's configured provider settings
    const userProviders = await userSettings.getAllUserProviders(req.user.id)
    
    // If user has specific provider preference, use it
    if (preferredProvider && userProviders.some(p => p.providerType === preferredProvider)) {
      // User wants to use a specific provider
      // Note: In a full implementation, we would select the user's instance
      console.log(`[AI Router] User prefers provider: ${preferredProvider}`)
    }

    // Execute task through provider router (now with intelligent fallback)
    const result = await router.executeTask('text-generation', question, {
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      preferredProvider // Pass preference to router
    })

    res.json({
      answer: result.result.content,
      citations: result.result.citations || [],
      model: result.result.model,
      provider: result.provider, // Now returns which provider was used
      finishReason: result.result.finishReason,
      usage: result.result.usage,
      latency: result.latency,
      userProviders: userProviders.map(p => p.providerType) // Return user's configured providers
    })
  } catch (error) {
    console.error('[AI Router] Ask Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/ai/ask-stream
 * Streaming endpoint for AI assistant
 * Uses Server-Sent Events (SSE) for real-time streaming
 */
router.post('/ask-stream', auth, async (req, res) => {
  const { question, notes, options, provider: preferredProvider } = req.body || {}

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    console.log(`[AI Router] ${req.user.id} - Ask Stream:`, question.substring(0, 50))
    const startTime = Date.now()

    // Get provider router instance
    const router = providerRouter.getProviderRouter()

    // Execute task stream through provider router
    await router.executeTaskStream('text-generation', question, {
      onChunk: (chunk) => {
        // Send SSE chunk
        res.write(`data: ${JSON.stringify({ 
          chunk, 
          isComplete: false 
        })}\n\n`)
      },
      onComplete: (result) => {
        // Send final SSE message with complete result
        res.write(`data: ${JSON.stringify({ 
          content: result.content, 
          isComplete: true, 
          provider: result.provider, 
          latency: Date.now() - startTime 
        })}\n\n`)
      },
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
      preferredProvider
    })
  } catch (error) {
    console.error('[AI Router] Ask Stream Error:', error)

    // Write error as final SSE message
    res.write(`data: ${JSON.stringify({ 
      error: error.message, 
      isComplete: true 
    })}\n\n`)
    res.end()
  }
})

/**
 * POST /api/ai/transform
 * Transform text according to instructions (for inline editor AI)
 * Now uses Ò new Provider Router
 */
router.post('/transform', auth, async (req, res) => {
  const { text, instruction, provider: preferredProvider } = req.body || {}

  try {
    console.log(`[AI Router] ${req.user.id} - Transform:`, instruction.substring(0, 30))

    // Get provider router instance
    const router = providerRouter.getProviderRouter()

    // Execute transform task through provider router
    const result = await router.executeTask('text-generation', `Transform Ò following text according to this instruction: ${instruction}

INPUT TEXT:
${text}`, { preferredProvider })

    res.json({
      transformed: result.result.content,
      provider: result.provider,
      latency: result.latency
    })
  } catch (error) {
    console.error('[AI Router] Transform Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/ai/generate-image
 * Generate an image based on a prompt
 * Routes Ò Z.ai provider for images (better quality than Pollinations)
 */
router.post('/generate-image', auth, async (req, res) => {
  const { prompt, provider: preferredProvider } = req.body || {}

  try {
    console.log(`[AI Router] ${req.user.id} - Generate Image:`, prompt.substring(0, 50))

    // Get provider router instance
    const router = providerRouter.getProviderRouter()

    // Execute image generation task through provider router
    // Router will automatically select Z.ai for image-generation task
    const result = await router.executeTask('image-generation', prompt, {
      preferredProvider
    })

    res.json({
      imageUrl: result.result.imageUrl,
      provider: result.provider,
      latency: result.latency
    })
  } catch (error) {
    console.error('[AI Router] Generate Image Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/ai/transcribe
 * Transcribe audio ’ text
 * Routes Ò Gemini provider for audio transcription
 */
router.post('/transcribe', auth, async (req, res) => {
  try {
    const { audioData, provider: preferredProvider } = req.body || {}

    console.log(`[AI Router] ${req.user.id} - Transcribe audio`)

    // Get provider router instance
    const router = providerRouter.getProviderRouter()

    // Execute audio transcription task through provider router
    const result = await router.executeTask('audio-transcription', audioData, {
      onChunk: (chunk) => {
        // For now, we just log chunks - could use SSE in future
        console.log('[AI Router] Transcription chunk:', chunk.transcript?.substring(0, 50))
      },
      onComplete: (result) => {
        console.log('[AI Router] Transcription complete:', {
          transcript: result.transcript?.substring(0, 100),
          summary: result.summary
        })
      },
      preferredProvider
    })

    res.json({
      transcript: result.result.transcript,
      summary: result.result.summary,
      language: result.result.language,
      provider: result.provider,
      latency: result.latency
    })
  } catch (error) {
    console.error('[AI Router] Transcribe Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ---------- Provider Management (user configuration) ----------

/**
 * GET /api/ai/providers
 * Get all configured providers for ’ current user
 */
router.get('/providers', auth, async (req, res) => {
  try {
    console.log(`[AI Router] ${req.user.id} - Getting providers`)

    // Get user's configured providers
    const providers = await userSettings.getAllUserProviders(req.user.id)
    
    // Get provider router for additional info
    const router = providerRouter.getProviderRouter()
    const activeProviders = router.getActiveProviders()
    const registeredProviders = router.getRegisteredProviders()

    res.json({
      providers, // User's configured providers
      active: activeProviders,
      registered: registeredProviders
    })
  } catch (error) {
    console.error('[AI Router] Get Providers Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/ai/providers/add
 * Add a user-provided AI provider configuration
 */
router.post('/providers/add', auth, async (req, res) => {
  const { type, apiKey, baseUrl, model, options, isActive = true } = req.body || {}

  try {
    console.log(`[AI Router] ${req.user.id} - Adding ${type} provider`)

    // Add user provider through settings model
    const provider = await userSettings.setUserProvider(req.user.id, {
      providerType: type,
      apiKey,
      model,
      baseUrl,
      options: options ? JSON.stringify(options) : null,
      isActive: isActive ? 1 : 0
    })

    // Also add to provider router
    const router = providerRouter.getProviderRouter()
    await router.addUserProvider({
      type,
      apiKey,
      model,
      baseUrl,
      isActive: isActive ? 1 : 0
    })

    res.json({ 
      success: true, 
      provider 
    })
  } catch (error) {
    console.error('[AI Router] Add Provider Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * DELETE /api/ai/providers/:type
 * Remove a user-provided AI provider configuration
 */
router.delete('/providers/:type', auth, async (req, res) => {
  const { type } = req.params

  try {
    console.log(`[AI Router] ${req.user.id} - Removing ${type} provider`)

    // Remove user provider through settings model
    await userSettings.removeUserProvider(req.user.id, type)

    // Also remove from provider router
    const router = providerRouter.getProviderRouter()
    await router.removeUserProvider(type)

    res.json({ success: true, type })
  } catch (error) {
    console.error('[AI Router] Remove Provider Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PUT /api/ai/providers/:type/activate
 * Set a specific provider as active (only one per type)
 */
router.put('/providers/:type/activate', auth, async (req, res) => {
  const { type } = req.params
  const { providerId } = req.body || {}

  try {
    console.log(`[AI Router] ${req.user.id} - Activating ${type} provider (ID: ${providerId})`)

    // Set provider as active (deactivates all others of same type)
    await userSettings.setActiveProvider(req.user.id, type, providerId)

    res.json({ success: true, type, providerId })
  } catch (error) {
    console.error('[AI Router] Activate Provider Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PUT /api/ai/providers/:type/deactivate
 * Deactivate a specific provider
 */
router.put('/providers/:type/deactivate', auth, async (req, res) => {
  const { type } = req.params

  try {
    console.log(`[AI Router] ${req.user.id} - Deactivating ${type} provider`)

    // Deactivate all providers of this type
    await userSettings.setActiveProvider(req.user.id, type, null)

    res.json({ success: true, type })
  } catch (error) {
    console.error('[AI Router] Deactivate Provider Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PUT /api/ai/providers/:providerId
 * Update a user's provider configuration
 */
router.put('/providers/:providerId', auth, async (req, res) => {
  const { providerId } = req.params
  const { apiKey, model, options, baseUrl, isActive } = req.body || {}

  try {
    console.log(`[AI Router] ${req.user.id} - Updating provider ${providerId}`)

    // Get current provider settings
    const currentProvider = await userSettings.getUserProviderSettings(req.user.id, providerId?.split(':')[0])

    if (!currentProvider) {
      return res.status(404).json({ error: 'Provider not found' })
    }

    // Update user provider through settings model
    await userSettings.setUserProvider(req.user.id, {
      providerType: currentProvider.providerType,
      apiKey,
      model: model || currentProvider.model,
      baseUrl: baseUrl || currentProvider.baseUrl,
      options: options ? JSON.stringify(options) : null,
      isActive: isActive !== undefined ? (isActive ? 1 : 0) : currentProvider.isActive
    })

    // Update in provider router
    const router = providerRouter.getProviderRouter()
    await router.addUserProvider({
      type: currentProvider.providerType,
      apiKey,
      model: model || currentProvider.model,
      baseUrl: baseUrl || currentProvider.baseUrl,
      isActive: isActive !== undefined ? (isActive ? 1 : 0) : currentProvider.isActive
    })

    // Return updated provider settings
    const updatedProvider = await userSettings.getUserProviderSettings(req.user.id, currentProvider.providerType)

    // Mask API key in response
    const maskedProvider = { ...updatedProvider, apiKey: '***' }

    res.json({ success: true, provider: maskedProvider })
  } catch (error) {
    console.error('[AI Router] Update Provider Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/ai/providers/:type
 * Get a specific user's provider configuration (masked API key)
 */
router.get('/providers/:type', auth, async (req, res) => {
  try {
    console.log(`[AI Router] ${req.user.id} - Getting ${req.params.type} provider`)

    const provider = await userSettings.getUserProviderSettings(req.user.id, req.params.type)

    if (!provider) {
      return res.status(404).json({ error: 'Provider not configured' })
    }

    // Mask API key in response
    const maskedProvider = { ...provider, apiKey: '***' }

    res.json(maskedProvider)
  } catch (error) {
    console.error('[AI Router] Get Provider Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/ai/providers/settings
 * Get all user's AI provider settings
 */
router.get('/providers/settings', auth, async (req, res) => {
  try {
    console.log(`[AI Router] ${req.user.id} - Getting all provider settings`)

    const settings = await userSettings.getAllUserSettings(req.user.id)

    res.json({ settings })
  } catch (error) {
    console.error('[AI Router] Get Provider Settings Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ---------- Health Monitoring ----------

/**
 * GET /api/ai/health
 * Get health status for all providers
 */
router.get('/health', auth, async (req, res) => {
  try {
    const router = providerRouter.getProviderRouter()
    const metrics = router.getAllProviderMetrics()
    const healthPromises = []

    // Get health status for each provider type
    const activeProviders = await userSettings.getAllUserProviders(req.user.id)
    
    for (const provider of activeProviders) {
      healthPromises.push(
        router.getProviderHealth(provider.providerType).catch(err => ({
          type: provider.providerType,
          status: 'error',
          error: err.message
        }))
      )
    }

    const results = await Promise.all(healthPromises)

    // Add router's internal health (environment providers)
    results.push(...Object.values(metrics))

    res.json({ 
      providers: results
    })
  } catch (error) {
    console.error('[AI Router] Get Health Error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/ai/health/:type
 * Get health status for a specific provider
 */
router.get('/health/:type', auth, async (req, res) => {
  try {
    const { type } = req.params
    console.log(`[AI Router] ${req.user.id} - Getting health for ${type}`)

    const router = providerRouter.getProviderRouter()
    const health = await router.getProviderHealth(type)

    res.json(health)
  } catch (error) {
    console.error('[AI Router] Get Provider Health Error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ---------- Status Check (existing endpoint - now uses new Provider Router) ----------

/**
 * GET /api/ai/status
 * Check AI status - now uses new Provider Router
 */
router.get('/status', auth, async (req, res) => {
  try {
    const router = providerRouter.getProviderRouter()
    const activeProviders = router.getActiveProviders()
    const registeredProviders = router.getRegisteredProviders()
    const metrics = router.getAllProviderMetrics()

    // Get user's configured providers
    const userProviders = await userSettings.getAllUserProviders(req.user.id)

    res.json({ 
      status: 'operational',
      providers: activeProviders,
      registered: registeredProviders,
      metrics,
      userProviders: userProviders.map(p => p.providerType),
      environmentProviders: activeProviders.filter(p => {
        // Environment providers are those configured in .env, not user-provided
        return !userProviders.some(up => up.providerType === p.providerType)
      })
    })
  } catch (error) {
    console.error('[AI Router] Status Error:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router