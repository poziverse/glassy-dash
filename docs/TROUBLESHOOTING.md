# Troubleshooting Guide

**Version:** ALPHA 1.0  
**Last Updated:** January 19, 2026

---

## Overview

This guide covers common issues and their solutions for GlassKeep development and deployment.

---

## Table of Contents

- [Development Issues](#development-issues)
- [Build Issues](#build-issues)
- [API Issues](#api-issues)
- [Database Issues](#database-issues)
- [Frontend Issues](#frontend-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)

---

## Development Issues

### Port Already in Use

**Error:**

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

```bash
# Find process using port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

---

### Module Not Found

**Error:**

```
Error: Cannot find module 'express'
```

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

---

### Hot Reload Not Working

**Symptoms:**

- Changes not reflecting in browser
- Need to manually refresh

**Solution:**

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

---

### Environment Variables Not Loading

**Symptoms:**

- `process.env` values are undefined
- Configuration not applying

**Solution:**

1. Verify `.env` file exists in `server/` directory
2. Check file permissions: `ls -la server/.env`
3. Ensure no trailing spaces in `.env`
4. Restart server after changes

---

## Build Issues

### Build Fails

**Error:**

```
[vite] Build failed with errors
```

**Solution:**

```bash
# Clear all caches
rm -rf node_modules/.vite
rm -rf dist

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

---

### TypeScript Errors

**Error:**

```
error TS2307: Cannot find module
```

**Solution:**

```bash
# Install TypeScript types
npm install --save-dev @types/node @types/react

# Check tsconfig.json
# Ensure paths are correct
```

---

### Build Size Too Large

**Symptoms:**

- Bundle size > 500KB
- Slow initial load

**Solution:**

1. Use `React.lazy` for code splitting
2. Minimize dependencies
3. Use tree-shaking imports
4. Compress images before adding

---

## API Issues

### CORS Errors

**Error:**

```
Access to XMLHttpRequest at 'http://localhost:3000/api/notes' from origin
'http://localhost:5173' has been blocked by CORS policy
```

**Solution:**

1. Check `CORS_ORIGIN` in `server/.env`
2. Should match frontend URL exactly
3. Restart server after changes
4. Verify no extra spaces or trailing slashes

---

### 401 Unauthorized

**Error:**

```
{ "error": "Unauthorized", "message": "Invalid or expired token" }
```

**Solution:**

```javascript
// Check token expiration
const decoded = jwtDecode(token)
if (decoded.exp < Date.now() / 1000) {
  logout() // Token expired
}

// Verify token is stored
localStorage.getItem('token')

// Clear and re-login
localStorage.removeItem('token')
window.location.href = '/login'
```

---

### 429 Too Many Requests

**Error:**

```
{ "error": "Too Many Requests", "message": "Rate limit exceeded" }
```

**Solution:**

1. Wait for rate limit window (1 minute)
2. Implement exponential backoff
3. Cache API responses
4. Reduce request frequency

---

### AI Not Responding

**Symptoms:**

- AI requests timeout
- Empty responses

**Solution:**

1. Check `AI_ENABLED=true` in `.env`
2. Verify AI model is downloaded
3. Check available memory (needs ~2GB)
4. Review server logs for errors

---

## Database Issues

### Database Locked

**Error:**

```
Error: SQLITE_BUSY: database is locked
```

**Solution:**

```bash
# Kill zombie processes
ps aux | grep sqlite
kill -9 <PID>

# Or delete WAL files
rm data/notes.db-shm data/notes.db-wal

# Restart server
```

---

### Database Migration Failed

**Error:**

```
Error: Migration failed: table already exists
```

**Solution:**

```bash
# Check current version
sqlite3 data/notes.db "PRAGMA user_version;"

# Manually set version
sqlite3 data/notes.db "PRAGMA user_version = 3;"

# Re-run migration
npm run migrate
```

---

### Corrupted Database

**Symptoms:**

- Queries return errors
- Application crashes

**Solution:**

```bash
# Restore from backup
cd server
npm run db:restore data/backups/notes.db.YYYY-MM-DDTHH-mm-ss

# Or rebuild database
rm data/notes.db
# Restart server (will auto-create)
```

---

### Slow Database Queries

**Symptoms:**

- Note loading takes >1s
- Search is slow

**Solution:**

```sql
-- Check query plan
EXPLAIN QUERY PLAN SELECT * FROM notes WHERE user_id = ?;

-- Add missing indexes
CREATE INDEX idx_notes_user_id ON notes(user_id);

-- Run ANALYZE
ANALYZE;
```

---

## Frontend Issues

### White Screen of Death

**Symptoms:**

- Blank page on load
- No error messages

**Solution:**

```javascript
// Check browser console for errors
// Common causes:

// 1. Missing dependencies
npm install

// 2. Build failure
npm run build

// 3. Router issues
// Verify HashRouter is used (not BrowserRouter)
```

---

### React Hydration Error

**Error:**

```
Warning: Text content did not match
```

**Solution:**

- Ensure server-rendered HTML matches client
- Check for conditional rendering differences
- Use `suppressHydrationWarning` if intentional

---

### State Not Persisting

**Symptoms:**

- Settings reset on refresh
- Notes lost on reload

**Solution:**

```javascript
// Check localStorage
console.log(localStorage.getItem('settings'))

// Ensure settings are saved
useEffect(() => {
  localStorage.setItem('settings', JSON.stringify(settings))
}, [settings])
```

---

### Notes Not Loading on Start

**Symptoms:**

- Notes list is empty after login
- Notes appear only after refreshing or creating a new note
- Collaboration connection status seems stuck

**Solution:**
The issue is likely due to the initial fetch not being triggered by the authentication event.
Ensure `NotesContext.jsx` has a `useEffect` that listens for the `token` and triggers `loadNotes()`:

```javascript
// src/contexts/NotesContext.jsx
useEffect(() => {
  if (token) {
    loadNotes()
    loadArchivedNotes() // If applicable
  }
}, [token])
```

---

### SSE Connection Lost

**Symptoms:**

- Real-time updates not working
- Presence indicators stale

**Solution:**

```javascript
// Implement reconnection
let eventSource

function connectSSE() {
  eventSource = new EventSource('/api/notes/events')

  eventSource.onerror = () => {
    // Reconnect after 5 seconds
    setTimeout(connectSSE, 5000)
  }
}

// Call on mount
connectSSE()
```

---

## Performance Issues

### Slow Initial Load

**Symptoms:**

- First load >5s
- Large bundle size

**Solution:**

1. Enable code splitting with `React.lazy`
2. Lazy load images
3. Minimize dependencies
4. Use CDN for static assets
5. Enable gzip compression

```javascript
// Example: Code splitting
const AdminView = React.lazy(() => import('./AdminView'))
```

---

### High Memory Usage

**Symptoms:**

- Memory usage >90%
- Application freezes

**Solution:**

```javascript
// Clear cache periodically
useEffect(() => {
  const interval = setInterval(() => {
    if (performance.memory.usedJSHeapSize > threshold) {
      clearCache()
    }
  }, 60000) // Check every minute

  return () => clearInterval(interval)
}, [])
```

---

### Slow Note Rendering

**Symptoms:**

- UI freezes with many notes
- Janky scrolling

**Solution:**

1. Use virtualization for lists
2. Implement pagination
3. Debounce expensive operations
4. Use `React.memo` for note cards

```javascript
// Example: Memoization
const NoteCard = React.memo(({ note, onClick }) => {
  return <div onClick={() => onClick(note.id)}>{note.title}</div>
})
```

---

## Deployment Issues

### Application Won't Start

**Error:**

```
Error: Cannot find module './app.js'
```

**Solution:**

```bash
# Build production bundle
npm run build

# Verify dist directory exists
ls -la dist/

# Check NODE_ENV
export NODE_ENV=production

# Start server
NODE_ENV=production npm start
```

---

### Environment Variables Missing

**Error:**

```
Error: JWT_SECRET is required
```

**Solution:**

```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env file
echo "JWT_SECRET=<your-secret>" >> server/.env

# Restart server
```

---

### SSL Certificate Issues

**Error:**

```
Error: SSL certificate has expired
```

**Solution:**

```bash
# Check certificate expiration
openssl x509 -in cert.pem -noout -dates

# Renew certificate
# Use Let's Encrypt or your CA
```

---

## Getting Help

### Check Logs

**Server Logs:**

```bash
# View live logs
tail -f GLASSYDASH/server/server.log

# View error logs
grep -i error GLASSYDASH/server/server.log
```

**Client Logs:**

```javascript
// Browser console
console.log('Debug:', data)

// Enable verbose logging
localStorage.setItem('debug', 'true')
```

### Enable Debug Mode

```bash
# Set debug environment
export DEBUG=*

# Run with debug
npm run dev
```

### Report Issues

When reporting issues, include:

1. GlassKeep version
2. Node.js version (`node --version`)
3. Browser name and version
4. Full error message
5. Steps to reproduce
6. Expected vs actual behavior

---

## Quick Fixes

```bash
# Fix most common issues
npm install
npm run build
rm -rf node_modules/.vite
npm run dev

# Fix database issues
rm data/notes.db-shm data/notes.db-wal
npm run migrate

# Fix build issues
rm -rf node_modules dist
npm install
npm run build
```

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Complete

## Settings Panel

### Layout Issues with Background Controls

**Symptom:** The "Workspace Background" section has overlapping text or controls, especially when the overlay option is toggled.
**Solution:**

- This was caused by the opacity slider forcing a line break in a flex container that wasn't designed for wrapping.
- **Fix:** Codebase updated to separate the header (title + toggle) from the content (slider) into distinct rows.
- **Workaround:** None needed after update. If developing custom settings, ensure sliders or large inputs have their own dedicated container or row.

### Database Reset

**Symptom:** Need to clear test data without deleting user accounts.
**Solution:**

- The `sqlite3` CLI might be missing in some environments depending on the setup.
- **Fix:** Use a Python script to surgically delete records:
  ```bash
  python3 -c "import sqlite3; conn = sqlite3.connect('server/data.sqlite'); c = conn.cursor(); c.execute('DELETE FROM notes'); c.execute('DELETE FROM note_collaborators'); conn.commit();"
  ```
- **Note:** This preserves the `users` table, so you don't need to re-register.
