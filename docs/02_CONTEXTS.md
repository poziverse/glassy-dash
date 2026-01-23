# Glass Keep Context & Service Layer

**Last Updated:** January 21, 2026  
**Version:** 1.1.3  
**Status:** ✅ Bridge to Mutation Architecture

---

## Overview

Glass Keep utilizes React Context as a **Service Layer** and **Bridge**. While the actual data fetching and caching are handled by **TanStack Query**, the Context Providers orchestrate complex interactions, real-time SSE events, and cross-cutting concerns.

---

## Context Architecture

### Provider Hierarchy

```
QueryClientProvider (TanStack Query)
└── App
    ├── AuthProvider (Bridge to authKeys & Zustand)
    │   └── Provides: user, token, session logic
    │
    ├── UIProvider (EPHEMERAL State)
    │   └── Provides: toasts, global loaders
    │
    ├── SettingsProvider (Bridge to Zustand SettingsStore)
    │   └── Provides: theme, darkMode, viewMode
    │
    ├── NotesProvider (Bridge to noteMutations & noteQueries)
    │   └── Provides: query results, reorder/delete/trash logic, SSE sync
    │
    ├── ModalProvider (Modal State)
    │   └── Provides: view/edit modal orchestration
    │
    └── ComposerProvider (Draft State)
        └── Provides: draft management for new notes
```

---

## Service Providers

### 1. AuthContext

**Purpose:** Manage user authentication and synchronization between persistence (LocalStorage) and state.

**Strategy:** Wraps `useAuth` queries and `useAuthMutations`.

---

### 2. NotesContext

**Purpose:** The central operational hub for note management.

**Key Responsibilities:**

- **Real-time Sync**: Listens to Server-Sent Events (SSE). When a `note_updated` or `note_created` event arrives, it invalidates the TanStack Query cache globally, ensuring all UI cards update immediately.
- **Bulk Operations**: Provides methods for "Clear Trash" or "Delete Selection" which may involve multiple mutation calls.
- **Stability Wrapper**: Maps high-level UI actions to specific `PATCH` or `PUT` mutations from `useNoteMutations`.

---

### 3. SettingsContext

**Purpose:** Legacy-compatible bridge to the modern **Zustand** `settingsStore`.

**Strategy:** Projects the Zustand store state into a React Context to support older functional components or those designed for the Context pattern.

```javascript
{
  user: {
    id: number,
    email: string,
    is_admin: boolean,
    created_at: string,
    updated_at: string
  } | null,
  token: string | null,
  isLoading: boolean,
  isAuthenticated: boolean
}
```

#### Provided Values

| Value                       | Type           | Description                       |
| --------------------------- | -------------- | --------------------------------- |
| `user`                      | Object \| null | Current authenticated user        |
| `token`                     | String \| null | JWT authentication token          |
| `isLoading`                 | Boolean        | Loading state for auth operations |
| `isAuthenticated`           | Boolean        | Whether user is authenticated     |
| `login(email, password)`    | Function       | Login with email/password         |
| `register(email, password)` | Function       | Register new user                 |
| `logout()`                  | Function       | Logout current user               |
| `verifyToken()`             | Function       | Verify JWT token                  |
| `loginWithSecret(key)`      | Function       | Login with secret key             |
| `updateUser(data)`          | Function       | Update user data                  |

#### Usage Example

```jsx
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

#### Related Components

- AuthViews
- AdminView
- App (authentication guard)

#### See Also

- [AuthContext.md](./contexts/AuthContext.md) - Detailed documentation

---

### 2. NotesContext

**Purpose:** Manage notes state and CRUD operations

**File:** `GLASSYDASH/src/contexts/NotesContext.jsx`

#### State Schema

```javascript
{
  notes: Array<Note>,
  pinnedNotes: Array<Note>,
  othersNotes: Array<Note>,
  filteredNotes: Array<Note>,
  selectedNotes: Array<number>,
  searchQuery: string,
  filterType: 'all' | 'pinned' | 'images',
  isLoading: boolean,
  error: Error | null
}
```

#### Provided Values

| Value                    | Type     | Description                       |
| ------------------------ | -------- | --------------------------------- |
| `notes`                  | Array    | All notes for current user        |
| `pinnedNotes`            | Array    | Pinned notes only                 |
| `othersNotes`            | Array    | Non-pinned notes                  |
| `filteredNotes`          | Array    | Currently filtered/searched notes |
| `selectedNotes`          | Array    | IDs of selected notes (bulk ops)  |
| `searchQuery`            | String   | Current search query              |
| `filterType`             | String   | Active filter type                |
| `isLoading`              | Boolean  | Loading state                     |
| `error`                  | Error    | Last error                        |
| `createNote(note)`       | Function | Create new note                   |
| `updateNote(id, data)`   | Function | Update note                       |
| `deleteNote(id)`         | Function | Delete note                       |
| `togglePin(id)`          | Function | Toggle pin status                 |
| `bulkDelete(ids)`        | Function | Delete multiple notes             |
| `bulkPin(ids, isPinned)` | Function | Pin/unpin multiple notes          |
| `bulkColor(ids, color)`  | Function | Change color of multiple notes    |
| `selectNote(id)`         | Function | Select note for bulk ops          |
| `deselectNote(id)`       | Function | Deselect note                     |
| `selectNotes(ids)`       | Function | Select multiple notes             |
| `clearSelection()`       | Function | Clear all selections              |
| `setSearchQuery(query)`  | Function | Set search query                  |
| `setFilterType(type)`    | Function | Set filter type                   |

#### Usage Example

```jsx
import { useNotes } from '../contexts/NotesContext'

function NotesList() {
  const { notes, filteredNotes, createNote, deleteNote } = useNotes()

  const handleCreate = () => {
    createNote({
      title: 'New Note',
      content: 'Note content',
      color: 'white',
      type: 'text',
    })
  }

  return (
    <div>
      <button onClick={handleCreate}>Create Note</button>
      {filteredNotes.map(note => (
        <NoteCard key={note.id} note={note} onDelete={() => deleteNote(note.id)} />
      ))}
    </div>
  )
}
```

#### Related Components

- NotesView
- NoteCard
- Modal
- Composer
- Sidebar

#### See Also

- [NotesContext.md](./contexts/NotesContext.md) - Detailed documentation

---

### 3. ModalContext

**Purpose:** Manage modal dialog state and operations

**File:** `GLASSYDASH/src/contexts/ModalContext.jsx`

#### State Schema

```javascript
{
  isOpen: boolean,
  noteId: number | null,
  isEditMode: boolean,
  isCollaborativeNote: boolean,
  collaborators: Array<Collaborator>,
  isViewMode: boolean
}
```

#### Provided Values

| Value                        | Type           | Description                   |
| ---------------------------- | -------------- | ----------------------------- |
| `isOpen`                     | Boolean        | Whether modal is open         |
| `noteId`                     | Number \| null | ID of note in modal           |
| `isEditMode`                 | Boolean        | Whether modal is in edit mode |
| `isCollaborativeNote`        | Boolean        | Whether note is collaborative |
| `collaborators`              | Array          | Array of collaborators        |
| `isViewMode`                 | Boolean        | Whether modal is in view mode |
| `openModal(noteId)`          | Function       | Open modal for note           |
| `closeModal()`               | Function       | Close modal                   |
| `toggleEditMode()`           | Function       | Toggle between view/edit      |
| `setViewMode()`              | Function       | Set to view mode              |
| `setEditMode()`              | Function       | Set to edit mode              |
| `addCollaborator(user)`      | Function       | Add collaborator              |
| `removeCollaborator(userId)` | Function       | Remove collaborator           |

#### Usage Example

```jsx
import { useModal } from '../contexts/ModalContext'

function NoteCard({ note }) {
  const { openModal } = useModal()

  return (
    <div onClick={() => openModal(note.id)}>
      <h3>{note.title}</h3>
      <p>{note.content}</p>
    </div>
  )
}
```

#### Related Components

- Modal
- NoteCard
- FormatToolbar

#### See Also

- [ModalContext.md](./contexts/ModalContext.md) - Detailed documentation

---

### 4. SettingsContext

**Purpose:** Manage user settings and preferences

**File:** `GLASSYDASH/src/contexts/SettingsContext.jsx`

#### State Schema

```javascript
{
  theme: string,
  darkMode: boolean,
  viewMode: 'grid' | 'list',
  background: string,
  accentColor: string,
  cardTransparency: string,
  themeOverlay: boolean,
  isLoading: boolean
}
```

#### Provided Values

| Value                        | Type     | Description                |
| ---------------------------- | -------- | -------------------------- |
| `theme`                      | String   | Current theme preset       |
| `darkMode`                   | Boolean  | Dark mode enabled          |
| `viewMode`                   | String   | Grid or list view          |
| `background`                 | String   | Background image/color     |
| `accentColor`                | String   | Accent color name          |
| `cardTransparency`           | String   | Card transparency level    |
| `themeOverlay`               | Boolean  | Theme overlay enabled      |
| `isLoading`                  | Boolean  | Loading state              |
| `setTheme(theme)`            | Function | Set theme preset           |
| `setDarkMode(enabled)`       | Function | Toggle dark mode           |
| `setViewMode(mode)`          | Function | Set grid/list view         |
| `setBackground(bg)`          | Function | Set background             |
| `setAccentColor(color)`      | Function | Set accent color           |
| `setCardTransparency(level)` | Function | Set card transparency      |
| `setThemeOverlay(enabled)`   | Function | Toggle theme overlay       |
| `loadSettings()`             | Function | Load settings from storage |
| `saveSettings()`             | Function | Save settings to storage   |

#### Usage Example

```jsx
import { useSettings } from '../contexts/SettingsContext'

