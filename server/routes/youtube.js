/**
 * YouTube Routes
 * Provides metadata proxy for YouTube videos (avoids CORS issues)
 */
const express = require('express')
const router = express.Router()

/**
 * GET /api/youtube/metadata/:videoId
 * Fetches video metadata using YouTube oEmbed API
 * No API key required
 */
router.get('/metadata/:videoId', async (req, res) => {
  const { videoId } = req.params

  // Validate video ID format (11 characters, alphanumeric + _ -)
  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid video ID format' })
  }

  try {
    // Use YouTube oEmbed API (no API key required)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const response = await fetch(oembedUrl)

    if (!response.ok) {
      return res.status(404).json({ error: 'Video not found or unavailable' })
    }

    const data = await response.json()

    res.json({
      videoId,
      title: data.title,
      channelName: data.author_name,
      channelUrl: data.author_url,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      thumbnailFallback: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      width: data.width,
      height: data.height,
    })
  } catch (error) {
    console.error('YouTube metadata fetch error:', error.message)
    res.status(500).json({ error: 'Failed to fetch video metadata' })
  }
})

module.exports = router
