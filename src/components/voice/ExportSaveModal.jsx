import React, { useState } from 'react'
import { 
  FileText, 
  FileCode, 
  Mic, 
  Download,
  CheckCircle,
  X,
  Sparkles,
  Calendar,
  Clock,
  File,
  Hash
} from 'lucide-react'
import { analyzeContent, getRecommendationBadge, formatReadingTime } from '../../utils/contentAnalysis'
import { 
  convertToNote, 
  convertToDocument, 
  keepAsVoiceNote,
  exportRecording 
} from '../../utils/contentConverter'

/**
 * Export/Save Modal for voice recordings
 * Provides smart recommendations and flexible export options
 */
export default function ExportSaveModal({ 
  recording, 
  onClose, 
  onSave,
  showToast
}) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [exportFormat, setExportFormat] = useState('markdown')
  const [isProcessing, setIsProcessing] = useState(false)
  
  const analysis = analyzeContent(recording)
  const badge = getRecommendationBadge(analysis.recommendation)
  
  // Auto-select recommendation if no option selected
  if (!selectedOption && analysis.recommendation) {
    setSelectedOption(analysis.recommendation)
  }
  
  const handleExport = async () => {
    if (!selectedOption || isProcessing) return
    
    setIsProcessing(true)
    
    try {
      switch (selectedOption) {
        case 'note':
          await convertToNote(recording)
          showToast?.('Converted to Note', 'success')
          break
        case 'document':
          await convertToDocument(recording)
          showToast?.('Converted to Document', 'success')
          break
        case 'voice-note':
          await keepAsVoiceNote(recording)
          showToast?.('Saved as Voice Note', 'success')
          break
        case 'export':
          await exportRecording(recording, exportFormat)
          showToast?.(`Exported as ${exportFormat.toUpperCase()}`, 'success')
          break
      }
      
      onSave?.(recording.id)
    } catch (error) {
      console.error('Export error:', error)
      showToast?.(error.message || 'Export failed', 'error')
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative bg-gray-800 border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Save Your Transcript
            </h2>
            <p className="text-sm text-gray-400">
              {analysis.reasoning}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Stats */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-b border-white/10">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Hash size={16} className="text-indigo-400" />
              <div>
                <div className="text-gray-400">Words</div>
                <div className="text-white font-semibold">{analysis.wordCount}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-green-400" />
              <div>
                <div className="text-gray-400">Lines</div>
                <div className="text-white font-semibold">{analysis.lineCount}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-purple-400" />
              <div>
                <div className="text-gray-400">Reading Time</div>
                <div className="text-white font-semibold">{formatReadingTime(analysis.readingTime)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-pink-400" />
              <div>
                <div className="text-gray-400">Recorded</div>
                <div className="text-white font-semibold">
                  {new Date(recording.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          <div className="space-y-4">
            {/* Save Options */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Choose Destination
              </label>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Save as Note */}
                <SaveOption
                  value="note"
                  selected={selectedOption === 'note'}
                  onClick={() => setSelectedOption('note')}
                  icon={<FileText size={24} />}
                  label="Save as Note"
                  description="Best for medium-length content. Works well with your other notes."
                  badge={analysis.recommendation === 'note' ? badge : null}
                />
                
                {/* Save as Document */}
                <SaveOption
                  value="document"
                  selected={selectedOption === 'document'}
                  onClick={() => setSelectedOption('document')}
                  icon={<FileCode size={24} />}
                  label="Save as Document"
                  description="Ideal for long-form content, reports, or detailed transcripts."
                  badge={analysis.recommendation === 'document' ? badge : null}
                />
                
                {/* Keep as Voice Note */}
                <SaveOption
                  value="voice-note"
                  selected={selectedOption === 'voice-note'}
                  onClick={() => setSelectedOption('voice-note')}
                  icon={<Mic size={24} />}
                  label="Keep as Voice Note"
                  description="Preserve audio reference along with the transcript."
                  badge={analysis.recommendation === 'voice-note' ? badge : null}
                />
                
                {/* Export File */}
                <SaveOption
                  value="export"
                  selected={selectedOption === 'export'}
                  onClick={() => setSelectedOption('export')}
                  icon={<Download size={24} />}
                  label="Export as File"
                  description="Download for external use or sharing with others."
                  badge={null}
                />
              </div>
            </div>

            {/* Export Format Selector (only shown when export is selected) */}
            {selectedOption === 'export' && (
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Export Format
                </label>
                
                <div className="grid grid-cols-3 gap-3">
                  <FormatButton
                    value="markdown"
                    selected={exportFormat === 'markdown'}
                    onClick={() => setExportFormat('markdown')}
                    label="Markdown"
                    extension=".md"
                  />
                  <FormatButton
                    value="txt"
                    selected={exportFormat === 'txt'}
                    onClick={() => setExportFormat('txt')}
                    label="Plain Text"
                    extension=".txt"
                  />
                  <FormatButton
                    value="json"
                    selected={exportFormat === 'json'}
                    onClick={() => setExportFormat('json')}
                    label="JSON"
                    extension=".json"
                  />
                </div>
                
                <p className="text-xs text-gray-500 mt-3">
                  💡 Markdown preserves formatting and is best for editing. 
                  Plain text for compatibility. JSON includes full metadata.
                </p>
              </div>
            )}

            {/* Content Preview */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Content Preview
              </label>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-300">
                  {recording.summary || (recording.transcript?.substring(0, 200) || 'No content')}
                  {recording.transcript?.length > 200 && '...'}
                </p>
              </div>
            </div>

            {/* Tags Display */}
            {analysis.tags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {analysis.tags.map(tag => (
                    <span 
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-gray-900/50">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!selectedOption || isProcessing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Individual save option card
 */
function SaveOption({ 
  value, 
  selected, 
  onClick, 
  icon, 
  label, 
  description, 
  badge 
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 transition-all text-left
        ${selected 
          ? 'border-indigo-600 bg-indigo-600/10' 
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
        }
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          p-3 rounded-xl
          ${selected ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-400'}
        `}>
          {icon}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${selected ? 'text-white' : 'text-gray-300'}`}>
              {label}
            </h3>
            {selected && <Sparkles size={16} className="text-indigo-400" />}
          </div>
          <p className={`text-sm ${selected ? 'text-gray-300' : 'text-gray-400'}`}>
            {description}
          </p>
          
          {badge && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${badge.color}`}>
              <CheckCircle size={12} />
              {badge.text}
            </div>
          )}
        </div>
        
        {selected && (
          <CheckCircle size={20} className="text-indigo-400 flex-shrink-0" />
        )}
      </div>
    </button>
  )
}

/**
 * Format selection button for export
 */
function FormatButton({ value, selected, onClick, label, extension }) {
  return (
    <button
      onClick={onClick}
      className={`
        p-3 rounded-xl border-2 transition-all
        ${selected 
          ? 'border-indigo-600 bg-indigo-600/10 text-indigo-400' 
          : 'border-white/10 bg-white/5 hover:border-white/20 text-gray-400'
        }
      `}
    >
      <div className="flex flex-col items-center gap-1">
        <File size={20} />
        <span className="text-xs font-medium">{label}</span>
        <span className={`text-xs ${selected ? 'text-indigo-400' : 'text-gray-500'}`}>
          {extension}
        </span>
      </div>
    </button>
  )
}