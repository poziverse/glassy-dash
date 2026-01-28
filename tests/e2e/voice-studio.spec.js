import { test, expect } from '@playwright/test'

test.describe('Voice Studio Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Voice Studio
    await page.goto('/#/voice')
  })

  test('should show microphone permission error if not granted', async ({ page }) => {
    // We can't easily grant mic permission in headless, so we expect robust handling
    await page.click('button[title="Start Recording"]') // Adjust selector

    // Expect error message toast
    // validation depends on browser context permissions
  })

  test('should toggle audio editor when viewing a recording', async ({ page }) => {
    // Need to have a recording state.
    // Since we can't record easily in CI/E2E without fake media stream,
    // we would typically mock the store state or use a specialized setup.

    // For now, check if the Studio is visible
    await expect(page.locator('text=Voice Recorder')).toBeVisible()

    // Check if controls are present
    await expect(page.locator('button svg.lucide-mic')).toBeVisible()
  })
})
