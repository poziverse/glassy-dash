# Component Guide

**Version:** ALPHA 1.0  
**Last Updated:** January 19, 2026

---

## Overview

This guide provides comprehensive documentation for all GlassKeep components, including their props, usage examples, and best practices.

---

## Table of Contents

- [View Components](#view-components)
- [Layout Components](#layout-components)
- [Widget Components](#widget-components)
- [Context Providers](#context-providers)
- [Utility Components](#utility-components)

---

## View Components

### AuthViews

Login and registration authentication views.

**Usage:**

```jsx
import { LoginView, RegisterView } from './components/AuthViews';

<LoginView />
<RegisterView />
```

---

### NotesView

Main dashboard view for displaying and managing notes.

**Usage:**

```jsx
import { NotesView } from './components/NotesView'

;<NotesView />
```

**Features:**

- Note grid/list display
- Search and filter
- Multi-select support
- Drag-and-drop reordering

---

### AdminView

Administrative panel for user and system management.

**Usage:**

```jsx
import { AdminView } from './components/AdminView'

;<AdminView />
```

**Features:**

- User management
- Log viewer
- System statistics
- Health monitoring

---

## Layout Components

### DashboardLayout

Application shell containing sidebar and main content area.

**Props:**

- `children` (ReactNode) - Child components
- `showSidebar` (boolean) - Sidebar visibility

**Usage:**

```jsx
import { DashboardLayout } from './components/DashboardLayout'

;<DashboardLayout showSidebar={true}>
  <NotesGrid />
</DashboardLayout>
```

---

### Sidebar

Navigation sidebar with note counts and user menu.

**Features:**

- Navigation links
- Note count badges
- User menu dropdown
- Collapsible state

---

### SearchBar

Search and filter input for notes.

**Props:**

- `onSearch` (function) - Search callback
- `placeholder` (string) - Input placeholder

**Usage:**

```jsx
import { SearchBar } from './components/SearchBar'

;<SearchBar onSearch={query => console.log(query)} placeholder="Search notes..." />
```

---

## Widget Components

### NoteCard

Individual note display component.

**Props:**

```typescript
interface NoteCardProps {
  note: Note
  onClick: (noteId: number) => void
  onEdit: (noteId: number) => void
  onDelete: (noteId: number) => void
  onPin: (noteId: number, pinned: boolean) => void
  onArchive: (noteId: number, archived: boolean) => void
  selected?: boolean
  onToggleSelect?: (noteId: number) => void
}
```

**Usage:**

```jsx
import { NoteCard } from './components/NoteCard'

;<NoteCard
  note={note}
  onClick={id => openNote(id)}
  onEdit={id => editNote(id)}
  onDelete={id => deleteNote(id)}
  onPin={(id, pinned) => togglePin(id, pinned)}
  onArchive={(id, archived) => toggleArchive(id, archived)}
  selected={selectedNotes.includes(note.id)}
  onToggleSelect={id => toggleSelect(id)}
/>
```

**Note Types:**

- `text` - Plain text notes
- `checklist` - Todo lists with checkboxes
- `draw` - Drawing canvas notes

---

### Composer

Quick note creation widget.

**Props:**

```typescript
interface ComposerProps {
  onCreate: (note: Partial<Note>) => void
  defaultType?: 'text' | 'checklist' | 'draw'
}
```

**Usage:**

```jsx
import { Composer } from './components/Composer'

;<Composer onCreate={note => createNote(note)} defaultType="text" />
```

---

### SettingsPanel

User preferences and settings configuration.

**Features:**

- Theme customization
- Background selection
- Accent color picker
- Card transparency
- Theme customization
- Background selection
- Accent color picker
- Card transparency
- Overlay opacity slider
- View mode toggle

**Usage:**

```jsx
import { SettingsPanel } from './components/SettingsPanel'

;<SettingsPanel />
```

---

### Modal

Complex modal for note editing and configuration.

**Features:**

- Note editor
- Image viewer
- Collaboration modal
- Format toolbar
- Color/transparency pickers

**Usage:**

```jsx
import { Modal } from './components/Modal'

;<Modal
  isOpen={isModalOpen}
  note={currentNote}
  onClose={() => setIsModalOpen(false)}
  onSave={note => saveNote(note)}
/>
```

---

### DrawingCanvas

Canvas component for drawing notes.

**Props:**

```typescript
interface DrawingCanvasProps {
  content: string // JSON string of drawing data
  onChange: (content: string) => void
  width?: number
  height?: number
  readOnly?: boolean
}
```

**Usage:**

```jsx
import { DrawingCanvas } from './components/DrawingCanvas'

;<DrawingCanvas
  content={note.content}
  onChange={content => updateNote({ content })}
  width={800}
  height={600}
/>
```

---

### ChecklistRow

Single checklist item component.

**Props:**

```typescript
interface ChecklistRowProps {
  item: ChecklistItem
  onToggle: (itemId: string) => void
  onDelete?: (itemId: string) => void
  onEdit?: (itemId: string, text: string) => void
  readOnly?: boolean
}
```

**Usage:**

```jsx
import { ChecklistRow } from './components/ChecklistRow'

;<ChecklistRow
  item={{ id: '1', text: 'Buy milk', done: false }}
  onToggle={id => toggleItem(id)}
  onDelete={id => deleteItem(id)}
  onEdit={(id, text) => editItem(id, text)}
/>
```

---

### FormatToolbar

Rich text formatting toolbar.

**Props:**

```typescript
interface FormatToolbarProps {
  onFormat: (format: string, value?: string) => void
  visible?: boolean
}
```

**Usage:**

```jsx
import { FormatToolbar } from './components/FormatToolbar'

;<FormatToolbar onFormat={(format, value) => applyFormat(format, value)} visible={true} />
```

**Formats:**

- Bold
- Italic
- Underline
- Heading
- List
- Code block
- Link

---

## Context Providers

### AuthProvider

Authentication state management.

**Exports:**

```javascript
{
  ;(user, // Current user object
    token, // JWT token
    login, // Login function
    register, // Register function
    logout, // Logout function
    isAuthenticated) // Boolean
}
```

**Usage:**

```jsx
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()

  return (
    <div>
      {isAuthenticated ? <p>Welcome, {user.username}!</p> : <button onClick={login}>Login</button>}
    </div>
  )
}
```

---

### NotesProvider

Note CRUD and state management.

**Exports:**

```javascript
{
  notes,              // Array of notes
  createNote,         // Create new note
  updateNote,         // Update existing note
  deleteNote,         // Delete note
  archiveNote,        // Archive/unarchive note
  pinNote,            // Pin/unpin note
  reorderNotes,       // Reorder notes
  searchNotes,        // Search notes
  filterByTag,        // Filter by tag
  selectedNotes,      // Selected notes array
  toggleSelect,       // Toggle note selection
  clearSelection,     // Clear all selections
  bulkDelete,         // Delete selected notes
  bulkPin,           // Pin selected notes
  bulkArchive,        // Archive selected notes
  bulkColor,          // Color selected notes
  importNotes,        // Import notes
  exportNotes,        // Export notes
}
```

**Usage:**

```jsx
import { useNotes } from './contexts/NotesContext'

function NotesManager() {
  const { notes, createNote, deleteNote, selectedNotes, bulkDelete } = useNotes()

  const handleCreate = () => {
    createNote({
      type: 'text',
      title: 'New Note',
      content: '',
    })
  }

  const handleBulkDelete = () => {
    bulkDelete(selectedNotes)
  }

  return (
    <div>
      <button onClick={handleCreate}>Create Note</button>
      {notes.map(note => (
        <NoteCard key={note.id} note={note} />
      ))}
      {selectedNotes.length > 0 && (
        <button onClick={handleBulkDelete}>Delete {selectedNotes.length} notes</button>
      )}
    </div>
  )
}
```

---

### SettingsProvider

User settings and preferences.

**Exports:**

```javascript
{
  ;(dark, // Dark mode boolean
    setDark, // Toggle dark mode
    accentColor, // Accent color name
    setAccentColor, // Set accent color
    backgroundImage, // Background filename
    setBackgroundImage, // Set background
    backgroundOverlay, // Overlay visibility
    setBackgroundOverlay, // Toggle overlay
    overlayOpacity, // Overlay opacity value
    setOverlayOpacity, // Set overlay opacity
    cardTransparency, // Transparency level
    setCardTransparency, // Set transparency
    alwaysShowSidebarOnWide, // Sidebar visibility
    setAlwaysShowSidebarOnWide, // Toggle sidebar
    localAiEnabled, // AI enabled boolean
    setLocalAiEnabled, // Toggle AI
    settings) // All settings object
}
```

**Usage:**

```jsx
import { useSettings } from './contexts/SettingsContext'

function ThemeToggle() {
  const { dark, setDark, accentColor, setAccentColor } = useSettings()

  return (
    <div className={dark ? 'dark' : 'light'}>
      <button onClick={() => setDark(!dark)}>{dark ? 'Light' : 'Dark'} Mode</button>
      <select value={accentColor} onChange={e => setAccentColor(e.target.value)}>
        <option value="rose">Rose</option>
        <option value="blue">Blue</option>
        <option value="green">Green</option>
      </select>
    </div>
  )
}
```

---

### ModalProvider

Modal state and form management.

**Exports:**

```javascript
{
  isOpen,              // Modal open boolean
  note,                // Current note in modal
  openModal,           // Open modal with note
  closeModal,          // Close modal
  saveNote,            // Save current note
  updateNoteField,     // Update note field
}
```

---

### ComposerProvider

Note creation state.

**Exports:**

```javascript
{
  isOpen,              // Composer open boolean
  noteType,            // Note type
  openComposer,         // Open composer
  closeComposer,        // Close composer
  setNoteType,         // Set note type
  createNote,          // Create note from composer
}
```

---

### UIProvider

Global UI state (toasts, dialogs).

**Exports:**

```javascript
{
  toast,               // Current toast
  showToast,           // Show toast
  clearToast,          // Clear toast
  confirmDialog,        // Show confirmation dialog
  clearConfirm,         // Clear confirmation
}
```

**Usage:**

```jsx
import { useUI } from './contexts/UIContext'

function DeleteButton() {
  const { confirmDialog, clearConfirm } = useUI()

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note?',
      confirmText: 'Delete',
      danger: true,
    })

    if (confirmed) {
      deleteNote()
      clearConfirm()
    }
  }

  return <button onClick={handleDelete}>Delete</button>
}
```

---

## Utility Components

### ErrorBoundary

Global error boundary for catching errors.

**Props:**

```typescript
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}
```

**Usage:**

```jsx
import { ErrorBoundary } from './components/ErrorBoundary'

;<ErrorBoundary
  fallback={<div>Something went wrong</div>}
  onError={error => logger.error('component_error', { error })}
>
  <App />
</ErrorBoundary>
```

---

### ColorDot

Color selection dot component.

**Props:**

```typescript
interface ColorDotProps {
  color: string
  selected?: boolean
  onClick?: (color: string) => void
}
```

---

### Popover

Popover/tooltip component.

**Props:**

```typescript
interface PopoverProps {
  children: ReactNode
  content: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  visible?: boolean
}
```

---

## Component Best Practices

### 1. Single Responsibility

Each component should have one clear purpose.

```jsx
// Good: Single responsibility
function NoteCard({ note, onClick }) {
  return <div onClick={() => onClick(note.id)}>{note.title}</div>
}

// Bad: Multiple responsibilities
function NoteCardWithActions({ note }) {
  // Handles display, editing, deleting, sharing
  return <div>...</div>
}
```

### 2. Props Interface

Always document required and optional props.

```jsx
/**
 * NoteCard component
 * @param {Object} note - Note object
 * @param {Function} onClick - Click handler
 * @param {boolean} [selected] - Selected state
 */
function NoteCard({ note, onClick, selected = false }) {
  // ...
}
```

### 3. Memoization

Use `memo` for expensive renders.

```jsx
import { memo } from 'react'

const NoteCard = memo(({ note, onClick }) => {
  return <div onClick={() => onClick(note.id)}>{note.title}</div>
})
```

### 4. Callback Optimization

Use `useCallback` for event handlers.

```jsx
import { useCallback } from 'react'

function NoteCard({ note, onClick }) {
  const handleClick = useCallback(() => {
    onClick(note.id)
  }, [onClick, note.id])

  return <div onClick={handleClick}>{note.title}</div>
}
```

### 5. Error Boundaries

Wrap components with ErrorBoundaries.

```jsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <ComplexComponent />
</ErrorBoundary>
```

### 6. Loading States

Show loading indicators for async operations.

```jsx
function NoteList({ notes, loading }) {
  if (loading) return <Spinner />
  if (notes.length === 0) return <EmptyState />
  return notes.map(note => <NoteCard key={note.id} note={note} />)
}
```

### 7. Accessibility

Include ARIA attributes and keyboard navigation.

```jsx
<button
  onClick={handleAction}
  aria-label="Delete note"
  onKeyDown={e => e.key === 'Enter' && handleAction()}
>
  Delete
</button>
```

---

## Component Patterns

### Container/Presentational

**Container Component:**

```jsx
function NoteListContainer() {
  const { notes, loading, deleteNote } = useNotes()

  return <NoteList notes={notes} loading={loading} onDelete={deleteNote} />
}
```

**Presentational Component:**

```jsx
function NoteList({ notes, loading, onDelete }) {
  if (loading) return <Spinner />
  return notes.map(note => <NoteCard key={note.id} note={note} onDelete={onDelete} />)
}
```

### Compound Components

```jsx
function Modal({ children, isOpen, onClose }) {
  if (!isOpen) return null
  return (
    <div className="modal">
      <div className="modal-content">{children}</div>
      <button onClick={onClose}>Close</button>
    </div>
  )
}

Modal.Header = ({ children }) => <div className="modal-header">{children}</div>
Modal.Body = ({ children }) => <div className="modal-body">{children}</div>
Modal.Footer = ({ children }) => <div className="modal-footer">{children}</div>

// Usage
;<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>Edit Note</Modal.Header>
  <Modal.Body>
    <textarea />
  </Modal.Body>
  <Modal.Footer>
    <button>Save</button>
  </Modal.Footer>
</Modal>
```

---

## Testing Components

### Unit Test Example

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { NotesContext } from '../contexts/NotesContext'
import NoteCard from '../NoteCard'

describe('NoteCard', () => {
  const mockDeleteNote = jest.fn()
  const mockNote = { id: 1, title: 'Test Note', type: 'text' }

  const renderWithProvider = component => {
    return render(
      <NotesContext.Provider value={{ deleteNote: mockDeleteNote }}>
        {component}
      </NotesContext.Provider>
    )
  }

  it('renders note title', () => {
    renderWithProvider(<NoteCard note={mockNote} />)
    expect(screen.getByText('Test Note')).toBeInTheDocument()
  })

  it('calls delete on delete button click', () => {
    renderWithProvider(<NoteCard note={mockNote} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(mockDeleteNote).toHaveBeenCalledWith(1)
  })

  it('shows selected state when selected', () => {
    renderWithProvider(<NoteCard note={mockNote} selected={true} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})
```

---

## Performance Tips

1. **Avoid unnecessary re-renders:** Use `memo` and `useCallback`
2. **Lazy load heavy components:** Use `React.lazy` and `Suspense`
3. **Virtualize long lists:** Use react-window or react-virtualized
4. **Debounce expensive operations:** Search, resize, scroll
5. **Optimize images:** Lazy loading, WebP format, compression

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Complete
