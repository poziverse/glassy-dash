const jwt = require('jsonwebtoken')
const Database = require('../db')

const { JWT_SECRET } = require('../config')

const auth = async (req, res, next) => {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null

  if (!token) return res.status(401).json({ error: 'Missing token' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)

    // Check if user still exists and get fresh permissions
    // We need to access the db instance.
    // Since this module is separate, we can import the db singleton.
    const db = await Database.getDb()

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
  } catch (err) {
    console.error('[AUTH ERROR]', err.message)
    return res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = auth
