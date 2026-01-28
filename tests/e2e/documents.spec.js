import { test, expect } from '@playwright/test'

test.describe('Documents Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication or login
    await page.goto('/') // Assuming base URL redirects to login or dashboard
    // If login needed:
    // await page.fill('input[name="email"]', 'test@example.com');
    // await page.fill('input[name="password"]', 'password');
    // await page.click('button[type="submit"]');

    // Navigate to docs
    await page.goto('/#/docs')
  })

  test('should create a new folder', async ({ page }) => {
    // Wait for sidebar
    await expect(page.locator('aside')).toBeVisible()

    // Click New Folder button
    await page.click('button[title="New Folder"]')

    // Fill folder name
    await page.fill('input[placeholder="Folder Name"]', 'Test Folder E2E')
    await page.click('button:text("Create")') // Adjust selector as needed

    // Verify folder appears in sidebar
    await expect(page.locator('text=Test Folder E2E')).toBeVisible()
  })

  test('should create and verify a new document', async ({ page }) => {
    // Click New Doc
    await page.click('button:text("New Doc")')

    // Verify editor opens
    await expect(page.locator('.ProseMirror')).toBeVisible()

    // Type content
    await page.locator('.ProseMirror').fill('This is an E2E test document.')

    // Save (autosaver or manual)
    // await page.click('button:text("Save")');

    // Verify title update
    await expect(page.locator('input[placeholder="Untitled Document"]')).toBeVisible()
    await page.fill('input[placeholder="Untitled Document"]', 'E2E Doc Title')

    // Go back
    await page.goBack() // Or click back button

    // Verify doc in list
    await expect(page.locator('text=E2E Doc Title')).toBeVisible()
  })
})
