/**
 * API Abstraction Layer
 * Single source of truth for all API calls in Glass Keep
 * Handles authentication, errors, timeouts, and logging
 */

import { useAuthStore } from '../stores/authStore'

// Base API configuration
const API_BASE = '/api'
const API_KEY = 'glass-keep-auth'

/**
 * Enhanced API fetch wrapper
 * Handles auth injection, error handling, timeouts, and logging
 *
 * @param {string} path - API endpoint path (e.g., '/notes')
 * @param {Object} options - Fetch options
 * @param {string} options.method - HTTP method (default: 'GET')
 * @param {Object} options.body - Request body (for POST/PUT/PATCH)
 * @param {string} options.token - Optional token override
 * @param {AbortSignal} options.signal - AbortSignal for cancellation
 * @returns {Promise<any>} API response data
 */
export async function api(path, { method = 'GET', body, signal, token: manualToken } = {}) {
  // Get token from manual override or Zustand auth store
  const token = manualToken || useAuthStore.getState().token

  if (path !== '/auth/settings' && path !== '/login' && path !== '/register') {
    console.log(
      `[API] Request to ${path}, Token: ${token ? token.substring(0, 10) + '...' : 'NONE'}`
    )
  }

  // Generate unique request ID for tracking
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const headers = {
    'Content-Type': 'application/json',
    'X-Request-ID': requestId,
  }

  // Inject auth token if available
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal || controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle 204 No Content responses
    if (res.status === 204) return null

    // Parse JSON response
    let data = null
    try {
      data = await res.json()
    } catch (e) {
      // If response isn't JSON, leave data as null
      data = null
    }

    // Handle 401 Unauthorized (session expired)
    if (res.status === 401 && path !== '/login' && path !== '/register') {
      // Clear auth state
      useAuthStore.getState().logout()

      // Dispatch custom event for app to handle
      window.dispatchEvent(new CustomEvent('auth-expired'))

      // Create and throw auth error
      const err = new Error('Session expired. Please log in again.')
      err.status = 401
      err.isAuthError = true
      err.requestId = requestId
      throw err
    }

    // Handle other HTTP errors
    if (!res.ok) {
      const errorMessage = data?.error || data?.message || `HTTP ${res.status}`

      // Create and throw API error
      const err = new Error(errorMessage)
      err.status = res.status
      err.isApiError = true
      err.requestId = requestId
      err.response = data
      throw err
    }

    // Success - return data
    return data
  } catch (error) {
    // Re-throw already handled errors
    if (error.isAuthError || error.isApiError) {
      throw error
    }

    // Handle request timeout
    if (error.name === 'AbortError') {
      const err = new Error('Request timeout. Please check your connection.')
      err.status = 408
      err.isNetworkError = true
      err.requestId = requestId
      throw err
    }

    // Handle network errors (no connection)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const err = new Error('Network error. Please check your connection.')
      err.status = 0
      err.isNetworkError = true
      err.requestId = requestId
      throw err
    }

    // Re-throw other errors
    throw error
  }
}

/**
 * Helper to get auth token (for use outside React)
 * @returns {string|null} Current auth token
 */
export function getAuthToken() {
  return useAuthStore.getState().token
}

/**
 * Helper to set auth token (for use outside React)
 * @param {string} token - Auth token
 */
export function setAuthToken(token) {
  useAuthStore.getState().setToken(token)
}

/**
 * Helper to clear auth (for use outside React)
 */
export function clearAuth() {
  useAuthStore.getState().logout()
}
