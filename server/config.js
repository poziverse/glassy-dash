const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const NODE_ENV = process.env.NODE_ENV || 'development'
const PORT = process.env.PORT || process.env.API_PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'GLASSYDASH-secret-key-2025'
const DB_FILE =
  process.env.DB_FILE ||
  process.env.SQLITE_FILE ||
  process.env.DATABASE_PATH ||
  path.join(__dirname, '..', 'data', 'notes.db')

module.exports = {
  NODE_ENV,
  PORT,
  JWT_SECRET,
  DB_FILE,
}
