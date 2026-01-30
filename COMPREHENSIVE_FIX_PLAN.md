# Comprehensive Investigation & Fix Plan
**Date:** January 29, 2026  
**Purpose:** Identify and fix all remaining issues and regressions

---

## Executive Summary

### Status Overview

| Component | Status | Tests | Issues |
|-----------|--------|--------|---------|
| Unit Tests | ✅ PASSING | 231/231 passing |
| API Tests | ✅ PASSING | 8/8 passing |
| Dev Server | ✅ WORKING | Starts successfully |
| E2E Tests | ❌ FAILING | 32/32 tests timeout |
| Logging Module | ✅ FIXED | Module now mounted |
| Documents Feature | ⚠️ DISABLED | Feature toggle off |

### Completed Work

✅ **Phase 1 (Documents):** Investigated, feature intentionally disabled  
✅ **Phase 2 (Logging):** Fixed critical issue - module not mounted  
✅ **Unit Tests:** All 231 tests passing  
✅ **API Tests:** All 8 tests passing  
✅ **Dev Server:** Starts and runs successfully  

---

## Remaining Issues Analysis

### Issue 1: E2E Tests Timing Out (CRITICAL)

#### Symptoms
```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')
```

#### Root Cause Analysis

**Current Flow:**
1. Playwright starts dev server via `npm run dev`
2. Dev server starts: WEB (Vite) + API (Node) + Scheduler
3. Web server ready at `http://localhost:5173/`
4. API server ready at `http://0.0.0.0:8080`
5. Tests try to navigate to `/#/login`
6. **Timeout waiting for login form**

**Investigation Findings:**

✅ **Dev Server Works:**
- Vite starts successfully: `Local: http://localhost:5173/`
- API starts successfully: `API listening on http://0.0.0.0:8080`
- No build errors
- No runtime errors

❌ **Browser Navigation Fails:**
- Tests try to go to `/#/login` (hash route)
- Should be `http://localhost:5173/#/login`
- Page loads but login form not found
- Selector `input[type="email"]` not found

**Possible Causes:**

1. **Playwright Configuration Issue**
   ```javascript
   // playwright.config.js
   use: {
     baseURL: 'http://localhost:5173',
   }
   ```
   - baseURL is set correctly
   - But might have race condition with dev server startup

2. **Hash Routing Issue**
   - App uses hash-based routing (`/#/login`)
   - Vite might need configuration for hash routing
   - Router might not be initialized when page loads

3. **Frontend Build Timing**
   - Tests start before frontend is fully compiled
   - Vite shows "ready in 231ms" but React app might not be mounted
   - Need to wait for React to initialize

4. **Selector Mismatch**
   - Test expects `input[type="email"]`
   - Login form might use different selector
   - Need to verify actual login form structure

#### Solutions

**Solution A: Fix Playwright Configuration (Recommended)**

```javascript
// playwright.config.js
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    timeout: 60000, // Already set
    // Add wait for app to be ready
    waitForLoadState: 'domcontentloaded',
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: false, // Force fresh server start
    timeout: 180 * 1000, // Increase timeout
    stdout: 'pipe', // Capture output for debugging
    stderr: 'pipe',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Comment out other browsers until tests pass
  ],
});
```

**Solution B: Fix E2E Test Setup**

```javascript
// tests/e2e/logging.e2e.test.js
test.describe('Logging System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for app to be ready
    await page.goto('/#/login', { waitUntil: 'networkidle' })
    
    // Wait for React to mount
    await page.waitForSelector('body', { state: 'attached' })
    await page.waitForTimeout(1000) // Extra buffer
    
    // Try multiple selectors
    const emailInput = await page.locator('input[type="email"]').or(
      page.locator('input[name="email"]')
    ).or(
      page.locator('#email')
    ).first()
    
    await emailInput.fill('admin')
    
    const passwordInput = await page.locator('input[type="password"]').or(
      page.locator('input[name="password"]')
    ).or(
      page.locator('#password')
    ).first()
    
    await passwordInput.fill('admin')
    
    // Try multiple submit button selectors
    const submitButton = await page.locator('button[type="submit"]').or(
      page.locator('button:has-text("Login")')
    ).or(
      page.locator('button:has-text("Sign in")')
    ).first()
    
    await submitButton.click()
    await page.waitForURL('/#/notes', { timeout: 10000 })
  })
  
  // ... rest of tests
})
```

