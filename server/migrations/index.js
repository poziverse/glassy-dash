/**
 * Database Migrations Index
 * Manages all database migrations in order
 */

const path = require('path')
const fs = require('fs')
const add0001 = require('./0001_add_ANNOUNCEMENTS')
const add0002 = require('./0002_add_COLLABORATION')
const add0003 = require('./0003_add_user_providers')

// Migration files in order of execution
const MIGRATIONS = [
  add0001,
  add0002,
  add0003
]

/**
 * Get all migrations in order
 */
function getAllMigrations() {
  return MIGRATIONS
}

/**
 * Run all pending migrations
 * @param {Object} db - The database instance
 */
async function runMigrations(db) {
  console.log('[Migrations] Running migrations...')
  
  try {
    // Check migration status table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at TEXT NOT NULL,
        checksum TEXT NOT NULL
      );
    `)
    
    // Get executed migrations
    const executed = new Set(
      (await db.prepare('SELECT name FROM migrations').all())
        .map(r => r.name)
    )
    
    // Run each migration in order
    for (const migration of MIGRATIONS) {
      const migrationName = migration.name
      
      if (executed.has(migrationName)) {
        console.log(`[Migrations] ✓ Skipping ${migrationName} (already executed)`)
        continue
      }
      
      console.log(`[Migrations] Executing ${migrationName}...`)
      
      await migration.up(db)
      
      // Record migration as executed
      const now = new Date().toISOString()
      await db.prepare(`
        INSERT INTO migrations (name, executed_at, checksum)
        VALUES (?, ?, '')
      `).run(migrationName, now)
      
      console.log(`[Migrations] ✓ Completed ${migrationName}`)
      executed.add(migrationName)
    }
    
    console.log(`[Migrations] ✓ All migrations completed`)
  } catch (error) {
    console.error('[Migrations] ✗ Migration failed:', error)
    throw error
  }
}

module.exports = {
  getAllMigrations,
  runMigrations
}