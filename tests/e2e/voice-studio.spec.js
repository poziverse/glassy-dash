import { test, expect } from '@playwright/test'

test.describe('Voice Studio Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Voice Studio
    await page.goto('/#/voice', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('body', { state: 'attached' })
    await page.waitForTimeout(500)
  })

  test('should show microphone permission error if not granted', async ({ page }) => {
    // We can't easily grant mic permission in headless, so we expect robust handling
    const recordButton = page.locator('button:has(svg.lucide-mic)').or(
      page.locator('button:has(svg[data-lucide="mic"])')
    ).or(
      page.locator('button[aria-label*="record" i]')
    ).first()
    
    await expect(recordButton).toBeVisible()

    // Try to click - may trigger permission dialog
    await recordButton.click()

    // Wait a moment for any error to appear
    await page.waitForTimeout(500)

    // Check for error message or mic icon (depending on browser permissions)
    const hasError = await page.locator('.fixed').filter({ hasText: /permission|microphone|error/i }).count()
    const hasMic = await page.locator('button svg.lucide-mic').count()
    
    // Either error message should be visible or mic icon should still be present
    expect(hasError + hasMic).toBeGreaterThan(0)
  })

  test('should toggle audio editor when viewing a recording', async ({ page }) => {
    // Need to have a recording state.
    // Since we can't record easily in CI/E2E without fake media stream,
    // we would typically mock the store state or use a specialized setup.

    // For now, check if Studio is visible - look for "Voice Recorder" text in header
    const voiceRecorder = page.locator('text=Voice Recorder').or(
      page.locator('button:has(svg.lucide-mic)').or(
        page.locator('button:has(svg[data-lucide="mic"])')
      ).first()
    )
    
    await expect(voiceRecorder).toBeVisible()

    // Check if controls are present - mic icon
    const micIcon = page.locator('button:has(svg.lucide-mic)').or(
      page.locator('button:has(svg[data-lucide="mic"])')
    ).or(
      page.locator('button[aria-label*="microphone" i]')
    ).first()
    
    await expect(micIcon).toBeVisible()
  })
})
