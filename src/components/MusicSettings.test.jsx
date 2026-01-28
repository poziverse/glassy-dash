import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { MusicSettings } from './MusicSettings'
import { useSettings, useUI } from '../contexts'

// Mock contexts and API
vi.mock('../contexts', () => ({
  useSettings: vi.fn(),
  useUI: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  api: vi.fn(),
}))

describe('MusicSettings', () => {
  const mockMusicSettings = {
    service: 'navidrome',
    serverUrl: 'http://localhost:4533',
    username: 'testuser',
    password: '',
    apiKey: '',
    userId: '',
  }

  const mockSetMusicSettings = vi.fn()
  const mockShowToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useSettings.mockReturnValue({
      musicSettings: mockMusicSettings,
      setMusicSettings: mockSetMusicSettings,
    })
    useUI.mockReturnValue({
      showToast: mockShowToast,
    })
  })

  it('renders initial settings correctly', () => {
    render(<MusicSettings />)
    expect(screen.getByPlaceholderText('http://your-server:4533')).toHaveValue(
      'http://localhost:4533'
    )
    expect(screen.getByDisplayValue('testuser')).toBeInTheDocument()
  })

  it('shows API Key field for Jellyfin', () => {
    useSettings.mockReturnValue({
      musicSettings: { ...mockMusicSettings, service: 'jellyfin' },
      setMusicSettings: mockSetMusicSettings,
    })

    render(<MusicSettings />)
    expect(screen.getByLabelText(/API Key/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/User ID/i)).toBeInTheDocument()
  })

  it('validates URL on save', async () => {
    render(<MusicSettings />)

    const urlInput = screen.getByPlaceholderText('http://your-server:4533')
    fireEvent.change(urlInput, { target: { value: 'invalid-url' } })

    const saveButton = screen.getByText('Save Settings')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Server URL must start with http:// or https://',
        'error'
      )
    })
  })

  it('calls setMusicSettings on successful save', async () => {
    render(<MusicSettings />)

    const saveButton = screen.getByText('Save Settings')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockSetMusicSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          serverUrl: 'http://localhost:4533',
        })
      )
      expect(mockShowToast).toHaveBeenCalledWith('Music settings saved', 'success')
    })
  })
})
