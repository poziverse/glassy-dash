const express = require('express')
const router = express.Router()
const Database = require('../db')
const path = require('path')
const { DB_FILE } = require('../config')

const db = new Database(DB_FILE)

const crypto = require('crypto')

// GET /api/window/:slug
// Fetch public profile and notes for a user
router.get('/:slug', async (req, res) => {
  const { slug } = req.params

  if (!slug) {
    return res.status(400).json({ error: 'Slug is required' })
  }

  try {
    // 1. Find user by slug
    const user = await db.prepare('SELECT id, name, email FROM users WHERE slug = ?').get(slug)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // 2. Fetch public notes
    const notes = await db
      .prepare(
        `
      SELECT * FROM notes 
      WHERE user_id = ? AND is_public = 1 AND deleted_at IS NULL
      ORDER BY position DESC
    `
      )
      .all(user.id)

    // 3. Parse JSON fields
    const parsedNotes = notes.map(n => {
      try {
        return {
          ...n,
          items: JSON.parse(n.items_json || '[]'),
          tags: JSON.parse(n.tags_json || '[]'),
          images: JSON.parse(n.images_json || '[]'),
          layout: n.layout ? JSON.parse(n.layout) : null,
          pinned: !!n.pinned, // Normalize boolean
          is_announcement: !!n.is_announcement,
        }
      } catch (e) {
        console.error('Error parsing note JSON:', e, n.id)
        return n
      }
    })

    // Calculate Email Hash for Gravatar (MD5)
    // We do NOT return the raw email for privacy, only the hash
    const emailHash = crypto.createHash('md5').update(user.email.trim().toLowerCase()).digest('hex')

    // Return sanitized profile and notes
    res.json({
      user: {
        name: user.name,
        gravatarHash: emailHash,
      },
      notes: parsedNotes,
    })
  } catch (err) {
    console.error(`[Window] Error fetching profile for slug ${slug}:`, err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
