// server/index.js
// Express + SQLite (sqlite3 async) + JWT auth API for Glass Keep

const path = require('path')

// Load environment variables from config
const { NODE_ENV, PORT, JWT_SECRET, DB_FILE } = require('./config')
const fs = require('fs')
const express = require('express')

// ---------- Process Error Handling ----------

function logAuth(msg) {
  try {
    fs.appendFileSync(
      path.join(__dirname, 'debug_auth.log'),
      new Date().toISOString() + ' ' + msg + '\n'
    )
  } catch (e) {
    console.error('Log failed', e)
  }
}

process.on('uncaughtException', err => {
  console.error('❌ CRITICAL: Uncaught Exception:', err.message, err.stack)
})
process.on('unhandledRejection', (reason, p) => {
  console.error('❌ CRITICAL: Unhandled Rejection at:', p, 'reason:', reason)
})

const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Database = require('./db')
const cors = require('cors')
const crypto = require('crypto')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

// transformers.js setup remains same...
// ... (omitted for brevity, keeping existing code)

const app = express()

// ---------- CORS ----------
app.use(cors())

// ---------- Body Parsing ----------
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// ---------- Monitoring ----------
try {
  const monitoringRoutes = require('./routes/monitoring')
  app.use('/api/monitoring', monitoringRoutes)
  console.log('✓ Monitoring routes mounted at /api/monitoring')
} catch (err) {
  console.error('Failed to load monitoring routes:', err)
}

// ---------- YouTube ----------
try {
  const youtubeRoutes = require('./routes/youtube')
  app.use('/api/youtube', youtubeRoutes)
  console.log('✓ YouTube routes mounted at /api/youtube')
} catch (err) {
  console.error('Failed to load YouTube routes:', err)
}

// ---------- Music ----------
try {
  const musicRoutes = require('./routes/music')
  app.use('/api/music', musicRoutes)
  console.log('✓ Music routes mounted at /api/music')
} catch (err) {
  console.error('Failed to load Music routes:', err)
}

// ---------- Icons ----------
try {
  const iconRoutes = require('./routes/icons')
  app.use('/api/icons', iconRoutes)
  console.log('✓ Icon routes mounted at /api/icons')
} catch (err) {
  console.error('Failed to load Icon routes:', err)
}

// ---------- Bug Reports ----------
try {
  const bugReportRoutes = require('./routes/bug_reports')
  app.use('/api/bug-reports', bugReportRoutes)
  console.log('✓ Bug report routes mounted at /api/bug-reports')
} catch (err) {
  console.error('Failed to load Bug Report routes:', err)
}

// ---------- AI Assistant ----------
try {
  const aiRoutes = require('./routes/ai')
  app.use('/api/ai', aiRoutes)
  console.log('✓ AI routes mounted at /api/ai')
} catch (err) {
  console.error('Failed to load AI routes:', err)
}

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' },
})

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' },
})

const secretKeyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many secret key attempts, please try again later.' },
})

// ---------- SQLite ----------
const dbFile = DB_FILE
console.log('---------------------------------------------------')
console.log('>> DATABASE_PATH env:', process.env.DATABASE_PATH)
console.log('>> SELECTED DB FILE:', dbFile)
console.log('---------------------------------------------------')

// Ensure directory for DB exists
try {
  fs.mkdirSync(path.dirname(dbFile), { recursive: true })
} catch (e) {
  if (e.code !== 'EEXIST') {
    console.error('Failed to ensure DB directory:', e)
  }
}

const db = new Database(dbFile)

// ---------- Schema Validation ----------
async function validateDatabaseSchema() {
  console.log('🔍 Validating database schema...')

  try {
    // Validate notes table structure
    const notesColumns = await db.prepare(`PRAGMA table_info(notes)`).all()
    const notesColumnNames = new Set(notesColumns.map(c => c.name))

    const requiredNotesColumns = [
      'id',
      'user_id',
      'type',
      'title',
      'content',
      'items_json',
      'tags_json',
      'images_json',
      'color',
      'pinned',
      'position',
      'timestamp',
      'archived',
      'updated_at',
      'last_edited_by',
      'last_edited_at',
      'deleted_at',
    ]

    const missingNotesColumns = requiredNotesColumns.filter(c => !notesColumnNames.has(c))
    if (missingNotesColumns.length > 0) {
      throw new Error(`Missing required columns in notes table: ${missingNotesColumns.join(', ')}`)
    }

    // Validate users table structure
    const usersColumns = await db.prepare(`PRAGMA table_info(users)`).all()
    const usersColumnNames = new Set(usersColumns.map(c => c.name))

    const requiredUsersColumns = [
      'id',
      'name',
      'email',
      'password_hash',
      'created_at',
      'is_admin',
      'secret_key_hash',
      'secret_key_created_at',
    ]

    const missingUsersColumns = requiredUsersColumns.filter(c => !usersColumnNames.has(c))
    if (missingUsersColumns.length > 0) {
      throw new Error(`Missing required columns in users table: ${missingUsersColumns.join(', ')}`)
    }

    console.log('✓ Database schema validation passed')
  } catch (err) {
    console.error('❌ Database schema validation failed:', err.message)
    throw err
  }
}

