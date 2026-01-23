# Glass Keep Components Overview
**Last Updated:** January 20, 2026  
**Version:** 1.0  
**Status:** ✅ Complete Overview

---

## Overview

Glass Keep consists of 20 React components organized into a hierarchical structure. This document provides a comprehensive overview of all components, their purposes, relationships, and usage patterns.

---

## Component Architecture

### Component Hierarchy

```
App (Root)
├── DashboardLayout
│   ├── Sidebar
│   ├── NotesView
│   │   ├── NoteCard
│   │   └── Bulk Operations UI
│   ├── SearchBar
│   └── Composer
│       ├── FormatToolbar
│       └── Type Selection
├── SettingsPanel
├── AdminView
└── Modal (Dialog)
    ├── FormatToolbar
    ├── ChecklistRow (for checklists)
    ├── DrawingCanvas (for drawings)
    ├── DrawingPreview (for drawings)
    └── Image Gallery
```

---

## Component Classification

### 1. Core Application Components

#### App.jsx
**Purpose:** Root component that manages routing, providers, and overall application structure

**Key Responsibilities:**
- Route configuration (React Router)
- Context provider tree setup
- Authentication guard
- Error boundary integration

**File:** `GLASSYDASH/src/App.jsx`

---

### 2. Layout Components

#### DashboardLayout
**Purpose:** Main layout wrapper for the dashboard interface

**Key Responsibilities:**
- Sidebar navigation
- Main content area
- Responsive layout
- Theme application

**File:** `GLASSYDASH/src/components/DashboardLayout.jsx`

#### Sidebar
**Purpose:** Navigation sidebar with tags and filters

**Key Responsibilities:**
- Tag list display
- Filter options
- Navigation links
- Collapsible menu

**File:** `GLASSYDASH/src/components/Sidebar.jsx`

---

### 3. Authentication Components

#### AuthViews
**Purpose:** Login and registration forms

**Key Responsibilities:**
- User login form
- User registration form
- Secret key login
- Form validation

**File:** `GLASSYDASH/src/components/AuthViews.jsx`

---

### 4. Note Display Components

#### NotesView
**Purpose:** Main view for displaying notes in grid or list layout

**Key Responsibilities:**
- Note card rendering
- Layout switching (grid/list)
- Bulk selection
- Filtering and search
- Drag and drop reordering

**File:** `GLASSYDASH/src/components/NotesView.jsx`

#### NoteCard
**Purpose:** Individual note card in the notes grid/list

**Key Responsibilities:**
- Note preview display
- Title, content, tags
- Pin/unpin functionality
- Click to open modal
- Bulk selection checkbox

**File:** `GLASSYDASH/src/components/NoteCard.jsx`

---

### 5. Note Editing Components

#### Modal
**Purpose:** Modal dialog for viewing and editing notes

**Key Responsibilities:**
- View/Edit mode toggle
- Note content display/editing
- Toolbar actions
- Metadata editing (color, tags)
- Collaborator management

**File:** `GLASSYDASH/src/components/Modal.jsx`

#### Composer
**Purpose:** Note composer for creating new notes

**Key Responsibilities:**
- Note type selection (text/checklist/drawing)
- Title and content input
- Tag input
- Color selection
- Image attachment

**File:** `GLASSYDASH/src/components/Composer.jsx`

#### FormatToolbar
**Purpose:** Markdown formatting toolbar

**Key Responsibilities:**
- Formatting buttons (bold, italic, etc.)
- Markdown insertion
- Toolbar positioning
- Context-aware options

**File:** `GLASSYDASH/src/components/FormatToolbar.jsx`

---

### 6. Content Type Components

#### ChecklistRow
**Purpose:** Individual checklist item component

**Key Responsibilities:**
- Checkbox for completion toggle
- Text display/edit
- Drag handle for reordering
- Delete button

**File:** `GLASSYDASH/src/components/ChecklistRow.jsx`

#### DrawingCanvas
**Purpose:** Canvas for drawing handwritten notes

