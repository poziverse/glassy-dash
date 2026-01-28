# AiAssistant Component

**Component Path:** `src/components/AiAssistant.jsx`  
**Version:** 2.0  
**Last Updated:** January 28, 2026  
**Status:** Production Ready

---

## Overview

`AiAssistant` is a premium glassmorphic slideout sidebar that provides intelligent AI-powered assistance for note-taking workflows. It features context-aware chat, quick actions, and virtual tools powered by Google Gemini 2.5 Flash with optional local Llama 3.2 fallback.

### Key Features

- **Premium Glassmorphic UI** - Sleek, translucent sidebar design matching app aesthetics
- **Context-Aware Chat** - RAG-based responses using active notes as grounding
- **Quick Actions** - One-click formatting, duplicate detection, and organization
- **Virtual Tools** - Image generation, title suggestions, task detection
- **Keyboard Shortcut** - Toggle with `⌘J` (Mac) or `Ctrl+J` (Windows/Linux)
- **Auto-scrolling History** - Seamless chat experience with message bubbles
- **Tool Widgets** - Visual display of AI tool execution results

---

## Component Interface

### Props

| Prop | Type | Required | Default | Description |
|-------|-------|-----------|-----------|-------------|
| `isOpen` | `boolean` | Yes | `false` | Controls sidebar visibility (open/closed) |
| `onClose` | `function` | Yes | - | Callback when user closes sidebar |
| `dark` | `boolean` | Yes | - | Dark mode flag for styling |
| `aiEngine` | `string` | No | `'gemini'` | Current AI engine ('gemini' or 'local') |
| `localAiEnabled` | `boolean` | Yes | `false` | Whether local AI is available |
| `onQuery` | `function` | Yes | - | Callback for AI queries |

### State Management

```javascript
const AiAssistant = ({ isOpen, onClose, dark, aiEngine, localAiEnabled, onQuery }) => {
  // Internal state
  const [messages, setMessages] = useState([])      // Chat history
  const [input, setInput] = useState('')           // Current input
  const [isLoading, setIsLoading] = useState(false) // Loading state
  const [activeTool, setActiveTool] = useState(null) // Current virtual tool
  const [toolResult, setToolResult] = useState(null) // Tool execution result
}
```

---

## Component Structure

```jsx
<AiAssistant isOpen={true} onClose={handleClose} dark={true}>
  <div className="glass-sidebar">
    {/* Header */}
    <div className="ai-header">
      <Sparkles />
      <h3>AI Assistant</h3>
      <button onClick={onClose} className="close-btn">
        <X />
      </button>
    </div>

    {/* Chat Messages */}
    <div className="ai-messages">
      {messages.map((msg, idx) => (
        <MessageBubble
          key={idx}
          role={msg.role}
          content={msg.content}
          dark={dark}
        />
      ))}
      
      {isLoading && (
        <div className="loading-message">
          <p className="animate-pulse">
            AI Assistant is thinking...
          </p>
        </div>
      )}
    </div>

    {/* Quick Actions */}
    <div className="quick-actions">
      <ActionButton onClick={formatNotes}>
        <FileText /> Format Notes
      </ActionButton>
      <ActionButton onClick={findDuplicates}>
        <Copy /> Find Duplicates
      </ActionButton>
      <ActionButton onClick={organizeThoughts}>
        <Layout /> Organize Thoughts
      </ActionButton>
    </div>

    {/* Input Area */}
    <div className="ai-input-area">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleSend()
          }
        }}
        placeholder="Ask anything about your notes..."
        className="ai-input"
      />
      <button onClick={handleSend} className="send-btn">
        <Send />
      </button>
    </div>

    {/* Tool Widget Display */}
    {activeTool && (
      <ToolWidget tool={activeTool} result={toolResult} />
    )}
  </div>
</AiAssistant>
```

---

## Quick Actions

### Format Notes

**Purpose:** Applies consistent formatting to selected or all notes

**Implementation:**

