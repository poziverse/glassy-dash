/**
 * AI Provider Initialization
 * Initializes the Provider Router with default providers
 */

const router = require('./providers/router')
const { GeminiProvider } = require('./providers/gemini')
const { ZaiProvider, MODEL_VERSIONS, ENDPOINTS } = require('./providers/zai')
// const { OllamaProvider } = require('./providers/ollama') // Will add later

/**
 * Initialize AI providers
 * Called during server startup
 */
async function initializeProviders() {
  console.log('[AI Providers] Initializing...')
  
  try {
    // Initialize router
    await router.initialize()
    
    // Register Gemini provider
    router.registerProvider('gemini', GeminiProvider, {
      capabilities: {
        TEXT: true,
        AUDIO: true,
        IMAGES: true,
        STREAMING: true,
        STRUCTURED_OUTPUT: true,
        SYSTEM_INSTRUCTIONS: true,
        TOOLS: true,
        MULTIMODAL: true,
        EMBEDDINGS: true,
        CODE_EXECUTION: false
      }
    })
    
    // Register Z.ai provider
    router.registerProvider('zai', ZaiProvider, MODEL_VERSIONS['4.5-air'])
    
    // Update task mapping for image generation to prefer Z.ai
    router.setTaskMapping('image-generation', ['zai', 'gemini'])
    
    // Register Ollama provider (will add later)
    // router.registerProvider('ollama', OllamaProvider, {
    //   capabilities: { ... }
    // })
    
    // Load Gemini provider with API key from environment
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
    
    if (geminiApiKey) {
      await router.addUserProvider({
        type: 'gemini',
        apiKey: geminiApiKey,
        model: 'gemini-2.5-flash',
        isActive: true
      })
      console.log('[AI Providers] ✓ Gemini provider loaded')
    } else {
      console.warn('[AI Providers] ⚠ No GEMINI_API_KEY found in environment')
    }
    
    // Load Z.ai provider with user-provided key (if available)
    const zaiApiKey = process.env.ZAI_API_KEY || process.env.VITE_ZAI_API_KEY || ''
    
    if (zaiApiKey) {
      await router.addUserProvider({
        type: 'zai',
        apiKey: zaiApiKey,
        model: MODEL_VERSIONS['4.5-air'].model,
        baseUrl: MODEL_VERSIONS['4.5-air'].baseUrl,
        isActive: true
      })
      console.log('[AI Providers] ✓ Z.ai provider loaded')
    } else {
      console.warn('[AI Providers] ⚠ No ZAI_API_KEY found in environment. User can add their own key through settings.')
    }
    
    // TODO: Initialize Ollama provider when implemented
    // TODO: Initialize additional providers when available
    
    console.log('[AI Providers] ✓ Initialization complete')
  } catch (error) {
    console.error('[AI Providers] ✗ Initialization failed:', error)
    throw error
  }
}

/**
 * Get provider router instance
 */
function getProviderRouter() {
  return router
}

module.exports = {
  initializeProviders,
  getProviderRouter
}