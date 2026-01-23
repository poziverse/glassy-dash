/**
 * LocalStorage Utility
 * 
 * Provides consistent, namespaced localStorage access with error handling
 */

const STORAGE_PREFIX = 'GLASSYDASH_';

/**
 * Storage utility with namespace prefix and error handling
 */
export const storage = {
  /**
   * Get item from localStorage
   * 
   * @param {string} key - Storage key (without prefix)
   * @param {any} defaultValue - Default value if key doesn't exist or parse fails
   * @returns {any} Parsed value or defaultValue
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (item === null || item === undefined) {
        return defaultValue;
      }
      return JSON.parse(item);
    } catch (e) {
      console.error(`Storage get failed for key "${key}":`, e);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage
   * 
   * @param {string} key - Storage key (without prefix)
   * @param {any} value - Value to store (will be JSON.stringify'd)
   * @returns {boolean} Success status
   */
  set(key, value) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Storage set failed for key "${key}":`, e);
      return false;
    }
  },

  /**
   * Remove item from localStorage
   * 
   * @param {string} key - Storage key (without prefix)
   * @returns {boolean} Success status
   */
  remove(key) {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return true;
    } catch (e) {
      console.error(`Storage remove failed for key "${key}":`, e);
      return false;
    }
  },

  /**
   * Clear all GlassKeep items from localStorage
   * 
   * @returns {boolean} Success status
   */
  clear() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (e) {
      console.error('Storage clear failed:', e);
      return false;
    }
  },

  /**
   * Check if item exists in localStorage
   * 
   * @param {string} key - Storage key (without prefix)
   * @returns {boolean} True if key exists
   */
  has(key) {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return item !== null && item !== undefined;
    } catch (e) {
      console.error(`Storage has check failed for key "${key}":`, e);
      return false;
    }
  },

  /**
   * Get all GlassKeep storage keys
   * 
   * @returns {string[]} Array of keys (with prefix)
   */
  keys() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keys.push(key);
        }
      }
      return keys;
    } catch (e) {
      console.error('Storage keys retrieval failed:', e);
      return [];
    }
  },

  /**
   * Get approximate size of stored data
   * 
   * @returns {number} Size in bytes
   */
  getSize() {
    try {
      let size = 0;
      const keys = this.keys();
      keys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          size += key.length + item.length;
        }
      });
      return size;
    } catch (e) {
      console.error('Storage size calculation failed:', e);
      return 0;
    }
  },

  /**
   * Format size in human-readable format
   * 
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size (e.g., "1.5 MB")
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};

export default storage;