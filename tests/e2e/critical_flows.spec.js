// tests/e2e/critical_flows.spec.js
import { test, expect } from '@playwright/test'

test.describe('Critical User Flows', () => {
  // Unique user for each test run to avoid collisions
  const timestamp = Date.now()
  const user = {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'Password123!',
  }

  test.beforeEach(async ({ page }) => {
    // Navigate to home before each test
    await page.goto('/')
  })

  test('Complete Authentication and Note Lifecycle', async ({ page }) => {
    // 1. REGISTER
    await page.goto('/register')
    await page.fill('input[name="name"]', user.name)
    await page.fill('input[name="email"]', user.email)
    await page.fill('input[name="password"]', user.password)
    await page.fill('input[name="confirmPassword"]', user.password)
    await page.click('button[type="submit"]')

    // Verify redirect to home/dashboard and presence of user info
    await expect(page).toHaveURL('/')
    await expect(page.locator('text=Welcome')).toBeVisible()

    // 2. CREATE NOTE
    const noteTitle = `Critical Note ${timestamp}`
    const noteContent = 'This is a test note for stability verification.'

    // Open new note input (assuming a "Take a note..." or equivalent input area)
    // Adjust selector based on actual UI implementation
    await page.click('[placeholder="Take a note..."]')
    await page.fill('[placeholder="Title"]', noteTitle)
    await page.fill('[placeholder="Take a note..."]', noteContent)
    await page.click('text=Close') // Or click outside to save

    // Verify note is visible
    await expect(page.locator(`text=${noteTitle}`)).toBeVisible()
    await expect(page.locator(`text=${noteContent}`)).toBeVisible()

    // 3. EDIT NOTE
    await page.click(`text=${noteTitle}`)
    const updatedContent = noteContent + ' - UPDATED'
    await page.fill('[aria-label="Note content"]', updatedContent) // Adjust selector
    await page.click('text=Close')

    await expect(page.locator(`text=${updatedContent}`)).toBeVisible()

    // 4. PIN NOTE
    // Hover over note to see actions, then click pin
    const noteCard = page.locator('.note-card', { hasText: noteTitle })
    await noteCard.hover()
    await noteCard.locator('[aria-label="Pin note"]').click()

    // Verify it moved to Pinned section (if standard UI) or has pinned status
    // Assuming UI has "Pinned" header
    await expect(page.locator('text=Pinned')).toBeVisible()

    // 5. RELOAD PAGGE (Persistence)
    await page.reload()
    await expect(page.locator(`text=${updatedContent}`)).toBeVisible()
    await expect(page.locator('text=Pinned')).toBeVisible()

    // 6. DELETE NOTE
    await noteCard.hover()
    await noteCard.locator('[aria-label="Delete note"]').click() // Often "Trash" icon
    await expect(page.locator(`text=${noteTitle}`)).toBeHidden()

    // 7. RESTORE NOTE (Trash)
    await page.click('text=Trash') // Sidebar link
    await expect(page.locator(`text=${noteTitle}`)).toBeVisible()

    const trashNote = page.locator('.note-card', { hasText: noteTitle })
    await trashNote.hover()
    await trashNote.locator('[aria-label="Restore"]').click()
    await expect(trashNote).toBeHidden() // Should leave trash

    // Verify back in notes
    await page.click('text=Notes') // Sidebar link
    await expect(page.locator(`text=${noteTitle}`)).toBeVisible()

    // 8. LOGOUT
    await page.click(`text=${user.name.charAt(0)}`) // User avatar/menu
    await page.click('text=Logout')
    await expect(page).toHaveURL('/login')
  })
})
