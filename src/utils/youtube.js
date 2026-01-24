/**
 * YouTube URL Parser and Metadata Utilities
 * @module utils/youtube
 */

// Supported URL patterns for all YouTube formats
const YOUTUBE_PATTERNS = [
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
]

/**
 * Extract video ID from any YouTube URL format
 * @param {string} url - YouTube URL to parse
 * @returns {{ videoId: string, startTime: number } | null}
 */
export function parseYouTubeUrl(url) {
  if (!url || typeof url !== 'string') return null

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return {
        videoId: match[1],
        startTime: parseStartTime(url),
      }
    }
  }
  return null
}

/**
 * Parse timestamp from URL (?t=XXs or &t=XX)
 * @param {string} url - URL with possible timestamp
 * @returns {number} Start time in seconds
 */
function parseStartTime(url) {
  const timeMatch = url.match(/[?&]t=(\d+)s?/)
  return timeMatch ? parseInt(timeMatch[1], 10) : 0
}

/**
 * Generate thumbnail URLs in different qualities
 * @param {string} videoId - YouTube video ID
 * @returns {Object} Thumbnail URLs by quality
 */
export function getYouTubeThumbnails(videoId) {
  const base = `https://img.youtube.com/vi/${videoId}`
  return {
    default: `${base}/default.jpg`, // 120x90
    medium: `${base}/mqdefault.jpg`, // 320x180
    high: `${base}/hqdefault.jpg`, // 480x360
    standard: `${base}/sddefault.jpg`, // 640x480
    maxres: `${base}/maxresdefault.jpg`, // 1280x720
  }
}

/**
 * Generate embed URL with player options
 * @param {string} videoId - YouTube video ID
 * @param {Object} options - Player options
 * @returns {string} Embed URL
 */
export function getEmbedUrl(videoId, options = {}) {
  const params = new URLSearchParams({
    rel: '0', // No related videos
    modestbranding: '1', // Minimal YouTube branding
    ...(options.autoplay && { autoplay: '1' }),
    ...(options.muted && { mute: '1' }),
    ...(options.loop && { loop: '1', playlist: videoId }),
    ...(options.startTime && { start: String(options.startTime) }),
    ...(options.controls === false && { controls: '0' }),
  })
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`
}

/**
 * Validate if string is a valid YouTube URL
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isYouTubeUrl(url) {
  return parseYouTubeUrl(url) !== null
}

/**
 * Create default YouTube note content object
 * @param {string} videoId - Video ID
 * @param {string} url - Original URL
 * @param {Object} metadata - Video metadata from oEmbed
 * @returns {Object} YouTube note content
 */
export function createYouTubeNoteContent(videoId, url, metadata = {}) {
  return {
    videoId,
    url,
    title: metadata.title || 'YouTube Video',
    channelName: metadata.channelName || '',
    thumbnail: getYouTubeThumbnails(videoId).maxres,
    startTime: parseStartTime(url),
    embedSettings: {
      autoplay: false,
      controls: true,
      loop: false,
      muted: false,
    },
  }
}
