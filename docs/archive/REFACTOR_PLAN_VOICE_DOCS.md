# Refactor Plan: Voice Studio & Documents

**Date:** January 25, 2026  
**Version:** 0.67.1 (Beta Phase)  
**Status:** Planning Phase  
**Approach:** Rebuild to match NotesView workspace pattern

---

## Executive Summary

This document outlines a complete refactor plan for Voice Studio and Documents features to align them with the established workspace pattern demonstrated in NotesView. The goal is to create consistent, intuitive user experiences across all three main features through a unified architecture.

**Core Problem:** Voice Studio and Documents use navigation between views (Gallery → Recording, Grid → Editor), while NotesView provides a single-page workspace with inline creation and editing.

**Solution:** Rebuild both features as single-page workspaces with inline interactions, following the proven NotesView pattern.

---

## Design Pattern Analysis: NotesView Workspace

### Key Characteristics

1. **Single-Page Workspace**
   - No navigation between views
   - All interactions happen inline
   - Content organized in sections

2. **Always-Available Composer**
   - Create form always visible at top
   - Quick access to create new items
   - No separate "create" flow

3. **Section-Based Organization**
   - Pinned items section
   - Regular items section
   - Archived items (when filtered)
   - Clear visual hierarchy

4. **Rich Interactive Features**
   - Multi-select with bulk operations
   - Drag-and-drop reordering
   - Inline editing
   - Real-time AI integration

5. **Context-Aware UI**
   - Dynamic toolbars based on state
   - Conditional rendering of features
   - Smart feedback mechanisms

### Component Structure

```
NotesView
├── DashboardLayout (shell)
│   ├── Background renderer
│   ├── Header with search/tags
│   └── Content area
│       ├── Multi-select toolbar (conditional)
│       ├── AI response box (conditional)
│       ├── Composer (always visible)
│       ├── Pinned section
│       └── Others section
```

---

## Voice Studio Refactor Plan

### Current Architecture Issues

**Problems:**
- Binary navigation: Voice Gallery ↔ Recording Studio
- Recording is a modal-like experience
- No preview before note creation
- Transcript immediately saved without review
- Disconnected from notes workspace

**User Flow:**
```
Gallery → Recording Studio → Process → Return to Gallery → Navigate to Notes
```

### Target Architecture: Single-Page Workspace

**New Pattern:**
```
Voice Workspace
├── Recording Studio (always visible, collapsible)
│   ├── Visualizer
│   ├── Recording controls
│   └── Transcription preview
├── Voice Gallery
│   ├── Recent recordings
│   └── Quick actions
└── AI Integration
    ├── Live transcription
    ├── Preview before save
    └── Inline editing
```

### Detailed Component Specification

#### 1. VoiceWorkspace Component (Main)

```jsx
function VoiceWorkspace() {
  return (
    <DashboardLayout>
      {/* Always-visible Recording Studio */}
      <RecordingStudio />
      
      {/* Voice Gallery - Recent Recordings */}
      <VoiceGallery />
    </DashboardLayout>
  )
}
```

#### 2. RecordingStudio Component (Inline, Always Visible)

**Features:**
- Collapsible panel (expand/collapse)
- Real-time audio visualizer
- Recording timer
- Pause/Resume functionality
- Live transcription preview
- Edit transcript before saving
- Save to Notes or Voice Gallery

**States:**
- `collapsed`: Panel minimized to show only controls
- `idle`: Ready to record
- `recording`: Currently recording
- `paused`: Recording paused
- `processing`: Transcribing audio
- `reviewing`: Transcript ready for review

**UI Structure:**
```jsx
function RecordingStudio() {
  return (
    <div className={collapsed ? 'recording-minimized' : 'recording-expanded'}>
      {/* Header - Always Visible */}
      <header>
        <button onClick={toggleCollapse}>
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
        <h2>Voice Recorder</h2>
        <RecordingTimer />
      </header>
      
      {!collapsed && (
        <>
          {/* Visualizer */}
          <AudioVisualizer />
          
          {/* Controls */}
          <Controls>
            <button onClick={startRecording}>Record</button>
            <button onClick={pauseRecording}>Pause</button>
            <button onClick={stopRecording}>Stop</button>
          </Controls>
          
          {/* Live Transcription Preview */}
          {transcript && (
            <TranscriptionPreview>
              <textarea value={transcript} onChange={editTranscript} />
              <button onClick={saveToNotes}>Save to Notes</button>
              <button onClick={saveToGallery}>Save to Gallery</button>
            </TranscriptionPreview>
          )}
        </>
      )}
    </div>
  )
}
```

