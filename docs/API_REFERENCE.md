# API Reference

**Version:** ALPHA 1.0  
**Base URL:** `/api`  
**Last Updated:** January 19, 2026

---

## Overview

This document provides comprehensive documentation for all GlassKeep API endpoints. All endpoints return JSON and use JWT authentication unless specified as public.

---

## Authentication

### Base URL

```
/api/auth
```

### POST `/register`

Register a new user account.

**Public Endpoint** - No authentication required

**Request Body:**

```json
{
  "username": "johndoe",
  "password": "securePassword123",
  "email": "john@example.com"
}
```

**Response (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "is_admin": false,
    "created_at": "2026-01-19T12:00:00.000Z"
  }
}
```

**Errors:**

- `400 Bad Request` - Invalid input data
- `409 Conflict` - Username or email already exists

---

### POST `/login`

Login with username and password.

**Public Endpoint** - No authentication required

**Request Body:**

```json
{
  "username": "johndoe",
  "password": "securePassword123"
}
```

**Response (200 OK):**
Same as `/register`

**Errors:**

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Invalid credentials

---

### POST `/secret-key`

Login using secret recovery key.

**Public Endpoint** - No authentication required

**Request Body:**

```json
{
  "key": "sk-xxxxx-xxxxx-xxxxx-xxxxx"
}
```

**Response (200 OK):**
Same as `/register`

**Errors:**

- `400 Bad Request` - Invalid key format
- `401 Unauthorized` - Invalid or expired key

---

### GET `/settings`

Get authentication settings.

**Public Endpoint** - No authentication required

**Response (200 OK):**

```json
{
  "allow_registration": true
}
```

---

### POST `/logout`

Logout and invalidate token.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "message": "Logged out successfully"
}
```

---

## Notes

### Base URL

```
/api/notes
```

### GET `/`

Get all notes for the authenticated user.

**Authentication:** Required

**Query Parameters:**

- `tag` (optional, string) - Filter by tag name
- `archived` (optional, boolean) - Get archived notes only
- `search` (optional, string) - Search in title and content

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "user_id": 1,
    "type": "text",
    "title": "My Note",
    "content": "Note content here",
    "items": [],
    "tags": ["work", "important"],
    "color": "default",
    "transparency": "medium",
    "images": [
      {
        "id": "img-123",
        "src": "data:image/jpeg;base64,...",
        "name": "photo.jpg"
      }
    ],
    "pinned": true,
    "archived": false,
    "position": 1234567890,
    "timestamp": "2026-01-19T12:00:00.000Z",
    "updated_at": "2026-01-19T12:30:00.000Z",
    "lastEditedBy": "john@example.com",
    "lastEditedAt": "2026-01-19T12:30:00.000Z",
    "collaborators": []
  }
]
```

---

### GET `/archived`

Get archived notes only.

**Authentication:** Required

**Response (200 OK):**
Same as `GET /` (filtered for archived notes)

---

### POST `/`

Create a new note.

**Authentication:** Required

**Request Body:**

```json
{
  "type": "text",
  "title": "New Note",
  "content": "Note content here",
  "items": [],
  "tags": ["new"],
  "color": "default",
  "transparency": "medium",
  "images": [],
  "pinned": false
}
```

**Note Types:**

- `text` - Plain text note
- `checklist` - Todo list with items
- `draw` - Drawing canvas (content is JSON)

**Response (201 Created):**

```json
{
  "id": 1,
  ...note object
}
```

**Errors:**

- `400 Bad Request` - Invalid input data
- `413 Payload Too Large` - Image exceeds 10MB

---

### GET `/:id`

Get a specific note by ID.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "id": 1,
  ...note object
}
```

**Errors:**

- `404 Not Found` - Note doesn't exist or user doesn't have access

---

### PUT `/:id`

**Full Update / Replacement.**

**Authentication:** Required

**Warning:** This replaces the entire note record in the database. Omitting fields (like `items` or `images`) will result in data loss for those fields. Use this primarily for full-form saves from the Edit Modal.

**Request Body:**
Same as `POST /`

**Response (200 OK):**

```json
{
  "id": 1,
  ...updated note object
}
```

**Errors:**

- `400 Bad Request` - Invalid input data
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Note doesn't exist

---

### PATCH `/:id`

**Partial Update (Recommended for most operations).**

**Authentication:** Required

**Crucial for Data Integrity:** Use this endpoint for toggling status (pinned, archived, checked), changing colors, or reordering. Only the fields provided in the request body will be modified.

