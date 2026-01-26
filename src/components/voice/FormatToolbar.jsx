import React, { useState } from 'react'
import { 
  Bold, Italic, Underline, Code, 
  Highlighter, Eraser, Type, 
  List, ListOrdered, Quote,
  Heading1, Heading2, Heading3,
  Minus, Plus, X
} from 'lucide-react'

/**
 * Format toolbar for transcript editing
 * Supports rich text formatting while storing as plain text
 * Uses markdown-like syntax for compatibility
 */
export default function FormatToolbar({ 
  value, 
  onChange, 
  className = '',
  showAdvanced = true 
}) {
  const [expandedSection, setExpandedSection] = useState(null)

  // Format handlers using markdown-style syntax
  const formatSelection = (before, after) => {
    const textarea = document.activeElement
    if (!textarea || textarea.tagName !== 'TEXTAREA') return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selectedText = text.substring(start, end)

    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)
    onChange(newText)

    // Restore focus and move cursor
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = start + before.length
      textarea.selectionEnd = end + before.length
    }, 0)
  }

  const insertText = (textToInsert) => {
    const textarea = document.activeElement
    if (!textarea || textarea.tagName !== 'TEXTAREA') return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentText = textarea.value

    const newText = currentText.substring(0, start) + textToInsert + currentText.substring(end)
    onChange(newText)

    // Restore focus and move cursor
    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length
    }, 0)
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-2 ${className}`}>
      {/* Basic Formatting */}
      <div className="flex items-center gap-1 mb-2 pb-2 border-b border-white/10">
        <ToolbarButton
          icon={<Bold size={16} />}
          tooltip="Bold (Ctrl+B)"
          onClick={() => formatSelection('**', '**')}
          shortcut="Ctrl+B"
        />
        <ToolbarButton
          icon={<Italic size={16} />}
          tooltip="Italic (Ctrl+I)"
          onClick={() => formatSelection('*', '*')}
          shortcut="Ctrl+I"
        />
        <ToolbarButton
          icon={<Underline size={16} />}
          tooltip="Underline (Ctrl+U)"
          onClick={() => formatSelection('__', '__')}
          shortcut="Ctrl+U"
        />
        <ToolbarButton
          icon={<Code size={16} />}
          tooltip="Code (Ctrl+`)"
          onClick={() => formatSelection('`', '`')}
          shortcut="Ctrl+`"
        />
        <div className="w-px h-6 bg-white/10 mx-2" />
        <ToolbarButton
          icon={<Highlighter size={16} />}
          tooltip="Highlight (==text==)"
          onClick={() => formatSelection('==', '==')}
        />
        <ToolbarButton
          icon={<Eraser size={16} />}
          tooltip="Clear Formatting"
          onClick={() => {
            const textarea = document.activeElement
            if (!textarea || textarea.tagName !== 'TEXTAREA') return
            
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const selectedText = textarea.value.substring(start, end)
            
            // Remove markdown formatting
            const cleanText = selectedText
              .replace(/\*\*(.+?)\*\*/g, '$1')
              .replace(/\*(.+?)\*/g, '$1')
              .replace(/__(.+?)__/g, '$1')
              .replace(/`(.+?)`/g, '$1')
              .replace(/==(.+?)==/g, '$1')
            
            const newText = textarea.value.substring(0, start) + cleanText + textarea.value.substring(end)
            onChange(newText)
          }}
        />
      </div>

      {/* Advanced Formatting */}
      {showAdvanced && (
        <>
          {/* Headings */}
          <div className="relative mb-2">
            <ToolbarButton
              icon={<Type size={16} />}
              tooltip="Headings"
              onClick={() => toggleSection('headings')}
              active={expandedSection === 'headings'}
            />
            {expandedSection === 'headings' && (
              <DropdownMenu>
                <DropdownItem
                  icon={<Heading1 size={14} />}
                  label="Heading 1"
                  onClick={() => {
                    insertText('\n# ')
                    toggleSection('headings')
                  }}
                />
                <DropdownItem
                  icon={<Heading2 size={14} />}
                  label="Heading 2"
                  onClick={() => {
                    insertText('\n## ')
                    toggleSection('headings')
                  }}
                />
                <DropdownItem
                  icon={<Heading3 size={14} />}
                  label="Heading 3"
                  onClick={() => {
                    insertText('\n### ')
                    toggleSection('headings')
                  }}
                />
              </DropdownMenu>
            )}
          </div>

          {/* Lists */}
          <div className="relative mb-2">
            <ToolbarButton
              icon={<List size={16} />}
              tooltip="Lists"
              onClick={() => toggleSection('lists')}
              active={expandedSection === 'lists'}
            />
            {expandedSection === 'lists' && (
              <DropdownMenu>
                <DropdownItem
                  icon={<List size={14} />}
                  label="Bullet List"
                  onClick={() => {
                    insertText('\n- ')
                    toggleSection('lists')
                  }}
                />
                <DropdownItem
                  icon={<ListOrdered size={14} />}
                  label="Numbered List"
                  onClick={() => {
                    insertText('\n1. ')
                    toggleSection('lists')
                  }}
                />
              </DropdownMenu>
            )}
          </div>

          {/* Quote */}
          <div className="relative">
            <ToolbarButton
              icon={<Quote size={16} />}
              tooltip="Quote (> text)"
              onClick={() => formatSelection('\n> ', '')}
            />
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Individual toolbar button component
 */
function ToolbarButton({ icon, tooltip, onClick, active = false, shortcut }) {
  return (
    <button
      onClick={onClick}
      className={`
        p-2 rounded-lg transition-all duration-200
        ${active 
          ? 'bg-indigo-600 text-white' 
          : 'bg-transparent text-gray-400 hover:bg-white/10 hover:text-white'
        }
      `}
      title={tooltip}
    >
      {icon}
    </button>
  )
}

/**
 * Dropdown menu for nested options
 */
function DropdownMenu({ children }) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
      {children}
    </div>
  )
}

