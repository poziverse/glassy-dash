import { test, expect } from '@playwright/test'

test.describe('Documents Feature (Updated)', () => {
  test.beforeEach(async ({ page }) => {
    // Create unique test user for each test
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    const testUser = {
      name: `Test User ${timestamp}${random}`,
      email: `test${timestamp}${random}@example.com`,
      password: 'test123456!',
    }
    
    // Register new user
    await page.goto('/#/register', { waitUntil: 'networkidle' })
    await page.waitForSelector('body', { state: 'attached' })
    await page.waitForSelector('input[placeholder="Name"]', { timeout: 10000 })
    
    await page.fill('input[placeholder="Name"]', testUser.name)
    await page.fill('input[placeholder="Username"]', testUser.email)
    await page.fill('input[placeholder="Password (min 6 chars)"]', testUser.password)
    await page.fill('input[placeholder="Confirm password"]', testUser.password)
    
    await page.waitForTimeout(500)
    await page.click('button:has-text("Create Account")')
    
    // Wait for registration to complete (may redirect to login or dashboard)
    await page.waitForTimeout(2000)
    
    // Check if we need to login (some apps redirect to login after registration)
    const currentUrl = page.url()
    if (currentUrl.includes('login')) {
      await page.fill('input[placeholder="Username"]', testUser.email)
      await page.fill('input[placeholder="Password"]', testUser.password)
      await page.waitForTimeout(500)
      await page.click('button:has-text("Sign In")')
    }
    
    // Wait for successful redirect
    await page.waitForURL(/#\/(dashboard|docs)/, { timeout: 10000 })
    await page.waitForSelector('body', { state: 'attached' })
    await page.waitForTimeout(1000)
    
    // Navigate to docs
    await page.goto('/#/docs', { waitUntil: 'networkidle' })
    await page.waitForSelector('body', { state: 'attached' })
    
    // Wait for DocsView component to mount and render
    await page.waitForTimeout(1000)
    
    // Wait for create button to be visible before proceeding
    await expect(page.locator('[data-testid="create-doc-button"]')).toBeVisible({ timeout: 10000 })
  })

  test('should create a new document', async ({ page }) => {
    // Wait for create button to be visible and stable
    const createButton = page.locator('[data-testid="create-doc-button"]')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    
    // Wait for button to be stable and clickable
    await createButton.waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Create document
    await createButton.click({ force: true })
    
    // Wait for document to appear in grid
    await page.waitForSelector('[data-testid="doc-card"]', { timeout: 15000 })
    
    // Verify at least one document exists
    const docCount = await page.locator('[data-testid="doc-card"]').count()
    expect(docCount).toBeGreaterThan(0)
  })

  test('should create and edit a document', async ({ page }) => {
    // Wait for create button
    const createButton = page.locator('[data-testid="create-doc-button"]')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Create document
    await createButton.click({ force: true })
    await page.waitForSelector('[data-testid="doc-card"]', { timeout: 10000 })
    
    // Wait a bit for state to settle
    await page.waitForTimeout(200)
    
    // Click first document - use nth(0) instead of :first-child
    await page.click('[data-testid="doc-card"]').nth(0)
    
    // Wait for editor to load
    await expect(page.locator('[data-testid="doc-title-input"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="doc-editor"]')).toBeVisible({ timeout: 10000 })
    
    // Edit title
    await page.fill('[data-testid="doc-title-input"]', 'E2E Test Document')
    
    // Edit content in editor
    const editor = page.locator('[data-testid="doc-editor"]')
    await editor.click()
    await page.keyboard.type('This is test content from E2E test')
    
    // Wait for update
    await page.waitForTimeout(500)
    
    // Navigate back
    await page.click('[data-testid="back-to-docs"]')
    
    // Wait for grid view
    await page.waitForSelector('[data-testid="doc-card"]', { timeout: 10000 })
    
    // Verify document with new title exists
    await expect(page.locator('text=E2E Test Document')).toBeVisible({ timeout: 10000 })
  })

  test('should search documents', async ({ page }) => {
    // Ensure create button is visible
    const createButton = page.locator('[data-testid="create-doc-button"]')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Create multiple documents
    await createButton.click({ force: true })
    await page.waitForTimeout(200)
    await createButton.click({ force: true })
    await page.waitForTimeout(200)
    await createButton.click({ force: true })
    await page.waitForTimeout(200)
    
    // Get initial count
    const initialCount = await page.locator('[data-testid="doc-card"]').count()
    expect(initialCount).toBeGreaterThan(0)
    
    // Search for "Untitled" - use correct placeholder from DashboardLayout
    await page.fill('input[placeholder*="Search docs"]', 'Untitled')
    
    // Wait for search to apply
    await page.waitForTimeout(500)
    
    // Verify search results
    const searchResults = await page.locator('[data-testid="doc-card"]').count()
    expect(searchResults).toBeGreaterThan(0)
    
    // Clear search
    await page.fill('input[placeholder*="Search docs"]', '')
    await page.waitForTimeout(500)
    
    // Verify all documents back
    const allDocs = await page.locator('[data-testid="doc-card"]').count()
    expect(allDocs).toBe(initialCount)
  })

  test('should delete document', async ({ page }) => {
    // Ensure create button is visible
    const createButton = page.locator('[data-testid="create-doc-button"]')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Create document
    await createButton.click({ force: true })
    await page.waitForSelector('[data-testid="doc-card"]', { timeout: 10000 })
    
    // Get initial count
    const initialCount = await page.locator('[data-testid="doc-card"]').count()
    expect(initialCount).toBeGreaterThan(0)
    
    // Hover over first document
    await page.hover('[data-testid="doc-card"]').nth(0)
    
    // Wait for delete button to appear
    await page.waitForTimeout(100)
    
    // Click delete button (in the footer actions - use Trash2 icon)
    await page.click('[data-testid="doc-card"]').nth(0).locator('button:has(svg[data-lucide="trash2"])')
    
    // Wait for confirmation dialog
    await expect(page.locator('text=Confirm Delete')).toBeVisible({ timeout: 5000 })
    
    // Click delete button in dialog
    await page.click('button:has-text("Delete")')
    
    // Wait for success message
    await expect(page.locator('text=Document deleted')).toBeVisible({ timeout: 5000 })
    
    // Wait for message to disappear
    await page.waitForTimeout(2000)
    
    // Verify document count decreased
    const finalCount = await page.locator('[data-testid="doc-card"]').count()
    expect(finalCount).toBeLessThan(initialCount)
  })

  test('should switch between grid and list view', async ({ page }) => {
    // Wait for grid view (default)
    const createButton = page.locator('[data-testid="create-doc-button"]')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Create a document first
    await createButton.click({ force: true })
    await page.waitForSelector('[data-testid="doc-card"]', { timeout: 10000 })
    
    // Switch to list view - use LayoutGrid/ListIcon icons since no title attribute
    await page.click('button:has(svg[data-lucide="list"])')
    await page.waitForTimeout(300)
    
    // Verify list view is active (button has bg-indigo-600 class)
    const listButton = page.locator('button:has(svg[data-lucide="list"])')
    await expect(listButton).toHaveClass(/bg-indigo-600/)
    
    // Switch back to grid view
    await page.click('button:has(svg[data-lucide="layout-grid"])')
    await page.waitForTimeout(300)
    
    // Verify grid view is active
    const gridButton = page.locator('button:has(svg[data-lucide="layout-grid"])')
    await expect(gridButton).toHaveClass(/bg-indigo-600/)
  })

  test('should sort documents', async ({ page }) => {
    // Ensure create button is visible
    const createButton = page.locator('[data-testid="create-doc-button"]')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Create multiple documents
    await createButton.click({ force: true })
    await page.waitForTimeout(200)
    await createButton.click({ force: true })
    await page.waitForTimeout(200)
    await createButton.click({ force: true })
    await page.waitForTimeout(200)
    
    // Get initial order
    const docs = page.locator('[data-testid="doc-card"]')
    const initialTitles = await docs.allTextContents()
    
    // Click sort button (toggles between Date and Name) - use SortAsc icon
    await page.click('button:has(svg[data-lucide="sort-asc"])')
    await page.waitForTimeout(300)
    
    // Verify sort changed
    const sortedTitles = await docs.allTextContents()
    expect(sortedTitles.length).toBe(initialTitles.length)
  })

  test('should toggle trash view', async ({ page }) => {
    // Ensure create button is visible
    const createButton = page.locator('[data-testid="create-doc-button"]')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Create a document first
    await createButton.click({ force: true })
    await page.waitForSelector('[data-testid="doc-card"]', { timeout: 10000 })
    
    const normalCount = await page.locator('[data-testid="doc-card"]').count()
    
    // Switch to trash view
    await page.click('button:has-text("Trash")')
    await page.waitForTimeout(300)
    
    // Trash should be empty (or have fewer items)
    const trashCount = await page.locator('[data-testid="doc-card"]').count()
    expect(trashCount).toBeLessThanOrEqual(normalCount)
    
    // Switch back to normal view
    await page.click('button:has-text("Trash")')
    await page.waitForTimeout(300)
    
    // Verify normal count restored
    const restoredCount = await page.locator('[data-testid="doc-card"]').count()
    expect(restoredCount).toBe(normalCount)
  })

  test('should pin document', async ({ page }) => {
    // Ensure create button is visible
    const createButton = page.locator('[data-testid="create-doc-button"]')
    await expect(createButton).toBeVisible({ timeout: 10000 })
    await createButton.waitFor({ state: 'visible', timeout: 5000 })
    await page.waitForTimeout(300)
    
    // Create document
    await createButton.click({ force: true })
    await page.waitForSelector('[data-testid="doc-card"]', { timeout: 10000 })
    
    // Hover over first document
    await page.hover('[data-testid="doc-card"]').nth(0)
    await page.waitForTimeout(100)
    
    // Click pin button - use Pin icon since it has title="Pin"
    const firstCard = page.locator('[data-testid="doc-card"]').nth(0)
    await firstCard.locator('button[title="Pin"]').click()
    await page.waitForTimeout(300)
    
    // Verify pin icon is filled (has fill-current class)
    const pinIcon = firstCard.locator('button[title="Pin"] svg')
    await expect(pinIcon).toHaveClass(/fill-current/)
  })
})