const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.resolve(__dirname, '../data/notes.db')
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY)

db.serialize(() => {
  db.all('SELECT user_id, count(*) as count FROM notes GROUP BY user_id', (err, rows) => {
    if (err) return console.error(err)
    console.log('Notes by User ID in notes.db:')
    rows.forEach(r => console.log(`User ID ${r.user_id}: ${r.count} notes`))
  })
})
db.close()
