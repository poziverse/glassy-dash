const Database = require('../db')
const fs = require('fs')
const path = require('path')

const DB_PATH = process.env.DB_FILE || path.join(__dirname, '../../data/notes.db')
const BACKUP_DIR = path.join(path.dirname(DB_PATH), 'backups')

// ============================================================================
// BACKUP DIRECTORY MANAGEMENT
// ============================================================================

/**
 * Ensure backup directory exists
 */
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`)
  }
}

// ============================================================================
// BACKUP OPERATIONS
// ============================================================================

/**
 * Create a new database backup
 *
 * @returns {string} Path to the created backup file
 */
const createBackup = async () => {
  ensureBackupDir()

  // Check if database exists
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`Database file not found: ${DB_PATH}`)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5) // Remove milliseconds and Z

  const backupPath = path.join(BACKUP_DIR, `notes-${timestamp}.db`)

  try {
    console.log('💾 Creating backup...')

    // Close any existing connections by opening and closing the database
    const db = new Database(DB_PATH, { readonly: true })

    // Get database info
    const size = fs.statSync(DB_PATH).size
    const sizeMB = (size / (1024 * 1024)).toFixed(2)
    console.log(`   Database size: ${sizeMB} MB`)

    await db.close()

    // Copy database file
    fs.copyFileSync(DB_PATH, backupPath)

    const backupSize = fs.statSync(backupPath).size
    const backupSizeMB = (backupSize / (1024 * 1024)).toFixed(2)

    console.log(`   Backup size: ${backupSizeMB} MB`)
    console.log(`✅ Backup created: ${backupPath}`)

    return backupPath
  } catch (err) {
    console.error('❌ Backup failed:', err.message)
    throw err
  }
}

/**
 * Restore database from backup
 *
 * @param {string} backupPath - Path to the backup file
 */
const restoreBackup = async backupPath => {
  try {
    console.log('📂 Restoring backup...')

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`)
    }

    // Validate backup file
    const backupStats = fs.statSync(backupPath)
    if (backupStats.size === 0) {
      throw new Error('Backup file is empty')
    }

    // Verify it's a valid SQLite database
    try {
      const testDb = new Database(backupPath, { readonly: true })
      await testDb.pragma('journal_mode') // Quick validation
      await testDb.close()
    } catch (err) {
      throw new Error('Invalid backup file: not a valid SQLite database')
    }

    // Create backup of current database before restoring
    if (fs.existsSync(DB_PATH)) {
      const restoreTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const preRestoreBackup = path.join(BACKUP_DIR, `pre-restore-${restoreTimestamp}.db`)
      fs.copyFileSync(DB_PATH, preRestoreBackup)
      console.log(`   Pre-restore backup created: ${preRestoreBackup}`)
    }

    // Restore backup
    fs.copyFileSync(backupPath, DB_PATH)

    const restoredSize = fs.statSync(DB_PATH).size
    const restoredSizeMB = (restoredSize / (1024 * 1024)).toFixed(2)

    console.log(`   Restored database size: ${restoredSizeMB} MB`)
    console.log('✅ Backup restored successfully')
  } catch (err) {
    console.error('❌ Restore failed:', err.message)
    throw err
  }
}

/**
 * List all available backups
 *
 * @returns {Array} Array of backup information objects
 */
const listBackups = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    return []
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.db'))
    .map(f => {
      const filePath = path.join(BACKUP_DIR, f)
      const stats = fs.statSync(filePath)

      // Extract timestamp from filename
      const match = f.match(/notes-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/)
      const timestamp = match ? match[1] : null

      return {
        name: f,
        path: filePath,
        size: stats.size,
        sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        created: stats.mtime,
        timestamp: timestamp ? new Date(timestamp.replace(/-/g, ':') + 'Z') : stats.mtime,
        isPreRestore: f.startsWith('pre-restore-'),
      }
    })
    .sort((a, b) => b.created - a.created)

  return files
}

/**
 * Delete a specific backup
 *
 * @param {string} backupPath - Path to the backup file
 */