**Request Body (any subset of note fields):**

```json
{
  "title": "Updated Title",
  "pinned": true,
  "archived": false
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  ...updated note object
}
```

---

### DELETE `/:id`

Delete a note.

**Authentication:** Required

**Response (204 No Content)**

- Empty response body

**Errors:**

- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Note doesn't exist

---

### POST `/:id/archive`

Archive or unarchive a note.

**Authentication:** Required

**Request Body:**

```json
{
  "archived": true
}
```

**Response (204 No Content)**

---

### POST `/reorder`

Reorder multiple notes.

**Authentication:** Required

**Request Body:**

```json
{
  "positions": [
    { "id": 1, "position": 10 },
    { "id": 2, "position": 9 },
    { "id": 3, "position": 8 }
  ]
}
```

**Response (204 No Content)**

---

### GET `/export`

Export all notes as JSON.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "exportDate": "2026-01-19T12:00:00.000Z",
  "userId": 1,
  "username": "johndoe",
  "notes": [
    ...array of note objects
  ]
}
```

---

### POST `/import`

Import notes from JSON.

**Authentication:** Required

**Request Body:**

```json
{
  "notes": [
    ...array of note objects
  ]
}
```

**Response (200 OK):**

```json
{
  "imported": 42,
  "failed": 0,
  "errors": []
}
```

---

### POST `/import/google-keep`

Import notes from Google Keep export format.

**Authentication:** Required

**Request Body:**

```json
{
  "content": "<!DOCTYPE html>...Google Keep HTML..."
}
```

**Response (200 OK):**
Same as `/import`

---

### POST `/import/markdown`

Import notes from Markdown files.

**Authentication:** Required

**Request Body:**

```json
{
  "files": [
    {
      "filename": "note1.md",
      "content": "# My Note\n\nContent here"
    }
  ]
}
```

**Response (200 OK):**
Same as `/import`

---

## Collaboration

### Base URL

```
/api/notes/:id/collaborators
```

### GET `/`

Get all collaborators for a note.

**Authentication:** Required

**Response (200 OK):**

```json
[
  {
    "id": 2,
    "username": "jane",
    "email": "jane@example.com",
    "name": "Jane Smith"
  }
]
```

---

### POST `/`

Add a collaborator to a note.

**Authentication:** Required

**Request Body:**

```json
{
  "username": "jane"
}
```

**Response (200 OK):**

```json
{
  "message": "Collaborator added",
  "collaborator": {
    "id": 2,
    "username": "jane",
    "email": "jane@example.com"
  }
}
```

**Errors:**

- `400 Bad Request` - User not found
- `403 Forbidden` - User doesn't have permission

---

### DELETE `/`

Remove a collaborator from a note.

**Authentication:** Required

**Request Body:**

```json
{
  "username": "jane"
}
```

**Response (200 OK):**

```json
{
  "message": "Collaborator removed"
}
```

---

## Users

### Base URL

```
/api/users
```

### GET `/search`

Search for users (for collaboration).

**Authentication:** Required

**Query Parameters:**

- `q` (required, string) - Search query

**Response (200 OK):**

```json
[
  {
    "id": 2,
    "username": "jane",
    "email": "jane@example.com",
    "name": "Jane Smith"
  }
]
```

---

### GET `/profile`

Get current user profile.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "name": "John Doe",
  "is_admin": false,
  "created_at": "2026-01-01T12:00:00.000Z"
}
```

---

### PATCH `/profile`

Update user profile.

**Authentication:** Required

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response (200 OK):**

```json
{
  "id": 1,
  ...updated profile
}
```

---

## Admin

### Base URL

```
/api/admin
```

### GET `/users`

Get all users (admin only).

**Authentication:** Required (Admin role)

**Query Parameters:**

- `limit` (optional, integer) - Number of results (default 100)
- `offset` (optional, integer) - Skip N results

**Response (200 OK):**

```json
[
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "is_admin": true,
    "notes": 42,
    "storage_bytes": 5242880,
    "created_at": "2026-01-01T12:00:00.000Z"
  }
]
```

**Errors:**

- `403 Forbidden` - Not an admin

---

### DELETE `/users/:id`

Delete a user and all their notes (admin only).

**Authentication:** Required (Admin role)

**Response (204 No Content)**

**Errors:**

- `403 Forbidden` - Not an admin or trying to delete yourself
- `404 Not Found` - User doesn't exist

---

### GET `/stats`

Get system statistics (admin only).

**Authentication:** Required (Admin role)

**Response (200 OK):**

```json
{
  "users": {
    "total": 42,
    "active": 38,
    "admins": 2
  },
  "notes": {
    "total": 1234,
    "pinned": 45,
    "archived": 89
  },
  "storage": {
    "total_bytes": 104857600,
    "total_mb": 100,
    "per_user": {
      "average_mb": 2.4,
      "max_mb": 50
    }
  },
  "system": {
    "uptime_seconds": 86400,
    "version": "1.0.0",
    "node_version": "v18.0.0"
  }
}
```

---

## Settings

### Base URL

```
/api/settings
```

### PATCH `/`

Update user settings.

**Authentication:** Required

**Request Body:**

```json
{
  "dark": true,
  "backgroundImage": "City-Night.png",
  "backgroundOverlay": true,
  "accentColor": "rose",
  "cardTransparency": "medium",
  "alwaysShowSidebarOnWide": true,
  "localAiEnabled": false
}
```

**Available Settings:**

- `dark` (boolean) - Dark mode
- `backgroundImage` (string) - Background filename
- `backgroundOverlay` (boolean) - Show overlay
- `accentColor` (string) - Accent color preset
- `cardTransparency` (string) - Card transparency level
- `alwaysShowSidebarOnWide` (boolean) - Sidebar visibility
- `localAiEnabled` (boolean) - AI assistant enabled

**Response (200 OK):**

```json
{
  "message": "Settings updated",
  "settings": { ...updated settings }
}
```

---

### GET `/`

Get current user settings.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "dark": true,
  "backgroundImage": "City-Night.png",
  "accentColor": "rose",
  ...all settings
}
```

---

## AI (Artificial Intelligence)

### Base URL

```
/api/ai
```

### POST `/chat`

Chat with AI assistant.

**Authentication:** Required

**Request Body:**

```json
{
  "message": "What are my notes about?",
  "context": {
    "notesCount": 42,
    "recentTags": ["work", "personal", "ideas"]
  }
}
```

**Response (200 OK):**

```json
{
  "response": "Based on your notes, you have...",
  "model": "Llama-3.2-1B",
  "timestamp": "2026-01-19T12:00:00.000Z"
}
```

**Errors:**

- `400 Bad Request` - AI disabled or invalid input
- `500 Internal Server Error` - AI model error

---

## Server-Sent Events (SSE)

### `/events`

Real-time note updates via SSE.

**Authentication:** Required (via query parameter or header)

**Query Parameters:**

- `token` (optional, string) - JWT token (alternative to Authorization header)
- `tag` (optional, string) - Filter by tag

**Connection Example:**

```javascript
const eventSource = new EventSource('/api/notes/events?token=<jwt>')

eventSource.addEventListener('notes-updated', e => {
  const data = JSON.parse(e.data)
  console.log('Notes updated:', data)
})

eventSource.addEventListener('collaboration', e => {
  const data = JSON.parse(e.data)
  console.log('Collaboration event:', data)
})
```

**Event Types:**

#### `notes-updated`

Emitted when notes are created, updated, or deleted.

```json
{
  "type": "notes-updated",
  "timestamp": "2026-01-19T12:00:00.000Z",
  "data": {
    "action": "created|updated|deleted|archived",
    "noteId": 123
  }
}
```

#### `collaboration`

Emitted when collaborators are added or removed.

```json
{
  "type": "collaboration",
  "timestamp": "2026-01-19T12:00:00.000Z",
  "data": {
    "noteId": 123,
    "username": "jane",
    "action": "added|removed",
    "details": "User added as collaborator"
  }
}
```

#### `presence`

Emitted when users view or edit notes.

```json
{
  "type": "presence",
  "timestamp": "2026-01-19T12:00:00.000Z",
  "data": {
    "noteId": 123,
    "users": [
      {
        "username": "jane",
        "lastSeen": "2026-01-19T12:00:00.000Z"
      }
    ]
  }
}
```

---

## Secret Key

### Base URL

```
/api/secret-key
```

### POST `/`

Generate and download secret recovery key.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "key": "sk-xxxxx-xxxxx-xxxxx-xxxxx"
}
```

**Note:** Secret keys are one-time use and must be stored securely.

---

## Health & Monitoring

### GET `/health`

Overall system health check.

**Public Endpoint** - No authentication required

**Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-19T12:00:00.000Z",
  "checks": {
    "database": "healthy",
    "cache": "healthy",
    "memory": "healthy",
    "disk": "healthy"
  },
  "details": {
    "memory": {
      "used_percent": 45.2,
      "heap_mb": 180,
      "rss_mb": 250
    },
    "disk": {
      "used_percent": 65.8,
      "free_gb": 150,
      "total_gb": 500
    }
  }
}
```

---

### GET `/ready`

Kubernetes readiness probe (database check only).

**Public Endpoint** - No authentication required

**Response (200 OK):**

```json
{
  "status": "ready",
  "timestamp": "2026-01-19T12:00:00.000Z"
}
```

**Response (503 Service Unavailable):**

```json
{
  "status": "not_ready",
  "timestamp": "2026-01-19T12:00:00.000Z",
  "error": "Database connection failed"
}
```

---

### GET `/metrics`

Comprehensive system metrics.

**Public Endpoint** - No authentication required

**Response (200 OK):**

```json
{
  "performance": {
    "requests": {
      "total": 10000,
      "duration_avg_ms": 45,
      "duration_max_ms": 500,
      "slow_percent": 2.3
    },
    "database": {
      "queries": {
        "total": 50000,
        "duration_avg_ms": 5,
        "duration_max_ms": 100,
        "slow_percent": 0.5
      }
    },
    "ai": {
      "operations": {
        "total": 500,
        "duration_avg_ms": 1500,
        "duration_max_ms": 5000,
        "slow_percent": 5.0
      }
    }
  },
  "system": {
    "uptime_seconds": 86400,
    "memory": {
      "heap_mb": 180,
      "rss_mb": 250,
      "external_mb": 50
    },
    "cpu": {
      "user_percent": 15.2,
      "system_percent": 8.5
    }
  },
  "cache": {
    "hits": 45000,
    "misses": 5000,
    "hit_rate": 0.9
  }
}
```

---

### GET `/metrics/prometheus`

Metrics in Prometheus format for scraping.

**Public Endpoint** - No authentication required

**Response:** Plain text in Prometheus format

```
# HELP GLASSYDASH_requests_total Total number of requests
# TYPE GLASSYDASH_requests_total counter
GLASSYDASH_requests_total 10000

