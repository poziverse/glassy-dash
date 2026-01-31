# Documents and Voice Persistence Investigation Report

**Date:** 2026-01-30  
**Issue:** Documents and voice recordings not persisting in database  
**Status:** Root cause identified

## Executive Summary

Both the Documents and Voice Studio features are **NOT stored in the database**. They rely entirely on browser storage (localStorage + IndexedDB), which means:

- **Notes:** ✅ Persist correctly (stored in SQLite database via API)
- **Documents:** ❌ Do NOT persist (only in browser localStorage)
- **Voice Recordings:** ❌ Do NOT persist (only in browser IndexedDB + localStorage)

## Root Cause Analysis

### 1. Notes Implementation (Working Correctly)

**Store:** `src/stores/notesStore.js`
- Uses Zustand with `persist` middleware
- Storage name: `glassy-dash-notes`
- **Key:** Store is synced with database via API

**API Endpoints:** `server/index.js`
```javascript
app.get('/api/notes', auth, ...)           // Fetch from DB
app.post('/api/notes', auth, ...)          // Save to DB
app.put('/api/notes/:id', auth, ...)      // Update in DB
app.patch('/api/notes/:id', auth, ...)     // Partial update in DB
app.delete('/api/notes/:id', auth, ...)    // Delete from DB
```