// Initialization logic inside an async function or top-level block
async function initializeDatabase() {
  try {
    await db.exec('PRAGMA journal_mode = WAL')
    await db.exec('PRAGMA foreign_keys = ON')

    // Validate schema before proceeding
    // await validateDatabaseSchema()

    // Fresh tables (safe if already exist)
    await db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  secret_key_hash TEXT,
  secret_key_created_at TEXT
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,          -- "text" | "checklist"
  title TEXT NOT NULL,
  content TEXT NOT NULL,       -- for text notes
  items_json TEXT NOT NULL,    -- JSON array for checklist items
  tags_json TEXT NOT NULL,     -- JSON string array
  images_json TEXT NOT NULL,   -- JSON image objects {id,src,name}
  color TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0, -- for ordering (higher first)
  timestamp TEXT NOT NULL,
  updated_at TEXT,             -- for tracking last edit time
  last_edited_by TEXT,         -- email/name of last editor
  last_edited_at TEXT,         -- timestamp of last edit
  deleted_at INTEGER,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS note_collaborators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  added_by INTEGER NOT NULL,
  added_at TEXT NOT NULL,
  FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(added_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(note_id, user_id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bug_reports (
  id TEXT PRIMARY KEY,
  user_id INTEGER,           -- Optional: if user is logged in
  email TEXT,                -- Optional: if provided or logged in
  description TEXT NOT NULL,
  metadata TEXT,             -- JSON string: userAgent, url, etc.
  status TEXT DEFAULT 'open',-- 'open', 'resolved', 'ignored'
  created_at TEXT NOT NULL,
  updated_at TEXT
);

`)

    // Tiny migrations (safe to run repeatedly)
    async function ensureColumns() {
      try {
        const cols = await db.prepare(`PRAGMA table_info(users)`).all()
        const names = new Set(cols.map(c => c.name))

        const txLogic = async () => {
          if (!names.has('is_admin')) {
            await db.exec(`ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0`)
          }
          if (!names.has('secret_key_hash')) {
            await db.exec(`ALTER TABLE users ADD COLUMN secret_key_hash TEXT`)
          }
          if (!names.has('secret_key_created_at')) {
            await db.exec(`ALTER TABLE users ADD COLUMN secret_key_created_at TEXT`)
          }
        }
        const tx = db.transaction(txLogic)
        await tx()
      } catch (err) {
        console.warn('ensureColumns migration error:', err.message)
      }
    }
    await ensureColumns()

    // Notes table migrations
    async function ensureNoteColumns() {
      try {
        const cols = await db.prepare(`PRAGMA table_info(notes)`).all()
        const names = new Set(cols.map(c => c.name))

        const txLogic = async () => {
          if (!names.has('updated_at')) {
            await db.exec(`ALTER TABLE notes ADD COLUMN updated_at TEXT`)
          }
          if (!names.has('last_edited_by')) {
            await db.exec(`ALTER TABLE notes ADD COLUMN last_edited_by TEXT`)
          }
          if (!names.has('last_edited_at')) {
            await db.exec(`ALTER TABLE notes ADD COLUMN last_edited_at TEXT`)
          }
          if (!names.has('archived')) {
            await db.exec(`ALTER TABLE notes ADD COLUMN archived INTEGER NOT NULL DEFAULT 0`)
          }
          if (!names.has('deleted_at')) {
            await db.exec(`ALTER TABLE notes ADD COLUMN deleted_at INTEGER`)
          }
        }
        const tx = db.transaction(txLogic)
        await tx()
      } catch (err) {
        console.warn('ensureNoteColumns migration error:', err.message)
      }
    }
    await ensureNoteColumns()

    // Run database migrations after tables are created
    await require('./migrations').runMigrations(db)

    // Promote existing users to admin on startup
    if (ADMIN_EMAILS.length) {
      console.log(`Admin emails configured: ${ADMIN_EMAILS.join(', ')}`)
      const mkAdmin = db.prepare('UPDATE users SET is_admin=1 WHERE lower(email)=?')
      for (const e of ADMIN_EMAILS) {
        const result = await mkAdmin.run(e)
        if (result.changes > 0) {
          console.log(`Promoted existing user ${e} to admin`)
        }
      }
    }

    // Seed default admin
    const userCountResult = await db.prepare('SELECT COUNT(*) as count FROM users').get()
    const userCount = userCountResult ? userCountResult.count : 0
    if (userCount === 0) {
      const adminEmail = 'admin'
      const adminPass = 'admin'
      const hash = bcrypt.hashSync(adminPass, 10)
      const info = await insertUser.run('Admin', adminEmail, hash, nowISO())
      const mkAdmin = db.prepare('UPDATE users SET is_admin=1 WHERE id=?')
      await mkAdmin.run(info.lastInsertRowid)
      console.log(`Default admin user created: ${adminEmail} / ${adminPass}`)
    }

    // await validateDatabaseSchema()

    adminSettings = await loadAdminSettings()
    console.log('✓ Database initialization complete')
  } catch (err) {
    console.error('❌ Database initialization failed:', err)
    process.exit(1)
  }
}

// Optionally promote admins from env (comma-separated)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean)

// Function to promote user to admin if they're in the admin list
async function promoteToAdminIfNeeded(email) {
  if (ADMIN_EMAILS.length && ADMIN_EMAILS.includes(email.toLowerCase())) {
    const mkAdmin = db.prepare('UPDATE users SET is_admin=1 WHERE lower(email)=?')
    await mkAdmin.run(email.toLowerCase())
    console.log(`Promoted user ${email} to admin`)
    return true
  }
  return false
}

// Call initialization
// initialization will be called at the end of the file

// ---------- Helpers ----------
const nowISO = () => new Date().toISOString()
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function signToken(user) {
  return jwt.sign(
    {
      uid: user.id,
      email: user.email,
      name: user.name,
      name: user.name,
      is_admin: !!user.is_admin,
      announcements_opt_out: !!user.announcements_opt_out,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

async function auth(req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) {
    // console.log(`[AUTH] Missing token for ${req.method} ${req.url}`)
    return res.status(401).json({ error: 'Missing token' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    logAuth(`[AUTH_DEBUG] Verified payload: ${JSON.stringify(payload)}`)

    // Validate user exists in current DB - crucial for DB swaps/restores
    const user = await db
      .prepare('SELECT id, is_admin, announcements_opt_out FROM users WHERE id = ?')
      .get(payload.uid)

    logAuth(
      `[AUTH_DEBUG] DB Lookup result: ${user ? `Found User ${user.id}` : 'NOT FOUND'} for uid ${payload.uid}`
    )

    if (!user) {
      logAuth(`[AUTH_FAIL] Token valid but User ID ${payload.uid} not found in DB. Rejecting.`)
      return res.status(401).json({ error: 'User no longer exists' })
    }

    req.user = {
      id: user.id,
      email: payload.email, // Trust email from token or fetch if needed
      name: payload.name, // Trust name from token
      is_admin: !!user.is_admin, // Always use DB truth for admin status
      announcements_opt_out: !!user.announcements_opt_out,
    }
    next()
  } catch (err) {
    logAuth(`[AUTH_ERROR] ${req.method} ${req.url}: ${err.message}`)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Auth that also supports token in query string for EventSource
async function authFromQueryOrHeader(req, res, next) {
  const h = req.headers.authorization || ''
  const headerToken = h.startsWith('Bearer ') ? h.slice(7) : null
  const queryToken = req.query && typeof req.query.token === 'string' ? req.query.token : null
  const token = headerToken || queryToken
  if (!token) return res.status(401).json({ error: 'Missing token' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = await db
      .prepare('SELECT id, is_admin, announcements_opt_out FROM users WHERE id = ?')
      .get(payload.uid)

    if (!user) return res.status(401).json({ error: 'User not found' })

    req.user = {
      id: user.id,
      email: payload.email,
      name: payload.name,
      is_admin: !!user.is_admin,
      announcements_opt_out: !!user.announcements_opt_out,
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

const insertUser = db.prepare(
  'INSERT INTO users (name,email,password_hash,created_at) VALUES (?,?,?,?)'
)

const getUserById = db.prepare('SELECT * FROM users WHERE id = ?')
const getNoteById = db.prepare('SELECT * FROM notes WHERE id = ?')

// Notes statements
const listNotes = db.prepare(
  `SELECT * FROM notes WHERE user_id = ? AND archived = 0 AND deleted_at IS NULL ORDER BY pinned DESC, position DESC, timestamp DESC`
)
const listArchivedNotes = db.prepare(
  `SELECT * FROM notes WHERE user_id = ? AND archived = 1 ORDER BY timestamp DESC`
)
const listNotesPage = db.prepare(
  `SELECT * FROM notes WHERE user_id = ? ORDER BY pinned DESC, position DESC, timestamp DESC LIMIT ? OFFSET ?`
)
const allNotesQuery = db.prepare(`
  SELECT DISTINCT n.*, 
    (SELECT COUNT(*) FROM note_collaborators nc2 WHERE nc2.note_id = n.id) as collaborator_count
  FROM notes n
  LEFT JOIN user_announcement_interactions uai ON n.id = uai.note_id AND uai.user_id = ?
  JOIN users u ON u.id = ?
  WHERE (
    (n.user_id = ? OR EXISTS(
      SELECT 1 FROM note_collaborators nc 
      WHERE nc.note_id = n.id AND nc.user_id = ?
    ))
    OR
    (n.is_announcement = 1 AND u.announcements_opt_out = 0 AND uai.note_id IS NULL)
  ) AND n.archived = 0 AND n.deleted_at IS NULL
  ORDER BY n.pinned DESC, n.position DESC, n.timestamp DESC
`)
const allNotesWithPagingQuery = db.prepare(`
  SELECT DISTINCT n.*, 
    (SELECT COUNT(*) FROM note_collaborators nc2 WHERE nc2.note_id = n.id) as collaborator_count
  FROM notes n
  LEFT JOIN user_announcement_interactions uai ON n.id = uai.note_id AND uai.user_id = ?
  JOIN users u ON u.id = ?
  WHERE (
    (n.user_id = ? OR EXISTS(
      SELECT 1 FROM note_collaborators nc 
      WHERE nc.note_id = n.id AND nc.user_id = ?
    ))
    OR
    (n.is_announcement = 1 AND u.announcements_opt_out = 0 AND uai.note_id IS NULL)
  ) AND n.archived = 0 AND n.deleted_at IS NULL
  ORDER BY n.pinned DESC, n.position DESC, n.timestamp DESC
  LIMIT ? OFFSET ?`
)
const getNote = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
const getNoteWithCollaboration = db.prepare(`
  SELECT n.* FROM notes n
  LEFT JOIN note_collaborators nc ON n.id = nc.note_id AND nc.user_id = ?
  WHERE n.id = ? AND (n.user_id = ? OR nc.user_id IS NOT NULL)
`)
const insertNote = db.prepare(`
  INSERT INTO notes (id,user_id,type,title,content,items_json,tags_json,images_json,color,pinned,position,timestamp,archived,is_announcement)
  VALUES (@id,@user_id,@type,@title,@content,@items_json,@tags_json,@images_json,@color,@pinned,@position,@timestamp,0,COALESCE(@is_announcement,0))
`)
const updateNote = db.prepare(`
  UPDATE notes SET
    type=@type, title=@title, content=@content, items_json=@items_json, tags_json=@tags_json,
    images_json=@images_json, color=@color, pinned=@pinned, position=@position, timestamp=@timestamp,
    is_announcement=COALESCE(@is_announcement, is_announcement)
  WHERE id=@id AND user_id=@user_id
`)
const updateArchivedNote = db.prepare(`
  UPDATE notes SET archived = ? WHERE id = ? AND user_id = ?
`)
const updateNoteWithCollaboration = db.prepare(`
  UPDATE notes SET
    type=@type, title=@title, content=@content, items_json=@items_json, tags_json=@tags_json,
    images_json=@images_json, color=@color, pinned=@pinned, position=@position, timestamp=@timestamp
  WHERE id=@id AND (user_id=@user_id OR EXISTS(
    SELECT 1 FROM note_collaborators nc 
    WHERE nc.note_id = @id AND nc.user_id = @user_id
  ))
`)
const patchPartial = db.prepare(`
  UPDATE notes SET title=COALESCE(@title,title),
                   content=COALESCE(@content,content),
                   items_json=COALESCE(@items_json,items_json),
                   tags_json=COALESCE(@tags_json,tags_json),
                   images_json=COALESCE(@images_json,images_json),
                   color=COALESCE(@color,color),
                   pinned=COALESCE(@pinned,pinned),
                   timestamp=COALESCE(@timestamp,timestamp)
  WHERE id=@id AND user_id=@user_id
`)
const patchPartialWithCollaboration = db.prepare(`
  UPDATE notes SET title=COALESCE(@title,title),
                   content=COALESCE(@content,content),
                   items_json=COALESCE(@items_json,items_json),
                   tags_json=COALESCE(@tags_json,tags_json),
                   images_json=COALESCE(@images_json,images_json),
                   color=COALESCE(@color,color),
                   pinned=COALESCE(@pinned,pinned),
                   timestamp=COALESCE(@timestamp,timestamp)
  WHERE id=@id AND (user_id=@user_id OR EXISTS(
    SELECT 1 FROM note_collaborators nc 
    WHERE nc.note_id = @id AND nc.user_id = @user_id
  ))
`)
const patchPosition = db.prepare(`
  UPDATE notes SET position=@position, pinned=@pinned WHERE id=@id AND user_id=@user_id
`)
const deleteNote = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
const deleteNoteAny = db.prepare('DELETE FROM notes WHERE id = ?')
const softDeleteNote = db.prepare('UPDATE notes SET deleted_at = ? WHERE id = ? AND user_id = ?')
const restoreNote = db.prepare('UPDATE notes SET deleted_at = NULL WHERE id = ? AND user_id = ?')
const listTrash = db.prepare(
  `SELECT * FROM notes WHERE user_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`
)
const emptyTrash = db.prepare('DELETE FROM notes WHERE user_id = ? AND deleted_at IS NOT NULL')
const permanentDeleteNote = db.prepare(
  'DELETE FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL'
)

// Collaboration statements
const getUserByEmail = db.prepare('SELECT * FROM users WHERE lower(email)=lower(?)')
const getUserByName = db.prepare('SELECT * FROM users WHERE lower(name)=lower(?)')
const addCollaborator = db.prepare(`
  INSERT INTO note_collaborators (note_id, user_id, added_by, added_at)
  VALUES (?, ?, ?, ?)
`)
const removeCollaborator = db.prepare(`
  DELETE FROM note_collaborators WHERE note_id = ? AND user_id = ?
`)
const getNoteCollaborators = db.prepare(`
  SELECT u.id, u.name, u.email, nc.added_at, nc.added_by
  FROM note_collaborators nc
  JOIN users u ON nc.user_id = u.id
  WHERE nc.note_id = ?
`)
const getCollaboratedNotes = db.prepare(`
  SELECT n.* FROM notes n
  JOIN note_collaborators nc ON n.id = nc.note_id
  WHERE nc.user_id = ?
  ORDER BY n.pinned DESC, n.position DESC, n.timestamp DESC
`)
const updateNoteWithEditor = db.prepare(`
  UPDATE notes SET 
    updated_at = ?, 
    last_edited_by = ?, 
    last_edited_at = ? 
  WHERE id = ?
`)

const dismissAnnouncement = db.prepare(`
  INSERT INTO user_announcement_interactions (user_id, note_id, dismissed_at)
  VALUES (?, ?, ?)
  ON CONFLICT(user_id, note_id) DO UPDATE SET dismissed_at = excluded.dismissed_at
`)
const updateUserAnnouncementsOptOut = db.prepare(`
  UPDATE users SET announcements_opt_out = ? WHERE id = ?
`)

// ---------- Realtime (SSE) ----------
// Map of userId -> Set of response streams
const sseClients = new Map()

function addSseClient(userId, res) {
  let set = sseClients.get(userId)
  if (!set) {
    set = new Set()
    sseClients.set(userId, set)
  }
  set.add(res)
}

function removeSseClient(userId, res) {
  const set = sseClients.get(userId)
  if (!set) return
  set.delete(res)
  if (set.size === 0) sseClients.delete(userId)
}

function sendEventToUser(userId, event) {
  const set = sseClients.get(userId)
  if (!set || set.size === 0) return
  const payload = `data: ${JSON.stringify(event)}\n\n`
  const toRemove = []
  for (const res of set) {
    try {
      res.write(payload)
    } catch (error) {
      // Remove dead connections
      toRemove.push(res)
    }
  }
  // Clean up dead connections
  for (const res of toRemove) {
    removeSseClient(userId, res)
  }
}

async function getCollaboratorUserIdsForNote(noteId) {
  try {
    const rows = (await getNoteCollaborators.all(noteId)) || []
    return rows.map(r => r.id)
  } catch {
    return []
  }
}

async function broadcastNoteUpdated(noteId) {
  try {
    const note = await getNoteById.get(noteId)
    if (!note) return
    const collaboratorIds = await getCollaboratorUserIdsForNote(noteId)
    const recipientIds = new Set([note.user_id, ...collaboratorIds])
    const evt = { type: 'note_updated', noteId }
    for (const uid of recipientIds) sendEventToUser(uid, evt)
  } catch {}
}

app.get('/api/events', authFromQueryOrHeader, (req, res) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  // Help Nginx/Proxies not to buffer SSE
  try {
    res.setHeader('X-Accel-Buffering', 'no')
  } catch {}
  // If served cross-origin (e.g. static site + separate API host), allow EventSource
  if (req.headers.origin) {
    try {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
    } catch {}
  }
  res.flushHeaders?.()

  // Initial hello
  res.write(`event: hello\n`)
  res.write(`data: {"ok":true}\n\n`)

  addSseClient(req.user.id, res)

  // Keepalive ping
  const ping = setInterval(() => {
    try {
      res.write('event: ping\ndata: {}\n\n')
    } catch (error) {
      clearInterval(ping)
      removeSseClient(req.user.id, res)
      try {
        res.end()
      } catch {}
    }
  }, 25000)

  req.on('close', () => {
    clearInterval(ping)
    removeSseClient(req.user.id, res)
    try {
      res.end()
    } catch {}
  })
})

// ---------- Auth ----------
app.post('/api/register', authRateLimiter, async (req, res) => {
  // Check if new account creation is allowed
  if (!adminSettings.allowNewAccounts) {
    return res.status(403).json({ error: 'New account creation is currently disabled.' })
  }

  const { name, email, password } = req.body || {}
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' })
  if (await getUserByEmail.get(email))
    return res.status(409).json({ error: 'Email already registered.' })

  const hash = bcrypt.hashSync(password, 10)
  const info = await insertUser.run(name?.trim() || 'User', email.trim(), hash, nowISO())

  // Check if this user should be promoted to admin
  const promoted = await promoteToAdminIfNeeded(email.trim())

  const user = await getUserById.get(info.lastInsertRowid)
  const token = signToken(user)
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: !!user.is_admin,
      announcements_opt_out: !!user.announcements_opt_out,
    },
  })
})

app.post('/api/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body || {}
  const user = email ? await getUserByEmail.get(email) : null
  if (!user) return res.status(401).json({ error: 'No account found for that email.' })
  if (!bcrypt.compareSync(password || '', user.password_hash)) {
    logAuth(`[LOGIN_FAIL] Password mismatch for ${email}`)
    return res.status(401).json({ error: 'Incorrect password.' })
  }
  logAuth(`[LOGIN_SUCCESS] User ${email} ID=${user.id} logged in.`)
  const token = signToken(user)
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: !!user.is_admin,
      announcements_opt_out: !!user.announcements_opt_out,
    },
  })
})

// ---------- Admin ----------
app.get('/api/admin/users', auth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' })

  try {
    const users = await db.prepare('SELECT id, name, email, is_admin, created_at FROM users').all()
    const result = []

    for (const u of users) {
      const stats = await db
        .prepare(
          `SELECT 
             COUNT(*) as count, 
             SUM(length(content) + length(items_json) + length(tags_json) + length(images_json)) as bytes 
           FROM notes WHERE user_id = ?`
        )
        .get(u.id)

      result.push({
        id: u.id,
        name: u.name,
        email: u.email,
        is_admin: !!u.is_admin,
        created_at: u.created_at,
        notes: stats ? stats.count : 0,
        storage_bytes: stats ? stats.bytes : 0,
      })
    }

    res.json(result)
  } catch (err) {
    console.error('Admin users load failed:', err)
    res.status(500).json({ error: 'Failed to load users' })
  }
})

app.delete('/api/admin/users/:id', auth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' })

  const targetId = req.params.id
  if (String(targetId) === String(req.user.id)) {
    return res.status(400).json({ error: 'Cannot delete yourself' })
  }

  try {
    const info = await db.prepare('DELETE FROM users WHERE id = ?').run(targetId)
    if (info.changes === 0) return res.status(404).json({ error: 'User not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error('Admin user delete failed:', err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// Audit logs endpoint (Mock implementation for now to prevent 404)
app.get('/api/admin/audit-logs', auth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' })

  // Future: Implement real audit logging in database
  // For now, return empty array so frontend doesn't error
  res.json([])
})

// ---------- Secret Key (Recovery) ----------
function generateSecretKey(bytes = 32) {
  const buf = crypto.randomBytes(bytes)
  try {
    return buf.toString('base64url')
  } catch {
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }
}

const updateSecretForUser = db.prepare(
  'UPDATE users SET secret_key_hash = ?, secret_key_created_at = ? WHERE id = ?'
)
const getUsersWithSecret = db.prepare(
  'SELECT id, name, email, is_admin, secret_key_hash FROM users WHERE secret_key_hash IS NOT NULL'
)

// Create/rotate a user's secret key
app.post('/api/secret-key', auth, async (req, res) => {
  const key = generateSecretKey(32)
  const hash = bcrypt.hashSync(key, 10)
  await updateSecretForUser.run(hash, nowISO(), req.user.id)
  res.json({ key })
})

// Login with secret key
app.post('/api/login/secret', secretKeyRateLimiter, async (req, res) => {
  const { key } = req.body || {}
  if (!key || typeof key !== 'string' || key.length < 16) {
    return res.status(400).json({ error: 'Invalid key.' })
  }
  const rows = await getUsersWithSecret.all()
  for (const u of rows) {
    if (u.secret_key_hash && bcrypt.compareSync(key, u.secret_key_hash)) {
      const token = signToken(u)
      return res.json({
        token,
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          is_admin: !!u.is_admin,
          announcements_opt_out: !!u.announcements_opt_out,
        },
      })
    }
  }
  return res.status(401).json({ error: 'Secret key not recognized.' })
})

// ---------- User Settings ----------
app.patch('/api/users/me/settings', auth, async (req, res) => {
  const { announcements_opt_out } = req.body || {}

  if (typeof announcements_opt_out !== 'undefined') {
    await updateUserAnnouncementsOptOut.run(announcements_opt_out ? 1 : 0, req.user.id)
  }

  // Fetch updated user to return
  const user = await getUserById.get(req.user.id)
  res.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: !!user.is_admin,
      announcements_opt_out: !!user.announcements_opt_out,
    },
  })
})

// ---------- Notes ----------
app.get('/api/notes', auth, async (req, res) => {
  const off = Number(req.query.offset ?? 0)
  const lim = Number(req.query.limit ?? 0)
  const usePaging = Number.isFinite(lim) && lim > 0 && Number.isFinite(off) && off >= 0

  // Get all notes (own + collaborated + announcements) in a single query to avoid duplicates
  const rows = usePaging
    ? await allNotesWithPagingQuery.all(
        req.user.id,
        req.user.id,
        req.user.id,
        req.user.id,
        lim,
        off
      )
    : await allNotesQuery.all(req.user.id, req.user.id, req.user.id, req.user.id)

  res.json(
    rows.map(r => {
      const hasCollaborators = (r.collaborator_count || 0) > 0
      return {
        id: r.id,
        user_id: r.user_id,
        type: r.type,
        title: r.title,
        content: r.content,
        items: JSON.parse(r.items_json || '[]'),
        tags: JSON.parse(r.tags_json || '[]'),
        images: JSON.parse(r.images_json || '[]'),
        color: r.color,
        pinned: !!r.pinned,
        position: r.position,
        timestamp: r.timestamp,
        updated_at: r.updated_at,
        lastEditedBy: r.last_edited_by,
        lastEditedAt: r.last_edited_at,
        archived: !!r.archived,
        is_announcement: !!r.is_announcement,
        collaborators: hasCollaborators ? [] : null, // Empty array to indicate has collaborators, null if none
      }
    })
  )
})

app.post('/api/notes', auth, async (req, res) => {
  const requestId = req.headers['x-request-id'] || 'unknown'

  try {
    // Validate request data
    const body = req.body || {}
    const validationErrors = []

    // Validate note type
    const validTypes = ['text', 'checklist', 'draw', 'youtube', 'music']
    if (!body.type || typeof body.type !== 'string') {
      validationErrors.push('Note type is required and must be a string')
    } else if (!validTypes.includes(body.type)) {
      validationErrors.push(
        `Invalid note type: ${body.type}. Must be one of: ${validTypes.join(', ')}`
      )
    }

    // Validate title length
    if (body.title && typeof body.title === 'string' && body.title.length > 1000) {
      validationErrors.push('Title is too long (max 1000 characters)')
    }

    // Validate content length
    if (body.content && typeof body.content === 'string' && body.content.length > 100000) {
      validationErrors.push('Content is too long (max 100,000 characters)')
    }

    // Validate images array
    if (body.images && !Array.isArray(body.images)) {
      validationErrors.push('Images must be an array')
    } else if (Array.isArray(body.images) && body.images.length > 50) {
      validationErrors.push('Too many images (max 50)')
    }

    // Validate total image size
    if (Array.isArray(body.images)) {
      const totalSize = body.images.reduce((sum, img) => {
        const srcSize = img.src ? img.src.length : 0
        return sum + srcSize
      }, 0)
      const maxImageSize = 50 * 1024 * 1024 // 50MB
      if (totalSize > maxImageSize) {
        validationErrors.push(
          `Total image size exceeds limit: ${(totalSize / 1024 / 1024).toFixed(1)}MB (max 50MB)`
        )
      }
    }

    // Validate items array
    if (body.items && !Array.isArray(body.items)) {
      validationErrors.push('Items must be an array')
    } else if (Array.isArray(body.items) && body.items.length > 500) {
      validationErrors.push('Too many items (max 500)')
    }

    // Validate tags array
    if (body.tags && !Array.isArray(body.tags)) {
      validationErrors.push('Tags must be an array')
    } else if (Array.isArray(body.tags) && body.tags.length > 50) {
      validationErrors.push('Too many tags (max 50)')
    }

    // Validate color
    if (body.color && typeof body.color !== 'string') {
      validationErrors.push('Color must be a string')
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      console.log(`[POST /notes] Validation failed for request ${requestId}:`, validationErrors)
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
        requestId,
      })
    }

    console.log('[POST /notes] Request body:', {
      hasImages: !!body.images,
      imagesCount: Array.isArray(body.images) ? body.images.length : 0,
      type: body.type,
      title: body.title?.substring(0, 50),
    })

    // Validate and serialize images with better error handling
    let images_json = '[]'
    if (Array.isArray(body.images) && body.images.length > 0) {
      try {
        // Validate each image object structure
        const validatedImages = body.images.map((img, idx) =>({
          id: img?.id || `img-${idx}`,
          src: img?.src || '',
          name: img?.name || `image-${idx}`,
        }))

        // Calculate total size for logging
        const totalSize = validatedImages.reduce((sum, img) => {
          return sum + (img.src ? img.src.length : 0)
        }, 0)
        console.log(
          `[POST /notes] Total images data size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`
        )

        images_json = JSON.stringify(validatedImages)
      } catch (e) {
        console.error('[POST /notes] Failed to serialize images:', e)
        return res.status(400).json({
          error: 'Failed to process images',
          details: e.message,
          requestId,
        })
      }
    }

    const n = {
      id: body.id || uid(),
      user_id: req.user.id,
      type: ['text', 'checklist', 'draw', 'youtube', 'music'].includes(body.type)
        ? body.type
        : 'text',
      title: String(body.title || ''),
      content: body.type === 'checklist' ? '' : String(body.content || ''),
      items_json: JSON.stringify(Array.isArray(body.items) ? body.items : []),
      tags_json: JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
      images_json: images_json,
      color: body.color && typeof body.color === 'string' ? body.color : 'default',
      pinned: body.pinned ? 1 : 0,
      position: typeof body.position === 'number' ? body.position : Date.now(),
      timestamp: body.timestamp || nowISO(),
      is_announcement: body.is_announcement ? 1 : 0,
    }

    console.log(
      '[POST /notes] Inserting note with images count:',
      Array.isArray(body.images) ? body.images.length : 0,
      'images_json length:',
      images_json.length
    )

    try {
      await insertNote.run(n)
      console.log('[POST /notes] Successfully inserted note:', n.id)
    } catch (insertError) {
      console.error('[POST /notes] Database insertion error:', {
        error: insertError.message,
        code: insertError.code,
        noteId: n.id,
        userId: req.user.id,
        images_json_length: n.images_json.length,
      })
      throw insertError
    }

    res.status(201).json({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      items: JSON.parse(n.items_json),
      tags: JSON.parse(n.tags_json),
      images: JSON.parse(n.images_json),
      color: n.color,
      pinned: !!n.pinned,
      position: n.position,
      timestamp: n.timestamp,
      is_announcement: !!n.is_announcement,
    })
  } catch (error) {
    // Enhanced error logging with full context
    console.error(`❌ [POST /notes] Error creating note [requestId: ${requestId}]:`, {
      timestamp: new Date().toISOString(),
      userId: req.user?.id || 'unknown',
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
      },
      request: {
        bodyKeys: Object.keys(req.body || {}),
        hasImages: !!(req.body && req.body.images),
        imagesCount: Array.isArray(req.body?.images) ? req.body.images.length : 0,
        imagesType: req.body && req.body.images ? typeof req.body.images : 'undefined',
        titleLength: req.body?.title?.length || 0,
        contentLength: req.body?.content?.length || 0,
      },
      stack: error.stack,
    })

    // Map database errors to user-friendly messages
    let userMessage = 'Failed to create note'
    if (error.code === 'SQLITE_CONSTRAINT') {
      if (error.message.includes('UNIQUE')) {
        userMessage = 'A note with this ID already exists'
      } else if (error.message.includes('FOREIGN KEY')) {
        userMessage = 'Invalid user reference'
      } else {
        userMessage = 'Database constraint violation'
      }
    } else if (error.code === 'SQLITE_TOOBIG') {
      userMessage = 'Note data is too large. Try reducing content or images.'
    } else if (error.message && error.message.includes('database is locked')) {
      userMessage = 'Database is busy. Please try again.'
    } else if (error.message && error.message.includes('no such table')) {
      userMessage = 'Database schema error. Please contact support.'
    }

    res.status(500).json({
      error: userMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      requestId,
    })
  }
})

app.put('/api/notes/:id', auth, async (req, res) => {
  const id = req.params.id
  const existing = await getNoteWithCollaboration.get(req.user.id, id, req.user.id)
  if (!existing) return res.status(404).json({ error: 'Note not found' })

  const b = req.body || {}

  // Validate images array and size
  if (b.images && !Array.isArray(b.images)) {
    return res.status(400).json({ error: 'Images must be an array' })
  }
  if (Array.isArray(b.images) && b.images.length > 50) {
    return res.status(400).json({ error: 'Too many images (max 50)' })
  }
  if (Array.isArray(b.images)) {
    const totalSize = b.images.reduce((sum, img) => sum + (img.src ? img.src.length : 0), 0)
    const maxImageSize = 50 * 1024 * 1024 // 50MB
    if (totalSize > maxImageSize) {
      return res.status(400).json({
        error: 'Total image size exceeds limit',
        details: `Total: ${(totalSize / 1024 / 1024).toFixed(1)}MB (max 50MB)`,
      })
    }
  }

  const updated = {
    id,
    user_id: req.user.id,
    type: ['checklist', 'draw', 'youtube', 'music'].includes(b.type) ? b.type : 'text',
    title: String(b.title || ''),
    content: b.type === 'checklist' ? '' : String(b.content || ''),
    items_json: Array.isArray(b.items) ? JSON.stringify(b.items) : null,
    tags_json: Array.isArray(b.tags) ? JSON.stringify(b.tags) : null,
    images_json: Array.isArray(b.images) ? JSON.stringify(b.images) : null,
    color: b.color && typeof b.color === 'string' ? b.color : null,
    pinned: b.pinned ? 1 : 0,
    position: typeof b.position === 'number' ? b.position : existing.position,
    timestamp: b.timestamp || existing.timestamp,
  }
  // Use collaboration-aware update
  const result = await updateNoteWithCollaboration.run(updated)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Note not found or access denied' })
  }

  // Update editor tracking (store display name)
  await updateNoteWithEditor.run(nowISO(), req.user.name || req.user.email, nowISO(), id)
  await broadcastNoteUpdated(id)
  res.json({ ok: true })
})

app.patch('/api/notes/:id', auth, async (req, res) => {
  const id = req.params.id
  const existing = await getNoteWithCollaboration.get(req.user.id, id, req.user.id)
  if (!existing) return res.status(404).json({ error: 'Note not found' })
  const p = {
    id,
    user_id: req.user.id,
    title: typeof req.body.title === 'string' ? String(req.body.title) : null,
    content: typeof req.body.content === 'string' ? String(req.body.content) : null,
    items_json: Array.isArray(req.body.items) ? JSON.stringify(req.body.items) : null,
    tags_json: Array.isArray(req.body.tags) ? JSON.stringify(req.body.tags) : null,
    images_json: Array.isArray(req.body.images) ? JSON.stringify(req.body.images) : null,
    color: typeof req.body.color === 'string' ? req.body.color : null,
    pinned: typeof req.body.pinned === 'boolean' ? (req.body.pinned ? 1 : 0) : null,
    timestamp: req.body.timestamp || null,
  }
  // Use collaboration-aware patch
  const result = await patchPartialWithCollaboration.run(p)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Note not found or access denied' })
  }

  // Update editor tracking (store display name)
  await updateNoteWithEditor.run(nowISO(), req.user.name || req.user.email, nowISO(), id)
  await broadcastNoteUpdated(id)
  res.json({ ok: true })
})

app.delete('/api/notes/:id', auth, async (req, res) => {
  const noteId = req.params.id

  // Check if it's an announcement
  const note = await getNoteById.get(noteId) // Using getNoteById to check global properties even if not owned

  if (note && note.is_announcement) {
    if (req.user.is_admin) {
      // Admins permanently delete announcements
      await deleteNoteAny.run(noteId)
      await broadcastNoteUpdated(noteId)
      res.json({ ok: true, deleted: true })
    } else {
      // Regular users just dismiss announcement
      await dismissAnnouncement.run(req.user.id, noteId, nowISO())
      res.json({ ok: true, dismissed: true })
    }
  } else {
    // Normal soft delete - move to trash
    const deletedAt = Math.floor(Date.now() / 1000) // Unix timestamp in seconds
    await softDeleteNote.run(deletedAt, noteId, req.user.id)
    await broadcastNoteUpdated(noteId)
    res.json({ ok: true })
  }
})

// Trash endpoints

// List all notes in trash
app.get('/api/notes/trash', auth, async (req, res) => {
  const rows = await listTrash.all(req.user.id)
  res.json(
    rows.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      content: r.content,
      items: JSON.parse(r.items_json || '[]'),
      tags: JSON.parse(r.tags_json || '[]'),
      images: JSON.parse(r.images_json || '[]'),
      color: r.color,
      pinned: !!r.pinned,
      position: r.position,
      timestamp: r.timestamp,
      updated_at: r.updated_at,
      lastEditedBy: r.last_edited_by,
      lastEditedAt: r.last_edited_at,
      deleted_at: r.deleted_at,
    }))
  )
})

// Restore a note from trash
app.post('/api/notes/:id/restore', auth, async (req, res) => {
  await restoreNote.run(req.params.id, req.user.id)
  await broadcastNoteUpdated(req.params.id)
  res.json({ ok: true })
})

// Empty all trash (permanent delete all trash notes)
app.delete('/api/notes/trash', auth, async (req, res) => {
  await emptyTrash.run(req.user.id)
  res.json({ ok: true })
})

// Permanently delete a specific note from trash
app.delete('/api/notes/:id/permanent', auth, async (req, res) => {
  await permanentDeleteNote.run(req.params.id, req.user.id)
  res.json({ ok: true })
})

// Reorder within sections
app.post('/api/notes/reorder', auth, async (req, res) => {
  const { pinnedIds = [], otherIds = [] } = req.body || {}
  const base = Date.now()
  const step = 1
  const reorderLogic = async () => {
    for (let i = 0; i < pinnedIds.length; i++) {
      await patchPosition.run({
        id: pinnedIds[i],
        user_id: req.user.id,
        position: base + step * (pinnedIds.length - i),
        pinned: 1,
      })
    }
    for (let i = 0; i < otherIds.length; i++) {
      await patchPosition.run({
        id: otherIds[i],
        user_id: req.user.id,
        position: base - step * (i + 1),
        pinned: 0,
      })
    }
  }
  const tx = db.transaction(reorderLogic)
  await tx()
  res.json({ ok: true })
})

// ---------- Collaboration ----------
app.post('/api/notes/:id/collaborate', auth, async (req, res) => {
  const noteId = req.params.id
  const { username } = req.body || {}

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' })
  }

  // Check if note exists and user owns it
  const note = await getNote.get(noteId, req.user.id)
  if (!note) {
    return res.status(404).json({ error: 'Note not found' })
  }

  // Find user to collaborate with (by email or name)
  const collaborator = (await getUserByEmail.get(username)) || (await getUserByName.get(username))
  if (!collaborator) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Don't allow self-collaboration
  if (collaborator.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot collaborate with yourself' })
  }

  try {
    // Add collaborator
    await addCollaborator.run(noteId, collaborator.id, req.user.id, nowISO())

    // Update note with editor info
    await updateNoteWithEditor.run(nowISO(), req.user.name || req.user.email, nowISO(), noteId)
    await broadcastNoteUpdated(noteId)

    res.json({
      ok: true,
      message: `Added ${collaborator.name} as collaborator`,
      collaborator: {
        id: collaborator.id,
        name: collaborator.name,
        email: collaborator.email,
      },
    })
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE' || (e.message && e.message.includes('UNIQUE'))) {
      return res.status(409).json({ error: 'User is already a collaborator' })
    }
    return res.status(500).json({ error: 'Failed to add collaborator' })
  }
})

app.get('/api/notes/:id/collaborators', auth, async (req, res) => {
  const noteId = req.params.id

  // Check if note exists and user owns it or is a collaborator
  const note = await getNoteWithCollaboration.get(req.user.id, noteId, req.user.id)
  if (!note) {
    return res.status(404).json({ error: 'Note not found' })
  }

  const collaborators = await getNoteCollaborators.all(noteId)
  res.json(
    collaborators.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      added_at: c.added_at,
      added_by: c.added_by,
    }))
  )
})

app.delete('/api/notes/:id/collaborate/:userId', auth, async (req, res) => {
  const noteId = req.params.id
  const userIdToRemove = req.params.userId

  // Check if note exists
  const note = await getNoteWithCollaboration.get(req.user.id, noteId, req.user.id)
  if (!note) {
    return res.status(404).json({ error: 'Note not found' })
  }

  // Check if user is owner (can remove anyone) or is removing themselves
  const isOwner = note.user_id === req.user.id
  const isRemovingSelf = String(userIdToRemove) === String(req.user.id)

  if (!isOwner && !isRemovingSelf) {
    return res.status(403).json({ error: 'Only note owner can remove other collaborators' })
  }

  const result = await removeCollaborator.run(noteId, userIdToRemove)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Collaborator not found' })
  }

  // Update note with editor info
  await updateNoteWithEditor.run(nowISO(), req.user.name || req.user.email, nowISO(), noteId)
  await broadcastNoteUpdated(noteId)

  res.json({ ok: true, message: 'Collaborator removed' })
})

app.get('/api/notes/collaborated', auth, async (req, res) => {
  const rows = await getCollaboratedNotes.all(req.user.id)
  res.json(
    rows.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      content: r.content,
      items: JSON.parse(r.items_json || '[]'),
      tags: JSON.parse(r.tags_json || '[]'),
      images: JSON.parse(r.images_json || '[]'),
      color: r.color,
      pinned: !!r.pinned,
      position: r.position,
      timestamp: r.timestamp,
      updated_at: r.updated_at,
      lastEditedBy: r.last_edited_by,
      lastEditedAt: r.last_edited_at,
      archived: !!r.archived,
      is_announcement: !!r.is_announcement,
    }))
  )
})

// Archive/Unarchive notes
app.post('/api/notes/:id/archive', auth, async (req, res) => {
  const id = req.params.id
  const { archived } = req.body || {}

  // Check if note exists and user owns it
  const existing = await getNote.get(id, req.user.id)
  if (!existing) {
    return res.status(404).json({ error: 'Note not found' })
  }

  const result = await updateArchivedNote.run(archived ? 1 : 0, id, req.user.id)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Note not found or access denied' })
  }

  // Update editor tracking
  await updateNoteWithEditor.run(nowISO(), req.user.name || req.user.email, nowISO(), id)
  await broadcastNoteUpdated(id)

  res.json({ ok: true })
})

// Get archived notes
app.get('/api/notes/archived', auth, async (req, res) => {
  const rows = await listArchivedNotes.all(req.user.id)
  res.json(
    rows.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      content: r.content,
      items: JSON.parse(r.items_json || '[]'),
      tags: JSON.parse(r.tags_json || '[]'),
      images: JSON.parse(r.images_json || '[]'),
      color: r.color,
      pinned: !!r.pinned,
      position: r.position,
      timestamp: r.timestamp,
      updated_at: r.updated_at,
      lastEditedBy: r.last_edited_by,
      lastEditedAt: r.last_edited_at,
      archived: !!r.archived,
    }))
  )
})

// Export/Import
app.get('/api/notes/export', auth, async (req, res) => {
  const rows = await listNotes.all(req.user.id)
  res.json({
    app: 'glassy-dash',
    version: 1,
    user: req.user.email,
    exportedAt: nowISO(),
    notes: rows.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      content: r.content,
      items: JSON.parse(r.items_json || '[]'),
      tags: JSON.parse(r.tags_json || '[]'),
      images: JSON.parse(r.images_json || '[]'),
      color: r.color,
      pinned: !!r.pinned,
      position: r.position,
      timestamp: r.timestamp,
    })),
  })
})

app.post('/api/notes/import', auth, async (req, res) => {
  const payload = req.body || {}
  const src = Array.isArray(payload.notes) ? payload.notes : Array.isArray(payload) ? payload : []
  if (!src.length) return res.status(400).json({ error: 'No notes to import.' })

  const rows = await listNotes.all(req.user.id)
  const existing = new Set(rows.map(r => r.id))

  const importLogic = async arr => {
    for (const n of arr) {
      const id = existing.has(String(n.id)) ? uid() : String(n.id)
      existing.add(id)
      await insertNote.run({
        id,
        user_id: req.user.id,
        type: n.type === 'checklist' ? 'checklist' : n.type === 'draw' ? 'draw' : 'text',
        title: String(n.title || ''),
        content: n.type === 'checklist' ? '' : String(n.content || ''),
        items_json: JSON.stringify(Array.isArray(n.items) ? n.items : []),
        tags_json: JSON.stringify(Array.isArray(n.tags) ? n.tags : []),
        images_json: JSON.stringify(Array.isArray(n.images) ? n.images : []),
        color: typeof n.color === 'string' ? n.color : 'default',
        pinned: n.pinned ? 1 : 0,
        position: typeof n.position === 'number' ? n.position : Date.now(),
        timestamp: n.timestamp || nowISO(),
      })
    }
  }
  const tx = db.transaction(importLogic)
  await tx(src)
  res.json({ ok: true, imported: src.length })
})

// ---------- Admin ----------
async function adminOnly(req, res, next) {
  const row = await getUserById.get(req.user.id)
  if (!row || !row.is_admin) return res.status(403).json({ error: 'Admin only' })
  next()
}

// ---------- Database Settings Helpers ----------
const getSettingRow = db.prepare('SELECT value FROM settings WHERE key = ?')
const setSettingRow = db.prepare(
  'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)'
)

async function getSetting(key, defaultValue) {
  const row = await getSettingRow.get(key)
  if (!row) return defaultValue
  try {
    return JSON.parse(row.value)
  } catch {
    return defaultValue
  }
}

async function setSetting(key, value) {
  const json = JSON.stringify(value)
  await setSettingRow.run(key, json, nowISO())
  return value
}

// Load admin settings from database (initialize if not found)
async function loadAdminSettings() {
  let settings = await getSetting('admin_settings', null)
  if (!settings) {
    settings = {
      allowNewAccounts: process.env.ALLOW_REGISTRATION === 'true' || false,
    }
    await setSetting('admin_settings', settings)
  }
  return settings
}

let adminSettings = { allowNewAccounts: true }

// Get admin settings
app.get('/api/admin/settings', auth, adminOnly, async (req, res) => {
  res.json(adminSettings)
})

// Update admin settings
app.patch('/api/admin/settings', auth, adminOnly, async (req, res) => {
  const { allowNewAccounts } = req.body || {}

  if (typeof allowNewAccounts === 'boolean') {
    adminSettings.allowNewAccounts = allowNewAccounts
    await setSetting('admin_settings', adminSettings)
  }

  res.json(adminSettings)
})

// Check if new account creation is allowed (public endpoint)
app.get('/api/admin/allow-registration', (_req, res) => {
  console.log('Serving /api/admin/allow-registration, content:', adminSettings)
  res.json({ allowNewAccounts: adminSettings.allowNewAccounts })
})

// Public endpoint to check auth settings (registration, etc.)
app.get('/api/auth/settings', (_req, res) => {
  res.json({
    allow_registration: adminSettings.allowNewAccounts,
  })
})

// Include a rough storage usage estimate (bytes) for each user
// This sums LENGTH() of relevant TEXT columns across a user's notes.
// It's an approximation (UTF-8 chars ≈ bytes, and data-URL images are strings).
const listAllUsers = db.prepare(`
  SELECT
    u.id,
    u.name,
    u.email,
    u.created_at,
    u.is_admin,
    COUNT(n.id) AS notes,
    COALESCE(SUM(
      COALESCE(LENGTH(n.title),0) +
      COALESCE(LENGTH(n.content),0) +
      COALESCE(LENGTH(n.items_json),0) +
      COALESCE(LENGTH(n.tags_json),0) +
      COALESCE(LENGTH(n.images_json),0)
    ), 0) AS storage_bytes
  FROM users u
  LEFT JOIN notes n ON n.user_id = u.id
  GROUP BY u.id
  ORDER BY u.created_at DESC
`)
app.get('/api/admin/users', auth, adminOnly, async (_req, res) => {
  const users = await listAllUsers.all()
  res.json(
    users.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      is_admin: !!r.is_admin,
      created_at: r.created_at,
    }))
  )
})

// Search users endpoint for collaboration
const searchUsersStmt = db.prepare(`
  SELECT id, name, email 
  FROM users 
  WHERE (name LIKE ? OR email LIKE ?)
  ORDER BY name ASC
  LIMIT 50
`)
app.get('/api/users/search', auth, async (req, res) => {
  const query = req.query.q || ''
  const searchTerm = `%${query}%`
  const rows = await searchUsersStmt.all(searchTerm, searchTerm)
  res.json(
    rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
    }))
  )
})

const deleteUserStmt = db.prepare('DELETE FROM users WHERE id = ?')
app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  const id = Number(req.params.id)
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' })
  }

  const target = await getUserById.get(id)
  if (!target) return res.status(404).json({ error: 'User not found' })

  const adminCountResult = await db
    .prepare('SELECT COUNT(*) AS c FROM users WHERE is_admin=1')
    .get()
  const adminCount = adminCountResult ? adminCountResult.c : 0
  if (target.is_admin && adminCount <= 1) {
    return res.status(400).json({ error: 'Cannot delete the last admin' })
  }

  await deleteUserStmt.run(id)
  res.json({ ok: true })
})

// Create user from admin panel
app.post('/api/admin/users', auth, adminOnly, async (req, res) => {
  const { name, email, password, is_admin } = req.body || {}

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' })
  }

  if (await getUserByEmail.get(email)) {
    return res.status(409).json({ error: 'Email already registered.' })
  }

  const hash = bcrypt.hashSync(password, 10)
  const info = await insertUser.run(name.trim(), email.trim(), hash, nowISO())

  // Set admin status if specified
  if (is_admin) {
    const mkAdmin = db.prepare('UPDATE users SET is_admin=1 WHERE id=?')
    await mkAdmin.run(info.lastInsertRowid)
  }

  const user = await getUserById.get(info.lastInsertRowid)
  res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    is_admin: !!user.is_admin,
    created_at: user.created_at,
  })
})

// Update user from admin panel
app.patch('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  const id = Number(req.params.id)
  const { name, email, password, is_admin } = req.body || {}

  // Cannot update yourself to non-admin if you're only admin
  if (id === req.user.id && is_admin === false) {
    const adminCountResult = await db
      .prepare('SELECT COUNT(*) AS c FROM users WHERE is_admin=1')
      .get()
    const adminCount = adminCountResult ? adminCountResult.c : 0
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove admin status from the last admin.' })
    }
  }

  // Check if user exists
  const existing = await getUserById.get(id)
  if (!existing) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Check if email is already taken by another user
  if (email && email !== existing.email) {
    const emailCheck = await getUserByEmail.get(email)
    if (emailCheck && emailCheck.id !== id) {
      return res.status(409).json({ error: 'Email already in use by another user.' })
    }
  }

  // Prepare update query
  const updates = []
  const params = []

  if (name !== undefined) {
    updates.push('name = ?')
    params.push(name.trim())
  }

  if (email !== undefined) {
    updates.push('email = ?')
    params.push(email.trim())
  }

  if (password) {
    updates.push('password_hash = ?')
    params.push(bcrypt.hashSync(password, 10))
  }

  if (is_admin !== undefined) {
    updates.push('is_admin = ?')
    params.push(is_admin ? 1 : 0)
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update.' })
  }

  // Execute update
  const updateStmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
  params.push(id)
  const result = await updateStmt.run(...params)

  if (result.changes === 0) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Return updated user data
  const updatedUser = await getUserById.get(id)
  res.json({
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    is_admin: !!updatedUser.is_admin,
    created_at: updatedUser.created_at,
  })
})

// ---------- AI Assistant (removed old code, now routes through new Provider Router) ----------

// The AI routes have been moved to /routes/ai.js
// All AI requests now go through the new multi-provider system

// ---------- Error Handling ----------
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err)
  if (res.headersSent) return next(err)
  res.status(500).json({ error: 'Internal Server Error', message: err.message })
})

// ---------- Static (production) ----------
if (NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', 'dist')
  app.use(express.static(dist))
  // SPA fallback - serve index.html for non-API routes
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' })
    }
    res.sendFile(path.join(dist, 'index.html'))
  })
}

// ---------- Listen ----------
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase()

    // Initialize AI providers
    const { initializeProviders } = require('./ai/init')
    await initializeProviders()

    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API listening on http://0.0.0.0:${PORT}  (env=${NODE_ENV})`)
    })
  } catch (err) {
    console.error('❌ Server startup failed:', err)
    process.exit(1)
  }
}

// ---------- 404 Handler for API ----------
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' })
})

// ---------- Global Error Handler ----------
// Must be registered AFTER all routes - catches unhandled errors
app.use((err, req, res, next) => {
  // Log the error with context
  console.error('❌ Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id || 'unauthenticated',
  })

  // Don't leak stack traces in production
  const isDev = NODE_ENV !== 'production'

  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
    requestId: req.headers['x-request-id'] || 'unknown',
  })
})

// Start the server
startServer()