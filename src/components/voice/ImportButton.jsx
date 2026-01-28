import React, { useRef } from 'react'
import { Upload } from 'lucide-react'

/**
 * ImportButton component for Voice Studio
 * Handles file selection for Voice Studio JSON imports
 */
export default function ImportButton({ onImport, isLoading, className = '' }) {
  const fileInputRef = useRef(null)

  const handleFileChange = async e => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    onImport(files)

    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = async () => {
    // Try modern File System Access API first
    if ('showOpenFilePicker' in window) {
      try {
        const fileHandles = await window.showOpenFilePicker({
          multiple: true,
          types: [
            {
              description: 'Voice Studio Recordings',
              accept: {
                'application/json': ['.json'],
              },
            },
          ],
        })

        const files = await Promise.all(fileHandles.map(handle => handle.getFile()))
        onImport(files)
        return
      } catch (err) {
        if (err.name === 'AbortError') return
        console.error('File Picker Error:', err)
        // Fallback to hidden input handled below
      }
    }

    // Fallback to hidden input
    fileInputRef.current?.click()
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        multiple
        className="hidden"
      />

      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl
          bg-white/5 hover:bg-white/10 text-gray-300
          border border-white/10 transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title="Import Recordings"
      >
        <Upload size={18} className={isLoading ? 'animate-bounce' : ''} />
        <span className="text-sm font-medium">Import</span>
      </button>
    </>
  )
}
