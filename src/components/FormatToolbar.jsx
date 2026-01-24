import React, { useState, useRef } from 'react'
import { Tooltip } from './Tooltip'
import { Popover } from './Popover'
import { IconPicker } from './IconPicker'
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  InlineCode,
  CodeBlock,
  Quote,
  BulletList,
  NumberedList,
  Link,
  Smile,
} from './Icons'

/**
 * FormatToolbar Component
 * Displays markdown formatting buttons (headings, bold, italic, code, etc.)
 * Used in text editors for quick formatting
 *
 * @param {Object} props - Component props
 * @param {boolean} props.dark - Whether to use dark mode styling
 * @param {Function} props.onAction - Callback function when a format action is triggered
 * @returns {React.ReactElement} The format toolbar component
 */
export function FormatToolbar({ dark, onAction }) {
  const [showIcons, setShowIcons] = useState(false)
  const iconBtnRef = useRef(null)

  const base = `toolbar-btn p-2 rounded-md transition-all duration-200 ${
    dark ? 'hover:bg-white/10 text-gray-200' : 'hover:bg-black/5 text-gray-700'
  }`

  const divider = <span className={`mx-1 w-px h-6 ${dark ? 'bg-gray-600' : 'bg-gray-300'}`} />

  return (
    <div
      className={`fmt-pop px-3 py-2 rounded-lg shadow-lg ${
        dark
          ? 'bg-gray-800 text-gray-100 border border-gray-700'
          : 'bg-white text-gray-800 border border-gray-200'
      }`}
    >
      <div className="flex items-center gap-1">
        {/* Headings */}
        <Tooltip text="Heading 1">
          <button className={base} onClick={() => onAction('h1')} aria-label="Heading 1">
            <Heading1 />
          </button>
        </Tooltip>
        <Tooltip text="Heading 2">
          <button className={base} onClick={() => onAction('h2')} aria-label="Heading 2">
            <Heading2 />
          </button>
        </Tooltip>
        <Tooltip text="Heading 3">
          <button className={base} onClick={() => onAction('h3')} aria-label="Heading 3">
            <Heading3 />
          </button>
        </Tooltip>

        {divider}

        {/* Text Formatting */}
        <Tooltip text="Bold (Ctrl+B)">
          <button className={base} onClick={() => onAction('bold')} aria-label="Bold">
            <Bold />
          </button>
        </Tooltip>
        <Tooltip text="Italic (Ctrl+I)">
          <button className={base} onClick={() => onAction('italic')} aria-label="Italic">
            <Italic />
          </button>
        </Tooltip>
        <Tooltip text="Strikethrough">
          <button className={base} onClick={() => onAction('strike')} aria-label="Strikethrough">
            <Strikethrough />
          </button>
        </Tooltip>

        {divider}

        {/* Code */}
        <Tooltip text="Inline Code">
          <button className={base} onClick={() => onAction('code')} aria-label="Inline Code">
            <InlineCode />
          </button>
        </Tooltip>
        <Tooltip text="Code Block">
          <button className={base} onClick={() => onAction('codeblock')} aria-label="Code Block">
            <CodeBlock />
          </button>
        </Tooltip>

        {divider}

        {/* Lists & Quote */}
        <Tooltip text="Quote">
          <button className={base} onClick={() => onAction('quote')} aria-label="Quote">
            <Quote />
          </button>
        </Tooltip>
        <Tooltip text="Bullet List">
          <button className={base} onClick={() => onAction('ul')} aria-label="Bullet List">
            <BulletList />
          </button>
        </Tooltip>
        <Tooltip text="Numbered List">
          <button className={base} onClick={() => onAction('ol')} aria-label="Numbered List">
            <NumberedList />
          </button>
        </Tooltip>
        <Tooltip text="Link">
          <button className={base} onClick={() => onAction('link')} aria-label="Link">
            <Link />
          </button>
        </Tooltip>

        {divider}

        {/* Insert Icon */}
        <Tooltip text="Insert Icon">
          <button
            ref={iconBtnRef}
            className={`${base} ${showIcons ? (dark ? 'bg-white/20' : 'bg-black/10') : ''}`}
            onClick={() => setShowIcons(!showIcons)}
            aria-label="Insert Icon"
          >
            <Smile />
          </button>
        </Tooltip>

        <Popover
          anchorRef={iconBtnRef}
          open={showIcons}
          onClose={() => setShowIcons(false)}
          offset={12}
        >
          <div className={dark ? 'text-gray-100' : 'text-gray-800'}>
            <IconPicker
              onSelect={name => {
                onAction('icon', name)
                setShowIcons(false)
              }}
            />
          </div>
        </Popover>
      </div>
    </div>
  )
}

export default FormatToolbar
