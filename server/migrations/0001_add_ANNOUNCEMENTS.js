/**
 * Migration 0001: Add announcements support
 * Adds admin announcements and user interaction tracking
 */

async function up(db) {
  console.log('[Migration 0001] Adding announcements support...')

  // 1. Add is_announcement to notes
  const notesCols = await db.prepare('PRAGMA table_info(notes)').all()
  const notesColNames = new Set(notesCols.map(c => c.name))

  if (!notesColNames.has('is_announcement')) {
    await db.exec(`
      ALTER TABLE notes ADD COLUMN is_announcement INTEGER NOT NULL DEFAULT 0;
    `)
  }

  // 2. Add announcements_opt_out to users
  const usersCols = await db.prepare('PRAGMA table_info(users)').all()
  const usersColNames = new Set(usersCols.map(c => c.name))

  if (!usersColNames.has('announcements_opt_out')) {
    await db.exec(`
      ALTER TABLE users ADD COLUMN announcements_opt_out INTEGER NOT NULL DEFAULT 0;
    `)
  }

  // 3. Create user_announcement_interactions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_announcement_interactions (
      user_id INTEGER NOT NULL,
      note_id TEXT NOT NULL,
      dismissed_at TEXT,
      PRIMARY KEY (user_id, note_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
    );
  `)

  console.log('[Migration 0001] ✓ Completed')
}

async function down(db) {
  console.log('[Migration 0001] Rolling back announcements support...')
  
  await db.exec(`DROP TABLE IF EXISTS user_announcement_interactions;`)
  
  console.log('[Migration 0001] ✓ Rolled back')
}

module.exports = { name: 'add_announcements', up, down }