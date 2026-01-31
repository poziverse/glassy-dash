# Recording Tool Fixes - Test Plan

## Fixes Applied

### ✅ Fix #1: setState During Render Error
**File:** `src/components/voice/RecordingStudio.jsx`
**Issue:** `setRecordingDuration()` was called inside a state updater, causing React errors.
**Solution:** Split into separate effects - one for local state, one for syncing to store.

### ✅ Fix #2: Gemini API Payload Format
**File:** `server/ai/providers/gemini.js`
**Issue:** API payload structure was incorrect for Gemini 2.5 Flash.
**Solution:** Restructured `contents` array with proper `role` and `parts` nesting.

---

## Manual Test Plan

### Prerequisites
1. Ensure VITE_GEMINI_API_KEY is set in `.env` file
2. Backend server is running (`npm run dev` or `docker-compose up`)
3. Frontend dev server is accessible

### Test Steps

#### Test 1: Recording Duration Tracking
1. Navigate to `/voice` route
2. Click microphone button to start recording
3. Observe timer increments every second
4. **Expected:** Timer updates smoothly without React errors
5. Record for 10-15 seconds
6. Stop recording
7. **Expected:** Duration displays correctly, no "setState during render" error

#### Test 2: Audio Transcription
1. Start a new recording
2. Speak clearly for 5-10 seconds
3. Stop recording
4. **Expected:** 
   - Processing state shows with spinner
   - No 400 Bad Request errors
   - Transcript appears progressively (streaming)
   - Summary appears when complete
5. Verify transcript text is accurate
6. **Expected:** AI transcribes speech correctly

#### Test 3: Save to Notes/Gallery
1. After transcription completes
2. Click "Save to Notes" or "Save to Gallery"
3. **Expected:** Success toast appears
4. Navigate to Notes or Gallery
5. **Expected:** Recording appears with transcript and summary

#### Test 4: Error Handling
1. Start recording
2. Disconnect microphone during recording
3. **Expected:** Error message displays gracefully
4. Try transcription without API key
5. **Expected:** Clear error message about missing configuration

#### Test 5: Keyboard Shortcuts
1. Use Space to start/stop recording
2. Use Escape to stop recording
3. Use Ctrl+Z / Ctrl+Y for undo/redo in transcript
4. **Expected:** All shortcuts work correctly

---

## Expected Results

✅ No "Cannot update component during render" errors
✅ Successful audio transcription with Gemini 2.5 Flash
✅ Duration tracking updates correctly
✅ Complete recording flow works end-to-end
✅ Streaming transcript updates display in real-time
✅ Error handling works gracefully

---

## Troubleshooting

### If setState Error Still Occurs
Check console for stack trace pointing to specific line
Verify RecordingStudio.jsx lines 95-106 are using the fix

### If Transcription Fails with 400 Error
1. Verify API key is valid: `echo $VITE_GEMINI_API_KEY`
2. Check model name is correct: `gemini-2.5-flash`
3. Review server logs for detailed error messages
4. Verify payload structure in gemini.js matches the fix

### If Transcription Times Out
1. Check network connectivity
2. Verify Gemini API is accessible
3. Check server timeout settings in ai/providers/gemini.js
4. Try shorter audio clip (< 30 seconds)

---

## API Payload Format Reference

### Before (Broken)
```javascript
contents: [
  { inlineData: { data, mimeType } },
  { text: prompt }
]
```

### After (Fixed)
```javascript
contents: [
  {
    role: 'user',
    parts: [
      { inlineData: { mimeType, data } },
      { text: prompt }
    ]
  }
]
```

This matches Gemini 2.5 Flash API specification.

---

## Success Criteria

- [ ] No React setState errors during recording
- [ ] Transcription succeeds without 400 errors
- [ ] Duration timer works correctly
- [ ] Save to Notes works
- [ ] Save to Gallery works
- [ ] Streaming transcript updates visible
- [ ] AI summary generates
- [ ] Keyboard shortcuts functional
- [ ] Error messages display when needed