#### 3. VoiceGallery Component

**Features:**
- Grid of recent voice notes
- Quick actions (play, edit, delete)
- Filter by date, tags
- Search functionality
- Integration with Notes (link to full note)

**UI Structure:**
```jsx
function VoiceGallery() {
  return (
    <div className="voice-gallery">
      <SearchBar />
      <FilterOptions />
      <VoiceNotesGrid>
        {voiceNotes.map(note => (
          <VoiceNoteCard
            key={note.id}
            note={note}
            onPlay={playAudio}
            onEdit={editInStudio}
            onDelete={deleteNote}
          />
        ))}
      </VoiceNotesGrid>
    </div>
  )
}
```

#### 4. VoiceNoteCard Component

**Features:**
- Audio player
- Transcript preview
- Date/time
- Tags
- Quick actions

**UI Structure:**
```jsx
function VoiceNoteCard({ note }) {
  return (
    <div className="voice-note-card">
      <AudioPlayer src={note.audioUrl} />
      <TranscriptPreview content={note.transcript} />
      <Metadata>
        <Date>{note.createdAt}</Date>
        <Tags>{note.tags}</Tags>
      </Metadata>
      <Actions>
        <button onClick={() => loadInStudio(note)}>Edit</button>
        <button onClick={() => navigateToNotes(note.id)}>View in Notes</button>
        <button onClick={() => deleteNote(note.id)}>Delete</button>
      </Actions>
    </div>
  )
}
```

### State Management

**Store: `voiceStore`**

```javascript
export const useVoiceStore = create(
  persist(
    (set, get) => ({
      // Data
      recordings: [],
      activeRecordingId: null,
      
      // UI State
      studioCollapsed: false,
      recordingState: 'idle', // idle, recording, paused, processing
      
      // Recording Data
      currentTranscript: '',
      currentAudio: null,
      recordingStartTime: null,
      
      // Actions
      startRecording: () => { /* ... */ },
      stopRecording: () => { /* ... */ },
      pauseRecording: () => { /* ... */ },
      saveRecording: (type) => { /* ... */ }, // 'notes' or 'gallery'
      deleteRecording: (id) => { /* ... */ },
      editRecording: (id) => { /* ... */ },
      setStudioCollapsed: (collapsed) => set({ studioCollapsed: collapsed }),
    }),
    {
      name: 'glassy-voice-storage',
    }
  )
)
```

### Implementation Phases

#### Phase 1: Core Infrastructure (Week 1)
- [ ] Create `voiceStore` with Zustand
- [ ] Set up basic component structure
- [ ] Implement collapsible RecordingStudio
- [ ] Add audio visualization
- [ ] Integrate MediaRecorder API

#### Phase 2: Recording Functionality (Week 2)
- [ ] Implement start/stop recording
- [ ] Add pause/resume functionality
- [ ] Integrate Gemini transcription
- [ ] Live transcription preview
- [ ] Recording timer

#### Phase 3: Review & Edit (Week 3)
- [ ] Inline transcript editing
- [ ] Save to Notes integration
- [ ] Save to Gallery integration
- [ ] Recording review workflow
- [ ] Smart title generation

#### Phase 4: Gallery & Organization (Week 4)
- [ ] VoiceGallery component
- [ ] VoiceNoteCard component
- [ ] Search and filter
- [ ] Audio player integration
- [ ] Quick actions

#### Phase 5: Polish & UX (Week 5)
- [ ] Keyboard shortcuts
- [ ] Error handling
- [ ] Loading states
- [ ] Animations
- [ ] Accessibility improvements

---

## Documents Refactor Plan

### Current Architecture Issues

**Problems:**
- Binary navigation: Grid View ↔ Editor
- No workspace feel
- Can't see context while editing
- No organization features
- Limited collaboration potential

**User Flow:**
```
Grid View → Click Document → Editor View → Edit → Back Button → Grid View
```

### Target Architecture: Single-Page Workspace

**New Pattern:**
```
Documents Workspace
├── Document Composer (always visible, collapsible)
│   ├── Quick create
│   └── Recent documents
├── Document Library
│   ├── Folders (when expanded)
│   ├── Document grid
│   └── Quick actions
└── Active Document (overlay/inline)
    ├── Inline editor
    └── Preview mode
```

### Detailed Component Specification

#### 1. DocumentsWorkspace Component (Main)

