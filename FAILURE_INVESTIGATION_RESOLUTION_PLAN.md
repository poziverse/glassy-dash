# Failure Investigation & Resolution Plan
**Date:** January 29, 2026  
**Project:** GlassyDash  
**Version:** 1.1.6  
**Purpose:** Detailed plan to investigate and resolve all identified failures  

---

## Executive Summary

This document provides a step-by-step plan to investigate and resolve all critical issues identified in the code review. The plan is organized by priority, with specific investigation steps, root cause analysis, and resolution strategies.

### Failure Categories
1. **Priority 1 (Critical):** E2E Test Failures - Documents, Logging, Authentication
2. **Priority 2 (High):** Bundle Size, Accessibility Issues, Schema Validation
3. **Priority 3 (Medium):** Code Organization, Import Strategies, CORS Configuration

**Estimated Resolution Time:** 2-3 weeks for Priority 1 issues

---

## Phase 1: E2E Test Failures - Documents Feature

### 1.1 Issue Analysis

**Symptom:** Documents feature tests failing at 100% rate
- ❌ Should create a new folder
- ❌ Should create and verify a new document

**Impact:** Users cannot create or manage documents

### 1.2 Investigation Steps

#### Step 1: Verify Server Routes Exist
```bash
# Check if documents routes are registered
cd glassy-dash/GLASSYDASH
grep -n "documents" server/index.js

# Check for documents route file
ls -la server/routes/ | grep -i document

# Search for any documents-related endpoints
grep -r "/api/documents" server/
```

**Expected Results:**
- Documents routes should be registered in server/index.js
- Route file should exist: `server/routes/documents.js` (or similar)
- Endpoints should include: GET/POST `/api/documents`, POST `/api/documents/:id`

**Possible Issues:**
- Route file doesn't exist
- Routes not mounted in server/index.js
- Incorrect route path

#### Step 2: Verify Frontend Documents Components
```bash
# Find documents components
cd glassy-dash/GLASSYDASH
find src -name "*ocument*" -type f

# Check for Documents feature in App.jsx
grep -n "Document" src/App.jsx

# Check for documents route
grep -n "documents" src/App.jsx src/main.jsx
```

**Expected Results:**
- Documents component exists in `src/components/`
- Documents route is configured
- Component is imported and used

**Possible Issues:**
- Component doesn't exist
- Route not configured
- Component imported incorrectly

#### Step 3: Review E2E Test Configuration
```bash
# Examine documents E2E test
cat tests/e2e/documents.spec.js

# Check test selectors
# Look for timing issues
# Verify test data
```

**Key Items to Check:**
- Are selectors correct (data-testid, role, etc.)?
- Are there sufficient waits?
- Is test data valid?
- Are assertions correct?

#### Step 4: Run Single E2E Test with Debugging
```bash
# Run with Playwright debugger
cd glassy-dash/GLASSYDASH
npm run test:e2e:debug tests/e2e/documents.spec.js

# Or run with UI for interactive debugging
npm run test:e2e:ui
```

**While Running:**
- Watch for element not found errors
- Check timing of page loads
- Verify network requests
- Look for console errors

#### Step 5: Check Server Logs During Test
```bash
# In terminal 1: Start server with debug
cd glassy-dash/GLASSYDASH
NODE_ENV=development node server/index.js

# In terminal 2: Run test
npm run test:e2e tests/e2e/documents.spec.js

# In terminal 3: Watch logs
tail -f debug_auth.log

# Check for:
# - 404 errors (endpoint not found)
# - 500 errors (server errors)
# - Request/response timing
```

### 1.3 Root Cause Analysis Matrix

| Symptom | Possible Cause | Investigation Check |
|----------|---------------|---------------------|
| 404 on API call | Route not registered | Check server/index.js route mounting |
| 404 on page load | Route not configured in router | Check App.jsx route configuration |
| Timeout waiting for element | Slow API response | Check API response times |
| Element not found | Incorrect selector | Verify selector in test |
| State not updating | Component not rendering | Check React component lifecycle |

