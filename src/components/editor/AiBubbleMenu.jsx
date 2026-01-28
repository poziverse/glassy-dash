import React, { useState } from 'react'
import { BubbleMenu } from '@tiptap/react/menus'
import { Sparkles, Wand2, FileText, AlignLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useAiStore } from '../../stores/aiStore'

/**
 * Inline AI Bubble Menu
 * Floats above selected text to offer instant transformation commands
 */
const AiBubbleMenu = ({ editor }) => {
  // Only show if selection is non-empty
  const [loading, setLoading] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showInput, setShowInput] = useState(false)
  const { transformText } = useAiStore()

  if (!editor) return null

  const handleTransform = async instruction => {
    const { from, to } = editor.state.selection
    const text = editor.state.doc.textBetween(from, to, ' ')

    if (!text.trim()) return

    setLoading(true)
    try {
      const transformed = await transformText(text, instruction)

      if (transformed) {
        // Replace selection with transformed text
        editor.chain().focus().insertContentAt({ from, to }, transformed).run()

        setShowInput(false)
        setCustomPrompt('')
      }
    } catch (err) {
      console.error('Transform failed', err)
      // Optional: Show toast or error state
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTransform(customPrompt)
    }
  }

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: 'top-start' }}
      className="flex flex-col gap-1 p-2 rounded-xl bg-[#0c0c14]/90 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[300px]"
    >
      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center p-3 text-purple-300 gap-2 text-sm font-medium">
          <Loader2 size={16} className="animate-spin" />
          <span>Polishing...</span>
        </div>
      ) : showInput ? (
        // Custom Input Mode
        <div className="flex items-center gap-2 p-1">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
            <Sparkles size={16} />
          </div>
          <input
            autoFocus
            type="text"
            className="flex-1 bg-transparent border-none text-white text-sm placeholder-gray-500 focus:ring-0 px-2 py-1"
            placeholder="Ask AI to..."
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={() => handleTransform(customPrompt)}
            className="p-1.5 rounded-md hover:bg-white/10 text-purple-300"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        // Quick Actions Mode
        <div className="flex flex-col gap-1">
          <div className="px-2 py-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
            <span>AI Actions</span>
            <Sparkles size={10} className="text-purple-500/50" />
          </div>

          <button
            onClick={() => handleTransform('Fix grammar and improve flow. Keep professional tone.')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-sm text-gray-200 transition-colors group"
          >
            <Wand2 size={14} className="text-purple-400 group-hover:text-purple-300" />
            <span>Fix Grammar & Flow</span>
          </button>

          <button
            onClick={() => handleTransform('Summarize this in one concise sentence.')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-sm text-gray-200 transition-colors group"
          >
            <AlignLeft size={14} className="text-blue-400 group-hover:text-blue-300" />
            <span>Summarize Selection</span>
          </button>

          <button
            onClick={() => handleTransform('Expand on this idea with 2-3 more sentences.')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-sm text-gray-200 transition-colors group"
          >
            <FileText size={14} className="text-green-400 group-hover:text-green-300" />
            <span>Expand Idea</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          <button
            onClick={() => setShowInput(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-left text-sm text-gray-400 hover:text-white transition-colors"
          >
            <Sparkles size={14} />
            <span>Custom Instruction...</span>
          </button>
        </div>
      )}
    </BubbleMenu>
  )
}

export default AiBubbleMenu
