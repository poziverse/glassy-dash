import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { useAuthStore } from '../stores/authStore'

describe('Authentication', () => {
  beforeEach(() => {
    // Reset Zustand store
    act(() => {
      useAuthStore.getState().logout()
    })

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    vi.stubGlobal('localStorage', localStorageMock)

    // Mock fetch for API calls
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Helper to render hook with provider
  function renderAuthHook() {
    return renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    })
  }

  describe('User Registration', () => {
    it('should register new user with valid credentials', async () => {
      const mockResponse = {
        token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          isAdmin: false,
          created_at: new Date().toISOString(),
        },
      }

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderAuthHook()

      await act(async () => {
        const response = await result.current.register(
          'Test User',
          'test@example.com',
          'Password123!'
        )

        expect(response.ok).toBe(true)
        expect(response.user).toEqual(mockResponse.user)
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/register',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123!',
          }),
        })
      )

      // Verify token and user are stored
      expect(result.current.currentUser).toEqual(mockResponse.user)
      expect(result.current.token).toBe(mockResponse.token)
    })

    it('should reject registration with weak password', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Password must be at least 8 characters' }),
      })

      const { result } = renderAuthHook()

      await act(async () => {
        const response = await result.current.register('Test User', 'test@example.com', 'weak')

        expect(response.ok).toBe(false)
        expect(response.error).toBe('Password must be at least 8 characters')
      })

      expect(result.current.currentUser).toBeNull()
    })

    it('should reject duplicate email registration', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Email already exists' }),
      })

      const { result } = renderAuthHook()

      await act(async () => {
        const response = await result.current.register(
          'Test User',
          'test@example.com',
          'Password123!'
        )

        expect(response.ok).toBe(false)
        expect(response.error).toContain('already exists')
      })

      expect(result.current.currentUser).toBeNull()
    })
  })

  describe('User Login', () => {
    it('should login with valid credentials', async () => {
      const mockResponse = {
        token: 'mock-jwt-token',
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          isAdmin: false,
          created_at: new Date().toISOString(),
        },
      }

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderAuthHook()

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'Password123!')

        expect(response.ok).toBe(true)
        expect(response.user).toEqual(mockResponse.user)
      })

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'Password123!',
          }),
        })
      )

      // Verify token and user are stored
      expect(result.current.currentUser).toEqual(mockResponse.user)
      expect(result.current.token).toBe(mockResponse.token)
    })

    it('should reject invalid credentials', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid email or password' }),
      })

      const { result } = renderAuthHook()

      await act(async () => {
        const response = await result.current.signIn('test@example.com', 'WrongPassword')

        expect(response.ok).toBe(false)
        expect(response.error).toBe('Invalid email or password')
      })

      // Token will be undefined when not authenticated
      expect(result.current.currentUser).toBeNull()
      expect(!result.current.token).toBe(true)
    })

    it('should reject missing email', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Email is required' }),
      })

      const { result } = renderAuthHook()

      await act(async () => {
        const response = await result.current.signIn('', 'Password123!')

        expect(response.ok).toBe(false)
        expect(response.error).toBe('Email is required')
      })

      // Token will be undefined when not authenticated
      expect(result.current.currentUser).toBeNull()
      expect(!result.current.token).toBe(true)
    })
  })

  describe('User Logout', () => {
    it('should logout and clear token', async () => {
      // Set up initial logged in state
      const mockResponse = {
        token: 'fake-token',
        user: { id: 'user-123', email: 'test@example.com' },
      }

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const { result } = renderAuthHook()

      await act(async () => {
        await result.current.signIn('test@example.com', 'password')
      })

      expect(result.current.currentUser).toBeDefined()

      // Now logout
      act(() => {
        result.current.logout()
      })

      expect(result.current.currentUser).toBeNull()
      expect(!result.current.token).toBe(true)
    })
  })

  describe('Authentication State', () => {
    it('should start with empty state if no session', () => {
      const { result } = renderAuthHook()

      expect(result.current.currentUser).toBeNull()
      expect(!result.current.token).toBe(true)
      expect(result.current.isAdmin).toBe(false)
    })
  })
})