# HELP GLASSYDASH_request_duration_seconds Request duration
# TYPE GLASSYDASH_request_duration_seconds histogram
GLASSYDASH_request_duration_seconds_bucket{le="0.1"} 5000
GLASSYDASH_request_duration_seconds_bucket{le="0.5"} 8000
GLASSYDASH_request_duration_seconds_bucket{le="1"} 9500
GLASSYDASH_request_duration_seconds_bucket{le="+Inf"} 10000
GLASSYDASH_request_duration_seconds_sum 450
GLASSYDASH_request_duration_seconds_count 10000
```

---

### GET `/info`

Application information.

**Public Endpoint** - No authentication required

**Response (200 OK):**

```json
{
  "name": "GlassKeep",
  "version": "1.0.0",
  "description": "Modern note-taking application",
  "features": [
    "authentication",
    "real-time collaboration",
    "ai assistant",
    "import export",
    "pwa support"
  ],
  "endpoints": {
    "api": "/api",
    "health": "/health",
    "ready": "/ready",
    "metrics": "/metrics"
  },
  "docs": "https://docs.GLASSYDASH.example.com"
}
```

---

### GET `/migrations`

Database migration status.

**Public Endpoint** - No authentication required

**Response (200 OK):**

```json
{
  "current_version": 4,
  "pending_migrations": [],
  "applied_migrations": [
    {
      "version": 1,
      "name": "initial_schema",
      "applied_at": "2026-01-01T12:00:00.000Z"
    },
    {
      "version": 2,
      "name": "add_indexes",
      "applied_at": "2026-01-05T12:00:00.000Z"
    }
  ]
}
```

---

### POST `/migrations/run`

Run pending migrations (admin only).

**Authentication:** Required (Admin role)

**Request Body:**

```json
{
  "target_version": null
}
```

**Response (200 OK):**

```json
{
  "message": "Migrations applied successfully",
  "applied": [
    {
      "version": 5,
      "name": "add_new_feature",
      "applied_at": "2026-01-19T12:00:00.000Z"
    }
  ]
}
```

---

## Logging

### Base URL

```
/api/logs
```

### POST `/`

Submit log entry from client.

**Public Endpoint** - No authentication required

**Request Body:**

```json
{
  "level": "error|warn|info|debug",
  "action": "event_name",
  "context": {
    "endpoint": "/api/notes",
    "status": 500,
    "method": "GET"
  },
  "userId": 1,
  "sessionId": "sess-abc123",
  "error": {
    "message": "Network timeout",
    "name": "AbortError",
    "stack": "..."
  }
}
```

**Response (200 OK):**

```json
{
  "message": "Log entry received"
}
```

---

### GET `/`

Query logs (admin only).

**Authentication:** Required (Admin role)

**Query Parameters:**

- `date` (optional, string) - Filter by date (YYYY-MM-DD)
- `level` (optional, string) - Filter by level (error, warn, info, debug)
- `action` (optional, string) - Filter by action name
- `userId` (optional, integer) - Filter by user ID
- `limit` (optional, integer) - Number of entries (default 100, max 1000)
- `offset` (optional, integer) - Skip N entries (default 0)

**Response (200 OK):**

```json
{
  "entries": [
    {
      "timestamp": "2026-01-19T12:00:00.000Z",
      "level": "error",
      "action": "api_error",
      "context": {
        "endpoint": "/api/notes",
        "status": 500
      },
      "userId": 1,
      "sessionId": "sess-abc123",
      "requestId": "req-1234567890"
    }
  ],
  "total": 50,
  "limit": 100,
  "offset": 0
}
```

---

### GET `/stats`

Get logging statistics (admin only).

**Authentication:** Required (Admin role)

**Query Parameters:**

- `days` (optional, integer) - Number of days to analyze (default 7)

**Response (200 OK):**

```json
{
  "levelDistribution": {
    "error": 45,
    "warn": 120,
    "info": 850,
    "debug": 200
  },
  "topActions": [
    {
      "action": "user_login",
      "count": 142
    },
    {
      "action": "note_created",
      "count": 89
    }
  ],
  "totalEvents": 1215,
  "uniqueUsers": 8,
  "period": {
    "start": "2026-01-12T00:00:00.000Z",
    "end": "2026-01-19T12:00:00.000Z",
    "days": 7
  }
}
```

---

### POST `/export`

Export logs as CSV/JSON (admin only).

**Authentication:** Required (Admin role)

**Request Body:**

```json
{
  "format": "csv|json",
  "filters": {
    "level": "error",
    "startDate": "2026-01-12"
  }
}
```

**Response (200 OK):**
File download with appropriate `Content-Type` header.

---

## Error Responses

All endpoints may return standardized error responses:

### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Invalid request data",
  "details": {
    "field": "username",
    "message": "Username is required"
  }
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

Rate limits are applied per endpoint type:

| Endpoint Type    | Limit        | Window   |
| ---------------- | ------------ | -------- |
| Standard         | 100 requests | 1 minute |
| Auth endpoints   | 10 requests  | 1 minute |
| Upload endpoints | 10 requests  | 1 minute |
| AI endpoints     | 20 requests  | 1 minute |

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642521600
Retry-After: 60
```

---

## Authentication

### JWT Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Or via query parameter (for SSE):

```
/api/notes/events?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Expiration

- **Default:** 7 days
- **Refresh:** Required on expiration (401 response)

---

## CORS

Cross-Origin Resource Sharing is enabled for:

- Development: `http://localhost:5173`
- Production: Configured domains in `CORS_ORIGIN` environment variable

**CORS Headers:**

```
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## File Uploads

### Image Upload

Images are uploaded as part of note creation/updates, stored as base64 in the note object.

**Supported Formats:**

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

**Size Limit:** 10MB per image

**Compression:** Client-side compression applied before upload

---

## Security Headers

All API responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

---

## API Versioning

**Current Version:** v1.0

Version is included in response headers:

```
X-API-Version: 1.0.0
```

Future breaking changes will be released under `/api/v2/`

---

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"password123"}'

# Get notes
curl http://localhost:3000/api/notes \
  -H "Authorization: Bearer <token>"

# Create note
curl -X POST http://localhost:3000/api/notes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Note","content":"Test content","type":"text"}'
```

### Using JavaScript/Fetch

```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'password123',
  }),
})
const { token } = await loginResponse.json()

// Get notes
const notesResponse = await fetch('/api/notes', {
  headers: { Authorization: `Bearer ${token}` },
})
const notes = await notesResponse.json()
```

---

## Best Practices

1. **Authentication:** Always include valid JWT token
2. **Error Handling:** Check response status and handle gracefully
3. **Rate Limiting:** Implement exponential backoff
4. **Caching:** Cache note data, invalidate on SSE events
5. **Optimistic Updates:** Update UI immediately, rollback on error
6. **Image Compression:** Compress images before uploading
7. **Debouncing:** Debounce search and autocomplete requests
8. **Connection Handling:** Implement proper SSE reconnection

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Complete
