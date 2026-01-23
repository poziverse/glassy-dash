# Glass Keep Hooks Guide
**Last Updated:** January 21, 2026  
**Version:** 1.1.3  
**Status:** ✅ Updated to Mutation-Driven Architecture

---

## Overview

Glass Keep has migrated to a declarative, mutation-driven hook architecture. The system uses **TanStack Query** for server state management and **Zustand** for local UI state.

---

## Persistence Mutations (`src/hooks/mutations`)

These hooks handle all write operations with optimistic updates, automatic rollback on failure, and cache invalidation.

### `useNoteMutations`

Integrated into `NotesContext`, but available for direct use.

| Hook | Operation | Strategy | Use Case |
|------|-----------|----------|----------|
| `useCreateNote` | `POST` | Optimistic | Adding a new note to the list immediately. |
| `useUpdateNote` | `PUT` | Invalidation | Full note replacement (e.g., from Edit Modal). |
| `usePatchNote` | `PATCH` | Optimistic | Property-level updates (e.g., toggling checkbox, color). **Crucial for data integrity.** |
| `useDeleteNote` | `DELETE` | Optimistic | Moving to trash or permanent deletion. |
| `useRestoreNote`| `PATCH` | Optimistic | Restoring from trash (respects original archive status). |
| `useReorderNotes`| `PUT` | Optimistic | Drag-and-drop reordering with cross-list consistency. |
| `useArchiveNote` | `PATCH` | Optimistic | Moving note to Archived list. |

### `useAdminMutations`

Manages administrative tasks.

- `useUpdateAdminSettings`: Partial updates (`PATCH`) to system settings.
- `useCreateUser`: Adds new users to the system.
- `useDeleteUser`: Removes users.

---

## Data Queries (`src/hooks/queries`)

Optimized fetching with intelligent caching and background synchronization.

### `useNotes`

| Function | Key | Description |
|----------|-----|-------------|
| `notesKeys.lists()` | `['notes', 'list']` | The active notes list. |
| `notesKeys.archived()`| `['notes', 'archived']`| Archived notes. |
| `notesKeys.trash()` | `['notes', 'trash']` | Items in the trash. |

---

## Contextual Hooks

These hooks are the primary interface for UI components.

### `useNotesContext`

The powerhouse of the application. It bridges TanStack Query hooks with SSE (Server-Sent Events) synchronization.

- Handles complex operations like "Delete Selected".
- Automates SSE `note_updated` events by invalidating the query cache globally.
- Provides a stable API for `NoteCard` components.

### `useAuth`

Manages session lifecycle, tokens, and user identity via `AuthContext`.

### `useSettings`

Bridge to `settingsStore` (Zustand). Manages local preferences:
- Dark Mode / Appearance.
- Layout (Grid vs List).
- Accent Colors and Transparency.

---

## Architecture Pattern: "The Safety Loop"

To maintain data integrity (especially in shared/multi-tab environments), Glass Keep follows this pattern:

1. **User Action**: UI calls a mutation hook (e.g., `usePatchNote`).
2. **Optimistic UI**: `onMutate` updates the cache immediately.
3. **Partial Update**: `PATCH` is sent to the server (containing ONLY changed fields).
4. **SSE Event**: Server broadcasts update; `NotesContext` receives event.
5. **Cache Refresh**: `queryClient.invalidateQueries` triggers a background refresh to ensure absolute sync.
6. **Rollback**: If step 3 fails, `onError` restores the previous cache state.
