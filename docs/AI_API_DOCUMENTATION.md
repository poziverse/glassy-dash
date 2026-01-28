# AI Provider API Documentation
# Complete Reference for GlassyDash Multi-Provider AI System

## Overview

GlassyDash's AI system now supports multiple AI providers with intelligent routing and fallback capabilities. This document provides complete API reference for frontend developers.

## Base URL

All AI endpoints are prefixed with `/api/ai`

---

## Authentication

All AI endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Core AI Endpoints

### 1. Ask AI Assistant

Generate responses to questions using AI.

**Endpoint:** `POST /api/ai/ask`

**Request Body:**
```json
{
  "question": "What is the capital of France?",
  "notes": [],
  "provider": "gemini",
  "options": {
    "temperature": 0.7,
    "maxTokens": 2048
  }
}
```

**Response:**
```json
{
  "answer": "The capital of France is Paris.",
  "citations": [],
  "model": "gemini-2.5-flash",
  "provider": "gemini",
  "finishReason": "stop",
  "usage": {
    "totalTokens": 45,
    "promptTokens": 12,
    "completionTokens": 33
  },
  "latency": 234,
  "userProviders": ["gemini", "zai"]
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| question | string | Yes | The question to ask AI |
| notes | array | No | Notes context for the question (max 10) |
| provider | string | No | Preferred provider to use (gemini, zai, ollama) |
| options.temperature | number | No | 0.0 - 1.0 (default: 0.7) |
| options.maxTokens | number | No | 1 - 8192 (default: 2048) |

**Notes:**
- If `provider` is specified and user has that provider configured, it will be used
- Otherwise, the router automatically selects the best available provider
- `citations` are extracted from AI responses when available
- `latency` is measured in milliseconds

---

### 2. Streaming Ask (NEW)

Stream AI responses in real-time using Server-Sent Events (SSE).

**Endpoint:** `POST /api/ai/ask-stream`

**Request Body:**
```json
{
  "question": "Tell me a story",
  "notes": [],
  "provider": "gemini",
  "options": {
    "temperature": 0.8,
    "maxTokens": 4096
  }
}
```

**Response:** Server-Sent Events (text/event-stream)

**Event Types:**

1. `chunk` - Partial response chunk
```json
{
  "chunk": "Once upon a time...",
  "isComplete": false
}
```

2. `complete` - Final response
```json
{
  "content": "Full response here...",
  "isComplete": true,
  "provider": "gemini",
  "latency": 856
}
```

3. `error` - Error occurred
```json
{
  "error": "Error message here",
  'isComplete': true
}
```

**Parameters:** Same as `/api/ai/ask`

**Notes:**
- Set `Accept: text/event-stream` header
- Set `Cache-Control: no-cache` header
- Keep connection alive with ping events every 25 seconds
- Handle disconnects gracefully

---

### 3. Transform Text

Transform text according to instructions (for inline editor AI).

**Endpoint:** `POST /api/ai/transform`

**Request Body:**
```json
{
  "text": "fix grammar and make more professional",
  "instruction": "Rewrite this text",
  "provider": "gemini"
}
```

**Response:**
```json
{
  "transformed": "Fixed grammar and made more professional.",
  "provider": "gemini",
  "latency": 145
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| text | string | Yes | Text to transform |
| instruction | string | Yes | Transformation instruction |
| provider | string | No | Preferred provider to use |

---

### 4. Generate Image

Generate images using AI (Z.ai for best quality).

**Endpoint:** `POST /api/ai/generate-image`

**Request Body:**
```json
{
  "prompt": "A beautiful mountain landscape at sunset",
  "provider": "zai"
}
```

**Response:**
```json
{
  "imageUrl": "https://example.com/generated-image.jpg",
  "provider": "zai",
  "latency": 2341
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | string | Yes | Image generation prompt (max 500 chars) |

**Notes:**
- Image generation routes to Z.ai provider by default for best quality
- Returns direct image URL (can be embedded directly)
- Generated images are NOT stored on the server
- Latency for image generation is typically 2-5 seconds

---

### 5. Transcribe Audio

Transcribe audio to text using AI.

**Endpoint:** `POST /api/ai/transcribe`

**Request Body:**
```json
{
  "audioData": {
    "data": "base64-encoded-audio-data",
    "mimeType": "audio/webm"
  },
  "provider": "gemini"
}
```

**Response:**
```json
{
  "transcript": "Hello, this is a test transcription.",
  "summary": "User says hello for testing.",
  "language": "en",
  "provider": "gemini",
  "latency": 1234
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| audioData.data | string | Yes | Base64-encoded audio data |
| audioData.mimeType | string | No | MIME type (default: audio/webm) |
| provider | string | No | Preferred provider to use |

**Notes:**
- Audio data is base64-encoded
- Transcription includes both transcript and summary
- Language is detected automatically

---

## Provider Management

### 6. Get All Providers

Get all configured AI providers for current user.

**Endpoint:** `GET /api/ai/providers`

**Response:**
```json
{
  "providers": [
    {
      "id": "1",
      "userId": 1,
      "providerType": "gemini",
      "apiKey": "***",
      "model": "gemini-2.5-flash",
      "baseUrl": null,
      "options": {},
      "isActive": true,
      "createdAt": "2026-01-28T00:00:00.000Z",
      "updatedAt": "2026-01-28T00:00:00.000Z"
    }
  ],
  "active": ["gemini"],
  "registered": ["gemini", "zai", "ollama"]
}
```

**Response Fields:**

| Field | Description |
|-------|-------------|
| providers | User's configured providers (API key masked) |
| active | Currently active provider types |
| registered | Available provider types |

---

### 7. Add Provider

Add a new AI provider configuration.

**Endpoint:** `POST /api/ai/providers/add`

**Request Body:**
```json
{
  "type": "gemini",
  "apiKey": "AIzaSyCDEADB8JhP...",
  "model": "gemini-2.5-flash",
  "baseUrl": null,
  "options": {
    "temperature": 0.7,
    "maxTokens": 2048
  },
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "provider": {
    "id": "1",
    "type": "gemini",
    "apiKey": "***",
    "model": "gemini-2.5-flash",
    "isActive": true
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | Yes | Provider type (gemini, zai, ollama) |
| apiKey | string | Yes | Your API key (encrypted on server) |
| model | string | No | Model to use (provider-specific) |
| baseUrl | string | No | Custom base URL (for self-hosted) |
| options | object | No | Provider-specific options |
| isActive | boolean | No | Whether provider is active (default: true) |

---

### 8. Remove Provider

Remove a configured provider.

**Endpoint:** `DELETE /api/ai/providers/:type`

**Parameters:**

| Parameter | Type | Description |
|-----------|------|----------|
| type | string | Provider type to remove (gemini, zai, ollama) |

**Response:**
```json
{
  "success": true,
  "type": "zai"
}
```

---

### 9. Activate Provider

Set a provider as active (deactivates others of same type).

**Endpoint:** `PUT /api/ai/providers/:type/activate`

**Request Body:**
```json
{
  "providerId": 1
}
```

**Response:**
```json
{
  "success": true,
  "type": "gemini",
  "providerId": 1
}
```

---

### 10. Deactivate Provider

Deactivate a provider (all providers of same type).

**Endpoint:** `PUT /api/ai/providers/:type/deactivate`

**Parameters:**

| Parameter | Type | Description |
|-----------|------|----------|
| type | string | Provider type to deactivate |

**Response:**
```json
{
  'success': true,
  'type': 'zai'
}
```

---

### 11. Get Provider by Type

Get a specific provider configuration.

**Endpoint:** `GET /api/ai/providers/:type`

**Parameters:**

| Parameter | Type | Description |
|-----------|------|----------|
| type | string | Provider type (gemini, zai, ollama) |

**Response:**
```json
{
  "id": "1",
  "type": "gemini",
  "apiKey": "***",
  "model": "gemini-2.5-flash",
  "isActive": true
}
```

---

### 12. Get Provider Settings

Get all user's AI provider settings.

**Endpoint:** `GET /api/ai/providers/settings`

**Response:**
```json
{
  "settings": {
    "defaultProvider": "gemini",
    "streamingEnabled": true
  }
}
```

---

### 13. Update Provider

Update a provider configuration.

**Endpoint:** `PUT /api/ai/providers/:providerId`

**Request Body:**
```json
{
  "apiKey": "new-api-key",
  "model": "gemini-2.5-flash",
  "options": {
    "temperature": 0.8
  },
  "isActive": true
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| providerId | number | Yes | Provider ID to update |
| apiKey | string | No | New API key |
| model | string | No | New model |
| options | object | No | New options |
| baseUrl | string | No | New base URL |
| isActive | boolean | No | New active status |

**Response:**
```json
{
  "success": true,
  "provider": {
    "id": "1",
    "type": "gemini",
    "apiKey": "***",
    "model": "gemini-2.5-flash",
    "isActive": true
  }
}
```

---

## Health & Monitoring

### 14. Get Provider Health

Get health status for all providers.

**Endpoint:** `GET /api/ai/health`

**Response:**
```json
{
  "providers": [
    {
      "type": "gemini",
      "status": "healthy",
      "latency": 45,
      "error": null,
      "lastCheck": "2026-01-28T12:45:00.000Z"
    },
    {
      "type": "zai",
      "status": "healthy",
      "latency": 234,
      "error": null,
      "lastCheck": "2026-01-28T12:45:05.000Z"
    }
  ]
}
```

**Response Fields:**

| Field | Description |
|-------|-------------|
| status | Provider health status (healthy, unhealthy, error) |
| latency | Last request latency in milliseconds |
| error | Error message if unhealthy |
| lastCheck | Timestamp of last health check |

---

### 15. Get Specific Provider Health

Get health status for a specific provider.

**Endpoint:** `GET /api/ai/health/:type`

**Parameters:**

| Parameter | Type | Description |
|-----------|------|----------|-------------|
| type | string | Provider type (gemini, zai, ollama) |

**Response:**
```json
{
  "type": "gemini",
  "status": "healthy",
  "latency": 45,
  "error": null,
  "lastCheck": "2026-01-28T12:45:00.000Z"
}
```

---

### 16. Get AI Status

Get overall AI system status.

**Endpoint:** `GET /api/ai/status`

**Response:**
```json
{
  "status": "operational",
  "providers": ["gemini", "zai"],
  "registered": ["gemini", "zai", "ollama"],
  "metrics": {
    "totalRequests": 1234,
    "averageLatency": 234
  },
  "userProviders": ["gemini", "zai"],
  "environmentProviders": ["gemini"]
}
```

**Response Fields:**

| Field | Description |
|-------|-------------|
| status | Overall system status (operational, degraded, maintenance) |
| providers | Active provider types |
| registered | All registered provider types |
| metrics | Aggregate usage metrics |
| userProviders | User's configured provider types |
| environmentProviders | Providers configured in environment |

---

## Provider Types

### Gemini (Google)

- **Type:** `gemini`
- **Display Name:** Google Gemini
- **Capabilities:** Text, Audio, Images, Streaming, Structured Output, Tools, Multimodal, Embeddings
- **Models:** gemini-3-flash-preview, gemini-2.5-flash, gemini-2.0-flash-exp
- **Color:** #4285F
- **Docs:** https://cloud.google.com/vertex-ai/docs

### Z.ai

- **Type:** `zai`
- **Display Name:** Z.ai
- **Capabilities:** Text, Images, Streaming
- **Models:** 4.7, 4.6, 4.5 Air
- **Color:** #7C3ED
- **Docs:** https://z.ai/docs

### Ollama (Local)

- **Type:** `ollama`
- **Display Name:** Ollama (Local)
- **Capabilities:** Text, Images, Streaming
- **Models:** llama2, llama3, codellama, mistral
- **Color:** #6B7280
- **Docs:** https://ollama.ai/docs

---

## Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Admin access required |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable - AI provider down |

---

## Rate Limiting

- **Auth endpoints:** 20 requests per 15 minutes
- **API endpoints:** 100 requests per 15 minutes
- **Secret key login:** 5 attempts per hour

---

## Best Practices

1. **Use Streaming for Long Responses** - Streaming provides better UX for responses that take more than a few seconds
2. **Specify Provider When Needed** - If you know which provider to use, specify it
3. **Handle Latency** - Display loading states and estimated completion times
4. **Cache Provider Status** - Store provider info locally to avoid repeated requests
5. **Use Appropriate Models** - Use lighter models for quick responses, heavier for complex tasks
6. **Monitor Health** - Display provider health status in settings
7. **Error Handling** - Gracefully handle provider failures and show clear error messages
8. **Secure API Keys** - Never expose API keys in client-side code or logs

---

## Examples

### Basic Question

```javascript
const response = await fetch('/api/ai/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  },
  body: JSON.stringify({
    question: 'What is AI?'
  })
})

const data = await response.json()
console.log('Provider used:', data.provider)
console.log('Response:', data.answer)
console.log('Latency:', data.latency, 'ms')
```

### Streaming Response

```javascript
const response = await fetch('/api/ai/ask-stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  },
  body: JSON.stringify({
    question: 'Tell me a story'
  })
})

// Handle Server-Sent Events
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value)
  const data = JSON.parse(chunk)

  if (data.isComplete) {
    console.log('Full response received')
    console.log('Provider:', data.provider)
    break
  }

  console.log('Chunk:', data.chunk)
}
```

### Add Provider

```javascript
const response = await fetch('/api/ai/providers/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  },
  body: JSON.stringify({
    type: 'gemini',
    apiKey: 'AIzaSyCDEADB8JhP...',
    model: 'gemini-2.5-flash',
    isActive: true
  })
})

const data = await response.json()
console.log('Provider added:', data.provider)
```

### Generate Image

```javascript
const response = await fetch('/api/ai/generate-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  },
  body: JSON.stringify({
    prompt: 'A beautiful mountain landscape at sunset'
  })
})

const data = await response.json()
console.log('Image URL:', data.imageUrl)
console.log('Provider:', data.provider)
```

---

## Migration from Old API

The old AI endpoints have been replaced with new provider-aware endpoints:

| Old Endpoint | New Endpoint | Notes |
|-------------|-------------|-------|
| `/api/ai/gemini/ask` | `/api/ai/ask` | Now uses provider router |
| N/A | `/api/ai/ask-stream` | NEW: Streaming support |
| N/A | `/api/ai/providers/*` | NEW: Provider management |

**Key Changes:**

1. All responses now include `provider` field - indicates which AI provider was used
2. All responses now include `latency` field - request time in milliseconds
3. All responses now include `userProviders` field - user's configured providers
4. Add `provider` parameter to requests to specify preferred provider
5. New streaming endpoint for real-time responses
6. New provider management endpoints for user configuration
7. Health monitoring endpoints for all providers

---

## Changelog

### Version 2.0.0 (January 2026)

- **Added:** Multi-provider architecture with intelligent routing
- **Added:** Z.ai provider integration with model version detection
- **Added:** Server-Sent Events (SSE) streaming support
- **Added:** User provider configuration management
- **Added:** Health monitoring for all providers
- **Refactored:** All AI endpoints to use new Provider Router
- **Added:** Provider transparency in responses (provider, latency)
- **Added:** Client-side ProviderSettings component for UI

---

## Support

For issues or questions:
- Review the architecture documentation: `docs/AI_MULTI_PROVIDER_ARCHITECTURE.md`
- Check the implementation review: `docs/AI_IMPLEMENTATION_REVIEW_REVISED.md`
- Open an issue on GitHub with detailed error information
- Include request ID and user information in bug reports

---

**Last Updated:** January 28, 2026