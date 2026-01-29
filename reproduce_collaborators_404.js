import sqlite3 from 'sqlite3'
import path from 'path'

// const fetch = global.fetch; // Node 24 has global fetch

const API_URL = 'http://localhost:8080/api'
const DB_PATH = 'data/notes.db'

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function promoteUserToAdmin(email) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, err => {
      if (err) return reject(err)
    })

    db.serialize(() => {
      db.run('UPDATE users SET is_admin = 1 WHERE email = ?', [email], err => {
        if (err) reject(err)
        else resolve()
      })
    })

    db.close()
  })
}

async function run() {
  console.log('--- Reproduction Script: Collaborators 404 on Announcement ---')

  // 1. Register a NEW Admin User
  const adminEmail = `admin_test_${Date.now()}@example.com`
  const adminPass = 'password123'

  console.log(`Creating new admin user: ${adminEmail}`)

  const regRes = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Admin', email: adminEmail, password: adminPass }),
  })

  if (!regRes.ok) {
    // If failed, maybe try login (but unique email prevents this usually)
    console.error('Failed to register admin:', await regRes.text())
    return
  }

  const regData = await regRes.json()
  let adminToken = regData.token

  // 2. Promote to Admin via DB
  console.log('Promoting user to admin via DB...')
  await promoteUserToAdmin(adminEmail)
  console.log('✓ User promoted to admin')

  // Relogin to get updated claims?
  // Actually, the token might contain is_admin claim that is STALE.
  // The server checks `is_admin` from DB for critical actions?
  // Let's check server code: `req.user.is_admin` comes from `auth` middleware which checks DB!
  // `const user = await db.prepare(...).get(payload.uid)` -> `req.user.is_admin = !!user.is_admin`
  // So the token itself doesn't need to change for the server to see the admin status,
  // BUT the client might use the token payload.
  // However, for API calls, the verify uses the payload to get UID, then hits DB.
  // So existing token SHOULD work.

  // 3. Create Announcement Note
  const noteBody = {
    type: 'text',
    title: 'Test Announcement ' + Date.now(),
    content: 'This is a test announcement.',
    is_announcement: true,
  }

  const createRes = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(noteBody),
  })

  if (!createRes.ok) {
    console.error('Failed to create announcement:', await createRes.text())
    return
  }

  const noteData = await createRes.json()
  const noteId = noteData.id
  console.log(`✓ Created Announcement Note: ${noteId}`)

  // 4. Register/Login as Regular User
  const userEmail = `user_${Date.now()}@example.com`
  const userPass = 'password123'

  const userRegRes = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Regular User', email: userEmail, password: userPass }),
  })

  let userToken
  if (userRegRes.ok) {
    const userData = await userRegRes.json()
    userToken = userData.token
    console.log('✓ Registered new Regular User')
  } else {
    console.error('Failed to register regular user:', await userRegRes.text())
    return
  }

  // 5. Fetch Collaborators for the Announcement
  console.log(`\nAttempting to fetch collaborators for note ${noteId} as Regular User...`)
  const collabRes = await fetch(`${API_URL}/notes/${noteId}/collaborators`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  })

  if (collabRes.status === 404) {
    console.log('❌ FAIL: Received 404 Not Found (Issue Reproduced)')
  } else if (collabRes.ok) {
    console.log('✅ SUCCESS: Received 200 OK')
    const data = await collabRes.json()
    console.log('   Collaborators:', data)
  } else {
    console.log(`❓ UNEXPECTED: Received ${collabRes.status} ${collabRes.statusText}`)
    console.log(await collabRes.text())
  }
}

run().catch(console.error)
