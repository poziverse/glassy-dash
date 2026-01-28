# Voice Studio - Complete User Guide

**Version:** 2.1  
**Last Updated:** January 27, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Recording Workflow](#recording-workflow)
3. [Transcription & AI Processing](#transcription--ai-processing)
4. [Editing Transcripts](#editing-transcripts)
5. [Export & Save Features](#export--save-features)
6. [Voice Gallery Management](#voice-gallery-management)
7. [Advanced Features](#advanced-features)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Voice Studio is GLASSYDASH's comprehensive audio recording, transcription, and management system powered by Google Gemini 2.5 Flash AI. It provides professional-grade voice recording with automatic transcription, intelligent summarization, and flexible export options.

### Key Features

- ✅ **Real-time Audio Recording** with waveform visualization
- ✅ **AI-Powered Transcription** using Google Gemini 2.5 Flash
- ✅ **Automatic Summarization** of recordings
- ✅ **Phase 6 Audio Editor**: Visual waveform editing with trim/cut support
- ✅ **Audio Enhancements**: Volume Normalization (-1dB) and Noise Reduction (Gate)
- ✅ **Rich Text Editing** with FormatToolbar (Bold, Italic, Code, etc.)
- ✅ **Smart Export/Save** with content-based recommendations
- ✅ **Voice Gallery** with search, filters, and bulk operations
- ✅ **Segment Editor** for granular transcript editing (soft delete support)
- ✅ **Audio Quality Monitoring** with real-time indicators
- ✅ **Undo/Redo History** for both transcription and audio edits

---

## Recording Workflow

### Step 1: Start Recording

1. **Navigate** to the Voice Studio section
2. **Expand** the Voice Recorder panel (click "Voice Recorder" header)
3. **Click the microphone button** (large gradient button) to start recording
4. **Speak clearly** into your microphone
5. **Watch the visualizer** - bars animate as you speak

**Keyboard Shortcut:** Press `Space` to start recording

### Step 2: Monitor Quality

During recording, you'll see:

- **Timer**: Recording duration (MM:SS)
- **Red indicator**: Pulsing red dot shows active recording
- **Visualizer**: Real-time waveform display
- **Quality indicator** (if enabled): Shows signal quality

### Step 3: Pause/Resume (Optional)

To pause recording:

- Click the **Pause** button (⏸)
- Timer and visualizer will stop
- Recording continues when you resume

To resume:

- Click the **Play** button (▶)
- Recording continues from where you paused

### Step 4: Stop Recording

- Click the **Stop** button (■)
- Recording stops automatically
- Audio is processed for transcription
- Visualizer clears

**Keyboard Shortcut:** Press `Escape` to stop recording

---

## Transcription & AI Processing

### Automatic Transcription

After stopping recording:

1. **Processing indicator** appears
2. **Loader animation** shows transcription in progress
3. **Transcription streams in** real-time (you see text appearing)
4. **AI summary** generates automatically
5. **Review mode** activates when complete

**Processing Time:** Typically 3-10 seconds depending on recording length

### What Gets Transcribed

- **Full transcript**: Complete spoken content with punctuation
- **AI Summary**: Intelligent summary of key points
- **Timestamps**: Automatic segmenting of content

### Viewing the Results

After transcription completes, you'll see:

```
┌─────────────────────────────────────────┐
│ FormatToolbar                          │
│ [B][I][U][Code][Highlight][Clear]    │
├─────────────────────────────────────────┤
│                                       │
│ [ Transcript Text Area ]                │
│ Click anywhere to edit...              │
│                                       │
│ 123 characters | 45 words              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ AI Summary                             │
│ [ Summary Text Area ]                  │
└─────────────────────────────────────────┘
```

---

## Editing Transcripts

### Using FormatToolbar

The FormatToolbar provides rich text editing capabilities:

#### Basic Formatting

| Button           | Shortcut | Result                 |
| ---------------- | -------- | ---------------------- |
| **Bold**         | Ctrl+B   | **bold text**          |
| _Italic_         | Ctrl+I   | _italic text_          |
| <u>Underline</u> | Ctrl+U   | <u>underlined text</u> |
| `Code`           | Ctrl+`   | `inline code`          |
| ==Highlight==    | -        | ==highlighted text==   |
| Clear Format     | -        | Removes all formatting |

#### Advanced Formatting

- **Headings**: Click Type (A) → Select H1, H2, or H3

  ```
  # Heading 1
  ## Heading 2
  ### Heading 3
  ```

- **Lists**: Click List icon → Select Bullet or Numbered

  ```
  - Bullet item
  1. Numbered item
  ```

- **Quotes**: Click Quote icon
  ```
  > Quoted text
  ```

### Editing Workflow

1. **Click** anywhere in the transcript textarea
2. **Type** to add text
3. **Select text** (drag to highlight)
4. **Click format button** to apply formatting
5. **Use keyboard shortcuts** for faster editing

### Undo/Redo

- **Undo**: Ctrl+Z or click Undo button in toolbar
- **Redo**: Ctrl+Y or click Redo button in toolbar
- Full history maintained for transcript edits

### Character & Word Count

Real-time statistics shown below transcript:

- **Character count**: Total characters in transcript
- **Word count**: Total words (excluding spaces)

---

## Export & Save Features

### Smart Save/Export Modal

Click **"Save & Done"** to open the Export/Save modal with intelligent recommendations:

#### Smart Recommendations

The system analyzes your content and recommends the best save option:

```
┌─────────────────────────────────────────┐
│ 💡 Smart Recommendation                │
│                                       │
│ Based on content length (45 words):     │
│ • Best: Save as Note                  │
│ • Alternative: Export as Markdown       │
└─────────────────────────────────────────┘
```

**Recommendation Logic:**

- **< 100 words**: Save as Note
- **100-500 words**: Save as Document
- **500+ words**: Export as File

#### Save Options

##### 1. Save as Note

- **Location**: Notes section
- **Features**:
  - Appears in Notes view
  - Can be edited like regular notes
  - Supports markdown formatting
  - Tag support
  - Pinning
- **Best for**: Quick notes, short recordings

##### 2. Save as Document

- **Location**: Documents section
- **Features**:
  - Appears in Documents view
  - Separate from regular notes
  - Professional document feel
  - Full text search
- **Best for**: Meeting notes, lectures, interviews

##### 3. Save as Voice Note

- **Location**: Voice Gallery
- **Features**:
  - Includes audio file
  - Editable transcript
  - Audio playback
  - Voice-specific features
- **Best for**: Recordings you want to keep with audio

##### 4. Export as File

**Markdown Export:**

```markdown
# Voice Recording

**Date**: January 27, 2026  
**Duration**: 02:15

## Summary

AI-generated summary of the recording...

## Transcript

Full transcript with formatting...
```

**TXT Export:**

```
Voice Recording
Date: January 27, 2026
Duration: 02:15

Summary:
AI-generated summary...

Transcript:
Plain text version...
```

**JSON Export:**

```json
{
  "title": "Voice Note",
  "date": "2026-01-27T13:00:00Z",
  "duration": 135,
  "summary": "AI summary...",
  "transcript": "Full transcript...",
  "metadata": {
    "wordCount": 45,
    "characterCount": 250,
    "language": "en"
  }
}
```

#### Preview & Statistics

Before saving, you'll see:

```
┌─────────────────────────────────────────┐
│ Preview                              │
│ ├─ Title: Voice Note                 │
│ ├─ Duration: 02:15                  │
│ ├─ Words: 45                        │
│ └─ Characters: 250                  │
│                                      │
│ [Preview Text...]                     │
│                                      │
│ ─────────────────────────────────────  │
│ Statistics                           │
│ ├─ Reading Time: ~1 min              │
│ ├─ Estimated Size: ~12 KB            │
│ └─ Language: English                 │
└─────────────────────────────────────────┘
```

### Save Workflow

1. **Click "Save & Done"** button
2. **Review smart recommendation**
3. **Choose save option** (follow recommendation or choose different)
4. **Preview content** (if exporting)
5. **Click confirm**
6. **See success toast** notification
7. **Navigate** to saved location to verify

### Save Confirmation

```
┌─────────────────────────────────────────┐
│ ✅ Success                            │
│                                       │
│ Recording saved successfully!            │
│ Location: Notes                       │
│                                       │
│ [Close]                               │
└─────────────────────────────────────────┘
```

---

## Voice Gallery Management

### Accessing the Gallery

1. **Navigate** to Voice Gallery section
2. **View all recordings** in grid or list mode
3. **Use search** to find specific recordings

### View Modes

- **Grid View**: Visual cards with thumbnails
- **List View**: Compact rows with details

### Search & Filters

#### Search Bar

- **Full-text search**: Searches titles, transcripts, summaries
- **Fuzzy matching**: Finds similar terms
- **Real-time results**: Updates as you type

#### Filter Options

- **Date Range**: Filter by creation date
- **Duration**: Filter by recording length
- **Tags**: Filter by assigned tags
- **Type**: Voice Note vs Voice Gallery

### Recording Cards

```
┌─────────────────────────────────────────┐
│ [▶] Voice Recording                 │
│ Jan 27, 2026 • 02:15 • 45 words  │
│ AI: Summary of the recording...      │
│                                      │
│ [📝 Edit] [🗑 Delete] [📤 Export] │
└─────────────────────────────────────────┘
```

### Actions

#### Play Audio

- Click the **Play button** (▶) on recording card
- Use audio controls to pause, skip, adjust speed

#### Edit Recording

1. Click **Edit button** (📝)
2. **Edit Recording Modal** opens
3. **Modify title, summary, transcript**
4. **Edit transcript segments** (if in segments mode)
5. **Click "Save Changes"** to save edits
6. **Or use "Save & Done"** for export options

#### Delete Recording

1. Click **Delete button** (🗑)
2. **Confirm** deletion in dialog
3. **Recording permanently removed**

#### Export Recording

- Click **Export button** (📤)
- Opens Export/Save modal
- Choose export format
- Download file

### Bulk Operations

1. **Select multiple recordings** (checkboxes)
2. **Bulk actions menu** appears
3. **Choose action**:
   - Delete all selected
   - Export all as JSON
   - Tag all selected
   - Pin all selected

---

## Advanced Features

### Segment Editor

For granular control over transcripts:

1. **Open Edit Recording Modal**
2. **Switch to "Edit Segments" mode**
3. **View individual segments** with timestamps
4. **Edit** or **delete** specific segments
5. **Restore deleted segments** if needed
6. **Save** changes to update transcript

**Use Cases:**

- Remove filler words ("um", "uh")
- Delete irrelevant sections
- Fix transcription errors
- Reorganize content

### Audio Quality Monitoring

Real-time audio quality indicators:

- **Signal strength**: Visual indicator of microphone level
- **Noise detection**: Warns about background noise
- **Clipping detection**: Alerts if audio is too loud

### Keyboard Shortcuts

#### Recording Controls

- `Space` - Start recording (if idle)
- `Escape` - Stop recording
- `C` - Collapse/expand voice recorder

#### Editing

- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Ctrl+U` - Underline
- `Ctrl+`` - Code
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo

#### Saving

- `S` - Save to Notes (in review mode)
- `G` - Save to Gallery (in review mode)

### History Management

Full undo/redo support:

- **Automatic history**: Every edit creates a history entry
- **Navigate history**: Use undo/redo buttons or shortcuts
- **Persistent**: History maintained during session

---

## Troubleshooting

### Recording Issues

**Problem:** Can't start recording

- **Solution:** Check microphone permissions
- **Solution:** Ensure no other app is using microphone
- **Solution:** Refresh the page and try again

**Problem:** Audio quality is poor

- **Solution:** Check microphone connection
- **Solution:** Reduce background noise
- **Solution:** Speak closer to microphone

**Problem:** Visualizer not showing

- **Solution:** Check if browser supports AudioContext
- **Solution:** Ensure recording is actually active

### Transcription Issues

**Problem:** Transcription is taking too long

- **Solution:** Recording length affects processing time
- **Solution:** Check internet connection
- **Solution:** Try again (temporary API issue)

**Problem:** Transcription is inaccurate

- **Solution:** Speak clearly and at moderate pace
- **Solution:** Reduce background noise
- **Solution:** Use segment editor to fix errors

**Problem:** No summary generated

- **Solution:** Recording may be too short
- **Solution:** Check API connection status
- **Solution:** Retry transcription

### Editing Issues

**Problem:** Can't click in textarea

- **Solution:** Refresh the page
- **Solution:** Check if FormatToolbar is blocking access
- **Solution:** Try clicking different area

**Problem:** Format buttons not working

- **Solution:** Ensure text is selected
- **Solution:** Try keyboard shortcuts
- **Solution:** Check browser console for errors

### Export/Save Issues

**Problem:** Export file not downloading

- **Solution:** Check browser download permissions
- **Solution:** Try different browser
- **Solution:** Check internet connection

**Problem:** Recording not appearing in gallery

- **Solution:** Wait a few seconds (may be processing)
- **Solution:** Refresh the page
- **Solution:** Check if save completed successfully

### General Issues

**Problem:** Changes not saving

- **Solution:** Ensure you clicked "Save Changes"
- **Solution:** Check for error messages
- **Solution:** Verify you have write permissions

**Problem:** App is slow

- **Solution:** Close other browser tabs
- **Solution:** Clear browser cache
- **Solution:** Check internet connection

---

## Best Practices

### Recording Quality

1. **Environment**: Quiet room, minimal background noise
2. **Microphone**: Quality mic positioned 6-12 inches away
3. **Speech**: Clear, moderate pace, natural pauses
4. **Length**: Keep recordings focused (10-15 minutes optimal)

### Transcription Workflow

1. **Review immediately** while recording is fresh in mind
2. **Edit for accuracy** - fix transcription errors
3. **Add formatting** - use headings, lists for structure
4. **Create summary** - if AI summary is insufficient
5. **Tag appropriately** - for easy retrieval later

### Save Strategy

1. **Quick notes** → Save as Note
2. **Meeting recordings** → Save as Document
3. **Important recordings** → Save as Voice Note (keep audio)
4. **Long recordings** → Export as Markdown for documentation

### Organization

1. **Use tags** consistently
2. **Pin important recordings**
3. **Regular cleanup** - delete unnecessary recordings
4. **Backup exports** - export JSON for safety

---

## API Integration

### Google Gemini 2.5 Flash

Voice Studio uses Google Gemini 2.5 Flash for:

- **Audio transcription**: Streaming transcription with high accuracy
- **Summarization**: Intelligent summary generation
- **Language detection**: Automatic language identification

### Local Processing

- **Audio capture**: Browser MediaRecorder API
- **Audio quality**: Web Audio API
- **File processing**: FileReader API
- **Storage**: IndexedDB for recordings

---

## Technical Details

### Recording Formats

- **Primary**: WebM (browser standard)
- **Sample rate**: 48kHz
- **Channels**: Stereo
- **Bitrate**: Variable (128-256 kbps)

### Storage

- **Audio files**: Base64 encoded in IndexedDB
- **Transcripts**: Plain text with markdown formatting
- **Metadata**: JSON structure with timestamps
- **Cache**: Browser local storage for preferences

### Performance

- **Max recording length**: 2 hours (practical limit)
- **Processing time**: 3-10 seconds per minute of audio
- **Storage**: ~1 MB per minute of audio (compressed)
- **Memory**: ~50-100 MB during active recording

---

## Security & Privacy

- **Local storage**: Recordings stored locally in browser
- **No cloud upload** (unless explicitly exported)
- **API usage**: Google Gemini only for transcription
- **Data retention**: Recordings persist until deleted
- **Encryption**: Audio not encrypted (browser storage)

---

## Frequently Asked Questions

**Q: Can I import existing audio files?**  
A: Not currently. Voice Studio only records from microphone.

**Q: Can I transcribe multiple languages?**  
A: Yes, Gemini 2.5 Flash supports multiple languages.

**Q: How long can recordings be?**  
A: Up to 2 hours, but 10-15 minutes is optimal for UX.

**Q: Can I edit the audio?**  
A: No, only the transcript can be edited.

**Q: Are recordings backed up?**  
A: No, export recordings to save as backups.

**Q: Can I share recordings?**  
A: Yes, export as file and share via email, cloud, etc.

**Q: Does it work offline?**  
A: Recording works offline, but transcription requires internet.

---

## Version History

### Version 2.1 (January 27, 2026)

- ✅ Added Export/Save modal with smart recommendations
- ✅ Implemented multiple export formats (Markdown, TXT, JSON)
- ✅ Fixed FormatToolbar accessibility issues
- ✅ Added character and word count statistics
- ✅ Improved transcript editing workflow
- ✅ Enhanced Save & Done button visibility
- ✅ Fixed critical syntax error preventing Voice Studio from loading
- ✅ Fixed "Save as Note" function (was calling non-existent method)
- ✅ Moved Save controls below transcript/summary for better UX flow
- ✅ Fixed Play button in Voice Gallery

### Version 2.0 (January 2026)

- ✅ Initial Voice Studio implementation
- ✅ Google Gemini 2.5 Flash integration
- ✅ Real-time transcription
- ✅ Voice Gallery with search and filters
- ✅ Segment editor
- ✅ FormatToolbar for rich text editing

---

## Support & Feedback

For issues, questions, or feedback:

- Check [Troubleshooting](#troubleshooting) section
- Review [Frequently Asked Questions](#frequently-asked-questions)
- Report bugs via GitHub issues
- Submit feature requests via GitHub discussions

---

**Related Documentation:**

- [Component Guide](./01_COMPONENTS.md) - Voice Studio components
- [API Reference](./API_REFERENCE.md) - Voice API endpoints
- [Getting Started](./GETTING_STARTED.md) - Quick start guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - General troubleshooting

**Last Updated:** January 27, 2026  
**Maintained By:** Development Team  
**Status:** ✅ Production Ready
