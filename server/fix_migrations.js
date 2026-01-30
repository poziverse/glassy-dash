/**
 * Fix Migrations Script
 * Runs pending migrations to fix admin announcement issues
 */

const Database = require('./db')
const path = require('path')

const dbPath = path.join(__dirname, 'data.sqlite')
const db = new Database(dbPath)

async function fixMigrations() {
  console.log('=== Fixing Missing Migrations ===\n')

  try {
    // Step 1: Create migrations table if it doesn't exist
    console.log('Step 1: Creating migrations table...')
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at TEXT NOT NULL,
        checksum TEXT NOT NULL
      );
    `)
    console.log('✓ Migrations table created\n')

    // Step 2: Add is_announcement column to notes table
    console.log('Step 2: Adding is_announcement column to notes table...')
    const notesColumns = await db.prepare('PRAGMA table_info(notes)').all()
    const notesColumnNames = new Set(notesColumns.map(c => c.name))

    if (!notesColumnNames.has('is_announcement')) {
      await db.exec(`
        ALTER TABLE notes ADD COLUMN is_announcement INTEGER NOT NULL DEFAULT 0;
      `)
      console.log('✓ Added is_announcement column\n')
    } else {
      console.log('✓ is_announcement column already exists\n')
    }

    // Step 3: Add announcements_opt_out column to users table
    console.log('Step 3: Adding announcements_opt_out column to users table...')
    const usersColumns = await db.prepare('PRAGMA table_info(users)').all()
    const usersColumnNames = new Set(usersColumns.map(c => c.name))

    if (!usersColumnNames.has('announcements_opt_out')) {
      await db.exec(`
        ALTER TABLE users ADD COLUMN announcements_opt_out INTEGER NOT NULL DEFAULT 0;
      `)
      console.log('✓ Added announcements_opt_out column\n')
    } else {
      console.log('✓ announcements_opt_out column already exists\n')
    }

    // Step 4: Create user_announcement_interactions table
    console.log('Step 4: Creating user_announcement_interactions table...')
    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user_announcement_interactions'").all()
    
    if (tables.length === 0) {
      await db.exec(`
        CREATE TABLE user_announcement_interactions (
          user_id INTEGER NOT NULL,
          note_id TEXT NOT NULL,
          dismissed_at TEXT NOT NULL,
          PRIMARY KEY (user_id, note_id),
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
        );
      `)
      console.log('✓ Created user_announcement_interactions table\n')
    } else {
      console.log('✓ user_announcement_interactions table already exists\n')
    }

    // Step 5: Record migrations as executed
    console.log('Step 5: Recording migrations as executed...')
    const now = new Date().toISOString()
    
    const migrationsToRecord = [
      'add_announcements',
      'add_collaboration',
      'add_user_providers'
    ]

    const existingMigrations = new Set(
      (await db.prepare('SELECT name FROM migrations').all()).map(r => r.name)
    )

    for (const migrationName of migrationsToRecord) {
      if (!existingMigrations.has(migrationName)) {
        await db.prepare(`
          INSERT OR IGNORE INTO migrations (name, executed_at, checksum)
          VALUES (?, ?, '')
        `).run(migrationName, now)
        console.log(`✓ Recorded migration: ${migrationName}`)
      } else {
        console.log(`✓ Migration already recorded: ${migrationName}`)
      }
    }
    console.log()

    // Step 6: Verify the fix
    console.log('Step 6: Verifying the fix...')
    const updatedNotesColumns = await db.prepare('PRAGMA table_info(notes)').all()
    const updatedNotesColumnNames = new Set(updatedNotesColumns.map(c => c.name))
    
    const updatedUsersColumns = await db.prepare('PRAGMA table_info(users)').all()
    const updatedUsersColumnNames = new Set(updatedUsersColumns.map(c => c.name))
    
    const updatedTables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const updatedTableNames = new Set(updatedTables.map(t => t.name))

    console.log('Notes table columns:', Array.from(updatedNotesColumnNames))
    console.log('Users table columns:', Array.from(updatedUsersColumnNames))
    console.log('Database tables:', Array.from(updatedTableNames))
    console.log()

    if (updatedNotesColumnNames.has('is_announcement') &&
        updatedUsersColumnNames.has('announcements_opt_out') &&
        updatedTableNames.has('user_announcement_interactions')) {
      console.log('✅ SUCCESS: All migrations fixed successfully!')
      console.log('\nThe admin announcement system should now work correctly.')
      console.log('Admin announcements can be:')
      console.log('  - Created with is_announcement: true')
      console.log('  - Permanently deleted by admins')
      console.log('  - Dismissed by regular users')
      console.log('  - Tracked per user via interactions table')
    } else {
      console.log('❌ ERROR: Some migrations are still missing')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ ERROR fixing migrations:', error)
    console.error(error.stack)
    process.exit(1)
  }
}

fixMigrations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })