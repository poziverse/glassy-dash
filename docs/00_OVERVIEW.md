# GLASSYDASH System Overview
**Version:** 2.0  
**Last Updated:** January 20, 2026  
**Status:** Production Ready

---

## Executive Summary

GLASSYDASH is a modern, full-featured notes application inspired by Google Keep, built with React, Express, and SQLite. It provides a sleek, glassmorphic UI with comprehensive features including Markdown editing, checklists, drawings, real-time collaboration, AI assistance, and advanced theming.

### Key Characteristics

- **Modern Stack**: React + Vite (frontend), Express + SQLite (backend)
- **Real-time**: Server-Sent Events (SSE) for live updates
- **Collaborative**: Multi-user with real-time note collaboration
- **AI-Powered**: Local Llama 3.2 integration for intelligent assistance
- **Production Ready**: Docker deployment, comprehensive logging, security features
- **Responsive**: Mobile-first design with PWA support

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                        │
│                    (React + Vite + Tailwind)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │
┌────────────────────────┴────────────────────────────────────┐
│                      Application Server                       │
│                      (Express + Node.js)                      │
├──────────────────────────────────────────────────────────┤
│  • REST API Endpoints                                        │
│  • Authentication (JWT)                                      │
│  • Real-time Updates (SSE)                                   │
│  • Business Logic                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │
┌────────────────────────┴────────────────────────────────────┐
│                      Data Layer                              │
│                    (SQLite + better-sqlite3)                 │
├──────────────────────────────────────────────────────────┤
│  • Users Table                                               │
│  • Notes Table                                               │
│  • Tags Table                                                │
│  • Collaboration Table                                       │
└──────────────────────────────────────────────────────────┘
```

### Component Architecture

```
App (Root)
├── AuthProvider (Authentication Context)
│   ├── AuthViews (Login/Register)
│   └── Protected Routes
│
├── UIProvider (UI State)
│   ├── Theme Management
│   ├── Dark Mode
│   └── View Mode (Grid/List)
│
├── NotesProvider (Notes State)
│   ├── NotesView (Grid/List Display)
│   │   ├── NoteCard (Individual Note)
│   │   └── Bulk Operations
│   ├── Modal (Note Editor)
│   │   ├── FormatToolbar
│   │   ├── DrawingCanvas
│   │   ├── ChecklistRow
│   │   └── Image Preview
│   ├── Composer (Note Creator)
│   └── Sidebar (Tags/Filters)
│
├── ModalProvider (Modal State)
│   └── Modal Components
│
├── SettingsProvider (Settings State)
│   └── SettingsPanel
│
├── AdminView (Admin Panel)
│   └── User Management
│
└── SearchBar
    ├── Text Search
    └── AI Assistant (Llama 3.2)
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| Vite | 5.x | Build Tool & Dev Server |
| Tailwind CSS | 4.x | Styling |
| React Router | 6.x | Client-side Routing |
| SSE | Native | Real-time Updates |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Express | 4.x | Web Framework |
| Node.js | 18+ | Runtime |
| better-sqlite3 | 9.x | Database |
| jsonwebtoken | 9.x | Authentication |
| bcryptjs | 2.x | Password Hashing |
| CORS | 2.x | Cross-Origin Requests |

### Development Tools

| Technology | Purpose |
|------------|---------|
| ESLint | Code Linting |
| Prettier | Code Formatting |
| Vitest | Unit Testing |
| Playwright | E2E Testing |
| Docker | Containerization |

---

## Core Features

### 1. Note Management

**Note Types:**
- Text Notes with Markdown support
- Checklists with drag-and-drop reordering
- Drawing/Handwritten notes
- Mixed content (text + images + drawings)

**Operations:**
- Create, Read, Update, Delete (CRUD)
- Pin/Unpin notes
- Color customization
- Tag management
- Bulk operations (multi-select)

### 2. Collaboration

**Features:**
- Real-time collaboration on notes
- Add/remove collaborators by username/email
- View-only mode for collaborators
- Automatic conflict resolution
- Real-time checklist sync

**Implementation:**
- Server-Sent Events (SSE) for live updates
- Optimistic updates for UI responsiveness
- Token-based authentication for collaborators

### 3. AI Assistant

**Features:**
- Local Llama 3.2 (1B) model
- Note-aware (RAG - Retrieval Augmented Generation)
- Private - no data leaves your server
- Smart search and question answering

**Use Cases:**
- "What are my AWS commands?"
- "How old am I?"
- "Show me all notes about X"