### 1.4 Resolution Strategies

#### Strategy A: Routes Missing
**If routes don't exist:**
```javascript
// Create server/routes/documents.js
const express = require('express')
const router = express.Router()

router.get('/', auth, async (req, res) => {
  // Get documents for user
  const rows = await db.prepare('SELECT * FROM documents WHERE user_id = ?').all(req.user.id)
  res.json(rows)
})

router.post('/', auth, async (req, res) => {
  // Create document
  const { title, content } = req.body
  const id = uid()
  await db.prepare('INSERT INTO documents (id, user_id, title, content) VALUES (?, ?, ?, ?)')
    .run(id, req.user.id, title, content)
  res.status(201).json({ id, title, content })
})

module.exports = router

// Mount in server/index.js (after other routes)
const documentsRoutes = require('./routes/documents')
app.use('/api/documents', documentsRoutes)
console.log('✓ Documents routes mounted at /api/documents')
```

#### Strategy B: Frontend Component Missing
**If component doesn't exist:**
```jsx
// Create src/components/Documents.jsx
import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export function Documents() {
  const { token } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const data = await api('/documents', { token })
        setDocuments(data)
      } catch (e) {
        console.error('Failed to fetch documents:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [token])

  if (loading) return <div>Loading documents...</div>

  return (
    <div className="documents-view">
      <h1>Documents</h1>
      <button onClick={() => {}}>Create Document</button>
      <div className="documents-list">
        {documents.map(doc => (
          <div key={doc.id} className="document-card">
            <h3>{doc.title}</h3>
            <p>{doc.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Add to App.jsx routes
import { Documents } from './components/Documents'

// In routing section:
<Route path="/documents" element={<Documents />} />
```

#### Strategy C: Test Selector Issues
**If selectors are wrong:**
```javascript
// Update tests/e2e/documents.spec.js
import { test, expect } from '@playwright/test'

test('should create a new folder', async ({ page }) => {
  await page.goto('http://localhost:5173')
  
  // Wait for page to load
  await page.waitForLoadState('networkidle')
  
  // Use data-testid for reliable selectors
  await page.click('[data-testid="documents-link"]')
  
  // Wait for documents page
  await page.waitForSelector('[data-testid="documents-page"]')
  
  // Click create button
  await page.click('[data-testid="create-document-button"]')
  
  // Fill in form
  await page.fill('[data-testid="document-title-input"]', 'Test Document')
  await page.fill('[data-testid="document-content-input"]', 'Test Content')
  
  // Submit
  await page.click('[data-testid="save-document-button"]')
  
  // Wait for success
  await page.waitForSelector('[data-testid="document-item"]')
  
  // Assert
  await expect(page.locator('[data-testid="document-item"]')).toContainText('Test Document')
})
```

### 1.5 Verification Steps

```bash
# 1. Verify routes are registered
curl http://localhost:8080/api/documents

# 2. Verify frontend loads
curl http://localhost:5173

# 3. Run documents E2E test
npm run test:e2e tests/e2e/documents.spec.js

# 4. Check test results
cat playwright-report/index.html | grep -o 'passed.*failed.*'

# 5. Verify manual workflow
# Open browser to http://localhost:5173
# Navigate to Documents
# Create a document
# Verify it appears
```

---

## Phase 2: E2E Test Failures - Logging System

### 2.1 Issue Analysis

**Symptom:** All logging E2E tests failing (100% rate)
- ❌ Should log user login event
- ❌ Should log note creation
- ❌ Should handle API errors gracefully
- ❌ Should persist logs on network failure
- ❌ Should generate unique request IDs
- ❌ Should log logout events
- ❌ Should export logs as CSV
- ❌ Should provide log statistics

**Impact:** Logging system non-functional in E2E tests

### 2.2 Investigation Steps

