/**
 * Retry an async operation with exponential backoff
 * @param {Function} operation - The async operation to retry
 * @param {Object} options - Retry configuration
 * @returns {Promise} - Result of the operation
 */
export async function retryOperation(operation, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    onRetry = null
  } = options

  let lastError

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // If this was the last attempt, throw the error
      if (i === maxRetries - 1) {
        throw lastError
      }

      // Exponential backoff: delay * 2^attempt
      const waitTime = delay * Math.pow(2, i)

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(i + 1, error, waitTime)
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError
}