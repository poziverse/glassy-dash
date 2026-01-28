// tests/api/announcements.test.js
// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'

const BASE_URL = `http://localhost:${process.env.API_PORT || 3002}/api`
let adminToken = ''
let userToken = ''
let haterToken = ''
let announcementId = ''

const sleep = ms => new Promise(r => setTimeout(r, ms))

describe('Announcements Integration', () => {
  it('should allow registering an admin user', async () => {
    // Retry connection a few times in case server is starting
    let attempts = 0
    while (attempts < 10) {
      try {
        const res = await fetch(`${BASE_URL}/monitoring/health`)
        if (res.ok) break
      } catch (e) {}
      await sleep(500)
      attempts++
    }

    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
      }),
    })

    // If user already exists (test re-run without db clean), try login
    if (res.status === 409) {
      const login = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'password123' }),
      })
      const data = await login.json()
      adminToken = data.token
      expect(data.user.is_admin).toBe(true)
    } else {
      expect(res.status).toBe(200)
      const data = await res.json()
      adminToken = data.token
      expect(data.user.is_admin).toBe(true)
    }
  })

  it('should allow admin to create an announcement', async () => {
    const res = await fetch(`${BASE_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        type: 'text',
        title: 'Important Update',
        content: 'This is a system announcement.',
        is_announcement: true,
      }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data).toBeDefined()
    expect(data.is_announcement).toBeTruthy() // 1 or true
    announcementId = data.id
  })

  it('should show announcement to a regular user', async () => {
    // Register regular user
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Regular User',
        email: 'user@test.com',
        password: 'password123',
      }),
    })
    const data = await res.json()
    userToken = data.token

    // Fetch notes
    const notesRes = await fetch(`${BASE_URL}/notes`, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
    const notes = await notesRes.json()

    const announcement = notes.find(n => n.id === announcementId)
    expect(announcement).toBeDefined()
    expect(announcement.title).toBe('Important Update')
    expect(announcement.is_announcement).toBeTruthy()
  })

  it('should allow user to dismiss announcement', async () => {
    const res = await fetch(`${BASE_URL}/notes/${announcementId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` },
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.dismissed).toBe(true)

    // Verify it's gone
    const notesRes = await fetch(`${BASE_URL}/notes`, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
    const notes = await notesRes.json()
    const announcement = notes.find(n => n.id === announcementId)
    expect(announcement).toBeUndefined()
  })

  it('should not show announcement if user opts out', async () => {
    // Register hater
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hater User',
        email: 'hater@test.com',
        password: 'password123',
      }),
    })
    const data = await res.json()
    haterToken = data.token

    // Verify initially present
    const notesRes1 = await fetch(`${BASE_URL}/notes`, {
      headers: { Authorization: `Bearer ${haterToken}` },
    })
    const notes1 = await notesRes1.json()
    expect(notes1.find(n => n.id === announcementId)).toBeDefined()

    // Opt out
    const settingsRes = await fetch(`${BASE_URL}/users/me/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${haterToken}`,
      },
      body: JSON.stringify({ announcements_opt_out: true }),
    })
    expect(settingsRes.status).toBe(200)
    const settingsData = await settingsRes.json()
    expect(settingsData.user.announcements_opt_out).toBe(true)

    // Verify gone
    const notesRes2 = await fetch(`${BASE_URL}/notes`, {
      headers: { Authorization: `Bearer ${haterToken}` },
    })
    const notes2 = await notesRes2.json()
    expect(notes2.find(n => n.id === announcementId)).toBeUndefined()
  })
})
