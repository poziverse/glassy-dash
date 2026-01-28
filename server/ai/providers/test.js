/**
 * Provider Testing
 * Tests provider functionality
 */

const { BaseAIProvider, ProviderError, ProviderCapabilities } = require('./base')
const { GeminiProvider } = require('./gemini')
const router = require('./router')

/**
 * Test Base Provider Interface
 */
async function testBaseProvider() {
  console.log('\n--- Testing Base Provider ---')
  
  const provider = new BaseAIProvider({
    name: 'test',
    apiKey: 'test-key',
    capabilities: {
      TEXT: true,
      STREAMING: true
    }
  })
  
  console.log('✓ Provider created:', provider.name)
  console.log('✓ Capabilities:', provider.capabilities)
  console.log('✓ Is available:', provider.isAvailable())
  console.log('✓ Info:', provider.getInfo())
}

/**
 * Test Gemini Provider
 */
async function testGeminiProvider() {
  console.log('\n--- Testing Gemini Provider ---')
  
  const provider = new GeminiProvider({
    apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash'
  })
  
  if (!provider.isAvailable()) {
    console.warn('⚠ Gemini provider not available (no API key)')
    return
  }
  
  try {
    console.log('✓ Provider created')
    console.log('✓ Capabilities:', provider.capabilities)
    
    // Test content generation
    console.log('\n  Testing generateContent...')
    const result = await provider.generateContent('Say hello', {
      maxTokens: 50,
      temperature: 0.3
    })
    
    console.log('✓ Generate content result:', {
      provider: result.provider,
      model: result.model,
      content: result.content.substring(0, 100) + '...',
      finishReason: result.finishReason,
      usage: result.usage
    })
    
    // Test health check
    console.log('\n  Testing health check...')
    const health = await provider.healthCheck()
    console.log('✓ Health check result:', health)
    
  } catch (error) {
    console.error('✗ Gemini provider test failed:', error.message)
  }
}

/**
 * Test Provider Router
 */
async function testProviderRouter() {
  console.log('\n--- Testing Provider Router ---')
  
  try {
    // Initialize router
    await router.initialize()
    
    console.log('✓ Router initialized')
    console.log('✓ Active providers:', router.getActiveProviders())
    console.log('✓ Task mapping:', router.getTaskMapping())
    
    // Test task execution
    if (router.isProviderActive('gemini')) {
      console.log('\n  Testing task execution...')
      
      const result = await router.executeTask('text-generation', 'Say hello from router', {
        maxTokens: 50
      })
      
      console.log('✓ Task execution result:', {
        provider: result.provider,
        latency: result.latency + 'ms',
        taskType: result.taskType,
        content: result.result.content.substring(0, 100) + '...'
      })
    }
    
    // Test metrics
    console.log('\n  Getting provider metrics...')
    const metrics = router.getAllProviderMetrics()
    console.log('✓ Provider metrics:', metrics)
    
  } catch (error) {
    console.error('✗ Router test failed:', error.message)
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('=== AI Provider Tests ===')
  console.log('Time:', new Date().toISOString())
  
  try {
    await testBaseProvider()
    await testGeminiProvider()
    await testProviderRouter()
    
    console.log('\n=== All tests completed ===')
  } catch (error) {
    console.error('\n=== Tests failed ===')
    console.error(error)
    process.exit(1)
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = {
  testBaseProvider,
  testGeminiProvider,
  testProviderRouter,
  runTests
}