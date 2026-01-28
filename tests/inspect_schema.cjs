const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, '../data/notes.db')
console.log('Inspecting DB at:', dbPath)

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => {
  if (err) {
    console.error('Error opening DB:', err.message)
    process.exit(1)
  }
})

db.serialize(() => {
  db.all('PRAGMA table_info(users)', (err, cols) => {
    if (err) {
      console.error('Error getting table info:', err)
      return
    }
    console.log('Columns in users table:')
    const colNames = cols.map(c => c.name)
    console.log(colNames)

    if (colNames.includes('announcements_opt_out')) {
      console.log('✅ announcements_opt_out column EXISTS')
    } else {
      console.log('❌ announcements_opt_out column MISSING')
    }
  })
})

db.close()
