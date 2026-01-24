import { get, set, del, keys } from 'idb-keyval'

const STORE_PREFIX = 'custom_bg_'

/**
 * Save a custom background file to IndexedDB
 * @param {File} file - The image file to save
 * @returns {Promise<string>} - The unique ID of the saved image
 */
export async function saveCustomBackground(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Please upload an image.')
  }

  // 5MB limit
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds 5MB limit.')
  }

  const id = crypto.randomUUID()
  const key = `${STORE_PREFIX}${id}`

  await set(key, file)
  return id
}

/**
 * Get a custom background blob from IndexedDB
 * @param {string} id - The ID of the image
 * @returns {Promise<Blob|null>}
 */
export async function getCustomBackground(id) {
  const key = `${STORE_PREFIX}${id}`
  return await get(key)
}

/**
 * Delete a custom background from IndexedDB
 * @param {string} id - The ID of the image
 */
export async function deleteCustomBackground(id) {
  const key = `${STORE_PREFIX}${id}`
  await del(key)
}

/**
 * Get all stored custom background IDs
 * @returns {Promise<string[]>}
 */
export async function getAllCustomBackgroundIds() {
  const allKeys = await keys()
  return allKeys
    .filter(k => typeof k === 'string' && k.startsWith(STORE_PREFIX))
    .map(k => k.replace(STORE_PREFIX, ''))
}

/**
 * Clear all custom backgrounds
 */
export async function clearAllCustomBackgrounds() {
  const ids = await getAllCustomBackgroundIds()
  await Promise.all(ids.map(deleteCustomBackground))
}
