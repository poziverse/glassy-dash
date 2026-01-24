/**
 * Automated Trash Cleanup Task
 *
 * This script permanently deletes notes that have been in trash for more than 30 days.
 * It can be run manually or scheduled via cron job.
 */

const Database = require('./db')
const path = require('path')

const DB_PATH = process.env.DB_FILE || path.join(__dirname, '../data/notes.db')

/**
 * Clean up trash - delete notes older than specified days
 */
async function cleanupTrash(daysOld = 30) {
  const db = new Database(DB_PATH)

  try {
    // Calculate the cutoff timestamp (current time - daysOld days in seconds)
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - daysOld * 24 * 60 * 60

    console.log(`🧹 Starting trash cleanup...`)
    console.log(`   Cutoff: Notes deleted before ${new Date(cutoffTimestamp * 1000).toISOString()}`)
    console.log(`   Retention period: ${daysOld} days`)

    // Count notes to be deleted
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM notes 
      WHERE deleted_at IS NOT NULL 
        AND deleted_at < ?
    `)
    const countResult = await countStmt.get(cutoffTimestamp)
    const count = countResult ? countResult.count : 0

    if (count === 0) {
      console.log(`✅ No old notes to clean up. Trash is fresh!`)
      return
    }

    console.log(`   Found ${count} note${count !== 1 ? 's' : ''} to permanently delete`)

    // Delete old notes from trash
    const deleteStmt = db.prepare(`
      DELETE FROM notes 
      WHERE deleted_at IS NOT NULL 
        AND deleted_at < ?
    `)

    const result = await deleteStmt.run(cutoffTimestamp)

    console.log(
      `✅ Cleanup complete: Deleted ${result.changes} note${result.changes !== 1 ? 's' : ''} permanently`
    )

    // Log remaining trash count
    const remainingStmt = db.prepare(
      'SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NOT NULL'
    )
    const remainingResult = await remainingStmt.get()
    const remaining = remainingResult ? remainingResult.count : 0
    console.log(`   ${remaining} note${remaining !== 1 ? 's' : ''} remaining in trash`)
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
    process.exit(1)
  } finally {
    await db.close()
  }
}

/**
 * Show trash statistics
 */
async function showStats() {
  const db = new Database(DB_PATH)

  try {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NOT NULL')
    const countResult = await countStmt.get()
    const count = countResult ? countResult.count : 0

    const oldestStmt = db.prepare(
      'SELECT MIN(deleted_at) as oldest, MAX(deleted_at) as newest FROM notes WHERE deleted_at IS NOT NULL'
    )
    const { oldest, newest } = await oldestStmt.get()

    console.log('\n📊 Trash Statistics')
    console.log('═'.repeat(50))
    console.log(`Total notes in trash: ${count}`)

    if (oldest && newest) {
      console.log(`Oldest deleted: ${new Date(oldest * 1000).toISOString()}`)
      console.log(`Newest deleted: ${new Date(newest * 1000).toISOString()}`)

      const now = Math.floor(Date.now() / 1000)
      const oldestDays = Math.floor((now - oldest) / (24 * 60 * 60))
      console.log(`Oldest note age: ${oldestDays} day${oldestDays !== 1 ? 's' : ''}`)
    }

    console.log('═'.repeat(50))
  } catch (error) {
    console.error('❌ Failed to get stats:', error.message)
  } finally {
    await db.close()
  }
}

// CLI Interface
if (require.main === module) {
  ;(async () => {
    const command = process.argv[2]
    const days = parseInt(process.argv[3]) || 30

    switch (command) {
      case 'cleanup':
      case 'run':
        await cleanupTrash(days)
        break

      case 'stats':
      case 'status':
        await showStats()
        break

      default:
        console.log('Usage:')
        console.log('  node server/cleanup.js [command] [options]')
        console.log('')
        console.log('Commands:')
        console.log('  cleanup, run   Run trash cleanup (delete notes older than N days)')
        console.log('  stats, status  Show trash statistics')
        console.log('')
        console.log('Options:')
        console.log('  [days]         Retention period in days (default: 30)')
        console.log('')
        console.log('Examples:')
        console.log('  node server/cleanup.js run')
        console.log('  node server/cleanup.js cleanup 30')
        console.log('  node server/cleanup.js stats')
    }
  })()
}

module.exports = {
  cleanupTrash,
  showStats,
}
