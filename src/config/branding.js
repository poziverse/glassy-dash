/**
 * GlassyDash Branding Configuration
 * ==================================
 * Single source of truth for all brand-related strings.
 * Import this file wherever branding is needed to ensure consistency.
 */

export const BRAND = {
  // Primary brand name
  name: 'GlassyDash',

  // Short name for compact displays
  shortName: 'GD',

  // Tagline / description
  description: 'Secure, real-time note-taking application',

  // localStorage key prefix (used by stores and persistence)
  storagePrefix: 'glassy-dash',

  // Version (synced from package.json at build time or hardcoded)
  version: '1.1.3',

  // URLs
  urls: {
    production: 'https://dash.0rel.com',
    github: 'https://github.com/poziverse/glassy-dash',
  },

  // Default admin credentials (for documentation purposes only)
  defaults: {
    adminUser: 'admin',
    adminPass: 'admin',
  },
}

/**
 * Helper to generate a prefixed localStorage key
 * @param {string} key - The key suffix
 * @returns {string} - The full prefixed key
 */
export const storageKey = key => `${BRAND.storagePrefix}-${key}`

export default BRAND
