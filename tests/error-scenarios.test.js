/**
 * Error Scenario Tests
 * Tests all failure modes and error handling
 * Part of Phase 4: Advanced Testing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the authStore before importing api
vi.mock('../src/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      token: 'test-token',
      logout: vi.fn(),
    })),
  },
}))

// Mock logger to prevent console output
vi.mock('../src/utils/logger', () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock retryOperation to avoid delays in tests
vi.mock('../src/utils/retryOperation', () => ({
  retryOperation: vi.fn(fn => fn()),
}))

// Import after mocks are set up
import { api } from '../src/lib/api'
import { useAuthStore } from '../src/stores/authStore'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock implementation
    useAuthStore.getState.mockReturnValue({
      token: 'test-token',
      logout: vi.fn(),
    })
  })

  afterEach(() => {
    mockFetch.mockReset()
  })

  describe('Network Errors', () => {
    it('should handle network timeout', async () => {
      mockFetch.mockRejectedValue(new DOMException('Aborted', 'AbortError'))

      await expect(api('/notes')).rejects.toMatchObject({
        message: expect.stringContaining('timeout'),
        status: 408,
        isNetworkError: true,
      })
    })

    it('should handle connection refused', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(api('/notes')).rejects.toMatchObject({
        message: expect.stringContaining('Network error'),
        status: 0,
        isNetworkError: true,
      })
    })
  })

  describe('Authentication Errors', () => {
    it('should handle 401 unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid token' }),
      })

      await expect(api('/notes')).rejects.toMatchObject({
        message: expect.stringContaining('Session expired'),
        status: 401,
        isAuthError: true,
      })
    })

    it('should handle 403 forbidden', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Forbidden' }),
      })

      await expect(api('/notes')).rejects.toMatchObject({
        message: 'Forbidden',
        status: 403,
        isApiError: true,
      })
    })

    it('should call logout on 401', async () => {
      const mockLogout = vi.fn()
      useAuthStore.getState.mockReturnValue({
        token: 'test-token',
        logout: mockLogout,
      })

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid token' }),
      })

      try {
        await api('/notes')
      } catch (_error) {
        // Expected to throw
      }

      expect(mockLogout).toHaveBeenCalled()
    })
  })

  describe('Server Errors', () => {
    it('should handle 500 internal server error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      })

      await expect(api('/notes')).rejects.toMatchObject({
        message: 'Internal server error',
        status: 500,
        isApiError: true,
      })
    })

    it('should handle 502 bad gateway', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        json: () => Promise.resolve({ error: 'Bad gateway' }),
      })

      await expect(api('/notes')).rejects.toMatchObject({
        message: 'Bad gateway',
        status: 502,
        isApiError: true,
      })
    })

    it('should handle 503 service unavailable', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'Service unavailable' }),
      })

      await expect(api('/notes')).rejects.toMatchObject({
        message: 'Service unavailable',
        status: 503,
        isApiError: true,
      })
    })
  })

  describe('Validation Errors', () => {
    it('should handle 400 bad request', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: 'Validation failed',
            details: ['Title is required'],
          }),
      })

      await expect(
        api('/notes', {
          method: 'POST',
          body: { type: 'text' },
        })
      ).rejects.toMatchObject({
        message: 'Validation failed',
        status: 400,
        isApiError: true,
      })
    })

    it('should validate note data before sending', async () => {
      // Invalid note type should throw validation error before fetch
      await expect(
        api('/notes', {
          method: 'POST',
          body: { type: 'invalid', title: 'Test' },
        })
      ).rejects.toThrow()

      // Fetch should not have been called due to client-side validation
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Data Handling', () => {
    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new SyntaxError('Unexpected token')),
      })

      const result = await api('/notes')
      expect(result).toBeNull()
    })

    it('should handle 204 No Content response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
      })

      const result = await api('/notes')
      expect(result).toBeNull()
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous failures', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      const promises = [
        api('/notes').catch(e => e),
        api('/notes/archived').catch(e => e),
        api('/notes/trash').catch(e => e),
      ]

      const results = await Promise.all(promises)

      expect(results.every(r => r.isNetworkError === true)).toBe(true)
    })

    it('should track independent request results', async () => {
      // First call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: [] }),
      })
      // Second call fails
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
      // Third call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ notes: [] }),
      })

      const results = await Promise.allSettled([
        api('/notes'),
        api('/notes/archived'),
        api('/notes/trash'),
      ])

      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failCount = results.filter(r => r.status === 'rejected').length

      expect(successCount).toBe(2)
      expect(failCount).toBe(1)
    })
  })
})
