# ErrorMessage Component
**Last Updated:** January 21, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready

---

## Overview

`ErrorMessage` is a collection of error and state display components for GlassKeep application. Provides flexible, accessible error messaging with support for various error types, actions, and display modes.

---

## Purpose

Provide comprehensive error handling UI with:
- Display error messages with icons
- Support for multiple error types
- Optional retry and dismiss actions
- Dark mode support
- Glassmorphism design
- Accessibility features
- Specialized error components
- Empty state display

---

## Components

### 1. ErrorMessage

Main component for displaying error messages with optional actions.

---

## ErrorMessage Props

```javascript
{
  error: string | null,      // Error message (required)
  onRetry?: () => void,      // Retry handler (optional)
  onDismiss?: () => void,    // Dismiss handler (optional)
  title?: string,            // Custom title (optional)
  type?: 'error' | 'warning' | 'info'  // Message type (optional)
}
```

### error
- **Type:** `string | null`
- **Default:** Required
- **Purpose:** Error message to display
- **Usage:** Returns null if error is null/undefined

### onRetry
- **Type:** `() => void`
- **Default:** Optional
- **Purpose:** Retry action handler
- **Usage:** Shows "Try Again" button when provided

### onDismiss
- **Type:** `() => void`
- **Default:** Optional
- **Purpose:** Dismiss action handler
- **Usage:** Shows "Dismiss" button when provided

### title
- **Type:** `string`
- **Default:** `'Error'`
- **Purpose:** Custom error title
- **Usage:** Overrides default "Error" title

### type
- **Type:** `'error' | 'warning' | 'info'`
- **Default:** `'error'`
- **Purpose:** Message type for styling and icon
- **Values:**
  - `'error'` - Red icon (❌)
  - `'warning'` - Warning icon (⚠️)
  - `'info'` - Info icon (ℹ️)

---

## Key Features

### 1. Type-Based Icons

```javascript
const getIcon = () => {
  switch (type) {
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    case 'error':
    default:
      return '❌';
  }
};
```

**Icons:**
- Error: ❌
- Warning: ⚠️
- Info: ℹ️

---

### 2. Conditional Rendering

```javascript
if (!error) return null;
```

**Behavior:**
- Returns null if no error
- Doesn't render empty component
- Clean conditional display

---

### 3. Accessibility

```javascript
role="alert"
aria-live="polite"
```

**Features:**
- Alert role for screen readers
- Polite announcements
- ARIA labels on buttons

---

## Styling

### Container

```javascript
className={`error-message glass-card error-message-${type}`}
```

**Classes:**
- `error-message` - Base error message class
- `glass-card` - Glassmorphism card
- `error-message-${type}` - Type-specific styling

**Type Variants:**
- `error-message-error` - Error styling
- `error-message-warning` - Warning styling
- `error-message-info` - Info styling

---

### Content Container

```javascript
className="error-message-content"
```

- Flex layout
- Icon and text alignment
- Action buttons placement

---

### Icon

```javascript
className="error-icon"
```

- Emoji icon display
- Size and spacing
- Type-based emoji

---

### Text Container

```javascript
className="error-text-container"
```

- Title and message layout
- Vertical alignment
- Text spacing

---

### Title

```javascript
className="error-title"
```

- Bold text
- Size: larger than message
- Color: error-type based

---

### Error Text

```javascript
className="error-text"
```

- Regular text weight
- Color: error-type based
- Margin: spacing from title

---

### Actions

```javascript
className="error-actions"
```

- Button container
- Flex layout
- Gap between buttons

---

## Usage Examples

### Basic Error Message

```javascript
import { ErrorMessage } from './components/ErrorMessage'

function NoteEditor() {
  const [error, setError] = useState(null)
  
  if (error) {
    return <ErrorMessage error={error} />
  }
  
  return <Editor />
}
```

### With Retry Action

```javascript
function NotesList() {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const fetchNotes = async () => {
    setLoading(true)
    try {
      const notes = await api.getNotes()
      setNotes(notes)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      <ErrorMessage 
        error={error}
        onRetry={fetchNotes}
        title="Failed to load notes"
      />
      <NoteList notes={notes} loading={loading} />
    </div>
  )
}
```

### With Dismiss Action

