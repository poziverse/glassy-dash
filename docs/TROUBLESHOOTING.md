# GLASSYDASH Troubleshooting Guide

**Version:** 0.67.1 (Beta Phase)  
**Last Updated:** January 25, 2026  
**Status:**  All Features Operational

---

## Critical Issue Resolution (January 25, 2026)

**MAJOR FIXES COMPLETED**: All critical interface issues have been resolved:

 **Voice Studio**: Blank page issue fixed - migrated from deprecated Context API to Zustand + React Query  
 **Documents**: Grid View and editor working - migrated to Zustand state management  
 **Notes**: All operations restored - migrated to compatibility layer  
 **Build**: Clean build with 2,256 modules, no errors  
 **Sidebar**: Improved UX (open by default for Docs/Voice/Settings/Admin)  

**Root Cause**: Components were using deprecated Context API that was no longer active after migration to Zustand stores and React Query. All major components have been successfully migrated.

---

## Quick Health Check

If you're experiencing issues, first verify:

1. **Build Status**: `npm run build` should complete without errors
2. **Backend Running**: Server should be on port 8080 (`curl http://localhost:8080/api/monitoring/health`)
3. **Frontend Running**: Dev server on port 5173 or production build serving
4. **Authentication**: Can login and see user data
5. **Voice Studio**: Navigate to `#/voice` and see Voice Gallery

---

## Table of Contents

