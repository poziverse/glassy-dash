import { FullConfig, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// Polyfill __dirname for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function globalSetup(config: FullConfig) {
  console.log('Global setup: Creating auth directory and authenticating user');
  const fs = await import('fs');
  
  const authFile = path.join(__dirname, '../playwright/.auth/user.json');
  const authDir = path.dirname(authFile);
  
  console.log('Auth file path:', authFile);
  
  // Create auth directory if it doesn't exist
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  
  // Check if auth file already exists - if so, skip authentication
  if (fs.existsSync(authFile)) {
    console.log('Auth file already exists, skipping authentication');
    return;
  }
  
  console.log('Creating new test user and authenticating...');
  
  // Launch browser and authenticate
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Generate unique test user
  const timestamp = Date.now();
  const user = {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'Password123!',
  };
  
  try {
    // Navigate to registration
    await page.goto('http://localhost:5173/#/register', { waitUntil: 'domcontentloaded' });
    
    // Wait for form elements
    await page.waitForSelector('input[placeholder*="name" i]', { timeout: 15000 });
    
    // Fill registration form
    await page.locator('input[placeholder*="name" i]').first().fill(user.name);
    await page.locator('input[placeholder*="username" i]').first().fill(user.email);
    await page.locator('input[type="password"]').nth(0).fill(user.password);
    await page.locator('input[type="password"]').nth(1).fill(user.password);
    
    // Submit form
    await page.locator('button[type="submit"]').click();
    
    // Wait for successful redirect with longer timeout
    await page.waitForURL('**/notes', { timeout: 20000 });
    
    // Save authentication state
    await context.storageState({ path: authFile });
    console.log('Authentication state saved to:', authFile);
    console.log('Test user created:', user.email);
  } catch (error) {
    console.error('Error during authentication setup:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;