```javascript
function FormComponent() {
  const [error, setError] = useState(null)
  
  const handleSubmit = async (data) => {
    try {
      await api.submit(data)
    } catch (err) {
      setError(err.message)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <ErrorMessage 
        error={error}
        onDismiss={() => setError(null)}
      />
      <FormFields />
    </form>
  )
}
```

### Warning Type

```javascript
function WarningMessage() {
  return (
    <ErrorMessage 
      error="This action cannot be undone"
      type="warning"
      title="Warning"
    />
  )
}
```

### Info Type

```javascript
function InfoMessage() {
  return (
    <ErrorMessage 
      error="Your changes have been saved"
      type="info"
      title="Success"
    />
  )
}
```

---

## 2. GlobalError

Full-page error display for critical errors.

---

## GlobalError Props

```javascript
{
  message: string,         // Error message (required)
  onReload?: () => void   // Reload handler (optional)
}
```

### message
- **Type:** `string`
- **Default:** Required
- **Purpose:** Error message to display
- **Usage:** Full-page error description

### onReload
- **Type:** `() => void`
- **Default:** Optional (defaults to `window.location.reload()`)
- **Purpose:** Reload action handler
- **Usage:** Custom reload logic

---

## Usage Examples

### Basic Global Error

```javascript
import { GlobalError } from './components/ErrorMessage'

function CriticalError() {
  return (
    <GlobalError 
      message="A critical error occurred. Please refresh the page."
    />
  )
}
```

### With Custom Reload

```javascript
function CustomGlobalError() {
  const handleReload = () => {
    // Custom reload logic
    console.log('Reloading application')
    window.location.reload()
  }
  
  return (
    <GlobalError 
      message="Application crashed"
      onReload={handleReload}
    />
  )
}
```

---

## 3. InlineError

Compact inline error display for form fields.

---

## InlineError Props

```javascript
{
  message: string    // Error message (required)
}
```

### message
- **Type:** `string`
- **Default:** Required
- **Purpose:** Error message to display
- **Usage:** Inline field error

---

## Usage Examples

### Form Field Error

```javascript
import { InlineError } from './components/ErrorMessage'

function FormField({ field, error }) {
  return (
    <div className="form-field">
      <label>{field.label}</label>
      <input type={field.type} />
      {error && <InlineError message={error} />}
    </div>
  )
}
```

---

## 4. APIError

Specialized error display for API errors.

---

## APIError Props

```javascript
{
  status?: number,        // HTTP status code (optional)
  message: string,       // Error message (required)
  endpoint?: string,     // API endpoint (optional)
  onRetry?: () => void   // Retry handler (optional)
}
```

### status
- **Type:** `number`
- **Default:** Optional
- **Purpose:** HTTP status code
- **Values:** 400, 401, 403, 404, 500, 503, etc.

### message
- **Type:** `string`
- **Default:** Required
- **Purpose:** Error message to display
- **Usage:** API error description

### endpoint
- **Type:** `string`
- **Default:** Optional
- **Purpose:** API endpoint URL
- **Usage:** Display which endpoint failed

### onRetry
- **Type:** `() => void`
- **Default:** Optional
- **Purpose:** Retry action handler
- **Usage:** Retry failed request

---

## Status Messages

```javascript
const getStatusMessage = (status: number) => {
  switch (status) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 500:
      return 'Server Error';
    case 503:
      return 'Service Unavailable';
    default:
      return 'Error';
  }
};
```

## Usage Examples

### API Error Display

```javascript
import { APIError } from './components/ErrorMessage'

function DataFetcher() {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/notes')
      setData(response.data)
    } catch (err) {
      setError({
        status: err.response?.status,
        message: err.message,
        endpoint: '/api/notes'
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div>
      {error && (
        <APIError
          status={error.status}
          message={error.message}
          endpoint={error.endpoint}
          onRetry={fetchData}
        />
      )}
      <DataDisplay data={data} />
    </div>
  )
}
```

---

## 5. NetworkError

Error display for network connectivity issues.

---

## NetworkError Props

```javascript
{
  onRetry?: () => void   // Retry handler (optional)
}
```

### onRetry
- **Type:** `() => void`
- **Default:** Optional
- **Purpose:** Retry action handler
- **Usage:** Retry network request

---

## Usage Examples

### Network Error Display

```javascript
import { NetworkError } from './components/ErrorMessage'

function OfflineComponent() {
  const [isOffline, setIsOffline] = useState(false)
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  if (isOffline) {
    return <NetworkError onRetry={() => setIsOffline(false)} />
  }
  
  return <OnlineContent />
}
```

---

## 6. ValidationError

Error display for form validation errors.

---

## ValidationError Props

```javascript
{
  errors: Record<string, string[]>,  // Field errors (required)
  onDismiss?: () => void            // Dismiss handler (optional)
}
```

### errors
- **Type:** `Record<string, string[]>`
- **Default:** Required
- **Purpose:** Field validation errors
- **Format:** `{ fieldName: ['error1', 'error2'] }`

### onDismiss
- **Type:** `() => void`
- **Default:** Optional
- **Purpose:** Dismiss action handler
- **Usage:** Clear validation errors

---

## Usage Examples

### Form Validation Errors

```javascript
import { ValidationError } from './components/ErrorMessage'

function FormComponent() {
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({})
  
  const validate = (data) => {
    const errors = {}
    
    if (!data.email) {
      errors.email = ['Email is required']
    } else if (!isValidEmail(data.email)) {
      errors.email = ['Email is invalid']
    }
    
    if (!data.password) {
      errors.password = ['Password is required']
    } else if (data.password.length < 8) {
      errors.password = ['Password must be at least 8 characters']
    }
    
    setErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate(formData)) {
      // Submit form
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <ValidationError 
        errors={errors}
        onDismiss={() => setErrors({})}
      />
      <FormFields data={formData} onChange={setFormData} />
    </form>
  )
}
```

---

## 7. LoadingError

Error display for loading failures.

---

## LoadingError Props

```javascript
{
  message: string,       // Error message (required)
  onRetry?: () => void   // Retry handler (optional)
}
```

### message
- **Type:** `string`
- **Default:** Required
- **Purpose:** Error message to display
- **Usage:** Loading failure description

### onRetry
- **Type:** `() => void`
- **Default:** Optional
- **Purpose:** Retry action handler
- **Usage:** Retry loading

---

## Usage Examples

### Loading Error Display

```javascript
import { LoadingError } from './components/ErrorMessage'

function DataLoader() {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.loadData()
      setData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [])
  
  if (loading) {
    return <Loader />
  }
  
  if (error) {
    return (
      <LoadingError 
        message="Failed to load data"
        onRetry={loadData}
      />
    )
  }
  
  return <DataDisplay data={data} />
}
```

---

## 8. EmptyState

Display for empty data states (not an error, but related).

---

## EmptyState Props

```javascript
{
  icon?: string,           // Icon emoji (optional)
  title: string,          // Title (required)
  message?: string,       // Message (optional)
  action?: {              // Action button (optional)
    label: string,
    onClick: () => void
  }
}
```

### icon
- **Type:** `string`
- **Default:** `'📭'`
- **Purpose:** Icon emoji to display
- **Usage:** Empty state illustration

### title
- **Type:** `string`
- **Default:** Required
- **Purpose:** Empty state title
- **Usage:** Description of empty state

### message
- **Type:** `string`
- **Default:** Optional
- **Purpose:** Additional message
- **Usage:** More detailed description

### action
- **Type:** `{ label: string, onClick: () => void }`
- **Default:** Optional
- **Purpose:** Action button
- **Usage:** Primary action to take

---

## Usage Examples

### Empty Notes List

```javascript
import { EmptyState } from './components/ErrorMessage'

function NotesList({ notes, onCreateNote }) {
  if (notes.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No notes yet"
        message="Create your first note to get started"
        action={{
          label: 'Create Note',
          onClick: onCreateNote
        }}
      />
    )
  }
  
  return <NoteList notes={notes} />
}
```

### Empty Search Results

```javascript
function SearchResults({ results, query }) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title={`No results for "${query}"`}
        message="Try adjusting your search terms"
      />
    )
  }
  
  return <ResultsList results={results} />
}
```

---

## Testing

### Unit Tests

