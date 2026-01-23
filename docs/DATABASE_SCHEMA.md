# Database Schema

**Version:** ALPHA 1.0  
**Last Updated:** January 19, 2026  

---

## Overview

GlassKeep uses SQLite with a migration system for database management. This document provides complete schema information and migration details.

---

## Tables

### users

User accounts and authentication data.

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

**Indexes:**
- `username` (unique)
- `email` (unique)

---

### notes

Primary notes table storing all note data.

```sql
CREATE TABLE notes (
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
  deleted_at INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `user_id` - Fast user queries (via foreign key)
- `idx_notes_deleted_at` - Trash/recovery queries
- `timestamp` - Sort by creation time
- `position` - Ordering for display

**Note Types:**
- `text` - Plain text notes
- `checklist` - Todo lists

**Colors:**
- `default`, `red`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`

**Soft Delete:**
- `deleted_at` - NULL for active notes, UNIX timestamp for trash
- Notes in trash are recoverable for 30 days
- Automatic cleanup of notes >30 days in trash

---

### checklist_items

Individual checklist items for checklist-type notes.

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

**Indexes:**
- `note_id` - Fast note lookups

---

### note_collaborators

Collaboration relationships between users and notes.

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

**Indexes:**
- `note_id` - Get collaborators for note
- `user_id` - Get notes user can access

---

### settings

Application-wide settings.

```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Example Settings:**
- `allow_registration` - Boolean for registration availability
- `maintenance_mode` - Boolean for maintenance status

---

### user_settings

User-specific preferences and settings.

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

**Available Settings Keys:**
- `dark` - Dark mode (boolean)
- `backgroundImage` - Background filename (string)
- `backgroundOverlay` - Show overlay (boolean)
- `accentColor` - Accent color (string)
- `cardTransparency` - Transparency level (string)
- `alwaysShowSidebarOnWide` - Sidebar visibility (boolean)
- `localAiEnabled` - AI assistant (boolean)

**Indexes:**
- `user_id` - Fast user settings lookup

---

### note_views

Note view analytics and tracking.

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

**Indexes:**
- `note_id` - Track note popularity
- `user_id` - User's viewed notes
- `viewed_at` - Time-based queries

---

## Migration System

### Current Version: 4

### Migration History

**v1 - Initial Schema (2026-01-01)**
- Created all tables
- Set up indexes
- Established foreign key relationships

**v2 - Add Indexes (2026-01-05)**
- Added performance indexes
- Optimized query patterns
- Improved sorting and filtering

**v3 - Add Collaboration (2026-01-10)**
- Created note_collaborators table
- Added note_views table
- Enabled real-time collaboration

**v4 - Add Settings (2026-01-15)**
- Created user_settings table
- Created settings table
- Added view_mode setting

**v5 - Add Soft Delete (2026-01-21)**
- Added deleted_at column to notes table
- Created idx_notes_deleted_at index
- Enabled trash/recovery feature with 30-day retention

---

## Running Migrations

```bash
cd GLASSYDASH/server
npm run migrate
```

This will:
1. Check current database version
2. Apply pending migrations in order
3. Update version number
4. Commit changes transactionally

---

## Rollback

```bash
cd GLASSYDASH/server
# Edit migrations/index.js
# Set target version for rollback
npm run migrate:down
```

---

## Backup & Restore

### Backup

```bash
cd GLASSYDASH/server
npm run db:backup
# Creates: data/backups/notes.db.YYYY-MM-DDTHH-mm-ss
```

### Restore

```bash
cd GLASSYDASH/server
npm run db:restore <backup-file>
# Automatically creates pre-restore backup
```

---

## Query Examples

### Get user's active notes

```sql
SELECT * FROM notes
WHERE user_id = ? AND archived = 0
ORDER BY pinned DESC, position ASC;
```

### Get note with collaborators

```sql
SELECT n.*, u.username, u.email
FROM notes n
LEFT JOIN note_collaborators nc ON n.id = nc.note_id
LEFT JOIN users u ON nc.user_id = u.id
WHERE n.id = ?;
```

### Get user's settings

```sql
SELECT key, value FROM user_settings
WHERE user_id = ?;
```

### Search notes

```sql
SELECT * FROM notes
WHERE user_id = ?
  AND (title LIKE ? OR content LIKE ?)
  AND archived = 0
ORDER BY updated_at DESC
LIMIT 50;
```

### Get popular notes

```sql
SELECT n.*, COUNT(nv.id) as view_count
FROM notes n
LEFT JOIN note_views nv ON n.id = nv.note_id
WHERE n.user_id = ?
GROUP BY n.id
ORDER BY view_count DESC
LIMIT 10;
```

---

## Performance Considerations

### Index Usage
All frequently queried columns are indexed for performance.

### Prepared Statements
Always use prepared statements to prevent SQL injection and improve performance.

### Transactions
Use transactions for bulk operations to maintain data integrity.

### Connection Management
- Single connection pool
- WAL mode for concurrent reads
- Automatic connection recovery

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Complete