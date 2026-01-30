/**
 * Safe Markdown Parser
 *
 * Provides XSS-safe markdown parsing using marked.js with DOMPurify sanitization
 */

import DOMPurify from 'dompurify'
import { marked } from 'marked'

// Configure marked options
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
})

/**
 * Configure DOMPurify with safe HTML tags and attributes
 * Only allows basic formatting tags, no scripts, styles, or dangerous attributes
 */
DOMPurify.addHook('uponSanitizeAttribute', function (node, data) {
  // Allow safe protocols for href
  if (data.attrName === 'href') {
    if (!/^https?:/.test(data.attrValue) && !/^mailto:/.test(data.attrValue)) {
      data.attrValue = '' // Remove unsafe links
    }
  }

  // Remove all event handlers
  if (data.attrName.startsWith('on')) {
    data.attrValue = ''
  }
})

/**
 * Parse markdown content safely with XSS protection
 *
 * @param {string} content - Markdown content to parse
 * @param {Object} options - Optional parsing options
 * @param {boolean} options.allowLinks - Allow links (default: true)
 * @param {boolean} options.allowImages - Allow images (default: false)
 * @returns {string} Sanitized HTML string
 */
export function safeMarkdown(content = '', options = {}) {
  const { allowLinks = true, allowImages = false } = options

  // Parse markdown to HTML
  let html = marked.parse(content || '')

  // Configure DOMPurify based on options
  const sanitizeConfig = {
    ALLOWED_TAGS: [
      'b',
      'i',
      'u',
      'em',
      'strong',
      'a',
      'p',
      'br',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
      'hr',
      'del',
      's',
      'strike',
      'span',
      'sub',
      'sup', // Extended formatting
    ],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  }

  if (allowLinks) {
    sanitizeConfig.ALLOWED_TAGS.push('a')
    sanitizeConfig.ALLOWED_ATTR.push('href', 'title')
  }

  if (allowImages) {
    sanitizeConfig.ALLOWED_TAGS.push('img')
    sanitizeConfig.ALLOWED_ATTR.push('src', 'alt', 'width', 'height', 'loading')
  }

  // Sanitize HTML
  return DOMPurify.sanitize(html, sanitizeConfig)
}

/**
 * Parse markdown for AI responses with stricter security
 * AI-generated content should be treated with extra caution
 *
 * @param {string} content - AI-generated markdown content
 * @returns {string} Sanitized HTML string
 */
export function safeAiMarkdown(content = '') {
  return safeMarkdown(content, {
    allowLinks: true,
    allowImages: false, // Don't allow AI to embed images
  })
}

/**
 * Parse markdown for user-generated content (notes, etc.)
 *
 * @param {string} content - User-generated markdown content
 * @returns {string} Sanitized HTML string
 */
export function safeUserMarkdown(content = '') {
  return safeMarkdown(content, {
    allowLinks: true,
    allowImages: true, // Allow users to embed images
  })
}

export default safeMarkdown
