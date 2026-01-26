/**
 * IndexedDB Audio Storage Utility
 * Stores large audio files efficiently outside of localStorage
 * Supports files up to 60+ minutes in length
 */

const DB_NAME = 'GlassyVoiceDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioFiles';

let db = null;

/**
 * Initialize IndexedDB database
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB initialized successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store for audio files
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Create indexes for efficient querying
        store.createIndex('recordingId', 'recordingId', { unique: true });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('size', 'size', { unique: false });
      }
    };
  });
}

/**
 * Store audio blob in IndexedDB
 * @param {string} recordingId - Associated recording ID
 * @param {Blob} audioBlob - Audio data blob
 * @param {object} metadata - Optional metadata (duration, format, etc.)
 * @returns {Promise<string>} - Stored audio ID
 */
export async function storeAudio(recordingId, audioBlob, metadata = {}) {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const audioRecord = {
      id: crypto.randomUUID(),
      recordingId,
      audioBlob,
      size: audioBlob.size,
      format: metadata.format || 'webm',
      duration: metadata.duration || 0,
      createdAt: new Date().toISOString(),
      ...metadata,
    };

    const request = store.add(audioRecord);

    request.onsuccess = () => {
      console.log(`Audio stored: ${audioRecord.id} (${formatBytes(audioBlob.size)})`);
      resolve(audioRecord.id);
    };

    request.onerror = () => {
      console.error('Error storing audio:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Retrieve audio blob from IndexedDB
 * @param {string} audioId - Audio record ID
 * @returns {Promise<Blob|null>} - Audio blob or null if not found
 */
export async function getAudio(audioId) {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(audioId);

    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        resolve(result.audioBlob);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error('Error retrieving audio:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Retrieve audio by recording ID
 * @param {string} recordingId - Recording ID
 * @returns {Promise<Blob|null>} - Audio blob or null if not found
 */
export async function getAudioByRecordingId(recordingId) {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('recordingId');
    const request = index.get(recordingId);

    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        resolve(result.audioBlob);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error('Error retrieving audio by recording ID:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Update audio record metadata
 * @param {string} audioId - Audio record ID
 * @param {object} updates - Metadata updates
 * @returns {Promise<void>}
 */
export async function updateAudioMetadata(audioId, updates) {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(audioId);

    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (record) {
        const updatedRecord = { ...record, ...updates };
        const updateRequest = store.put(updatedRecord);

        updateRequest.onsuccess = () => {
          console.log(`Audio metadata updated: ${audioId}`);
          resolve();
        };

        updateRequest.onerror = () => {
          console.error('Error updating audio metadata:', updateRequest.error);
          reject(updateRequest.error);
        };
      } else {
        reject(new Error('Audio record not found'));
      }
    };

    getRequest.onerror = () => {
      console.error('Error getting audio record:', getRequest.error);
      reject(getRequest.error);
    };
  });
}

/**
 * Delete audio from IndexedDB
 * @param {string} audioId - Audio record ID
 * @returns {Promise<void>}
 */
export async function deleteAudio(audioId) {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(audioId);

    request.onsuccess = () => {
      console.log(`Audio deleted: ${audioId}`);
      resolve();
    };

    request.onerror = () => {
      console.error('Error deleting audio:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Delete audio by recording ID
 * @param {string} recordingId - Recording ID
 * @returns {Promise<void>}
 */
export async function deleteAudioByRecordingId(recordingId) {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('recordingId');
    const request = index.get(recordingId);

    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        const deleteRequest = store.delete(result.id);
        deleteRequest.onsuccess = () => {
          console.log(`Audio deleted by recording ID: ${recordingId}`);
          resolve();
        };

        deleteRequest.onerror = () => {
          console.error('Error deleting audio:', deleteRequest.error);
          reject(deleteRequest.error);
        };
      } else {
        resolve();
      }
    };

    request.onerror = () => {
      console.error('Error getting audio by recording ID:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all audio records
 * @returns {Promise<Array>} - Array of audio records
 */
export async function getAllAudioRecords() {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('Error getting all audio records:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get storage usage statistics
 * @returns {Promise<object>} - Storage usage stats
 */
export async function getStorageStats() {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const records = request.result;
      const totalSize = records.reduce((sum, record) => sum + record.size, 0);
      const count = records.length;

      resolve({
        count,
        totalSize,
        formattedSize: formatBytes(totalSize),
        averageSize: count > 0 ? totalSize / count : 0,
      });
    };

    request.onerror = () => {
      console.error('Error getting storage stats:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Clear all audio records from IndexedDB
 * @returns {Promise<void>}
 */
export async function clearAllAudio() {
  if (!db) {
    await initDB();
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('All audio cleared from IndexedDB');
      resolve();
    };

    request.onerror = () => {
      console.error('Error clearing all audio:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Export audio as base64 (for compatibility with existing code)
 * @param {Blob} audioBlob - Audio blob
 * @returns {Promise<string>} - Base64 encoded string
 */
export async function blobToBase64(audioBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result.split(',')[1];
      resolve(base64data);
    };
    reader.onerror = () => {
      console.error('Error converting blob to base64:', reader.error);
      reject(reader.error);
    };
    reader.readAsDataURL(audioBlob);
  });
}

/**
 * Convert base64 to blob
 * @param {string} base64 - Base64 encoded string
 * @param {string} mimeType - MIME type
 * @returns {Blob} - Audio blob
 */
export function base64ToBlob(base64, mimeType = 'audio/webm') {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  const sliceSize = 512;
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
}