```jsx
function DocumentsWorkspace() {
  return (
    <DashboardLayout>
      {/* Document Sidebar - Always Visible */}
      <DocumentsSidebar>
        <FolderTree />
        <RecentDocuments />
      </DocumentsSidebar>
      
      {/* Main Content Area */}
      <DocumentsMain>
        {activeDocId ? (
          <DocumentEditorOverlay />
        ) : (
          <DocumentGrid />
        )}
      </DocumentsMain>
    </DashboardLayout>
  )
}
```

#### 2. DocumentsSidebar Component

**Features:**
- Folder navigation
- Recent documents
- Quick filters
- Create new button

**UI Structure:**
```jsx
function DocumentsSidebar() {
  return (
    <aside className="docs-sidebar">
      <SearchBar />
      
      <Section>
        <h3>Quick Actions</h3>
        <button onClick={createNewDoc}>New Document</button>
        <button onClick={importDoc}>Import</button>
      </Section>
      
      <Section>
        <h3>Folders</h3>
        <FolderTree />
      </Section>
      
      <Section>
        <h3>Recent</h3>
        <RecentDocsList />
      </Section>
      
      <Section>
        <h3>Tags</h3>
        <TagCloud />
      </Section>
    </aside>
  )
}
```

#### 3. FolderTree Component

**Features:**
- Expandable folders
- Drag-and-drop organization
- Create/delete folders
- Nested structure

**UI Structure:**
```jsx
function FolderTree() {
  return (
    <div className="folder-tree">
      {folders.map(folder => (
        <FolderNode
          key={folder.id}
          folder={folder}
          expanded={expandedFolders.has(folder.id)}
          onToggle={toggleFolder}
          onCreateSubfolder={createSubfolder}
          onDelete={deleteFolder}
        >
          {folder.documents.map(doc => (
            <DocumentLink
              key={doc.id}
              document={doc}
              onClick={openDocument}
            />
          ))}
        </FolderNode>
      ))}
    </div>
  )
}
```

#### 4. DocumentGrid Component

**Features:**
- Grid/list view toggle
- Document cards with preview
- Drag-and-drop to folders
- Multi-select with bulk actions
- Visual differentiation by type

**UI Structure:**
```jsx
function DocumentGrid() {
  return (
    <div className="document-grid">
      <Toolbar>
        <ViewToggle />
        <SortOptions />
        <FilterOptions />
      </Toolbar>
      
      <div className={viewMode}>
        {documents.map(doc => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onClick={openDocument}
            onDragStart={startDrag}
            onSelect={toggleSelect}
          />
        ))}
      </div>
      
      {multiMode && <BulkActionsToolbar />}
    </div>
  )
}
```

#### 5. DocumentCard Component

**Features:**
- Document preview/snippet
- Metadata (size, word count, date)
- Color coding by folder
- Quick actions menu
- Thumbnail for rich content

**UI Structure:**
```jsx
function DocumentCard({ document }) {
  return (
    <div className="document-card">
      <Thumbnail>
        {document.type === 'rich' && <RichTextPreview />}
        {document.type === 'markdown' && <MarkdownPreview />}
      </Thumbnail>
      
      <Info>
        <h3>{document.title}</h3>
        <Metadata>
          <span>{document.wordCount} words</span>
          <span>{formatDate(document.updatedAt)}</span>
          <FolderBadge>{document.folder}</FolderBadge>
        </Metadata>
        <Preview>{document.content.substring(0, 150)}...</Preview>
      </Info>
      
      <Actions>
        <button onClick={() => openDocument(document.id)}>Open</button>
        <button onClick={() => shareDocument(document.id)}>Share</button>
        <button onClick={() => deleteDocument(document.id)}>Delete</button>
      </Actions>
    </div>
  )
}
```

#### 6. DocumentEditorOverlay Component

**Features:**
- Full-screen or split-view editor
- Live preview
- Collaboration indicators
- Auto-save status
- Version history

**UI Structure:**
```jsx
function DocumentEditorOverlay() {
  return (
    <div className="editor-overlay">
      <Toolbar>
        <button onClick={closeEditor}>← Back</button>
        <input value={title} onChange={updateTitle} />
        <AutoSaveIndicator />
        <button onClick={share}>Share</button>
        <button onClick={showHistory}>History</button>
        <button onClick={exportDoc}>Export</button>
      </Toolbar>
      
      <div className="editor-content">
        <TipTapEditor
          content={document.content}
          onChange={updateContent}
        />
      </div>
      
      {/* Collaboration Panel */}
      {collaborators.length > 0 && (
        <CollaborationPanel>
          <CollaboratorsList />
          <LiveCursors />
        </CollaborationPanel>
      )}
    </div>
  )
}
```

### State Management

**Store: `docsStore` (Enhanced)**

