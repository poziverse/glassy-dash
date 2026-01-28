# Voice Studio Export & Save Workflow Plan

## Executive Summary

After a user edits a voice recording transcript in Voice Studio, they need clear options to save, export, or convert the content. This plan outlines a user-centric workflow that provides smart defaults while offering flexibility.

## Current System Analysis

### Voice Studio Capabilities
- Recordings with transcripts, summaries, audio data, and tags
- Two types: 'notes' (short) and 'gallery' (long)
- Edit modal with FormatToolbar for rich text editing
- Existing: Document linking, VoiceToTask, DocumentLinker

### Notes System
- NoteCard components with Composer
- Pinned, archived, tags support
- Bulk download as ZIP

### Documents System
- Simple CRUD with title and content
- Soft delete (trash) functionality

## Proposed Solution: Smart Export Workflow

### Core Concept
After editing a transcript, provide intelligent options based on content analysis while giving users full control.

### User Flow
```
1. User records/transcribes audio
2. User edits transcript in EditRecordingModal
3. User clicks "Save & Done" or "Export Options"
4. Export/Save Modal appears with smart suggestions
5. User chooses destination (Note, Document, Voice Note, or Export File)
6. Content is saved/exported with metadata preserved
```

## Technical Implementation

### 1. Content Analysis Module

```javascript
// utils/contentAnalysis.js
export function analyzeContent(recording) {
  const transcript = recording.transcript || ''
  const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length
  const lineCount = transcript.split('\n').length
  
  // Determine best destination
  let recommendation = 'voice-note'
  let reasoning = 'Keep as voice note for audio reference'
  
  if (lineCount > 50 || wordCount > 500) {
    recommendation = 'document'
    reasoning = 'Long content - better suited for document'
  } else if (lineCount > 10 || wordCount > 100) {
    recommendation = 'note'
    reasoning = 'Medium length - works well as note'
  }
  
  return {
    wordCount,
    lineCount,
    characterCount: transcript.length,
    readingTime: Math.ceil(wordCount / 200 * 60), // minutes
    recommendation,
    reasoning,
    hasFormatting: /\*\*|`|==|#/.test(transcript),
    hasLists: /^[-*+]\s|^1\.\s/m.test(transcript)
  }
}
```

### 2. Export/Save Modal Component

```jsx
// components/voice/ExportSaveModal.jsx
export default function ExportSaveModal({ recording, onClose, onSave }) {
  const analysis = analyzeContent(recording)
  const [selectedOption, setSelectedOption] = useState(analysis.recommendation)
  const [exportFormat, setExportFormat] = useState('markdown')
  
  const handleExport = async () => {
    switch(selectedOption) {
      case 'note':
        await convertToNote(recording)
        break
      case 'document':
        await convertToDocument(recording)
        break
      case 'voice-note':
        await keepAsVoiceNote(recording)
        break
      case 'export':
        await downloadExport(recording, exportFormat)
        break
    }
    onSave(recording.id)
  }
  
  return (
    <Modal>
      <h2>Save Your Transcript</h2>
      <p>{analysis.reasoning}</p>
      
      <Options>
        <Option 
          value="note"
          icon={<NoteIcon />}
          label="Save as Note"
          description={`Best for ${analysis.wordCount} words`}
          recommended={analysis.recommendation === 'note'}
        />
        <Option 
          value="document"
          icon={<DocumentIcon />}
          label="Save as Document"
          description={`Long-form content`}
          recommended={analysis.recommendation === 'document'}
        />
        <Option 
          value="voice-note"
          icon={<MicIcon />}
          label="Keep as Voice Note"
          description="Preserve audio & transcript"
          recommended={analysis.recommendation === 'voice-note'}
        />
        <Option 
          value="export"
          icon={<DownloadIcon />}
          label="Export File"
          description="Download for external use"
        />
      </Options>
      
      <FormatSelector value={exportFormat} onChange={setExportFormat} />
      
      <Buttons>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleExport} primary>Save</Button>
      </Buttons>
    </Modal>
  )
}
```

### 3. Conversion Functions

```javascript
// utils/contentConverter.js
import { useNotesStore } from '../stores/notesStore'
import { useDocsStore } from '../stores/docsStore'

// Convert voice recording to Note
export async function convertToNote(recording) {
  const notesStore = useNotesStore.getState()
  
  const noteData = {
    title: recording.title || 'Voice Transcript',
    content: `
## Voice Note
*Recorded on ${new Date(recording.createdAt).toLocaleDateString()}*

### Summary
${recording.summary || 'No summary provided'}

### Transcript
${recording.transcript}
    `.trim(),
    tags: [...(recording.tags || []), 'voice-transcript'],
    background: 'indigo', // Voice notes get distinctive color
    pinned: false
  }
  
  return notesStore.createNote(noteData)
}

// Convert voice recording to Document
export async function convertToDocument(recording) {
  const docsStore = useDocsStore.getState()
  
  const docId = docsStore.createDoc()
  docsStore.updateDoc(docId, {
    title: recording.title || 'Voice Transcript',
    content: `
# Voice Transcript

**Date:** ${new Date(recording.createdAt).toLocaleString()}  
**Duration:** ${formatDuration(recording.duration)}

---

## Summary
${recording.summary || 'No summary provided'}

---

## Full Transcript
${recording.transcript}
    `.trim(),
    tags: ['voice-transcript', ...(recording.tags || [])]
  })
  
  return docId
}

// Keep as voice note but mark as processed
export async function keepAsVoiceNote(recording) {
  const voiceStore = useVoiceStore.getState()
  voiceStore.editRecording(recording.id, {
    processed: true,
    processedAt: new Date().toISOString()
  })
  return recording.id
}

