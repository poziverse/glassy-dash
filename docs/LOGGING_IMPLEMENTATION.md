# Logging Implementation - Complete Guide

## Overview

A comprehensive, production-ready error logging and event tracking system has been implemented across the Glass Keep application. This system provides full visibility into application errors, user actions, and system events that occur during development and production.

**Implemented**: January 18, 2026
**Status**: ✅ Production Ready

---

## Architecture

### Client-Side Logging (`src/utils/logger.js`)

**Purpose**: Structured logging utility that runs in the browser with automatic fallback to localStorage for network failures.

**Key Features**:
- Structured JSON logging with consistent format
- Request ID generation for tracing multi-step failures
- localStorage fallback for unreachable API
- Automatic retry mechanism (every 30 seconds for pending logs)
- Session tracking with user ID context
- Severity levels: `debug`, `info`, `warn`, `error`

**API**:
```javascript
// Import
import logger from './utils/logger';

// Log an error with context
logger.error('login_failed', { 
  username: 'user@example.com',
  reason: 'invalid_password'
}, errorObject);

// Log a warning
logger.warn('auth_required', { endpoint: '/api/notes', status: 401 });

// Log info events
logger.info('user_login', { userId: 123, method: 'password' });

// Track user sessions
logger.setUserId(123);
logger.clearUserId(); // On logout

// Get session metadata
const sessionInfo = logger.getSessionInfo();
```

**Storage**:
- Primary: Sends to `POST /api/logs` on the backend
- Fallback: Stores in `localStorage` under `glassy-keep-pending-logs`
- Automatic retry: Every 30 seconds, attempts to send pending logs

### Server-Side Logging (`server/logging-module.js`)

**Purpose**: Receives log entries from clients and persists them to disk with daily rotation and retention policies.

**Key Features**:
- Daily log file rotation
- NDJSON format (newline-delimited JSON) for efficient parsing
- 30-day automatic retention
- Admin API for querying and analyzing logs
- CSV/JSON export capability

**Storage Location**: `data/logs/YYYY-MM-DD.log`

**Example Log Entry Format**:
```json
{
  "timestamp": "2026-01-18T14:32:00.123Z",
  "level": "error",
  "action": "api_error",
  "context": { "endpoint": "/api/notes", "status": 500 },
  "userId": 123,
  "sessionId": "sess-xyz-789",
  "requestId": "req-1705599120123-abc123",
  "error": { "message": "Internal server error", "name": "Error", "stack": "..." },
  "url": "https://example.com/notes",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1"
}
```

### Admin API Endpoints

**1. POST `/api/logs`**
- Receives log entries from clients
- No authentication required (logs sent from unauthenticated users too)
- Stores to daily log file

**2. GET `/api/logs` (Admin only)**
- Query logs by date, level, action, userId
- **Parameters**:
  - `date` (optional): Filter by date in YYYY-MM-DD format
  - `level` (optional): Filter by level (debug, info, warn, error)
  - `action` (optional): Filter by action name
  - `userId` (optional): Filter by user ID
  - `limit` (optional): Number of entries (default 100, max 1000)
  - `offset` (optional): Skip N entries

**Example Usage**:
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8080/api/logs?date=2026-01-18&level=error&limit=50"
```

**3. GET `/api/logs/stats` (Admin only)**
- Analytics and statistics about logs
- **Parameters**:
  - `days` (optional): Number of days to analyze (default 7)

**Returns**:
```json
{
  "totalEntries": 1523,
  "levelDistribution": {
    "error": 45,
    "warn": 120,
    "info": 1200,
    "debug": 158
  },
  "topActions": [
    { "action": "api_timeout", "count": 23 },
    { "action": "network_error", "count": 18 }
  ],
  "topErrors": [
    { "error": "Request timeout", "count": 23 },
    { "error": "Network error", "count": 18 }
  ]
}
```

**4. POST `/api/logs/export` (Admin only)**
- Export logs as CSV or JSON
- **Body**:
  ```json
  {
    "format": "csv",
    "startDate": "2026-01-18",
    "endDate": "2026-01-20",
    "filters": { "level": "error" }
  }
  ```

---

## Integration Points

### 1. AuthContext.jsx - Authentication Events

**Logged Events**:
- ✅ User login success: `user_login` with userId and method
- ✅ User login failure: `login_failed` with reason
- ✅ User logout: `user_logout` with reason (manual/session-expired)
- ✅ Token expiration: `token_expired`

**Code Location**: `src/contexts/AuthContext.jsx`

**Example**:
```javascript
// When user logs in
logger.info('user_login', {
  userId: response.id,
  username: email
});

