import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import NotesView from './NotesView'

// Mock dependencies
vi.mock('../hooks/useNotesCompat', () => ({
  useNotesCompat: vi.fn(),
}))

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../stores/settingsStore', () => ({
  useSettingsStore: vi.fn(() => ({})), // Return empty object by default
}))

vi.mock('../stores/uiStore', () => ({
  useUIStore: vi.fn(() => ({})),
}))

// Mock components
vi.mock('./DashboardLayout', () => ({
  default: ({ children, title }) => (
    <div data-testid="dashboard-layout">
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

vi.mock('./NoteCard', () => ({
  NoteCard: ({ n }) => <div data-testid="note-card">{n.title}</div>,
}))

vi.mock('./Composer', () => ({
  Composer: () => <div data-testid="composer">Composer</div>,
}))

import { useNotesCompat } from '../hooks/useNotesCompat'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUIStore } from '../stores/uiStore'

describe('NotesView', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementation
    useNotesCompat.mockReturnValue({
      currentUser: { id: '1', name: 'User' },
      pinned: [],
      others: [],
      archivedNotes: [],
      tagFilter: null,
      notesLoading: false,
      filteredEmptyWithSearch: false,
      allEmpty: false,
      multiMode: false,
      selectedIds: new Set(),
      tagsWithCounts: [],
    })

    useAuthStore.mockReturnValue({ currentUser: { id: '1' } })
    useSettingsStore.mockReturnValue(false) // for booleans like dark, listView
    useUIStore.mockReturnValue(null) // for simple values
  })

  it('renders loading state', () => {
    useNotesCompat.mockReturnValue({
      ...useNotesCompat(),
      notesLoading: true,
      pinned: [],
      others: [],
    })

    render(<NotesView />)
    expect(screen.getByText('Loading Notes...')).toBeInTheDocument()
  })

  it('renders empty state', () => {
    useNotesCompat.mockReturnValue({
      ...useNotesCompat(),
      allEmpty: true,
    })

    render(<NotesView />)
    expect(screen.getByText(/No notes yet/i)).toBeInTheDocument()
  })

  it('renders pinned and other notes', () => {
    useNotesCompat.mockReturnValue({
      ...useNotesCompat(),
      pinned: [{ id: '1', title: 'Pinned Note' }],
      others: [{ id: '2', title: 'Other Note' }],
    })

    render(<NotesView />)

    expect(screen.getByText('Pinned')).toBeInTheDocument()
    expect(screen.getByText('Others')).toBeInTheDocument()
    expect(screen.getByText('Pinned Note')).toBeInTheDocument()
    expect(screen.getByText('Other Note')).toBeInTheDocument()
  })
})
