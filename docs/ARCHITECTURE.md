# System Architecture

**Version:** 1.1.3 (Stability & Data Integrity)
**Last Updated:** January 21, 2026

---

## Overview

GlassKeep is built on a modern, modular architecture leveraging **TanStack Query** for robust server state management, **React Context API** for service orchestration, and **Zustand** for local UI state. The backend uses Express.js and SQLite with real-time synchronization via Server-Sent Events (SSE).

---

## Table of Contents

- [Technology Stack](#technology-stack)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Architecture](#database-architecture)
- [Security Architecture](#security-architecture)
- [Performance Architecture](#performance-architecture)
- [State Management & Data Integrity](#state-management--data-integrity)
- [Real-time Collaboration](#real-time-collaboration)

---

## Technology Stack

### Frontend

- **React 18** - UI library with hooks
- **Vite** - Build tool and dev server
- **TanStack Query (v5)** - Declarative server state, caching, & optimistic updates
- **Zustand** - Minimalist local state management (Settings, UI)
- **Context API** - Service orchestration (Auth, Notes Bridge)
- **Tailwind CSS** - Utility-first styling
- **Server-Sent Events (SSE)** - Real-time background synchronization

### Backend

- **Express.js** - Web framework
- **SQLite (better-sqlite3)** - Database
- **JWT (jsonwebtoken)** - Authentication
- **bcrypt** - Password hashing
- **node-cron** - Task scheduling
- **onnxruntime** - AI inference (Local AI)

### Development

- **Vitest** - Testing framework
- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript** - Type definitions (migration in progress)

---

## Frontend Architecture

### Component Hierarchy

```
App.jsx
├── ErrorBoundary
├── Router (Hash-based)
│   ├── AuthViews
│   │   ├── Login
│   │   └── Register
│   ├── NotesView
│   │   ├── DashboardLayout
│   │   │   ├── Sidebar
│   │   │   ├── SearchBar
│   │   │   └── NotesGrid
│   │   │       └── NoteCard (xN)
│   │   ├── SettingsPanel
│   │   └── Modal
│   │       ├── NoteEditor
│   │       ├── ImageViewer
│   │       ├── CollaborationModal
│   │       └── FormatToolbar
│   └── AdminView
│       ├── UserManagement
│       ├── LogViewer
│       └── SystemStats
└── GlobalProviders
    ├── AuthContext
    ├── NotesContext
    ├── SettingsContext
    ├── ModalContext
    ├── ComposerContext
    └── UIContext
```

### Key Components

**Views:**

- `AuthViews.jsx` - Login and registration forms
- `NotesView.jsx` - Main note dashboard
- `AdminView.jsx` - Administration panel

**Layout:**

- `DashboardLayout.jsx` - Application shell with sidebar
- `Sidebar.jsx` - Navigation and note counts
- `SearchBar.jsx` - Search and filter input

**Widgets:**

- `NoteCard.jsx` - Individual note display
- `Composer.jsx` - Quick note creation
- `SettingsPanel.jsx` - User preferences
- `Modal.jsx` - Complex modal state machine

**Utilities:**

- `ErrorBoundary.tsx` - Global error handling
- `DrawingCanvas.jsx` - Drawing note type
- `ChecklistRow.jsx` - Checklist item component

### Component Principles

1. **Single Responsibility** - One component, one purpose
2. **Composition** - Build complex UIs from simple components
3. **Reusability** - Design components for reuse
4. **Props Interface** - Clear prop documentation
5. **Error Boundaries** - Graceful error handling

---

## Backend Architecture

### Server Structure

```
server/index.js (Main Entry)
├── Middleware
│   ├── Security (Helmet)
│   ├── CORS
│   ├── Rate Limiting (3 tiers)
│   ├── Authentication (JWT)
│   ├── Error Handling
│   ├── Request Logging
│   ├── Performance Tracking
│   └── XSS/SQL Injection Prevention
├── Routes
│   ├── /api/auth (Authentication)
│   ├── /api/notes (Note CRUD)
│   ├── /api/users (User management)
│   ├── /api/events (SSE endpoints)
│   ├── /api/admin (Admin operations)
│   ├── /api/logs (Logging)
│   ├── /health, /ready (Health checks)
│   └── /metrics, /info (Monitoring)
├── Database Layer
│   ├── SQLite with better-sqlite3
│   ├── Prepared Statements
│   ├── Migration System
│   └── Connection Pooling
└── Background Tasks
    └── node-cron scheduler
        ├── Daily backups (2:00 AM)
        ├── Hourly log checks
        ├── Weekly cleanup (Sunday 3:00 AM)
        └── Daily health checks (6:00 AM)
```

### Middleware Stack

**Security Middleware:**

```javascript
// 1. Security Headers (Helmet)
helmet({
  contentSecurityPolicy: { ... },
  hsts: { maxAge: 31536000 }
})

// 2. CORS
cors({ origin: process.env.CORS_ORIGIN })

// 3. Rate Limiting
rateLimit({
  windowMs: 60000,
  max: 100 // Standard endpoints
})

// 4. Request Logging
morgan('combined')

// 5. Body Parsing
express.json({ limit: '10mb' })
express.urlencoded({ extended: true })
```

**Application Middleware:**

```javascript
// 6. Authentication (JWT verify)
app.use(authMiddleware)

// 7. Request ID Generation
app.use(requestIdMiddleware)

// 8. Performance Tracking
app.use(performanceMiddleware)

// 9. Error Handling
app.use(errorHandler)
```

### Route Architecture

**RESTful API Design:**

```
/api/auth/
  POST /register - Register user
  POST /login - Login user
  POST /secret-key - Login with key
  POST /logout - Logout

/api/notes/
  GET / - Get all notes
  POST / - Create note
  GET /:id - Get note
  PUT /:id - Update note
  DELETE /:id - Delete note
  POST /:id/archive - Archive note
  POST /reorder - Reorder notes
  GET /export - Export notes
  POST /import - Import notes

/api/users/
  GET /search - Search users
  GET /profile - Get profile
  PATCH /profile - Update profile

/api/admin/
  GET /users - Get all users
  DELETE /users/:id - Delete user
  GET /stats - System stats

/api/logs/
  GET / - Query logs
  POST / - Submit log
  GET /stats - Log stats
  POST /export - Export logs

/health - System health
/ready - Readiness probe
/metrics - Performance metrics
```

---

## Database Architecture

### Schema Design

**Tables:**

1. **users**

   ```sql
   CREATE TABLE users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT UNIQUE NOT NULL,
     email TEXT UNIQUE NOT NULL,
     password_hash TEXT NOT NULL,
     is_admin BOOLEAN DEFAULT 0,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **notes**

   ```sql
   CREATE TABLE notes (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     type TEXT NOT NULL DEFAULT 'text',
     title TEXT,
     content TEXT,
     items TEXT, -- JSON for checklist items
     tags TEXT, -- JSON array
     color TEXT DEFAULT 'default',
     transparency TEXT,
     images TEXT, -- JSON array
     pinned BOOLEAN DEFAULT 0,
     archived BOOLEAN DEFAULT 0,
     position INTEGER DEFAULT 0,
     pinned_to_dashboard BOOLEAN DEFAULT 0,
     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     last_edited_by TEXT,
     FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

3. **checklist_items**

   ```sql
   CREATE TABLE checklist_items (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     note_id INTEGER NOT NULL,
     item_id TEXT NOT NULL,
     text TEXT NOT NULL,
     done BOOLEAN DEFAULT 0,
     position INTEGER DEFAULT 0,
     FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
   );
   ```

4. **note_collaborators**

   ```sql
   CREATE TABLE note_collaborators (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     note_id INTEGER NOT NULL,
     user_id INTEGER NOT NULL,
     added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
     FOREIGN KEY (user_id) REFERENCES users(id),
     UNIQUE(note_id, user_id)
   );
   ```

5. **settings**

   ```sql
   CREATE TABLE settings (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     key TEXT UNIQUE NOT NULL,
     value TEXT NOT NULL,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   ```

6. **user_settings**

   ```sql
   CREATE TABLE user_settings (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     key TEXT NOT NULL,
     value TEXT NOT NULL,
     updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES users(id),
     UNIQUE(user_id, key)
   );
   ```

7. **note_views**
   ```sql
   CREATE TABLE note_views (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     note_id INTEGER NOT NULL,
     user_id INTEGER NOT NULL,
     viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
     FOREIGN KEY (user_id) REFERENCES users(id)
   );
   ```

### Indexes

```sql
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_pinned ON notes(pinned);
CREATE INDEX idx_notes_archived ON notes(archived);
CREATE INDEX idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX idx_notes_type ON notes(type);
CREATE INDEX idx_notes_pinned_dashboard ON notes(pinned_to_dashboard);
CREATE INDEX idx_checklist_items_note_id ON checklist_items(note_id);
CREATE INDEX idx_note_collaborators_note_id ON note_collaborators(note_id);
CREATE INDEX idx_note_collaborators_user_id ON note_collaborators(user_id);
CREATE INDEX idx_note_views_note_id ON note_views(note_id);
CREATE INDEX idx_note_views_user_id ON note_views(user_id);
CREATE INDEX idx_note_views_viewed_at ON note_views(viewed_at);
```

### Migration System

**Structure:**

```
server/migrations/
├── index.js (Migration runner)
├── backup.js (Backup/restore utilities)
└── v[version]_[name].js (Migration files)
```

**Migration File Template:**

```javascript
module.exports = {
  up: db => {
    // Apply migration
    db.exec(`
      ALTER TABLE notes
      ADD COLUMN new_field TEXT;
    `)
  },
  down: db => {
    // Rollback migration
    db.exec(`
      ALTER TABLE notes
      DROP COLUMN new_field;
    `)
  },
}
```

**Version Tracking:**

- SQLite `user_version` pragma
- Automatic version detection
- Up/down migration support
- Transaction safety

---

## Security Architecture

### Multi-Layer Security

**1. Network Layer:**

- HTTPS enforcement (HSTS)
- CORS configuration
- Security headers (Helmet)

**2. Authentication Layer:**

- JWT tokens with expiration
- bcrypt password hashing (12 rounds)
- Secret key encryption

**3. Authorization Layer:**

- User-specific data isolation
- Admin route protection
- Note ownership checks

**4. Input Validation Layer:**

- express-validator for all endpoints
- XSS prevention (HTML sanitization)
- SQL injection prevention (prepared statements)

**5. Rate Limiting Layer:**

- Three-tier rate limits
- Per-endpoint configuration
- Automatic blocking

**6. Logging Layer:**

- Structured error logging
- Audit trail for sensitive operations
- Security event tracking

### Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Rate Limiting

| Endpoint Type | Limit | Window   |
| ------------- | ----- | -------- |
| Standard      | 100   | 1 minute |
| Auth          | 10    | 1 minute |
| Upload        | 10    | 1 minute |
| AI            | 20    | 1 minute |

---

## Performance Architecture

### Three-Tier Caching

**Cache Layers:**

```
Level 1 (1 minute TTL): Recent queries
  ├─ API responses
  ├─ User profiles
  └─ Settings

Level 2 (5 minute TTL): Frequently accessed data
  ├─ Note lists
  ├─ Tags
  └─ Search results

Level 3 (1 hour TTL): Static/reference data
  ├─ System configuration
  ├─ Theme presets
  └─ Background images
```

**Cache Implementation:**

```javascript
const cache = require('../middleware/cache')

// Apply to routes
app.get('/api/notes', cache('5m'), getNotes)
app.get('/api/users/profile', cache('1h'), getProfile)
```

### Database Optimization

**Prepared Statements:**

```javascript
const stmt = db.prepare(`
  SELECT * FROM notes
  WHERE user_id = ? AND archived = 0
  ORDER BY position ASC
`)
const notes = stmt.all(userId)
```

**Batch Operations:**

```javascript
db.transaction(() => {
  notes.forEach(note => {
    db.prepare('INSERT INTO notes (...) VALUES (...)').run(note)
  })
})()
```

**Connection Management:**

- Single connection pool
- Automatic connection recovery
- WAL mode for concurrent access

### Frontend Optimization

**Code Splitting:**

```javascript
const AdminView = React.lazy(() => import('./components/AdminView'))
const SettingsPanel = React.lazy(() => import('./components/SettingsPanel'))

;<Suspense fallback={<Spinner />}>
  <AdminView />
</Suspense>
```

**Memoization:**

```javascript
const sortedNotes = useMemo(() => {
  return notes.sort((a, b) => a.position - b.position)
}, [notes])

const handleDelete = useCallback(
  id => {
    deleteNote(id)
  },
  [deleteNote]
)
```

**Optimistic Updates:**

```javascript
// Update UI immediately
setNotes(prev => prev.map(n => (n.id === noteId ? updatedNote : n)))

// API call with rollback on error
try {
  await updateNote(noteId, data)
} catch (error) {
  // Rollback
  setNotes(previousNotes)
  showToast('Update failed', 'error')
}
```

---

## State Management & Data Integrity

Glass Keep utilizes a multi-layered state management strategy to balance performance, local reactivity, and server synchronization.

### 1. Server State (TanStack Query)

The "Source of Truth" for all persistent data (Notes, Admin Users, Settings).

- **Caching**: Automatic caching and background refetching.
- **Optimistic Updates**: Immediate UI feedback for standard actions (Delete, Archive, Reorder).
- **Rollback Mechanism**: Automatic restoration of previous state if an API call fails.
- **Data Integrity**: Uses `PATCH` for field-level updates to prevent the "Stale Data Wipe" problem common with full `PUT` updates.

### 2. Local UI State (Zustand)

Manages ephemeral or purely local data.

- **SettingsStore**: Persistent local storage for themes, accent colors, and layout preferences.
- **UIStore**: Managing modals, toasts, and navigation states.

### 3. Service Layer (Context API)

Bridges the gap between raw hooks and UI requirements.

- **AuthContext**: Orchestrates login, token storage, and session validation.
- **NotesContext**: Aggregates `useNoteMutations` and `useNotes` queries. Provides a high-level API for complex UI tasks (e.g., "Clear Bin").
- **SSE Bridge**: Listens for remote changes and invalidates the Query Cache globally, triggering a refresh without manual state manipulation.

### State Flow (Circular Sync)

```
[User Action] → [Mutation Hook] → [Optimistic Update (UI)]
                               ↓
                         [Backend API (PATCH/PUT)]
                               ↓
                        [Database Update]
                               ↓
                        [SSE Broadcast]
                               ↓
                   [NotesContext SSE Listener]
                               ↓
                   [Query Cache Invalidation]
                               ↓
                     [UI Refresh (Final Sync)]
```

This "Circular Sync" pattern ensures that even in multi-tab or collaborative environments, every instance of the app remains consistent without complex client-side reconciliation logic.

---

## Real-time Collaboration

### SSE Architecture

**Server-Sent Events Flow:**

```javascript
// Client connection
const eventSource = new EventSource('/api/notes/events?token=jwt')

// Listen for updates
eventSource.addEventListener('notes-updated', e => {
  const data = JSON.parse(e.data)
  // Invalidate cache and refetch
  notesContext.invalidateCache()
  notesContext.fetchNotes()
})

// Presence tracking
eventSource.addEventListener('presence', e => {
  const data = JSON.parse(e.data)
  // Update user presence indicators
})
```

**Server-Side:**

```javascript
// SSE endpoint
app.get('/api/notes/events', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // Keep connection open
  // Send events on data changes
})

// Emit event on update
function emitNoteUpdate(noteId, action) {
  const event = `event: notes-updated\ndata: ${JSON.stringify({ noteId, action })}\n\n`
  // Send to all connected clients
}
```

### Collaboration Features

**Real-time Updates:**

- Note creation/deletion
- Note modifications
- Collaborator changes
- Presence indicators

**Presence Tracking:**

- Viewers count per note
- Last seen timestamps
- User activity indicators

**Conflict Resolution:**

- Optimistic updates with rollback
- Last-write-wins strategy
- Conflict notifications

---

## Monitoring & Health

### Health Checks

**`GET /health`**

- Database connectivity
- Cache operational status
- Memory usage (< 90%)
- Disk space availability
- Overall system status

**`GET /ready`**

- Database readiness only
- Kubernetes probe compatible

### Metrics

**`GET /metrics`**

- Request count/duration
- Database query count/duration
- AI operation count/duration
- Cache hit/miss rates
- Memory/CPU usage

**`GET /metrics/prometheus`**

- Prometheus-compatible format
- Histogram metrics
- Counter metrics
- Gauge metrics

---

## Deployment Architecture

### Development

```
Vite Dev Server (5173)
    ↓ (proxy)
Express API Server (3000)
    ↓
SQLite Database
```

### Production

```
Nginx (Reverse Proxy)
    ↓
Static Files (dist/)
    ↓
Express API Server (3000)
    ↓
SQLite Database
```

### Environment Variables

**Required:**

- `NODE_ENV` - development/production
- `JWT_SECRET` - JWT signing secret
- `DATABASE_PATH` - Database file path

**Optional:**

- `PORT` - Server port (default: 3000)
- `AI_ENABLED` - Enable AI features (default: true)
- `CORS_ORIGIN` - Allowed CORS origin
- `LOG_DIR` - Log directory path

---

## Scalability Considerations

### Current Architecture

- Single-server deployment
- In-memory caching
- SQLite database
- SSE for real-time

### Scaling Path

**Horizontal Scaling:**

- Add Redis for distributed caching
- Migrate to PostgreSQL/MySQL
- Use message queue for SSE (Redis Pub/Sub)
- Load balancer for multiple instances

**Vertical Scaling:**

- Increase server resources
- Database connection pooling
- Optimize queries and indexes
- Implement read replicas

**CDN Strategy:**

- Static asset delivery
- Image optimization
- Geographic distribution
- Edge caching

---

## Conclusion

GlassKeep's architecture is designed for:

**Modularity** - Clean separation of concerns
**Security** - Multi-layer protection
**Performance** - Three-tier caching and optimization
**Scalability** - Foundation for horizontal scaling
**Maintainability** - Clear structure and documentation
**Reliability** - Error handling and health monitoring

**Production Ready:** ✅ YES

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Complete
