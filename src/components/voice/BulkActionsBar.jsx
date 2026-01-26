import React from 'react'
import { FileText, Images, Tag, Trash2, X, Archive } from 'lucide-react'

/**
 * Bulk actions bar that appears when recordings are selected
 */
export default function BulkActionsBar({ 
  selectedIds, 
  onClear,
  onDelete,
  onMove,
  onAddTags,
  onRemoveTags,
  onArchive,
  className = ''
}) {
  if (!selectedIds || selectedIds.length === 0) {
    return null
  }

  const count = selectedIds.length
  const label = count === 1 ? 'recording' : 'recordings'

  return (
    <div className={`
      fixed bottom-4 left-1/2 -translate-x-1/2 z-50
      bg-gray-800 border border-indigo-500/50 rounded-xl
      px-6 py-3 shadow-2xl flex items-center gap-4
      animate-in slide-in-from-bottom-4 fade-in duration-300
      ${className}
    `}>
      {/* Selection Counter */}
      <span className="text-sm font-medium text-white whitespace-nowrap">
        {count} {label} selected
      </span>
      
      <div className="h-6 w-px bg-gray-700" />
      
      {/* Move to Notes */}
      {onMove && (
        <button
          onClick={() => onMove(selectedIds, 'notes')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
          title="Move to Notes"
        >
          <FileText size={18} className="text-indigo-400 group-hover:text-indigo-300" />
        </button>
      )}
      
      {/* Move to Gallery */}
      {onMove && (
        <button
          onClick={() => onMove(selectedIds, 'gallery')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
          title="Move to Gallery"
        >
          <Images size={18} className="text-purple-400 group-hover:text-purple-300" />
        </button>
      )}
      
      {/* Add Tags */}
      {onAddTags && (
        <button
          onClick={() => onAddTags(selectedIds)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
          title="Add Tags"
        >
          <Tag size={18} className="text-green-400 group-hover:text-green-300" />
        </button>
      )}
      
      {/* Remove Tags */}
      {onRemoveTags && (
        <button
          onClick={() => onRemoveTags(selectedIds)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
          title="Remove Tags"
        >
          <Tag size={18} className="text-orange-400 group-hover:text-orange-300" />
        </button>
      )}
      
      {/* Archive */}
      {onArchive && (
        <button
          onClick={() => onArchive(selectedIds)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
          title="Archive"
        >
          <Archive size={18} className="text-gray-400 group-hover:text-gray-300" />
        </button>
      )}
      
      <div className="h-6 w-px bg-gray-700" />
      
      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(selectedIds)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors group relative"
          title="Delete"
        >
          <Trash2 size={18} className="text-red-400 group-hover:text-red-300" />
        </button>
      )}
      
      {/* Clear Selection */}
      <button
        onClick={onClear}
        className="ml-2 text-sm text-gray-400 hover:text-white transition-colors whitespace-nowrap"
      >
        Clear
      </button>
    </div>
  )
}

/**
 * Compact bulk actions (for mobile or smaller screens)
 */
export function CompactBulkActions({ 
  selectedIds,
  onClear,
  onDelete,
  onMove,
  className = ''
}) {
  if (!selectedIds || selectedIds.length === 0) {
    return null
  }

  const count = selectedIds.length

  return (
    <div className={`
      fixed bottom-4 left-4 right-4 z-50
      bg-gray-800 border border-indigo-500/50 rounded-xl
      p-4 shadow-2xl
      animate-in slide-in-from-bottom-4 fade-in duration-300
      ${className}
    `}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-white">
          {count} {count === 1 ? 'recording' : 'recordings'} selected
        </span>
        <button
          onClick={onClear}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>
      
      <div className="grid grid-cols-4 gap-2">
        {/* Move to Notes */}
        {onMove && (
          <button
            onClick={() => onMove(selectedIds, 'notes')}
            className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <FileText size={20} className="text-indigo-400" />
            <span className="text-xs text-gray-400">Notes</span>
          </button>
        )}
        
        {/* Move to Gallery */}
        {onMove && (
          <button
            onClick={() => onMove(selectedIds, 'gallery')}
            className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Images size={20} className="text-purple-400" />
            <span className="text-xs text-gray-400">Gallery</span>
          </button>
        )}
        
        {/* Delete */}
        {onDelete && (
          <button
            onClick={() => onDelete(selectedIds)}
            className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Trash2 size={20} className="text-red-400" />
            <span className="text-xs text-gray-400">Delete</span>
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Bulk tag picker modal/dialog
 */
export function BulkTagPicker({ 
  isOpen,
  onClose,
  onConfirm,
  selectedIds
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative bg-gray-800 border border-white/10 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-semibold text-white mb-4">
          Manage Tags for {selectedIds?.length || 0} Recordings
        </h3>
        
        {/* Tag picker would be rendered here */}
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Select tags to add or remove from the selected recordings.
          </p>
          
          {/* TagPicker component would go here */}
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <p className="text-sm text-gray-500">
              Tag picker component will be rendered here
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
          >
            Apply Tags
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Delete confirmation dialog
 */
export function BulkDeleteConfirm({ 
  isOpen,
  onClose,
  onConfirm,
  selectedIds
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative bg-gray-800 border border-white/10 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-full bg-red-500/20">
            <Trash2 size={24} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Delete {selectedIds?.length || 0} Recordings?
            </h3>
            <p className="text-sm text-gray-400">
              This action cannot be undone. The recordings will be permanently deleted.
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}