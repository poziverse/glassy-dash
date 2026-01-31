# Test Fixes Implementation Plan
**Date:** January 30, 2026  
**Based On:** Comprehensive Investigation Report

---

## Overview

This plan outlines the step-by-step approach to fix all identified test issues, prioritized by severity and impact.

## Priority Order

1. ✅ **Phase 1: Critical Infrastructure** (1-2 hours)
2. ✅ **Phase 2: Failing Unit Tests** (2-3 hours)
3. ✅ **Phase 3: Critical Missing Tests** (6-8 hours)
4. ⏳ **Phase 4: Core Feature Tests** (12-15 hours)
5. ⏳ **Phase 5: High-Priority Components** (20-25 hours)

---

## Phase 1: Critical Infrastructure Fixes

### Task 1.1: Fix E2E Test Infrastructure
**File:** `tests/e2e/global-setup.ts`  
**Issue:** Using CommonJS `__dirname` in ES module  
**Impact:** Blocks ALL E2E tests (~26 tests)  
**Time:** 5 minutes  

**Steps:**
1. Read current global-setup.ts file
2. Replace CommonJS require with ESM imports
3. Add __dirname polyfill for ES modules
4. Verify syntax is correct

**Expected Result:** E2E tests can run successfully

---

### Task 1.2: Verify E2E Tests Run
**Command:** `npm run test:e2e`  
**Time:** 10 minutes  

**Steps:**
1. Run E2E test suite
2. Verify all tests execute
3. Check for any additional issues
4. Document any new problems found

**Expected Result:** All E2E tests execute without infrastructure errors

---

## Phase 2: Failing Unit Tests

### Task 2.1: Review docsStore Implementation
**File:** `src/stores/docsStore.js`  
**Time:** 30 minutes  

**Steps:**
1. Read current docsStore implementation
2. Understand current API (async vs sync)
3. Identify method signatures
4. Compare with test expectations

**Expected Result:** Clear understanding of why tests are failing

---

### Task 2.2: Fix docsStore Tests
**File:** `tests/docsStore.test.jsx`  
**Time:** 2 hours  

**Issues to Fix:**
1. `should create a new document` - Expects Promise, gets string
2. `should update a document` - Update not reflecting
3. `should soft-delete a document` - deletedAt not set
4. `should permanently delete a document` - Document not removed
5. `should restore a soft-deleted document` - deletedAt not cleared

**Steps:**
1. Update test expectations to match actual store behavior
2. Fix async/await patterns if needed
3. Add proper waiting for state updates
4. Verify all 6 tests pass

**Expected Result:** All docsStore tests passing (6/6)

---

## Phase 3: Critical Missing Tests

### Task 3.1: Create notesStore Tests
**New File:** `src/stores/notesStore.test.js`  
**Time:** 6 hours  

**Test Coverage Needed:**
- Create note
- Update note content
- Delete note (soft delete)
- Permanent delete
- Restore from trash
- Archive/unarchive
- Pin/unpin
- Filter by tags
- Search notes
- Sort by date/title
- Bulk operations
- Error handling

**Steps:**
1. Review notesStore implementation
2. Create test file structure
3. Write basic CRUD tests
4. Write filtering/sorting tests
5. Write bulk operation tests
6. Write error handling tests
7. Run and verify all pass

**Expected Result:** Comprehensive notesStore test suite (~20+ tests)

---

### Task 3.2: Test AuthContext
**New File:** `src/contexts/AuthContext.test.jsx`  
**Time:** 2 hours  

**Test Coverage Needed:**
- Provider renders children
- Login sets user and token
- Logout clears user and token
- Token persistence
- User loading states
- Error handling

**Steps:**
1. Review AuthContext implementation
2. Create test file with React Testing Library
3. Write provider tests
4. Write authentication flow tests
5. Run and verify all pass

**Expected Result:** AuthContext test suite (~10 tests)

---

### Task 3.3: Test NotesContext
**New File:** `src/contexts/NotesContext.test.jsx`  
**Time:** 2 hours  

**Test Coverage Needed:**
- Provider renders children
- Note CRUD operations
- Filter/sort context
- Selection state
- Bulk operations context

**Steps:**
1. Review NotesContext implementation
2. Create test file
3. Write provider tests
4. Write operation tests
5. Run and verify all pass

**Expected Result:** NotesContext test suite (~10 tests)

---

### Task 3.4: Test AudioPlaybackContext
**New File:** `src/contexts/AudioPlaybackContext.test.jsx`  
**Time:** 2 hours  

**Test Coverage Needed:**
- Provider renders children
- Play/pause controls
- Seek functionality
- Volume control
- Playback state
- Error handling

**Steps:**
1. Review AudioPlaybackContext implementation
2. Create test file
3. Write provider tests
4. Write playback control tests
5. Run and verify all pass

**Expected Result:** AudioPlaybackContext test suite (~10 tests)

---

## Phase 4: Core Feature Tests

### Task 4.1: Test Composer Component
**New File:** `src/components/Composer.test.jsx`  
**Time:** 4 hours  

**Test Coverage Needed:**
- Component renders
- Create new note
- Edit existing note
- Save/cancel actions
- Tag management
- Image handling
- Error states

**Steps:**
1. Review Composer component
2. Create test file
3. Write rendering tests
4. Write interaction tests
5. Write edge case tests
6. Run and verify all pass

**Expected Result:** Composer test suite (~15 tests)

---

### Task 4.2: Test ErrorBoundary Component
**New File:** `src/components/ErrorBoundary.test.jsx`  
**Time:** 2 hours  

