const express = require('express')
const router = express.Router()
const path = require('path')
const jwt = require('jsonwebtoken')
const Database = require('../db')

// Load environment variables if not already loaded (though index.js should have)
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const JWT_SECRET = process.env.JWT_SECRET || 'GLASSYDASH-secret-key-2025'

// Database connection
const dbFile =
  process.env.DB_FILE ||
  process.env.SQLITE_FILE ||
  path.join(__dirname, '..', '..', 'data', 'notes.db')

const db = new Database(dbFile)

// Helper: Get user from token (if valid)
function getUserFromRequest(req) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (e) {
    return null
  }
}

// Middleware: Admin Auth
function adminAuth(req, res, next) {
  const user = getUserFromRequest(req)
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  // JWT verification stores payload in user.
  // We need to check is_admin locally?
  // index.js checks payload.is_admin.
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' })
  }
  req.user = user
  next()
}

// ---------- Routes ----------

// POST / - Create a bug report
router.post('/', async (req, res) => {
  try {
    const { description, metadata, email } = req.body || {}

    if (!description) {
      return res.status(400).json({ error: 'Description is required' })
    }

    const user = getUserFromRequest(req)
    const userId = user ? user.uid : null // index.js uses 'uid' in signing
    const reporterEmail = user ? user.email : email || null

    const id = `bug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()
    const metaStr = typeof metadata === 'object' ? JSON.stringify(metadata) : metadata || '{}'

    await db
      .prepare(
        `
      INSERT INTO bug_reports (id, user_id, email, description, metadata, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
    `
      )
      .run(id, userId, reporterEmail, description, metaStr, now, now)

    res.json({ ok: true, id })
  } catch (err) {
    console.error('Create bug report failed:', err)
    res.status(500).json({ error: 'Failed to create report' })
  }
})

// GET / - List all reports (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const reports = await db
      .prepare(
        `
      SELECT * FROM bug_reports ORDER BY created_at DESC
    `
      )
      .all()

    // Parse metadata for convenience? Or let frontend do it.
    // Let's pass it raw, frontend parses.
    res.json(reports)
  } catch (err) {
    console.error('List bug reports failed:', err)
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

// PATCH /:id - Update report status (Admin only)
router.patch('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!['open', 'resolved', 'ignored'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  try {
    const result = await db
      .prepare(
        `
      UPDATE bug_reports SET status = ?, updated_at = ? WHERE id = ?
    `
      )
      .run(status, new Date().toISOString(), id)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Report not found' })
    }

    res.json({ ok: true, status })
  } catch (err) {
    console.error('Update bug report failed:', err)
    res.status(500).json({ error: 'Failed to update report' })
  }
})

// DELETE /:id - Delete report (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  const { id } = req.params
  try {
    const result = await db.prepare('DELETE FROM bug_reports WHERE id = ?').run(id)
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Report not found' })
    }
    res.json({ ok: true })
  } catch (err) {
    console.error('Delete bug report failed:', err)
    res.status(500).json({ error: 'Failed to delete report' })
  }
})

module.exports = router
