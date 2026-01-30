# Page Loading and Flickering Investigation Report
**Date:** 2026-01-29
**Status:** Root Cause Identified

## Issues Found

### 1. Missing CSS for LoadingSpinner Component (CRITICAL)
The `LoadingSpinner` component uses classes `.loading-spinner` and `.loading-text` but these classes have NO CSS definitions in any stylesheet. This causes:
- Flickering during loading states
- Incomplete/partial page rendering
- Unstyled loading indicators
- Visual glitches during Suspense fallback

**Component:** `src/components/LoadingSpinner.jsx`
```jsx
export default function LoadingSpinner({ size = 32, text = 'Loading...' }) {
  return (
    <div className="loading-spinner">  {/* NO CSS! */}
      <Loader2 size={size} className="animate-spin" />
      {text && <p className="loading-text">{text}</p>}  {/* NO CSS! */}
    </div>
  )
}
```

### 2. Multiple Development Server Instances
Multiple instances of Vite dev server and preview server running simultaneously:
- `npm run dev` (multiple instances on different terminals)
- `npm run preview` (multiple instances)
- This causes:
  - Resource contention
  - Port conflicts (5173, 4173)
  - Race conditions
  - Memory exhaustion

**Running Processes:**
- Process 76982: Vite dev server (pts/18)
- Process 78781: Vite dev server (pts/20)
- Process 56275: Vite preview (pts/17)
- Process 57740: Vite preview (pts/18)
- Plus multiple npm/node wrapper processes

### 3. React Suspense Boundary Issues
The app uses Suspense boundaries throughout:
- Main App wrapper with LoadingSpinner fallback
- NotesView with Suspense wrapper
- Without proper loading styling, these cause visual flashes

### 4. Missing Error Boundary Styling
The ErrorFallback component also uses undefined CSS classes:
- `.error-fallback`
- `.error-icon`
- `.error-actions`
- `.retry-button`
- `.refresh-button`
- `.error-details`
- `.error-stack`

## Root Cause Analysis

**Primary Issue:** Missing CSS styles for loading and error states

The application has React components that depend on CSS classes that don't exist in the codebase. When these components render, they:
1. Render without proper styling
2. Flash between styled and unstyled states
3. Cause layout shifts and visual glitches
4. Result in the user experiencing "half-loading" pages

**Secondary Issue:** Resource conflicts from multiple server instances

Multiple dev servers compete for:
- CPU resources (Node.js event loop)
- Memory
- Network ports
- File watchers (Vite HMR)

## Evidence

### Browser Console Output
```
[debug] [vite] connecting...
[debug] [vite] connected.
[info] Download the React DevTools...
[log] IndexedDB initialized successfully
```
- No JavaScript errors
- No CSS errors (because the classes simply don't exist, they're just ignored)

### Page State
- Document readyState: "complete" (good)
- React DevTools available (good)
- No runtime errors in console

### Code Analysis
1. **CSS Search Results:**
   - `.loading-spinner`: 0 matches
   - `.loading-text`: 0 matches
   - `.error-fallback`: 0 matches
   - And all related error classes: 0 matches

2. **Component Structure:**
   - `main.jsx`: Wraps App with Suspense + LoadingSpinner
   - `App.jsx`: Uses multiple conditional renders
   - `NotesView.jsx`: Wrapped in Suspense with text-only fallback
   - `ErrorFallback.jsx`: Uses undefined CSS classes

## Recommended Fixes

### Priority 1: Add Missing CSS for LoadingSpinner
Create comprehensive styles for loading states in `src/index.css`

### Priority 2: Add Missing CSS for ErrorFallback
Create error boundary styling in `src/index.css`

### Priority 3: Kill Extra Server Instances
Stop all but one dev server instance to eliminate resource conflicts

### Priority 4: Optimize Suspense Boundaries
Review and consolidate Suspense usage to minimize flash states

## Impact Assessment

**Severity:** HIGH
- Affects user experience significantly
- Makes application appear broken
- Causes visual glitches across all loading states

**User Impact:**
- Pages appear to "half-load"
- Flickering during navigation
- Unprofessional appearance
- Potential user frustration

## Next Steps

1. ✅ Investigation complete
2. ⏳ Implement CSS fixes for LoadingSpinner
3. ⏳ Implement CSS fixes for ErrorFallback  
4. ⏳ Clean up server instances
5. ⏳ Test fixes in browser
6. ⏳ Verify no more flickering/loading issues