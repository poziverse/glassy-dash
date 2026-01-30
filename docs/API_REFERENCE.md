# API Reference

**Version:** 2.2  
**Base URL:** `/api`  
**Last Updated:** January 28, 2026

---

## Overview

This document provides comprehensive documentation for all GlassyDash API endpoints. All endpoints return JSON and use JWT authentication unless specified as public.

## Authentication

### POST `/register`

Register a new user account.

**Public Endpoint**

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "is_admin": false,
    "announcements_opt_out": false
  }
}
```

### POST `/login`

Login with email and password.

**Public Endpoint**

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):** Same as `/register`

### POST `/api/secret-key`

Generate a secret recovery key.

**Authentication:** Required

**Response (200 OK):**

```json
{
  "key": "sk-xxxxx..."
}
```

### POST `/login/secret`

Login using a secret recovery key.

**Public Endpoint**

**Request Body:**

```json
{
  "key": "sk-xxxxx..."
}
```

---

## Notes

### GET `/notes`

Get all notes for the user (including collaborated notes and announcements).

**Authentication:** Required

**Query Parameters:**

- `limit` (optional): Number of notes to return
- `offset` (optional): Offset for pagination

**Response (200 OK):**

```json
[
  {
    "id": "u-123456",
    "type": "text",
    "title": "My Note",
    "content": "Content...",
    "items": [], // Checklist items
    "tags": [],
    "images": [],
    "color": "default",
    "pinned": false,
    "is_announcement": false,
    "collaborators": []
  }
]
```

### POST `/notes`

Create a new note.

**Authentication:** Required

**Request Body:**

```json
{
  "type": "text", // text, checklist, draw, youtube, music
  "title": "New Note",
  "content": "Content...",
  "items": [],
  "tags": [],
  "images": [],
  "color": "default",
  "pinned": false,
  "is_announcement": false // Admin only for true
}
```

### PATCH `/notes/:id`

Partial update of a note.

**Authentication:** Required (Owner or Collaborator)

**Request Body:** (Any subset of note fields)

### DELETE `/notes/:id`

Delete a note (soft delete) or dismiss an announcement.

**Authentication:** Required

---

## Admin & Users

### GET `/admin/users`

List all users.

**Authentication:** Required (Admin only)

### DELETE `/admin/users/:id`

Delete a user.

**Authentication:** Required (Admin only)

### PATCH `/users/me/settings`

Update user preferences (e.g., announcement opt-out).

**Authentication:** Required

---

## AI Assistant

### POST `/ai/ask`

Ask the AI context-aware questions.

**Request Body:**

```json
{
  "question": "Summarize my project notes",
  "notes": [...] // Optional context
}
```

### POST `/ai/transform`

Transform text (rewrite, fix grammar, etc.).

**Request Body:**

```json
{
  "text": "original text",
  "instruction": "make it professional"
}
```

### POST `/ai/generate-image`

Generate images via AI.

**Request Body:**

```json
{
  "prompt": "A futuristic city"
}
```

---

## Multimedia

### GET `/icons/:collection/:name`

Fetch and customize an SVG icon.

**Parameters:**

- `collection`: Icon set name (e.g., `lucide`)
- `name`: Icon name (e.g., `home`)
- `color`: Hex color (optional)
- `size`: Size in px (optional)
- `type`: `gradient` (optional)

### GET `/youtube/metadata/:videoId`

Fetch metadata for a YouTube video.

### Music API

- **POST** `/music/subsonic-auth`: Generate auth token.
- **GET** `/music/stream`: Proxy audio stream.
- **GET** `/music/cover`: Proxy cover art.
- **ALL** `/music/proxy`: Generic proxy (GET/POST/DELETE) for specialized calls (Lyrics, Casting).
- **POST** `/music/test-connection`: Test server connection (Supports Swing Music, Jellyfin, Subsonic).

---

## Bug Reports

### POST `/bug-reports`

Submit a bug report.

### GET `/bug-reports`

List bug reports (Admin only).

### PATCH `/bug-reports/:id`

Update bug report status (Admin only).

---

## Monitoring (Admin/System)

### GET `/monitoring/health`

System health status (DB, Cache, Memory, Disk).

### GET `/monitoring/metrics`

System metrics (CPU, Memory, Requests).

### GET `/monitoring/migrations`

Database migration status.

### POST `/monitoring/migrations/run`

Run pending migrations (Admin only).