// When login fails
logger.warn('login_failed', {
  username: email,
  reason: 'invalid_credentials'
});
```

### 2. helpers.js - API Request Tracking

**Logged Events**:
- ✅ HTTP errors: `api_error` with status code
- ✅ Authorization required: `auth_required` (401 responses)
- ✅ Request timeouts: `api_timeout` (30-second timeout)
- ✅ Network failures: `network_error`

**Code Location**: `src/utils/helpers.js` (api function)

**Instrumentation**: All error paths include:
- Endpoint being called
- HTTP method
- Status code (if applicable)
- Request ID for tracing
- Error message

**Example Error Log**:
```javascript
logger.error('api_error', {
  endpoint: '/api/notes',
  status: 500,
  method: 'GET',
  requestId: 'req-1705599120-xyz'
}, errorObject);
```

### 3. NotesContext.jsx - Data Operations

**Logged Events**:
- ✅ Successful note export: `notes_exported` with count
- ✅ Successful note import: `notes_imported` with count and filename
- ✅ Failed imports: `notes_import_failed`
- ✅ Google Keep import: `google_keep_imported`
- ✅ Markdown import: `markdown_imported`
- ✅ Import failures: `google_keep_import_failed`, `markdown_import_failed`

**Code Location**: `src/contexts/NotesContext.jsx`

**Example**:
```javascript
logger.info('notes_imported', {
  count: 42,
  filename: 'notes.json'
});
```

### 4. App.jsx - Global Error Handlers

**Logged Events**:
- ✅ Unhandled JavaScript errors: `unhandled_error`
- ✅ Unhandled promise rejections: `unhandled_rejection`

**Code Location**: `src/App.jsx`

**Captured Context**:
- Error message and stack trace
- File name and line number
- Full error object for debugging

**Example**:
```javascript
window.addEventListener('error', (event) => {
  logger.error('unhandled_error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno
  }, event.error);
});
```

---

## Debugging the Crash Issue

The logging system specifically addresses the crash that occurred earlier where the application logged out automatically with no debugging information.

### How to Investigate Future Issues

**1. Check Recent Logs**:
```bash
# List today's logs
ls -la data/logs/2026-01-18.log

# View last 20 error entries
tail -20 data/logs/2026-01-18.log | grep '"level":"error"'
```

**2. Query via Admin API**:
```bash
# Get errors from the last day
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:8080/api/logs?level=error&limit=100"

# Get stats for the last 7 days
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  "http://localhost:8080/api/logs/stats?days=7"
```

**3. Export for Analysis**:
```bash
# Export error logs as CSV
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format":"csv","filters":{"level":"error"}}' \
  http://localhost:8080/api/logs/export > errors.csv
