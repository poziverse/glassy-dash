import React, { useState } from 'react'
import { Tag, Plus, X } from 'lucide-react'
import { useVoiceStore } from '../../stores/voiceStore'
import { TAG_COLORS, getTagBackgroundColor } from '../../utils/voiceSearch'

/**
 * Tag picker component for selecting/creating tags
 */
export default function TagPicker({ 
  selectedTags = [], 
  onChange,
  allowCreate = true,
  className = '',
  showCount = false
}) {
  const { tags, addTag } = useVoiceStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  const handleCreateTag = () => {
    if (!newTagName.trim()) return

    const trimmedName = newTagName.trim()
    const existingTag = tags.find(t => t.name.toLowerCase() === trimmedName.toLowerCase())
    
    if (existingTag) {
      // Select existing tag
      if (!selectedTags.includes(existingTag.id)) {
        onChange([...selectedTags, existingTag.id])
      }
    } else {
      // Create new tag
      const newTagId = addTag(trimmedName)
      onChange([...selectedTags, newTagId])
    }

    setNewTagName('')
    setIsCreating(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCreateTag()
    } else if (e.key === 'Escape') {
      setIsCreating(false)
      setNewTagName('')
    }
  }

  const availableColors = Object.keys(TAG_COLORS)

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Existing tags */}
      {tags.map(tag => {
        const isSelected = selectedTags.includes(tag.id)
        const bgColor = getTagBackgroundColor(tag.color)
        const textColor = TAG_COLORS[tag.color]

        return (
          <button
            key={tag.id}
            onClick={() => {
              const newTags = isSelected
                ? selectedTags.filter(t => t !== tag.id)
                : [...selectedTags, tag.id]
              onChange(newTags)
            }}
            className={`
              group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full 
              text-sm font-medium transition-all
              ${isSelected
                ? 'ring-2 ring-offset-2 ring-offset-gray-900'
                : 'hover:scale-105'
              }
            `}
            style={{
              backgroundColor: bgColor,
              color: textColor,
              ...(isSelected ? { ringColor: textColor } : {})
            }}
            title={`${tag.name}${showCount ? ` (${tag.count})` : ''}`}
          >
            <Tag size={14} className="flex-shrink-0" />
            <span>{tag.name}</span>
            {showCount && tag.count > 0 && (
              <span className="ml-1 text-xs opacity-70">
                {tag.count}
              </span>
            )}
            {isSelected && (
              <X size={12} className="ml-1 opacity-70" />
            )}
          </button>
        )
      })}

      {/* Create new tag button */}
      {allowCreate && (
        <>
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Plus size={14} />
              <span>Add Tag</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newTagName.trim()) {
                    setIsCreating(false)
                  }
                }}
                placeholder="Tag name..."
                className="w-32 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="px-3 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewTagName('')
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Compact tag picker (pill-style, horizontal scroll)
 */
export function CompactTagPicker({ 
  selectedTags = [], 
  onChange,
  className = ''
}) {
  const { tags } = useVoiceStore()

  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 ${className}`}>
      {tags.map(tag => {
        const isSelected = selectedTags.includes(tag.id)
        const bgColor = getTagBackgroundColor(tag.color)
        const textColor = TAG_COLORS[tag.color]

        return (
          <button
            key={tag.id}
            onClick={() => {
              const newTags = isSelected
                ? selectedTags.filter(t => t !== tag.id)
                : [...selectedTags, tag.id]
              onChange(newTags)
            }}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full 
              text-xs font-medium transition-all whitespace-nowrap
              ${isSelected ? 'ring-1 ring-offset-1 ring-offset-gray-900' : 'hover:scale-105'}
            `}
            style={{
              backgroundColor: bgColor,
              color: textColor,
              ...(isSelected ? { ringColor: textColor } : {})
            }}
          >
            <Tag size={12} />
            <span>{tag.name}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Tag filter component (for filtering recordings by tags)
 */
export function TagFilter({ 
  activeTags = [], 
  onChange,
  showClearButton = true,
  className = ''
}) {
  const { tags } = useVoiceStore()

  if (tags.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No tags available
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tag size={16} className="text-gray-400 flex-shrink-0" />
      <div className="flex flex-wrap gap-2 flex-1">
        {tags.map(tag => {
          const isActive = activeTags.includes(tag.id)
          const bgColor = getTagBackgroundColor(tag.color)
          const textColor = TAG_COLORS[tag.color]

          return (
            <button
              key={tag.id}
              onClick={() => {
                const newActiveTags = isActive
                  ? activeTags.filter(t => t !== tag.id)
                  : [...activeTags, tag.id]
                onChange(newActiveTags)
              }}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full 
                text-sm font-medium transition-all
                ${isActive
                  ? 'ring-2 ring-offset-2 ring-offset-gray-900'
                  : 'hover:scale-105 opacity-70 hover:opacity-100'
                }
              `}
              style={{
                backgroundColor: bgColor,
                color: textColor,
                ...(isActive ? { ringColor: textColor } : {})
              }}
              title={`Filter by ${tag.name}`}
            >
              <Tag size={14} />
              <span>{tag.name}</span>
              {isActive && <X size={12} />}
            </button>
          )
        })}
      </div>

      {showClearButton && activeTags.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

/**
 * Tag chips display (read-only, for showing tags on recordings)
 */
export function TagChips({ tagIds, className = '' }) {
  const { tags } = useVoiceStore()

  if (!tagIds || tagIds.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tagIds.map(tagId => {
        const tag = tags.find(t => t.id === tagId)
        if (!tag) return null

        const bgColor = getTagBackgroundColor(tag.color)
        const textColor = TAG_COLORS[tag.color]

        return (
          <span
            key={tagId}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: bgColor,
              color: textColor
            }}
            title={tag.name}
          >
            {tag.name}
          </span>
        )
      })}
    </div>
  )
}