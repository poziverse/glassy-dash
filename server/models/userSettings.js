/**
 * User Settings Model
 * Manages user-provided AI provider configurations
 */

const db = require('../db')
const nowISO = () => new Date().toISOString()

/**
 * Get user's provider settings
 * @param {number} userId - The user ID
 * @param {string} providerType - The provider type (gemini, zai, ollama)
 * @returns {Promise<Object>} - Provider settings
 */
async function getUserProviderSettings(userId, providerType) {
  const row = await db.prepare(`
    SELECT * FROM user_providers 
    WHERE user_id = ? AND provider_type = ? AND is_active = 1
  `).get(userId, providerType)
  
  if (!row) {
    return null
  }
  
  return {
    id: row.id,
    userId: row.user_id,
    providerType: row.provider_type,
    apiKey: '***', // Mask API key
    model: row.model,
    baseUrl: row.base_url,
    options: row.options ? JSON.parse(row.options) : {},
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Get all provider settings for a user
 * @param {number} userId - The user ID
 * @returns {Promise<Array>} - All provider settings
 */
async function getAllUserProviders(userId) {
  const rows = await db.prepare(`
    SELECT * FROM user_providers 
    WHERE user_id = ?
    ORDER BY is_active DESC, created_at ASC
  `).all(userId)
  
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    providerType: row.provider_type,
    apiKey: '***', // Mask API key
    model: row.model,
    baseUrl: row.base_url,
    options: row.options ? JSON.parse(row.options) : {},
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

/**
 * Add or update a user's provider configuration
 * @param {number} userId - The user ID
 * @param {Object} config - The provider configuration
 * @returns {Promise<Object>} - The created/updated provider settings
 */
async function setUserProvider(userId, config) {
  const { providerType, apiKey, model, baseUrl, options, isActive = true } = config
  
  // Validate required fields
  if (!providerType || !apiKey) {
    throw new Error('providerType and apiKey are required')
  }
  
  // Check if provider already exists for this user
  const existing = await db.prepare(`
    SELECT id FROM user_providers 
    WHERE user_id = ? AND provider_type = ?
  `).get(userId, providerType)
  
  const now = nowISO()
  
  if (existing) {
    // Update existing provider
    await db.prepare(`
      UPDATE user_providers 
      SET api_key = ?, model = ?, base_url = ?, options = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(apiKey, model || null, baseUrl || null, options ? JSON.stringify(options) : null, isActive ? 1 : 0, now, existing.id)
    
    console.log(`[UserSettings] Updated ${providerType} provider for user ${userId}`)
    
    return await getUserProviderSettings(userId, providerType)
  } else {
    // Insert new provider
    const info = await db.prepare(`
      INSERT INTO user_providers (user_id, provider_type, api_key, model, base_url, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, providerType, apiKey, model || null, baseUrl || null, isActive ? 1 : 0, now, now)
    
    console.log(`[UserSettings] Added ${providerType} provider for user ${userId}`)
    
    return await getUserProviderSettings(userId, providerType)
  }
}

/**
 * Remove a user's provider configuration
 * @param {number} userId - The user ID
 * @param {number} providerId - The provider ID
 * @returns {Promise<void>}
 */
async function removeUserProvider(userId, providerId) {
  const info = await db.prepare(`
    DELETE FROM user_providers 
    WHERE id = ? AND user_id = ?
  `).get(providerId, userId)
  
  if (!info) {
    throw new Error('Provider not found or does not belong to user')
  }
  
  await db.prepare(`DELETE FROM user_providers WHERE id = ?`).run(providerId)
  
  console.log(`[UserSettings] Removed provider ${providerId} for user ${userId}`)
}

/**
 * Set a specific provider as active (only one per type)
 * @param {number} userId - The user ID
 * @param {string} providerType - The provider type
 * @param {number} providerId - The provider ID
 * @returns {Promise<void>}
 */
async function setActiveProvider(userId, providerType, providerId) {
  const now = nowISO()
  
  // Deactivate all providers of this type for this user
  await db.prepare(`
    UPDATE user_providers 
    SET is_active = 0, updated_at = ?
    WHERE user_id = ? AND provider_type = ? AND id != ?
  `).run(userId, providerType, providerId, now)
  
  // Activate the specified provider
  await db.prepare(`
    UPDATE user_providers 
    SET is_active = 1, updated_at = ?
    WHERE id = ?
  `).run(providerId, now)
  
  console.log(`[UserSettings] Set ${providerType} provider ${providerId} as active for user ${userId}`)
}

/**
 * Get user's provider settings by key
 * @param {number} userId - The user ID
 * @param {string} settingsKey - The settings key
 * @returns {Promise<string>} - The settings value
 */
async function getUserSetting(userId, settingsKey) {
  const row = await db.prepare(`
    SELECT settings_value FROM user_provider_settings
    WHERE user_id = ? AND settings_key = ?
  `).get(userId, settingsKey)
  
  if (!row) {
    return null
  }
  
  return row.settings_value
}

/**
 * Set a user's provider setting
 * @param {number} userId - The user ID
 * @param {string} settingsKey - The settings key
 * @param {string} settingsValue - The settings value
 * @returns {Promise<void>}
 */
async function setUserSetting(userId, settingsKey, settingsValue) {
  const now = nowISO()
  
  const existing = await db.prepare(`
    SELECT id FROM user_provider_settings 
    WHERE user_id = ? AND settings_key = ?
  `).get(userId, settingsKey)
  
  if (existing) {
    // Update existing setting
    await db.prepare(`
      UPDATE user_provider_settings 
      SET settings_value = ?, updated_at = ?
      WHERE id = ?
    `).run(settingsValue, now, existing.id)
  } else {
    // Insert new setting
    await db.prepare(`
      INSERT INTO user_provider_settings (user_id, settings_key, settings_value, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, settingsKey, settingsValue, now, now)
  }
}

/**
 * Get all settings for a user
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} - All settings as key-value pairs
 */
async function getAllUserSettings(userId) {
  const rows = await db.prepare(`
    SELECT settings_key, settings_value FROM user_provider_settings 
    WHERE user_id = ?
  `).all(userId)
  
  const settings = {}
  for (const row of rows) {
    settings[row.settings_key] = row.settings_value
  }
  
  return settings
}

module.exports = {
  getUserProviderSettings,
  getAllUserProviders,
  setUserProvider,
  removeUserProvider,
  setActiveProvider,
  getUserSetting,
  setUserSetting,
  getAllUserSettings
}