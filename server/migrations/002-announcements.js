const migrations = [
  {
    version: 2,
    name: 'add_announcements',
    description: 'Add support for admin announcements and user interactions',
    up: async db => {
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
    },
    down: async db => {
      // Simplistic rollback: remove table, CANNOT easily remove columns in SQLite without full table rebuild
      // For this migration, we will just drop the interactions table.
      // Columns in notes/users will remain as "zombie" columns to avoid data risk during rollback unless full rebuild is implemented.
      await db.exec(`DROP TABLE IF EXISTS user_announcement_interactions;`)
    },
  },
]

module.exports = { migrations }
