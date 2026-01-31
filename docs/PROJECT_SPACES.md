# Project Spaces - Next Phase Development

**Version:** 1.0  
**Status:** Planning Phase  
**Created:** January 30, 2026

---

## Overview

Project SPACES is a transformative feature that will evolve GlassyDash from a note-taking application into a powerful organization and collaboration platform. Spaces provide unique blank canvases for users to organize, collaborate, and visualize their content through multiple view modes.

**Vision:** Part Pinterest board, part Kanban, part social media microblog - SPACES offers unlimited opportunity for creative organization and project management.

---

## Executive Summary

### Core Concept
Spaces are unique, organized workspaces that users create to group notes, documents, and voice notes around specific ideas, projects, or interests. Unlike the main notes view, spaces are filtered, themed canvases without admin announcements or cross-user noise.

### Key Differentiators
- **Multi-view architecture**: Same content viewed as grid, board (Kanban), timeline, or more
- **Flexible assignment**: Explicit assignment, tag-based filtering, smart AI collections, or saved filters
- **Rich media embedding**: Spotify, YouTube, Vimeo, and more directly in notes
- **Advanced collaboration**: Space-level sharing with granular permissions
- **AI-powered**: Smart suggestions, content clustering, and automated workflows

### Target Use Cases
- **Project Management**: Marketing campaigns, software projects, event planning
- **Personal Organization**: Home renovation, vacation planning, hobby tracking
- **Creative Workspaces**: Mood boards, design collections, inspiration boards
- **Team Collaboration**: Shared workspaces with real-time updates and presence

---

## Table of Contents

