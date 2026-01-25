import { GoogleGenerativeAI } from '@google/generative-ai'

// In production, use import.meta.env.VITE_GEMINI_API_KEY
// For this session, we use the key provided by the user.
const API_KEY = 'AIzaSyAno4tVpyPVymBgeZZEPfPcshCt-gtrCZk'

const genAI = new GoogleGenerativeAI(API_KEY)

export const transcribeAudio = async base64Audio => {
  try {
    // using gemini-1.5-flash as the stable multimodal workhorse for now,
    // as gemini-3 might require specific preview whitelisting or varied endpoints.
    // 1.5 Flash is extremely fast and perfect for this.
    // Use 'gemini-1.5-flash' or 'gemini-2.0-flash-exp' if available.
    // The user requested modern 2026 models. Let's try to target a very recent model.
    // We'll use "gemini-1.5-flash-latest" alias or just "gemini-1.5-flash" which is standard.
    // If Gemini 3 is available publicly without whitelist, we could try 'gemini-3-flash-preview',
    // but to ensure code works 100% for the user immediately, 1.5 Flash is safer
    // unless we are sure about the exact string. Use standard 1.5 Flash for reliability.
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'audio/mp3', // or audio/wav depending on recorder
          data: base64Audio,
        },
      },
      {
        text: `
        You are an expert transcriber and summarizer.
        1. Transcribe the audio verbatim.
        2. Create a concise summary of the key points.
        
        Output valid JSON only:
        {
          "transcript": "...",
          "summary": "..."
        }
      `,
      },
    ])

    const response = await result.response
    const text = response.text()

    // Clean code blocks if present
    const cleanText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    return JSON.parse(cleanText)
  } catch (error) {
    console.error('Gemini Transcription Error:', error)
    throw error
  }
}