const deleteBackup = backupPath => {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`)
    }

    fs.unlinkSync(backupPath)
    console.log(`🗑️  Deleted backup: ${backupPath}`)
  } catch (err) {
    console.error('❌ Delete failed:', err.message)
    throw err
  }
}

/**
 * Clean up old backups
 *
 * @param {number} keepDays - Number of days to keep backups (default: 7)
 */
const cleanupOldBackups = (keepDays = 7) => {
  try {
    console.log(`🧹 Cleaning up backups older than ${keepDays} days...`)

    const backups = listBackups()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - keepDays)

    let deletedCount = 0
    let deletedSize = 0

    backups.forEach(backup => {
      // Keep pre-restore backups for longer (30 days)
      const keepThreshold = backup.isPreRestore ? 30 : keepDays
      const backupCutoffDate = new Date()
      backupCutoffDate.setDate(backupCutoffDate.getDate() - keepThreshold)

      if (backup.created < backupCutoffDate) {
        try {
          const size = fs.statSync(backup.path).size
          fs.unlinkSync(backup.path)
          deletedCount++
          deletedSize += size
          console.log(`   🗑️  Deleted: ${backup.name}`)
        } catch (err) {
          console.error(`   ⚠️  Failed to delete ${backup.name}:`, err.message)
        }
      }
    })

    if (deletedCount > 0) {
      const deletedSizeMB = (deletedSize / (1024 * 1024)).toFixed(2)
      console.log(`✅ Deleted ${deletedCount} backup(s) (${deletedSizeMB} MB)`)
    } else {
      console.log('✅ No old backups to delete')
    }

    return deletedCount
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message)
    throw err
  }
}

/**
 * Get backup statistics
 *
 * @returns {Object} Backup statistics
 */
const getBackupStats = () => {
  const backups = listBackups()
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0)
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)

  const regularBackups = backups.filter(b => !b.isPreRestore)
  const preRestoreBackups = backups.filter(b => b.isPreRestore)

  return {
    totalBackups: backups.length,
    regularBackups: regularBackups.length,
    preRestoreBackups: preRestoreBackups.length,
    totalSize,
    totalSizeMB,
    oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
    newestBackup: backups.length > 0 ? backups[0].created : null,
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

// Only run CLI if this file is executed directly (not when required)
if (require.main === module) {
  ;(async () => {
    const command = process.argv[2]

    switch (command) {
      case 'create':
      case 'backup':
        try {
          const backupPath = await createBackup()
          console.log(`\n📦 Backup created: ${backupPath}`)
        } catch (err) {
          console.error('Error:', err.message)
          process.exit(1)
        }
        break

      case 'restore':
        const restorePath = process.argv[3]
        if (!restorePath) {
          console.error('Error: Backup path required')
          console.log('Usage: node server/migrations/backup.js restore <backup-path>')
          process.exit(1)
        }
        try {
          await restoreBackup(restorePath)
          console.log('\n✅ Database restored successfully')
        } catch (err) {
          console.error('Error:', err.message)
          process.exit(1)
        }
        break

      case 'list':
      case 'ls':
        const backups = listBackups()
        if (backups.length === 0) {
          console.log('No backups found')
        } else {
          console.log('\n📋 Available Backups')
          console.log('═'.repeat(80))
          backups.forEach((backup, index) => {
            const type = backup.isPreRestore ? '[Pre-Restore]' : '[Backup]'
            console.log(`${index + 1}. ${type} ${backup.name}`)
            console.log(`   Path: ${backup.path}`)
            console.log(`   Size: ${backup.sizeMB} MB`)
            console.log(`   Created: ${backup.created.toLocaleString()}`)
            console.log('─'.repeat(80))
          })

          const stats = getBackupStats()
          console.log(`\nTotal: ${stats.totalBackups} backups (${stats.totalSizeMB} MB)`)
        }
        break

      case 'delete':
        const deletePath = process.argv[3]
        if (!deletePath) {
          console.error('Error: Backup path required')
          console.log('Usage: node server/migrations/backup.js delete <backup-path>')
          process.exit(1)
        }
        try {
          deleteBackup(deletePath)
          console.log('\n✅ Backup deleted')
        } catch (err) {
          console.error('Error:', err.message)
          process.exit(1)
        }
        break

      case 'cleanup':
        const days = parseInt(process.argv[3]) || 7
        try {
          const deleted = cleanupOldBackups(days)
          console.log('\n✅ Cleanup completed')
        } catch (err) {
          console.error('Error:', err.message)
          process.exit(1)
        }
        break

      case 'stats':
        const backupStats = getBackupStats()
        console.log('\n📊 Backup Statistics')
        console.log('═'.repeat(50))
        console.log(`Total Backups: ${backupStats.totalBackups}`)
        console.log(`  Regular: ${backupStats.regularBackups}`)
        console.log(`  Pre-Restore: ${backupStats.preRestoreBackups}`)
        console.log(`Total Size: ${backupStats.totalSizeMB} MB`)
        console.log(`Newest: ${backupStats.newestBackup?.toLocaleString() || 'N/A'}`)
        console.log(`Oldest: ${backupStats.oldestBackup?.toLocaleString() || 'N/A'}`)
        console.log('═'.repeat(50))
        break

      default:
        console.log('Usage:')
        console.log('  node server/migrations/backup.js [command] [options]')
        console.log('')
        console.log('Commands:')
        console.log('  create, backup     Create a new database backup')
        console.log('  restore <path>     Restore database from backup')
        console.log('  list, ls           List all backups')
        console.log('  delete <path>      Delete a specific backup')
        console.log('  cleanup [days]      Clean up old backups (default: 7 days)')
        console.log('  stats              Show backup statistics')
        console.log('')
        console.log('Examples:')
        console.log('  node server/migrations/backup.js create')
        console.log(
          '  node server/migrations/backup.js restore ./data/backups/notes-2026-01-18T12-00-00.db'
        )
        console.log('  node server/migrations/backup.js list')
        console.log('  node server/migrations/backup.js cleanup 14')
    }
  })()
}

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  deleteBackup,
  cleanupOldBackups,
  getBackupStats,
}

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  deleteBackup,
  cleanupOldBackups,
  getBackupStats,
}
