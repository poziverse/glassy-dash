# Phase 2: Logging System Investigation Notes
**Date:** January 29, 2026  
**Status:** 🔴 CRITICAL ISSUE FOUND

---

## Summary

The logging E2E tests are failing because the **logging module is not mounted** in the server, even though the implementation exists.

## Findings

### 1. Logger Implementation Exists ✅

**File:** `src/utils/logger.js`  
**Status:** Fully implemented with:
- Structured logging (error, warn, info, debug)
- Request ID tracking
- Session duration tracking
- Token-based authentication
- Pending log retry mechanism
- Automatic cleanup on unmount
- Export to `/api/logs` endpoint

**Features:**
- Centralized error/event tracking
- Persistence with retry logic
- Client-side localStorage for offline scenarios
- Automatic retry every 30 seconds
- Keeps last 100 pending logs

### 2. Server Logging Module Exists ✅

**File:** `server/logging-module.js`  
**Status:** Fully implemented with endpoints:

| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/logs` | POST | Receive log entries from client |
| `/api/logs` | GET | Retrieve logs for user |
| `/api/logs/stats` | GET | Get log statistics |
| `/api/logs/export` | POST | Export logs as CSV |

**Features:**
- Database storage (logs table)
- User-specific log filtering
- Date range queries
- Log level aggregation
- CSV export functionality
- Statistics API (levels, total entries, top actions, error details)

### 3. Module NOT Mounted in Server 🔴 CRITICAL

**File:** `server/index.js`  
**Issue:** Logging module is never imported or mounted!

**Evidence:**
```javascript
// server/index.js - NO logging module import
// Other modules ARE imported:
const monitoringRoutes = require('./routes/monitoring')
const youtubeRoutes = require('./routes/youtube')
const musicRoutes = require('./routes/music')
const iconRoutes = require('./routes/icons')
const bugReportRoutes = require('./routes/bug_reports')
const aiRoutes = require('./routes/ai')

// But NO: const loggingRoutes = require('./logging-module')
```

**Impact:**
- `/api/logs` endpoints return 404
- E2E tests fail because endpoints don't exist
- Client logger can't send logs to server
- No server-side log storage
- No log statistics available
- No CSV export functionality

### 4. E2E Test Expectations

**File:** `tests/e2e/logging.e2e.test.js`  
**Tests:**
1. ✅ should log user login event - Expects `/api/logs` GET
2. ✅ should log note creation - Expects `/api/logs` GET
3. ✅ should handle API errors gracefully - Tests error handling
4. ✅ should persist logs on network failure - Tests localStorage
5. ✅ should generate unique request IDs - Validates logger
6. ✅ should log logout events - Expects `/api/logs` GET
7. ✅ should export logs as CSV - Expects `/api/logs/export` POST
8. ✅ should provide log statistics - Expects `/api/logs/stats` GET

**All tests fail because endpoints return 404.**

### 5. console.log Analysis

**Search Results:** Found 27 `console.log` statements in source code

**Files with console.log:**
- `src/utils/audioStorage.js` (6 instances)
  - IndexedDB operations (success notifications)
  - Status: ✅ Appropriate - low-level storage debugging
  
- `src/utils/gemini.js` (7 instances)
  - AI provider request/response logging
  - Status: ✅ Appropriate - debugging AI integration
  
- `src/hooks/useAdmin.js` (4 instances)
  - Admin panel loading states
  - Status: ⚠️ Should use logger in production
  
- `src/hooks/useCollaboration.js` (4 instances)
  - SSE connection status
  - Status: ⚠️ Should use logger for production
  
- `src/hooks/mutations/useNoteMutations.js` (1 instance)
  - Retry logic
  - Status: ⚠️ Should use logger for production
  
- `src/contexts/AuthContext.jsx` (1 instance)
  - Auth expiration
  - Status: ⚠️ Should use logger for production
  
- `src/lib/api.js` (1 instance)
  - API error handling
  - Status: ⚠️ Should use logger for production
  
- `src/stores/voiceStore.js` (3 instances)
  - Audio storage operations
  - Status: ⚠️ Should use logger for production
  
- `src/stores/settingsStore.js` (1 instance)
  - Theme changes
  - Status: ⚠️ Should use logger for production

**Assessment:**
- ✅ Low-level debugging (audioStorage.js, gemini.js) - keep as console.log
- ⚠️ Application-level logging (hooks, stores, contexts) - should use logger

**Priority:**
1. **CRITICAL:** Mount logging module in server
2. **HIGH:** Replace app-level console.log with logger
3. **LOW:** Keep low-level console.log for debugging

---

## Root Cause

The logging E2E test failures are caused by:
1. **Logging module exists but is not mounted** in `server/index.js`
2. `/api/logs` endpoints return 404
3. Client logger cannot send logs to server
4. Tests expect endpoints that don't exist

**This is NOT a test bug - it's a missing server integration.**

---

## Required Actions

### 1. Mount Logging Module (CRITICAL)

**File:** `server/index.js`  
**Add after line 107 (after AI routes):**

```javascript
// ---------- Logging ----------
try {
  const loggingModule = require('./logging-module')
  loggingModule(app, db)  // Pass db for log storage
  console.log('✓ Logging routes mounted at /api/logs')
} catch (err) {
  console.error('Failed to load Logging routes:', err)
}
```

**Note:** Check if `logging-module.js` exports a function or if it needs `app` passed.

### 2. Create Logs Table (if not exists)

The logging module likely expects a `logs` table. Need to verify table schema:

```sql
CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  level TEXT NOT NULL,
  action TEXT NOT NULL,
  context TEXT,
  error_message TEXT,
  error_stack TEXT,
  timestamp TEXT NOT NULL,
  request_id TEXT,
  session_duration INTEGER,
  url TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. Replace Application-Level console.log (HIGH)

