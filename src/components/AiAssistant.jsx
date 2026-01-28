import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  X,
  Send,
  Tag,
  FileText,
  Loader2,
  Trash2,
  Plus,
  Wand2,
  Layers,
  CheckCircle2,
} from 'lucide-react'
import { useAiStore } from '../stores/aiStore'
import { useNotes } from '../contexts'

import { AiImageCard } from './AiImageCard'

// Image Generator Wrapper
const ImageGenerator = ({ prompt, generateImage, onSave }) => {
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setStatus('loading')
      try {
        const res = await generateImage(prompt)
        if (mounted) {
          setUrl(res)
          setStatus('done')
        }
      } catch (_e) {
        if (mounted) setStatus('error')
      }
    }
    run()
    return () => {
      mounted = false
    }
  }, [prompt, generateImage])

  if (status === 'loading') {
    return (
      <div className="mt-2 p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col items-center gap-2 text-gray-400">
        <Loader2 size={24} className="animate-spin text-purple-400" />
        <span className="text-xs">Generating "{prompt}"...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
        Failed to generate image.
      </div>
    )
  }

  if (status === 'done' && url) {
    return <AiImageCard imageUrl={url} prompt={prompt} onSave={() => onSave(url)} />
  }

  return null
}

/**
 * AI Assistant Sidebar
 * Premium slideout panel for AI-powered features
 */
export default function AiAssistant() {
  const { isOpen, setOpen, isLoading, messages, askAi, clearMessages, createNoteFromChat } =
    useAiStore()

  const { notes } = useNotes()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Keyboard shortcut: Cmd/Ctrl + J to toggle
  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault()
        setOpen(!isOpen)
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setOpen])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const question = input.trim()
    setInput('')

    // Pass notes for RAG context
    // Pass notes for RAG context - Expanded for Gemini 1.5/2.5 Context Window
    const notesContext =
      notes?.slice(0, 100).map(n => ({
        title: n.title || '',
        content: n.content || '',
        id: n.id, // Ensure ID is passed for citations
      })) || []

    await askAi(question, notesContext)
  }

  const handleClose = () => setOpen(false)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 z-[55] h-full w-full sm:w-[420px] 
          flex flex-col
          bg-[#0c0c14]/95 backdrop-blur-2xl 
          border-l border-white/[0.08]
          shadow-2xl shadow-black/50
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
              <Sparkles size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
              <p className="text-xs text-gray-500">Ask about your notes</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setInput('Format and prettify my notes')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm hover:bg-green-500/20 transition-colors"
            >
              <Wand2 size={14} />
              Format Notes
            </button>
            <button
              onClick={() => setInput('Analyze my notes for duplicates')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm hover:bg-amber-500/20 transition-colors"
            >
              <Layers size={14} />
              Find Duplicates
            </button>
            <button
              onClick={() => setInput('Help me organize these thoughts')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm hover:bg-blue-500/20 transition-colors"
            >
              <FileText size={14} />
              Organize
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mb-4 border border-white/5">
                <Sparkles size={28} className="text-purple-400/60" />
              </div>
              <p className="text-gray-400 text-sm mb-2">No messages yet</p>
              <p className="text-gray-600 text-xs max-w-[200px]">
                Ask me anything about your notes, or try a quick action above.
              </p>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`
                  max-w-[85%] px-4 py-3 rounded-2xl text-sm relative group
                  ${
                    msg.role === 'user'
                      ? 'bg-purple-500/20 border border-purple-500/20 text-white rounded-br-md'
                      : 'bg-white/5 border border-white/5 text-gray-200 rounded-bl-md'
                  }
                `}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Virtual Tool Suggestions */}
                {msg.metadata?.tools?.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {msg.metadata.tools.map((tool, idx) => (
                      <React.Fragment key={idx}>
                        {tool.type === 'GENERATE_IMAGE' && (
                          <div className="w-full">
                            {/* Auto-trigger generation or show button */}
                            {/* We will auto-render the result container, which fetches on mount if we had a dedicated component.
                                 For now, we'll use a local effect in a wrapper or just simple UI. 
                                 Let's use a new component <AiImageGenerator> handling the fetch?
                                 Or just button for v1 safety? 
                                 Plan said "UI catches this tag, shows a 'Generating...' skeleton"
                             */}
                            <ImageGenerator
                              prompt={tool.value}
                              generateImage={useAiStore.getState().generateImage}
                              onSave={url => createNoteFromChat(`![${tool.value}](${url})`)} // Save as markdown image note
                            />
                          </div>
                        )}

                        {tool.type !== 'GENERATE_IMAGE' && (
                          <button
                            onClick={() => {
                              if (tool.type === 'SUGGEST_TITLE') {
                                setInput(`Rename active note to: ${tool.value}`)
                              } else if (tool.type === 'DETECTED_TASK') {
                                setInput(`Add task: ${tool.value}`)
                              } else {
                                setInput(`Show me note ${tool.value}`)
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs text-left transition-colors"
                          >
                            {tool.type === 'SUGGEST_TITLE' && (
                              <FileText size={12} className="text-blue-300" />
                            )}
                            {tool.type === 'DETECTED_TASK' && (
                              <CheckCircle2 size={12} className="text-green-300" />
                            )}
                            {tool.type === 'RELATED_NOTE' && (
                              <Layers size={12} className="text-purple-300" />
                            )}
                            <span className="text-gray-200">
                              {tool.type === 'SUGGEST_TITLE' && `Rename to "${tool.value}"`}
                              {tool.type === 'DETECTED_TASK' && `Add Task: ${tool.value}`}
                              {tool.type === 'RELATED_NOTE' && `Related: Note #${tool.value}`}
                            </span>
                          </button>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {msg.role === 'assistant' && (
                  <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button
                      onClick={() => createNoteFromChat(msg.content)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 text-xs text-gray-300 hover:bg-white/20 hover:text-white transition-colors"
                      title="Save as new note"
                    >
                      <Plus size={12} />
                      Save as Note
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="w-full mb-3 text-xs text-gray-500 hover:text-gray-400 flex items-center justify-center gap-1 transition-colors"
            >
              <Trash2 size={12} />
              Clear conversation
            </button>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your notes..."
              disabled={isLoading}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="text-[10px] text-gray-600 mt-2 text-center">
            ⌘J to toggle • Escape to close
          </p>
        </div>
      </div>
    </>
  )
}
