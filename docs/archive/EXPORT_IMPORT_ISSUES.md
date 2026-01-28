# Export/Import Functionality Issues

## Investigation Summary

The export/import features in the Settings Panel are NOT working due to missing implementations and mismatched API.

## Issues Found

### 1. Missing Functions in NotesContext

**File**: `src/contexts/NotesContext.jsx`

The `NotesContext` provides the `useNotes()` hook used by `SettingsPanel`, but it's **missing** the export/import functions:

```jsx
// What SettingsPanel expects (from useNotes())
const { exportAllNotes, importNotes, importGoogleKeep, importMarkdown, downloadSecretKey } =
  useNotes()

// What NotesContext actually returns
const value = {
  // ... other properties
  // ❌ Missing: exportAllNotes
  // ❌ Missing: importNotes
  // ❌ Missing: importGoogleKeep
  // ❌ Missing: importMarkdown
  // ❌ Missing: downloadSecretKey
}
```

### 2. Functions Exist in useNotesCompat Hook

**File**: `src/hooks/useNotesCompat.js`

The `useNotesCompat()` hook HAS the implementations for:
- ✅ `exportAllNotes()` - Works correctly
- ✅ `importNotes()` - Works correctly  
- ✅ `downloadSecretKey()` - Works correctly
- ❌ `importGoogleKeep()` - NOT IMPLEMENTED
- ❌ `importMarkdown()` - NOT IMPLEMENTED

### 3. Server-Side Limitations

**File**: `server/index.js`

The API has:
- ✅ `/api/notes/export` (GET) - Works correctly
- ✅ `/api/notes/import` (POST) - Generic JSON import only
- ❌ No Google Keep import endpoint
- ❌ No Markdown import endpoint

### 4. UI/UX Issues

**File**: `src/components/SettingsPanel.jsx`

The Settings Panel has UI elements for:
1. Export All Notes (JSON) - ❌ Won't work
2. Download Secret Key - ❌ Won't work
3. Import JSON Backup - ❌ Won't work
4. Import Google Keep JSON - ❌ Won't work
5. Import Markdown Files - ❌ Won't work

**Root Cause**: These buttons call functions that don't exist in the `useNotes()` context, causing runtime errors when clicked.

## Error Flow

1. User clicks "Export All Notes" button
2. `SettingsPanel` calls `exportAllNotes()` from `useNotes()`
3. `useNotes()` returns undefined for `exportAllNotes`
4. Runtime error: `exportAllNotes is not a function`

## Solutions

### Option 1: Fix NotesContext (Recommended)

Add the missing export/import functions to `NotesContext.jsx`:

```jsx
// Add these functions to NotesContext.jsx
const exportAllNotes = useCallback(async () => {
  // Implementation from useNotesCompat
}, [])

const importNotes = useCallback(async (fileList) => {
  // Implementation from useNotesCompat
}, [])

const downloadSecretKey = useCallback(async () => {
  // Implementation from useNotesCompat
}, [])

// Add to the value object
const value = {
  // ... existing properties
  exportAllNotes,
  importNotes,
  downloadSecretKey,
}
```

### Option 2: Use useNotesCompat in SettingsPanel

Change SettingsPanel to use the compatibility hook that already has these functions:

```jsx
// In SettingsPanel.jsx
import { useNotesCompat } from '../hooks/useNotesCompat'

// Replace useNotes() with useNotesCompat()
const { exportAllNotes, importNotes, downloadSecretKey } = useNotesCompat()
```

### Option 3: Implement Missing Features

For Google Keep and Markdown import, need to:
1. Implement parsing logic for Google Keep JSON format
2. Implement parsing logic for Markdown files
3. Add server endpoints if needed
4. Add frontend functions

## Priority

### High Priority (Breaking Core Functionality)
- ✅ Fix `exportAllNotes` not working
- ✅ Fix `importNotes` not working
- ✅ Fix `downloadSecretKey` not working

### Medium Priority (Feature Complete)
- ⚠️ Implement `importGoogleKeep` 
- ⚠️ Implement `importMarkdown`

## Testing

After fixes, test:
1. Export notes and verify JSON download
2. Import notes from exported JSON
3. Download secret key
4. Verify no console errors when clicking buttons

## Related Files

- `src/components/SettingsPanel.jsx` - UI component
- `src/contexts/NotesContext.jsx` - Main context (missing functions)
- `src/hooks/useNotesCompat.js` - Has working implementations
- `server/index.js` - API endpoints

## Notes

- The `useNotesCompat` hook was created during a migration to Zustand stores
- Some components still use the old Context API while others use Zustand
- This mismatch is causing the export/import features to break
- The code works correctly when using `useNotesCompat()` but not with `useNotes()`