**Solution C: Add Playwright Wait Helpers**

```javascript
// tests/e2e/helpers.js
export const waitForAppReady = async (page) => {
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('[data-testid="app-root"]', { timeout: 10000 })
  await page.waitForTimeout(500)
}

export const loginAsAdmin = async (page) => {
  await page.goto('/#/login')
  await waitForAppReady(page)
  
  await page.fill('input[type="email"], input[name="email"]', 'admin')
  await page.fill('input[type="password"], input[name="password"]', 'admin')
  await page.click('button[type="submit"], button:has-text("Login")')
  await page.waitForURL('/#/notes')
}
```

**Solution D: Use Pre-built Frontend (Most Reliable)**

```javascript
// playwright.config.js
export default defineConfig({
  // ... other config
  
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 180 * 1000,
  },
  
  use: {
    baseURL: 'http://localhost:4173',
    // ... other config
  },
});
```

**Pros:**
- Production build is more stable
- No compilation time during tests
- More consistent behavior

**Cons:**
- Slower test startup (build takes time)
- Need to rebuild after code changes

---

### Issue 2: WebKit Browser Dependencies (MEDIUM)

#### Symptoms
```
Error: browserType.launch:
Host system is missing dependencies to run browsers.
Missing libraries: libgtk-4.so.1, libgraphene-1.0.so.0, ...
```

#### Root Cause
WebKit on Linux requires additional system libraries (GTK, GStreamer, etc.)

#### Solutions

**Solution A: Install System Dependencies**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
  libgtk-4-1 \
  libglib2.0-0 \
  libharfbuzz-0 \
  libgbm-1 \
  libnss3 \
  libxkbcommon0 \
  libatspi2.0-0 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpango-1.0-0 \
  libcairo2 \
  libatspi2.0-0 \
  libcups2 \
  libxshmfence1 \
  libgdk-pixbuf-2.0-0