// Export to file
export async function downloadExport(recording, format) {
  let content, filename, mimeType
  
  switch(format) {
    case 'markdown':
      content = generateMarkdown(recording)
      filename = `${recording.title || 'transcript'}.md`
      mimeType = 'text/markdown'
      break
    case 'txt':
      content = generatePlainText(recording)
      filename = `${recording.title || 'transcript'}.txt`
      mimeType = 'text/plain'
      break
    case 'json':
      content = generateJSON(recording)
      filename = `${recording.title || 'transcript'}.json`
      mimeType = 'application/json'
      break
    case 'pdf':
      // Would use a library like jsPDF or react-pdf
      content = await generatePDF(recording)
      filename = `${recording.title || 'transcript'}.pdf`
      mimeType = 'application/pdf'
      break
  }
  
  // Download logic
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

### 4. Enhanced EditRecordingModal

```jsx
// Add to EditRecordingModal.jsx footer
<div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
  <button
    onClick={handleSave}
    disabled={!hasChanges}
    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    <Save size={18} />
    Save Changes
  </button>
  <button
    onClick={() => setShowExportModal(true)}
    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-500 transition-colors"
  >
    <Download size={18} />
    Save & Done
  </button>
</div>

{showExportModal && (
  <ExportSaveModal
    recording={recording}
    onClose={() => setShowExportModal(false)}
    onSave={() => {
      setShowExportModal(false)
      onClose()
    }}
  />
)}
```

### 5. Move/Categorize Voice Notes

```javascript
// Add to voiceStore.js
// Move voice note to different category
moveRecording: (id, targetType) => set(state => ({
  recordings: state.recordings.map(r =>
    r.id === id 
      ? { ...r, type: targetType, updatedAt: new Date().toISOString() } 
      : r
  ),
})),

// Quick convert to note/document
quickConvertToNote: (id) => {
  const recording = get().recordings.find(r => r.id === id)
  if (!recording) return null
  
  const noteId = convertToNote(recording)
  // Add reference back to voice recording
  get().editRecording(id, {
    linkedNoteId: noteId,
    convertedAt: new Date().toISOString()
  })
  
  return noteId
},

quickConvertToDocument: (id) => {
  const recording = get().recordings.find(r => r.id === id)
  if (!recording) return null
  
  const docId = convertToDocument(recording)
  get().editRecording(id, {
    linkedDocumentId: docId,
    convertedAt: new Date().toISOString()
  })
  
  return docId
}
```

## UX Considerations

### Smart Recommendations
- **< 10 lines or < 100 words**: Keep as Voice Note
- **10-50 lines or 100-500 words**: Save as Note
- **> 50 lines or > 500 words**: Save as Document

### Export Formats Priority
1. **Markdown** - Default (preserves formatting)
2. **Plain Text** - Simple compatibility
3. **JSON** - Full data with metadata
4. **PDF** - Professional sharing (optional, requires library)

### Visual Design
- Show content statistics (words, lines, reading time)
- Highlight recommendation with visual badge
- Allow quick override of recommendation
- Preview of converted content
- Metadata preservation tags

## Implementation Phases

### Phase 1: Core Export Modal
- Create ExportSaveModal component
- Implement content analysis
- Add "Save & Done" button to EditRecordingModal
- Basic conversion functions (Note, Document)

### Phase 2: Export Formats
- Markdown export
- Plain text export
- JSON export
- File download utilities

### Phase 3: Enhanced Voice Note Management
- Quick convert actions in gallery
- Move between 'notes' and 'gallery' types
- Link tracking between voice notes and converted items

### Phase 4: Advanced Features (Optional)
- PDF export (integrate jsPDF or react-pdf)
- Bulk export from gallery
- Export templates
- Custom formatting options

## Benefits

1. **User Flexibility**: Users can choose the best destination for their content
2. **Smart Defaults**: System suggests appropriate options based on content
3. **Preserved Context**: Metadata and links track conversions
4. **Multiple Workflows**: Export, convert, or keep as voice note
5. **Professional Exports**: Shareable formats for external use

## Technical Risks & Mitigations

### Risk: Cross-store data integrity
- **Mitigation**: Use unique IDs and store references in both directions

### Risk: Formatting loss on export
- **Mitigation**: Use Markdown as primary format, supports rich text

### Risk: User confusion with multiple options
- **Mitigation**: Clear recommendations, simple UI, preview functionality

### Risk: Large recordings causing performance issues
- **Mitigation**: Async processing, progress indicators, chunking

## Success Metrics

1. Export/Save modal usage rate
2. Conversion success rate
3. User satisfaction with recommendations
4. Reduced need for manual copying between sections
5. Increased cross-feature usage (voice → notes/docs)

## Open Questions

1. Should we keep the original voice note after conversion?
   - Recommendation: Yes, mark as converted with reference link
   
2. Should we support converting back to voice note?
   - Recommendation: No, voice notes are the source of truth
   
3. Should we support editing in destination after conversion?
   - Recommendation: Yes, but no sync back to voice note (preserve independence)

4. Should we support bulk conversion from gallery?
   - Recommendation: Phase 3 feature, good for processing many recordings

## Conclusion

This hybrid approach provides the best of both worlds:
- **Voice Studio remains focused** on audio/transcription workflow
- **Flexible export options** for different use cases
- **Smart recommendations** reduce decision fatigue
- **Cross-feature integration** enables seamless content flow

The implementation is phased, allowing each stage to deliver value while building toward a comprehensive solution.