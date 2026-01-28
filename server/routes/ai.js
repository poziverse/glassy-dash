const express = require('express')
const router = express.Router()
const gemini = require('../gemini')
const jwt = require('jsonwebtoken')
const path = require('path')
// Note: We inherit process.env from index.js, so no need to reload dotenv here,
// which avoids the "dev vs prod" secret key mismatch issue.

const auth = require('../middleware/auth')

// Initialize Gemini if possible
gemini.initGemini()

// POST /api/ai/ask
router.post('/ask', auth, async (req, res) => {
  try {
    const { question, notes } = req.body

    if (!question) {
      return res.status(400).json({ error: 'Question is required' })
    }

    if (!gemini.isGeminiAvailable()) {
      return res.status(503).json({ error: 'AI service not configured' })
    }

    const answer = await gemini.answerQuestion(question, notes || [])
    res.json({ answer })
  } catch (err) {
    console.error('AI Ask Error:', err)
    res.status(500).json({ error: 'Failed to get answer' })
  }
})

// POST /api/ai/transform
router.post('/transform', auth, async (req, res) => {
  try {
    const { text, instruction } = req.body

    if (!text || !instruction) {
      return res.status(400).json({ error: 'Text and instruction are required' })
    }

    if (!gemini.isGeminiAvailable()) {
      return res.status(503).json({ error: 'AI service not configured' })
    }

    const transformed = await gemini.transformText(text, instruction)
    res.json({ transformed })
  } catch (err) {
    console.error('AI Transform Error:', err)
    res.status(500).json({ error: 'Failed to transform tex' })
  }
})

// POST /api/ai/generate-image
router.post('/generate-image', auth, async (req, res) => {
  try {
    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Since we use Pollinations (Zero-Config), we don't strictly require Gemini key
    // But logically this is an AI feature
    const imageUrl = await gemini.generateImage(prompt)
    res.json({ imageUrl })
  } catch (err) {
    console.error('AI Image Gen Error:', err)
    res.status(500).json({ error: 'Failed to generate image' })
  }
})

// Routes for cleanup/analysis can be added here
// Currently all logic is handled via /ask acting as a general assistant

module.exports = router
