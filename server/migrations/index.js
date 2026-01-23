/**
 * Database Migration System
 *
 * Handles database schema migrations with version tracking.
 * Supports up and down migrations for rollback capability.
 */

const Database = require('../db')
const path = require('path')

const DB_PATH = process.env.DB_FILE || path.join(__dirname, '../../data/notes.db')

// ============================================================================
// MIGRATION DEFINITIONS
// ============================================================================

const migrations = [
  {
    version: 1,
    name: 'add_soft_delete',
    description: 'Add soft delete capability with deleted_at column',
    up: async db => {
      // Check if deleted_at column exists
      const cols = await db.prepare(`PRAGMA table_info(notes)`).all()
      const columnNames = new Set(cols.map(c => c.name))

      // Add deleted_at column to notes table if it doesn't exist
      if (!columnNames.has('deleted_at')) {
        await db.exec(`
          ALTER TABLE notes ADD COLUMN deleted_at INTEGER;
        `)
      }

      // Create index on deleted_at for efficient trash queries
      await db.exec(`
        CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);
      `)
    },
    down: async db => {
      // SQLite doesn't support DROP COLUMN directly, so we recreate table
      await db.exec(`
        CREATE TABLE IF NOT EXISTS notes_backup (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          items_json TEXT NOT NULL,
          tags_json TEXT NOT NULL,
          images_json TEXT NOT NULL,
          color TEXT NOT NULL,
          pinned INTEGER NOT NULL DEFAULT 0,
          position REAL NOT NULL DEFAULT 0,
          timestamp TEXT NOT NULL,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        INSERT INTO notes_backup (
          id, user_id, type, title, content, items_json, tags_json, 
          images_json, color, pinned, position, timestamp
        )
        SELECT 
          id, user_id, type, title, content, items_json, tags_json, 
          images_json, color, pinned, position, timestamp
        FROM notes;
        
        DROP TABLE notes;
        ALTER TABLE notes_backup RENAME TO notes;
      `)
    },
  },
]

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Get current database version
 */
const getCurrentVersion = async db => {
  const result = await db.pragma('user_version')
  return result.user_version || 0
}

/**
 * Run pending migrations
 */
const runMigrations = async () => {
  const db = new Database(DB_PATH)
  const currentVersion = await getCurrentVersion(db)
  const pendingMigrations = migrations.filter(m => m.version > currentVersion)

  if (pendingMigrations.length === 0) {
    console.log('✅ Database is up to date (version', currentVersion, ')')
    await db.close()
    return
  }

  console.log(`📦 Running ${pendingMigrations.length} migration(s)...`)

  // Create an async transaction function
  const migrationLogic = async () => {
    for (const migration of pendingMigrations) {
      console.log(`  → Running migration: ${migration.name} (v${migration.version})`)
      console.log(`    ${migration.description}`)

      try {
        await migration.up(db)
        await db.exec(`PRAGMA user_version = ${migration.version}`)
        console.log(`    ✅ Migration v${migration.version} completed`)
      } catch (err) {
        console.error(`    ❌ Migration v${migration.version} failed:`, err.message)
        throw err
      }
    }
  }

  try {
    const tx = db.transaction(migrationLogic)
    await tx()
    console.log('✅ All migrations completed successfully')
    console.log(`   Database is now at version ${migrations[migrations.length - 1].version}`)
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    console.error('   Database rolled back to previous state')
    process.exit(1)
  } finally {
    await db.close()
  }
}

/**
 * Rollback to a specific version
 */
const rollbackToVersion = async targetVersion => {
  const db = new Database(DB_PATH)
  const currentVersion = await getCurrentVersion(db)

  if (currentVersion <= targetVersion) {
    console.log(`Database is already at version ${currentVersion} (target: ${targetVersion})`)
    await db.close()
    return
  }

  const migrationsToRollback = migrations
    .filter(m => m.version > targetVersion && m.version <= currentVersion)
    .sort((a, b) => b.version - a.version)

  console.log(`🔄 Rolling back ${migrationsToRollback.length} migration(s)...`)

  const rollbackLogic = async () => {
    for (const migration of migrationsToRollback) {
      console.log(`  → Rolling back: ${migration.name} (v${migration.version})`)

      try {
        if (migration.down) {
          await migration.down(db)
          await db.exec(`PRAGMA user_version = ${migration.version - 1}`)
          console.log(`    ✅ Rollback v${migration.version} completed`)
        } else {
          console.warn(`    ⚠️  No down migration for v${migration.version}`)
        }
      } catch (err) {
        console.error(`    ❌ Rollback v${migration.version} failed:`, err.message)
        throw err
      }
    }
  }

  try {
    const tx = db.transaction(rollbackLogic)
    await tx()
    console.log('✅ Rollback completed successfully')
    console.log(`   Database is now at version ${targetVersion}`)
  } catch (err) {
    console.error('❌ Rollback failed:', err.message)
    process.exit(1)
  } finally {
    await db.close()
  }
}

/**
 * Get migration status
 */
const getStatus = async () => {
  const db = new Database(DB_PATH)
  const currentVersion = await getCurrentVersion(db)

  console.log('\n📊 Migration Status')
  console.log('═'.repeat(50))
  console.log(`Current Version: ${currentVersion}`)
  console.log(`Latest Version: ${migrations[migrations.length - 1].version}`)
  console.log(`Pending Migrations: ${migrations.filter(m => m.version > currentVersion).length}`)
  console.log('\nMigration History:')
  console.log('─'.repeat(50))

  migrations.forEach(m => {
    const status = m.version <= currentVersion ? '✅ Applied' : '⏳ Pending'
    console.log(`  ${status} v${m.version}: ${m.name}`)
    console.log(`    ${m.description}`)
  })

  console.log('═'.repeat(50))
  await db.close()
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

// Only run CLI if this file is executed directly (not when required)
if (require.main === module) {
  ;(async () => {
    const command = process.argv[2]

    switch (command) {
      case 'up':
      case 'migrate':
        await runMigrations()
        break

      case 'down':
      case 'rollback':
        const targetVersion = parseInt(process.argv[3]) || 0
        await rollbackToVersion(targetVersion)
        break

      case 'status':
        await getStatus()
        break

      default:
        console.log('Usage:')
        console.log('  node server/migrations/index.js [command] [options]')
        console.log('')
        console.log('Commands:')
        console.log('  up, migrate       Run pending migrations')
        console.log('  down, rollback    Rollback migrations (version)')
        console.log('  status            Show migration status')
        console.log('')
        console.log('Examples:')
        console.log('  node server/migrations/index.js up')
        console.log('  node server/migrations/index.js rollback 2')
        console.log('  node server/migrations/index.js status')
        process.exit(1)
    }
  })()
}

const getMigrations = () => migrations

module.exports = {
  getMigrations,
  runMigrations,
  rollbackToVersion,
  getStatus,
  migrations,
}
