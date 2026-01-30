/**
 * Music Service Routes
 * Provides proxy endpoints for self-hosted music streaming (CORS handling)
 */
const express = require('express')
const crypto = require('crypto')
const router = express.Router()

// Auth middleware (imported from parent)
const auth = (req, res, next) => {
  // This will be replaced when mounted - routes inherit auth from app
  next()
}

/**
 * POST /api/music/subsonic-auth
 * Generate Subsonic API authentication token (MD5-based)
 */
router.post('/subsonic-auth', async (req, res) => {
  const { password } = req.body

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required' })
  }

  // Generate random salt
  const salt = crypto.randomBytes(6).toString('hex')

  // Generate token: MD5(password + salt)
  const token = crypto
    .createHash('md5')
    .update(password + salt)
    .digest('hex')

  res.json({ token, salt })
})

/**
 * GET /api/music/stream
 * Proxy audio stream from music server (handles CORS + Range requests)
 */
router.get('/stream', async (req, res) => {
  const { url } = req.query
  const range = req.headers.range

  if (!url) {
    return res.status(400).json({ error: 'Stream URL is required' })
  }

  try {
    const headers = {
      'User-Agent': 'GlassyDash/1.0',
    }
    if (range) {
      headers['Range'] = range
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      // Forward upstream errors (e.g., 404, 416)
      return res.status(response.status).send(response.statusText)
    }

    // Forward important content headers
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')
    const contentRange = response.headers.get('content-range')
    const acceptRanges = response.headers.get('accept-ranges')

    if (contentType) res.set('Content-Type', contentType)
    if (contentLength) res.set('Content-Length', contentLength)
    if (contentRange) res.set('Content-Range', contentRange)
    if (acceptRanges) res.set('Accept-Ranges', acceptRanges)

    // Set 206 status if we are serving partial content
    if (response.status === 206) {
      res.status(206)
    }

    // Stream the audio data
    const { Readable } = require('stream')
    if (response.body && typeof response.body.pipe !== 'function') {
      Readable.fromWeb(response.body).pipe(res)
    } else {
      response.body.pipe(res)
    }
  } catch (error) {
    console.error('Music stream proxy error:', error.message)
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to proxy audio stream' })
    }
  }
})

/**
 * GET /api/music/cover
 * Proxy album cover art (handles CORS + caching)
 */
router.get('/cover', async (req, res) => {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Cover URL is required' })
  }

  try {
    const response = await fetch(url)

    if (!response.ok) {
      return res.status(404).json({ error: 'Cover art not found' })
    }

    const contentType = response.headers.get('content-type')
    if (contentType) res.set('Content-Type', contentType)

    // Cache cover art for 24 hours
    res.set('Cache-Control', 'public, max-age=86400')

    const { Readable } = require('stream')
    if (response.body && typeof response.body.pipe !== 'function') {
      Readable.fromWeb(response.body).pipe(res)
    } else {
      response.body.pipe(res)
    }
  } catch (error) {
    console.error('Cover art proxy error:', error.message)
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to fetch cover art' })
    }
  }
})

/**
 * ALL /api/music/proxy
 * Generic proxy for API calls (supports JSON and Text/Lyrics)
 * Now handles GET, POST, DELETE, etc.
 */
router.all('/proxy', async (req, res) => {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Target URL is required' })
  }

  try {
    const options = {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(url).host, // Explicitly set host to target
      },
    }

    // Remove headers that might confuse the upstream or are express-specific
    delete options.headers['content-length'] // Fetch calculates this
    delete options.headers['connection']
    delete options.headers['cookie'] // Don't forward cookies unless intended

    // Helper to detect if body content is present
    if (
      ['POST', 'PUT', 'PATCH'].includes(req.method) &&
      req.body &&
      Object.keys(req.body).length > 0
    ) {
      options.body = JSON.stringify(req.body)
      options.headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      // Forward upstream errors but consume body to avoid hangs
      const errText = await response.text().catch(() => '')
      return res
        .status(response.status)
        .json({ error: 'Upstream request failed', details: errText })
    }

    const contentType = response.headers.get('content-type')

    // Handle text responses (e.g., standard lyrics, raw text)
    if (
      contentType &&
      (contentType.includes('text/') || contentType.includes('application/x-subrip'))
    ) {
      const text = await response.text()
      // If it looks like JSON but has text/plain header, try to parse it (common in some APIs)
      try {
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
          return res.json(JSON.parse(text))
        }
      } catch (e) {
        // Not JSON, continue as text
      }
      return res.send(text)
    }

    // Default to JSON
    // If response is empty (204), don't try to parse JSON
    if (response.status === 204) {
      return res.status(204).send()
    }

    // Safety check for empty body
    const text = await response.text()
    try {
      const data = JSON.parse(text)
      res.json(data)
    } catch {
      // Fallback if not valid JSON
      res.send(text)
    }
  } catch (error) {
    console.error('Music API proxy error:', error.message)
    if (!res.headersSent) {
      res.status(502).json({ error: 'Failed to proxy request' })
    }
  }
})

/**
 * POST /api/music/test-connection
 * Test connection to a music server
 */
router.post('/test-connection', async (req, res) => {
  const { service, serverUrl, credentials } = req.body

  if (!service || !serverUrl) {
    return res.status(400).json({ error: 'Service and server URL required' })
  }

  try {
    // Build test URL based on service type
    let testUrl
    let headers = {}

    if (service === 'navidrome' || service === 'subsonic') {
      const { token, salt } = credentials || {}
      if (!token || !salt) {
        return res.status(400).json({ error: 'Token and salt required for Subsonic' })
      }
      testUrl = `${serverUrl}/rest/ping?t=${token}&s=${salt}&c=glassydash&v=1.16.1&f=json`
    } else if (service === 'jellyfin') {
      const { apiKey } = credentials || {}
      if (!apiKey) {
        return res.status(400).json({ error: 'API key required for Jellyfin' })
      }
      testUrl = `${serverUrl}/System/Info?api_key=${apiKey}`
    } else if (service === 'swingmusic') {
      // Swing Music typically uses Basic Auth or a simple ping if public, but for now we'll assumes it needs a token
      // Based on Swing Music docs, it might use Bearer token or just accessible.
      // For a generic check, we can try to hit the info endpoint.
      // NOTE: Actual Swing Music API auth might need adjustment once we have the connector.
      // Assuming it acts similarly to others or just check root/API
      testUrl = `${serverUrl}/api/helpers/system`
      // Swing music might not require auth for system info, or might use Bearer.
      // If credentials provided, use them.
    } else {
      return res.status(400).json({ error: 'Unsupported service type' })
    }

    const response = await fetch(testUrl, { headers })

    if (response.ok) {
      res.json({ ok: true, message: 'Connection successful' })
    } else {
      // Swing music might return 401
      res.status(401).json({ error: 'Authentication failed' })
    }
  } catch (error) {
    res.status(502).json({ error: 'Cannot connect to server' })
  }
})

module.exports = router
