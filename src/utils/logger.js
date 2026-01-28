import { useCallback, useEffect } from 'react'

/**
 * Structured logging utility for Glass Keep
 * Provides centralized error/event tracking with persistence
 *
 * Usage:
 * import { useLogger } from './hooks/useLogger';
 * const logger = useLogger();
 * logger.error('action_name', { context: 'data' }, error);
 */

class Logger {
  constructor() {
    this.requestId = this.generateRequestId()
    this.userId = null
    this.token = null // Add token storage
    this.sessionStartTime = new Date()
    this.pendingLogs = []
    this.pendingLogInterval = null
    this.isSending = false

    // Load any pending logs from failed attempts
    this.loadPendingLogs()

    // Try to send pending logs periodically
    this.startPendingLogInterval()
  }

  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  setUserId(userId) {
    this.userId = userId
  }

  setToken(token) {
    this.token = token
  }

  clearUserId() {
    this.userId = null
    this.token = null // Clear token when clearing user
  }

  /**
   * Log an error with full context
   */
  async error(action, context = {}, error = null) {
    const entry = this.createLogEntry('error', action, context, error)
    await this.sendLog(entry)
  }

  /**
   * Log a warning
   */
  async warn(action, context = {}, error = null) {
    const entry = this.createLogEntry('warn', action, context, error)
    await this.sendLog(entry)
  }

  /**
   * Log informational event
   */
  async info(action, context = {}) {
    const entry = this.createLogEntry('info', action, context)
    await this.sendLog(entry)
  }

  /**
   * Log debug information (verbose)
   */
  async debug(action, context = {}) {
    this.createLogEntry('debug', action, context)
    console.debug(`[${action}]`, context)
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, action, context, error) {
    return {
      timestamp: new Date().toISOString(),
      level,
      requestId: this.requestId,
      userId: this.userId,
      action,
      context,
      sessionDuration: Date.now() - this.sessionStartTime.getTime(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...(error && {
        error: {
          message: error?.message,
          name: error?.name,
          stack: error?.stack,
        },
      }),
    }
  }

  /**
   * Send log to backend
   */
  async sendLog(entry) {
    // Always log to console in development
    if (entry.level === 'error') {
      console.error(`[${entry.action}]`, entry)
    } else if (entry.level === 'warn') {
      console.warn(`[${entry.action}]`, entry)
    }

    // Skip sending if no token (not authenticated)
    if (!this.token) {
      console.debug('[Logger] No token, skipping log send')
      return
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      }

      const response = await fetch('/api/logs', {
        method: 'POST',
        headers,
        body: JSON.stringify(entry),
      })

      if (!response.ok) {
        // Failed to send, save for retry
        this.addPendingLog(entry)
      }
    } catch (error) {
      // Network error, save for retry
      console.warn('[Logger] Failed to send log, storing locally:', error.message)
      this.addPendingLog(entry)
    }
  }

  /**
   * Store log locally for retry
   */
  addPendingLog(entry) {
    const logs = JSON.parse(localStorage.getItem('pending_logs') || '[]')
    logs.push(entry)
    // Keep only last 100 logs
    localStorage.setItem('pending_logs', JSON.stringify(logs.slice(-100)))
  }

  /**
   * Load pending logs from storage
   */
  loadPendingLogs() {
    try {
      const logs = JSON.parse(localStorage.getItem('pending_logs') || '[]')
      this.pendingLogs = logs
    } catch (error) {
      console.warn('[Logger] Failed to load pending logs:', error.message)
      this.pendingLogs = []
    }
  }

  /**
   * Try to send pending logs (with race condition protection)
   */
  async sendPendingLogs() {
    if (this.pendingLogs.length === 0 || this.isSending || !this.token) return

    this.isSending = true
    const logsToSend = [...this.pendingLogs]
    this.pendingLogs = []

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      }

      for (const log of logsToSend) {
        try {
          const response = await fetch('/api/logs', {
            method: 'POST',
            headers,
            body: JSON.stringify(log),
          })

          if (!response.ok) {
            this.addPendingLog(log)
            // Add backoff delay to prevent spam
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        } catch (_error) {
          this.addPendingLog(log)
          // Add backoff delay to prevent spam
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } finally {
      this.isSending = false
    }
  }

  /**
   * Start interval to retry pending logs
   */
  startPendingLogInterval() {
    this.pendingLogInterval = setInterval(() => this.sendPendingLogs(), 30 * 1000) // Every 30 seconds
  }

  /**
   * Stop the pending log interval (cleanup on unmount)
   */
  stopPendingLogInterval() {
    if (this.pendingLogInterval) {
      clearInterval(this.pendingLogInterval)
      this.pendingLogInterval = null
    }
  }

  /**
   * Clear all pending logs (use cautiously)
   */
  clearPendingLogs() {
    localStorage.removeItem('pending_logs')
    this.pendingLogs = []
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      requestId: this.requestId,
      userId: this.userId,
      sessionDuration: Date.now() - this.sessionStartTime.getTime(),
      startTime: this.sessionStartTime.toISOString(),
      url: window.location.href,
    }
  }
}

// Create singleton instance
const loggerInstance = new Logger()

/**
 * Hook to use logger in React components
 */
export function useLogger() {
  // Cleanup interval when component unmounts
  useEffect(() => {
    return () => {
      loggerInstance.stopPendingLogInterval()
    }
  }, [])

  return {
    error: useCallback(
      (action, context, error) => loggerInstance.error(action, context, error),
      []
    ),
    warn: useCallback((action, context, error) => loggerInstance.warn(action, context, error), []),
    info: useCallback((action, context) => loggerInstance.info(action, context), []),
    debug: useCallback((action, context) => loggerInstance.debug(action, context), []),
    setUserId: useCallback(userId => loggerInstance.setUserId(userId), []),
    clearUserId: useCallback(() => loggerInstance.clearUserId(), []),
    getSessionInfo: useCallback(() => loggerInstance.getSessionInfo(), []),
    clearPendingLogs: useCallback(() => loggerInstance.clearPendingLogs(), []),
  }
}

/**
 * Standalone logger instance (for use outside React)
 */
export default loggerInstance
