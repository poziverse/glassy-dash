# Error Handling Architecture

## Overview

GlassyDash implements a comprehensive error handling system with automatic recovery, user-friendly error messages, and structured logging.

## Architecture

### Phase 2 Implementation (2026-01-27)

The error handling architecture consists of four layers:

1. **Prevention**: Graceful degradation, timeout handling, input validation
2. **Detection**: Error types classification (network, auth, audio, validation)
3. **Recovery**: Automatic retry logic, user guidance, recovery actions
4. **Reporting**: Structured logging with context for debugging

## Core Components

### 1. Retry Logic (`retryOperation` utility)

**Location**: `src/utils/retryOperation.js`

```javascript
import { retryOperation } from './retryOperation'

// Automatic retry with exponential backoff
const result = await retryOperation(
  async () => {
    const data = await api('/notes')
    return data
  },
  {
    maxRetries: 3,      // Maximum attempts
    delay: 1000,         // Delay between attempts (ms)
    onRetry: (attempt) => {
      logger.info(`Retrying operation, attempt ${attempt}`)
    }
  }
)
```

**Features**:
- Configurable retry count and delay
- Retry attempt logging
- Error context preservation
- Promise-based API

### 2. API Layer Enhancement

**Location**: `src/lib/api.js`

All API calls are automatically wrapped with retry logic:

```javascript
const api = async (path, options = {}) => {
  return retryOperation(
    async () => {
      // API call implementation
    },
    {
      maxRetries: 3,
      delay: 1000
    }
  )
}
```

**Benefits**:
- Handles transient network failures
- Retry for timeout errors
- Backoff prevents server overload
- No code changes needed in components

### 3. Error UI Components

#### NetworkError Component

**Location**: `src/components/errors/NetworkError.jsx`

Displays user-friendly network error messages with:
- Connection problem indicator (WiFiOff icon)
- Retry button with auto-retry option
- "Go to Home" navigation
- Troubleshooting tips (check connection, refresh, contact support)

**Usage**:
```javascript
<NetworkError 
  error={error}
  onRetry={() => fetchNotes()}
  onHome={() => navigate('/')}
/>
```

#### AuthError Component

**Location**: `src/components/errors/AuthError.jsx`

Handles authentication/session issues with:
- Session expired indicator (ShieldAlert icon)
- "Sign In Again" action
- Explanations (session timeout, device change, password change)

**Usage**:
```javascript
<AuthError 
  error={error}
  onLogin={() => navigate('/login')}
  onHome={() => navigate('/')}
/>
```

#### AudioError Component

**Location**: `src/components/errors/AudioError.jsx`

Provides audio/recording error support with:
- Microphone access error indicator (MicOff icon)
- "Try Recording Again" button
- Dismiss option
- Common solutions (permissions, other apps, browser issues)

**Usage**:
```javascript
<AudioError 
  error={error}
  onRetry={() => startRecording()}
  onDismiss={() => setError(null)}
/>
```

### 4. Suspense Boundaries

**Location**: `src/main.jsx`, `src/components/NotesView.jsx`, `src/components/AsyncWrapper.jsx`

Global and component-level Suspense boundaries for async operations:

```javascript
<Suspense fallback={<LoadingSpinner />}>
  <NotesView />
</Suspense>
```

**Features**:
- Prevents UI freeze during loading
- Consistent loading states
- Graceful fallback for async components

## Voice Studio Error Handling

### Recording Reliability

**Location**: `src/components/voice/RecordingStudio.jsx`

- **Automatic retry**: Failed recordings retry 3 times with 1s delay
- **Timeout handling**: 30-second maximum recording duration
- **Escape key stop**: Immediate cancellation option
- **Stream cleanup**: Proper cleanup on unmount

```javascript
const startRecording = async () => {
  await retryOperation(
    async () => {
      mediaStream = await navigator.mediaDevices.getUserMedia()
      // Setup recording
    },
    { maxRetries: 3, delay: 1000 }
  )
}
```

### Transcription Robustness

- **Streaming with backpressure**: Handles partial results
- **Partial result caching**: UI updates incrementally
- **Error recovery**: Retry wrapper for failed chunks
- **Progress indicators**: "Transcribing with AI..." message

```javascript
await retryOperation(
  async () => {
    const response = await fetch('/api/transcribe', { ... })
    const reader = response.body.getReader()
    // Stream processing
  },
  { maxRetries: 3, delay: 1000 }
)
```

### Audio Quality Validation

**Location**: `src/components/voice/AudioQualityIndicator.jsx`

Validates audio before transcription:
- Sample rate checks (must be 22050Hz, 44100Hz, or 48000Hz)
- RMS level detection (silence vs. loud audio)
- Duration validation
- Format verification

## Error Types and Handling

### Network Errors

| Error Type | Status | Handling | User Action |
|------------|--------|-----------|-------------|
| Connection timeout | 408 | Auto-retry (3x) | Wait or retry |
| Connection refused | 0 | Auto-retry (3x) | Check network |
| Bad gateway | 502 | Auto-retry (3x) | Retry later |
| Service unavailable | 503 | Auto-retry (3x) | Retry later |

### Authentication Errors

| Error Type | Status | Handling | User Action |
|------------|--------|-----------|-------------|
| Invalid token | 401 | Auto-logout | Sign in again |
| Forbidden | 403 | Show error | Contact admin |
| Session expired | 401 | Auto-logout | Sign in again |

### Validation Errors

| Error Type | Status | Handling | User Action |
|------------|--------|-----------|-------------|
| Bad request | 400 | Show validation error | Fix input |
| Invalid note type | 400 | Show error | Check note type |
| Missing fields | 400 | Show required fields | Fill in fields |

### Audio Errors

| Error Type | Handling | User Action |
|------------|-----------|-------------|
| No microphone | Auto-retry (3x) | Grant permission |
| Permission denied | Show AudioError | Check settings |
| Recording failed | Auto-retry (3x) | Check microphone |
| Transcription failed | Auto-retry (3x) | Retry or edit |

## Error Logging

**Location**: `src/utils/logger.js`

All errors are logged with structured context:

```javascript
logger.error('API call failed', {
  path: '/api/notes',
  status: 500,
  error: error.message,
  timestamp: new Date().toISOString(),
  userId: currentUser?.id,
  attempt: 2
})
```

**Log Levels**:
- `error`: Critical failures
- `warn`: Recoverable issues
- `info`: Retry attempts
- `debug`: Detailed context

## User Experience

### Recovery Actions

All error UI components provide recovery actions:
- **Retry**: Re-attempt the failed operation
- **Dismiss**: Close error and continue
- **Navigate**: Go to home or other page
- **Sign In**: Re-authenticate

### Error Messages

Error messages are:
- **User-friendly**: No technical jargon
- **Actionable**: Include recovery steps
- **Specific**: Explain what happened
- **Helpful**: Provide guidance

### Loading States

Consistent loading indicators:
- `LoadingSpinner`: Spinner for general loading
- "Transcribing with AI...": Voice Studio specific
- Progress bars: For long operations

## Testing

### Error Scenario Tests

**Location**: `tests/error-scenarios.test.js`

Covers all failure modes:
- Network errors (timeout, connection refused, retries)
- Authentication errors (401, 403, logout)
- Server errors (500, 502, 503)
- Validation errors (400)
- Data corruption (malformed JSON)
- Concurrent failures

### Performance Tests

**Location**: `tests/audio-performance.test.js`

Benchmarks error handling:
- Retry delay efficiency
- Memory leak detection
- Audio processing speed
- Error recovery time

## Best Practices

### For Developers

1. **Use retryOperation** for all async operations
2. **Wrap async components** in Suspense boundaries
3. **Provide recovery actions** in error UI
4. **Log errors with context** for debugging
5. **Handle all error types** (network, auth, validation)

### For Users

1. **Check network** if errors persist
2. **Grant permissions** for microphone access
3. **Retry operations** using provided buttons
4. **Contact support** if issues continue
5. **Check console** for error details (debug mode)

## Future Enhancements

### Phase 5: Monitoring & Observability (Not Implemented)

- Sentry integration for error tracking
- Performance monitoring service
- Analytics for error patterns
- Automated alerting

## References

- [README.md](../README.md) - User documentation
- [CHANGELOG.md](../CHANGELOG.md) - Recent changes
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture