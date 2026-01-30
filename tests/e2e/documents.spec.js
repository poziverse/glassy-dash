import { test, expect } from '@playwright/test'

test.describe('Documents Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication or login
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForSelector('body', { state: 'attached' })
    await page.waitForTimeout(500)
    
    // If login needed:
    // await page.fill('input[name="email"]', 'test@example.com');
    // await page.fill('input[name="password"]', 'password');
    // await page.click('button[type="submit"]');

    // Navigate to docs
    await page.goto('/#/docs', { waitUntil: 'networkidle' })
    await page.waitForSelector('body', { state: 'attached' })
    await page.waitForTimeout(500)
  })

  test('should create a new folder', async ({ page }) => {
    // Wait for sidebar
    await expect(page.locator('aside')).toBeVisible()

    // Click New Folder button
    const newFolderButton = page.locator('button[title="New Folder"]').or(
      page.locator('button:has-text("New Folder")')
    ).first()
    
    await newFolderButton.click()

    // Fill folder name
    const folderNameInput = page.locator('input[placeholder="Folder Name"]').or(
      page.locator('input[placeholder*="folder" i]')
    ).first()
    
    await folderNameInput.fill('Test Folder E2E')
    
    const createButton = page.locator('button:has-text("Create")').or(
      page.locator('button[type="submit"]')
    ).first()
    
    await createButton.click()

    // Verify folder appears in sidebar
    await expect(page.locator('text=Test Folder E2E')).toBeVisible()
  })

  test('should create and verify a new document', async ({ page }) => {
    // Click New Doc
    const newDocButton = page.locator('button:has-text("New Doc")').or(
      page.locator('button:has-text("New Document")')
    ).first()
    
    await newDocButton.click()

    // Verify editor opens
    await expect(page.locator('.ProseMirror')).toBeVisible()

    // Type content
    await page.locator('.ProseMirror').fill('This is an E2E test document.')

    // Save (autosaver or manual)
    // await page.click('button:has-text("Save")');

    // Verify title update
    const titleInput = page.locator('input[placeholder="Untitled Document"]').or(
      page.locator('input[placeholder*="title" i]')
    ).first()
    
    await expect(titleInput).toBeVisible()
    await titleInput.fill('E2E Doc Title')

    // Go back
    await page.goBack() // Or click back button

    // Verify doc in list
    await expect(page.locator('text=E2E Doc Title')).toBeVisible()
  })
})
