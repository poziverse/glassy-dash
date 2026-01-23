/**
 * Callback Helper Utilities
 * 
 * Provides type-safe callback invocation with error handling
 */

/**
 * Safely invoke a callback function
 * 
 * @param {Function|any} callback - The callback to invoke
 * @param {...any} args - Arguments to pass to the callback
 * @returns {any} Result of callback execution, or undefined if invalid
 */
export function safeCallback(callback, ...args) {
  if (typeof callback === 'function') {
    try {
      return callback(...args);
    } catch (error) {
      console.error('[safeCallback] Callback execution failed:', error);
      throw error; // Re-throw for error boundaries to catch
    }
  } else {
    console.warn('[safeCallback] Expected function, got:', typeof callback, callback);
    return undefined;
  }
}

/**
 * Safely invoke an async callback
 * 
 * @param {Function|any} callback - The async callback to invoke
 * @param {...any} args - Arguments to pass to the callback
 * @returns {Promise<any>} Promise that resolves with callback result or rejects with error
 */
export async function safeAsyncCallback(callback, ...args) {
  if (typeof callback === 'function') {
    try {
      return await callback(...args);
    } catch (error) {
      console.error('[safeAsyncCallback] Async callback execution failed:', error);
      throw error;
    }
  } else {
    console.warn('[safeAsyncCallback] Expected function, got:', typeof callback, callback);
    return Promise.reject(new TypeError('Callback is not a function'));
  }
}

/**
 * Safely invoke a callback with a default return value
 * 
 * @param {Function|any} callback - The callback to invoke
 * @param {any} defaultValue - Value to return if callback is invalid
 * @param {...any} args - Arguments to pass to the callback
 * @returns {any} Result of callback or defaultValue
 */
export function safeCallbackWithDefault(callback, defaultValue, ...args) {
  if (typeof callback === 'function') {
    try {
      return callback(...args);
    } catch (error) {
      console.error('[safeCallbackWithDefault] Callback execution failed:', error);
      return defaultValue;
    }
  } else {
    return defaultValue;
  }
}

/**
 * Create a debounced version of a callback
 * 
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(callback, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      safeCallback(callback, ...args);
    }, delay);
  };
}

/**
 * Create a throttled version of a callback
 * 
 * @param {Function} callback - Function to throttle
 * @param {number} limit - Minimum time between executions in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(callback, limit = 100) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      safeCallback(callback, ...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Create a memoized version of a callback
 * Useful for preventing unnecessary re-renders when passing callbacks to children
 * 
 * @param {Function} callback - Function to memoize
 * @returns {Function} Memoized function
 */
export function memoize(callback) {
  let lastArgs = [];
  let lastResult;
  
  return function (...args) {
    if (args.length !== lastArgs.length || args.some((arg, i) => arg !== lastArgs[i])) {
      lastArgs = args;
      lastResult = safeCallback(callback, ...args);
    }
    return lastResult;
  };
}

export default safeCallback;