/**
 * API Abstraction Layer
 * Single source of truth for all API calls in Glass Keep
 * Handles authentication, errors, timeouts, retries, and logging
 */

import { useAuthStore } from '../stores/authStore'
import { retryOperation } from '../utils/retryOperation'
import logger from '../utils/logger'

// Base API configuration
const API_BASE = '/api'
const API_KEY = 'glassy-dash-auth'

// Validation constants
const MAX_REQUEST_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_TITLE_LENGTH = 1000
const MAX_CONTENT_LENGTH = 100000
const MAX_IMAGES = 50
const MAX_ITEMS = 500
const MAX_TAGS = 50
const MAX_IMAGE_SIZE = 50 * 1024 * 1024 // 50MB

// Valid note types
const VALID_NOTE_TYPES = ['text', 'checklist', 'draw', 'youtube', 'music']

/**
 * Validate note data before sending to API
 * @param {Object} data - Note data to validate
 * @returns {Array<string>} Array of error messages (empty if valid)
 */
function validateNoteData(data) {
  const errors = []
  
  // Validate note type
  if (!data.type || typeof data.type !== 'string') {
    errors.push('Note type is required')
  } else if (!VALID_NOTE_TYPES.includes(data.type)) {
    errors.push(`Invalid note type. Must be one of: ${VALID_NOTE_TYPES.join(', ')}`)
  }
  
  // Validate title
  if (data.title && typeof data.title === 'string' && data.title.length > MAX_TITLE_LENGTH) {
    errors.push(`Title too long (max ${MAX_TITLE_LENGTH} characters)`)
  }
  
  // Validate content
  if (data.content && typeof data.content === 'string' && data.content.length > MAX_CONTENT_LENGTH) {
    errors.push(`Content too long (max ${MAX_CONTENT_LENGTH} characters)`)
  }
  
  // Validate images
  if (data.images && !Array.isArray(data.images)) {
    errors.push('Images must be an array')
  } else if (Array.isArray(data.images)) {
    if (data.images.length > MAX_IMAGES) {
      errors.push(`Too many images (max ${MAX_IMAGES})`)
    }
    
    // Validate image sizes
    const totalSize = data.images.reduce((sum, img) => {
      return sum + (img.src ? img.src.length : 0)
    }, 0)
    
    if (totalSize > MAX_IMAGE_SIZE) {
      errors.push(`Total image size exceeds limit: ${(totalSize / 1024 / 1024).toFixed(1)}MB (max 50MB)`)
    }
  }
  
  // Validate items
  if (data.items && !Array.isArray(data.items)) {
    errors.push('Items must be an array')
  } else if (Array.isArray(data.items) && data.items.length > MAX_ITEMS) {
    errors.push(`Too many items (max ${MAX_ITEMS})`)
  }
  
  // Validate tags
  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array')
  } else if (Array.isArray(data.tags) && data.tags.length > MAX_TAGS) {
    errors.push(`Too many tags (max ${MAX_TAGS})`)
  }
  
  // Validate color
  if (data.color && typeof data.color !== 'string') {
    errors.push('Color must be a string')
  }
  
  return errors
}

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

  // Validate request data for POST/PUT/PATCH
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    if (path === '/notes') {
      const validationErrors = validateNoteData(body)
      if (validationErrors.length > 0) {
        const error = new Error(validationErrors.join('; '))
        error.isValidationError = true
        error.validationErrors = validationErrors
        throw error
      }
    }
  }

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
    // Retry API calls for better resilience
    const res = await retryOperation(
      async () => {
        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch(`${API_BASE}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: signal || controller.signal,
        })

        clearTimeout(timeoutId)
        return response
      },
      {
        maxRetries: 3,
        delay: 1000,
        onRetry: (attempt, error, waitTime) => {
          logger.warn('api_retry_attempt', {
            path,
            method,
            attempt,
            waitTime,
            error: error.message,
            requestId,
          })
        },
      }
    )

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