/**
 * Dropdown menu item
 */
function DropdownItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 w-full text-left transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      <span className="text-sm text-gray-200">{label}</span>
    </button>
  )
}

/**
 * Formatting help panel - shows available markdown syntax
 */
export function FormattingHelp({ className = '' }) {
  const syntaxHelp = [
    { pattern: '**bold**', description: 'Bold text' },
    { pattern: '*italic*', description: 'Italic text' },
    { pattern: '__underline__', description: 'Underlined text' },
    { pattern: '`code`', description: 'Inline code' },
    { pattern: '==highlight==', description: 'Highlighted text' },
    { pattern: '# Heading 1', description: 'Large heading' },
    { pattern: '## Heading 2', description: 'Medium heading' },
    { pattern: '### Heading 3', description: 'Small heading' },
    { pattern: '- Item', description: 'Bullet list item' },
    { pattern: '1. Item', description: 'Numbered list item' },
    { pattern: '> Quote', description: 'Blockquote' },
  ]

  const keyboardShortcuts = [
    { keys: 'Ctrl+B', action: 'Bold' },
    { keys: 'Ctrl+I', action: 'Italic' },
    { keys: 'Ctrl+U', action: 'Underline' },
    { keys: 'Ctrl+`', action: 'Code' },
    { keys: 'Ctrl+Z', action: 'Undo' },
    { keys: 'Ctrl+Y', action: 'Redo' },
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Markdown Syntax */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Code size={16} />
          Markdown Syntax
        </h3>
        <div className="space-y-2">
          {syntaxHelp.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <code className="px-2 py-1 rounded bg-white/10 text-indigo-300 font-mono">
                {item.pattern}
              </code>
              <span className="text-gray-400">{item.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Type size={16} />
          Keyboard Shortcuts
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {keyboardShortcuts.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm p-2 rounded bg-white/5">
              <kbd className="px-2 py-1 rounded bg-white/10 text-indigo-300 font-mono text-xs">
                {item.keys}
              </kbd>
              <span className="text-gray-400">{item.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note about storage */}
      <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
        <p className="font-medium mb-1">💡 Note about Formatting</p>
        <p>
          All formatting is stored as plain text using markdown-like syntax. 
          This ensures compatibility and makes transcripts easy to share or export.
        </p>
      </div>
    </div>
  )
}