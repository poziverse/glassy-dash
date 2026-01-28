# DocsView Component

**Last Updated:** January 27, 2026

## Overview

`DocsView` is the main container for the **GlassyDocs** feature. It provides a sidebar for document management (create, search, select) and hosts the `GlassyEditor` for content editing.

## Features

- **Grid Layout**: Displays all documents in a responsive grid by default, providing a clear overview.
- **Document Creation**: Dedicated "New Document" card and header button for quick document initialization.
- **Search & Filtering**: Real-time search functionality to quickly find documents by title.
- **Auto-Save**: Changes in the editor are automatically persisted to the store.
- **Delete Protection**: Confirmation dialog before deleting documents.
- **Glass-Style Editor Toolbar**: Comprehensive formatting toolbar integrated at top of editor canvas.

## Usage

```jsx
import DocsView from './components/DocsView'

// Route integration
;<Route path="/docs" element={<DocsView />} />
```

## State Management

Uses `useDocsStore` (Zustand) for:

- `docs`: Array of document objects.
- `activeDocId`: Currently selected document.
- `createDoc`, `updateDoc`, `deleteDoc`: CRUD operations.

## Sub-Components

- **GlassyEditor**: The TipTap wrapper component with integrated toolbar.
- **DashboardLayout**: Provides the common shell.

---

## GlassyEditor Toolbar (Added January 27, 2026)

The GlassyEditor now includes a permanent glass-style formatting toolbar positioned at the top of the editing canvas.

### Toolbar Features

| Section         | Tools                                        | Keyboard Shortcuts     |
| --------------- | -------------------------------------------- | ---------------------- |
| **History**     | Undo, Redo                                   | Ctrl+Z, Ctrl+Shift+Z   |
| **Text Format** | Bold, Italic, Underline, Strikethrough, Code | Ctrl+B, Ctrl+I, Ctrl+U |
| **Headings**    | H1, H2, H3                                   | -                      |
| **Lists**       | Bullet List, Ordered List                    | -                      |
| **Blocks**      | Blockquote, Horizontal Rule                  | -                      |
| **Utility**     | Clear Formatting                             | -                      |

### Styling

The toolbar uses glassmorphic design consistent with the app theme:

```css
background: rgba(0, 0, 0, 0.4);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 0.75rem;
```

### Active States

- Active format buttons display with `bg-white/20 text-white`
- Hover state: `bg-white/10`
- Disabled buttons (e.g., Undo when nothing to undo): reduced opacity

### BubbleMenu

In addition to the fixed toolbar, a floating BubbleMenu appears when text is selected, providing quick access to:

- Bold, Italic, Underline
- H1, H2
- Bullet List, Blockquote
