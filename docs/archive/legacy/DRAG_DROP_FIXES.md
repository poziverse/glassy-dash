# Drag and Drop Reliability Issues & Fixes

## Identified Issues

### 1. **Race Condition in onDragEnd**
**Location**: `NotesContext.jsx` and `useNotesCompat.js`
- **Problem**: Both call `e.preventDefault()` in `onDragEnd`, which can interfere with proper drag completion
- **Impact**: Drag operation may not complete cleanly, causing unreliable state updates

### 2. **Missing Event Propagation Control**
**Location**: `NoteCard.jsx` lines 45-68
- **Problem**: Drag handlers don't call `e.stopPropagation()`, allowing events to bubble
- **Impact**: Parent elements may interfere with drag operations

### 3. **Data Transfer Timing Issues**
**Location**: `NotesContext.jsx` line 383, `useNotesCompat.js` line 430
- **Problem**: `getData('text/plain')` may fail if called too late
- **Impact**: Dragged ID not retrieved correctly, causing drop failures

### 4. **Excessive onDragLeave Triggers**
**Location**: `NoteCard.jsx` line 56, `NotesContext.jsx` line 375
- **Problem**: `onDragLeave` fires when moving to child elements, not just leaving the card
- **Impact**: Unexpected state changes during drag

### 5. **No Drag State Management**
**Location**: Global
- **Problem**: No tracking of active drag state across components
- **Impact**: Concurrent drag operations can cause conflicts

### 6. **Missing Visual Feedback**
**Location**: `NoteCard.jsx`
- **Problem**: No visual indication of drag state or drop target
- **Impact**: Users can't see where card will be dropped

### 7. **Optimistic Update Rollback Issues**
**Location**: `useNotesCompat.js` lines 473-475
- **Problem**: Full `loadNotes()` on error doesn't properly restore previous state
- **Impact**: User loses their drag arrangement on network error

### 8. **Missing Drag Image**
**Location**: `NoteCard.jsx` line 45
- **Problem**: No custom drag image, browser default can be unreliable
- **Impact**: Drag preview may not show correctly

### 9. **No Debouncing of Mutations**
**Location**: `NotesContext.jsx` line 411, `useNotesCompat.js` line 470
- **Problem**: Rapid drags can cause simultaneous mutations
- **Impact**: Backend conflicts and inconsistent state

### 10. **Type Conversion Inconsistencies**
**Location**: Throughout drag handlers
- **Problem**: Mix of string/number comparisons for note IDs
- **Impact**: Edge cases where ID comparison fails

## Proposed Fixes

### Fix 1: Remove preventDefault from onDragEnd
- Don't call `preventDefault()` in `onDragEnd` handlers
- Let browser complete drag naturally

### Fix 2: Add stopPropagation to Drag Handlers
- Call `e.stopPropagation()` in `onDragStart`, `onDragOver`, `onDrop`
- Prevent parent element interference

### Fix 3: Improve Data Transfer Handling
- Add null checks and type conversion
- Store data earlier in drag lifecycle
- Add fallback for data retrieval

### Fix 4: Implement Proper Drag Leave Detection
- Use `relatedTarget` to check if actually leaving element
- Ignore drag leave when moving to child elements

### Fix 5: Add Global Drag State
- Track active drag in store
- Prevent concurrent drag operations

### Fix 6: Add Visual Feedback
- Highlight drag target card
- Show drop indicator
- Add dragging class to source card

### Fix 7: Fix Optimistic Updates
- Store previous state before mutation
- Restore exact previous state on error
- Add retry logic for failed mutations

### Fix 8: Set Custom Drag Image
- Create custom drag image
- Use card preview during drag

### Fix 9: Add Mutation Debouncing
- Track pending mutations
- Queue rapid drag operations
- Process in order

### Fix 10: Standardize Type Handling
- Always convert IDs to strings for comparison
- Use consistent comparison helpers