#### Step 1: Verify Logger API Endpoints
```bash
# Check for logging routes in server
cd glassy-dash/GLASSYDASH
grep -n "logging" server/index.js

# Check for logger route file
ls -la server/routes/ | grep -i log

# Test logger endpoint directly
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/logs

# Test CSV export
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/logs/export
```

**Expected Results:**
- `/api/logs` endpoint exists and returns log entries
- `/api/logs/export` returns CSV data
- Response includes proper authentication check

**Possible Issues:**
- Endpoints don't exist
- CORS blocking requests
- Authentication middleware not applied

#### Step 2: Verify Frontend Logger Integration
```bash
# Find logger components/utilities
cd glassy-dash/GLASSYDASH
find src -name "*og*" -type f

# Check for logger context/provider
grep -r "Logger" src/ --include="*.jsx" --include="*.js"

# Check for logger usage in components
grep -r "logEvent\|logError" src/components/
```

**Expected Results:**
- Logger utility/context exists in `src/utils/logger.js` or `src/contexts/LoggerContext.jsx`
- Components import and use logger
- Logger sends data to `/api/logs` endpoint

**Possible Issues:**
- Logger not imported
- Logger not calling API
- API endpoint mismatch

#### Step 3: Review Logger E2E Test
```bash
# Examine logging E2E test
cd glassy-dash/GLASSYDASH
cat tests/e2e/logging.e2e.test.js

# Key checks:
# 1. Test setup (authentication)
# 2. Logger initialization
# 3. API call verification
# 4. Assertion logic
```

#### Step 4: Check CORS Configuration
```bash
# Verify CORS in server
cd glassy-dash/GLASSYDASH
grep -A 5 -B 5 "cors" server/index.js

# Test CORS preflight
curl -X OPTIONS \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:8080/api/logs \
  -v
```

**Expected Results:**
- CORS headers present in response
- Allowed origins include development server
- OPTIONS request returns 200

**Possible Issues:**
- CORS not configured
- Origins not whitelisted
- Headers not set correctly

#### Step 5: Test Logger API Manually
```bash
# In terminal: Start server
cd glassy-dash/GLASSYDASH
node server/index.js

# Get auth token
TOKEN=$(curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Test log endpoint
curl -X POST http://localhost:8080/api/logs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"test","level":"info","context":{"test":"value"}}'

# Test export endpoint
curl -X GET http://localhost:8080/api/logs/export \
  -H "Authorization: Bearer $TOKEN" \
  -o logs.csv

cat logs.csv
```

### 2.3 Root Cause Analysis Matrix

| Symptom | Possible Cause | Investigation Check |
|----------|---------------|---------------------|
| 401 on log endpoint | Auth middleware not applied | Check endpoint route registration |
| CORS error | CORS not configured | Verify cors() middleware |
| Network error | Endpoint doesn't exist | Check route file and mounting |
| Timeout waiting | API not responding | Check server logs for requests |
| Empty response | Logic error in endpoint | Review endpoint code |

### 2.4 Resolution Strategies

#### Strategy A: Missing Logger Endpoints
**If endpoints don't exist:**
```javascript
// Create server/routes/logging.js
const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')

// Store logs in memory (or database)
const logs = []

// POST /api/logs - Log an event
router.post('/', auth, async (req, res) => {
  const { action, level, context, error } = req.body
  
  const logEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    user_id: req.user.id,
    action: action || 'unknown',
    level: level || 'info',
    context: context || {},
    error: error || null,
    request_id: req.headers['x-request-id'] || 'unknown'
  }
  
  logs.push(logEntry)
  
  // In production, store in database
  // await db.prepare('INSERT INTO logs (...) VALUES (...)').run(...)
  
  res.json({ ok: true, id: logEntry.id })
})

// GET /api/logs - Get logs
router.get('/', auth, async (req, res) => {
  const userLogs = logs.filter(l => l.user_id === req.user.id)
  res.json(userLogs)
})

// GET /api/logs/export - Export as CSV
router.get('/export', auth, async (req, res) => {
  const userLogs = logs.filter(l => l.user_id === req.user.id)
  
  // Convert to CSV
  const headers = ['id', 'timestamp', 'user_id', 'action', 'level', 'context', 'error']
  const csv = [
    headers.join(','),
    ...userLogs.map(log => 
      headers.map(h => 
        JSON.stringify(log[h] || '')
      ).join(',')
    )
  ].join('\n')
  
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=logs.csv')
  res.send(csv)
})

module.exports = router

// Mount in server/index.js
const loggingRoutes = require('./routes/logging')
app.use('/api/logs', loggingRoutes)
console.log('✓ Logging routes mounted at /api/logs')
```

