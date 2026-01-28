/**
 * Migration 0002: Add collaboration features
 * Adds support for note sharing and collaboration
 */

async function up(db) {
  console.log('[Migration 0002] Adding collaboration features...')

  // Create collaborators table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS collaborators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      permission TEXT NOT NULL DEFAULT 'read',
      created_at TEXT NOT NULL,
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(note_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS collaboration_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_data TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)

  console.log('[Migration 0002] ✓ Completed')
}

async function down(db) {
  console.log('[Migration 0002] Rolling back collaboration features...')
  
  await db.exec(`
    DROP TABLE IF EXISTS collaboration_events;
    DROP TABLE IF EXISTS collaborators;
  `)
  
  console.log('[Migration 0002] ✓ Rolled back')
}

module.exports = { name: 'add_collaboration', up, down }