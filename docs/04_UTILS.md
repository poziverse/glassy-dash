# Glass Keep Utilities Overview
**Last Updated:** January 20, 2026  
**Version:** 1.0  
**Status:** ✅ Complete Overview

---

## Overview

Glass Keep includes 6 utility modules that provide helper functions for common operations across the application. These utilities encapsulate reusable logic for logging, storage, helpers, callback management, markdown processing, and error handling.

---

## Utility Modules

### 1. logger.js

**Purpose:** Client-side logging utility with server integration

**File:** `GLASSYDASH/src/utils/logger.js`

**Size:** 5.6 KB  
**Event Types:** 18

#### Logger Features

- **Client-side logging** with automatic server transmission
- **18 event types** covering all application events
- **Automatic error capture** for unhandled errors
- **Metadata support** for context-rich logs
- **Local storage** of recent logs for offline debugging

#### Event Types

| Event Type | Category | Description |
|------------|-----------|-------------|
| `auth_login` | Authentication | User login event |
| `auth_logout` | Authentication | User logout event |
| `auth_register` | Authentication | User registration event |
| `auth_error` | Authentication | Authentication errors |
| `note_create` | Data | Note creation event |
| `note_update` | Data | Note update event |
| `note_delete` | Data | Note deletion event |
| `note_error` | Data | Note operation errors |
| `api_request` | API | API request events |
| `api_response` | API | API response events |
| `api_error` | API | API error events |
| `ui_action` | UI | User UI interactions |
| `navigation` | UI | Navigation events |
| `sse_connect` | Real-time | SSE connection events |
| `sse_disconnect` | Real-time | SSE disconnection events |
| `sse_error` | Real-time | SSE error events |
| `system_error` | System | System-level errors |

#### API

```javascript
// Logger initialization
import { logger } from '../utils/logger';

// Log events
logger.log('note_create', {
  noteId: 123,
  noteType: 'text'
});

logger.log('auth_login', {
  userId: 1,
  email: 'user@example.com'
});

// Log errors
logger.error('api_error', {
  endpoint: '/api/notes',
  statusCode: 500,
  message: 'Internal server error'
});

// Get recent logs
const recentLogs = logger.getRecentLogs(10);

// Clear logs
logger.clearLogs();
```

#### Usage Example

```jsx
import { logger } from '../utils/logger';

function SaveButton({ note }) {
  const handleSave = async () => {
    logger.log('note_update', { noteId: note.id });
    
    try {
      await saveNote(note);
      logger.log('api_response', {
        endpoint: `/api/notes/${note.id}`,
        statusCode: 200
      });
    } catch (error) {
      logger.error('note_error', {
        noteId: note.id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

#### Implementation Details

```javascript
class Logger {
  constructor() {
    this.logs = [];
    this.maxLocalLogs = 100;
    this.serverEndpoint = '/api/logs';
  }

  log(eventType, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.push(logEntry);
    this.sendToServer(logEntry);
    this.saveLocally(logEntry);
  }

  error(eventType, errorData = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      error: true,
      data: errorData,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.push(logEntry);
    this.sendToServer(logEntry);
    this.saveLocally(logEntry);
  }

  async sendToServer(logEntry) {
    try {
      const token = localStorage.getItem('token');
      await fetch(this.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to send log to server:', error);
    }
  }

  saveLocally(logEntry) {
    try {
      let localLogs = JSON.parse(localStorage.getItem('client_logs') || '[]');
      localLogs.push(logEntry);
      
      if (localLogs.length > this.maxLocalLogs) {
        localLogs = localLogs.slice(-this.maxLocalLogs);
      }
      
      localStorage.setItem('client_logs', JSON.stringify(localLogs));
    } catch (error) {
      console.error('Failed to save log locally:', error);
    }
  }

  getRecentLogs(count = 10) {
    return this.logs.slice(-count);
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem('client_logs');
  }
}

export const logger = new Logger();

// Automatic error capture
window.addEventListener('error', (event) => {
  logger.error('system_error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('system_error', {
    promise: 'Unhandled Promise Rejection',
    reason: event.reason
  });
});
```

#### Related Components
- All components (logging is app-wide)

#### See Also
- [Logging Implementation](./LOGGING_IMPLEMENTATION.md) - Detailed logging docs

---

### 2. errorLogging.ts

**Purpose:** TypeScript error logging utility with type safety

**File:** `GLASSYDASH/src/utils/errorLogging.ts`

#### API

```typescript
// Log error with type safety
export function logError(error: Error, context?: string): void;

// Log warning
export function logWarning(message: string, context?: string): void;

// Get error details
export function getErrorDetails(error: Error): ErrorDetails;

interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  context?: string;
  timestamp: string;
}
```

#### Usage Example

```typescript
import { logError, logWarning, getErrorDetails } from '../utils/errorLogging';

async function fetchData() {
  try {
    const response = await fetch('/api/notes');
    if (!response.ok) throw new Error('Failed to fetch notes');
    return await response.json();
  } catch (error) {
    logError(error as Error, 'fetchData');
    
    const details = getErrorDetails(error as Error);
    console.error('Error details:', details);
    
    throw error;
  }
}

// Log warning
logWarning('Deprecated API used', 'fetchData');
```

---

### 3. helpers.js

**Purpose:** General helper functions for common operations

**File:** `GLASSYDASH/src/utils/helpers.js`

#### Helper Functions

##### formatDate(date)

Format a date string to human-readable format

```javascript
formatDate(date) // Returns: "Jan 20, 2026 9:30 PM"
```

##### truncateText(text, maxLength)

Truncate text to max length with ellipsis

```javascript
truncateText('This is a long text', 10) // Returns: "This is a..."
```

##### debounce(func, delay)

Debounce function execution

```javascript
const debouncedSearch = debounce((query) => {
  performSearch(query);
}, 300);
```

##### generateId()

Generate unique ID

```javascript
generateId() // Returns: "abc123xyz"
```

##### escapeHtml(html)

Escape HTML special characters

```javascript
escapeHtml('<script>alert("xss")</script>')
// Returns: "<script>alert("xss")</script>"
```

##### validateEmail(email)

Validate email format

```javascript
validateEmail('user@example.com') // Returns: true
validateEmail('invalid') // Returns: false
```

##### capitalizeFirst(string)

Capitalize first letter of string

```javascript
capitalizeFirst('hello') // Returns: "Hello"
```

##### getNoteColor(colorName)

Get CSS class for note color

```javascript
getNoteColor('white') // Returns: "bg-white"
getNoteColor('blue') // Returns: "bg-blue-500"
```

#### Usage Example

```jsx
import { 
  formatDate, 
  truncateText, 
  debounce,
  escapeHtml,
  validateEmail 
} from '../utils/helpers';

function NoteCard({ note }) {
  const formattedDate = formatDate(note.updated_at);
  const truncatedContent = truncateText(note.content, 100);

  return (
    <div className={`note-card ${getNoteColor(note.color)}`}>
      <h3>{note.title}</h3>
      <p>{truncatedContent}</p>
      <span>{formattedDate}</span>
    </div>
  );
}

function SearchBar() {
  const [query, setQuery] = useState('');
  
  const handleSearch = debounce((searchQuery) => {
    performSearch(searchQuery);
  }, 300);

  const handleChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    handleSearch(newQuery);
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search notes..."
    />
  );
}
```

---

### 4. storage.js

**Purpose:** Local storage wrapper with type safety and error handling

**File:** `GLASSYDASH/src/utils/storage.js`

#### Storage API

```javascript
// Get item from storage
storage.get(key) // Returns: value or null

// Set item in storage
storage.set(key, value) // Returns: void

// Remove item from storage
storage.remove(key) // Returns: void

// Clear all items from storage
storage.clear() // Returns: void

// Get all keys
storage.keys() // Returns: Array<string>

// Get storage size
storage.size() // Returns: number (bytes)
```

#### Storage Keys

| Key | Type | Description |
|------|------|-------------|
| `token` | String | JWT authentication token |
| `user` | Object | Current user data |
| `settings` | Object | User settings (theme, etc.) |
| `drafts` | Object | Note drafts |
| `last_sync` | String | Last sync timestamp |

#### Usage Example

```javascript
import storage from '../utils/storage';

// Authentication
function login(user, token) {
  storage.set('user', user);
  storage.set('token', token);
}

function logout() {
  storage.remove('user');
  storage.remove('token');
}

function isAuthenticated() {
  return !!storage.get('token');
}

// Settings
function saveSettings(settings) {
  storage.set('settings', settings);
}

function getSettings() {
  return storage.get('settings') || defaultSettings;
}

// Drafts
function saveDraft(noteId, draft) {
  const drafts = storage.get('drafts') || {};
  drafts[noteId] = draft;
  storage.set('drafts', drafts);
}

function getDraft(noteId) {
  const drafts = storage.get('drafts') || {};
  return drafts[noteId];
}

function clearDraft(noteId) {
  const drafts = storage.get('drafts') || {};
  delete drafts[noteId];
  storage.set('drafts', drafts);
}

