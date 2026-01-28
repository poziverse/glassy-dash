/**
 * File System Utilities
 * Modern file handling using File System Access API with graceful fallbacks
 * @module utils/fileSystem
 */

/**
 * Check if File System Access API is supported
 * @returns {boolean}
 */
export const supportsFileSystemAPI = () => {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window
}

/**
 * Export data to file using File System Access API
 * Falls back to anchor download if not supported
 * @param {string} data - Data to export
 * @param {string} filename - Suggested filename
 * @param {string} mimeType - MIME type
 * @returns {Promise<boolean>} Success status
 */
export const exportToFile = async (data, filename, mimeType = 'application/json') => {
  try {
    // Try modern File System Access API
    if (supportsFileSystemAPI()) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: mimeType === 'application/json' ? 'JSON file' : 'Text file',
            accept: {
              [mimeType]: [mimeType === 'application/json' ? '.json' : '.txt'],
            },
          },
        ],
      })

      const writable = await handle.createWritable()
      await writable.write(data)
      await writable.close()
      return true
    }

    // Fallback: Create download link
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch (error) {
    if (error.name === 'AbortError') {
      // User cancelled - not an error
      return false
    }
    console.error('Export failed:', error)
    throw error
  }
}

/**
 * Import file using File System Access API
 * Falls back to hidden input element if not supported
 * @param {Object} options - Import options
 * @param {boolean} options.multiple - Allow multiple files
 * @param {Array} options.acceptTypes - File type filters
 * @returns {Promise<File[]>} Selected files
 */
export const importFromFile = async (options = {}) => {
  const { multiple = false, acceptTypes = [] } = options

  try {
    // Try modern File System Access API
    if (supportsFileSystemAPI()) {
      const handles = await window.showOpenFilePicker({
        multiple,
        types:
          acceptTypes.length > 0
            ? acceptTypes.map(type => ({
                description: type.description || 'Files',
                accept: type.accept,
              }))
            : undefined,
        excludeAcceptAllOption: acceptTypes.length > 0,
      })

      const files = await Promise.all(handles.map(handle => handle.getFile()))
      return files
    }

    // Fallback: Use hidden input element
    return new Promise((resolve, _reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = multiple

      if (acceptTypes.length > 0) {
        // Build accept attribute from types
        const acceptParts = acceptTypes.flatMap(type => {
          return Object.values(type.accept || {}).flat()
        })
        input.accept = acceptParts.join(',')
      }

      input.onchange = () => {
        const files = Array.from(input.files || [])
        input.remove()
        resolve(files)
      }

      input.oncancel = () => {
        input.remove()
        resolve([])
      }

      document.body.appendChild(input)
      input.click()
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      // User cancelled - return empty array
      return []
    }
    console.error('Import failed:', error)
    throw error
  }
}

/**
 * Export notes to JSON file
 * @param {Array} notes - Notes array
 * @param {string} userId - User ID for filename
 * @returns {Promise<boolean>}
 */
export const exportNotesToJson = async (notes, userId = 'user') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `glassy-dash-notes-${userId}-${timestamp}.json`

  const exportData = {
    app: 'glassy-dash',
    version: 1,
    exportedAt: new Date().toISOString(),
    notes: notes,
  }

  return exportToFile(JSON.stringify(exportData, null, 2), filename)
}

/**
 * Import notes from JSON file
 * @returns {Promise<Object>} Parsed import data
 */
export const importNotesFromJson = async () => {
  const files = await importFromFile({
    multiple: false,
    acceptTypes: [
      {
        description: 'JSON files',
        accept: { 'application/json': ['.json'] },
      },
    ],
  })

  if (!files || files.length === 0) {
    return null
  }

  const file = files[0]
  const content = await file.text()
  const parsed = JSON.parse(content)

  // Validate import structure
  if (!parsed || (!Array.isArray(parsed.notes) && !Array.isArray(parsed))) {
    throw new Error('Invalid import file format')
  }

  return parsed
}

/**
 * Export secret key to text file
 * @param {string} key - Secret key
 * @returns {Promise<boolean>}
 */
export const exportSecretKey = async key => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `glassy-dash-secret-key-${timestamp}.txt`

  const content =
    `Glass Keep Secret Recovery Key\n\n` +
    `Keep this key safe. Anyone with this key can sign in as you.\n\n` +
    `Secret Key:\n${key}\n\n` +
    `Instructions:\n` +
    `1) Go to login page.\n` +
    `2) Click "Forgot username/password?".\n` +
    `3) Choose "Sign in with Secret Key" and paste this key.\n`

  return exportToFile(content, filename, 'text/plain')
}