#### Strategy B: CORS Configuration
**If CORS is blocking requests:**
```javascript
// Update server/index.js
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}

app.use(cors(corsOptions))
console.log('✓ CORS configured')
```

#### Strategy C: Frontend Logger Integration
**If logger not integrated:**
```javascript
// Create src/contexts/LoggerContext.jsx
import { createContext, useContext } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'

const LoggerContext = createContext()

export function LoggerProvider({ children }) {
  const { token } = useAuth()

  const logEvent = async (action, level = 'info', context = {}) => {
    try {
      await api('/logs', {
        method: 'POST',
        token,
        body: {
          action,
          level,
          context
        }
      })
    } catch (e) {
      console.error('[Logger] Failed to send log:', e)
      // Store locally for retry
      const failedLogs = JSON.parse(localStorage.getItem('failedLogs') || '[]')
      failedLogs.push({ action, level, context, timestamp: Date.now() })
      localStorage.setItem('failedLogs', JSON.stringify(failedLogs))
    }
  }

  const value = { logEvent }
  return (
    <LoggerContext.Provider value={value}>
      {children}
    </LoggerContext.Provider>
  )
}

export function useLogger() {
  const context = useContext(LoggerContext)
  if (!context) {
    throw new Error('useLogger must be used within LoggerProvider')
  }
  return context
}

// Wrap app in main.jsx
import { LoggerProvider } from './contexts/LoggerContext'

<LoggerProvider>
  <App />
</LoggerProvider>
```

---

## Phase 3: E2E Test Failures - Authentication Flow

### 3.1 Issue Analysis

**Symptom:** Critical user flow test failing (100% rate)
- ❌ Complete Authentication and Note Lifecycle

**Impact:** New users cannot sign up/login

### 3.2 Investigation Steps

#### Step 1: Review Authentication E2E Test
```bash
# Examine auth flow test
cd glassy-dash/GLASSYDASH
cat tests/e2e/critical_flows.spec.js

# Key checks:
# 1. Navigation flow
# 2. Form filling logic
# 3. Submit action
# 4. Verification of login
# 5. Note creation after login
```

#### Step 2: Test Authentication Flow Manually
```bash
# 1. Start development server
cd glassy-dash/GLASSYDASH
npm run dev

# 2. Open browser to http://localhost:5173
# 3. Open browser DevTools (F12)
# 4. Go to Console tab
# 5. Attempt to:
#    - Sign up with new account
#    - Login with existing account
# 6. Watch for:
#    - Console errors
#    - Network failures
#    - Redirect issues
```

#### Step 3: Verify Auth Endpoints
```bash
# Test login endpoint
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"admin"}'

# Expected response:
# {"token":"...","user":{...}}

# Test register endpoint
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Expected response:
# {"token":"...","user":{...}}
```

#### Step 4: Check Auth Token Handling
```bash
# In browser DevTools after login:
# 1. Go to Application tab
# 2. Check localStorage
# 3. Look for token key
# 4. Verify token is stored

# In browser Console:
console.log(localStorage.getItem('token'))

# Expected: JWT token string
```

