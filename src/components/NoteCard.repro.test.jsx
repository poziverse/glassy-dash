import { render, fireEvent, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { NoteCard } from './NoteCard'
import { ModalProvider } from '../contexts/ModalContext'
import { NotesProvider } from '../contexts/NotesContext'
import { AuthProvider } from '../contexts/AuthContext'
import { SettingsProvider } from '../contexts/SettingsContext'
import { UIProvider } from '../contexts/UIContext'

// Mock contexts
vi.mock('../contexts/ModalContext', () => ({
  useModal: () => ({ openNote: vi.fn() }),
  ModalProvider: ({ children }) => <div>{children}</div>,
}))
vi.mock('../contexts/NotesContext', () => ({
  useNotes: () => ({ togglePin: vi.fn() }),
  NotesProvider: ({ children }) => <div>{children}</div>,
}))
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: { id: 'user1' } }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}))
vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({ dark: false, cardTransparency: 'medium', listView: false }),
  SettingsProvider: ({ children }) => <div>{children}</div>,
}))
vi.mock('../contexts/UIContext', () => ({
  // Mock UIContext explicitly
  useUI: () => ({}),
  UIProvider: ({ children }) => <div>{children}</div>,
}))

describe('NoteCard Drag and Drop', () => {
  const mockNote = {
    id: 'note1',
    title: 'Test Note',
    content: 'Content',
    pinned: false,
    tags: [],
    items: [],
    images: [],
    color: 'default',
  }

  const mockOnDragStart = vi.fn()
  const mockOnDrop = vi.fn()

  it('triggers onDragStart when dragged', () => {
    // console.log("Rendering NoteCard...")
    render(
      <AuthProvider>
        <SettingsProvider>
          <UIProvider>
            <ModalProvider>
              <NotesProvider>
                <NoteCard n={mockNote} onDragStart={mockOnDragStart} onDrop={mockOnDrop} />
              </NotesProvider>
            </ModalProvider>
          </UIProvider>
        </SettingsProvider>
      </AuthProvider>
    )

    const card = screen.getByText('Test Note').closest('.note-card')
    // console.log("Card found:", card)

    // Check if draggable attribute is present
    // Note: in the reverted version, draggable={!multiMode} defaults to true if multiMode is false (default)
    expect(card.getAttribute('draggable')).toBe('true')

    fireEvent.dragStart(card)
    expect(mockOnDragStart).toHaveBeenCalled()
  })
})
