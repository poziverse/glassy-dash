/**
 * VoiceToTask - Extract action items from voice notes and create tasks
 * Part of Phase 5: Cross-Feature Integration
 */

import { useState } from 'react'
import { CheckCircle, Plus, AlertCircle, Loader2 } from 'lucide-react'

/**
 * Extract action items using AI (placeholder - would use Gemini)
 * This would be implemented with Gemini API in production
 */
export async function extractActionItems(transcript) {
  // Placeholder implementation
  // In production, this would call Gemini API
  
  const actionPatterns = [
    /need to\s+(\w+)/gi,
    /should\s+(\w+)/gi,
    /have to\s+(\w+)/gi,
    /remember to\s+(\w+)/gi,
    /don't forget to\s+(\w+)/gi,
    /todo:\s*(.+)/gi,
    /task:\s*(.+)/gi,
    /action item:\s*(.+)/gi
  ]
  
  const actionItems = []
  
  actionPatterns.forEach(pattern => {
    const matches = [...transcript.matchAll(pattern)]
    matches.forEach(match => {
      const text = match[1] || match[2] || match[0]
      const startIndex = match.index
      const endIndex = startIndex + match[0].length
      
      // Get context (50 chars before and after)
      const contextStart = Math.max(0, startIndex - 50)
      const contextEnd = Math.min(transcript.length, endIndex + 50)
      const context = transcript.substring(contextStart, contextEnd).trim()
      
      // Determine priority based on keywords
      const lowerText = text.toLowerCase()
      let priority = 'medium'
      if (lowerText.includes('urgent') || lowerText.includes('critical') || lowerText.includes('asap')) {
        priority = 'high'
      } else if (lowerText.includes('later') || lowerText.includes('someday')) {
        priority = 'low'
      }
      
      actionItems.push({
        id: Date.now() + Math.random(),
        text: text.charAt(0).toUpperCase() + text.slice(1),
        context: `...${context}...`,
        priority,
        startIndex,
        endIndex
      })
    })
  })
  
  // Remove duplicates
  const uniqueItems = []
  const seen = new Set()
  
  actionItems.forEach(item => {
    const key = item.text.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      uniqueItems.push(item)
    }
  })
  
  return uniqueItems
}

export default function VoiceToTask({ recording, onCreateTask }) {
  const [extracted, setExtracted] = useState(false)
  const [actionItems, setActionItems] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [error, setError] = useState(null)
  
  const handleExtract = async () => {
    if (!recording.transcript) {
      setError('No transcript available')
      return
    }
    
    setExtracting(true)
    setError(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const items = await extractActionItems(recording.transcript)
      setActionItems(items)
      setExtracted(true)
      
      // Auto-select all items
      setSelectedItems(new Set(items.map(i => i.id)))
    } catch (err) {
      setError('Failed to extract action items')
      console.error('Extraction error:', err)
    } finally {
      setExtracting(false)
    }
  }
  
  const handleToggleItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }
  
  const handleToggleAll = () => {
    if (selectedItems.size === actionItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(actionItems.map(i => i.id)))
    }
  }
  
  const handleCreateTasks = () => {
    if (selectedItems.size === 0) return
    
    const selectedActionItems = actionItems.filter(item => 
      selectedItems.has(item.id)
    )
    
    selectedActionItems.forEach(item => {
      onCreateTask?.({
        title: item.text,
        description: `From voice note: ${recording.title || 'Untitled'}\n\nContext: ${item.context}`,
        voiceNoteId: recording.id,
        priority: item.priority,
        tags: ['voice', 'action-item']
      })
    })
    
    // Clear selection after creating
    setSelectedItems(new Set())
  }
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
  }
  
  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-semibold text-white flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            Create Tasks from Voice Note
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Extract action items from transcript
          </p>
        </div>
        
        {extracted && (
          <button
            onClick={() => {
              setExtracted(false)
              setActionItems([])
              setSelectedItems(new Set())
            }}
            className="text-xs text-gray-400 hover:text-white"
          >
            Reset
          </button>
        )}
      </div>
      
      {/* Error state */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      
      {/* Extract button */}
      {!extracted && (
        <button
          onClick={handleExtract}
          disabled={extracting}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {extracting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Extract Action Items
            </>
          )}
        </button>
      )}
      
      {/* Action items list */}
      {extracted && actionItems.length > 0 && (
        <div className="space-y-3">
          {/* Toggle all */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItems.size === actionItems.length}
                onChange={handleToggleAll}
                className="rounded border-gray-600 w-4 h-4 accent-indigo-600"
              />
              <span>
                Select all ({selectedItems.size} / {actionItems.length})
              </span>
            </label>
          </div>
          
          {/* Items */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {actionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleItem(item.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedItems.has(item.id)
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {/* Priority badge */}
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${getPriorityColor(item.priority)}`}
                    >
                      {item.priority.toUpperCase()}
                    </span>
                    
                    {/* Action item text */}
                    <p className="text-sm text-white mb-2">
                      {item.text}
                    </p>
                    
                    {/* Context */}
                    <p className="text-xs text-gray-400 italic">
                      {item.context}
                    </p>
                  </div>
                  
                  {/* Checkbox */}
                  <div className="flex-shrink-0 pt-1">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedItems.has(item.id)
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'border-gray-600'
                      }`}
                    >
                      {selectedItems.has(item.id) && (
                        <CheckCircle size={14} className="text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Create tasks button */}
          <button
            onClick={handleCreateTasks}
            disabled={selectedItems.size === 0}
            className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Create {selectedItems.size} Task{selectedItems.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}
      
      {/* No items found */}
      {extracted && actionItems.length === 0 && (
        <div className="p-6 rounded-lg bg-white/5 text-center">
          <AlertCircle size={32} className="text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-300">
            No action items found in this transcript
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Try recording with more specific language like "need to", "should", "todo", etc.
          </p>
        </div>
      )}
    </div>
  )
}