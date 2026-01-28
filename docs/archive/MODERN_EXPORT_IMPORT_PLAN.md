# Modern Export/Import Implementation Plan (2026)

## Overview

Replace legacy file handling with **File System Access API** - the modern 2026 standard for browser file operations.

## Why File System Access API?

✅ **Native file dialogs** - Better UX than hidden `<input>` elements
✅ **Direct file access** - No need for blob URLs or complex state management
✅ **Progressive enhancement** - Graceful fallback for older browsers
✅ **Security model** - User explicitly grants permissions
✅ **Stream-based** - Efficient handling of large files

## Modern APIs to Use

### Export (Save)
```javascript
const handle = await window.showSaveFilePicker({
  suggestedName: 'glassy-dash-notes.json',
  types: [{
    description: 'JSON files',
    accept: { 'application/json': ['.json'] }
  }]
});

const writable = await handle.createWritable();
await writable.write(jsonString);
await writable.close();
```

### Import (Open)
```javascript
const [handle] = await window.showOpenFilePicker({
  multiple: false,
  types: [{
    description: 'JSON files',
    accept: { 'application/json': ['.json'] }
  }]
});

const file = await handle.getFile();
const content = await file.text();
```

## Implementation Strategy

### Phase 1: Utility Functions
Create `src/utils/fileSystem.js` with modern file handling utilities

### Phase 2: Update NotesContext
Add export/import functions using File System Access API with fallbacks

### Phase 3: Update SettingsPanel
Remove hidden `<input>` elements, use direct function calls

### Phase 4: Testing
Verify functionality across browsers with feature detection

## File Structure

```
src/
├── utils/
│   └── fileSystem.js          # Modern file handling utilities
├── contexts/
│   └── NotesContext.jsx       # Updated with export/import
└── components/
    └── SettingsPanel.jsx       # Simplified UI
```

## Feature Detection

```javascript
const supportsFileSystemAPI = 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
```

## Graceful Degradation

For browsers without File System Access API support:
- Fallback to `<a>` download for export
- Fallback to hidden `<input>` for import
- Maintain existing functionality as backup

## Benefits

1. **Better UX** - Native file dialogs, no hidden inputs
2. **Cleaner Code** - No ref management for file inputs
3. **Future-Proof** - Uses 2026 web standards
4. **Progressive** - Works with fallbacks for older browsers
5. **Security** - User grants explicit permissions