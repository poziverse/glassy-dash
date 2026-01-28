import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { SettingsPanel } from './SettingsPanel'
import { useSettings, useUI, useNotes } from '../contexts'

// Mock the contexts
vi.mock('../contexts', () => ({
  useSettings: vi.fn(),
  useUI: vi.fn(),
  useNotes: vi.fn(),
}))

// Mock sub-components to simplify testing
vi.mock('./settings/AppearanceSettings', () => ({
  AppearanceSettings: () => <div data-testid="appearance-settings">Appearance Settings</div>,
}))

vi.mock('./MusicSettings', () => ({
  MusicSettings: () => <div data-testid="music-settings">Music Settings</div>,
}))

describe('SettingsPanel', () => {
  const mockSettings = {
    dark: true,
    toggleDark: vi.fn(),
    cardTransparency: 'medium',
    alwaysShowSidebarOnWide: false,
    setAlwaysShowSidebarOnWide: vi.fn(),
    listView: false,
    toggleListView: vi.fn(),
  }

  const mockUI = {
    settingsPanelOpen: true,
    setSettingsPanelOpen: vi.fn(),
  }

  const mockNotes = {
    exportAllNotes: vi.fn(),
    importNotes: vi.fn(),
    downloadSecretKey: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useSettings.mockReturnValue(mockSettings)
    useUI.mockReturnValue(mockUI)
    useNotes.mockReturnValue(mockNotes)
  })

  it('renders correctly when open', () => {
    render(<SettingsPanel />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
    // Appearance is default tab
    expect(screen.getByTestId('appearance-settings')).toBeInTheDocument()
  })

  it('switches tabs when navigation icons are clicked', () => {
    render(<SettingsPanel />)

    // Find biological icons/buttons by their tooltip text (using title or similar)
    // The Tooltip component typically adds a title or specific structure
    // Since icons are hard to query directly without testids, we can use the buttons
    // but the buttons in SettingsPanel don't have text besides tooltips.

    // Let's find the second button in the nav area (Integrations)
    const navButtons = screen.getAllByRole('button').filter(b => b.className.includes('w-10 h-10'))

    // Click second button (Integrations)
    fireEvent.click(navButtons[1])
    expect(screen.getByText('Self-Hosted Music')).toBeInTheDocument()
    expect(screen.getByTestId('music-settings')).toBeInTheDocument()

    // Click third button (Data)
    fireEvent.click(navButtons[2])
    expect(screen.getByText('Export & Backup')).toBeInTheDocument()

    // Click fourth button (General)
    fireEvent.click(navButtons[3])
    expect(screen.getByText('UI Preferences')).toBeInTheDocument()
  })

  it('calls close handler when close button is clicked', () => {
    render(<SettingsPanel />)
    const closeButton = screen.getByTitle('Close')
    fireEvent.click(closeButton)
    expect(mockUI.setSettingsPanelOpen).toHaveBeenCalledWith(false)
  })
})
