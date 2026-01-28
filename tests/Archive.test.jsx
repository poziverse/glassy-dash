import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import NotesView from '../src/components/NotesView'
import { useNotesCompat } from '../src/hooks/useNotesCompat'

// Mock the hook
vi.mock('../src/hooks/useNotesCompat')

// Mock context-dependent components
vi.mock('../src/components/NoteCard', () => ({
  NoteCard: ({ n }) => (
    <div role="heading" aria-level="3">
      {n.title}
    </div>
  ),
}))

vi.mock('../src/components/Composer', () => ({
  Composer: () => <div>Composer</div>,
}))

vi.mock('../src/components/DashboardLayout', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../src/components/SettingsPanel', () => ({
  SettingsPanel: () => <div>Settings</div>,
}))

vi.mock('../src/components/Popover', () => ({
  Popover: ({ children }) => <div>{children}</div>,
}))

describe('NotesView - Archive Logic', () => {
  const mockNotes = [
    { id: '1', title: 'Banana', timestamp: 1000, archived: 1, tags: ['fruit'] },
    { id: '2', title: 'Apple', timestamp: 3000, archived: 1, tags: ['fruit'] },
    { id: '3', title: 'Cherry', timestamp: 2000, archived: 1, tags: ['fruit'] },
  ]

  it('sorts archived notes by date-desc by default', () => {
    useNotesCompat.mockReturnValue({
      currentUser: { id: 1, is_admin: false },
      pinned: [],
      others: [],
      archivedNotes: mockNotes,
      tagFilter: 'ARCHIVED',
      setTagFilter: vi.fn(),
      tagsWithCounts: [],
      notesLoading: false,
      filteredEmptyWithSearch: false,
      allEmpty: false,
      togglePin: vi.fn(),
      selectedIds: new Set(),
      multiMode: false,
    })

    render(<NotesView />)

    // Check titles in order: Apple (3000), Cherry (2000), Banana (1000)
    const titles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(titles).toEqual(['Apple', 'Cherry', 'Banana'])
  })

  it('sorts archived notes by title-asc', () => {
    useNotesCompat.mockReturnValue({
      currentUser: { id: 1, is_admin: false },
      pinned: [],
      others: [],
      archivedNotes: mockNotes,
      tagFilter: 'ARCHIVED',
      setTagFilter: vi.fn(),
      tagsWithCounts: [],
      notesLoading: false,
      filteredEmptyWithSearch: false,
      allEmpty: false,
      togglePin: vi.fn(),
      selectedIds: new Set(),
      multiMode: false,
    })

    render(<NotesView />)

    // Change sort to title-asc
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'title-asc' } })

    const titles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(titles).toEqual(['Apple', 'Banana', 'Cherry'])
  })
})
