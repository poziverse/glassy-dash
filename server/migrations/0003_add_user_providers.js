/**
 * Migration 0003: Add user_providers table
 * Stores user-provided AI provider configurations
 * Supports user's own API keys for multiple AI services
 */

const DB_FILE = process.env.DB_FILE || './data/glasskeep.db'

/**
 * Migration function
 * @param {Object} db - The database instance
 * @returns {Promise<void>}
 */
async function up(db) {
  console.log('[Migration 0003] Creating user_providers table...')
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      provider_type TEXT NOT NULL CHECK(provider_type IN ('gemini', 'zai', 'ollama')),
      api_key TEXT NOT NULL,
      model TEXT,
      base_url TEXT,
      options TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_provider_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      settings_key TEXT NOT NULL,
      settings_value TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, settings_key)
    );
  `)
  
  console.log('[Migration 0003] ✓ Created user_providers and user_provider_settings tables')
}

/**
 * Rollback function
 * @param {Object} db - The database instance
 * @returns {Promise<void>}
 */
async function down(db) {
  console.log('[Migration 0003] Rolling back user_providers tables...')
  
  await db.exec(`
    DROP TABLE IF EXISTS user_provider_settings;
    DROP TABLE IF EXISTS user_providers;
  `)
  
  console.log('[Migration 0003] ✓ Rolled back user_providers tables')
}

module.exports = { name: 'add_user_providers', up, down }