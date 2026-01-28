const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.resolve(__dirname, '../data/notes.db')
console.log('Checking "Wrong" DB at:', dbPath)

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => {
  if (err) {
    console.error('Error opening DB:', err.message)
    process.exit(1)
  }
  console.log('Connected to database.')
})

db.serialize(() => {
  // Check users
  db.all('SELECT id, email, is_admin FROM users', (err, users) => {
    if (err) {
      console.log("Error querying users (maybe table doesn't exist):", err.message)
      return
    }
    console.log('\nUsers found:', users.length)
    users.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Admin: ${u.is_admin}`))
  })
})

db.close()
