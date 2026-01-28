const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.resolve(__dirname, '../data/notes.db')
const db = new sqlite3.Database(dbPath)

db.serialize(() => {
  db.get('PRAGMA user_version', (err, row) => {
    if (err) return console.error(err)
    console.log('Current version:', row.user_version)

    if (row.user_version >= 2) {
      console.log('Downgrading version to 1 to force re-migration...')
      db.exec('PRAGMA user_version = 1', err => {
        if (err) console.error('Failed to set version:', err)
        else console.log('Version set to 1.')
        db.close()
      })
    } else {
      console.log('Version already < 2. No action.')
      db.close()
    }
  })
})