```javascript
const formatNotes = async () => {
  setActiveTool('format')
  
  // Get note content
  const notes = await getSelectedNotes()
  
  // Call AI to format
  const result = await aiQuery(`
    Format these notes with:
    - Clear headings (## for main, ### for subheadings)
    - Bullet points for lists
    - Proper spacing between sections
    - Clean up inconsistent formatting
    
    Notes: ${notes.map(n => n.content).join('\n\n')}
  `)
  
  setToolResult(result)
  setActiveTool(null)
}
```

**Use Cases:**
- Meeting notes from dictation
- Lecture notes with inconsistent formatting
- Brainstorming sessions
- Copy-pasted text from other sources

### Find Duplicates

**Purpose:** Identifies similar or duplicate notes across workspace

**Implementation:**

```javascript
const findDuplicates = async () => {
  setActiveTool('duplicates')
  
  // Get all notes
  const notes = await getAllNotes()
  
  // Use AI to find similarities
  const result = await aiQuery(`
    Analyze these notes and identify potential duplicates or highly similar notes.
    Group similar notes together and explain why they're similar.
    
    Notes: ${notes.map(n => `${n.title}: ${n.content.substring(0, 200)}`).join('\n\n')}
  `)
  
  setToolResult(result)
  setActiveTool(null)
}
```

**Use Cases:**
- Cleaning up large note collections
- Merging similar meeting notes
- Reducing note redundancy
- Organizing research notes

### Organize Thoughts

**Purpose:** Suggests tags, categorization, and organization for notes

**Implementation:**

```javascript
const organizeThoughts = async () => {
  setActiveTool('organize')
  
  // Get recent unorganized notes
  const notes = await getUnorganizedNotes()
  
  // Request organization suggestions
  const result = await aiQuery(`
    Analyze these notes and suggest:
    1. Appropriate tags for each note
    2. Categories or groups
    3. Related notes that should be linked
    
    Notes: ${notes.map(n => n.content).join('\n\n')}
  `)
  
  setToolResult(result)
  setActiveTool(null)
}
```

**Use Cases:**
- Brainstorming sessions
- Research note organization
- Project planning
- Knowledge base structuring

---

## Virtual Tools

### Image Generation

**Purpose:** Generates images from text descriptions

**Implementation:**

```javascript
const generateImage = async (prompt) => {
  setActiveTool('image-generation')
  
  const imageData = await aiGenerateImage(prompt)
  
  setToolResult({
    type: 'image',
    prompt,
    data: imageData
  })
  
  setActiveTool(null)
}
```

**Usage in Chat:**
```
User: Create an image of a futuristic city
AI: [Generates image] Here's your image:
     [Display generated image]
```

### Title Suggestions

**Purpose:** Analyzes note content and suggests appropriate titles

**Implementation:**

```javascript
const suggestTitle = async (content) => {
  const suggestions = await aiQuery(`
    Analyze this content and suggest 5 appropriate titles.
    Return as numbered list.
    
    Content: ${content}
  `)
  
  return suggestions.split('\n').filter(Boolean)
}
```

**Usage:**
- Applies to new notes without titles
- Updates existing note titles
- Provides options for user selection

### Task Detection

**Purpose:** Identifies action items and tasks within notes

**Implementation:**

```javascript
const detectTasks = async (content) => {
  const tasks = await aiQuery(`
    Extract all action items and tasks from this content.
    Include due dates if mentioned.
    Format as checklist items.
    
    Content: ${content}
  `)
  
  return parseChecklistItems(tasks)
}
```

**Usage:**
- Converts meeting notes to checklists
- Extracts action items from documents
- Creates task lists from unstructured text

---

## RAG Integration

### Context Retrieval

**How It Works:**

```javascript
// Retrieve context based on user query
const retrieveContext = async (query) => {
  // Get recent notes
  const notes = await getRecentNotes(100)
  
  // Rank by relevance using embeddings or keyword matching
  const ranked = rankByRelevance(notes, query)
  
  // Return top 20 for context window
  return ranked.slice(0, 20)
}
```

### Grounded Responses

**AI Prompt Construction:**

```javascript
const constructPrompt = (query, context) => {
  return `
You are an AI assistant for a notes application.
Answer the user's question based ONLY on the following context.

Context:
${context.map(n => `
Title: ${n.title}
Content: ${n.content.substring(0, 2000)}...
Tags: ${n.tags || 'none'}
`).join('\n---\n')}

User Question: ${query}

Guidelines:
- Answer based ONLY on the provided context
- If context doesn't contain the answer, say so honestly
- Always cite which notes you're referencing
- Provide specific examples from notes when helpful
- If multiple notes are relevant, reference all of them
`
}
```

### Response Format

```
User: What are my project deadlines?

AI: Based on your notes, you have 3 upcoming deadlines:

1. **Website Launch** - February 15, 2026
   Source: "Q1 Planning" note
   Tags: #project-management #webdev
   Details: Complete responsive design and deploy to production

2. **API Integration** - February 28, 2026
   Source: "Technical Roadmap" note
   Tags: #development #api
   Details: Integrate payment gateway and user authentication

3. **User Testing** - March 10, 2026
   Source: "Testing Schedule" note
   Tags: #qa #testing
   Details: Conduct UAT with 10 beta users

Related Notes:
- "2026 Q1 Goals" (mentions all 3 deadlines)
- "Team Standup Notes" (progress updates on each)
```

---

## Chat Interface

### Message Bubbles

**User Messages:**

```jsx
<div className="message user">
  <div className="message-content">
    <UserAvatar />
    <p>{message.content}</p>
  </div>
  <span className="message-time">
    {formatTime(message.timestamp)}
  </span>
</div>
```

**AI Messages:**

```jsx
<div className="message ai">
  <div className="message-content">
    <Sparkles />
    <div className="ai-text">
      {renderMarkdown(message.content)}
    </div>
  </div>
  <span className="message-time">
    {formatTime(message.timestamp)}
  </span>
</div>
```

### Auto-scrolling

```javascript
useEffect(() => {
  // Auto-scroll to bottom on new messages
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({ 
      behavior: 'smooth' 
    })
  }
}, [messages])
```

### Loading State

```jsx
{isLoading && (
  <div className="message ai loading">
    <div className="message-content">
      <Sparkles className="animate-pulse" />
      <p className="animate-pulse">
        AI Assistant is thinking...
      </p>
    </div>
  </div>
)}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘J` / `Ctrl+J` | Toggle sidebar |
| `Enter` | Send message (when input focused) |
| `Escape` | Close sidebar |
| `Shift+Enter` | Insert newline in input |

---

## Styling & Theming

### Glassmorphic Design

```css
.glass-sidebar {
  background: rgba(var(--bg-rgb), 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Dark Mode

```css
.glass-sidebar.dark {
  background: rgba(var(--dark-bg-rgb), 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--dark-text);
}
```

### Accent Colors

```css
.ai-header h3 {
  color: var(--accent);
  text-shadow: 0 0 20px rgba(var(--accent-rgb), 0.5);
}

.send-btn {
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
}
```

---

## Error Handling

### API Errors

```javascript
const handleQuery = async (query) => {
  try {
    setIsLoading(true)
    
    const response = await aiQuery(query, context)
    
    addMessage('ai', response)
    
  } catch (error) {
    console.error('AI Query Error:', error)
    
    // Show error in chat
    addMessage('ai', `
      ❌ **Error:** ${error.message}
      
      **Possible Solutions:**
      - Check your internet connection
      - Verify API key is set correctly
      - Try using local AI if available
      - Wait a moment and try again
    `)
    
    // Fallback to local AI if available
    if (localAiEnabled && aiEngine === 'gemini') {
      console.log('Falling back to local AI...')
      await handleLocalQuery(query)
    }
    
  } finally {
    setIsLoading(false)
  }
}
```

### Network Timeouts

```javascript
const aiQuery = async (prompt, context, timeout = 30000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeout)
  
  try {
    const response = await fetch('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return await response.json()
    
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    
    throw error
  }
}
```

---

## Performance Optimization

### Message Pagination

```javascript
// Only render visible messages for performance
const VISIBLE_MESSAGES = 50

const renderMessages = () => {
  const [page, setPage] = useState(0)
  
  const visibleMessages = messages.slice(
    -((page + 1) * VISIBLE_MESSAGES)
  )
  
  return (
    <>
      {page > 0 && (
        <button onClick={() => setPage(page - 1)}>
          Load Older Messages
        </button>
      )}
      
      {visibleMessages.map(msg => <MessageBubble {...msg} />)}
    </>
  )
}
```

### Debounced Input

```javascript
// Debounce input to prevent premature queries
const debouncedInput = useDebounce(input, 500)

useEffect(() => {
  // Auto-suggest based on input
  if (debouncedInput.length > 10) {
    fetchSuggestions(debouncedInput)
  }
}, [debouncedInput])
```

### Memoized Components

```javascript
// Memoize message bubbles to prevent re-renders
const MessageBubble = React.memo(({ role, content, dark }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.content === nextProps.content &&
         prevProps.role === nextProps.role
})
```

---

## Accessibility

### Keyboard Navigation

```jsx
<div 
  className="ai-sidebar"
  role="dialog"
  aria-modal="true"
  aria-label="AI Assistant"
  onKeyDown={e => {
    if (e.key === 'Escape') {
      onClose()
    }
  }}
>
  <input
    type="text"
    aria-label="Ask AI"
    aria-describedby="ai-hint"
  />
  <span id="ai-hint">
    Press Enter to send, Escape to close
  </span>
</div>
```

### ARIA Labels

```jsx
<button
  onClick={formatNotes}
  aria-label="Format Notes"
  title="Apply consistent formatting to notes"
>
  <FileText />
  <span className="sr-only">Format Notes</span>
</button>
```

### Focus Management

```javascript
// Focus input when sidebar opens
useEffect(() => {
  if (isOpen && inputRef.current) {
    inputRef.current.focus()
  }
}, [isOpen])

// Return focus to trigger element when closing
const handleClose = () => {
  setPreviousActiveElement(document.activeElement)
  onClose()
  
  // Restore focus after animation
  setTimeout(() => {
    if (previousActiveElement) {
      previousActiveElement.focus()
    }
  }, 300)
}
```

---

## Testing

### Component Tests

```javascript
describe('AiAssistant', () => {
  it('should render with default props', () => {
    render(<AiAssistant {...defaultProps} />)
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
  })
  
  it('should toggle visibility', () => {
    const { rerender } = render(<AiAssistant {...defaultProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    
    rerender(<AiAssistant {...defaultProps} isOpen={true} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  
  it('should send message on Enter key', () => {
    render(<AiAssistant {...defaultProps} />)
    const input = screen.getByLabelText('Ask AI')
    
    fireEvent.change(input, { target: { value: 'Test query' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    
    expect(onQuery).toHaveBeenCalledWith('Test query')
  })
  
  it('should call quick action on click', () => {
    render(<AiAssistant {...defaultProps} />)
    const formatBtn = screen.getByLabelText('Format Notes')
    
    fireEvent.click(formatBtn)
    
    // Verify format action triggered
    expect(screen.getByText(/formatting notes/i)).toBeInTheDocument()
  })
})
```

### Integration Tests

```javascript
describe('AiAssistant Integration', () => {
  it('should query AI and display response', async () => {
    render(<AiAssistant {...defaultProps} />)
    
    const input = screen.getByLabelText('Ask AI')
    fireEvent.change(input, { target: { value: 'Summarize notes' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    
    // Wait for AI response
    await waitFor(() => {
      expect(screen.getByText(/Based on your notes/)).toBeInTheDocument()
    })
  })
  
  it('should fallback to local AI on error', async () => {
    // Mock Gemini error
    mockGeminiQuery.mockRejectedValue(new Error('API error'))
    
    render(<AiAssistant {...defaultProps} localAiEnabled={true} />)
    
    // Trigger query
    const sendBtn = screen.getByLabelText('Send message')
    fireEvent.click(sendBtn)
    
    // Verify fallback
    await waitFor(() => {
      expect(mockLocalAiQuery).toHaveBeenCalled()
    })
  })
})
```

---

## Usage Examples

### Basic Usage

```jsx
import { useState } from 'react'
import AiAssistant from './components/AiAssistant'

function NotesView() {
  const [aiOpen, setAiOpen] = useState(false)
  const [aiEngine, setAiEngine] = useState('gemini')
  
  return (
    <>
      <button onClick={() => setAiOpen(true)}>
        <Sparkles /> Open AI Assistant
      </button>
      
      <AiAssistant
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        dark={isDarkMode}
        aiEngine={aiEngine}
        localAiEnabled={localAiAvailable}
        onQuery={handleAiQuery}
      />
    </>
  )
}
```

### With Context Selection

```jsx
function NotesView() {
  const [selectedNotes, setSelectedNotes] = useState([])
  
  const handleQuickAction = async (action) => {
    // Pass selected notes to AI
    if (selectedNotes.length > 0) {
      await aiQuery(
        `${action} these notes: ${JSON.stringify(selectedNotes)}`
      )
    }
  }
  
  return (
    <AiAssistant
      isOpen={aiOpen}
      onClose={() => setAiOpen(false)}
      dark={isDarkMode}
      onQuery={handleAiQuery}
    >
      {/* Pass selected notes context */}
      <SelectedNotesContext.Provider value={selectedNotes}>
        <AiAssistant />
      </SelectedNotesContext.Provider>
    </>
  )
}
```

---

## Best Practices

### For Users

1. **Be Specific in Queries**
   - Good: "Summarize my Q1 project planning notes"
   - Bad: "Summarize notes"

2. **Provide Context When Needed**
   - "What were the action items from yesterday's meeting about the website redesign?"

3. **Use Quick Actions**
   - Format messy notes automatically
   - Find duplicates before merging
   - Organize brainstorming sessions

4. **Verify Responses**
   - Check note references
   - Cross-reference with source notes
   - Use AI as assistant, not authority

### For Developers

1. **Maintain Message History**
   - Keep reasonable limit (100-200 messages)
   - Implement pagination for performance
   - Persist important conversations

2. **Handle Errors Gracefully**
   - Show user-friendly error messages
   - Provide actionable solutions
   - Implement automatic retries

3. **Optimize Performance**
   - Use memoization for message bubbles
   - Debounce input and auto-suggestions
   - Lazy-load tool widgets

4. **Ensure Accessibility**
   - Proper ARIA labels
   - Keyboard navigation support
   - Focus management
   - Screen reader compatibility

---

## Related Documentation

- [AI Integration Guide](../AI_INTEGRATION.md) - Complete AI setup and configuration
- [Architecture](../ARCHITECTURE.md) - System architecture and AI layer
- [API Reference](../API_REFERENCE.md) - AI API endpoints
- [Security](../SECURITY.md) - AI security best practices
- [Voice Studio Guide](../VOICE_STUDIO_GUIDE.md) - Voice transcription features

---

**Component Version:** 2.0  
**Last Updated:** January 28, 2026  
**Maintained By:** Development Team  
**Status:** ✅ Production Ready