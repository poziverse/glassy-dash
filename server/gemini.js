/**
 * Server-side Gemini AI Integration
 * Primary AI provider for GlassyDash (works on hosted deployments)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai')

// Accept both VITE_ prefixed (for local dev sharing) and unprefixed (for server-only)
const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''

let genAI = null
let model = null

// Model versions in order of preference
const PRIMARY_MODEL = 'gemini-2.5-flash'
const FALLBACK_MODEL = 'gemini-2.0-flash'

/**
 * Initialize Gemini client (lazy initialization)
 */
function initGemini() {
  if (!API_KEY) {
    console.warn('[Gemini Server] No API key found. Set GEMINI_API_KEY in .env')
    return false
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY)
    model = genAI.getGenerativeModel({ model: PRIMARY_MODEL })
    console.log('[Gemini Server] ✓ Initialized with', PRIMARY_MODEL)
  }

  return true
}

/**
 * Check if Gemini is available
 */
function isGeminiAvailable() {
  return !!API_KEY
}

/**
 * Generate text with Gemini
 * Uses fallback models if primary fails
 */
async function generateText(prompt, options = {}) {
  if (!initGemini()) {
    throw new Error('Gemini API key not configured')
  }

  const { maxTokens = 200, temperature = 0.3 } = options

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature,
      },
    })

    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('[Gemini Server] Error with primary model:', error.message)

    // Try fallback model
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL })
      const result = await fallbackModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: temperature,
        },
      })

      const response = await result.response
      return response.text()
    } catch (fallbackError) {
      console.error('[Gemini Server] Fallback also failed:', fallbackError.message)
      throw fallbackError
    }
  }
}

/**
 * Answer a question about notes using Gemini (RAG-style)
 */
async function answerQuestion(question, notesContext) {
  // Massive Context Window: 2.5 Flash can handle huge context, but we limit to 100 for latency balance
  const contextText = notesContext
    .slice(0, 100)
    .map(n => `ID: ${n.id}\nTITLE: ${n.title}\nCONTENT: ${n.content.substring(0, 5000)}`) // Increased content limit per note
    .join('\n\n---\n\n')

  const prompt = `You are the GlassyDash Intelligence Layer (GDIL), a proactive knowledge curator and research partner.
Your goal is to maximize the utility of the user's personal knowledge base.

CONTEXT PROTOCOL:
You have access to the user's notes in the following structure:
[ID] Title: Content...

NOTES CONTEXT:
${contextText}

USER QUERY: ${question}

CORE CAPABILITIES:
1. THE CURATOR: When asked about existing notes, synthesize information across multiple notes. Cite sources using [Note Title](ID) format.
2. THE EDITOR: When asked to clean/format, transform raw text into structured Markdown. Be invisible (no chatty filler).
3. THE ARCHITECT: When asked to brainstorm, generate new content grounded in existing knowledge.

INSTRUCTION SET 2.5 (GEMINI OPTIMIZED):
- **Whole-Brain Reasoning**: Read *between* the notes. Find logical connections across the entire context.
- **Proactive Suggestions**: If you see a note that contradicts another, mention it.
- **Citation is Mandatory**: Every claim based on a note must link to it using [Note Title](ID).
- **Virtual Tools**: To trigger actions, place these tags on a separate line at the END of your response:
  - [SUGGEST_TITLE: New Title]
  - [DETECTED_TASK: Task Description]
  - [RELATED_NOTE: ID]
  - [GENERATE_IMAGE: Visual Description of image to create]

NEGATIVE CONSTRAINTS:
- NEVER make up facts about the user's life.
- NEVER correspond in a conversational filler style ("Sure, I can help..."). Start immediately with value.
- Keep response concise and strictly Markdown formatted.

RESPONSE:`

  const response = await generateText(prompt, { maxTokens: 4000, temperature: 0.3 })
  const rawText = response.trim()

  // Parse Virtual Tools
  const tools = []
  const lines = rawText.split('\n')
  const cleanLines = []

  const toolRegex = /^\[(SUGGEST_TITLE|DETECTED_TASK|RELATED_NOTE|GENERATE_IMAGE):\s*(.+)\]$/

  for (const line of lines) {
    const match = line.trim().match(toolRegex)
    if (match) {
      tools.push({ type: match[1], value: match[2].trim() })
    } else {
      cleanLines.push(line)
    }
  }

  return {
    text: cleanLines.join('\n').trim(),
    tools,
  }
}

/**
 * Transform text based on instructions (for inline editor AI)
 * Returns ONLY the transformed text, no chat.
 */
async function transformText(text, instruction) {
  const prompt = `You are a text editing engine.
YOUR TASK: Transform the INPUT TEXT according to the INSTRUCTION.
CONSTRAINT: Return ONLY the transformed text. Do not add quotes, markdown blocks, or conversational filler.

INSTRUCTION: ${instruction}

INPUT TEXT:
${text}`

  const response = await generateText(prompt, { maxTokens: 2000, temperature: 0.3 })
  return response.trim()
}

/**
 * Generate an image using Pollinations.ai (Zero-Config)
 * Returns a URL
 */
async function generateImage(prompt) {
  // Use Pollinations.ai for zero-config, high-quality Stable Diffusion generation
  // It effectively acts as a reliable proxy to various models
  const encodedPrompt = encodeURIComponent(prompt)
  const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=800&height=600&seed=${Math.floor(Math.random() * 1000)}`
  return Promise.resolve(imageUrl)
}

module.exports = {
  isGeminiAvailable,
  initGemini,
  generateText,
  answerQuestion,
  transformText,
  generateImage,
}