### 4. Theming System

**Features:**
- Dark/Light mode
- Theme presets (Neon Tokyo, Zen Garden, etc.)
- Custom background images
- Accent colors (7 bioluminescent options)
- Card transparency levels
- Smart overlay for readability

**Implementation:**
- CSS Custom Properties for theming
- Context-based state management
- Persistent storage (localStorage)

### 5. Search

**Capabilities:**
- Full-text search across:
  - Note titles
  - Markdown content
  - Tags
  - Checklist items
  - Image names
- AI-powered query assistance
- Quick filters (All Notes, All Images)

### 6. Import/Export

**Features:**
- Export all notes to JSON
- Import JSON (merges with existing)
- Export individual notes to Markdown
- Import from Google Takeout

### 7. Administration

**Features:**
- User management (CRUD)
- Password reset
- Admin role assignment
- Registration toggle
- User statistics (notes count, storage used)

### 8. Security

**Features:**
- JWT-based authentication
- Secret key recovery
- Password hashing (bcrypt)
- Protected API endpoints
- Admin-only endpoints
- CORS protection

---

## Data Model

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  secret_key TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Notes Table
```sql
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'text', -- 'text', 'checklist', 'drawing'
  color TEXT DEFAULT 'white',
  is_pinned INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Checklist Items Table
```sql
CREATE TABLE checklist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  is_checked INTEGER DEFAULT 0,
  position INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