### 3.3 Root Cause Analysis Matrix

| Symptom | Possible Cause | Investigation Check |
|----------|---------------|---------------------|
| Form not submitting | Event handler not bound | Check form submit handler |
| Token not stored | localStorage error | Check browser console |
| Login doesn't persist | Token not sent in headers | Check API requests in DevTools |
| Redirect loop | Auth context issue | Check AuthContext implementation |
| Timeout waiting | Server not responding | Check server logs |

### 3.4 Resolution Strategies

#### Strategy A: Timing Issues
**If tests are timing out:**
```javascript
// Add explicit waits in E2E tests
import { test, expect } from '@playwright/test'

test('Complete Authentication and Note Lifecycle', async ({ page }) => {
  await page.goto('http://localhost:5173')
  
  // Wait for page to fully load
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000) // Extra wait
  
  // Wait for login form
  await page.waitForSelector('[data-testid="login-form"]', { timeout: 10000 })
  
  // Fill form
  await page.fill('[data-testid="email-input"]', 'admin')
  await page.fill('[data-testid="password-input"]', 'admin')
  
  // Submit
  await page.click('[data-testid="login-button"]')
  
  // Wait for navigation
  await page.waitForURL(/\/dashboard|\/notes/, { timeout: 10000 })
  
  // Wait for dashboard
  await page.waitForSelector('[data-testid="notes-container"]', { timeout: 10000 })
  
  // Now proceed with note creation
  await page.click('[data-testid="create-note-button"]')
  // ... rest of test
})
```

#### Strategy B: Element Selector Issues
**If selectors are wrong:**
```javascript
// Update to use data-testid attributes
// In components, add data-testid:
<input
  type="email"
  data-testid="email-input"
  className="..."
/>
<button
  type="submit"
  data-testid="login-button"
  className="..."
>
  Login
</button>

// Update E2E tests to use:
await page.fill('[data-testid="email-input"]', 'admin')
await page.click('[data-testid="login-button"]')
```

---

## Phase 4: Large Bundle Size

### 4.1 Issue Analysis

**Symptom:** JavaScript bundle is 2.7MB (714KB gzipped)
**Impact:** Slow initial load, poor mobile performance

### 4.2 Investigation Steps

#### Step 1: Analyze Bundle Composition
```bash
# Install bundle analyzer
cd glassy-dash/GLASSYDASH
npm install --save-dev rollup-plugin-visualizer

# Update vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true
    })
  ]
})

# Build with analysis
npm run build

# Open stats.html in browser
# Identify largest modules
```

#### Step 2: Identify Code Splitting Opportunities
```bash
# Find heavy imports in main.jsx
cd glassy-dash/GLASSYDASH
cat src/main.jsx | grep "^import"

# Check for:
# - Large libraries imported directly
# - Components not lazy-loaded
# - Vendor code not separated
```

### 4.3 Resolution Strategies

#### Strategy A: Implement Code Splitting
```javascript
// Update vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React and ReactDOM
          'react-vendor': ['react', 'react-dom', 'react-dom/client'],
          
          // State management
          'state': ['zustand'],
          
          // UI libraries
          'ui': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
            'framer-motion',
            'lucide-react'
          ],
          
          // Editor libraries
          'editor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-underline',
            '@tiptap/extension-bubble-menu'
          ],
          
          // Data fetching
          'data': ['@tanstack/react-query'],
          
          // Utilities
          'utils': ['marked', 'dompurify', 'fuse.js']
        }
      },
      chunkSizeWarningLimit: 500
    },
    chunkSizeWarningLimit: 500
  }
})
```

#### Strategy B: Implement Lazy Loading
```javascript
// Update App.jsx to lazy load routes
import { lazy, Suspense } from 'react'

// Lazy load components
const NotesView = lazy(() => import('./components/NotesView'))
const VoiceStudio = lazy(() => import('./components/voice/VoiceStudio'))
const Archive = lazy(() => import('./components/Archive'))
const Settings = lazy(() => import('./components/SettingsPanel'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<NotesView />} />
        <Route path="/voice" element={<VoiceStudio />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  )
}
```