- [Architecture Decisions](#architecture-decisions)
- [Feature Specifications](#feature-specifications)
- [Database Schema](#database-schema)
- [Implementation Roadmap](#implementation-roadmap)
- [UX Patterns](#ux-patterns)
- [Premium Features](#premium-features)
- [Technical Considerations](#technical-considerations)
- [Research References](#research-references)

---

## Architecture Decisions

### Space Content Model

**Decision: Hybrid Approach (Recommended)**

We support three complementary assignment methods:

1. **Explicit Assignment** (Default)
   - Notes explicitly added to spaces
   - Clean ownership model
   - Clear user intent
   - Database: `space_notes` table with direct `note_id` reference

2. **Tag-Based Auto-Assignment**
   - Spaces define tag rules
   - Notes with matching tags automatically appear
   - Great for loose organization
   - Implementation: Space has `tag_rules_json` field

3. **Smart Collections** (Premium)
   - AI-powered similarity detection
   - Content analysis for suggestions
   - Automatic clustering recommendations
   - Integration: Gemini RAG system

**Rationale:** Hybrid approach provides maximum flexibility while maintaining clarity through explicit assignment as the primary model.

### View Architecture

**Decision: Predefined + Custom Views**

Spaces support multiple, switchable views of the same underlying content:

**Phase 1 Views (MVP):**
- Grid View (reuse existing `NotesGrid` with space filter)
- Board/Kanban View (new `SpaceBoard` component)

**Phase 2 Views:**
- Timeline View (chronological display)
- Focus View (distraction-free single note)

**Phase 3 Views (Premium):**
- Mind Map View (visual relationships)
- Calendar View (date-based organization)
- Gantt Chart View (project timelines)

**Rationale:** Start with proven patterns (grid/board), iterate with timeline/focus, then differentiate with premium visualizations.

### Space Hierarchy

**Decision: Flat with Groups (v1), Nested (v2)**

**Phase 1:**
- Flat list of spaces
- Space groups/folders for organization
- Quick search/filter

**Phase 2:**
- Nested spaces (sub-spaces)
- Hierarchical navigation
- Inherited permissions

**Rationale:** Flat structure is simpler for MVP and covers most use cases. Nested spaces add complexity for edge cases that may not be needed initially.

---

## Feature Specifications

### Core Features (MVP)

#### 1. Space Creation & Management

**Capabilities:**
- Quick-create from sidebar or command palette
- Template library (Project, Hobby, Brainstorm, Dashboard)
- Custom icon/emoji picker
- Cover image support (upload + presets)
- Space description and metadata
- Color coding per space
- Pinned spaces for quick access

**Templates:**
```javascript
const spaceTemplates = {
  project: {
    title: 'New Project',
    icon: '🚀',
    columns: ['To Do', 'In Progress', 'Review', 'Done'],
    defaultView: 'board'
  },
  hobby: {
    title: 'Hobby Tracker',
    icon: '🎨',
    columns: ['Ideas', 'Resources', 'Progress', 'Completed'],
    defaultView: 'grid'
  },
  brainstorm: {
    title: 'Brainstorm',
    icon: '💡',
    columns: ['Notes', 'Ideas', 'Action Items'],
    defaultView: 'grid'
  }
}
```

**UX Flow:**
1. User clicks "Create Space" in sidebar
2. Template picker dialog appears
3. User selects template or "Blank Space"
4. Space created with pre-configured columns (if template)
5. User taken to new space

#### 2. Multi-View Architecture

**Grid View:**
- Reuse existing `NotesGrid` component
- Filter notes by `space_notes` table
- Support card size variations (small, medium, large)
- Masonry layout for visual variety
- Pinned notes at top

**Board/Kanban View:**
- Horizontal scrollable columns
- Draggable columns (reorder)
- Drag-and-drop notes between columns
- Column cards show item count
- Collapsible columns
- Quick-add button per column

**Implementation:**
```jsx
// SpaceBoard.jsx
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

function SpaceBoard({ space }) {
  const { columns, tasks, handleDragEnd } = useSpaceBoard(space.id)
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="board" type="COLUMN" direction="horizontal">
        {columns.map(column => (
          <Column key={column.id} column={column} tasks={tasks[column.id]} />
        ))}
      </Droppable>
    </DragDropContext>
  )
}
```

#### 3. Content Organization

**Explicit Assignment:**
```javascript
// Context menu action
const addNoteToSpace = async (noteId, spaceId) => {
  await api.post(`/spaces/${spaceId}/notes`, { noteId })
  // SSE event triggers refresh
}

// Bulk action
const addNotesToSpace = async (noteIds, spaceId) => {
  await api.post(`/spaces/${spaceId}/notes/bulk`, { noteIds })
}
```

**Tag-Based Rules:**
```javascript
// Space settings
const space = {
  id: 'space-123',
  tagRules: [
    { type: 'contains', value: '#marketing' },
    { type: 'contains', value: '#campaign-q1' }
  ]
}

// Query logic
const getNotesForSpace = (space) => {
  const allNotes = useNotes().notes
  const matchingTags = space.tagRules.map(rule => rule.value)
  return allNotes.filter(note => 
    note.tags.some(tag => matchingTags.includes(tag))
  )
}
```

**Smart Collections (AI):**
```javascript
// AI suggestion
const suggestSpace = async (noteContent, existingSpaces) => {
  const response = await gemini.analyzeContent(noteContent, {
    task: 'suggest_space',
    spaces: existingSpaces
  })
  return response.suggestedSpaceId
}
```

### Advanced Features (Post-MVP)

#### 4. Board View Enhancements

**Column Management:**
- Add/edit/delete columns
- Column color coding
- Column limits (max items)
- Column-specific note types
- Column-specific templates

**Drag-and-Drop Advanced:**
- Multi-select drag (Shift+click)
- Alt+drag = copy
- Ctrl+drag = add to multiple spaces
- Drop zone highlighting
- Undo/redo support

**Column Properties:**
```javascript
const column = {
  id: 'col-123',
  title: 'In Progress',
  color: 'blue',
  position: 1,
  isCollapsed: false,
  maxItems: 10,
  defaultNoteType: 'checklist',
  filters: {
    tags: ['#urgent'],
    createdBy: 'user-456'
  }
}
```

#### 5. Timeline View

**Features:**
- Chronological note display
- Grouping by day/week/month
- Visual update indicators
- Timeline scrubbing
- Date-based filtering

**Implementation:**
```jsx
function SpaceTimeline({ space }) {
  const notes = useSpaceNotes(space.id)
  const grouped = useMemo(() => {
    return groupByDate(notes, 'day') // Group by day
  }, [notes])
  
  return (
    <div className="timeline">
      {Object.entries(grouped).map(([date, dayNotes]) => (
        <TimelineDay key={date} date={date} notes={dayNotes} />
      ))}
    </div>
  )
}
```

#### 6. Collaboration

**Space Sharing:**
```javascript
const shareSpace = async (spaceId, collaborator, role) => {
  await api.post(`/spaces/${spaceId}/collaborators`, {
    userId: collaborator.id,
    role: role // 'viewer', 'editor', 'admin'
  })
}

const permissions = {
  viewer: ['read', 'comment'],
  editor: ['read', 'write', 'comment'],
  admin: ['read', 'write', 'comment', 'manage', 'share']
}
```

**Presence Tracking:**
```javascript
// SSE events
const useSpacePresence = (spaceId) => {
  const [presence, setPresence] = useState({})
  
  useEffect(() => {
    const eventSource = new EventSource(`/api/spaces/${spaceId}/presence`)
    eventSource.onmessage = (e) => {
      setPresence(JSON.parse(e.data))
    }
    return () => eventSource.close()
  }, [spaceId])
  
  return presence
}
```

#### 7. Media Embedding

**Supported Platforms:**
- Spotify (playlists, songs, albums)
- YouTube (videos, playlists)
- Vimeo (videos)
- SoundCloud (audio)
- Custom embeds via URL

**Embed Component:**
```jsx
function EmbedRenderer({ embed }) {
  if (embed.type === 'spotify') {
    return (
      <iframe 
        src={`https://open.spotify.com/embed/${embed.embedType}/${embed.embedId}`}
        width="100%" 
        height={embed.height || 152}
        frameBorder="0"
        allow="encrypted-media"
      />
    )
  }
  if (embed.type === 'youtube') {
    return (
      <iframe 
        src={`https://www.youtube.com/embed/${embed.embedId}`}
        width="100%" 
        height={embed.height || 315}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }
  // ... other platforms
}
```

**Embed Management:**
```jsx
function MediaEmbedder({ noteId, spaceId, onEmbed }) {
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState('youtube')
  
  const handleEmbed = async () => {
    const embedData = parseEmbedUrl(url, platform)
    await api.post(`/spaces/${spaceId}/notes/${noteId}/embeds`, embedData)
    onEmbed(embedData)
  }
  
  return (
    <div className="embedder">
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste URL..." />
      <select value={platform} onChange={e => setPlatform(e.target.value)}>
        <option value="youtube">YouTube</option>
        <option value="spotify">Spotify</option>
        <option value="vimeo">Vimeo</option>
      </select>
      <button onClick={handleEmbed}>Embed</button>
    </div>
  )
}
```

---

## Database Schema

### New Tables

#### 1. `spaces`

```sql
CREATE TABLE spaces (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  cover_image TEXT,
  color TEXT DEFAULT 'default',
  view_mode TEXT DEFAULT 'grid', -- grid, board, timeline, focus
  is_pinned INTEGER DEFAULT 0,
  position REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  settings_json TEXT, -- JSON: { tagRules, permissions, theme, etc. }
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_spaces_user_id ON spaces(user_id);
CREATE INDEX idx_spaces_position ON spaces(position);
CREATE INDEX idx_spaces_is_pinned ON spaces(is_pinned);
```

**settings_json Structure:**
```json
{
  "tagRules": [
    { "type": "contains", "value": "#project-alpha" },
    { "type": "contains", "value": "#urgent" }
  ],
  "defaultView": "board",
  "theme": {
    "primaryColor": "blue",
    "backgroundImage": null
  },
  "permissions": {
    "public": false,
    "requireInvite": true
  }
}
```

#### 2. `space_notes`

```sql
CREATE TABLE space_notes (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  note_id TEXT NOT NULL,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  added_by INTEGER NOT NULL,
  position REAL DEFAULT 0,
  column_id TEXT, -- for board view: which column
  FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (added_by) REFERENCES users(id),
  UNIQUE(space_id, note_id)
);

CREATE INDEX idx_space_notes_space_id ON space_notes(space_id);
CREATE INDEX idx_space_notes_note_id ON space_notes(note_id);
CREATE INDEX idx_space_notes_column_id ON space_notes(column_id);
CREATE INDEX idx_space_notes_position ON space_notes(space_id, position);
```

#### 3. `space_columns`

```sql
CREATE TABLE space_columns (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  title TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  color TEXT DEFAULT 'default',
  is_collapsed INTEGER DEFAULT 0,
  max_items INTEGER DEFAULT 0, -- 0 = unlimited
  default_note_type TEXT DEFAULT 'text',
  filters_json TEXT, -- JSON: column-specific filters
  FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_space_columns_space_id ON space_columns(space_id);
CREATE INDEX idx_space_columns_position ON space_columns(space_id, position);
```

**filters_json Structure:**
```json
{
  "tags": ["#urgent"],
  "type": ["checklist", "text"],
  "createdBy": "user-123",
  "dateRange": {
    "from": "2026-01-01",
    "to": "2026-01-31"
  }
}
```

#### 4. `space_collaborators`

```sql
CREATE TABLE space_collaborators (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'viewer', -- viewer, editor, admin
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  added_by INTEGER NOT NULL,
  FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (added_by) REFERENCES users(id),
  UNIQUE(space_id, user_id)
);

CREATE INDEX idx_space_collaborators_space_id ON space_collaborators(space_id);
CREATE INDEX idx_space_collaborators_user_id ON space_collaborators(user_id);
```

#### 5. `space_embeds`

```sql
CREATE TABLE space_embeds (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  note_id TEXT, -- NULL for space-level embeds
  embed_type TEXT NOT NULL, -- spotify, youtube, vimeo, soundcloud, custom
  embed_url TEXT NOT NULL,
  embed_id TEXT NOT NULL, -- platform-specific ID
  embed_data TEXT, -- JSON: height, startTime, etc.
  position INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX idx_space_embeds_space_id ON space_embeds(space_id);
CREATE INDEX idx_space_embeds_note_id ON space_embeds(note_id);
```

**embed_data Structure:**
```json
{
  "spotify": {
    "embedType": "playlist", -- track, album, playlist
    "height": 152
  },
  "youtube": {
    "startTime": 30,
    "height": 315
  },
  "vimeo": {
    "height": 315,
    "title": true,
    "portrait": false
  }
}
```

### Migration File

```javascript
// server/migrations/v6_add_spaces.js

module.exports = {
  up: db => {
    db.exec(`
      CREATE TABLE spaces (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        cover_image TEXT,
        color TEXT DEFAULT 'default',
        view_mode TEXT DEFAULT 'grid',
        is_pinned INTEGER DEFAULT 0,
        position REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        settings_json TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      
      CREATE INDEX idx_spaces_user_id ON spaces(user_id);
      CREATE INDEX idx_spaces_position ON spaces(position);
      CREATE INDEX idx_spaces_is_pinned ON spaces(is_pinned);
      
      CREATE TABLE space_notes (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL,
        note_id TEXT NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        added_by INTEGER NOT NULL,
        position REAL DEFAULT 0,
        column_id TEXT,
        FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES users(id),
        UNIQUE(space_id, note_id)
      );
      
      CREATE INDEX idx_space_notes_space_id ON space_notes(space_id);
      CREATE INDEX idx_space_notes_note_id ON space_notes(note_id);
      CREATE INDEX idx_space_notes_column_id ON space_notes(column_id);
      CREATE INDEX idx_space_notes_position ON space_notes(space_id, position);
      
      CREATE TABLE space_columns (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL,
        title TEXT NOT NULL,
        position INTEGER DEFAULT 0,
        color TEXT DEFAULT 'default',
        is_collapsed INTEGER DEFAULT 0,
        max_items INTEGER DEFAULT 0,
        default_note_type TEXT DEFAULT 'text',
        filters_json TEXT,
        FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
      );
      
      CREATE INDEX idx_space_columns_space_id ON space_columns(space_id);
      CREATE INDEX idx_space_columns_position ON space_columns(space_id, position);
      
      CREATE TABLE space_collaborators (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT DEFAULT 'viewer',
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        added_by INTEGER NOT NULL,
        FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (added_by) REFERENCES users(id),
        UNIQUE(space_id, user_id)
      );
      
      CREATE INDEX idx_space_collaborators_space_id ON space_collaborators(space_id);
      CREATE INDEX idx_space_collaborators_user_id ON space_collaborators(user_id);
      
      CREATE TABLE space_embeds (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL,
        note_id TEXT,
        embed_type TEXT NOT NULL,
        embed_url TEXT NOT NULL,
        embed_id TEXT NOT NULL,
        embed_data TEXT,
        position INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      );
      
      CREATE INDEX idx_space_embeds_space_id ON space_embeds(space_id);
      CREATE INDEX idx_space_embeds_note_id ON space_embeds(note_id);
    `)
  },
  
  down: db => {
    db.exec(`
      DROP INDEX IF EXISTS idx_space_embeds_note_id;
      DROP INDEX IF EXISTS idx_space_embeds_space_id;
      DROP TABLE IF EXISTS space_embeds;
      
      DROP INDEX IF EXISTS idx_space_collaborators_user_id;
      DROP INDEX IF EXISTS idx_space_collaborators_space_id;
      DROP TABLE IF EXISTS space_collaborators;
      
      DROP INDEX IF EXISTS idx_space_columns_position;
      DROP INDEX IF EXISTS idx_space_columns_space_id;
      DROP TABLE IF EXISTS space_columns;
      
      DROP INDEX IF EXISTS idx_space_notes_position;
      DROP INDEX IF EXISTS idx_space_notes_column_id;
      DROP INDEX IF EXISTS idx_space_notes_note_id;
      DROP INDEX IF EXISTS idx_space_notes_space_id;
      DROP TABLE IF EXISTS space_notes;
      
      DROP INDEX IF EXISTS idx_spaces_is_pinned;
      DROP INDEX IF EXISTS idx_spaces_position;
      DROP INDEX IF EXISTS idx_spaces_user_id;
      DROP TABLE IF EXISTS spaces;
    `)
  }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (2-3 weeks)

**Goals:** Core data model, basic CRUD, grid view

**Tasks:**
- [ ] Implement database schema (v6 migration)
- [ ] Create `SpacesContext` with CRUD operations
- [ ] Build `SpaceCard` sidebar component
- [ ] Create `SpaceCreator` modal/dialog
- [ ] Implement space settings panel
- [ ] Add space creation to sidebar
- [ ] Build grid view (reuse `NotesGrid` with space filter)
- [ ] Add explicit note assignment (context menu)
- [ ] Implement space navigation
- [ ] Add space pinning
- [ ] Basic SSE events for real-time updates

**Deliverables:**
- Users can create spaces
- Notes can be explicitly assigned to spaces
- Grid view of space content
- Space navigation and basic settings

**Testing:**
- Unit tests for `SpacesContext`
- E2E tests for space creation
- Integration tests for note assignment
- Performance tests for space loading

### Phase 2: Board View (2-3 weeks)

**Goals:** Kanban board with drag-and-drop

**Tasks:**
- [ ] Install and configure `@hello-pangea/dnd`
- [ ] Create `space_columns` table and API endpoints
- [ ] Build `SpaceBoard` component
- [ ] Implement column CRUD operations
- [ ] Add drag-and-drop for notes between columns
- [ ] Add drag-and-drop for column reordering
- [ ] Implement column collapse/expand
- [ ] Add quick-add buttons per column
- [ ] Column-specific filters
- [ ] Persist board state in database

**Deliverables:**
- Fully functional Kanban board
- Drag-and-drop note movement
- Column management
- Board state persistence

**Testing:**
- Drag-and-drop E2E tests
- Performance tests (60fps drag)
- Touch support tests for mobile
- Undo/redo functionality tests

### Phase 3: Advanced Views (3-4 weeks)

**Goals:** Timeline, focus view, and enhancements

**Tasks:**
- [ ] Build `SpaceTimeline` component
- [ ] Implement date grouping logic
- [ ] Add timeline scrubbing
- [ ] Build `SpaceFocus` (minimal) view
- [ ] Add view mode switcher
- [ ] Implement view mode persistence
- [ ] Tag-based space assignment
- [ ] Space templates system
- [ ] Bulk operations in spaces
- [ ] Advanced filtering and sorting

**Deliverables:**
- Multiple view modes (grid, board, timeline, focus)
- Tag-based space rules
- Template library
- Enhanced content management

**Testing:**
- Timeline view E2E tests
- Template creation tests
- Bulk operation tests
- Filter/sort integration tests

### Phase 4: Collaboration (2-3 weeks)

**Goals:** Space sharing and real-time collaboration

**Tasks:**
- [ ] Create `space_collaborators` table
- [ ] Build sharing UI and permissions
- [ ] Implement invite flow
- [ ] Add role-based access control
- [ ] Real-time sync for space updates
- [ ] Presence tracking and cursors
- [ ] Activity feeds per space
- [ ] @mentions in space comments
- [ ] Collaborator management panel
- [ ] Public space links (optional)

**Deliverables:**
- Space-level sharing
- Permission system
- Real-time collaboration
- Activity tracking

**Testing:**
- Permission matrix tests
- Real-time sync tests
- Presence tracking tests
- Security tests for unauthorized access

### Phase 5: Media Embedding (2-3 weeks)

**Goals:** Rich media integration

**Tasks:**
- [ ] Create `space_embeds` table
- [ ] Build `EmbedRenderer` component
- [ ] Implement `MediaEmbedder` UI
- [ ] Spotify embed integration
- [ ] YouTube embed integration
- [ ] Vimeo embed integration
- [ ] SoundCloud embed integration
- [ ] Custom embed support
- [ ] Embed management (edit, delete, reorder)
- [ ] Lazy loading for performance
- [ ] Error handling and fallbacks

**Deliverables:**
- Multi-platform media embedding
- Embed management UI
- Performance-optimized rendering

**Testing:**
- Embed rendering tests
- Platform-specific tests
- Performance tests (lazy loading)
- Error handling tests

### Phase 6: AI Integration (2-3 weeks)

**Goals:** AI-powered space intelligence

**Tasks:**
- [ ] Space recommendations engine
- [ ] Content clustering algorithm
- [ ] Auto-tagging suggestions
- [ ] AI-powered space creation
- [ ] Smart space templates
- [ ] Automated workflows
- [ ] Space activity insights
- [ ] Content similarity detection
- [ ] Deadline tracking and alerts

**Deliverables:**
- AI-powered space suggestions
- Smart content organization
- Automated workflows

**Testing:**
- Recommendation accuracy tests
- Clustering quality tests
- Workflow automation tests
- Performance tests for AI operations

### Phase 7: Premium Features (Ongoing)

**Goals:** Advanced differentiators and monetization

**Tasks:**
- [ ] Mind map view (React Flow or D3)
- [ ] Calendar view
- [ ] Gantt chart view
- [ ] Map view (Leaflet or Mapbox)
- [ ] Analytics dashboard
- [ ] Custom view builder
- [ ] Team management features
- [ ] Advanced automation
- [ ] External integrations (Zapier, Make)
- [ ] Custom domain for spaces

**Deliverables:**
- Premium view modes
- Advanced analytics
- Team features
- Automation platform

---

## UX Patterns

### Space Discovery & Navigation

**Sidebar Structure:**
```
┌─ Sidebar ─────────────────┐
│ 📝 Notes (24)          │
│ 📌 Pinned Notes (3)      │
│ 🗑️ Trash (2)             │
│                          │
│ 🎨 Spaces                │
│ ┌─ Pinned ──────────────│
│ │ 🚀 Marketing (12)    │
│ │ 🏠 Home Reno (8)      │
│ └─────────────────────────│
│ ┌─ All Spaces ───────────│
│ │ 🎨 Art Projects (5)   │
│ │ 🎵 Music Ideas (3)     │
│ │ 💡 Brainstorm (7)      │
│ └─────────────────────────│
│                          │
│ + New Space               │
└───────────────────────────┘
```

**Navigation Patterns:**
- Click space → Load space content (maintain scroll position)
- Back button → Return to all notes
- Breadcrumbs: "All Notes > Marketing > Campaign Q1"
- Keyboard: Cmd+K → Quick space switcher
- Search: Filter spaces by name/description

### Space Header

```
┌─ Space Header ─────────────────────────────────────────────┐
│ 🚀 Marketing Campaign                     [⚙️] [👥] [⋮] │
│ Q1 2026 Product Launch                           👤👤👤 │
├────────────────────────────────────────────────────────────┤
│ [Grid] [Board] [Timeline] [Focus]  [+ Add Note]         │
│ Filter: [#urgent] [▼]  Sort: [Latest ▼] [▼]            │
└────────────────────────────────────────────────────────────┘
```

**Header Actions:**
- Title → Edit inline
- Icon → Emoji picker
- View mode switcher → Grid/Board/Timeline/Focus icons
- ⚙️ → Settings menu
- 👥 → Collaborators (showing active count)
- ⋮ → Context menu (rename, duplicate, archive, delete, share)

### Content Management

**Add Content:**
- Quick-add button (+) in header
- Drag from other spaces
- Drag from sidebar notes
- "Create from template" button
- Import from file
- AI-assisted generation

**Organize Content:**
- Multi-select: Shift+click or Ctrl+click
- Bulk actions toolbar: Move, Delete, Archive, Color
- Filter panel: Type, tag, date range, collaborator
- Sort options: Date, title, position, custom properties
- Group by: Tag, type, assignee, status

**Drag-and-Drop Patterns:**
1. **Note to column**: Change status/column
2. **Note reordering**: Change position within column
3. **Column reordering**: Change column order
4. **Note to trash**: Archive note
5. **Alt+drag**: Copy note instead of move
6. **Shift+drag**: Add to multiple spaces (multi-space assignment)

### Space Templates

**Template Types:**

1. **Project Management:**
   - Columns: To Do, In Progress, Review, Done
   - Default view: Board
   - Icon: 🚀
   - Suggested tags: #project, #task, #milestone

2. **Kanban Workflow:**
   - Columns: Backlog, Ready, Development, Testing, Deployed
   - Default view: Board
   - Icon: 📋
   - Color coding by column

3. **Idea Brainstorm:**
   - Columns: Ideas, Research, Action Items, Completed
   - Default view: Grid
   - Icon: 💡
   - Vote/like system (premium)

4. **Hobby Tracker:**
   - Columns: Wishlist, In Progress, Resources, Completed
   - Default view: Grid
   - Icon: 🎨
   - Media embeds encouraged

5. **Event Planning:**
   - Columns: Ideas, Planning, Logistics, Day-of, Post-event
   - Default view: Timeline
   - Icon: 📅
   - Date-based organization

### Collaboration UX

**Sharing Flow:**
1. Click 👥 in space header
2. Enter email or select from list
3. Choose role: Viewer, Editor, Admin
4. Add optional message
5. Send invitation

**Role Permissions:**
- **Viewer**: View notes, add comments
- **Editor**: Add/edit/delete notes, reorder
- **Admin**: Full control, manage collaborators

**Presence Indicators:**
- Avatar ring shows online status
- Cursor positions visible in board view
- "3 collaborators active" badge
- Last seen timestamps

**Activity Feed:**
```
┌─ Recent Activity ──────────────────────────────────┐
│ 👤 John added 3 notes to "Marketing"            │
│ 👤 Sarah moved "Design Mockups" to Review          │
│ 👤 You added collaborator Mike (Editor)            │
│ 🤖 AI suggested 5 notes for this space           │
└────────────────────────────────────────────────────┘
```

---

## Premium Features

### AI-Powered Features

#### Smart Space Creation

**Feature:** "Analyze my notes and suggest spaces"

**Implementation:**
```javascript
const suggestSpaces = async (userId) => {
  const notes = await api.get('/notes')
  const response = await gemini.analyzeNotes(notes, {
    task: 'suggest_spaces',
    count: 5,
    includeExisting: true
  })
  return response.suggestions
}
```

**Output:**
```json
{
  "suggestions": [
    {
      "title": "Marketing Campaign",
      "icon": "📢",
      "suggestedNotes": ["note-1", "note-3", "note-7"],
      "confidence": 0.92,
      "template": "project"
    },
    {
      "title": "Home Renovation",
      "icon": "🏠",
      "suggestedNotes": ["note-2", "note-5"],
      "confidence": 0.87,
      "template": "hobby"
    }
  ]
}
```

#### Auto-Tagging

**Feature:** Suggest tags based on content and space context

**Implementation:**
```javascript
const suggestTags = async (noteContent, spaceContext) => {
  const response = await gemini.suggestTags(noteContent, {
    existingTags: spaceContext.allTags,
    spacePurpose: spaceContext.description,
    recentTags: spaceContext.recentlyUsed
  })
  return response.suggestions
}
```

#### Automated Workflows

**Feature:** "When note tagged #urgent → move to 'Priority' column"

**Implementation:**
```javascript
const workflowRules = [
  {
    trigger: { type: 'tag_added', value: '#urgent' },
    action: { type: 'move_to_column', value: 'priority' }
  },
  {
    trigger: { type: 'note_created', type: 'checklist' },
    action: { type: 'add_to_space', value: 'tasks' }
  }
]

const evaluateWorkflows = async (note, event) => {
  const matchingRules = workflowRules.filter(rule => 
    matchesTrigger(note, event, rule.trigger)
  )
  
  for (const rule of matchingRules) {
    await executeAction(rule.action, note)
  }
}
```

### Advanced Views

#### Mind Map View

**Library:** React Flow or D3

**Features:**
- Visual connections between related notes
- Expandable/collapsible nodes
- Force-directed layout
- Custom node styling (color, icon, size)
- Drag to reorganize
- Zoom and pan

**Implementation:**
```jsx
import ReactFlow, { Node, Edge } from 'react-flow-renderer'

function MindMapView({ space }) {
  const nodes = useMindMapNodes(space.id)
  const edges = useMindMapEdges(space.id)
  
  return (
    <ReactFlow nodes={nodes} edges={edges}>
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  )
}
```

#### Calendar View

**Features:**
- Notes with dates displayed on calendar
- Drag to reschedule
- Different colors by note type
- Month/week/day views
- Event creation from notes

**Implementation:**
```jsx
import { Calendar } from 'react-big-calendar'

function SpaceCalendar({ space }) {
  const notes = useSpaceNotes(space.id)
  const events = useMemo(() => 
    notes
      .filter(n => n.dueDate)
      .map(n => ({
        title: n.title,
        start: new Date(n.dueDate),
        end: new Date(n.dueDate),
        allDay: true,
        resource: n.id
      }))
  , [notes])
  
  return <Calendar events={events} />
}
```

#### Gantt Chart View

**Library:** react-gantt-chart or custom D3

**Features:**
- Timeline-based project tracking
- Dependencies between tasks
- Progress visualization
- Milestone markers
- Critical path highlighting

### Team Features

#### Team Dashboard

**Features:**
- Overview of all team spaces
- Member activity heatmaps
- Space performance metrics
- Quick actions (create space, invite members)
- Team settings and billing

#### Custom Domain

**Feature:** Share spaces on your own domain

**Implementation:**
- Subdomain: `company.glassydash.com`
- White-label customization
- Custom branding (logo, colors)
- Enhanced security options

### Analytics

**Space Statistics:**
- Notes created per day/week/month
- Collaboration activity
- Note type distribution
- Tag usage patterns
- Completion rates

**User Insights:**
- Most active spaces
- Collaboration frequency
- Content creation velocity
- Peak usage times

---

## Technical Considerations

### Performance Optimization

**Lazy Loading:**
- Virtual scrolling for large boards (>100 items)
- Lazy load images and embeds
- Intersection Observer for viewport detection
- RequestAnimationFrame for smooth animations

**Caching Strategy:**
```javascript
// TanStack Query cache keys
const spaceKeys = {
  all: ['spaces'],
  lists: () => [...spaceKeys.all, 'list'],
  details: () => [...spaceKeys.all, 'detail'],
  detail: (id) => [...spaceKeys.details(), id],
  notes: (id) => [...spaceKeys.detail(id), 'notes'],
  columns: (id) => [...spaceKeys.detail(id), 'columns']
}

// Cache configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  }
})
```

**Database Optimization:**
- Prepared statements for all queries
- Proper indexing (see schema)
- Query result pagination for large spaces
- Denormalized counters for space statistics

### Drag-and-Drop Performance

**Optimizations:**
```jsx
import { memo } from 'react'

const NoteCard = memo(({ note, isDragging }) => {
  // Heavy computations memoized
  const preview = useMemo(() => generatePreview(note), [note])
  
  return <div>{preview}</div>
})

// Virtual scrolling for large lists
import { FixedSizeList } from 'react-window'

function VirtualBoard({ notes }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={notes.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <NoteCard note={notes[index]} />
        </div>
      )}
    </FixedSizeList>
  )
}
```

### Real-Time Sync

**SSE Event Types:**
```javascript
const spaceEvents = {
  'space-created': ({ space }) => addSpace(space),
  'space-updated': ({ spaceId, changes }) => updateSpace(spaceId, changes),
  'space-deleted': ({ spaceId }) => removeSpace(spaceId),
  'space-note-added': ({ spaceId, noteId }) => addNoteToSpace(spaceId, noteId),
  'space-note-removed': ({ spaceId, noteId }) => removeNoteFromSpace(spaceId, noteId),
  'space-note-moved': ({ noteId, fromColumn, toColumn }) => moveNoteInBoard(noteId, fromColumn, toColumn),
  'space-column-reordered': ({ spaceId, columnOrder }) => reorderColumns(spaceId, columnOrder),
  'space-collaborator-added': ({ spaceId, user, role }) => addCollaborator(spaceId, user, role),
  'space-embed-added': ({ spaceId, embed }) => addEmbed(spaceId, embed)
}
```

**Connection Management:**
```javascript
const useSpaceSync = (spaceId) => {
  useEffect(() => {
    const eventSource = new EventSource(`/api/spaces/${spaceId}/events`)
    
    eventSource.addEventListener('message', (e) => {
      const event = JSON.parse(e.data)
      if (spaceEvents[event.type]) {
        spaceEvents[event.type](event.payload)
      }
    })
    
    // Reconnect on disconnect
    eventSource.onerror = () => {
      setTimeout(() => {
        // Auto-reconnect logic
      }, 3000)
    }
    
    return () => eventSource.close()
  }, [spaceId])
}
```

### Security Considerations

**Authorization:**
```javascript
// Middleware for space access
const authorizeSpaceAccess = (requiredRole = 'viewer') => {
  return async (req, res, next) => {
    const spaceId = req.params.spaceId
    const userId = req.user.id
    
    const collaborator = await db.get(
      'SELECT role FROM space_collaborators WHERE space_id = ? AND user_id = ?',
      [spaceId, userId]
    )
    
    if (!collaborator) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    const roleHierarchy = { admin: 3, editor: 2, viewer: 1 }
    if (roleHierarchy[collaborator.role] < roleHierarchy[requiredRole]) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    
    req.spaceRole = collaborator.role
    next()
  }
}

// Usage
app.delete('/api/spaces/:id', 
  authenticate,
  authorizeSpaceAccess('admin'),
  deleteSpace
)
```

**Embed Security:**
- Whitelist allowed embed domains
- Sanitize embed URLs
- Rate limit embed creation
- Content Security Policy for iframes

### Mobile Considerations

**Mobile Optimizations:**
- Touch-friendly drag gestures
- Simplified board view (columns stack vertically)
- Swipe actions (archive, delete, pin)
- Responsive card sizes
- Reduced animations on low-end devices

**Touch Drag-and-Drop:**
```jsx
import { TouchBackend } from 'react-dnd-touch-backend'

const MobileBoard = isMobile ? 
  withTouchBackend(SpaceBoard) :
  withHTML5DragDrop(SpaceBoard)
```

---

## Research References

### Analyzed Systems

#### Notion
- **Database properties** - Flexible schema per space
- **Board views** - Column management and filtering
- **Relation properties** - Cross-space connections
- **Template library** - Quick-start configurations

**Key Takeaways:**
- Space as a database with custom properties
- Multiple view modes (table, board, timeline, calendar)
- Rich property types (select, date, people, relation)
- Clean, minimal UI with power user features

#### Trello
- **Kanban workflow** - Column-based task management
- **Drag-and-drop excellence** - Smooth, intuitive interactions
- **Power-Ups** - Extensible platform architecture
- **Labels and tags** - Visual categorization

**Key Takeaways:**
- Board view is intuitive and powerful
- Drag-and-drop is core interaction
- Extensions add value to platform
- Visual organization drives adoption

#### Pinterest
- **Masonry layout** - Varied card sizes for visual appeal
- **Board organization** - Collection-based content grouping
- **Rich previews** - Show content before opening
- **Discovery algorithms** - Related content suggestions

**Key Takeaways:**
- Visual variety keeps engagement high
- Collections are natural organizational unit
- Previews reduce click-through needed
- Discovery drives content creation

### Libraries & Technologies

#### @hello-pangea/dnd
- Beautiful, accessible drag-and-drop
- Natural movement with spring physics
- Excellent keyboard and screen reader support
- High performance (60fps)

**Why Chosen:**
- Research shows robust API
- Great TypeScript support
- Mobile-friendly with Touch backend
- Active maintenance and community

#### React Flow
- Declarative graph building
- Customizable node and edge styling
- Zoom, pan, mini-map built-in
- Great for mind map view

**Why Considered:**
- Proven for mind map visualizations
- Extensive documentation
- Strong TypeScript support

#### TanStack Query
- Already in GlassyDash stack
- Excellent for server state
- Optimistic updates built-in
- Caching and revalidation

**Why Leverage:**
- Proven in current architecture
- Reduces learning curve
- Proven scalability

---

## Success Metrics

### User Engagement
- **Space creation rate**: % of users who create spaces
- **Average spaces per user**: Target 3-5 spaces
- **Time in spaces vs. all notes**: Aim for 60%+ in spaces
- **Space revisit frequency**: Daily active spaces per user

### Feature Adoption
- **View mode distribution**: Most/least used views
- **Drag-and-drop usage**: Frequency of DND operations
- **Collaboration adoption**: % of spaces with >1 user
- **Media embed usage**: Average embeds per space

### Technical Performance
- **Space load time**: <500ms for typical spaces (<100 notes)
- **Board view performance**: 60fps drag operations
- **Real-time sync latency**: <100ms for updates
- **Mobile app rating**: 4.5+ stars

### Business Metrics
- **Free to paid conversion**: Target 5-8%
- **Premium feature usage**: % using AI, advanced views
- **Space sharing rate**: % of spaces with collaborators
- **User retention**: 90%+ return after space creation

---

## Discussion Points

### Open Questions for Team

1. **Space Content Model**
   - Should notes live in multiple spaces simultaneously?
   - If yes, how to handle conflicts (same note edited in two spaces)?
   - Recommendation: Yes, last-write-wins with conflict notification

2. **Default View Behavior**
   - Should creating a note in board view auto-tag it with column-specific tags?
   - Should spaces inherit global settings or be independent?
   - Recommendation: Auto-tag for discoverability, independent settings

3. **Collaboration Scope**
   - Should collaboration be space-only or also note-level?
   - Should collaborators see all user spaces or only shared ones?
   - Recommendation: Space-level sharing, visibility limited to shared spaces

4. **Mobile Priorities**
   - Should mobile have simplified UI or full feature parity?
   - How to handle complex drag-and-drop on small screens?
   - Recommendation: Simplified UI, swipe gestures, touch DND

5. **MVP Feature Set**
   - Is board view essential for MVP or can it be v1.1?
   - Should media embeds be in MVP?
   - Recommendation: MVP = grid + explicit assignment, v1.1 = board, v1.2 = embeds

---

## Conclusion

The SPACES feature represents a transformative opportunity for GlassyDash. By combining the visual appeal of Pinterest, the productivity of Trello's Kanban, the flexibility of Notion's databases, and GlassyDash's existing strengths (voice notes, AI, glassmorphic UI), we can create a truly unique platform.

**Next Steps:**
1. Review this document with development team
2. Prioritize features for MVP (Phase 1)
3. Create detailed designs for MVP components
4. Set up development branch for SPACES
5. Begin Phase 1 implementation

**Key Takeaway:** Start strong with a solid foundation (explicit assignment + grid view), iterate quickly with board view, then layer in premium features that differentiate and monetize the product.

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Status:** Ready for Development Planning