/**
 * YouTube and Music Integration Tests
 * Tests for new notecard types
 */
import { describe, it, expect, vi } from 'vitest'
import { parseYouTubeUrl, getYouTubeThumbnails, getEmbedUrl, isYouTubeUrl } from '../utils/youtube'
import {
  getServiceConnector,
  getAvailableServices,
  createMusicNoteContent,
} from '../lib/musicServices'

// ... existing tests ...

describe('Music Note Creation', () => {
  it('should create content for single track', () => {
    const track = { id: '1', title: 'Song' }
    const content = createMusicNoteContent('srv', 'url', {}, track, 'track')
    expect(content.type).toBe('track')
    expect(content.data).toEqual(track)
    expect(content.service).toBe('srv')
  })

  it('should create content for album', () => {
    const album = { id: 'a1', title: 'Album' }
    const content = createMusicNoteContent('srv', 'url', {}, album, 'album')
    expect(content.type).toBe('album')
    expect(content.data).toEqual(album)
  })

  it('should default to track type', () => {
    const track = { id: '1' }
    const content = createMusicNoteContent('srv', 'url', {}, track)
    expect(content.type).toBe('track')
  })
})

describe('YouTube URL Parser', () => {
  it('should parse standard YouTube URLs', () => {
    const result = parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      startTime: 0,
    })
  })

  it('should parse youtu.be short URLs', () => {
    const result = parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')
    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      startTime: 0,
    })
  })

  it('should parse YouTube shorts URLs', () => {
    const result = parseYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ')
    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      startTime: 0,
    })
  })

  it('should parse timestamp from URL', () => {
    const result = parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42')
    expect(result).toEqual({
      videoId: 'dQw4w9WgXcQ',
      startTime: 42,
    })
  })

  it('should return null for invalid URLs', () => {
    expect(parseYouTubeUrl('https://example.com')).toBeNull()
    expect(parseYouTubeUrl('not a url')).toBeNull()
    expect(parseYouTubeUrl('')).toBeNull()
    expect(parseYouTubeUrl(null)).toBeNull()
  })

  it('should validate YouTube URLs', () => {
    expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    expect(isYouTubeUrl('https://example.com')).toBe(false)
  })
})

describe('YouTube Thumbnails', () => {
  it('should generate thumbnail URLs', () => {
    const thumbnails = getYouTubeThumbnails('dQw4w9WgXcQ')

    expect(thumbnails.default).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg')
    expect(thumbnails.high).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    expect(thumbnails.maxres).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg')
  })
})

describe('YouTube Embed URL', () => {
  it('should generate basic embed URL', () => {
    const url = getEmbedUrl('dQw4w9WgXcQ')
    expect(url).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(url).toContain('rel=0')
    expect(url).toContain('modestbranding=1')
  })

  it('should include autoplay option', () => {
    const url = getEmbedUrl('dQw4w9WgXcQ', { autoplay: true })
    expect(url).toContain('autoplay=1')
  })

  it('should include start time', () => {
    const url = getEmbedUrl('dQw4w9WgXcQ', { startTime: 42 })
    expect(url).toContain('start=42')
  })

  it('should include loop option', () => {
    const url = getEmbedUrl('dQw4w9WgXcQ', { loop: true })
    expect(url).toContain('loop=1')
    expect(url).toContain('playlist=dQw4w9WgXcQ')
  })
})

describe('Music Service Connectors', () => {
  it('should get Navidrome connector', () => {
    const connector = getServiceConnector('navidrome')
    expect(connector).toBeDefined()
    expect(connector.name).toBe('Navidrome')
    expect(connector.authType).toBe('subsonic')
  })

  it('should get Jellyfin connector', () => {
    const connector = getServiceConnector('jellyfin')
    expect(connector).toBeDefined()
    expect(connector.name).toBe('Jellyfin')
    expect(connector.authType).toBe('apikey')
  })

  it('should return null for unknown service', () => {
    const connector = getServiceConnector('unknown')
    expect(connector).toBeNull()
  })

  it('should list available services', () => {
    const services = getAvailableServices()
    expect(services.length).toBeGreaterThan(0)
    expect(services[0]).toHaveProperty('id')
    expect(services[0]).toHaveProperty('name')
    expect(services[0]).toHaveProperty('icon')
  })
})

describe('Music Service URLs', () => {
  it('should generate Navidrome stream URL', () => {
    const connector = getServiceConnector('navidrome')
    const url = connector.getStreamUrl('https://music.example.com', 'track123', {
      token: 'abc',
      salt: 'xyz',
    })

    expect(url).toContain('music.example.com/rest/stream')
    expect(url).toContain('id=track123')
    expect(url).toContain('t=abc')
    expect(url).toContain('s=xyz')
  })

  it('should generate Jellyfin stream URL', () => {
    const connector = getServiceConnector('jellyfin')
    const url = connector.getStreamUrl('https://media.example.com', 'item456', { apiKey: 'key123' })

    expect(url).toContain('media.example.com/Audio/item456/universal')
    expect(url).toContain('api_key=key123')
  })
})