function Settings() {
  const { darkMode, theme, setDarkMode, setTheme } = useSettings()

  return (
    <div>
      <label>
        Dark Mode
        <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
      </label>
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        <option value="default">Default</option>
        <option value="neon-tokyo">Neon Tokyo</option>
        <option value="zen-garden">Zen Garden</option>
      </select>
    </div>
  )
}
```

#### Related Components

- SettingsPanel
- App
- DashboardLayout

#### See Also

- [SettingsContext.md](./contexts/SettingsContext.md) - Detailed documentation

---

### 5. ComposerContext

**Purpose:** Manage note composer state and drafts

**File:** `GLASSYDASH/src/contexts/ComposerContext.jsx`

#### State Schema

```javascript
{
  isOpen: boolean,
  type: 'text' | 'checklist' | 'drawing',
  title: string,
  content: string,
  tags: Array<string>,
  color: string,
  images: Array<File>,
  draft: Object | null,
  isLoading: boolean
}
```

#### Provided Values

| Value                 | Type     | Description              |
| --------------------- | -------- | ------------------------ |
| `isOpen`              | Boolean  | Whether composer is open |
| `type`                | String   | Note type being created  |
| `title`               | String   | Draft title              |
| `content`             | String   | Draft content            |
| `tags`                | Array    | Draft tags               |
| `color`               | String   | Draft color              |
| `images`              | Array    | Draft images             |
| `draft`               | Object   | Saved draft data         |
| `isLoading`           | Boolean  | Loading state            |
| `openComposer()`      | Function | Open composer            |
| `closeComposer()`     | Function | Close composer           |
| `setType(type)`       | Function | Set note type            |
| `setTitle(title)`     | Function | Set draft title          |
| `setContent(content)` | Function | Set draft content        |
| `setTags(tags)`       | Function | Set draft tags           |
| `setColor(color)`     | Function | Set draft color          |
| `setImages(images)`   | Function | Set draft images         |
| `saveDraft()`         | Function | Save draft to storage    |
| `loadDraft()`         | Function | Load draft from storage  |
| `clearDraft()`        | Function | Clear draft              |
| `submitNote()`        | Function | Submit note to API       |

#### Usage Example

```jsx
import { useComposer } from '../contexts/ComposerContext'

function NewNoteButton() {
  const { openComposer, type, setTitle, submitNote } = useComposer()

  const handleClick = () => {
    openComposer()
    setTitle('')
    setType('text')
  }

  const handleSubmit = () => {
    submitNote()
  }

  return (
    <div>
      <button onClick={handleClick}>+ New Note</button>
    </div>
  )
}
```

#### Related Components

- Composer
- DashboardLayout
- NotesView

#### See Also

- [ComposerContext.md](./contexts/ComposerContext.md) - Detailed documentation

---

### 6. UIContext

**Purpose:** Manage UI state (toasts, loading, notifications)

**File:** `GLASSYDASH/src/contexts/UIContext.jsx`

#### State Schema

```javascript
{
  toasts: Array<Toast>,
  globalLoading: boolean,
  error: Error | null
}
```

#### Provided Values

| Value                       | Type     | Description                  |
| --------------------------- | -------- | ---------------------------- |
| `toasts`                    | Array    | Array of toast notifications |
| `globalLoading`             | Boolean  | Global loading state         |
| `error`                     | Error    | Global error state           |
| `showToast(message, type)`  | Function | Show toast notification      |
| `hideToast(id)`             | Function | Hide toast notification      |
| `clearToasts()`             | Function | Clear all toasts             |
| `setGlobalLoading(loading)` | Function | Set global loading           |
| `setGlobalError(error)`     | Function | Set global error             |
| `clearGlobalError()`        | Function | Clear global error           |

#### Toast Types

```javascript
{
  id: string,
  message: string,
  type: 'success' | 'error' | 'info' | 'warning',
  duration: number
}
```

#### Usage Example

```jsx
import { useUI } from '../contexts/UIContext'

function SaveButton() {
  const { showToast, setGlobalLoading } = useUI()

  const handleSave = async () => {
    setGlobalLoading(true)
    try {
      await saveData()
      showToast('Saved successfully!', 'success')
    } catch (error) {
      showToast('Failed to save', 'error')
    } finally {
      setGlobalLoading(false)
    }
  }

  return <button onClick={handleSave}>Save</button>
}
```

#### Related Components

- App (toast display)
- NotesView (loading states)
- Modal (error display)

#### See Also

- [UIContext.md](./contexts/UIContext.md) - Detailed documentation

---

## Context Integration Patterns

### 1. Authentication Flow

```jsx
// App.jsx
function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

function AuthenticatedApp() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <AuthViews />
  }

  return (
    <UIProvider>
      <SettingsProvider>
        <NotesProvider>
          <Dashboard />
        </NotesProvider>
      </SettingsProvider>
    </UIProvider>
  )
}
```

### 2. Note Operations Flow

```jsx
// NotesView.jsx
function NotesView() {
  const { notes, createNote, bulkDelete } = useNotes()
  const { showGlobalLoading } = useUI()
  const { showToast } = useUI()

  const handleBulkDelete = async ids => {
    showGlobalLoading(true)
    try {
      await bulkDelete(ids)
      showToast(`Deleted ${ids.length} notes`, 'success')
    } catch (error) {
      showToast('Failed to delete notes', 'error')
    } finally {
      showGlobalLoading(false)
    }
  }

  // ...
}
```

### 3. Modal and Edit Flow

```jsx
// NoteCard.jsx
function NoteCard({ note }) {
  const { openModal } = useModal()
  const { selectNote } = useNotes()

  const handleClick = () => {
    selectNote(note.id)
    openModal(note.id)
  }

  // ...
}
```

### 4. Settings Application

```jsx
// DashboardLayout.jsx
function DashboardLayout() {
  const { theme, darkMode } = useSettings()

  return <div className={`theme-${theme} ${darkMode ? 'dark' : 'light'}`}>{/* children */}</div>
}
```

---

## Context Performance Considerations

### Optimization Techniques

1. **Memoization**
   - Use `useMemo` for expensive computations in contexts
   - Use `useCallback` for context functions
   - Minimize re-renders of consumers

2. **Selective Updates**
   - Only update context state when necessary
   - Use immutability for proper re-rendering
   - Batch related state updates

3. **Context Splitting**
   - Split large contexts into smaller, focused contexts
   - Place contexts as close to consumers as possible
   - Use separate contexts for different concerns

---

## Context Testing

### Testing Strategies

1. **Unit Testing Contexts**
   - Test context providers in isolation
   - Test state updates
   - Test provided functions

2. **Testing Context Consumers**
   - Use renderHook from React Testing Library
   - Mock context values
   - Test component behavior with different context states

3. **Integration Testing**
   - Test multiple contexts together
   - Test context interactions
   - Test context provider hierarchy

---

## Context Best Practices

### 1. Default Values

All contexts should provide sensible defaults:

```javascript
const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: () => {},
  logout: () => {},
  // ...
})
```

### 2. Error Handling

Contexts should handle errors gracefully:

```javascript
const value = useMemo(
  () => ({
    login: async (email, password) => {
      try {
        // login logic
      } catch (error) {
        showToast('Login failed', 'error')
        throw error
      }
    },
  }),
  [showToast]
)
```

### 3. State Immutability

Always create new state objects:

```javascript
// ❌ Bad - mutation
state.notes.push(newNote)

// ✅ Good - immutability
setNotes([...notes, newNote])
```

---

## Related Documentation

- [Components Overview](./01_COMPONENTS.md) - Component documentation
- [Hooks Documentation](./03_HOOKS.md) - Custom hooks
- [State Management](./infrastructure/STATE_MANAGEMENT.md) - State management patterns

---

## Context Summary

| Context         | State    | Functions    | Used By                                       |
| --------------- | -------- | ------------ | --------------------------------------------- |
| AuthContext     | 5 values | 7 functions  | App, AuthViews, AdminView                     |
| NotesContext    | 8 values | 13 functions | NotesView, NoteCard, Modal, Composer, Sidebar |
| ModalContext    | 6 values | 7 functions  | Modal, NoteCard, FormatToolbar                |
| SettingsContext | 8 values | 10 functions | SettingsPanel, App, DashboardLayout           |
| ComposerContext | 8 values | 8 functions  | Composer, DashboardLayout                     |
| UIContext       | 3 values | 5 functions  | App, NotesView, Modal                         |

---

**Context Count:** 6  
**Documented Contexts:** 6 (100% overview)  
**Last Updated:** January 20, 2026