Files to update:
- `src/hooks/useAdmin.js` - 4 instances
- `src/hooks/useCollaboration.js` - 4 instances
- `src/hooks/mutations/useNoteMutations.js` - 1 instance
- `src/contexts/AuthContext.jsx` - 1 instance
- `src/lib/api.js` - 1 instance
- `src/stores/voiceStore.js` - 3 instances
- `src/stores/settingsStore.js` - 1 instance

**Example replacement:**

```javascript
// Before
console.log('Loading admin settings...');

// After
const logger = useLogger();
logger.info('admin_settings_load');
```

### 4. Test Logging Integration (HIGH)

After mounting module:
1. Start server
2. Run logging E2E tests
3. Verify `/api/logs` endpoints work
4. Check logs are stored in database
5. Test pending log retry mechanism

---

## Implementation Plan

### Step 1: Mount Logging Module
1. Read `server/logging-module.js` to understand export structure
2. Add import and mount to `server/index.js`
3. Verify table schema is created
4. Start server and test endpoints

### Step 2: Replace console.log in High-Impact Areas
1. Update AuthContext.jsx (auth expiration)
2. Update useCollaboration.js (SSE status)
3. Update useNoteMutations.js (retry logic)
4. Test logging works in production

### Step 3: Replace console.log in Medium-Impact Areas
1. Update useAdmin.js (admin panel)
2. Update voiceStore.js (audio operations)
3. Update settingsStore.js (theme changes)
4. Test logging works in production

### Step 4: Run E2E Tests
1. Run all logging E2E tests
2. Verify 8/8 tests pass
3. Check log statistics endpoint
4. Test CSV export functionality

---

## Estimated Effort

- **Mount logging module:** 15 minutes
- **Replace high-impact console.log:** 30 minutes
- **Replace medium-impact console.log:** 30 minutes
- **Test and verify:** 30 minutes

**Total:** ~2 hours

---

## Testing Strategy

### Unit Tests
- Test logger utility functions
- Test log entry creation
- Test pending log retry logic

### Integration Tests
- Test `/api/logs` POST endpoint
- Test `/api/logs` GET endpoint
- Test `/api/logs/stats` GET endpoint
- Test `/api/logs/export` POST endpoint

### E2E Tests
- Run all 8 logging E2E tests
- Verify logs are stored in database
- Test offline scenario (pending logs)
- Test retry mechanism

---

## Conclusion

**Phase 2 Status:** 🔴 CRITICAL ISSUE FOUND

**Key Finding:** Logging module is fully implemented but not mounted in server

**Impact:**
- E2E tests fail (8/8)
- No server-side log storage
- No log statistics available
- No CSV export functionality

**Resolution Required:** Mount logging module in server/index.js and replace console.log statements

**Next Phase:** Phase 3 - Investigate Authentication flow

---

**Signed:** Code Review AI Agent  
**Date:** January 29, 2026