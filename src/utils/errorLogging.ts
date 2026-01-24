/**
 * Error Logging Utility
 *
 * Provides centralized error logging with context information.
 * Integrates with error tracking services (Sentry, LogRocket, etc.).
 */

import type { ErrorContext } from '../types'

// ============================================================================
// ERROR TRACKING INTEGRATION
// ============================================================================

/**
 * Send error to tracking service (placeholder for Sentry, LogRocket, etc.)
 */
const sendToErrorTracking = (error: any, context?: any) => {
  // TODO: Integrate with error tracking service
  // Example: Sentry.captureException(error, { extra: context });
  // Example: LogRocket.captureException(error);

  if (process.env.NODE_ENV === 'production') {
    // In production, send to error tracking service
    console.warn('Error tracking service not configured:', error, context)
  }
}

// ============================================================================
// ERROR LOGGING FUNCTIONS
// ============================================================================

/**
 * Log error with context
 *
 * @param error - The error to log
 * @param context - Additional context information
 */
export const logError = (error: Error, context: Partial<ErrorContext> = {}): void => {
  const errorContext: ErrorContext = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context,
  }

  // Console error
  console.error('🔥 Error:', errorContext)

  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    sendToErrorTracking(error, errorContext)
  }
}

/**
 * Log API error
 *
 * @param response - Fetch response object
 * @param endpoint - API endpoint that failed
 */
export const logAPIError = (
  response: Response,
  endpoint: string,
  additionalContext?: any
): void => {
  const error = {
    status: response.status,
    statusText: response.statusText,
    endpoint,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  }

  console.error('🔥 API Error:', error)

  if (process.env.NODE_ENV === 'production') {
    sendToErrorTracking(new Error(`API Error: ${response.status} ${response.statusText}`), error)
  }
}

/**
 * Capture exception (alias for logError)
 *
 * @param exception - The exception to capture
 * @param extra - Additional information
 */
export const captureException = (exception: any, extra?: any): void => {
  const error = exception instanceof Error ? exception : new Error(String(exception))
  logError(error, extra)
}

/**
 * Capture message
 *
 * @param message - The message to capture
 * @param level - Log level (info, warning, error)
 */
export const captureMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void => {
  const log = {
    message,
    level,
    timestamp: new Date().toISOString(),
  }

  const method = level === 'warning' ? 'warn' : level
  console[method](log)

  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
    sendToErrorTracking(new Error(message), log)
  }
}

// ============================================================================
// PERFORMANCE LOGGING
// ============================================================================

/**
 * Log performance metric
 *
 * @param name - Metric name
 * @param duration - Duration in milliseconds
 * @param metadata - Additional metadata
 */
export const logPerformance = (name: string, duration: number, metadata?: any): void => {
  const metric = {
    name,
    duration,
    timestamp: new Date().toISOString(),
    ...metadata,
  }

  // Log slow operations
  if (duration > 1000) {
    console.warn('⏱️ Slow operation:', metric)
  } else {
    console.debug('⏱️ Performance:', metric)
  }

  // Send to performance monitoring in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to performance monitoring service
  }
}

// ============================================================================
// USER ACTION LOGGING
// ============================================================================

/**
 * Log user action
 *
 * @param action - Action name
 * @param details - Action details
 */
export const logUserAction = (action: string, details?: any): void => {
  const log = {
    action,
    timestamp: new Date().toISOString(),
    ...details,
  }

  console.debug('👤 User Action:', log)

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to analytics service
  }
}

// ============================================================================
// WARNING LOGGING
// ============================================================================

/**
 * Log warning
 *
 * @param message - Warning message
 * @param context - Additional context
 */
export const logWarning = (message: string, context?: any): void => {
  const log = {
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }

  console.warn('⚠️ Warning:', log)

  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service as warning
  }
}

// ============================================================================
// INFO LOGGING
// ============================================================================

/**
 * Log info message
 *
 * @param message - Info message
 * @param context - Additional context
 */
export const logInfo = (message: string, context?: any): void => {
  const log = {
    message,
    timestamp: new Date().toISOString(),
    ...context,
  }

  console.info('ℹ️ Info:', log)

  // Only send to tracking service in production for important info
  if (process.env.NODE_ENV === 'production' && context?.important) {
    sendToErrorTracking(new Error(message), log)
  }
}

// ============================================================================
// ERROR BOUNDARY LOGGING
// ============================================================================

/**
 * Log error boundary error
 *
 * @param error - Error that was caught
 * @param errorInfo - React error info
 * @param component - Component name where error occurred
 */
export const logErrorBoundary = (
  error: Error,
  errorInfo: React.ErrorInfo,
  component?: string
): void => {
  const context: ErrorContext = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack || undefined,
    errorBoundary: true,
    timestamp: new Date().toISOString(),
    route: window.location.pathname,
    component,
  }

  console.error('🔥 ErrorBoundary:', context)

  if (process.env.NODE_ENV === 'production') {
    sendToErrorTracking(error, context)
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default {
  logError,
  logAPIError,
  captureException,
  captureMessage,
  logPerformance,
  logUserAction,
  logWarning,
  logInfo,
  logErrorBoundary,
}
