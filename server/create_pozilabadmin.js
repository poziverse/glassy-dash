// create_pozilabadmin.js – creates the pozilabadmin account using the simpler approach
const bcrypt = require('bcryptjs')
const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()

const username = 'pozilabadmin'
const email = 'eric@poziverse.com'
const password = 'Maplewood2025'
const name = 'Pozilab Admin'
const now = new Date().toISOString()
const hash = bcrypt.hashSync(password, 10)

const DB_PATH = path.join(__dirname, 'data.sqlite')

async function createPozilabAdmin() {
  const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE)
  
  try {
    console.log('\n=== Creating Pozilab Admin Account ===\n')
    
    // Helper functions
    const get = (sql, params) => {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      })
    }
    
    const run = (sql, params) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
          if (err) reject(err)
          else resolve(this)
        })
      })
    }
    
    const all = (sql, params) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })
    }
    
    // Get all users
    const allUsers = await all('SELECT * FROM users')
    console.log('Current users:', allUsers.length)
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Admin: ${user.is_admin === 1 ? 'YES' : 'NO'}`)
    })
    console.log()
    
    // Check if user already exists by email
    const existingByEmail = await get('SELECT id FROM users WHERE lower(email) = lower(?)', [email])
    const existingByName = await get('SELECT id FROM users WHERE name = ?', [username])
    
    console.log('Existing user by email:', existingByEmail)
    console.log('Existing user by name:', existingByName)
    console.log()
    
    if (existingByEmail) {
      console.log(`User with email ${email} already exists (id=${existingByEmail.id}). Updating...`)
      await run(
        'UPDATE users SET name = ?, password_hash = ?, is_admin = 1 WHERE id = ?',
        [name, hash, existingByEmail.id]
      )
      console.log('✓ User updated successfully\n')
    } else if (existingByName) {
      console.log(`User with name ${username} already exists (id=${existingByName.id}). Updating...`)
      await run(
        'UPDATE users SET email = ?, password_hash = ?, is_admin = 1 WHERE id = ?',
        [email, hash, existingByName.id]
      )
      console.log('✓ User updated successfully\n')
    } else {
      console.log('Creating new admin user...')
      console.log('Inserting:', { name, email, created_at: now, is_admin: 1 })
      
      const result = await run(
        'INSERT INTO users (name, email, password_hash, created_at, is_admin) VALUES (?, ?, ?, ?, 1)',
        [name, email, hash, now]
      )
      
      console.log(`✓ User created successfully with ID: ${result.lastID}\n`)
    }
    
    // Verify the user
    const user = await get(
      'SELECT id, name, email, is_admin, created_at FROM users WHERE name = ? OR email = ?',
      [name, email]
    )
    
    if (user) {
      console.log('=== Account Details ===')
      console.log('  Username:', user.name)
      console.log('  Email:', user.email)
      console.log('  Password:', password)
      console.log('  Is Admin:', user.is_admin === 1 ? 'YES ✓' : 'NO')
      console.log('  Created At:', user.created_at)
      console.log()
    }
    
  } catch (error) {
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    db.close()
  }
}

createPozilabAdmin()