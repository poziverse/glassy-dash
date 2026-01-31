#!/usr/bin/env node
/**
 * Cleanup Test Announcements
 * 
 * This script removes test announcements created by the announcements.test.js file.
 * These announcements have the title "Important Update" and content "This is a system announcement."
 * 
 * Run with: node server/cleanup_test_announcements.js
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const DB_PATH = process.env.DB_PATH || process.env.DB_FILE || path.join(__dirname, '..', 'data', 'notes.db')

function runQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err)
      else resolve({ changes: this.changes, lastID: this.lastID })
    })
  })
}

function allQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows || [])
    })
  })
}

function getQuery(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

async function main() {
  console.log('🧹 Cleaning up test announcements...')
  console.log(`   Database: ${DB_PATH}`)
  
  const db = new sqlite3.Database(DB_PATH)
  
  try {
    // Find test announcements
    const testAnnouncements = await allQuery(db, `
      SELECT id, title, content, is_announcement, timestamp 
      FROM notes 
      WHERE is_announcement = 1 
        AND title = 'Important Update' 
        AND content = 'This is a system announcement.'
    `)
    
    console.log(`   Found ${testAnnouncements.length} test announcement(s)`)
    
    if (testAnnouncements.length === 0) {
      console.log('✅ No test announcements to clean up')
      return
    }
    
    // Show what will be deleted
    console.log('\n   Announcements to delete:')
    testAnnouncements.forEach((a, i) => {
      console.log(`   ${i + 1}. ID: ${a.id}, Created: ${a.timestamp}`)
    })
    
    let deleted = 0
    for (const announcement of testAnnouncements) {
      // Delete interactions first (foreign key constraint)
      await runQuery(db, 'DELETE FROM user_announcement_interactions WHERE note_id = ?', [announcement.id])
      // Delete the announcement
      const result = await runQuery(db, 'DELETE FROM notes WHERE id = ?', [announcement.id])
      if (result.changes > 0) {
        deleted++
      }
    }
    
    console.log(`\n✅ Deleted ${deleted} test announcement(s)`)
    
    // Verify cleanup
    const remaining = await getQuery(db, `
      SELECT COUNT(*) as count 
      FROM notes 
      WHERE is_announcement = 1 
        AND title = 'Important Update' 
        AND content = 'This is a system announcement.'
    `)
    
    if (remaining && remaining.count > 0) {
      console.warn(`⚠️  Warning: ${remaining.count} test announcement(s) still remain`)
    } else {
      console.log('✅ All test announcements have been removed')
    }
    
  } finally {
    db.close()
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
