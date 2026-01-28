/**
 * Google Gemini Provider Adapter
 * Implements all Gemini features including system instructions, streaming, and tools
 */
const { BaseAIProvider } = require('./base')
const { GoogleGenerativeAI } = require('@google/generative-ai')

class GeminiProvider extends BaseAIProvider {
  constructor(config) {
    super({
      ...config,
      name: 'gemini',
      timeout: config.timeout || 30000,
      rateLimit: config.rateLimit || 100,
      capabilities: {
        ...config.capabilities,
        TEXT: true,
        AUDIO: true,
        IMAGES: true,
        STREAMING: true,
        STRUCTURED_OUTPUT: true,
        SYSTEM_INSTRUCTIONS: true,
        TOOLS: true,
        MULTIMODAL: true,
        EMBEDDINGS: true
      }
    })
    
    // Initialize Gemini client
    this.client = new GoogleGenerativeAI(this.apiKey)
    this.modelName = config.model || 'gemini-2.5-flash'
    
    // Cache model instance
    this.model = null
    
    console.log(`[Gemini Provider] Initialized with model: ${this.modelName}`)
  }

  /**
   * Check if provider is available
   * @returns {boolean} - True if Gemini is configured
   */
  isAvailable() {
    return !!this.apiKey && !!this.client
  }

  /**
   * Get model instance (lazy-loaded)
   * @returns {GenerativeModel} - The Gemini model instance
   */
  getModel() {
    if (!this.model) {
      this.model = this.client.getGenerativeModel({ model: this.modelName })
    }
    return this.model
  }

