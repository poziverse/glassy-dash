# AI Integration Guide

**Version:** 2.0  
**Last Updated:** January 28, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Gemini-First Architecture](#gemini-first-architecture)
3. [Setup & Configuration](#setup--configuration)
4. [Voice Studio AI Features](#voice-studio-ai-features)
5. [AI Assistant Sidebar](#ai-assistant-sidebar)
6. [RAG System](#rag-system)
7. [Security & Privacy](#security--privacy)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

GLASSYDASH implements a **Gemini-First** AI architecture that provides intelligent assistance across two primary domains:

1. **Voice Transcription** - Real-time audio-to-text conversion with AI-powered summarization
2. **AI Assistant** - Context-aware chat and intelligent insights using your notes

The system uses Google Gemini 2.5 Flash as the primary AI engine with optional local fallback using Llama 3.2 for privacy-focused users.

### Key Features

- ✅ **Real-time Transcription** - Streaming audio processing with Google Gemini
- ✅ **Context-Aware Assistance** - RAG system using your notes as grounding data
- ✅ **Dual AI Strategy** - Cloud-first with local privacy option
- ✅ **Smart Actions** - One-click formatting, tagging, and organization
- ✅ **Multi-Language Support** - Transcription in multiple languages
- ✅ **Enterprise Privacy** - Zero data retention for AI interactions

---

## Gemini-First Architecture

### Primary AI Engine: Google Gemini 2.5 Flash

**Why Gemini-First?**

1. **High Performance** - Consistent, fast responses across all deployments
2. **100% Availability** - Works on hosted, cloud, and self-hosted instances
3. **Advanced Capabilities** - Multimodal support for audio, text, and images
4. **Enterprise Grade** - SOC2 compliant with zero data retention policy
5. **Cost Effective** - Efficient token usage for production deployments

### Fallback Strategy: Local Llama 3.2

**When to Use Local AI:**

- Privacy-focused deployments requiring offline operation
- Environments without internet connectivity
- Regulatory requirements preventing cloud AI usage
- Development and testing scenarios

**Implementation:**

```javascript
// Automatic fallback logic
if (!GEMINI_API_KEY || geminiUnavailable) {
  // Use local Llama 3.2 via Ollama
  return await localAiQuery(prompt, context)
}

// Default to Gemini
return await geminiQuery(prompt, context)
```

### AI Engine Selection Flow

```
┌─────────────────────────────────────────┐
│         User Request                  │
└────────────────┬────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ API Key Set?   │
        └───────┬────────┘
                │
       ┌────────┴────────┐
       │ Yes            │ No
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│ Try Gemini   │  │ Use Local AI │
└──────┬───────┘  │ (Llama 3.2)  │
       │          └──────────────┘
       ▼
  ┌────────────┐
  │ Available? │
  └─────┬──────┘
        │
   ┌────┴────┐
   │ Yes      │ No
   ▼          ▼
┌────────┐ ┌──────────────┐
│ Use    │ │ Fallback to  │
│ Gemini │ │ Local AI     │
└────────┘ └──────────────┘
```

---

## Setup & Configuration

### Prerequisites

1. **Google Cloud Project** - Create project at [console.cloud.google.com](https://console.cloud.google.com)
2. **Gemini API Enabled** - Enable Generative Language API in project
3. **API Key** - Generate API key with appropriate restrictions

### Environment Configuration

**Required Variables:**

```bash
# .env file

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
AI_ENABLED=true

# Optional: Local AI Configuration (Ollama)
OLLAMA_HOST=http://localhost:11434
LOCAL_AI_MODEL=llama3.2:1b

# Development/Production
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

### API Key Security Best Practices

**1. Restrict API Key Scope:**

- Go to Google Cloud Console → APIs & Services → Credentials
- Click "Edit" on your API key
- Set Application Restrictions:
  - **HTTP referrers**: `*.yourdomain.com/*`
- Set API Restrictions:
  - **Restrict key**: Select "Generative Language API"

**2. Environment Variable Storage:**

```bash
# Never commit .env file to git
echo ".env" >> .gitignore

# Use different keys for dev/staging/prod
# .env.development
GEMINI_API_KEY=dev_api_key

# .env.production
GEMINI_API_KEY=prod_api_key
```

**3. Key Rotation:**

```bash
# Rotate keys every 90 days
# 1. Generate new key in Google Cloud Console
# 2. Update .env file
# 3. Restart application
# 4. Delete old key after 7 days
```

### Local AI Setup (Optional)

**Install Ollama:**

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

**Download Llama 3.2 Model:**

```bash
# Download 1B parameter model (fast, ~1GB)
ollama pull llama3.2:1b

# Or larger model for better quality (slower, ~4GB)
ollama pull llama3.2:3b
```

**Test Local AI:**

```bash
# Start Ollama server
ollama serve

# Test inference
ollama run llama3.2 "Hello, how are you?"
```

### Verification

**Test Gemini Integration:**

```bash
# Start application
npm start

# Check logs for:
# "AI Model: Ready" - Gemini connected
# "AI Model: Fallback" - Using local AI
```

**Test Voice Transcription:**

1. Navigate to Voice Studio
2. Record a short audio clip (10-15 seconds)
3. Wait for transcription
4. Verify transcript appears with AI summary

**Test AI Assistant:**

1. Open Notes view
2. Click sparkle icon or press `⌘J`
3. Type: "Summarize my recent notes"
4. Verify intelligent response with note references

---

## Voice Studio AI Features

### Transcription Workflow

**1. Audio Capture:**

```javascript
// Browser MediaRecorder API
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus'
})

// Record audio chunks
mediaRecorder.ondataavailable = e => {
  audioChunks.push(e.data)
}
```

**2. Base64 Encoding:**

```javascript
// Convert to base64 for API transmission
const reader = new FileReader()
reader.readAsDataURL(audioBlob)
reader.onloadend = () => {
  const base64Audio = reader.result.split(',')[1]
  transcribeAudio(base64Audio)
}
```

**3. Gemini Streaming Transcription:**

```javascript
// server/gemini.js
async function transcribeAudioStream(base64Audio, onChunk, onComplete) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
  
  const result = await model.generateContentStream([
    {
      inlineData: {
        data: base64Audio,
        mimeType: "audio/webm"
      }
    },
    "Transcribe this audio accurately with punctuation and formatting."
  ])
  
  // Stream results in real-time
  for await (const chunk of result.stream) {
    const text = chunk.text()
    onChunk(text) // Update UI incrementally
  }
  
  onComplete() // Signal completion
}
```

**4. AI Summarization:**

```javascript
// Automatic summary generation
const summaryPrompt = `
Analyze this transcript and provide:
1. A concise 2-3 sentence summary
2. 3-5 key points as bullet points
4. Action items (if any)

Transcript: ${transcript}
`

const summary = await geminiQuery(summaryPrompt)
```

### Audio Quality Monitoring

**Real-time Indicators:**

- **Signal Strength** - Visual meter showing microphone level
- **Noise Detection** - Warns about background noise
- **Clipping Alert** - Indicates audio is too loud

**Quality Tips:**

1. Use quality microphone (6-12 inches from speaker)
2. Record in quiet environment
3. Speak clearly at moderate pace
4. Avoid background noise
5. Test recording quality before important sessions

### Supported Languages

Gemini 2.5 Flash supports automatic language detection and transcription for:

- English
- Spanish
- French
- German
- Italian
- Portuguese
- Japanese
- Korean
- Chinese (Simplified/Traditional)

---

## AI Assistant Sidebar

### Interface

**Access Methods:**

- Click sparkle icon (✨) in sidebar
- Keyboard shortcut: `⌘J` (Mac) or `Ctrl+J` (Windows/Linux)

**Layout:**

```
┌─────────────────────────────────────┐
│ ✨ AI Assistant                │
├─────────────────────────────────────┤
│                                 │
│ [Chat Messages Area]              │
│   User: How do I...            │
│   AI: Based on your notes...     │
│                                 │
│ [Input Field]                    │
│ [Send Button]                    │
└─────────────────────────────────────┘
```

### Quick Actions

**Format Notes:**

- Applies consistent formatting to selected notes
- Adds headings, bullet points, and structure
- Best for: Meeting notes, lecture notes

**Find Duplicates:**

- Identifies similar notes across workspace
- Highlights potential duplicates
- Best for: Cleaning up large note collections

**Organize Thoughts:**

- Suggests tags and categorization
- Groups related content
- Best for: Unstructured brainstorming sessions

### Context-Aware Responses

**How RAG Works:**

```
User Query → RAG System
              ↓
    Retrieve Context (Top 100 recent notes)
              ↓
    Generate Grounded Response (Gemini)
              ↓
    Include Note References in Response
```

**Example:**

**User Query:** "What are my project deadlines?"

**AI Response:**
```
Based on your notes, you have 3 upcoming project deadlines:

1. **Website Launch** - Feb 15, 2026
   Source: "Q1 Planning" note
   Reference: #project-management

2. **API Integration** - Feb 28, 2026
   Source: "Technical Roadmap" note
   Reference: #development

3. **User Testing** - Mar 10, 2026
   Source: "Testing Schedule" note
   Reference: #qa
```

### Virtual Tools

**Image Generation:**

```javascript
// Generate images from text descriptions
const imagePrompt = "A futuristic city with flying cars"
const imageData = await generateImage(imagePrompt)
```

**Title Suggestions:**

- Analyzes note content
- Suggests 3-5 title options
- One-click application

**Task Detection:**

- Identifies action items in notes
- Extracts tasks with due dates
- Links to checklist creation

---

## RAG System

### Retrieval-Augmented Generation

**Purpose:** Provide accurate, context-aware responses by grounding AI in your actual notes.

### How It Works

**1. Context Retrieval:**

```javascript
// Retrieve relevant notes based on query similarity
async function retrieveContext(query, maxResults = 100) {
  const notes = await getRecentNotes(maxResults)
  
  // Rank by relevance to query
  const ranked = rankByRelevance(notes, query)
  
  return ranked.slice(0, 20) // Use top 20 for context
}
```

**2. Grounding:**

```javascript
// Provide context to AI
const prompt = `
You are an AI assistant for a notes application.
Answer the user's question based ONLY on the following context.

Context:
${contextNotes.map(n => `- ${n.title}: ${n.content}`).join('\n')}

User Question: ${query}

If the context doesn't contain the answer, say so honestly.
Always cite which notes you're referencing.
`

const response = await geminiQuery(prompt)
```

**3. Response Generation:**

- AI uses retrieved notes as source of truth
- Responses include note references
- Prevents hallucination by restricting to context

### Context Window Management

**Active Notes:** Top 100 most recent notes
**Archived Notes:** Included in context when relevant
**Content Truncation:** Each note limited to 2000 characters for context
**Total Context:** ~100k tokens maximum

### Archived Content Integration

**Why Include Archives:**

- Historical context for long-running projects
- Access to past decisions and discussions
- Complete picture of user's knowledge base

**Implementation:**

```javascript
// Search across both active and archived
const allNotes = await db.prepare(`
  SELECT * FROM notes
  WHERE user_id = ?
  AND (archived = 0 OR archived = 1)
  ORDER BY updated_at DESC
  LIMIT 200
`).all(userId)
```

---

## Security & Privacy

### Data Privacy Guarantees

**1. Zero Data Retention (Gemini):**

```
Request → Process → Response → DELETE
         ↓
   No storage beyond request duration
```

- User notes sent to AI are ephemeral
- No training data collection
- Enterprise API policy compliance
- Automatic request logging disabled

**2. Local AI Privacy (Llama 3.2):**

- 100% offline processing
- No data leaves your device
- Complete control over model weights

### API Key Security

**Best Practices:**

✅ Store in environment variables
✅ Restrict API key scope
✅ Use different keys per environment
✅ Rotate keys every 90 days
✅ Monitor usage in Google Cloud Console

❌ Never commit to version control
❌ Never share publicly
❌ Never embed in client-side code
❌ Never use production keys in development

### Encryption

**In Transit:**
- HTTPS/TLS 1.3 for all API calls
- Certificate pinning for production

**At Rest:**
- Environment variables encrypted by OS
- Database encryption (optional with SQLite extension)

### Compliance

**SOC2 Compliant:** Google Gemini API
**GDPR Compliant:** User data control and deletion
**CCPA Compliant:** Right to deletion implemented
**HIPAA Ready:** Not certified, but architecture compliant

---

## Troubleshooting

### Common Issues

**Issue: "AI Model: Fallback" in logs**

**Cause:** Gemini API key not set or invalid

**Solution:**
```bash
# Check .env file
cat .env | grep GEMINI_API_KEY

# Verify key is set and valid
# Regenerate key if necessary in Google Cloud Console

# Restart application
npm start
```

**Issue: Transcription is inaccurate**

**Cause:** Poor audio quality or background noise

**Solution:**
1. Use quality microphone
2. Record in quiet environment
3. Speak clearly and at moderate pace
4. Try editing transcript manually
5. Use segment editor to fix errors

**Issue: AI Assistant not responding**

**Cause:** API quota exceeded or network issue

**Solution:**
```bash
# Check API usage in Google Cloud Console
# Quotas → Generative Language API

# Check network connectivity
curl -I https://generativelanguage.googleapis.com

# If quota exceeded, request quota increase
# or wait for reset (monthly)
```

**Issue: Slow response times**

**Cause:** Large context window or network latency

**Solution:**
1. Reduce number of notes in RAG context
2. Check internet connection speed
3. Try local AI for faster responses
4. Optimize prompt length

**Issue: Local AI not working**

**Cause:** Ollama not installed or model not downloaded

**Solution:**
```bash
# Check Ollama is running
ollama list

# Start Ollama server
ollama serve

# Download model if needed
ollama pull llama3.2:1b

# Check OLLAMA_HOST in .env
echo $OLLAMA_HOST
# Should be: http://localhost:11434
```

### Debug Mode

**Enable AI Debugging:**

```bash
# Add to .env
AI_DEBUG=true
VERBOSE_LOGGING=true

# Check logs for:
# - API request/response details
# - Token usage
# - Latency metrics
# - Error traces
```

**Log Location:**
- Development: Console output
- Production: `/var/log/glassy-dash/ai.log`

---

## Best Practices

### For Voice Transcription

**1. Optimize Audio Quality:**
- Use external microphone when possible
- Position 6-12 inches from speaker
- Test recording before important sessions
- Use noise-canceling microphone if available

**2. Optimize Content:**
- Speak clearly and at moderate pace
- Use natural pauses for punctuation
- Avoid filler words ("um", "uh")
- Enunciate names and technical terms

**3. Post-Processing:**
- Review transcript immediately
- Edit for accuracy
- Add formatting (headings, lists)
- Verify AI summary accuracy

### For AI Assistant

**1. Write Clear Queries:**
- Be specific in your questions
- Provide context when needed
- Use natural language
- Example: "Summarize my Q1 project planning notes" vs "Summarize notes"

**2. Leverage Quick Actions:**
- Use "Format Notes" for meeting notes
- Use "Find Duplicates" for cleanup
- Use "Organize Thoughts" for brainstorming

**3. Verify Responses:**
- Check note references
- Verify accuracy with source notes
- Use as assistant, not authority
- Combine with human judgment

### For Context Management

**1. Organize Notes:**
- Use consistent tagging
- Archive completed projects
- Delete unnecessary notes
- Keep active notes under 100 for best performance

**2. Optimize Search:**
- Use descriptive titles
- Include keywords in content
- Add relevant tags
- Update notes regularly

**3. Monitor Performance:**
- Check AI response times
- Monitor API usage
- Review token consumption
- Adjust RAG context size if needed

### For Security

**1. Protect API Keys:**
- Never share keys publicly
- Rotate keys regularly
- Use environment-specific keys
- Monitor usage in console

**2. Understand Privacy:**
- Know what data is sent to AI
- Understand ephemeral processing
- Review privacy policies
- Use local AI for sensitive data

**3. Maintain Compliance:**
- Follow data retention policies
- Enable logging for audit trails
- Implement access controls
- Regular security audits

---

## Performance Metrics

### Expected Response Times

| Operation | Expected Time | Notes |
|------------|---------------|-------|
| Voice Transcription | 3-10 seconds | Per minute of audio |
| AI Assistant Query | 1-3 seconds | Simple queries |
| Complex RAG Query | 3-8 seconds | With large context |
| Image Generation | 5-15 seconds | Depends on prompt |
| Local AI Query | 2-5 seconds | Llama 3.2:1b |

### Monitoring

**Gemini API Console:**
- Token usage per day
- Cost per month
- Error rate
- Latency percentiles

**Application Logs:**
- Request/response times
- Cache hit rates
- Error frequency
- Fallback rate (Gemini → Local)

---

## API Reference

### Transcription

**Endpoint:** Internal (not exposed)

**Function:** `transcribeAudioStream(base64Audio, onChunk, onComplete)`

**Parameters:**
- `base64Audio` (string) - Base64-encoded audio data
- `onChunk` (function) - Callback for streaming results
- `onComplete` (function) - Callback when complete

**Returns:** Promise<void>

### AI Query

**Endpoint:** Internal (not exposed)

**Function:** `geminiQuery(prompt, context)`

**Parameters:**
- `prompt` (string) - User query or instruction
- `context` (array) - Array of note objects for RAG

**Returns:** Promise<string> - AI response

### Image Generation

**Endpoint:** Internal (not exposed)

**Function:** `generateImage(prompt)`

**Parameters:**
- `prompt` (string) - Image description

**Returns:** Promise<string> - Base64-encoded image data

---

## Related Documentation

- [Voice Studio Guide](./VOICE_STUDIO_GUIDE.md) - Voice recording and transcription
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Architecture](./ARCHITECTURE.md) - System architecture details
- [Security](./SECURITY.md) - Security best practices
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

---

**Last Updated:** January 28, 2026  
**Maintained By:** Development Team  
**Status:** ✅ Production Ready