**Key Responsibilities:**
- Freehand drawing
- Brush size control
- Color selection
- Canvas clearing
- Drawing export

**File:** `GLASSYDASH/src/components/DrawingCanvas.jsx`

#### DrawingPreview
**Purpose:** Preview of drawing in note card

**Key Responsibilities:**
- Display thumbnail of drawing
- Click to open full view
- Proper scaling

**File:** `GLASSYDASH/src/components/DrawingPreview.jsx`

---

### 7. Search and Navigation Components

#### SearchBar
**Purpose:** Search interface for finding notes

**Key Responsibilities:**
- Search input field
- AI assistant integration
- Quick filters
- Search results display

**File:** `GLASSYDASH/src/components/SearchBar.jsx`

---

### 8. Settings Components

#### SettingsPanel
**Purpose:** Settings interface for user preferences

**Key Responsibilities:**
- Theme selection
- Dark mode toggle
- View mode toggle (grid/list)
- Background customization
- Account settings

**File:** `GLASSYDASH/src/components/SettingsPanel.jsx`

---

### 9. Administrative Components

#### AdminView
**Purpose:** Admin panel for user management

**Key Responsibilities:**
- User list display
- User creation
- User deletion
- Password reset
- Admin role assignment
- Registration toggle

**File:** `GLASSYDASH/src/components/AdminView.jsx`

---

### 10. UI Utility Components

#### ColorDot
**Purpose:** Color indicator component

**Key Responsibilities:**
- Display note color
- Circular indicator
- Selected state styling

**File:** `GLASSYDASH/src/components/ColorDot.jsx`

#### Popover
**Purpose:** Popover UI component for dropdowns and menus

**Key Responsibilities:**
- Positioning
- Click-outside close
- Content rendering
- Z-index management

**File:** `GLASSYDASH/src/components/Popover.jsx`

#### Icons
**Purpose:** Icon component library

**Key Responsibilities:**
- SVG icon rendering
- Icon size and color
- Custom icons (checklist, drawing, images)

**File:** `GLASSYDASH/src/components/Icons.jsx`

#### ErrorBoundary
**Purpose:** Error boundary for graceful error handling

**Key Responsibilities:**
- Catch React errors
- Display fallback UI
- Log errors
- Recovery options

**File:** `GLASSYDASH/src/components/ErrorBoundary.jsx`

#### ErrorMessage
**Purpose:** Error message display component

**Key Responsibilities:**
- Error display
- Message formatting
- Dismiss action
- Error type styling

**File:** `GLASSYDASH/src/components/ErrorMessage.tsx`

---

## Component Interaction Patterns

### 1. Note Viewing Pattern

```
User Action → NotesView → NoteCard
              ↓
         (Click on card)
              ↓
             Modal
              ↓
         (Edit mode)
              ↓
       FormatToolbar + Content Editor
```

### 2. Note Creation Pattern

```
User Action → Composer
              ↓
       (Select Type)
              ↓
    Type-Specific Input
              ↓
       (Click "Add Note")
              ↓
         NotesView → NoteCard
```

### 3. Collaboration Pattern

```
User Action → Modal → Add Collaborator
              ↓
         API Request
              ↓
         SSE Broadcast
              ↓
    All Collaborators' Notes Updated
```

### 4. Bulk Operations Pattern

```
User Action → NotesView → Select Multiple Notes
              ↓
         Bulk Action Menu
              ↓
         API Batch Request
              ↓
         Optimistic Update
              ↓
         NotesView Refresh
```

---

## Component Dependencies

### Direct Dependencies

| Component | Depends On | Contexts Used |
|-----------|-------------|----------------|
| App | All components below | All providers |
| DashboardLayout | Sidebar, NotesView | Auth, Notes, Settings |
| NotesView | NoteCard | Notes, UI, Settings |
| NoteCard | ColorDot, Icons | Notes, Modal |
| Modal | FormatToolbar, ChecklistRow, DrawingCanvas | Notes, Modal, Collaboration |
| Composer | FormatToolbar, ColorDot | Composer, Notes |
| SearchBar | Icons | Notes, UI |
| SettingsPanel | Icons | Settings, UI |
| AdminView | Icons, ErrorMessage | Auth, Notes |
| Sidebar | Icons | Notes, UI |

