import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminView from './AdminView'
import { api } from '../lib/api'

vi.setConfig({ testTimeout: 15000 })

// Mock dependencies
vi.mock('../lib/api', () => ({
  api: vi.fn(),
}))

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
}))

vi.mock('../stores/uiStore', () => ({
  useUIStore: vi.fn(selector =>
    selector({
      setSettingsPanelOpen: vi.fn(),
      showToast: vi.fn(),
      showGenericConfirm: vi.fn(),
    })
  ),
}))

vi.mock('./DashboardLayout', () => ({
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}))

vi.mock('./admin/AdminUserModal', () => ({
  default: () => <div data-testid="admin-user-modal" />,
}))

vi.mock('./admin/AuditLogViewer', () => ({
  default: () => <div data-testid="audit-log-viewer">Audit Log Viewer</div>,
}))

import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'

describe('AdminView', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useAuthStore.mockImplementation(selector => {
      const state = {
        token: 'fake-token',
        currentUser: { id: 1, is_admin: true, name: 'Admin' },
        logout: vi.fn(),
      }
      return selector(state)
    })

    useSettingsStore.mockReturnValue(false)

    api.mockResolvedValue([])

    // Mock settings response
    api.mockImplementation(url => {
      // console.log('Mock API call:', url)
      if (url === '/admin/users')
        return Promise.resolve([
          { id: 1, name: 'User 1', email: 'u1@test.com', storage_bytes: 100 },
          { id: 2, name: 'User 2', email: 'u2@test.com', storage_bytes: 200 },
        ])
      if (url === '/admin/settings') return Promise.resolve({ allowNewAccounts: true })
      return Promise.resolve([])
    })
  })

  it('renders users table by default', async () => {
    render(<AdminView />)

    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument()
    })

    expect(screen.getByText('Registered Users')).toBeInTheDocument()
  })

  it('switches to audit logs tab', async () => {
    const user = userEvent.setup()
    render(<AdminView />)

    // Wait for content to load first
    await waitFor(() => {
      expect(screen.getByText('Audit Logs')).toBeInTheDocument()
    })

    // Click tab using userEvent (no act() wrapper needed)
    await user.click(screen.getByText('Audit Logs'))

    // Wait for tab content to switch
    await waitFor(() => {
      expect(screen.getByTestId('audit-log-viewer')).toBeInTheDocument()
    })
    
    // Verify old tab content is gone
    expect(screen.queryByText('Registered Users')).not.toBeInTheDocument()
  })

  it('renders statistics correctly', async () => {
    render(<AdminView />)

    // Check if Stats cards are rendered (Total Users value is derived from API mock)
    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // 2 users mock
    })
  })
})
