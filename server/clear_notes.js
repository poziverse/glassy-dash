const Database = require('./db')
const path = require('path')

const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'notes.db')
const db = new Database(dbFile)

async function clearNotes() {
  console.log('Clearing notes table...')
  try {
    const result = await db.prepare('DELETE FROM notes').run()
    console.log(`Deleted ${result.changes} notes.`)

    // Also clear note_collaborators to be clean
    const collabResult = await db.prepare('DELETE FROM note_collaborators').run()
    console.log(`Deleted ${collabResult.changes} collaborator records.`)
  } catch (err) {
    console.error('Error clearing notes:', err)
  } finally {
    await db.close()
  }
}

clearNotes()
