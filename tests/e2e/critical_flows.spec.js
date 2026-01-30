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
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForSelector('body', { state: 'attached' })
    await page.waitForTimeout(500)
  })

  test('Complete Authentication and Note Lifecycle', async ({ page }) => {
    // 1. REGISTER
    await page.goto('/#/register', { waitUntil: 'networkidle' })
    await page.waitForSelector('body', { state: 'attached' })
    
    // Wait for form to be ready
    await page.waitForTimeout(500)
    
    // Use actual selectors from AuthViews.jsx
    const nameInput = page.locator('input[placeholder="Name"]').or(
      page.locator('input[placeholder*="name" i]')
    ).first()
    
    const emailInput = page.locator('input[placeholder="Username"]').or(
      page.locator('input[autoComplete="username"]')
    ).or(
      page.locator('input[placeholder*="username" i]')
    ).first()
    
    const passwordInput = page.locator('input[placeholder="Password (min 6 chars)"]').or(
      page.locator('input[type="password"]').first()
    ).or(
      page.locator('input[placeholder*="password" i]')
    ).nth(0)
    
    const confirmInput = page.locator('input[placeholder="Confirm password"]').or(
      page.locator('input[type="password"]').nth(1)
    ).or(
      page.locator('input[placeholder*="confirm" i]')
    ).first()
    
    await nameInput.fill(user.name)
    await emailInput.fill(user.email)
    await passwordInput.fill(user.password)
    await confirmInput.fill(user.password)
    
    const submitButton = page.locator('button:has-text("Create Account")').or(
      page.locator('button[type="submit"]')
    ).or(
      page.locator('button:has-text("Create")')
    ).first()
    
    await submitButton.click()

    // Verify redirect to notes (actual redirect destination)
    await expect(page).toHaveURL('/#/notes', { timeout: 10000 })
    await expect(page.locator('text=Welcome')).toBeVisible()

    // 2. CREATE NOTE
    const noteTitle = `Critical Note ${timestamp}`
    const noteContent = 'This is a test note for stability verification.'

    // Open new note input (assuming a "Take a note..." or equivalent input area)
    // Try multiple selector patterns
    const noteInput = page.locator('[placeholder="Take a note..."]').or(
      page.locator('[placeholder*="Take a note" i]')
    ).or(
      page.locator('button:has-text("New Note")')
    ).first()
    
    await noteInput.click()
    
    const titleInput = page.locator('[placeholder="Title"]').or(
      page.locator('input[placeholder*="title" i]')
    ).first()
    
    await titleInput.fill(noteTitle)
    
    const contentInput = page.locator('[placeholder="Take a note..."]').or(
      page.locator('textarea[placeholder*="note" i]')
    ).first()
    
    await contentInput.fill(noteContent)
    
    // Try multiple close/save patterns
    const closeButton = page.locator('text=Close').or(
      page.locator('button[aria-label*="close" i]')
    ).or(
      page.locator('button:has-text("Save")')
    ).first()
    
    await closeButton.click()

    // Verify note is visible
    await expect(page.locator(`text=${noteTitle}`)).toBeVisible()
    await expect(page.locator(`text=${noteContent}`)).toBeVisible()

    // 3. EDIT NOTE
    await page.click(`text=${noteTitle}`)
    const updatedContent = noteContent + ' - UPDATED'
    
    const editContent = page.locator('[aria-label="Note content"]').or(
      page.locator('textarea[aria-label*="content" i]')
    ).or(
      page.locator('[contenteditable="true"]')
    ).first()
    
    await editContent.fill(updatedContent)
    
    await closeButton.click()

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
    const userAvatar = page.locator(`text=${user.name.charAt(0)}`).or(
      page.locator('button[aria-label*="user" i]')
    ).first()
    
    await userAvatar.click()
    await page.click('text=Logout')
    await expect(page).toHaveURL('/#/login')
  })
})