**Test Coverage Needed:**
- Renders children when no error
- Catches errors and displays fallback
- Logs error information
- Provides recovery options

**Steps:**
1. Review ErrorBoundary implementation
2. Create test file
3. Write normal rendering tests
4. Write error catching tests
5. Run and verify all pass

**Expected Result:** ErrorBoundary test suite (~5 tests)

---

### Task 4.3: Test DocsView Component
**New File:** `src/components/DocsView.test.jsx`  
**Time:** 4 hours  

**Test Coverage Needed:**
- Component renders
- Document grid/list views
- Create document
- Open document
- Delete document
- Search/filter
- Sort options
- Grid/list toggle

**Steps:**
1. Review DocsView component
2. Create test file with proper mocks
3. Write rendering tests
4. Write interaction tests
5. Write view mode tests
6. Run and verify all pass

**Expected Result:** DocsView test suite (~15 tests)

---

### Task 4.4: Test VoiceWorkspace Component
**New File:** `src/components/voice/VoiceWorkspace.test.jsx`  
**Time:** 4 hours  

**Test Coverage Needed:**
- Component renders
- Recording controls
- Playback controls
- Transcript editing
- Audio editor
- Export functionality

**Steps:**
1. Review VoiceWorkspace component
2. Create test file with audio mocks
3. Write rendering tests
4. Write recording tests
5. Write playback tests
6. Run and verify all pass

**Expected Result:** VoiceWorkspace test suite (~15 tests)

---

## Phase 5: High-Priority Components

### Task 5.1: Test Modal Components
**New Files:**
- `src/components/Modal.test.jsx`
- `src/components/ModalWrapper.test.jsx`  
**Time:** 3 hours  

**Test Coverage Needed:**
- Open/close functionality
- Content rendering
- Backdrop click handling
- Escape key handling
- Multiple modals

**Expected Result:** Modal test suite (~10 tests)

---

### Task 5.2: Test SettingsView Component
**New File:** `src/components/SettingsView.test.jsx`  
**Time:** 3 hours  

**Test Coverage Needed:**
- Renders all settings sections
- Theme switching
- Font size changes
- User settings updates
- Persist settings

**Expected Result:** SettingsView test suite (~10 tests)

---

### Task 5.3: Test AuthViews Component
**New File:** `src/components/AuthViews.test.jsx`  
**Time:** 3 hours  

**Test Coverage Needed:**
- Login form
- Register form
- Form validation
- Error handling
- Success redirects

**Expected Result:** AuthViews test suite (~10 tests)

---

### Task 5.4: Test Audio Utilities
**New Files:**
- `src/utils/__tests__/audioBufferUtils.test.js`
- `src/utils/__tests__/audioExport.test.js`
- `src/utils/__tests__/audioStorage.test.js`  
**Time:** 6 hours  

**Test Coverage Needed:**
- Buffer conversion
- Audio export to WAV
- Audio storage/retrieval
- Format conversion
- Error handling

**Expected Result:** Audio utilities test suite (~30 tests)

---

## Execution Timeline

### Week 1 (Critical Fixes)
- ✅ Day 1: Phase 1 - E2E infrastructure + docsStore fixes
- ✅ Day 2-3: Phase 3 - notesStore + critical contexts

### Week 2 (Core Features)
- ⏳ Day 1-2: Phase 4 - Composer, ErrorBoundary, DocsView
- ⏳ Day 3-5: Phase 4 - VoiceWorkspace, Phase 5 - Modals

### Week 3 (High Priority)
- ⏳ Day 1-2: Phase 5 - SettingsView, AuthViews
- ⏳ Day 3-5: Phase 5 - Audio utilities

---

## Success Criteria

### Phase 1 Completion
- [ ] E2E tests run successfully
- [ ] No infrastructure errors
- [ ] docsStore tests all passing (6/6)

### Phase 2 Completion
- [ ] All unit tests passing (100%)
- [ ] No failing tests in test suite

### Phase 3 Completion
- [ ] notesStore has comprehensive tests
- [ ] AuthContext fully tested
- [ ] NotesContext fully tested
- [ ] AudioPlaybackContext fully tested
- [ ] Store coverage: 60%+
- [ ] Context coverage: 37.5%+

### Phase 4 Completion
- [ ] Composer fully tested
- [ ] ErrorBoundary fully tested
- [ ] DocsView fully tested
- [ ] VoiceWorkspace fully tested
- [ ] Component coverage: 32%+

### Phase 5 Completion
- [ ] Modal components tested
- [ ] SettingsView tested
- [ ] AuthViews tested
- [ ] Audio utilities tested
- [ ] Overall coverage: 50%+

---

## Risk Mitigation

### Risk 1: Tests Take Longer Than Expected
**Mitigation:** Focus on highest-impact tests first, defer lower-priority items

### Risk 2: Component Tests Require Complex Mocks
**Mitigation:** Create reusable mock utilities in test-utils.jsx

### Risk 3: Implementation Changes During Testing
**Mitigation:** Run tests frequently during implementation, fix immediately if they break

### Risk 4: Time Constraints
**Mitigation:** Prioritize critical paths, document remaining work for future

---

## Notes

- All new tests should follow existing patterns in the codebase
- Use React Testing Library for component tests
- Use Vitest for unit tests
- Mock external dependencies appropriately
- Include edge cases and error handling
- Write descriptive test names and comments

---

**Last Updated:** January 30, 2026  
**Next Review:** After Phase 1 completion