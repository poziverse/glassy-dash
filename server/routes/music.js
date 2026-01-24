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
 * Proxy audio stream from music server (handles CORS)
 */
router.get('/stream', async (req, res) => {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Stream URL is required' })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GlassyDash/1.0',
      },
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch stream' })
    }

    // Forward content headers
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')

    if (contentType) res.set('Content-Type', contentType)
    if (contentLength) res.set('Content-Length', contentLength)
    res.set('Accept-Ranges', 'bytes')

    // Stream the audio data
    // Convert Web Stream to Node Readable for piping
    const { Readable } = require('stream')
    if (response.body && typeof response.body.pipe !== 'function') {
      Readable.fromWeb(response.body).pipe(res)
    } else {
      response.body.pipe(res)
    }
  } catch (error) {
    console.error('Music stream proxy error:', error.message)
    res.status(502).json({ error: 'Failed to proxy audio stream' })
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
    res.status(502).json({ error: 'Failed to fetch cover art' })
  }
})

/**
 * GET /api/music/proxy
 * Generic JSON proxy for API calls (Search, Browse, etc.) to avoid CORS
 */
router.get('/proxy', async (req, res) => {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Target URL is required' })
  }

  try {
    const response = await fetch(url)

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream request failed' })
    }

    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Music API proxy error:', error.message)
    res.status(502).json({ error: 'Failed to proxy request' })
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
    } else {
      return res.status(400).json({ error: 'Unsupported service type' })
    }

    const response = await fetch(testUrl)

    if (response.ok) {
      res.json({ ok: true, message: 'Connection successful' })
    } else {
      res.status(401).json({ error: 'Authentication failed' })
    }
  } catch (error) {
    res.status(502).json({ error: 'Cannot connect to server' })
  }
})

module.exports = router