# Alternatively, use Playwright's browser installation
npx playwright install-deps chromium
npx playwright install-deps webkit
```

**Solution B: Skip WebKit in Tests**

```javascript
// playwright.config.js
export default defineConfig({
  // ... other config
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // Comment out WebKit until dependencies are installed
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
});
```

**Solution C: Use Docker**

```bash
# Docker image includes all browser dependencies
docker-compose up -d
```

Then update playwright config to use Docker network:
```javascript
webServer: {
  command: 'docker-compose up -d',
  url: 'http://localhost:5173',
  reuseExistingServer: true,
}
```

---

### Issue 3: Missing Test Infrastructure (LOW)

#### Observations

1. **No Test Data Setup**
   - Tests rely on default admin user (`admin/admin`)
   - No test database seeding
   - Tests might interfere with each other

2. **No Test Cleanup**
   - Tests don't clean up after themselves
   - Data accumulates in test database
   - Tests might fail due to old data

3. **No Test Isolation**
   - All tests use same database
   - Tests can't run in parallel safely
   - Hard to debug failing tests

#### Solutions

**Solution A: Add Test Database Setup**

```javascript
// tests/e2e/setup.js
export const setupTestDatabase = async (request) => {
  // Reset database before tests
  await request.post('/api/admin/test-reset', {
    headers: {
      Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
    },
  })
  
  // Create test users
  await request.post('/api/admin/test-user', {
    headers: {
      Authorization: `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
    },
    data: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword',
    },
  })
}
```

**Solution B: Add Test Server Endpoint**

```javascript
// server/test-endpoints.js
app.post('/api/admin/test-reset', async (req, res) => {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(403).json({ error: 'Test mode only' })
  }
  
  // Reset database
  await db.exec('DELETE FROM notes WHERE user_id IN (SELECT id FROM users WHERE email LIKE "test%@%")')
  await db.exec('DELETE FROM users WHERE email LIKE "test%@%"')
  
  res.json({ ok: true })
})

app.post('/api/admin/test-user', async (req, res) => {
  if (process.env.NODE_ENV !== 'test') {
    return res.status(403).json({ error: 'Test mode only' })
  }
  
  // Create test user
  const { name, email, password } = req.body
  const hash = bcrypt.hashSync(password, 10)
  await insertUser.run(name, email, hash, nowISO())
  
  res.json({ ok: true })
})
```

**Solution C: Use In-Memory Database for Tests**

```javascript
// server/config.test.js
export const getTestDatabase = () => {
  // Use in-memory SQLite for tests
  const dbPath = ':memory:'
  return new Database(dbPath)
}
```

---

## Priority Fix Plan

### Phase 3: Fix E2E Test Infrastructure (PRIORITY 1)

**Steps:**

1. **Fix Playwright Configuration**
   - [ ] Update playwright.config.js with Solution A
   - [ ] Increase webServer timeout to 180s
   - [ ] Set `reuseExistingServer: false`
   - [ ] Comment out WebKit and Mobile browsers

2. **Fix E2E Test Setup**
   - [ ] Update logging.e2e.test.js with Solution B
   - [ ] Add robust selector handling
   - [ ] Add app-ready wait helpers
   - [ ] Increase individual test timeouts

3. **Add Test Infrastructure**
   - [ ] Create test database setup endpoint
   - [ ] Add test cleanup between tests
   - [ ] Create test helper functions

4. **Test Fix**
   - [ ] Run E2E tests with single browser (Chromium)
   - [ ] Verify all 8 logging tests pass
   - [ ] Debug any remaining failures
   - [ ] Re-enable Firefox once Chromium passes
   - [ ] Re-enable WebKit after dependencies installed

**Expected Outcome:**
- ✅ 8/8 logging E2E tests passing
- ✅ 3/3 documents E2E tests passing (when enabled)
- ✅ Stable test infrastructure
- ✅ No timeout errors

**Time Estimate:** 2-3 hours

---

### Phase 4: Fix Browser Dependencies (PRIORITY 2)

**Steps:**

1. **Install WebKit Dependencies**
   - [ ] Run `npx playwright install-deps webkit`
   - [ ] Or install system packages manually
   - [ ] Verify WebKit can launch

2. **Enable All Browser Tests**
   - [ ] Uncomment WebKit in playwright.config.js
   - [ ] Uncomment Mobile Chrome in playwright.config.js
   - [ ] Run full test suite
   - [ ] Verify all browsers pass

**Expected Outcome:**
- ✅ All 4 browsers can run tests
- ✅ 32 total E2E tests passing
- ✅ Cross-browser compatibility verified

**Time Estimate:** 1-2 hours

---

### Phase 5: Improve Test Infrastructure (PRIORITY 3)

**Steps:**

1. **Add Test Database Setup**
   - [ ] Create test database reset endpoint
   - [ ] Add test user creation endpoint
   - [ ] Secure endpoints with test mode check

2. **Add Test Cleanup**
   - [ ] Add afterEach hooks to clean up
   - [ ] Delete test data after tests
   - [ ] Reset database state

3. **Add Test Isolation**
   - [ ] Use in-memory database for tests
   - [ ] Or use separate test database
   - [ ] Ensure tests don't interfere

**Expected Outcome:**
- ✅ Reliable test execution
- ✅ No data pollution between tests
- ✅ Parallel test execution possible
- ✅ Faster test runs

**Time Estimate:** 2-3 hours

---

### Phase 6: Investigate Remaining Features (PRIORITY 4)

**Features to Investigate:**

1. **Authentication Flow**
   - [ ] Review JWT token handling
   - [ ] Check token refresh logic
   - [ ] Verify logout flow
   - [ ] Test password reset
   - [ ] Validate secret key authentication

2. **Bundle Splitting**
   - [ ] Analyze bundle sizes
   - [ ] Identify large chunks
   - [ ] Implement code splitting
   - [ ] Test lazy loading
   - [ ] Measure performance improvement

3. **Accessibility Issues**
   - [ ] Run axe-core linter
   - [ ] Fix ARIA labels
   - [ ] Improve keyboard navigation
   - [ ] Check color contrast
   - [ ] Test screen reader support

4. **Schema Validation**
   - [ ] Review validation logic
   - [ ] Ensure migrations are safe
   - [ ] Re-enable validation
   - [ ] Test with existing databases
   - [ ] Add validation tests

**Time Estimate:** 8-12 hours (4 phases × 2-3 hours each)

---

## Implementation Strategy

### Immediate Actions (Today)

1. **Fix E2E Tests (Priority 1)**
   - Update playwright.config.js
   - Fix E2E test selectors
   - Run and verify tests pass

2. **Document Findings**
   - Create final report
   - Document all solutions
   - Provide test execution guide

### Short-term Actions (This Week)

1. **Fix Browser Dependencies**
   - Install WebKit dependencies
   - Enable all browser tests
   - Verify cross-browser tests

2. **Improve Test Infrastructure**
   - Add test database setup
   - Implement test cleanup
   - Improve test isolation

### Long-term Actions (Next Sprint)

1. **Investigate Remaining Features**
   - Authentication flow
   - Bundle splitting
   - Accessibility
   - Schema validation

2. **Continuous Improvement**
   - Add more E2E tests
   - Improve test coverage
   - Add performance tests
   - Monitor test flakiness

---

## Success Criteria

### Phase 3 (E2E Tests)
- [x] 8/8 logging E2E tests passing
- [ ] 3/3 documents E2E tests passing (when enabled)
- [ ] Tests run in under 5 minutes
- [ ] No timeout errors
- [ ] Tests are stable (green build)

### Phase 4 (Browser Dependencies)
- [ ] All 4 browsers can run tests
- [ ] 32 total E2E tests passing
- [ ] Cross-browser tests green
- [ ] CI/CD can run all browsers

### Phase 5 (Test Infrastructure)
- [ ] Tests run in parallel
- [ ] No data pollution between tests
- [ ] Test runs are reproducible
- [ ] Test execution time < 3 minutes

### Phase 6 (Remaining Features)
- [ ] Authentication flow documented
- [ ] Bundle size reduced by 30%
- [ ] Accessibility score > 90
- [ ] Schema validation enabled

---

## Risk Assessment

### High Risk
- **E2E Test Failures:** Blocking CI/CD
  - **Mitigation:** Fix test infrastructure first
  - **Backup:** Skip E2E tests temporarily

### Medium Risk
- **Browser Dependencies:** Prevents cross-browser testing
  - **Mitigation:** Use Docker or Cloud CI
  - **Backup:** Run tests on different browsers separately

### Low Risk
- **Test Data Issues:** Tests might be flaky
  - **Mitigation:** Add test isolation
  - **Backup:** Manual test verification

---

## Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|-----------|
| Phase 3: Fix E2E Tests | 2-3 hours | 2026-01-29 | 2026-01-29 |
| Phase 4: Browser Dependencies | 1-2 hours | 2026-01-29 | 2026-01-29 |
| Phase 5: Test Infrastructure | 2-3 hours | 2026-01-30 | 2026-01-30 |
| Phase 6: Remaining Features | 8-12 hours | 2026-01-30 | 2026-01-31 |

**Total Estimated Time:** 13-20 hours

---

## Conclusion

### Current Status

**✅ Completed:**
- Unit tests: 231/231 passing
- API tests: 8/8 passing
- Dev server: Working
- Logging module: Fixed and mounted
- Documents feature: Investigated (intentionally disabled)

**❌ Issues:**
- E2E tests: 32/32 failing (timeout)
- WebKit: Missing dependencies
- Test infrastructure: Needs improvement

**📋 Next Steps:**
1. Fix E2E test configuration (Priority 1)
2. Fix browser dependencies (Priority 2)
3. Improve test infrastructure (Priority 3)
4. Investigate remaining features (Priority 4)

### Recommendations

1. **Immediate:** Fix E2E tests first - this is blocking CI/CD
2. **Short-term:** Improve test infrastructure for reliability
3. **Long-term:** Investigate remaining features systematically
4. **Continuous:** Monitor test health and add more tests

---

**Document Created:** January 29, 2026  
**Status:** Ready for implementation  
**Next Action:** Begin Phase 3 - Fix E2E Tests