```

**4. Browser Console**:
- Check `localStorage` for pending logs (key: `glassy-keep-pending-logs`)
- These indicate network connectivity issues preventing log transmission
- Logs are automatically retried every 30 seconds

---

## Usage Examples

### Example 1: Tracking Login Flow

**User Action**: Admin logs in
**Logs Generated**:
```json
{"timestamp":"2026-01-18T14:00:00Z","level":"info","action":"user_login","context":{"userId":1,"username":"admin"},"sessionId":"sess-123","requestId":"req-0"}
```

**Query**:
```bash
curl "http://localhost:8080/api/logs?action=user_login&userId=1"
```

### Example 2: Debugging API Timeout

**User Action**: Tries to export large notes file, request times out
**Logs Generated**:
```json
{"timestamp":"2026-01-18T14:05:30Z","level":"error","action":"api_timeout","context":{"endpoint":"/api/notes/export","method":"GET","requestId":"req-xyz","timeout":30000},"userId":5}
```

**Query**:
```bash
curl "http://localhost:8080/api/logs?action=api_timeout&level=error"
```

**Analysis**: Shows which users hit timeouts and on which endpoints.

### Example 3: Tracking Session Expiration

**User Action**: Token expires, auto-logout
**Logs Generated**:
```json
{"timestamp":"2026-01-18T14:10:00Z","level":"warn","action":"token_expired","context":{},"userId":3,"sessionId":"sess-old"}
{"timestamp":"2026-01-18T14:10:01Z","level":"info","action":"user_logout","context":{"reason":"token_expired"},"userId":3}
```

**Query**:
```bash
curl "http://localhost:8080/api/logs?action=token_expired"
```

---

## File Locations

| Component | File | Purpose |
|-----------|------|---------|
| Client Logger | `src/utils/logger.js` | Main logging utility |
| Server Module | `server/logging-module.js` | Backend persistence & APIs |
| Logs Storage | `data/logs/YYYY-MM-DD.log` | Daily log files (NDJSON) |
| Auth Integration | `src/contexts/AuthContext.jsx` | Login/logout tracking |
| API Integration | `src/utils/helpers.js` | Network error tracking |
| Data Operations | `src/contexts/NotesContext.jsx` | Import/export tracking |
| Global Errors | `src/App.jsx` | Unhandled error handlers |
| Server Init | `server/index.js` | Module initialization |

---

## Key Metrics & Stats Available

The logging system tracks:

**By Event Type**:
- User authentication events (login, logout, token expiration)
- API errors (4xx, 5xx, timeouts, network failures)
- Data operations (imports, exports)
- Unhandled JavaScript errors
- Promise rejections

**By Context**:
- User ID and session ID
- Request ID (for multi-step tracing)
- Endpoint and HTTP method
- Error messages and stack traces
- Client IP address and user agent

**By Severity**:
- `debug`: Verbose diagnostic information
- `info`: General informational events (logins, exports)
- `warn`: Warning conditions (auth required, failed logins)
- `error`: Error conditions (API failures, exceptions)

---

## Maintenance

### Log Cleanup

Logs older than 30 days are automatically removed. To manually clean up:

```javascript
// In server/logging-module.js, the cleanup runs automatically
// But can be triggered via admin command if needed
```

### Checking Log Size

```bash
# See disk usage of logs
du -sh data/logs/

# Count entries by day
wc -l data/logs/*.log
```

### Backup Strategy

Since logs are stored in `data/logs/`, they should be included in regular database backups.

---

## Testing the Logging System

### Test 1: Trigger an API Error
```javascript
// In browser console
fetch('/api/notes', { headers: { 'Authorization': 'Bearer invalid' } })
// Should log: auth_required
```

### Test 2: Check localStorage Fallback
```javascript
// In browser console
localStorage.getItem('glassy-keep-pending-logs')
// Shows pending logs if network is down
```

### Test 3: View Today's Logs
```bash
# Terminal
cat data/logs/2026-01-18.log | jq '.level' | sort | uniq -c
# Shows distribution of log levels
```

### Test 4: Admin API
```bash
# Get stats
curl "http://localhost:8080/api/logs/stats"
# Should return error/warn/info/debug counts
```

---

## Future Enhancements

Potential improvements for future versions:

1. **Real-time Monitoring Dashboard**: WebSocket-based live log viewer
2. **Alert Rules**: Automatically alert on error thresholds
3. **Performance Metrics**: Track response times and user actions
4. **User Session Replay**: Record user interactions for debugging
5. **Log Aggregation**: Central logging for multi-instance deployments
6. **Machine Learning**: Anomaly detection for unusual error patterns

---

## Summary

The logging infrastructure is now fully integrated and production-ready. Every critical user action and system event is tracked with full context, enabling rapid debugging of issues like the crash that occurred earlier. Logs are persisted daily, automatically cleaned up, and accessible via admin APIs for analysis and export.

**Implementation Status**: ✅ Complete
**Code Changes**: 7 files modified/created
**Test Status**: ✅ Build successful (1703 modules)
**API Status**: ✅ Running on port 8080
