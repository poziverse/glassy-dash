const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.resolve(__dirname, '../server/data.sqlite')
console.log('Checking DB at:', dbPath)

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => {
  if (err) {
    console.error('Error opening DB:', err.message)
    process.exit(1)
  }
  console.log('Connected to database.')
})

db.serialize(() => {
  // Check tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) return console.error(err)
    console.log(
      'Tables:',
      tables.map(t => t.name)
    )
  })

  // Check users
  db.all('SELECT id, email, is_admin FROM users', (err, users) => {
    if (err) return console.error(err)
    console.log('\nUsers found:', users.length)
    users.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Admin: ${u.is_admin}`))
  })

  // Check bug_reports
  db.get('SELECT count(*) as count FROM bug_reports', (err, row) => {
    if (err) {
      console.log('\nBug Reports table might be missing or empty? Error:', err.message)
    } else {
      console.log('\nBug Reports count:', row ? row.count : 0)
    }
  })
})

db.close()
