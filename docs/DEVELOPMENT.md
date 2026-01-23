# Development Guide

**Version:** ALPHA 1.0  
**Last Updated:** January 19, 2026  

---

## Overview

This guide covers everything you need to know for developing GlassKeep, from setting up your environment to understanding the codebase architecture.

---

## Table of Contents

- [Environment Setup](#environment-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Architecture](#code-architecture)
- [State Management](#state-management)
- [Component Development](#component-development)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [Common Tasks](#common-tasks)

---

## Environment Setup

### Prerequisites

- Node.js v18.0.0+
- npm v9.0.0+
- Git
- VS Code (recommended)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd glassy-dash/GLASSYDASH

# Install dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Create environment file
cd server
touch .env
```

### Environment Variables

Create `server/.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=../data/notes.db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
AI_ENABLED=true
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=10485760
```

Generate secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Project Structure

```
GLASSYDASH/
├── server/                 # Backend API server
│   ├── index.js            # Main server entry
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── utils/             # Server utilities
│   ├── migrations/        # Database migrations
│   ├── scheduler.js       # Task scheduler
│   └── package.json       # Server dependencies
├── src/
│   ├── components/        # React components
│   │   ├── views/        # Page-level components
│   │   ├── layout/       # Layout components
│   │   └── widgets/      # Reusable widgets
│   ├── contexts/         # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Root component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── data/                 # Runtime data
│   ├── notes.db         # SQLite database
│   └── ai-cache/        # AI model cache
├── docs/                # Documentation
├── package.json          # Root dependencies
├── vite.config.js        # Vite configuration
└── tsconfig.json        # TypeScript config
```

---

## Development Workflow

### Start Development Servers

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Available Scripts

```bash
# Development
npm run dev              # Start frontend dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                # Run tests
npm test -- --watch     # Watch mode
npm test -- --coverage  # With coverage

# Server
cd server
npm run dev             # Development server
npm start               # Production server
npm run migrate         # Run migrations
npm run db:backup       # Backup database
npm run db:restore      # Restore database
```

---

## Code Architecture

### Frontend Architecture

**Component Hierarchy:**

```
App.jsx
├── ErrorBoundary
├── Router
│   ├── AuthViews (Login/Register)
│   ├── NotesView
│   │   ├── DashboardLayout
│   │   │   ├── Sidebar
│   │   │   ├── SearchBar
│   │   │   └── NotesGrid
│   │   │       └── NoteCard
│   │   ├── SettingsPanel
│   │   └── Modal
│   └── AdminView
└── GlobalProviders
    ├── AuthContext
    ├── NotesContext
    ├── SettingsContext
    ├── ModalContext
    ├── ComposerContext
    └── UIContext
```

**State Management:**

GlassKeep uses React Context API for state management:

- **AuthContext** - Authentication and user session
- **NotesContext** - Note CRUD, search, filtering, SSE sync
- **SettingsContext** - User preferences and theming
- **ModalContext** - Modal state and complex form handling
- **ComposerContext** - Note creation state
- **UIContext** - Global UI state (toasts, dialogs)

### Backend Architecture

**Express.js Server:**

```
server/index.js
├── Middleware
│   ├── Security Headers (Helmet)
│   ├── CORS
│   ├── Rate Limiting
│   ├── Authentication (JWT)
│   ├── Error Handling
│   ├── Request Logging
│   └── Performance Tracking
├── Routes
│   ├── /api/auth/*      # Authentication
│   ├── /api/notes/*     # Note CRUD
│   ├── /api/users/*     # User management
│   ├── /api/events/*    # SSE endpoints
│   ├── /api/admin/*     # Admin operations
│   ├── /api/logs/*      # Logging
│   └── /health, /ready  # Health checks
├── Database Layer
│   ├── SQLite with better-sqlite3
│   ├── Prepared Statements
│   └── Migration System
└── Background Tasks
    └── node-cron scheduler
```

---

## State Management

### Context API Usage

**Using Contexts in Components:**

```jsx
import { useNotes } from '../contexts/NotesContext';
import { useSettings } from '../contexts/SettingsContext';

function MyComponent() {
  const { notes, createNote, deleteNote } = useNotes();
  const { dark, setDark } = useSettings();

  return (
    <div className={dark ? 'dark' : 'light'}>
      <button onClick={() => createNote({ title: 'New' })}>
        Create Note
      </button>
    </div>
  );
}
```

**Context Best Practices:**

1. **Use custom hooks** - Don't access context directly
2. **Memoize callbacks** - Use `useCallback` for performance
3. **Optimize selectors** - Only subscribe to needed state
4. **Avoid prop drilling** - Use contexts instead

### Data Persistence

**Client-Side:**

```jsx
// Settings persist to localStorage
const { settings, updateSettings } = useSettings();

// Auth tokens in localStorage
const { token, login, logout } = useAuth();
```

**Server-Side:**

```javascript
// Notes in SQLite
// Automatic SSE sync to clients
// Three-tier caching (1min, 5min, 1hour)
```

---

## Component Development

### Creating a New Component

**1. Create Component File:**

```jsx
// src/components/MyComponent.jsx
import React from 'react';

export function MyComponent({ title, onSave }) {
  const [value, setValue] = React.useState('');

  const handleSave = () => {
    onSave(value);
    setValue('');
  };

  return (
    <div className="my-component">
      <h2>{title}</h2>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

**2. Create Styles:**

```css
/* src/components/MyComponent.css */
.my-component {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}
```

**3. Export from Index:**

```javascript
// src/components/index.js
export { MyComponent } from './MyComponent';
```

### Component Best Practices

1. **Single Responsibility** - One component, one purpose
2. **Pure Functions** - Avoid side effects in render
3. **Props Validation** - Document required props
4. **Error Handling** - Use ErrorBoundaries
5. **Performance** - Memoize expensive operations

```jsx
// Good: Pure component with memoization
import React, { memo } from 'react';

const NoteCard = memo(({ note, onClick }) => {
  return (
    <div onClick={() => onClick(note.id)}>
      {note.title}
    </div>
  );
});

export default NoteCard;
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific file
npm test -- NoteCard.test.jsx
```

### Writing Tests

```jsx
// src/components/__tests__/NoteCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { NotesContext } from '../../contexts/NotesContext';
import NoteCard from '../NoteCard';

describe('NoteCard', () => {
  const mockDeleteNote = jest.fn();

  const renderWithProvider = (component) => {
    return render(
      <NotesContext.Provider value={{ deleteNote: mockDeleteNote }}>
        {component}
      </NotesContext.Provider>
    );
  };

  it('renders note title', () => {
    const note = { id: 1, title: 'Test Note' };
    renderWithProvider(<NoteCard note={note} />);
    
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  it('calls delete on delete button click', () => {
    const note = { id: 1, title: 'Test' };
    renderWithProvider(<NoteCard note={note} />);
    
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    expect(mockDeleteNote).toHaveBeenCalledWith(1);
  });
});
```

### Test Coverage

**Current Coverage:**
- GlassKeep: 20 test cases
- DashyDash: 28 test cases
- Total: 48 test cases

**Goal:** 80%+ coverage for critical paths

---

## Git Workflow

### Branch Naming

```bash
feature/add-checklist-component
fix/note-deletion-bug
docs/update-api-documentation
refactor/notes-context-optimization
test/add-unit-tests
chore/update-dependencies
```

### Commit Messages

Follow Conventional Commits:

```bash
feat: add checklist note type
fix: resolve race condition in note deletion
docs: update API documentation
style: format code with Prettier
refactor: extract modal logic to ModalContext
test: add unit tests for NoteCard
chore: update dependencies to latest versions
```

### Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New tests added for features
- [ ] Documentation updated
- [ ] No console errors
- [ ] Performance impact considered

---

## Common Tasks

### Add New API Endpoint

**1. Create Route Handler:**

```javascript
// server/routes/myroute.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const data = await getData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

**2. Register in Server:**

```javascript
// server/index.js
const myRoute = require('./routes/myroute');
app.use('/api/myroute', myRoute);
```

**3. Add API Wrapper:**

```javascript
// src/utils/helpers.js
export async function myApiCall() {
  return api('/api/myroute');
}
```

### Add New Note Type

**1. Update Database Schema:**

```javascript
// server/migrations/add_new_note_type.js
module.exports = {
  up: (db) => {
    db.exec(`
      ALTER TABLE notes
      ADD COLUMN new_field TEXT;
    `);
  },
  down: (db) => {
    db.exec(`
      ALTER TABLE notes
      DROP COLUMN new_field;
    `);
  }
};
```

**2. Create Component:**

```jsx
// src/components/NewNoteType.jsx
export function NewNoteType({ note, onSave }) {
  // Component logic
}
```

**3. Register in Modal:**

```jsx
// src/components/Modal.jsx
import { NewNoteType } from './NewNoteType';

// Add to note type switch
```

### Add Settings Option

**1. Update Context:**

```jsx
// src/contexts/SettingsContext.jsx
const [newSetting, setNewSetting] = useState(false);

const value = {
  // ... existing
  newSetting,
  setNewSetting: (val) => {
    setNewSetting(val);
    localStorage.setItem('newSetting', JSON.stringify(val));
  }
};
```

**2. Add UI:**

```jsx
// src/components/SettingsPanel.jsx
<div className="setting-item">
  <label>New Setting</label>
  <input
    type="checkbox"
    checked={newSetting}
    onChange={(e) => setNewSetting(e.target.checked)}
  />
</div>
```

### Debug Common Issues

**CORS Error:**

```bash
# Check CORS_ORIGIN in .env
# Should match frontend URL
```

**Database Locked:**

```bash
# Kill zombie processes
ps aux | grep sqlite
kill -9 <PID>

# Or delete WAL files
rm data/notes.db-shm data/notes.db-wal
```

**Hot Reload Not Working:**

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

---

## Performance Best Practices

### Frontend Optimization

```jsx
// Memoize expensive computations
const sortedNotes = useMemo(() => {
  return notes.sort((a, b) => a.position - b.position);
}, [notes]);

// Memoize callbacks
const handleDelete = useCallback((id) => {
  deleteNote(id);
}, [deleteNote]);

// Code splitting
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Lazy load with Suspense
<Suspense fallback={<Spinner />}>
  <HeavyComponent />
</Suspense>
```

### Backend Optimization

```javascript
// Use prepared statements
const stmt = db.prepare('SELECT * FROM notes WHERE user_id = ?');
const notes = stmt.all(userId);

// Enable caching
const cache = require('../middleware/cache');
app.get('/api/notes', cache('5m'), getNotes);

// Batch operations
db.transaction(() => {
  notes.forEach(note => {
    db.prepare('INSERT INTO notes (...) VALUES (...)').run(note);
  });
})();
```

---

## Security Best Practices

### Frontend Security

```jsx
// Sanitize user input
import DOMPurify from 'dompurify';
const cleanContent = DOMPurify.sanitize(userContent);

// Never store secrets in frontend code
// Use environment variables
const API_URL = import.meta.env.VITE_API_URL;
```

### Backend Security

```javascript
// Validate input
const { title } = req.body;
if (!title || title.length > 200) {
  return res.status(400).json({ error: 'Invalid title' });
}

// Use prepared statements (SQL injection prevention)
const stmt = db.prepare('SELECT * FROM notes WHERE id = ?');
const note = stmt.get(noteId);

// Rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api/auth/', rateLimit({ windowMs: 60000, max: 5 }));
```

---

## Troubleshooting

### Common Issues

**Module Not Found:**

```bash
rm -rf node_modules package-lock.json
npm install
```

**Port Already in Use:**

```bash
lsof -i :3000
kill -9 <PID>
```

**Build Errors:**

```bash
# Clear cache
rm -rf node_modules/.vite
rm -rf dist

# Reinstall
npm install

# Rebuild
npm run build
```

---

## Next Steps

- **[COMPONENT_GUIDE.md](COMPONENT_GUIDE.md)** - Component reference
- **[API_REFERENCE.md](API_REFERENCE.md)** - API documentation
- **[TESTING.md](TESTING.md)** - Testing guidelines
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues

---

**Happy Coding! 💻**

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Complete