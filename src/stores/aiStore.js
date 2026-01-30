import { create } from 'zustand'
import { api } from '../lib/api'

/**
 * AI Assistant Store
 * Manages state for the AI Assistant sidebar
 */
export const useAiStore = create((set, get) => ({
  // Panel state
  isOpen: false,
  isLoading: false,

  // Chat state
  messages: [],

  // Context
  contextNote: null,
  suggestions: [],

  // Actions
  toggle: () => set(state => ({ isOpen: !state.isOpen })),
  setOpen: open => set({ isOpen: open }),

  setLoading: loading => set({ isLoading: loading }),

  addMessage: (role, content, metadata = {}) =>
    set(state => ({
      messages: [
        ...state.messages,
        {
          id: Date.now(),
          role,
          content,
          metadata, // Store tools/actions here
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  clearMessages: () => set({ messages: [] }),

  setContextNote: note => set({ contextNote: note }),

  setSuggestions: suggestions => set({ suggestions }),

  clearSuggestions: () => set({ suggestions: [] }),

  // Ask AI helper
  askAi: async (question, notes = []) => {
    const store = get()

    // Add user message
    store.addMessage('user', question)
    store.setLoading(true)

    try {
      const data = await api('/ai/ask', {
        method: 'POST',
        body: { question, notes },
      })

      // Support both legacy string response and new object response
      const answerText = typeof data.answer === 'object' ? data.answer.text : data.answer
      const tools = data.tools || (typeof data.answer === 'object' ? data.answer.tools : [])

      store.addMessage('assistant', answerText, { tools })
      return answerText
    } catch (error) {
      console.error('AI Error:', error)
      store.addMessage('assistant', 'Sorry, I encountered an error. Please try again.')
      throw error
    } finally {
      store.setLoading(false)
    }
  },

  // Create note from chat content
  createNoteFromChat: async content => {
    const store = get()
    store.setLoading(true)

    try {
      // Use standard notes creation endpoint
      const data = await api('/notes', {
        method: 'POST',
        body: {
          title: 'AI Insight', // Default title
          content: content,
          type: 'text',
          tags: ['ai-generated'],
        },
      })

      // Notify user
      store.addMessage('assistant', `✓ Saved to notes as "${data.title}"`)

      // Ideally we would refresh notes here, but that happens via invalidation elsewhere
      return data
    } catch (error) {
      console.error('Create note error:', error)
      store.addMessage('assistant', 'Error saving note. Please try again.')
    } finally {
      store.setLoading(false)
    }
  },

  // Transform text (Inline AI)
  transformText: async (text, instruction) => {
    // Don't set global loading state to avoid sidebar spinner
    // Let the component handle local loading state

    try {
      const data = await api('/ai/transform', {
        method: 'POST',
        body: { text, instruction },
      })

      return data.transformed
    } catch (error) {
      console.error('Transform error:', error)
      throw error
    }
  },

  // Generate Image
  generateImage: async prompt => {
    try {
      const data = await api('/ai/generate-image', {
        method: 'POST',
        body: { prompt },
      })

      return data.imageUrl
    } catch (error) {
      console.error('Image Gen Error:', error)
      throw error
    }
  },
}))
