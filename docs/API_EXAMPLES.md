# API Examples

**Version:** 1.0  
**Last Updated:** January 31, 2026  
**Target Audience:** Developers

---

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication Examples](#authentication-examples)
- [Note CRUD Examples](#note-crud-examples)
- [Search and Filter Examples](#search-and-filter-examples)
- [Collaboration Examples](#collaboration-examples)
- [AI Assistant Examples](#ai-assistant-examples)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Complete Integration Example](#complete-integration-example)

---

## Getting Started

### Base URL

All API requests use the base URL:

```javascript
const API_BASE = '/api'  // Same origin
// OR
const API_BASE = 'https://yourdomain.com/api'  // Cross-origin
```

### Request Helper

Create a reusable request function:

```javascript
async function api(endpoint, options = {}) {
  const token = localStorage.getItem('glassydash_token')
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, config)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'API request failed')
  }
  
  return response.json()
}
```

---

## Authentication Examples

### Register New User

```javascript
async function register(userData) {
  return api('/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securePassword123'
    })
  })
}

// Usage
try {
  const result = await register({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securePassword123'
  })
  
  // Store token
  localStorage.setItem('glassydash_token', result.token)
  localStorage.setItem('glassydash_user', JSON.stringify(result.user))
  
  console.log('Registration successful!', result)
} catch (error) {
  console.error('Registration failed:', error.message)
}
```

### Login

```javascript
async function login(email, password) {
  return api('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

// Usage
try {
  const result = await login('john@example.com', 'securePassword123')
  
  // Store token and user data
  localStorage.setItem('glassydash_token', result.token)
  localStorage.setItem('glassydash_user', JSON.stringify(result.user))
  
  console.log('Login successful!', result)
  
  // Redirect to dashboard
  window.location.href = '/dashboard'
} catch (error) {
  console.error('Login failed:', error.message)
  // Show error to user
  alert(error.message)
}
```

### Generate Secret Key

```javascript
async function generateSecretKey() {
  return api('/api/secret-key', {
    method: 'POST'
  })
}

// Usage
try {
  const result = await generateSecretKey()
  console.log('Secret key:', result.key)
  
  // Display to user to save securely
  alert(`Your secret key: ${result.key}\n\nSave this securely!`)
} catch (error) {
  console.error('Failed to generate secret key:', error.message)
}
```

### Login with Secret Key

```javascript
async function loginWithSecretKey(secretKey) {
  return api('/login/secret', {
    method: 'POST',
    body: JSON.stringify({ key: secretKey })
  })
}

// Usage
try {
  const result = await loginWithSecretKey('sk-xxxxx...')
  
  // Store token
  localStorage.setItem('glassydash_token', result.token)
  localStorage.setItem('glassydash_user', JSON.stringify(result.user))
  
  console.log('Login successful with secret key!')
} catch (error) {
  console.error('Login failed:', error.message)
}
```

---

## Note CRUD Examples

### Get All Notes

```javascript
async function getNotes(options = {}) {
  const params = new URLSearchParams()
  
  if (options.limit) params.append('limit', options.limit)
  if (options.offset) params.append('offset', options.offset)
  
  return api(`/notes?${params}`)
}

// Usage - Get all notes
try {
  const notes = await getNotes()
  console.log('All notes:', notes)
} catch (error) {
  console.error('Failed to fetch notes:', error.message)
}

// Usage - Paginated
try {
  const notes = await getNotes({ limit: 20, offset: 0 })
  console.log('First 20 notes:', notes)
} catch (error) {
  console.error('Failed to fetch notes:', error.message)
}
```

### Get Single Note

```javascript
async function getNote(noteId) {
  return api(`/notes/${noteId}`)
}

// Usage
try {
  const note = await getNote('u-123456')
  console.log('Note details:', note)
} catch (error) {
  console.error('Failed to fetch note:', error.message)
}
```

### Create Note

```javascript
async function createNote(noteData) {
  return api('/notes', {
    method: 'POST',
    body: JSON.stringify(noteData)
  })
}

// Usage - Create text note
try {
  const note = await createNote({
    type: 'text',
    title: 'Meeting Notes',
    content: 'Discussed Q1 roadmap and assigned tasks...',
    tags: ['work', 'meeting'],
    color: 'yellow'
  })
  
  console.log('Note created:', note)
} catch (error) {
  console.error('Failed to create note:', error.message)
}

// Usage - Create checklist
try {
  const note = await createNote({
    type: 'checklist',
    title: 'Shopping List',
    items: [
      { text: 'Milk', checked: false },
      { text: 'Bread', checked: false },
      { text: 'Eggs', checked: true }
    ],
    tags: ['personal']
  })
  
  console.log('Checklist created:', note)
} catch (error) {
  console.error('Failed to create checklist:', error.message)
}
```

### Update Note (Partial)

```javascript
async function updateNote(noteId, updates) {
  return api(`/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  })
}

// Usage - Update title
try {
  const updated = await updateNote('u-123456', {
    title: 'Updated Title'
  })
  
  console.log('Note updated:', updated)
} catch (error) {
  console.error('Failed to update note:', error.message)
}

// Usage - Add tags
try {
  const updated = await updateNote('u-123456', {
    tags: ['work', 'meeting', 'important']
  })
  
  console.log('Tags added:', updated)
} catch (error) {
  console.error('Failed to add tags:', error.message)
}

// Usage - Pin note
try {
  const updated = await updateNote('u-123456', {
    pinned: true
  })
  
  console.log('Note pinned:', updated)
} catch (error) {
  console.error('Failed to pin note:', error.message)
}
```

### Delete Note

```javascript
async function deleteNote(noteId) {
  return api(`/notes/${noteId}`, {
    method: 'DELETE'
  })
}

// Usage
try {
  await deleteNote('u-123456')
  console.log('Note deleted successfully')
  
  // Remove from local state
  setNotes(notes.filter(n => n.id !== 'u-123456'))
} catch (error) {
  console.error('Failed to delete note:', error.message)
}
```

### Batch Delete Notes

```javascript
async function deleteMultipleNotes(noteIds) {
  const results = await Promise.allSettled(
    noteIds.map(id => deleteNote(id))
  )
  
  const successful = results.filter(r => r.status === 'fulfilled')
  const failed = results.filter(r => r.status === 'rejected')
  
  console.log(`Deleted ${successful.length} notes`)
  if (failed.length > 0) {
    console.warn(`Failed to delete ${failed.length} notes`)
  }
  
  return { successful: successful.length, failed: failed.length }
}

// Usage
try {
  const result = await deleteMultipleNotes(['u-123456', 'u-789012', 'u-345678'])
  console.log('Batch delete result:', result)
} catch (error) {
  console.error('Batch delete failed:', error.message)
}
```

---

## Search and Filter Examples

### Search Notes

```javascript
async function searchNotes(query) {
  const notes = await getNotes()
  return notes.filter(note => 
    note.title.toLowerCase().includes(query.toLowerCase()) ||
    note.content.toLowerCase().includes(query.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  )
}

// Usage
try {
  const results = await searchNotes('meeting')
  console.log('Search results:', results)
} catch (error) {
  console.error('Search failed:', error.message)
}
```

### Filter by Tag

```javascript
async function filterByTag(tag) {
  const notes = await getNotes()
  return notes.filter(note => 
    note.tags.includes(tag)
  )
}

// Usage
try {
  const workNotes = await filterByTag('work')
  console.log('Work notes:', workNotes)
} catch (error) {
  console.error('Filter failed:', error.message)
}

// Usage - Multiple tags
try {
  const notes = await getNotes()
  const multiTagNotes = notes.filter(note => 
    note.tags.some(tag => ['work', 'important'].includes(tag))
  )
  console.log('Work or important notes:', multiTagNotes)
} catch (error) {
  console.error('Multi-tag filter failed:', error.message)
}
```

### Filter by Note Type

```javascript
async function filterByType(type) {
  const notes = await getNotes()
  return notes.filter(note => note.type === type)
}

// Usage - Get only checklists
try {
  const checklists = await filterByType('checklist')
  console.log('Checklists:', checklists)
} catch (error) {
  console.error('Filter failed:', error.message)
}

// Usage - Get all drawings
try {
  const drawings = await filterByType('draw')
  console.log('Drawings:', drawings)
} catch (error) {
  console.error('Filter failed:', error.message)
}
```

### Filter Pinned Notes

```javascript
async function getPinnedNotes() {
  const notes = await getNotes()
  return notes.filter(note => note.pinned)
}

// Usage
try {
  const pinned = await getPinnedNotes()
  console.log('Pinned notes:', pinned)
} catch (error) {
  console.error('Failed to get pinned notes:', error.message)
}
```

---

## Collaboration Examples

### Add Collaborator to Note

```javascript
async function addCollaborator(noteId, username, permission = 'view') {
  return api(`/notes/${noteId}/collaborators`, {
    method: 'POST',
    body: JSON.stringify({ username, permission })
  })
}

// Usage - Add with view permission
try {
  const result = await addCollaborator('u-123456', 'alice')
  console.log('Collaborator added:', result)
} catch (error) {
  console.error('Failed to add collaborator:', error.message)
}

// Usage - Add with edit permission
try {
  const result = await addCollaborator('u-123456', 'bob', 'edit')
  console.log('Collaborator added with edit access:', result)
} catch (error) {
  console.error('Failed to add collaborator:', error.message)
}
```

### Get Note Collaborators

```javascript
async function getCollaborators(noteId) {
  const note = await getNote(noteId)
  return note.collaborators || []
}

// Usage
try {
  const collaborators = await getCollaborators('u-123456')
  console.log('Collaborators:', collaborators)
  
  // Display list
  collaborators.forEach(collab => {
    console.log(`${collab.username} (${collab.permission})`)
  })
} catch (error) {
  console.error('Failed to get collaborators:', error.message)
}
```

### Remove Collaborator

```javascript
async function removeCollaborator(noteId, userId) {
  return api(`/notes/${noteId}/collaborators/${userId}`, {
    method: 'DELETE'
  })
}

// Usage
try {
  await removeCollaborator('u-123456', 'user-789')
  console.log('Collaborator removed')
  
  // Refresh collaborators list
  const updated = await getCollaborators('u-123456')
  console.log('Updated collaborators:', updated)
} catch (error) {
  console.error('Failed to remove collaborator:', error.message)
}
```

### Update Collaborator Permission

```javascript
async function updateCollaboratorPermission(noteId, userId, permission) {
  return api(`/notes/${noteId}/collaborators/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ permission })
  })
}

// Usage
try {
  const result = await updateCollaboratorPermission('u-123456', 'user-789', 'edit')
  console.log('Permission updated:', result)
} catch (error) {
  console.error('Failed to update permission:', error.message)
}
```

---

## AI Assistant Examples

### Ask AI About Notes

```javascript
async function askAI(question, contextNotes = []) {
  return api('/ai/ask', {
    method: 'POST',
    body: JSON.stringify({
      question,
      notes: contextNotes
    })
  })
}

// Usage - Ask about all notes
try {
  const notes = await getNotes()
  const answer = await askAI('Summarize my project notes', notes)
  console.log('AI Answer:', answer)
} catch (error) {
  console.error('AI request failed:', error.message)
}

// Usage - Ask about specific notes
try {
  const recentNotes = (await getNotes()).slice(0, 5)
  const answer = await askAI('What are my pending tasks?', recentNotes)
  console.log('Pending tasks:', answer)
} catch (error) {
  console.error('AI request failed:', error.message)
}
```

### Transform Text

```javascript
async function transformText(text, instruction) {
  return api('/ai/transform', {
    method: 'POST',
    body: JSON.stringify({
      text,
      instruction
    })
  })
}

// Usage - Make text professional
try {
  const original = "hey can u help me with the project"
  const professional = await transformText(original, 'Make it professional')
  console.log('Original:', original)
  console.log('Professional:', professional)
} catch (error) {
  console.error('Text transformation failed:', error.message)
}

// Usage - Fix grammar
try {
  const original = "She don't like apples"
  const corrected = await transformText(original, 'Fix grammar')
  console.log('Corrected:', corrected)
} catch (error) {
  console.error('Grammar correction failed:', error.message)
}

// Usage - Summarize
try {
  const longText = "A very long text that needs summarizing..."
  const summary = await transformText(longText, 'Summarize in 2 sentences')
  console.log('Summary:', summary)
} catch (error) {
  console.error('Summarization failed:', error.message)
}
```

### Generate Image

```javascript
async function generateImage(prompt) {
  return api('/ai/generate-image', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  })
}

// Usage
try {
  const result = await generateImage('A modern office with blue accent colors')
  console.log('Generated image:', result.image_url)
  
  // Display image
  const img = document.createElement('img')
  img.src = result.image_url
  document.body.appendChild(img)
} catch (error) {
  console.error('Image generation failed:', error.message)
}
```

---

## Error Handling

### Centralized Error Handler

```javascript
class APIError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function apiWithErrorHandling(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options)
    
    if (!response.ok) {
      const error = await response.json()
      throw new APIError(
        error.message || 'API request failed',
        response.status,
        error.code
      )
    }
    
    return response.json()
  } catch (error) {
    if (error instanceof APIError) {
      // Handle API errors
      handleAPIError(error)
    } else {
      // Handle network errors
      handleNetworkError(error)
    }
    throw error
  }
}

function handleAPIError(error) {
  switch (error.status) {
    case 401:
      // Unauthorized - redirect to login
      console.log('Session expired, redirecting to login...')
      localStorage.removeItem('glassydash_token')
      window.location.href = '/login'
      break
    case 403:
      // Forbidden
      alert('You do not have permission to perform this action')
      break
    case 404:
      // Not found
      alert('The requested resource was not found')
      break
    case 500:
      // Internal server error
      alert('Server error. Please try again later.')
      break
    default:
      alert(`Error: ${error.message}`)
  }
}

function handleNetworkError(error) {
  if (error.message.includes('fetch')) {
    alert('Network error. Please check your internet connection.')
  } else {
    alert(`Unexpected error: ${error.message}`)
  }
}
```

### Retry Logic

```javascript
async function apiWithRetry(endpoint, options = {}, maxRetries = 3) {
  let lastError
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await api(endpoint, options)
    } catch (error) {
      lastError = error
      
      // Don't retry on 4xx errors (except 429)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000
      console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Usage
try {
  const notes = await apiWithRetry('/notes')
  console.log('Notes fetched successfully')
} catch (error) {
  console.error('Failed after retries:', error.message)
}
```

---

## Rate Limiting

### Implement Rate Limiting

```javascript
class RateLimiter {
  constructor(maxRequests, perMilliseconds) {
    this.maxRequests = maxRequests
    this.perMilliseconds = perMilliseconds
    this.requests = []
  }
  
  async wait() {
    const now = Date.now()
    
    // Remove old requests
    this.requests = this.requests.filter(
      time => now - time < this.perMilliseconds
    )
    
    // Check if we've exceeded limit
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0]
      const waitTime = this.perMilliseconds - (now - oldestRequest)
      
      console.log(`Rate limit reached. Waiting ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      
      return this.wait() // Retry after waiting
    }
    
    // Add current request
    this.requests.push(now)
  }
}

// Usage
const limiter = new RateLimiter(10, 60000) // 10 requests per minute

async function rateLimitedApi(endpoint, options = {}) {
  await limiter.wait()
  return api(endpoint, options)
}

// Usage in application
for (let i = 0; i < 20; i++) {
  rateLimitedApi('/notes').then(notes => {
    console.log(`Request ${i + 1}: Got ${notes.length} notes`)
  })
}
```

---

## Complete Integration Example

### React Hook Example

```javascript
import { useState, useEffect, useCallback } from 'react'

const API_BASE = '/api'

function useGlassyDash() {
  const [user, setUser] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // API helper
  const api = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem('glassydash_token')
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'API request failed')
    }
    
    return response.json()
  }, [])
  
  // Fetch notes
  const fetchNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await api('/notes')
      setNotes(data)
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch notes:', err)
    } finally {
      setLoading(false)
    }
  }, [api])
  
  // Create note
  const createNote = useCallback(async (noteData) => {
    setLoading(true)
    setError(null)
    
    try {
      const newNote = await api('/notes', {
        method: 'POST',
        body: JSON.stringify(noteData)
      })
      
      setNotes(prev => [...prev, newNote])
      return newNote
    } catch (err) {
      setError(err.message)
      console.error('Failed to create note:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [api])
  
  // Update note
  const updateNote = useCallback(async (noteId, updates) => {
    setLoading(true)
    setError(null)
    
    try {
      const updated = await api(`/notes/${noteId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
      
      setNotes(prev => 
        prev.map(note => 
          note.id === noteId ? { ...note, ...updated } : note
        )
      )
      
      return updated
    } catch (err) {
      setError(err.message)
      console.error('Failed to update note:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [api])
  
  // Delete note
  const deleteNote = useCallback(async (noteId) => {
    setLoading(true)
    setError(null)
    
    try {
      await api(`/notes/${noteId}`, {
        method: 'DELETE'
      })
      
      setNotes(prev => prev.filter(note => note.id !== noteId))
    } catch (err) {
      setError(err.message)
      console.error('Failed to delete note:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [api])
  
  // Login
  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await api('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
      
      localStorage.setItem('glassydash_token', result.token)
      setUser(result.user)
      
      return result
    } catch (err) {
      setError(err.message)
      console.error('Login failed:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [api])
  
  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('glassydash_token')
    setUser(null)
    setNotes([])
  }, [])
  
  // Initial load
  useEffect(() => {
    const token = localStorage.getItem('glassydash_token')
    if (token) {
      fetchNotes()
    }
  }, [fetchNotes])
  
  return {
    user,
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    login,
    logout,
    fetchNotes
  }
}

// Usage in component
function MyComponent() {
  const { notes, createNote, loading, error } = useGlassyDash()
  
  const handleCreate = async () => {
    try {
      await createNote({
        type: 'text',
        title: 'New Note',
        content: 'Note content here...'
      })
      console.log('Note created successfully!')
    } catch (err) {
      console.error('Failed to create note:', err)
    }
  }
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      <button onClick={handleCreate}>Create Note</button>
      <ul>
        {notes.map(note => (
          <li key={note.id}>{note.title}</li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Additional Resources

- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API documentation
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development guide
- **[USER_GUIDE.md](USER_GUIDE.md)** - User guide

---

**Document Version:** 1.0  
**Last Updated:** January 31, 2026  
**Status:** Complete