// Storage management
function checkStorageUsage() {
  const size = storage.size();
  const maxSize = 5 * 1024 * 1024; // 5MB
  const usage = (size / maxSize) * 100;
  
  console.log(`Storage usage: ${usage.toFixed(2)}%`);
  return usage;
}
```

#### Implementation Details

```javascript
class Storage {
  constructor() {
    this.prefix = 'GLASSYDASH_';
  }

  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  get(key) {
    try {
      const item = localStorage.getItem(this._getKey(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }

  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this._getKey(key), serialized);
    } catch (error) {
      console.error('Storage set error:', error);
      if (error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded');
        this.clearOldDrafts();
      }
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(this._getKey(key));
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  }

  clear() {
    try {
      const keys = this.keys();
      keys.forEach(key => this.remove(key));
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  keys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    return keys;
  }

  size() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        total += localStorage.getItem(key).length;
      }
    }
    return total;
  }

  clearOldDrafts() {
    const drafts = this.get('drafts') || {};
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    Object.entries(drafts).forEach(([id, draft]) => {
      if (now - draft.timestamp > oneWeek) {
        delete drafts[id];
      }
    });
    
    this.set('drafts', drafts);
  }
}

export default new Storage();
```

---

### 5. callback-helpers.js

**Purpose:** Helper functions for callback management and composition

**File:** `GLASSYDASH/src/utils/callback-helpers.js`

#### Helper Functions

##### composeCallbacks(...callbacks)

Compose multiple callbacks into single callback

```javascript
const composed = composeCallbacks(
  callback1,
  callback2,
  callback3
);

// All three callbacks will be called
composed(event);
```

##### memoizeCallback(callback)

Memoize callback based on arguments

```javascript
const memoized = memoizeCallback((id) => {
  return fetchItem(id);
});

// Only fetches once per unique id
memoized(1);
memoized(1); // Returns cached result
```

##### once(callback)

Ensure callback only runs once

```javascript
const singleRun = once(() => {
  console.log('This will only run once');
});

singleRun(); // Logs message
singleRun(); // Does nothing
```

##### throttle(callback, delay)

Throttle callback execution

```javascript
const throttled = throttle(() => {
  saveData();
}, 1000);

// Only runs once per second even if called multiple times
throttled();
throttled();
throttled();
```

##### asyncCallback(callback)

Wrap callback to handle async errors

```javascript
const safeAsync = asyncCallback(async (data) => {
  await processData(data);
});

safeAsync(data)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

#### Usage Example

```jsx
import { 
  composeCallbacks, 
  throttle, 
  once 
} from '../utils/callback-helpers';

function NoteCard({ note }) {
  const { selectNote, openModal } = useNotes();
  
  const handleClick = composeCallbacks(
    () => selectNote(note.id),
    () => openModal(note.id),
    () => logger.log('ui_action', { action: 'open_note', noteId: note.id })
  );
  
  const handleSave = throttle(async () => {
    await saveNote();
  }, 1000);
  
  const handleInit = once(() => {
    logger.log('component_init', { component: 'NoteCard' });
  });
  
  useEffect(() => {
    handleInit();
  }, []);
  
  return (
    <div onClick={handleClick}>
      <h3>{note.title}</h3>
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

---

### 6. safe-markdown.js

**Purpose:** Safe markdown parsing and rendering with XSS protection

**File:** `GLASSYDASH/src/utils/safe-markdown.js`

#### Features

- **XSS protection** - Sanitizes HTML output
- **Markdown parsing** - Common markdown syntax
- **Custom extensions** - Support for custom features
- **Performance** - Optimized for rendering

#### Supported Markdown

| Syntax | Output |
|---------|---------|
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `` `code` `` | `code` |
| `# Heading 1` | Heading 1 |
| `## Heading 2` | Heading 2 |
| `[link](url)` | [link](url) |
| `- list item` | • list item |
| `1. numbered` | 1. numbered |
| `> quote` | > quote |

#### API

```javascript
// Parse markdown to safe HTML
safeMarkdown.parse(markdownString) // Returns: HTML string

// Parse with custom options
safeMarkdown.parse(markdownString, {
  allowHtml: false,
  sanitize: true,
  linkTarget: '_blank'
})
```

#### Usage Example

```jsx
import { safeMarkdown } from '../utils/safe-markdown';

function NoteContent({ content }) {
  const html = safeMarkdown.parse(content);
  
  return (
    <div 
      className="note-content markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function Composer() {
  const [content, setContent] = useState('');
  
  const renderPreview = () => {
    return safeMarkdown.parse(content, {
      allowHtml: false,
      sanitize: true
    });
  };
  
  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your note in Markdown..."
      />
      <div className="preview">
        <h3>Preview:</h3>
        <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
      </div>
    </div>
  );
}
```

#### Implementation Details

