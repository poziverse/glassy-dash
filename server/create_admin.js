// create_admin.js – creates/updates an admin user using sqlite3 (pure JS wrapper)
const path = require('path')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()

// Resolve DB path (same logic as server/index.js)
const DB_PATH =
  process.env.DB_FILE || process.env.SQLITE_FILE || path.join(__dirname, '..', 'data', 'notes.db')

// Ensure DB directory exists
try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
} catch (e) {
  if (e.code !== 'EEXIST') throw e
}

const email = 'eric@poziverse.com'
const password = 'Maplewood2025'
const now = new Date().toISOString()
const hash = bcrypt.hashSync(password, 10)

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, err => {
  if (err) {
    console.error('Failed to open DB:', err.message)
    process.exit(1)
  }
})

// Helper to run a statement and return a Promise
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve(this)
    })
  })
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

;(async () => {
  try {
    const existing = await get('SELECT id FROM users WHERE lower(email) = lower(?)', [email])
    if (existing) {
      console.log(
        `User with email ${email} already exists (id=${existing.id}). Updating password and admin flag.`
      )
      await run('UPDATE users SET password_hash = ?, is_admin = 1 WHERE id = ?', [
        hash,
        existing.id,
      ])
      console.log('User updated.')
    } else {
      await run(
        'INSERT INTO users (name, email, password_hash, created_at, is_admin) VALUES (?, ?, ?, ?, 1)',
        ['Eric', email, hash, now]
      )
      console.log(`Created admin user ${email}.`)
    }
  } catch (e) {
    console.error('Error during admin creation:', e.message)
    process.exit(1)
  } finally {
    db.close()
  }
})()