**Database Table:**
```sql
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  items_json TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  images_json TEXT NOT NULL,
  color TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0,
  timestamp TEXT NOT NULL,
  -- ... additional columns
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Why it works:**
1. App loads → Fetches notes from `/api/notes` → Stores in Zustand
2. User edits → Updates Zustand → Sends to `/api/notes` → Saves to SQLite
3. App reloads → Fetches from DB → Restores state

---

### 2. Documents Implementation (BROKEN)

**Store:** `src/stores/docsStore.js`
- Uses Zustand with `persist` middleware
- Storage name: `glassy-docs-storage`
- **NO API CALLS WHATSOEVER**

**API Endpoints:** `server/index.js`
```javascript
// ❌ NO DOCUMENTS API ENDPOINTS EXIST
// app.get('/api/docs', ...)
// app.post('/api/docs', ...)
// app.put('/api/docs/:id', ...)
// app.delete('/api/docs/:id', ...)
```

**Database Table:**
```sql
// ❌ NO DOCUMENTS TABLE EXISTS
// Only: users, notes, note_collaborators, settings, bug_reports
```

**Current Persistence:**
```javascript
export const useDocsStore = create(
  persist(
    (set, _get) => ({
      docs: [],
      activeDocId: null,
      createDoc: (folderId = 'root') => { ... },  // Only updates localStorage
      updateDoc: (id, updates) => { ... },       // Only updates localStorage
      deleteDoc: id => { ... },                   // Only updates localStorage
      // ... all other actions
    }),
    {
      name: 'glassy-docs-storage',  // ⚠️ Browser localStorage only
    }
  )
)
```

**Why it fails:**
1. App loads → Documents state initialized from localStorage (empty if cleared)
2. User creates/edits document → Updates Zustand → Saves to localStorage
3. App reloads → Loads from localStorage (not database)
4. **No server persistence → Data lost if localStorage is cleared**

---

### 3. Voice Studio Implementation (BROKEN)

**Store:** `src/stores/voiceStore.js`
- Uses Zustand with `persist` middleware
- Storage name: `glassy-voice-storage`
- Uses IndexedDB for audio blobs (via `audioStorage` utils)
- **NO API CALLS WHATSOEVER**

**API Endpoints:** `server/index.js`
```javascript
// ❌ NO VOICE API ENDPOINTS EXIST
// app.get('/api/voice/recordings', ...)
// app.post('/api/voice/recordings', ...)
// app.get('/api/voice/recordings/:id/audio', ...)
```

**Database Table:**
```sql
// ❌ NO VOICE RECORDINGS TABLE EXISTS
// Only: users, notes, note_collaborators, settings, bug_reports
```

**Current Persistence:**
```javascript
export const useVoiceStore = create(
  persist(
    (set, get) => ({
      recordings: [],
      saveRecording: async (type, metadata = {}) => {
        const recordingId = crypto.randomUUID()
        
        // Store audio in IndexedDB
        const audioBlob = base64ToBlob(currentAudio)
        audioStorageId = await storeAudio(recordingId, audioBlob, {
          duration: get().recordingDuration,
          format: 'webm',
        })
        
        // Store metadata in localStorage
        const newRecording = { ... } // Only in Zustand
        set(state => ({ recordings: [newRecording, ...state.recordings] }))
      },
      // ... all other actions
    }),
    {
      name: 'glassy-voice-storage',  // ⚠️ Browser localStorage only
    }
  )
)
```

**Audio Storage:** `src/utils/audioStorage.js`
- Uses IndexedDB (`voice-studio-audio` database)
- Stores audio blobs locally
- **NO server-side audio storage**

**Why it fails:**
1. App loads → Voice state initialized from localStorage (empty if cleared)
2. User records audio → Saves metadata to localStorage + audio blob to IndexedDB
3. App reloads → Loads from localStorage/IndexedDB (not database)
4. **No server persistence → Data lost if browser storage is cleared**

## Technical Comparison

| Feature | Storage Method | API Sync | Database Table | Persistence Level |
|---------|---------------|-----------|----------------|-------------------|
| **Notes** | localStorage + API | ✅ Yes | `notes` | ✅ Server-side |
| **Documents** | localStorage only | ❌ No | None | ❌ Browser-only |
| **Voice** | localStorage + IndexedDB | ❌ No | None | ❌ Browser-only |

## Impact Assessment

### Data Loss Scenarios

**Documents:**
- ❌ Lost when clearing browser data
- ❌ Lost when switching browsers
- ❌ Lost when using incognito/private mode
- ❌ Lost when using different device
- ❌ Lost when browser storage quota exceeded

**Voice Recordings:**
- ❌ Same as documents
- ⚠️ Plus: Audio blobs stored in IndexedDB can be large and hit storage limits
- ⚠️ Plus: No way to share recordings across devices

### User Experience Impact

1. **Inconsistency:** Users expect all features to work the same (notes persist, but documents/voice don't)
2. **Data Loss Risk:** Users may lose work without warning
3. **Multi-Device:** Cannot access documents/voice recordings from different devices
4. **Collaboration:** Cannot share documents or voice recordings with others

## Recommended Solutions

### Option 1: Minimal Fix (Recommended for MVP)

**For Documents:**
1. Create `documents` table in database
2. Add API endpoints mirroring notes endpoints
3. Update `docsStore` to sync with API like `notesStore`
4. Maintain backward compatibility with existing localStorage data

**For Voice:**
1. Create `voice_recordings` table in database
2. Create `voice_audio` table or use object storage for audio blobs
3. Add API endpoints for CRUD operations
4. Update `voiceStore` to sync with API
5. Implement audio upload/download endpoints

### Option 2: Full Implementation (Long-term)

**For Documents:**
- Full document management system
- Version history
- Document collaboration (similar to notes)
- Document folders in database
- Rich text editor support

**For Voice:**
- Full voice recording management
- Audio streaming endpoints (not full blob upload)
- Transcript storage in database
- Speaker diarization in database
- Voice-to-text enhancement results stored
- Cross-recording linking

### Option 3: Deprecation (If features not needed)

If Documents and Voice Studio features are not critical:
- Document that they are experimental/browser-only
- Add warning banners in UI
- Consider removing in future release
- Focus on Notes feature which is fully implemented

## Implementation Priority

### Phase 1: Critical (Documents)
1. ✅ Add `documents` table to database schema
2. ✅ Create API endpoints (`/api/documents`)
3. ✅ Update `docsStore` to sync with API
4. ✅ Migration script to move existing localStorage data to DB

### Phase 2: High (Voice Metadata)
1. ✅ Add `voice_recordings` table to database schema
2. ✅ Create API endpoints (`/api/voice/recordings`)
3. ✅ Update `voiceStore` to sync metadata with API
4. ✅ Migration script for existing recordings

### Phase 3: Medium (Audio Storage)
1. ⚠️ Decide on audio storage strategy (DB vs object storage)
2. ⚠️ Implement audio upload/download endpoints
3. ⚠️ Update `voiceStore` to upload audio to server
4. ⚠️ Implement audio streaming for playback

### Phase 4: Low (Enhanced Features)
- Document collaboration
- Voice recording sharing
- Advanced search/filtering
- Export/import functionality

## Code Changes Required

### Database Schema (`server/index.js`)

```sql
-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  folder_id TEXT DEFAULT 'root',
  tags_json TEXT NOT NULL DEFAULT '[]',
  pinned INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Voice recordings table