```javascript
class SafeMarkdown {
  constructor() {
    this.allowedTags = ['p', 'br', 'strong', 'em', 'code', 'pre', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a'];
    this.allowedAttributes = { 'a': ['href', 'target'] };
  }

  parse(markdown, options = {}) {
    const html = this.markdownToHtml(markdown);
    const sanitized = this.sanitizeHtml(html, options);
    return sanitized;
  }

  markdownToHtml(markdown) {
    let html = markdown
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');
    
    // Wrap lists
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Wrap paragraphs
    html = html.replace(/([^<>]+)(?=<|$)/g, '<p>$1</p>');
    
    return html;
  }

  sanitizeHtml(html, options = {}) {
    const defaultOptions = {
      sanitize: true,
      allowHtml: false
    };
    
    const opts = { ...defaultOptions, ...options };
    
    if (!opts.allowHtml && opts.sanitize) {
      return this.stripTags(html);
    }
    
    return html;
  }

  stripTags(html) {
    let result = html;
    
    // Remove script tags
    result = result.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, '');
    
    // Remove other disallowed tags
    result = result.replace(/<[^>]+>/g, (match) => {
      const tagName = match.match(/<(\w+)/)?.[1]?.toLowerCase();
      if (!this.allowedTags.includes(tagName)) {
        return '';
      }
      
      // Sanitize attributes
      return this.sanitizeAttributes(match, tagName);
    });
    
    return result;
  }

  sanitizeAttributes(tag, tagName) {
    const attributes = tag.match(/(\w+)=["'][^"']*["']/g) || [];
    
    const sanitized = attributes.map(attr => {
      const [name, value] = attr.split('=');
      const attrName = name.trim();
      const allowed = this.allowedAttributes[tagName];
      
      if (!allowed || !allowed.includes(attrName)) {
        return '';
      }
      
      return `${attrName}=${value}`;
    }).join(' ');
    
    return `<${tagName}${sanitized ? ' ' + sanitized : ''}>`;
  }
}

export const safeMarkdown = new SafeMarkdown();
```

---

## Utility Best Practices

### 1. Error Handling

Always handle utility errors gracefully:

```javascript
// ✅ Good
try {
  storage.set('key', value);
} catch (error) {
  logger.error('storage_error', { error: error.message });
}

// ❌ Bad - no error handling
storage.set('key', value);
```

### 2. Type Safety

Use appropriate types and validation:

```javascript
// ✅ Good
const email = validateEmail(input);
if (email) {
  storage.set('user_email', email);
}

// ❌ Bad - no validation
storage.set('user_email', input);
```

### 3. Performance

Memoize expensive operations:

```javascript
// ✅ Good
const debouncedSearch = debounce(performSearch, 300);

// ❌ Bad - runs on every keystroke
<input onChange={(e) => performSearch(e.target.value)} />
```

### 4. Security

Always sanitize user input:

```javascript
// ✅ Good
const html = safeMarkdown.parse(userInput);

// ❌ Bad - XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

---

## Utility Testing

### Testing Strategy

Each utility should have tests for:

1. **Functionality**
   - Utility works as expected
   - Edge cases handled

2. **Error Handling**
   - Errors are caught properly
   - Graceful degradation

3. **Performance**
   - Performance is acceptable
   - No memory leaks

4. **Security**
   - Input sanitization works
   - XSS protection effective

### Example Tests

```javascript
describe('helpers', () => {
  it('should truncate text correctly', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...');
  });
  
  it('should validate email correctly', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });
  
  it('should escape HTML correctly', () => {
    expect(escapeHtml('<script>alert("xss")</script>'))
      .toContain('<script>');
  });
});
```

---

## Related Documentation

- [Components Overview](./01_COMPONENTS.md) - Component documentation
- [Contexts Overview](./02_CONTEXTS.md) - Context documentation
- [Hooks Overview](./03_HOOKS.md) - Hooks documentation
- [Logging Implementation](./LOGGING_IMPLEMENTATION.md) - Detailed logging docs

---

## Utility Summary

| Utility | Purpose | Functions | Size | Used By |
|----------|---------|------------|-------|----------|
| logger.js | Client logging | 18 events | 5.6 KB | All components |
| errorLogging.ts | TypeScript error handling | 3 functions | - | Components with TS |
| helpers.js | General helpers | 8 functions | - | Multiple components |
| storage.js | Local storage wrapper | 6 functions | - | All components |
| callback-helpers.js | Callback management | 5 functions | - | Event handlers |
| safe-markdown.js | Markdown parsing | 3 methods | - | Note content |

---

**Utility Count:** 6  
**Documented Utilities:** 6 (100% overview)  
**Last Updated:** January 20, 2026