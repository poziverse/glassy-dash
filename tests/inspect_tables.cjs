const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.resolve(__dirname, '../data/notes.db')
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY)

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) return console.error(err)
    console.log(
      'Tables in notes.db:',
      tables.map(t => t.name)
    )
  })
})
db.close()
