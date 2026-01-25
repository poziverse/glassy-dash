# DocsView Component

## Overview

`DocsView` is the main container for the **GlassyDocs** feature. It provides a sidebar for document management (create, search, select) and hosts the `GlassyEditor` for content editing.

## Features

- **Grid Layout**: Displays all documents in a responsive grid by default, providing a clear overview.
- **Document Creation**: Dedicated "New Document" card and header button for quick document initialization.
- **Search & Filtering**: Real-time search functionality to quickly find documents by title.
- **Auto-Save**: Changes in the editor are automatically persisted to the store.
- **Delete Protection**: Confirmation dialog before deleting documents.

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

- **GlassyEditor**: The TipTap wrapper component.
- **DashboardLayout**: Provides the common shell.