```

#### Tags Table
```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
```

#### Collaborators Table
```sql
CREATE TABLE collaborators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  permission TEXT DEFAULT 'edit', -- 'edit', 'view'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(note_id, user_id)
);
```

#### Images Table
```sql
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  data BLOB NOT NULL,
  size INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/recover-secret` - Recover secret key
- `POST /api/auth/login-secret` - Login with secret key

### Notes
- `GET /api/notes` - Get all notes for user
- `GET /api/notes/:id` - Get single note
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `PATCH /api/notes/:id/pin` - Toggle pin status
- `POST /api/notes/bulk` - Bulk operations (delete, pin, color)
- `POST /api/notes/import` - Import notes from JSON
- `POST /api/notes/export` - Export all notes

### Tags
- `GET /api/tags` - Get all tags for user
- `POST /api/notes/:id/tags` - Add tag to note
- `DELETE /api/notes/:id/tags/:tag` - Remove tag from note

### Collaboration
- `GET /api/notes/:id/collaborators` - Get note collaborators
- `POST /api/notes/:id/collaborators` - Add collaborator
- `DELETE /api/notes/:id/collaborators/:userId` - Remove collaborator

### Images
- `POST /api/notes/:id/images` - Upload image
- `DELETE /api/images/:id` - Delete image

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `DELETE /api/admin/users/:id` - Delete user
- `PATCH /api/admin/users/:id/admin` - Toggle admin status
- `POST /api/admin/users/:id/reset-password` - Reset password

### SSE (Server-Sent Events)
- `GET /api/sse/notes` - Real-time note updates
- `GET /api/sse/users` - Real-time user events (admin only)

### Logging (Admin Only)
- `GET /api/logs` - Query logs
- `GET /api/logs/stats` - Get log statistics
- `POST /api/logs/export` - Export logs
- `GET /api/logs/recent` - Get recent logs

### AI (Local Llama 3.2)
- `POST /api/ai/query` - Ask AI about your notes

---

## State Management

### Context Providers

1. **AuthProvider**
   - Manages user authentication state
   - Handles login/logout
   - Provides JWT token
   - User data persistence

2. **NotesProvider**
   - Manages notes state
   - CRUD operations
   - Real-time updates via SSE
   - Bulk operations
   - Filtering and search

3. **ModalProvider**
   - Manages modal state
   - View/Edit mode toggling
   - Modal data management

4. **SettingsProvider**
   - Theme management
   - View mode (grid/list)
   - Dark mode toggle
   - Settings persistence

5. **UIProvider**
   - UI state management
   - Toast notifications
   - Loading states

6. **ComposerProvider**
   - Note composer state
   - Draft management
   - Form validation

---

## Real-time Updates (SSE)

### Implementation

GLASSYDASH uses Server-Sent Events (SSE) for real-time updates:

1. **Note Updates Channel** (`/api/sse/notes`)
   - Broadcasts note changes to all collaborators
   - Events: `note.created`, `note.updated`, `note.deleted`
   - User-specific filtering

2. **User Events Channel** (`/api/sse/users`)
   - Broadcasts user management events
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Admin only

### Event Flow

```
User Action → API Request → Database Update → SSE Broadcast → Client Update
```

### Conflict Resolution

- Optimistic updates for UI responsiveness
- Server validation as source of truth
- Automatic conflict resolution for collaborative notes
- Version checking to prevent overwrites

---

## Security Architecture

### Authentication Flow

1. User submits credentials
2. Server validates credentials
3. Server generates JWT token
4. Token stored in localStorage
5. Token sent with API requests
6. Server validates token on protected routes
7. Token refresh on expiration

### Authorization Levels

- **Anonymous**: Public pages (login, register)
- **Authenticated User**: User's notes and data
- **Admin**: All users and system-wide settings

### Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token expiration (24 hours default)
- CORS protection
- SQL injection prevention (parameterized queries)
- XSS protection (React sanitization)
- Rate limiting (optional, for production)

---

## Performance Considerations

### Frontend Optimization

- Code splitting with React.lazy
- Image compression before upload
- Virtual scrolling for large note lists (planned)
- Debounced search input
- Optimistic updates for immediate feedback

### Backend Optimization

- Connection pooling (SQLite handles this)
- Indexed database queries
- Efficient SSE connections
- Batch operations for bulk actions
- Caching strategies (planned)

---

## Deployment Options

### 1. Development
- Vite dev server (http://localhost:5173)
- Express API (http://localhost:8080)
- Hot module replacement

### 2. Production (Docker)
- Single container with Node.js
- Built frontend served by Express
- Persistent data volume
- Environment variable configuration

### 3. Production (Manual)
- Build frontend: `npm run build`
- Serve static files with Express
- Configure reverse proxy (nginx)
- SSL/TLS certificate
- Process manager (PM2 or systemd)

---

## Logging and Monitoring

### Client Logging

- 5.6 KB logger module
- 18 event types
- Sent to server with metadata
- Automatic error capture

### Server Logging

- 10 KB logging module
- 4 admin APIs for log management
- 30-day retention with rotation
- NDJSON format for easy parsing
- Query by type, user, date range

### Log Types

- Auth events (login, logout, register)
- API events (requests, responses, errors)
- Data events (CRUD operations)
- System events (startup, shutdown, errors)

---

## Testing Strategy

### Unit Tests (Vitest)
- Component rendering
- Context providers
- Utility functions
- Business logic

### Integration Tests
- API endpoints
- Database operations
- Authentication flows

### E2E Tests (Playwright)
- User workflows
- Cross-browser testing
- Mobile responsiveness

### Stability Tests
- Memory leak detection
- SSE connection cleanup
- Race condition prevention

---

## Known Limitations

1. **PWA Offline Support**: Phase 3 stopped - not fully implemented
2. **Scalability**: SQLite limits concurrent writes (suitable for small-medium deployments)
3. **File Storage**: Images stored in database (consider CDN for production)
4. **AI Model**: Llama 3.2 1B is optimized but may not handle complex queries as well as larger models

---

## Future Enhancements

1. **Advanced AI**: Support for larger models, multi-modal AI
2. **Database Migration**: PostgreSQL for better scalability
3. **File Storage**: AWS S3 or similar for images
4. **Advanced Collaboration**: Cursors, presence indicators
5. **Mobile App**: React Native implementation
6. **Plugins**: Extensible plugin architecture
7. **WebRTC**: Direct peer-to-peer collaboration

---

## Documentation Index

- [Components Documentation](./01_COMPONENTS.md)
- [Contexts Documentation](./02_CONTEXTS.md)
- [Hooks Documentation](./03_HOOKS.md)
- [Utils Documentation](./04_UTILS.md)
- [API Documentation](./05_API.md)
- [Database Documentation](./06_DATABASE.md)
- [Authentication Documentation](./07_AUTHENTICATION.md)
- [Collaboration Documentation](./08_COLLABORATION.md)
- [AI Integration Documentation](./09_AI_INTEGRATION.md)
- [Theming Documentation](./10_THEMING.md)
- [PWA Documentation](./11_PWA.md)
- [Logging Documentation](./12_LOGGING.md)
- [Security Documentation](./13_SECURITY.md)

---

**Related Documents:**
- [README.md](../README.md) - Project overview and setup
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API reference
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Quick start guide

**Last Updated:** January 20, 2026  
**Maintained By:** Development Team  
**Status:** ✅ Current