#### Strategy C: Tree Shake Unused Code
```javascript
// In package.json, add sideEffects: false
{
  "name": "glassy-dash",
  "sideEffects": false,
  "dependencies": { ... }
}

// Ensure all exports are explicit
// Instead of:
export * from './utils'

// Use:
export { util1, util2, util3 } from './utils'
```

---

## Phase 5: Voice Studio Accessibility Issues

### 5.1 Issue Analysis

**Symptom:** Multiple accessibility test failures (40% rate)
- ❌ Keyboard navigation (Space to start recording)
- ❌ Keyboard shortcuts (undo/redo)
- ❌ ARIA labels
- ❌ Screen reader announcements
- ❌ Form labels
- ❌ Semantic HTML
- ❌ Touch targets

**Impact:** Poor experience for screen reader users

### 5.2 Investigation Steps

#### Step 1: Run Accessibility Audit
```bash
# Install axe-core and axe-playwright
cd glassy-dash/GLASSYDASH
npm install --save-dev @axe-core/playwright

# Run accessibility tests
npm run test:e2e tests/e2e/voice-studio-a11y.test.js

# Review detailed accessibility report
cat playwright-report/index.html
```

#### Step 2: Test with Screen Reader
```bash
# Install NVDA (Windows) or VoiceOver (Mac)
# Or use ChromeVox extension

# Steps:
# 1. Start app: npm run dev
# 2. Open http://localhost:5173/voice
# 3. Enable screen reader
# 4. Try to:
#    - Navigate to recording button
#    - Start/stop recording
#    - Read transcript
#    - Use keyboard shortcuts
# 5. Note any issues
```

### 5.3 Resolution Strategies

#### Strategy A: Add ARIA Labels
```jsx
// Update Voice Studio components to include ARIA labels
<button
  onClick={startRecording}
  aria-label="Start recording"
  aria-pressed={isRecording}
  data-testid="start-recording-button"
>
  <MicIcon />
</button>

<div
  role="region"
  aria-label="Recording controls"
>
  <button onClick={undo} aria-label="Undo last action">
    <UndoIcon />
  </button>
  <button onClick={redo} aria-label="Redo last action">
    <RedoIcon />
  </button>
</div>

<input
  type="text"
  id="transcript-input"
  aria-label="Transcript"
  aria-describedby="transcript-help"
/>
<p id="transcript-help" className="sr-only">
  Edit the transcription text here
</p>
```

#### Strategy B: Implement Keyboard Navigation
```jsx
// Update Voice Studio to handle keyboard events
useEffect(() => {
  const handleKeyDown = (e) => {
    // Space to toggle recording
    if (e.code === 'Space' && !e.target.matches('input, textarea')) {
      e.preventDefault()
      isRecording ? stopRecording() : startRecording()
    }
    
    // Escape to stop recording
    if (e.code === 'Escape') {
      if (isRecording) {
        e.preventDefault()
        stopRecording()
      }
    }
    
    // Undo/Redo shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.code === 'KeyZ' && e.shiftKey) || e.code === 'KeyY') {
        e.preventDefault()
        redo()
      }
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [isRecording, startRecording, stopRecording, undo, redo])
```

#### Strategy C: Add Live Announcements
```jsx
// Add live region for screen reader announcements
function VoiceStudio() {
  const [announcement, setAnnouncement] = useState('')
  
  useEffect(() => {
    if (isRecording) {
      setAnnouncement('Recording started')
    } else if (recordingError) {
      setAnnouncement(`Recording error: ${recordingError}`)
    } else if (transcript) {
      setAnnouncement('Transcription completed')
    }
  }, [isRecording, recordingError, transcript])
  
  return (
    <div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      {/* Voice studio UI */}
    </div>
  )
}
```

