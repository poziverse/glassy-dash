import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { MUSIC_SERVICES } from '../src/lib/musicServices.js'

describe('Jellyfin Connector', () => {
  const originalFetch = global.fetch

  beforeAll(() => {
    // Mock Fetch specific for this test suite
    global.fetch = vi.fn().mockImplementation(async url => {
      // console.log(`[MOCK FETCH] ${url}`, options)
      if (url.includes('/api/music/proxy')) {
        const targetUrl = decodeURIComponent(url.split('url=')[1])
        if (targetUrl.includes('Audio') && targetUrl.includes('Lyrics')) {
          return {
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => ({
              Lyrics: [{ Start: 0, Text: 'Test Lyric' }],
            }),
          }
        }
        if (targetUrl.includes('Sessions')) {
          return {
            ok: true,
            json: async () => [
              { Id: 's1', Name: 'TV', Capabilities: { SupportsPersistentIdentifier: true } },
            ],
          }
        }
      }
      return { ok: true, json: async () => ({}) }
    })
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('should generate correct stream URL', () => {
    const jellyfin = MUSIC_SERVICES.jellyfin
    const serverUrl = 'http://jellyfin.local'
    const creds = { apiKey: '123' }

    const streamUrl = jellyfin.getStreamUrl(serverUrl, 'item1', creds)
    expect(streamUrl).toContain('/Audio/item1/universal')
    expect(streamUrl).toContain('api_key=123')
  })

  it('should generate correct cover art URL', () => {
    const jellyfin = MUSIC_SERVICES.jellyfin
    const serverUrl = 'http://jellyfin.local'
    const creds = { apiKey: '123' }

    const coverUrl = jellyfin.getCoverArt(serverUrl, 'item1', creds)
    expect(coverUrl).toContain('/Items/item1/Images/Primary')
  })

  it('should parse lyrics correctly', async () => {
    const jellyfin = MUSIC_SERVICES.jellyfin
    const serverUrl = 'http://jellyfin.local'
    const creds = { apiKey: '123' }

    const lyrics = await jellyfin.getLyrics(serverUrl, 'item1', creds)
    expect(lyrics).toContain('[00:00.00]Test Lyric')
  })

  it('should fetch casting sessions', async () => {
    const jellyfin = MUSIC_SERVICES.jellyfin
    const serverUrl = 'http://jellyfin.local'
    const creds = { apiKey: '123' }

    const sessions = await jellyfin.getSessions(serverUrl, creds)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].Id).toBe('s1')
  })
})