- [Critical Issues (RESOLVED)](#critical-issue-resolution-january-25-2026)
- [Development Issues](#development-issues)
- [Build Issues](#build-issues)
- [API Issues](#api-issues)
- [Database Issues](#database-issues)
- [Frontend Issues](#frontend-issues)
- [Voice Studio Issues](#voice-studio-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)

---

## Overview

This guide covers common issues and their solutions for GlassyDash development and deployment.

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

## Voice Studio Issues

### Voice Studio Page Shows Blank

**Problem:** Voice Studio appears completely blank when clicked from sidebar.

**Status:**  RESOLVED - Root cause was deprecated Context API usage

**Solution:** The issue has been fixed by migrating VoiceView to modern architecture:

```javascript
// Before (BROKEN):
import { useAuth, useNotes, useSettings } from '../contexts'

// After (FIXED):
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useCreateNote } from '../hooks/mutations/useNoteMutations'
import { useNotes } from '../hooks/queries/useNotes'
```

**If you still see blank page:**
1. Clear browser cache and refresh
2. Check browser console for Context API errors
3. Verify you're logged in
4. Check build completed successfully

### Voice Recording Not Working

**Problem:** Recording button doesn't respond or visualizer doesn't show.

**Solution:**
1. **Grant Microphone Permission**: Browser should prompt on first use
2. **Check Browser Compatibility**: Use Chrome/Edge/Firefox (Safari has limited MediaRecorder support)
3. **Test Microphone**: Ensure microphone is connected and working
4. **Check Console**: Look for MediaRecorder API errors

### Voice Transcription Fails

**Problem:** Recording completes but no transcript is created.

**Solution:**
1. **Internet Connection**: Gemini API requires connectivity
2. **API Key**: Verify GEMINI_API_KEY is set in environment variables
3. **Recording Length**: Keep recordings under 5 minutes for best results
4. **Check Logs**: Look for transcription errors in backend logs

### Visualizer Not Showing

**Problem:** Audio visualizer shows static or no activity during recording.

**Solution:**
1. **Microphone Access**: Ensure microphone permission is granted
2. **Browser Support**: Test in Chrome/Edge/Firefox
3. **Audio Levels**: Speak clearly and ensure microphone is picking up sound
4. **Canvas Support**: Verify browser supports Canvas API

---

## Documents Issues

### Documents Page Shows Blank

**Problem:** Documents page appears blank or won't load.

**Status:**  RESOLVED - Root cause was deprecated Context API usage

**Solution:** DocsView has been migrated to Zustand state management:

```javascript
// Before (BROKEN):
import { useAuth, useSettings } from '../contexts'

// After (FIXED):
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
```

### Grid View Not Displaying Documents

**Problem:** Grid View shows empty or no documents appear.

**Solution:**
1. **Local Storage**: Docs are stored in localStorage, not backend
2. **Browser Storage**: Check if localStorage is enabled in browser settings
3. **Data Persistence**: Docs are local-only, don't sync across devices
4. **Create Test Doc**: Try creating a new document to test functionality

### Editor Not Saving

**Problem:** Changes in document editor are not saved.

**Solution:**
1. **Auto-save**: Documents auto-save to localStorage every 30 seconds
2. **Manual Save**: Ctrl+S triggers immediate save
3. **Browser Storage**: Ensure localStorage quota is not exceeded
4. **Check Console**: Look for localStorage errors

---

## Notes Issues

### Notes Page Shows Blank or Broken

**Problem:** Notes page appears blank, crashed, or operations don't work.

**Status:**  RESOLVED - Root cause was deprecated Context API usage

**Solution:** NotesView has been migrated to compatibility layer and Zustand stores:

```javascript
// Before (BROKEN):
import { useAuth, useNotes, useSettings, useUI, useModal } from '../contexts'

// After (FIXED):
import { useNotesCompat } from '../hooks/useNotesCompat'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUIStore } from '../stores/uiStore'
import { useModalStore } from '../stores/modalStore'
```

### Note Operations Not Working

**Problem:** Create, edit, delete, pin, or archive operations fail.

**Solution:**
1. **Check Build**: Verify `npm run build` completes without errors
2. **Backend Connection**: Check if backend is running on port 8080
3. **Authentication**: Ensure JWT token is valid and not expired
4. **React Query**: Check browser dev tools for query/mutation errors
5. **Network**: Verify network connection to backend API

### Multi-select and Bulk Operations Not Working

**Problem:** Cannot select multiple notes or perform bulk operations.

**Solution:**
1. **Enable Multi-select**: Hold Ctrl/Cmd while clicking notes
2. **Check Selection**: Selected notes should show blue border
3. **Bulk Actions**: Toolbar should appear when notes are selected
4. **Console Errors**: Check for JavaScript errors in browser console

### Real-time Collaboration Not Working

**Problem:** Changes don't appear for collaborators in real-time.

**Solution:**
1. **SSE Connection**: Check browser console for EventSource errors
2. **Backend SSE**: Verify SSE endpoint is accessible
3. **Collaborator Access**: Ensure collaborators are logged in and have permission
4. **Network Issues**: Check for connection drops or firewall issues

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

### Build Fails with Context API Errors

**Error:**

```
[vite] Build failed with errors
Cannot find module '../contexts/AuthContext'
```

**Status:**  RESOLVED - All components migrated from Context API

**Solution:**

```bash
# Current build should be clean
npm run build

# If still failing, ensure all components use Zustand:
# Check imports are from '../stores/' not '../contexts/'
rm -rf node_modules/.vite dist
npm install
npm run build
```

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

# Rebuild (should complete with 2,256 modules)
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

### White Screen of Death (RESOLVED)

**Symptoms:**

- Blank page on load
- No error messages

**Status:**  RESOLVED - Was caused by Context API migration issues

**Solution:**

```javascript
// Check browser console for errors
// Common causes (now fixed):

// 1. Context API migration - FIXED
// All components now use Zustand stores

// 2. Missing dependencies
npm install

// 3. Build failure
npm run build

// 4. Router issues
// Verify HashRouter is used (not BrowserRouter)
```

### Sidebar Not Opening

**Problem:** Sidebar stays collapsed when it should be open.

**Status:**  RESOLVED - Improved sidebar UX

**Solution:**
1. **Expected Behavior**: Sidebar is OPEN by default for Docs, Voice, Settings, Admin
2. **Notes Dashboard**: Sidebar remains COLLAPSED by design (focused experience)
3. **Manual Toggle**: Click the hamburger menu (a) to open/close manually
4. **Mobile View**: Sidebar auto-collapses on narrow screens

### Component Errors After Migration

**Problem:** Components show errors related to missing Context providers.

**Status:**  RESOLVED - All major components migrated

**Solution:**
1. **Check Imports**: Ensure imports are from `../stores/` not `../contexts/`
2. **Verify Build**: `npm run build` should complete cleanly
3. **Browser Console**: Should not show Context API errors
4. **Restart Dev Server**: If issues persist, restart development server

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

### 502 Bad Gateway (Cloudflare Tunnel)

**Symptom:** Accessing the domain returns a "502 Bad Gateway" error from Cloudflare.

**Cause:** The Cloudflare tunnel cannot reach the application port.

**Solution:**

1. **Check Application Port**: Verify the app is listening on the mapped port (usually `3001`).
   ```bash
   # On the VM
   ss -tulpn | grep 3001
   ```
2. **Verify Tunnel Target**: Ensure the Cloudflare Tunnel configuration points to the correct IP/Port.
   - If `cloudflared` is in the VM: `http://localhost:3001`
   - If `cloudflared` is on a Jump Host: `http://192.168.122.45:3001`
3. **Traefik Conflict**: Ensure you are NOT using port `8080` for the external mapping, as Traefik already occupies it. Use `3001`.

---

### Port Mismatch (Internal vs External)

**Symptom:** App works locally or via IP but fails via the tunnel or domain.

**Solution:**

1. Check `docker-compose.prod.yml` mapping. It should be `3001:8080`.
2. Ensure `API_PORT` inside the container remains `8080`.
3. Verify health check path in `docker-compose`: `http://localhost:8080/api/monitoring/health`.

---

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

### System Health Check

First, verify the system is working:

```bash
# Check build status (should be clean)
npm run build

# Check backend health
curl http://localhost:8080/api/monitoring/health

# Check all critical pages:
# - http://localhost:5173/#/notes (should load notes)
# - http://localhost:5173/#/voice (should show Voice Gallery)
# - http://localhost:5173/#/docs (should show Grid View)
```

### Check Logs

**Server Logs:**

```bash
# View live logs
tail -f GLASSYDASH/server/server.log

# View error logs
grep -i error GLASSYDASH/server/server.log

# Check for SSE issues
grep -i sse GLASSYDASH/server/server.log
```

**Client Logs:**

```javascript
// Browser console
console.log('Debug:', data)

// Enable verbose logging
localStorage.setItem('debug', 'true')

// Check React Query DevTools
// Should show queries and mutations working
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

1. **GLASSYDASH Version**: 0.67.1 (Beta Phase)
2. **Node.js version**: `node --version`
3. **Browser name and version**
4. **Build Status**: Does `npm run build` complete cleanly?
5. **Full error message**: Include browser console errors
6. **Steps to reproduce**: Detailed reproduction steps
7. **Expected vs actual behavior**: What should happen vs what does happen

### Quick Fixes for Common Issues

```bash
# Fix most common issues (updated for current architecture)
npm install
npm run build  # Should complete cleanly
rm -rf node_modules/.vite
npm run dev

# Fix voice recording issues
# Check microphone permissions
# Use Chrome/Edge/Firefox (not Safari)
# Verify internet connection for Gemini API

# Fix database issues
rm data/notes.db-shm data/notes.db-wal
npm run migrate

# Fix build issues
rm -rf node_modules dist
npm install
npm run build  # Should show: " 2256 modules transformed"
```

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

**Document Version:** 0.67.1  
**Last Updated:** January 25, 2026  
**Status:**  All Critical Issues Resolved

## Resolution Summary

**January 25, 2026 - Major Interface Fixes Completed:**

 **Voice Studio**: Fully operational - recording, transcription, and note creation working  
 **Documents**: Fully functional - Grid View and editor working  
 **Notes**: All operations restored - create, edit, delete, pin, archive working  
 **Real-time Collaboration**: SSE-based collaboration working  
 **State Management**: Successfully migrated from Context API to Zustand + React Query  
 **Build**: Clean build with 2,256 modules transformed in 3.75s  
 **Sidebar UX**: Improved default state behavior  

**Architecture Status**: Modern and stable
- Zustand stores for local state management
- React Query for server state with caching
- Compatibility layer for gradual migration
- No more deprecated Context API usage in major components

**Build Verification**: `npm run build` completes without errors
**All Features**: Fully operational and tested

If you encounter issues not covered here, please check the updated [API Documentation](../API_REFERENCE.md) or [User Features Guide](./FEATURES.md).

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