---

## Phase 6: Schema Validation Disabled

### 6.1 Issue Analysis

**Symptom:** Database schema validation function exists but is commented out
**Location:** `server/index.js`, line ~157
**Impact:** Schema errors not caught on startup

### 6.2 Resolution Strategy

```javascript
// Update server/index.js
// Find this (around line 157):
// await validateDatabaseSchema()

// Change to:
await validateDatabaseSchema()

// If validation fails, fix schema errors:
// 1. Check required columns for notes table
// 2. Check required columns for users table
// 3. Run migrations if needed
```

---

## Execution Timeline

### Week 1 (Critical Issues)
- **Days 1-2:** Investigate Documents feature (Phase 1)
- **Days 3-4:** Investigate Logging system (Phase 2)
- **Days 5-7:** Investigate Authentication flow (Phase 3)

### Week 2 (High Priority Issues)
- **Days 8-9:** Implement bundle splitting (Phase 4)
- **Days 10-11:** Fix accessibility issues (Phase 5)
- **Days 12-13:** Re-enable schema validation (Phase 6)
- **Days 14:** Integration testing and bug fixes

### Week 3 (Testing & Validation)
- **Days 15-17:** Run full E2E test suite
- **Days 18-19:** Manual testing of all flows
- **Days 20-21:** Performance testing
- **Day 21:** Final review and deployment decision

---

## Success Criteria

### Phase 1: Documents Feature
- [ ] Documents API endpoints exist and work
- [ ] Frontend documents component renders
- [ ] E2E tests pass (2/2)
- [ ] Manual workflow verified

### Phase 2: Logging System
- [ ] Logging API endpoints exist and work
- [ ] Frontend logger integration complete
- [ ] E2E tests pass (8/8)
- [ ] CORS configured correctly

### Phase 3: Authentication Flow
- [ ] Login/register endpoints work
- [ ] Token storage works
- [ ] E2E test passes (1/1)
- [ ] Manual signup/login verified

### Phase 4: Bundle Size
- [ ] Bundle analyzer shows composition
- [ ] Code splitting implemented
- [ ] Lazy loading implemented
- [ ] Bundle size <1MB (gzipped)

### Phase 5: Accessibility
- [ ] ARIA labels added to all interactive elements
- [ ] Keyboard navigation works
- [ ] Screen reader announcements implemented
- [ ] E2E accessibility tests pass (90%+)

### Phase 6: Schema Validation
- [ ] Validation function enabled
- [ ] Startup validation works
- [ ] No schema errors on startup

---

## Monitoring & Progress Tracking

### Daily Check-ins
- Update this document with progress
- Note blockers and dependencies
- Track time spent on each phase

### Weekly Reviews
- Review E2E test results
- Update timeline if needed
- Re-prioritize based on new findings

### Final Review
- All E2E tests passing
- Bundle size reduced
- Accessibility compliant
- Performance benchmarks met
- Security review passed

---

## Resources

### Development Tools
- Playwright Inspector: `npm run test:e2e:debug`
- Bundle Analyzer: `npm install --save-dev rollup-plugin-visualizer`
- Accessibility Testing: axe DevTools, NVDA, VoiceOver

### Documentation
- Playwright Documentation: https://playwright.dev
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Vite Build Optimization: https://vitejs.dev/guide/build

### Commands Reference
```bash
# Run specific E2E test
npm run test:e2e tests/e2e/documents.spec.js

# Run with debugging
npm run test:e2e:debug tests/e2e/documents.spec.js

# Run with UI
npm run test:e2e:ui

# Build with analysis
npm run build

# View bundle stats
open dist/stats.html

# Start development server
npm run dev

# Start API server
node server/index.js

# View server logs
tail -f debug_auth.log
```

---

**Document Version:** 1.0  
**Last Updated:** January 29, 2026  
**Next Review:** After Phase 1 completion