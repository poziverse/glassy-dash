import React, { useState } from 'react'
import { Download, FileText, FileJson, Video, Code, FileDown, ChevronDown, Check } from 'lucide-react'
import { exportRecording } from '../../utils/audioExport'

/**
 * Export button with format selection dropdown
 * Supports TXT, JSON, SRT, VTT, and formatted document exports
 */
export default function ExportButton({ recording, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [exportMessage, setExportMessage] = useState(null)

  const exportFormats = [
    {
      id: 'txt',
      label: 'Plain Text',
      icon: <FileText size={16} />,
      description: 'Simple text with metadata',
      extension: '.txt'
    },
    {
      id: 'json',
      label: 'JSON',
      icon: <FileJson size={16} />,
      description: 'Full recording data with metadata',
      extension: '.json'
    },
    {
      id: 'srt',
      label: 'SRT Subtitles',
      icon: <Video size={16} />,
      description: 'Subtitle format for video editing',
      extension: '.srt'
    },
    {
      id: 'vtt',
      label: 'WebVTT',
      icon: <Code size={16} />,
      description: 'Web video text tracks format',
      extension: '.vtt'
    },
    {
      id: 'doc',
      label: 'Formatted Document',
      icon: <FileDown size={16} />,
      description: 'Beautiful formatted document',
      extension: '.txt'
    }
  ]

  const handleExport = (format) => {
    try {
      exportRecording(recording, format, {
        includeMetadata: true,
        includeSummary: true,
        wordCount: true
      })
      
      // Show success message
      setExportMessage(`Exported as ${format.toUpperCase()}`)
      setTimeout(() => setExportMessage(null), 3000)
      
      setIsOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      setExportMessage('Export failed. Please try again.')
      setTimeout(() => setExportMessage(null), 3000)
    }
  }

  const getRecordingTitle = () => {
    return recording?.title || 'Untitled Recording'
  }

  return (
    <div className={`relative ${className}`}>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-colors"
        title="Export recording"
      >
        <Download size={16} />
        <span>Export</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-50 w-72 bg-gray-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
            <div className="p-3 border-b border-white/10">
              <div className="text-sm font-medium text-gray-200">
                Export: {getRecordingTitle()}
              </div>
            </div>

            <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
              {exportFormats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => handleExport(format.id)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left group"
                >
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-indigo-500/20 transition-colors flex-shrink-0">
                    {format.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-200 text-sm">
                        {format.label}
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        {format.extension}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {format.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Download size={12} />
                <span>Exports include transcript, summary, and metadata</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Export Success/Toast Message */}
      {exportMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-300 z-50">
          <Check size={18} />
          <span className="font-medium">{exportMessage}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Quick export button for single format
 * Useful for inline export without dropdown
 */
export function QuickExportButton({ 
  recording, 
  format = 'txt',
  className = '',
  icon: Icon = Download,
  label = 'Export'
}) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState(null)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      exportRecording(recording, format)
      
      setExportMessage(`Exported as ${format.toUpperCase()}`)
      setTimeout(() => setExportMessage(null), 3000)
    } catch (error) {
      console.error('Export error:', error)
      setExportMessage('Export failed. Please try again.')
      setTimeout(() => setExportMessage(null), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg 
          bg-indigo-600 hover:bg-indigo-500 
          text-white font-medium transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isExporting ? 'animate-pulse' : ''}
        `}
        title={`Export as ${format.toUpperCase()}`}
      >
        {isExporting ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Icon size={16} />
        )}
        <span>{label}</span>
      </button>

      {/* Toast Message */}
      {exportMessage && (
        <div className="absolute top-full left-0 mt-2 bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50">
          <Check size={14} />
          <span>{exportMessage}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Export options panel with custom configuration
 * Allows users to customize export settings
 */
export function ExportOptionsPanel({ recording, onExport, className = '' }) {
  const [format, setFormat] = useState('txt')
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [wordCount, setWordCount] = useState(true)
  const [dateFormat, setDateFormat] = useState('long')
  const [isExporting, setIsExporting] = useState(false)

  const handleExportClick = () => {
    setIsExporting(true)
    try {
      onExport(format, {
        includeMetadata,
        includeSummary,
        wordCount,
        dateFormat
      })
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const formats = [
    { id: 'txt', label: 'Plain Text', icon: FileText },
    { id: 'json', label: 'JSON', icon: FileJson },
    { id: 'doc', label: 'Formatted Document', icon: FileDown }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Format Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Export Format</label>
        <div className="grid grid-cols-3 gap-2">
          {formats.map((fmt) => (
            <button
              key={fmt.id}
              onClick={() => setFormat(fmt.id)}
              className={`
                flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                ${format === fmt.id
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                }
              `}
            >
              <fmt.icon size={20} />
              <span className="text-sm font-medium">{fmt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-300">Export Options</label>
        
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
              Include metadata (date, duration, tags)
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={includeSummary}
              onChange={(e) => setIncludeSummary(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
              Include AI summary
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={wordCount}
              onChange={(e) => setWordCount(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-white/5 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
              Include word count & reading time
            </span>
          </label>
        </div>
      </div>

      {/* Date Format */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-300">Date Format</label>
        <div className="grid grid-cols-2 gap-2">
          {['long', 'short'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setDateFormat(fmt)}
              className={`
                p-3 rounded-lg text-sm font-medium transition-all
                ${dateFormat === fmt
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {fmt === 'long' ? 'Long (Weekday, Month Day, Year)' : 'Short (MM/DD/YYYY)'}
            </button>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExportClick}
        disabled={isExporting}
        className={`
          w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl
          bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
          text-white font-semibold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          ${isExporting ? 'animate-pulse' : ''}
        `}
      >
        {isExporting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download size={20} />
            <span>Export Recording</span>
          </>
        )}
      </button>

      {/* Preview */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
        <div className="text-xs text-gray-400 mb-2">Preview</div>
        <div className="text-sm text-gray-300 font-mono">
          {getRecordingTitle()}.{format}
        </div>
      </div>
    </div>
  )
}

function getRecordingTitle() {
  return 'recording'
}