```javascript
export const useDocsStore = create(
  persist(
    (set, get) => ({
      // Documents
      documents: [],
      folders: [],
      tags: [],
      
      // Active Document
      activeDocId: null,
      
      // UI State
      viewMode: 'grid', // grid | list
      sidebarCollapsed: false,
      multiMode: false,
      selectedIds: new Set(),
      
      // Folder State
      expandedFolders: new Set(),
      
      // CRUD Operations
      createDocument: (folderId) => {
        const newDoc = {
          id: crypto.randomUUID(),
          title: `Untitled Document ${get().documents.length + 1}`,
          content: '',
          folderId,
          type: 'rich',
          wordCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set(state => ({
          documents: [newDoc, ...state.documents],
          activeDocId: newDoc.id,
        }))
        return newDoc
      },
      
      updateDocument: (id, updates) => {
        set(state => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? { 
                  ...doc, 
                  ...updates, 
                  wordCount: countWords(updates.content || doc.content),
                  updatedAt: new Date().toISOString() 
                }
              : doc
          ),
        }))
      },
      
      deleteDocument: (id) => {
        set(state => ({
          documents: state.documents.filter(doc => doc.id !== id),
          activeDocId: state.activeDocId === id ? null : state.activeDocId,
        }))
      },
      
      // Folder Operations
      createFolder: (name, parentId) => { /* ... */ },
      updateFolder: (id, updates) => { /* ... */ },
      deleteFolder: (id) => { /* ... */ },
      moveDocument: (docId, folderId) => { /* ... */ },
      
      // Tag Operations
      addTag: (docId, tag) => { /* ... */ },
      removeTag: (docId, tag) => { /* ... */ },
      
      // Multi-Select Operations
      toggleMultiMode: () => set(state => ({ multiMode: !state.multiMode })),
      toggleSelect: (id) => { /* ... */ },
      bulkDelete: () => { /* ... */ },
      bulkMoveToFolder: (folderId) => { /* ... */ },
      bulkAddTag: (tag) => { /* ... */ },
      
      // UI Actions
      setActiveDoc: (id) => set({ activeDocId: id }),
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleFolder: (folderId) => {
        set(state => {
          const expanded = new Set(state.expandedFolders)
          if (expanded.has(folderId)) {
            expanded.delete(folderId)
          } else {
            expanded.add(folderId)
          }
          return { expandedFolders: expanded }
        })
      },
    }),
    {
      name: 'glassy-docs-storage',
    }
  )
)
```

### Implementation Phases

#### Phase 1: Core Infrastructure (Week 1)
- [ ] Enhance `docsStore` with folders and tags
- [ ] Create DocumentsSidebar component
- [ ] Implement FolderTree component
- [ ] Set up basic workspace layout

#### Phase 2: Document Management (Week 2)
- [ ] Enhanced DocumentGrid component
- [ ] Improved DocumentCard with preview
- [ ] Multi-select with bulk operations
- [ ] Drag-and-drop to folders

#### Phase 3: Editor Improvements (Week 3)
- [ ] DocumentEditorOverlay component
- [ ] Auto-save with debouncing
- [ ] Save status indicator
- [ ] Keyboard shortcuts

#### Phase 4: Organization Features (Week 4)
- [ ] Folder creation and management
- [ ] Tag system
- [ ] Advanced search and filter
- [ ] Recent documents

#### Phase 5: Collaboration & Export (Week 5)
- [ ] Real-time collaboration
- [ ] Share functionality
- [ ] Export to PDF/DOCX
- [ ] Version history

---

## Cross-Feature Integration

### Unified Content Model

**Concept:** Single content store with type differentiation

```javascript
// Unified content store
export const useContentStore = create((set, get) => ({
  items: [], // All content (notes, voice, docs)
  folders: [],
  tags: [],
  
  // Type-specific queries
  getNotes: () => get().items.filter(i => i.type === 'note'),
  getVoiceNotes: () => get().items.filter(i => i.type === 'voice'),
  getDocuments: () => get().items.filter(i => i.type === 'document'),
  
  // Unified search
  search: (query) => { /* ... */ },
  
  // Cross-referencing
  linkItems: (id1, id2) => { /* ... */ },
}))
```

### Unified Search

**Features:**
- Search across all content types
- Filter by type
- Highlight results
- Cross-feature links

### Unified Tags

**Features:**
- Tags work across all features
- Filter by tag across features
- Tag management interface

---

## Migration Strategy

### Phase 0: Preparation (Days 1-2)
- [ ] Backup existing data
- [ ] Create migration scripts
- [ ] Set up feature flags
- [ ] Prepare rollback plan

