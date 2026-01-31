import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page, context }) => {
  // Generate unique test user
  const timestamp = Date.now();
  const user = {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'Password123!',
  };

  // Navigate to registration
  console.log('Starting authentication setup...');
  await page.goto('/#/register', { waitUntil: 'domcontentloaded' });
  
  // Wait for form elements with better selectors
  await page.waitForSelector('input[placeholder*="name" i]', { timeout: 10000 });
  
  // Fill registration form
  await page.locator('input[placeholder*="name" i]').first().fill(user.name);
  await page.locator('input[placeholder*="username" i]').first().fill(user.email);
  await page.locator('input[type="password"]').nth(0).fill(user.password);
  await page.locator('input[type="password"]').nth(1).fill(user.password);
  
  // Submit form
  await page.locator('button[type="submit"]').click();
  
  // Wait for successful redirect
  // Use multiple strategies
  await Promise.race([
    page.waitForURL('/#/notes', { timeout: 15000 }),
    page.waitForSelector('text=Welcome', { timeout: 15000 }),
    page.waitForSelector('.notes-grid', { timeout: 15000 }),
  ]);
  
  // Verify we're logged in
  await expect(page.locator('body')).toContainText('Welcome');
  
  // Save authentication state
  await context.storageState({ path: authFile });
  console.log('Authentication state saved to:', authFile);
});