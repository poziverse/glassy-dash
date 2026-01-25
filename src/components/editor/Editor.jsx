import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, Code, List, Heading1, Heading2, Quote } from 'lucide-react'

// Custom extensions or settings can go here

const GlassyEditor = ({ content, onChange, editable = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands, or just start writing...",
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editable,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px]',
      },
    },
  })

  // Sync content if it changes externally (e.g. switching docs)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="relative">
      {/* Floating Bubble Menu for formatting */}
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex items-center gap-1 p-1 rounded-lg bg-black/80 backdrop-blur-xl border border-white/10 shadow-xl"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${
              editor.isActive('bold') ? 'text-accent bg-white/10' : 'text-gray-300'
            }`}
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${
              editor.isActive('italic') ? 'text-accent bg-white/10' : 'text-gray-300'
            }`}
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'text-accent bg-white/10' : 'text-gray-300'
            }`}
          >
            <Heading1 size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-md hover:bg-white/10 transition-colors ${
              editor.isActive('bulletList') ? 'text-accent bg-white/10' : 'text-gray-300'
            }`}
          >
            <List size={16} />
          </button>
        </BubbleMenu>
      )}

      {/* Main Editor Area */}
      <EditorContent editor={editor} />
    </div>
  )
}

export default GlassyEditor
