const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.resolve(__dirname, '../data/notes.db')
console.log('Checking "Wrong" DB (notes.db) at:', dbPath)

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => {
  if (err) {
    console.error('Error opening DB:', err.message)
    process.exit(1)
  }
})

db.serialize(() => {
  db.get('SELECT count(*) as count FROM notes', (err, row) => {
    console.log('Notes count:', row ? row.count : 0)
  })
})
db.close()