```javascript
describe('ErrorMessage Components', () => {
  describe('ErrorMessage', () => {
    it('should render error message', () => {
      // Test: error prop → message displayed
    });
    
    it('should not render when error is null', () => {
      // Test: no error → null returned
    });
    
    it('should show retry button', () => {
      // Test: onRetry prop → button shown
    });
    
    it('should show dismiss button', () => {
      // Test: onDismiss prop → button shown
    });
    
    it('should use custom title', () => {
      // Test: title prop → custom title
    });
    
    it('should display correct icon for type', () => {
      // Test: type prop → correct emoji
    });
  });
  
  describe('GlobalError', () => {
    it('should display global error', () => {
      // Test: message → global error UI
    });
    
    it('should call onReload', () => {
      // Test: onReload prop → handler called
    });
    
    it('should reload page by default', () => {
      // Test: no onReload → window.location.reload()
    });
  });
  
  describe('APIError', () => {
    it('should display API error', () => {
      // Test: props → API error UI
    });
    
    it('should show status message', () => {
      // Test: status prop → status text
    });
    
    it('should display endpoint', () => {
      // Test: endpoint prop → endpoint shown
    });
  });
});
```

### Integration Tests

```javascript
describe('ErrorMessage Integration', () => {
  it('should handle error flow', () => {
    // Test: error → display → retry → success
  });
  
  it('should handle dismiss flow', () => {
    // Test: error → display → dismiss → cleared
  });
});
```

### E2E Tests (Playwright)

```javascript
test('ErrorMessage displays and dismisses', async ({ page }) => {
  await page.goto('/#/notes');
  
  // Trigger error
  await page.click('[data-testid="trigger-error"]');
  
  // Verify error message visible
  await expect(page.locator('.error-message')).toBeVisible();
  
  // Click dismiss
  await page.click('text=Dismiss');
  
  // Verify error dismissed
  await expect(page.locator('.error-message')).not.toBeVisible();
});

test('APIError retry works', async ({ page }) => {
  await page.goto('/#/notes');
  
  // Simulate API error
  await page.evaluate(() => {
    // Trigger API error
  });
  
  // Verify API error visible
  await expect(page.locator('.api-error')).toBeVisible();
  
  // Click retry
  await page.click('text=Retry Request');
  
  // Verify request retried
  // (Check API calls)
});
```

---

## Troubleshooting

### Issue: ErrorMessage not showing

**Possible Causes:**
- Error is null/undefined
- CSS hiding component
- Conditional rendering issue

**Solutions:**
1. Verify error prop is not null
2. Check CSS visibility
3. Test with hardcoded error

---

### Issue: Icons not displaying

**Possible Causes:**
- Font/emoji support
- CSS hiding icons
- Icon selection issue

**Solutions:**
1. Check emoji support in browser
2. Verify icon CSS
3. Test different type values

---

### Issue: Actions not working

**Possible Causes:**
- Handler not provided
- Handler not called
- Button disabled

**Solutions:**
1. Verify handler props provided
2. Check handler is called
3. Test button interactivity

---

### Issue: GlobalError not reloading

**Possible Causes:**
- Window object undefined (SSR)
- Reload blocked
- Handler issue

**Solutions:**
1. Verify window exists
2. Check browser console
3. Test reload in different browsers

---

## Best Practices

1. **Use appropriate error type** for context
2. **Provide clear error messages** to users
3. **Include recovery actions** when possible
4. **Test error states** regularly
5. **Use specialized components** for specific errors
6. **Maintain consistent styling** across error types
7. **Ensure accessibility** with ARIA attributes
8. **Provide empty states** for better UX

---

## Related Components

- [ErrorBoundary](./ErrorBoundary.md) - Error boundary component

---

## Dependencies

- `react` - React

---

## Error Type Guidelines

### When to Use Each Type

#### Error
- Critical errors
- Blocking errors
- Data loss scenarios
- Security issues

#### Warning
- Non-blocking issues
- Data loss warnings
- Deprecation notices
- Action confirmations

#### Info
- Success messages
- Informational notices
- Status updates
- Helpful tips

---

## Performance

### Optimizations

1. **Conditional Rendering**
   - Returns null when no error
   - No unnecessary DOM
   - Clean state transitions

2. **Component Reuse**
   - Shared error UI
   - Consistent styling
   - Reduced bundle size

3. **CSS Classes**
   - Type-based classes
   - Minimal inline styles
   - Better performance

---

**Component Version:** 1.0  
**Last Updated:** January 21, 2026  
**Status:** ✅ Production Ready