import { GoogleGenerativeAI } from '@google/generative-ai'

// In production, use import.meta.env.VITE_GEMINI_API_KEY
// For this session, we use the key provided by the user.
const API_KEY = 'AIzaSyAno4tVpyPVymBgeZZEPfPcshCt-gtrCZk'

const genAI = new GoogleGenerativeAI(API_KEY)

export const transcribeAudio = async base64Audio => {
  try {
    // using gemini-1.5-flash as stable multimodal workhorse for now,
    // as gemini-3 might require specific preview whitelisting or varied endpoints.
    // 1.5 Flash is extremely fast and perfect for this.
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'audio/webm', // or audio/mp3 depending on recorder
          data: base64Audio,
        },
      },
      {
        text: `
        You are an expert transcriber and summarizer.
        1. Transcribe audio verbatim.
        2. Create a concise summary of key points.
        
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

/**
 * Streaming transcription with real-time partial results
 * Provides better UX for long recordings
 */
export const transcribeAudioStream = async (base64Audio, onChunk, onComplete, onError) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContentStream([
      {
        inlineData: {
          mimeType: 'audio/webm',
          data: base64Audio,
        },
      },
      {
        text: `
        You are an expert transcriber and summarizer.
        1. Transcribe audio verbatim as you hear it.
        2. Create a concise summary of key points.
        
        Output valid JSON only. Stream the transcript incrementally:
        {
          "transcript": "...",
          "summary": "..."
        }
      `,
      },
    ])

    let fullResponse = ''
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      fullResponse += chunkText
      
      // Try to parse partial JSON (may be incomplete)
      try {
        // Remove code blocks if present
        const cleanText = fullResponse
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim()
        
        // Try to parse as JSON
        const parsed = JSON.parse(cleanText)
        
        // Call onChunk with partial results
        if (parsed.transcript) {
          onChunk({
            transcript: parsed.transcript,
            summary: parsed.summary || '',
            isComplete: false
          })
        }
      } catch (parseError) {
        // JSON might be incomplete, that's okay - continue accumulating
        // Just send the raw text for display
        onChunk({
          transcript: cleanText,
          summary: '',
          isComplete: false,
          isRaw: true
        })
      }
    }

    // Final parse when streaming is complete
    const finalClean = fullResponse
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    
    const finalResult = JSON.parse(finalClean)
    
    // Call onComplete with final results
    onComplete({
      transcript: finalResult.transcript || '',
      summary: finalResult.summary || '',
      isComplete: true
    })
    
  } catch (error) {
    console.error('Gemini Streaming Transcription Error:', error)
    onError(error)
    throw error
  }
}