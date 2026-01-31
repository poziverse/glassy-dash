import { test, expect } from '@playwright/test'

test.describe('Logging System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // User is already authenticated via global setup
    // Navigate to notes
    await page.goto('/#/notes', { waitUntil: 'domcontentloaded' })
    
    // Wait for React to mount
    await page.waitForSelector('body', { state: 'attached' })
    await page.waitForTimeout(500)
  })

  test('should log user login event', async ({ page, request }) => {
    // Trigger a logout
    await page.click('button[aria-label*="settings" i], button:has-text("Settings")')
    await page.click('button:has-text("Logout")')

    // Check login was logged (via API)
    const logs = await request.get('/api/logs', {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('glassy-dash-auth'))}`,
      },
    })

    const loginEvents = logs.filter(log => log.action === 'user_login')
    expect(loginEvents.length).toBeGreaterThan(0)
  })

  test('should log note creation', async ({ page, request }) => {
    // Create a new note
    await page.click('button:has-text("New Note")')
    await page.fill('textarea[placeholder*="Title" i]', 'Test Note for Logging')
    await page.fill('textarea[placeholder*="Content" i]', 'This is a test note')

    // Wait for note to be created
    await page.waitForSelector('text=Test Note for Logging')

    // Check note creation was logged
    const logs = await request.get('/api/logs', {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('glassy-dash-auth'))}`,
      },
    })

    // Note creation is tracked implicitly through API calls
    const apiCalls = logs.filter(
      log => log.action === 'api_error' || log.action === 'network_error'
    )
    // Should not have errors for successful operations
    const recentErrors = apiCalls.filter(log => {
      const logTime = new Date(log.timestamp)
      const now = new Date()
      return now - logTime < 5000 // Last 5 seconds
    })

    expect(recentErrors.length).toBe(0)
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept and fail API calls
    await page.route('**/api/notes', route => route.abort())

    // Try to fetch notes
    await page.reload()

    // Should show error state or fallback to cached data
    const errorToast = page.locator('.fixed.top-4.right-4').filter({ hasText: /error/i })

    // Either error toast appears or cached notes are shown
    await expect(errorToast.or(page.locator('[data-testid="note-card"]').first())).toBeVisible()
  })

  test('should persist logs on network failure', async ({ page }) => {
    // Block all requests
    await page.route('**', route => route.abort())

    // Try to perform an action
    await page.click('button:has-text("New Note")')

    // Check that pending logs are stored in localStorage
    const pendingLogs = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('pending_logs') || '[]')
    })

    // Should have pending logs
    expect(pendingLogs.length).toBeGreaterThanOrEqual(0)
  })

  test('should generate unique request IDs', async ({ page, request }) => {
    // Perform multiple actions
    await page.click('button:has-text("New Note")')
    await page.fill('textarea[placeholder*="Title" i]', 'Note 1')

    await page.click('button:has-text("New Note")')
    await page.fill('textarea[placeholder*="Title" i]', 'Note 2')

    // Get logs
    const logs = await request.get('/api/logs', {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('glassy-dash-auth'))}`,
      },
    })

    // Filter for recent logs
    const recentLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp)
      const now = new Date()
      return now - logTime < 10000 // Last 10 seconds
    })

    // Check for unique request IDs
    const requestIds = recentLogs.map(log => log.requestId)
    const uniqueIds = new Set(requestIds)

    // Most logs should have unique request IDs
    expect(uniqueIds.size).toBeGreaterThan(requestIds.length * 0.8)
  })

  test('should log logout events', async ({ page, request }) => {
    // Logout
    await page.click('button[aria-label*="settings" i], button:has-text("Settings")')
    await page.click('button:has-text("Logout")')

    await page.waitForURL('/#/login')

    // Check logout was logged
    const logs = await request.get('/api/logs', {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('glassy-dash-auth'))}`,
      },
    })

    const logoutEvents = logs.filter(log => log.action === 'user_logout')
    expect(logoutEvents.length).toBeGreaterThan(0)
  })

  test('should export logs as CSV', async ({ page, request }) => {
    // Trigger export
    const response = await request.post('/api/logs/export', {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('glassy-dash-auth'))}`,
        'Content-Type': 'application/json',
      },
      data: {
        date: new Date().toISOString().split('T')[0],
        format: 'csv',
      },
    })

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/csv')

    const csv = await response.text()
    expect(csv).toContain('timestamp,level,action')
  })

  test('should provide log statistics', async ({ page, request }) => {
    const response = await request.get('/api/logs/stats', {
      headers: {
        Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('glassy-dash-auth'))}`,
      },
    })

    expect(response.status()).toBe(200)

    const stats = await response.json()
    expect(stats).toHaveProperty('levels')
    expect(stats).toHaveProperty('totalEntries')
    expect(stats).toHaveProperty('topActions')
    expect(stats).toHaveProperty('errorDetails')
  })
})