  /**
   * Build system prompt based on request context
   * @returns {string} - The system prompt for the current request
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
   * @param {Object} response - The Gemini response object
   * @returns {Array} - Array of citations
   */
  extractCitations(response) {
    const citations = []
    const parts = response?.candidates?.[0]?.content?.parts || []
    
    for (const part of parts) {
      // Look for citations in text
      const citationRegex = /\[(.*?)\]\((?:.*?)\)/g
      const matches = part.text?.matchAll(citationRegex) || []
      
      for (const match of matches) {
        citations.push({
          id: match[1],
          title: match[2] || 'Untitled',
          snippet: part.text?.substring(0, 200)
        })
      }
      
      // Look for function calls (tools)
      if (part.executableFunction?.name) {
        const args = part.executableFunction?.args
        
        if (args) {
          const functionCall = {
            type: part.executableFunction.name,
            args
          }
          
          // Extract source from citation in function call
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
    }
    
    return citations
  }

  /**
   * Generate content (text, audio, images)
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generation result
   */
  async generateContent(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Gemini Provider not configured or not available')
    }

    const { temperature = 0.3, maxTokens = 4000, includeSources = false } = options
    const model = this.getModel()

    try {
      const generationConfig = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt }
            ]
          }
        ],
        systemInstruction: this.buildSystemPrompt(),
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          candidateCount: 1,
          responseMimeType: 'application/json', // Request structured output
        }
      }

      const result = await model.generateContent(generationConfig)
      
      // Parse response
      const { text, finishReason } = result.response
      const citations = includeSources ? this.extractCitations(result.response) : []
      
      return {
        content: text,
        citations,
        model: this.modelName,
        provider: 'gemini',
        finishReason,
        usage: {
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          completionTokens: result.response.usageMetadata?.candidatesTokenCount?.[0] || 0
        }
      }
    } catch (error) {
      console.error('[Gemini Provider] generateContent error:', error)
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
      throw new Error('Gemini Provider not configured or not available')
    }

    const { temperature = 0.3, maxTokens = 4000 } = options
    const model = this.getModel()

    try {
      const result = await model.generateContentStream({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt }
            ]
          }
        ],
        systemInstruction: this.buildSystemPrompt(),
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          candidateCount: 1,
          responseMimeType: 'application/json'
        }
      })

      let fullResponse = ''

      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullResponse += chunkText
        
        onChunk({
          content: chunkText,
          provider: 'gemini',
          isComplete: false
        })
      }

      const finishReason = await result.response.candidates[0]?.finishReason
      const citations = this.extractCitations(result.response)
      
      onComplete({
        content: fullResponse,
        citations,
        provider: 'gemini',
        isComplete: true,
        finishReason,
        usage: {
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
          promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
          completionTokens: result.response.usageMetadata?.candidatesTokenCount?.[0] || 0
        }
      })
    } catch (error) {
      console.error('[Gemini Provider] generateContentStream error:', error)
      throw error
    }
  }

  /**
   * Generate embeddings
   * @param {string} content - The content to embed
   * @param {Object} options - Embedding options
   * @returns {Promise<Object>} - Embedding result
   */
  async generateEmbeddings(content, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Gemini Provider not configured or not available')
    }

    const model = this.getModel()

    try {
      // For embeddings, use text-embedding-004 model
      const embeddingModel = this.client.getGenerativeModel({ model: 'text-embedding-004' })
      
      const result = await embeddingModel.embedContent(content)
      
      return {
        embeddings: result.embedding.values,
        model: 'text-embedding-004',
        provider: 'gemini',
        usage: {
          totalTokens: result.usageMetadata?.totalTokenCount || 0
        }
      }
    } catch (error) {
      console.error('[Gemini Provider] generateEmbeddings error:', error)
      throw error
    }
  }

  /**
   * Count tokens
   * @param {string} content - The content to count tokens for
   * @param {Object} options - Token counting options
   * @returns {Promise<number>} - Token count
   */
  async countTokens(content, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Gemini Provider not configured or not available')
    }

    const model = this.getModel()

    try {
      const result = await model.countTokens({ contents: [{ parts: [{ text: content }] }] })
      
      return result.totalTokens || 0
    } catch (error) {
      console.error('[Gemini Provider] countTokens error:', error)
      throw error
    }
  }

  /**
   * Transcribe audio with streaming
   * @param {Buffer|Object} audioData - The audio data to transcribe
   * @param {Object} options - Transcription options
   * @returns {Promise<Object>} - Transcription result
   */
  async transcribeAudio(audioData, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Gemini Provider not configured or not available')
    }

    const { onChunk, onComplete } = options
    const model = this.getModel()

    try {
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
        contents: [
          {
            inlineData: {
              data: Buffer.isBuffer(audioData) ? audioData.toString('base64') : audioData.data,
              mimeType: audioData.mimeType || 'audio/webm'
            }
          },
          {
            text: prompt
          }
        ],
        generationConfig: {
          temperature: 0.1, // Low temperature for accurate transcription
          maxOutputTokens: 8192, // Large token limit for full transcription
          responseMimeType: 'application/json' // Request JSON output
        }
      }

      const result = await model.generateContentStream(generationConfig)
      
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
        } catch (e) {
          // JSON may be incomplete, continue
        }
      }
      
      onComplete({
        transcript: fullTranscript,
        summary: fullSummary,
        language: fullLanguage,
        provider: 'gemini',
        isComplete: true,
        usage: {
          totalTokens: result.response.usageMetadata?.totalTokenCount || 0
        }
      })
    } catch (error) {
      console.error('[Gemini Provider] transcribeAudio error:', error)
      throw error
    }
  }

  /**
   * Generate image (currently uses Pollinations, will use Z.ai in future)
   * @param {string} prompt - The image prompt
   * @param {Object} options - Image generation options
   * @returns {Promise<Object>} - Image generation result
   */
  async generateImage(prompt, options = {}) {
    if (!this.isAvailable()) {
      throw new Error('Gemini Provider not configured or not available')
    }

    try {
      // For now, use Pollinations.ai for image generation (zero-config, high quality)
      // TODO: Switch to Z.ai when provider is available
      const pollinationsPrompt = `Generate a high-quality, professional image for: ${prompt}. 
Style: Clean, modern, minimalist. 
Aspect ratio: 16:9.
No text in image.`

      const encodedPrompt = encodeURIComponent(pollinationsPrompt)
      const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=768&nologo=true&seed=${Date.now()}`
      
      return {
        imageUrl,
        provider: 'pollinations', // Will be 'zai' when implemented
        model: this.modelName,
        isComplete: true
      }
    } catch (error) {
      console.error('[Gemini Provider] generateImage error:', error)
      throw error
    }
  }

  /**
   * Health check
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    try {
      const startTime = Date.now()
      
      // Simple connectivity check
      await this.generateContent('ping', {
        maxTokens: 10
      })
      
      const latency = Date.now() - startTime
      
      return {
        status: 'healthy',
        latency,
        model: this.modelName,
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
}

module.exports = { GeminiProvider }