CREATE TABLE IF NOT EXISTS voice_recordings (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  transcript TEXT NOT NULL,
  summary TEXT,
  duration REAL NOT NULL DEFAULT 0,
  audio_storage_id TEXT,  -- Reference to audio storage
  audio_url TEXT,         -- URL to audio file
  tags_json TEXT NOT NULL DEFAULT '[]',
  type TEXT NOT NULL DEFAULT 'gallery',  -- 'notes' or 'gallery'
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Optional: Voice audio table (if storing audio blobs in DB)
CREATE TABLE IF NOT EXISTS voice_audio (
  id TEXT PRIMARY KEY,
  recording_id TEXT NOT NULL,
  audio_data BLOB,  -- SQLite BLOB (not recommended for large files)
  audio_size INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(recording_id) REFERENCES voice_recordings(id) ON DELETE CASCADE
);
```

### API Endpoints (`server/index.js`)

**Documents:**
```javascript
app.get('/api/documents', auth, ...)
app.post('/api/documents', auth, ...)
app.put('/api/documents/:id', auth, ...)
app.patch('/api/documents/:id', auth, ...)
app.delete('/api/documents/:id', auth, ...)
app.get('/api/documents/trash', auth, ...)
app.post('/api/documents/:id/restore', auth, ...)
```

**Voice:**
```javascript
app.get('/api/voice/recordings', auth, ...)
app.post('/api/voice/recordings', auth, ...)
app.put('/api/voice/recordings/:id', auth, ...)
app.patch('/api/voice/recordings/:id', auth, ...)
app.delete('/api/voice/recordings/:id', auth, ...)
app.get('/api/voice/recordings/:id/audio', auth, ...)  // Download audio
app.put('/api/voice/recordings/:id/audio', auth, ...)  // Upload audio
```

### Store Updates

**docsStore.js:**
- Remove `persist` middleware or keep as cache
- Add API calls for all CRUD operations
- Load from API on app mount
- Sync to API on changes

**voiceStore.js:**
- Remove `persist` middleware or keep as cache
- Add API calls for metadata CRUD
- Add audio upload/download endpoints
- Load from API on app mount
- Sync to API on changes

## Migration Strategy

### Data Migration for Documents

1. **Detection:** Check if localStorage has documents data
2. **Export:** Read all documents from `glassy-docs-storage`
3. **Upload:** Send to `/api/documents` via bulk import endpoint
4. **Validation:** Confirm all documents uploaded successfully
5. **Cleanup:** Optionally clear localStorage after successful migration

### Data Migration for Voice

1. **Detection:** Check if localStorage has voice data
2. **Export:** Read all recordings from `glassy-voice-storage`
3. **Audio Upload:** For each recording, upload audio blob to `/api/voice/recordings/:id/audio`
4. **Metadata Upload:** Send recording metadata to `/api/voice/recordings`
5. **Validation:** Confirm all recordings uploaded successfully
6. **Cleanup:** Clear localStorage and IndexedDB after successful migration

## Testing Plan

### Unit Tests
- [ ] Document CRUD operations via API
- [ ] Voice recording CRUD operations via API
- [ ] Audio upload/download functionality
- [ ] Migration script tests

### Integration Tests
- [ ] End-to-end document creation, edit, delete flow
- [ ] End-to-end voice recording, edit, delete flow
- [ ] Multi-user document access (if collaboration added)
- [ ] Cross-session persistence

### Manual Testing
- [ ] Create document → Refresh → Verify persistence
- [ ] Create voice recording → Refresh → Verify persistence
- [ ] Clear localStorage → Verify data still available
- [ ] Switch browser → Verify data available
- [ ] Migration from localStorage to database

## Conclusion

The Documents and Voice Studio features are not persisting because they were implemented using browser-only storage (localStorage + IndexedDB) without any database backend or API integration. This creates data loss risks and inconsistent user experience compared to the Notes feature.

**Recommended Action:** Implement database persistence for both features using the same architecture as Notes (Zustand store + API sync + SQLite database).

**Estimated Effort:**
- Documents: 2-3 days (medium complexity)
- Voice (metadata): 2-3 days (medium complexity)
- Voice (audio storage): 3-5 days (high complexity, depends on strategy)

**Next Steps:**
1. Prioritize which feature to fix first (likely Documents)
2. Choose implementation approach (Minimal vs Full)
3. Create implementation plan with timeline
4. Begin Phase 1 implementation

---

**Report Generated:** 2026-01-30  
**Investigator:** Cline AI Assistant  
**Status:** Ready for implementation