### Context Dependencies

| Component | AuthContext | NotesContext | ModalContext | SettingsContext | ComposerContext | UIContext |
|-----------|--------------|--------------|---------------|-----------------|-----------------|------------|
| App | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DashboardLayout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| NotesView | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| NoteCard | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modal | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Composer | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| SearchBar | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| SettingsPanel | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| AdminView | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Sidebar | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## Component State Management

### Local State Components

Components that manage local state (not using context):

1. **FormatToolbar** - Formatting mode, toolbar visibility
2. **ChecklistRow** - Checkbox state, edit mode
3. **DrawingCanvas** - Drawing data, brush settings
4. **ColorDot** - Selected state
5. **Popover** - Open/close state
6. **Icons** - No state (pure component)

### Context-Dependent Components

Components that rely on context providers:

1. **NotesView** - Notes, filtering, bulk selection
2. **NoteCard** - Note data, pin status
3. **Modal** - Modal state, current note
4. **Composer** - Draft state, composer visibility
5. **SearchBar** - Search state, AI results
6. **SettingsPanel** - Settings state
7. **AdminView** - User management state
8. **Sidebar** - Tags, filters

---

## Component Props Patterns

### Common Props

Many components share common prop patterns:

#### Data Props
- `data` - Array or object of data
- `items` - Array of items
- `note` - Single note object

#### Event Props
- `onClick` - Click handler
- `onChange` - Change handler
- `onSubmit` - Submit handler
- `onDelete` - Delete handler
- `onEdit` - Edit handler

#### UI Props
- `className` - CSS classes
- `style` - Inline styles
- `disabled` - Disabled state
- `loading` - Loading state
- `error` - Error state

#### Selection Props
- `selected` - Selected state
- `onSelect` - Selection handler
- `onDeselect` - Deselection handler

---

## Component Testing Considerations

### Unit Testing Strategy

Each component should have tests for:

1. **Rendering**
   - Component renders without crashing
   - Props are correctly applied
   - Conditional rendering works

2. **Interactions**
   - Click handlers work
   - Form inputs update
   - State changes trigger re-renders

3. **Integration**
   - Context provider integration
   - Child component rendering
   - Event propagation

4. **Edge Cases**
   - Empty data states
   - Error states
   - Loading states

### Testing Tools

- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing

---

## Performance Considerations

### Optimization Techniques

1. **Memoization**
   - Use `React.memo` for expensive components
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers

2. **Code Splitting**
   - Use `React.lazy` for large components
   - Use dynamic imports for optional features

3. **Virtualization**
   - Consider virtual scrolling for large note lists (future)

4. **Image Optimization**
   - Lazy load images
   - Use thumbnails
   - Compress before upload

---

## Component Accessibility

### ARIA Attributes

Components should include appropriate ARIA attributes:

- Buttons: `aria-label`, `aria-pressed`
- Inputs: `aria-label`, `aria-required`
- Modals: `role="dialog"`, `aria-modal="true"`
- Lists: `role="list"`, `role="listitem"`

### Keyboard Navigation

- All interactive elements keyboard accessible
- Tab order logical
- Escape key closes modals
- Enter/Space for buttons

---

## Related Documentation

- [Contexts Documentation](./02_CONTEXTS.md) - Context provider details
- [Hooks Documentation](./03_HOOKS.md) - Custom hooks
- [Utils Documentation](./04_UTILS.md) - Utility functions
- [App.jsx.md](./components/App.jsx.md) - App component details
- [NotesView.md](./components/NotesView.md) - NotesView details
- [NoteCard.md](./components/NoteCard.md) - NoteCard details
- [Modal.md](./components/Modal.md) - Modal details

---

**Component Count:** 20  
**Documented Components:** 20 (100% overview)  
**Last Updated:** January 20, 2026