### Phase 1: Parallel Development (Weeks 1-5)
- [ ] Build new components alongside old ones
- [ ] Feature flag for A/B testing
- [ ] Gradual user rollout
- [ ] Collect feedback

### Phase 2: Data Migration (Week 6)
- [ ] Migrate existing voice notes
- [ ] Migrate existing documents
- [ ] Verify data integrity
- [ ] Test rollback procedures

### Phase 3: Cutover (Week 7)
- [ ] Enable new features for all users
- [ ] Monitor performance
- [ ] Collect bug reports
- [ ] Quick fixes as needed

### Phase 4: Cleanup (Week 8)
- [ ] Remove old components
- [ ] Update documentation
- [ ] Deprecate feature flags
- [ ] Final polish

---

## Testing Strategy

### Unit Tests
- Component rendering
- State management
- Event handlers
- Utility functions

### Integration Tests
- Component interactions
- Data flow
- API integrations
- Storage persistence

### E2E Tests
- Complete user flows
- Recording workflow
- Document creation/editing
- Search and filter
- Multi-select operations

### Performance Tests
- 100+ voice notes
- 50+ large documents
- Long recordings
- Complex documents

### Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management

---

## Success Metrics

### User Experience
- [ ] Time to create voice note reduced by 50%
- [ ] Time to create document reduced by 30%
- [ ] User satisfaction score > 4.5/5
- [ ] Task completion rate > 95%

### Performance
- [ ] Initial load time < 2s
- [ ] Recording latency < 100ms
- [ ] Auto-save debounce < 1s
- [ ] Search results < 500ms

### Adoption
- [ ] Voice Studio usage increases by 40%
- [ ] Documents usage increases by 30%
- [ ] Feature retention > 80%
- [ ] Cross-feature linking > 20%

---

## Risk Mitigation

### Technical Risks
**Risk:** Data loss during migration  
**Mitigation:** Comprehensive backup and rollback procedures

**Risk:** Performance degradation  
**Mitigation:** Performance testing and optimization

**Risk:** API failures (Gemini)  
**Mitigation:** Error handling and retry logic

### User Experience Risks
**Risk:** Confusing new UI  
**Mitigation:** Gradual rollout and user education

**Risk:** Feature removal during rebuild  
**Mitigation:** Feature parity checklist

**Risk:** Breaking existing workflows  
**Mitigation:** A/B testing and feedback collection

---

## Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|-------------|----------|
| Phase 0: Preparation | 2 days | Week 1 | Week 1 |
| Phase 1: Voice Core | 1 week | Week 1 | Week 2 |
| Phase 2: Voice Features | 1 week | Week 2 | Week 3 |
| Phase 3: Voice Polish | 1 week | Week 3 | Week 4 |
| Phase 4: Voice Gallery | 1 week | Week 4 | Week 5 |
| Phase 5: Voice UX | 1 week | Week 5 | Week 6 |
| Phase 6: Docs Core | 1 week | Week 6 | Week 7 |
| Phase 7: Docs Features | 1 week | Week 7 | Week 8 |
| Phase 8: Docs Editor | 1 week | Week 8 | Week 9 |
| Phase 9: Docs Org | 1 week | Week 9 | Week 10 |
| Phase 10: Docs Collab | 1 week | Week 10 | Week 11 |
| Phase 11: Migration | 1 week | Week 11 | Week 12 |
| Phase 12: Cutover | 1 week | Week 12 | Week 13 |
| Phase 13: Cleanup | 1 week | Week 13 | Week 14 |

**Total Duration:** 14 weeks (3.5 months)

---

## Next Steps

1. **Approve Refactor Plan** - Review and approve this plan
2. **Set Up Development Branch** - Create `refactor/voice-docs-workspace`
3. **Begin Phase 0** - Preparation and infrastructure setup
4. **Start Phase 1** - Voice Studio core infrastructure
5. **Weekly Reviews** - Track progress and adjust as needed

---

## Conclusion

This refactor plan provides a comprehensive roadmap for rebuilding Voice Studio and Documents as single-page workspaces aligned with the proven NotesView pattern. The approach prioritizes user experience, maintains data integrity, and provides a clear path from current architecture to the target state.

**Key Benefits:**
- Consistent UX across all features
- Improved workflows and efficiency
- Better organization and discoverability
- Foundation for future enhancements
- Maintainable, scalable architecture

**Success Criteria:**
- All features functional and tested
- User satisfaction improved
- Performance maintained or improved
- Documentation updated
- No data loss during migration

---

**Document Version:** 1.0  
**Last Updated:** January 25, 2026  
**Status:** Awaiting Approval