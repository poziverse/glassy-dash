/**
 * Music Service Connectors
 * Unified interface for self-hosted music streaming services
 * Supports: Navidrome, Jellyfin, Subsonic, Ampache
 */

// Available music streaming services
export const MUSIC_SERVICES = {
  navidrome: {
    name: 'Navidrome',
    icon: '🎵',
    description: 'Modern music server with Subsonic API',
    authType: 'subsonic',

    /**
     * Generate stream URL for a track
     */
    getStreamUrl(serverUrl, trackId, { token, salt }) {
      const params = new URLSearchParams({
        id: trackId,
        t: token,
        s: salt,
        c: 'glassydash',
        v: '1.16.1',
        f: 'json',
      })
      return `${serverUrl}/rest/stream?${params}`
    },

    /**
     * Get cover art URL for an album/track
     */
    getCoverArt(serverUrl, coverArtId, { token, salt }, size = 300) {
      const params = new URLSearchParams({
        id: coverArtId,
        size: String(size),
        t: token,
        s: salt,
        c: 'glassydash',
        v: '1.16.1',
      })
      return `${serverUrl}/rest/getCoverArt?${params}`
    },

    /**
     * Search for tracks
     */
    async search(serverUrl, query, { token, salt }) {
      const params = new URLSearchParams({
        query,
        t: token,
        s: salt,
        c: 'glassydash',
        v: '1.16.1',
        f: 'json',
      })
      const targetUrl = `${serverUrl}/rest/search3?${params}`
      const res = await fetch(`/api/music/proxy?url=${encodeURIComponent(targetUrl)}`)
      const data = await res.json()
      const result = data['subsonic-response']?.searchResult3

      return {
        songs: result?.song || [],
        albums: (result?.album || []).map(a => ({
          id: a.id,
          title: a.name,
          artist: a.artist,
          coverArt: a.coverArt,
          year: a.year,
        })),
      }
    },

    /**
     * Get tracks for an album
     */
    async getAlbumTracks(serverUrl, albumId, { token, salt }) {
      const params = new URLSearchParams({
        id: albumId,
        t: token,
        s: salt,
        c: 'glassydash',
        v: '1.16.1',
        f: 'json',
      })
      const targetUrl = `${serverUrl}/rest/getAlbum?${params}`
      const res = await fetch(`/api/music/proxy?url=${encodeURIComponent(targetUrl)}`)
      const data = await res.json()
      const songs = data['subsonic-response']?.album?.song || []

      return songs.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        albumId: song.albumId,
        duration: song.duration || 0,
        coverArt: song.coverArt,
      }))
    },

    /**
     * Get lyrics for a song (Subsonic)
     */
    async getLyrics(serverUrl, songId, { token, salt }) {
      const params = new URLSearchParams({
        id: songId,
        t: token,
        s: salt,
        c: 'glassydash',
        v: '1.16.1',
        f: 'json',
      })
      const targetUrl = `${serverUrl}/rest/getLyrics?${params}`
      try {
        const res = await fetch(`/api/music/proxy?url=${encodeURIComponent(targetUrl)}`)
        // Subsonic returns JSON with lyrics inside
        const data = await res.json()
        const lyrics = data['subsonic-response']?.lyrics?.value
        // If it's structured lyrics (LRC), Subsonic might return it as text or inside data
        // If simple text, return it.
        return lyrics || null
      } catch (e) {
        return null
      }
    },
  },

  jellyfin: {
    // ... (lines 65-77 unchanged)
    name: 'Jellyfin',
    icon: '🎬',
    description: 'Free Software Media System',
    authType: 'apikey',

    getStreamUrl(serverUrl, itemId, { apiKey }) {
      return `${serverUrl}/Audio/${itemId}/universal?api_key=${apiKey}&audioCodec=mp3`
    },

    getCoverArt(serverUrl, itemId, { apiKey }) {
      return `${serverUrl}/Items/${itemId}/Images/Primary?api_key=${apiKey}`
    },

    async search(serverUrl, query, { apiKey, userId }) {
      const params = new URLSearchParams({
        searchTerm: query,
        IncludeItemTypes: 'Audio,MusicAlbum',
        recursive: 'true',
        api_key: apiKey,
      })
      const targetUrl = `${serverUrl}/Users/${userId}/Items?${params}`
      const res = await fetch(`/api/music/proxy?url=${encodeURIComponent(targetUrl)}`)
      const data = await res.json()

      const items = data.Items || []
      const songs = []
      const albums = []

      items.forEach(item => {
        if (item.Type === 'Audio') {
          songs.push({
            id: item.Id,
            title: item.Name,
            artist: item.Artists?.[0] || 'Unknown Artist',
            album: item.Album || 'Unknown Album',
            albumId: item.AlbumId,
            duration: Math.floor((item.RunTimeTicks || 0) / 10000000),
          })
        } else if (item.Type === 'MusicAlbum') {
          albums.push({
            id: item.Id,
            title: item.Name,
            artist: item.AlbumArtist || 'Unknown Artist',
            coverArt: item.Id, // Jellyfin uses ID for cover
            year: item.ProductionYear,
          })
        }
      })

      return { songs, albums }
    },

    async getAlbumTracks(serverUrl, albumId, { apiKey, userId }) {
      const params = new URLSearchParams({
        ParentId: albumId,
        IncludeItemTypes: 'Audio',
        recursive: 'true',
        api_key: apiKey,
        SortBy: 'IndexNumber', // Sort by track number
      })
      const targetUrl = `${serverUrl}/Users/${userId}/Items?${params}`
      const res = await fetch(`/api/music/proxy?url=${encodeURIComponent(targetUrl)}`)
      const data = await res.json()

      return (data.Items || []).map(item => ({
        id: item.Id,
        title: item.Name,
        artist: item.Artists?.[0] || 'Unknown Artist',
        album: item.Album || 'Unknown Album',
        albumId: item.AlbumId,
        duration: Math.floor((item.RunTimeTicks || 0) / 10000000),
      }))
    },

    async getLyrics(serverUrl, songId, { apiKey }) {
      // 1. Try standard Lyric endpoint (10.9+)
      // Note: Endpoint might be /Audio/{Id}/Lyrics or similar. 3rd party plugins inject it differently.
      // Based on research, commonly it is GET /Audio/{ItemId}/Lyrics if native or via plugin.

      const tryEndpoints = [
        `${serverUrl}/Audio/${songId}/Lyrics?api_key=${apiKey}`,
        `${serverUrl}/Items/${songId}/Lyrics?api_key=${apiKey}`, // Potential variant
      ]

      for (const url of tryEndpoints) {
        try {
          const res = await fetch(`/api/music/proxy?url=${encodeURIComponent(url)}`)
          if (res.ok) {
            // Might return Lyrics object or text
            const contentType = res.headers.get('content-type')
            if (contentType && contentType.includes('json')) {
              const data = await res.json()
              // Common format: { Lyrics: [{Text, Start}], Metadata: {} } or raw text
              if (Array.isArray(data.Lyrics)) {
                // Convert to LRC string for our player
                return data.Lyrics.map(l => {
                  const min = Math.floor(l.Start / 600000000)
                  const sec = ((l.Start % 600000000) / 10000000).toFixed(2)
                  return `[${String(min).padStart(2, '0')}:${String(sec).padStart(5, '0')}]${l.Text}`
                }).join('\n')
              }
            } else {
              // Assume raw LRC/Text
              return await res.text()
            }
          }
        } catch (e) {}
      }
      return null
    },

    /**
     * Get available Cast Sessions (Remote Control)
     */
    async getSessions(serverUrl, { apiKey }) {
      const targetUrl = `${serverUrl}/Sessions?api_key=${apiKey}`
      try {
        const res = await fetch(`/api/music/proxy?url=${encodeURIComponent(targetUrl)}`)
        const data = await res.json()
        // Filter for controllable clients that are NOT us
        return data.filter(s => s.Capabilities && s.Capabilities.SupportsPersistentIdentifier)
      } catch (e) {
        console.error('Failed to get sessions', e)
        return []
      }
    },

    /**
     * Send Cast Command
     */
    async castCommand(serverUrl, sessionId, command, payload = {}, { apiKey }) {
      let endpoint = ''
      if (command === 'Play') {
        // Play specific item
        // payload: { ItemIds: [], StartPositionTicks: 0 }
        const query = new URLSearchParams({
          api_key: apiKey,
          ItemIds: payload.ItemIds.join(','),
          StartPositionTicks: 0,
          PlayCommand: 'PlayNow',
        })
        endpoint = `${serverUrl}/Sessions/${sessionId}/Playing?${query}`
      } else if (command === 'Pause' || command === 'Unpause') {
        endpoint = `${serverUrl}/Sessions/${sessionId}/Playing/${command}?api_key=${apiKey}`
      } else if (command === 'Stop') {
        endpoint = `${serverUrl}/Sessions/${sessionId}/Playing/Stop?api_key=${apiKey}`
      } else if (command === 'NextTrack') {
        endpoint = `${serverUrl}/Sessions/${sessionId}/Playing/NextTrack?api_key=${apiKey}`
      }

      if (endpoint) {
        // We use POST via our updated proxy
        // Some commands are POST with empty body, others might need body.
        // Jellyfin commands often just need query params but use POST method.
        await fetch(`/api/music/proxy?url=${encodeURIComponent(endpoint)}`, {
          method: 'POST',
        })
      }
    },
  },

  swingmusic: {
    name: 'Swing Music',
    icon: '🎷',
    description: 'Self-hosted music (Native API)',
    authType: 'swingmusic', // needs custom handling? or just apiKey logic

    // Swing Music often token based. Let's assume passed in 'credentials'
    getStreamUrl(serverUrl, trackId, { accessToken }) {
      // Swing Music native stream
      return `${serverUrl}/api/stream/${trackId}?token=${accessToken}`
    },

    getCoverArt(serverUrl, coverHash, { accessToken }, size = 300) {
      // Swing Music often uses hash for covers
      return `${serverUrl}/api/img/covers/${coverHash}?token=${accessToken}`
    },

    async search(serverUrl, query, { accessToken }) {
      const targetUrl = `${serverUrl}/api/search?q=${encodeURIComponent(query)}&token=${accessToken}`
      const res = await fetch(`/api/music/proxy?url=${encodeURIComponent(targetUrl)}`)
      const data = await res.json()

      // Swing Music Search Response Format (Approximated)
      // { tracks: [], albums: [] }
      return {
        songs: (data.tracks || []).map(t => ({
          id: t.filepath || t.trackhash, // Swing uses filepath or hash
          title: t.title,
          artist: t.artist,
          album: t.album,
          albumId: t.albumhash,
          duration: t.duration,
          coverArt: t.image_hash || t.albumhash,
        })),
        albums: (data.albums || []).map(a => ({
          id: a.albumhash,
          title: a.title,
          artist: a.artist,
          coverArt: a.image_hash || a.albumhash,
          year: a.date,
        })),
      }
    },

    async getAlbumTracks(serverUrl, albumHash, { accessToken }) {
      const targetUrl = `${serverUrl}/api/album/${albumHash}/tracks?token=${accessToken}`
      const res = await fetch(`/api/music/proxy?url=${encodeURIComponent(targetUrl)}`)
      const data = await res.json()
      const tracks = data.tracks || data || [] // Check format

      return tracks.map(t => ({
        id: t.filepath || t.trackhash,
        title: t.title,
        artist: t.artist,
        album: t.album,
        albumId: albumHash,
        duration: t.duration,
        coverArt: t.image_hash,
      }))
    },

    async getLyrics(serverUrl, trackId, { accessToken }) {
      const targetUrl = `${serverUrl}/api/lyrics/${trackId}?token=${accessToken}`
      try {
        const res = await fetch(`/api/music/proxy?url=${encodeURIComponent(targetUrl)}`)
        // Might return JSON { lyrics: "..." } or text
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('json')) {
          const data = await res.json()
          return data.lyrics || data.text || null
        } else {
          return await res.text()
        }
      } catch {
        return null
      }
    },
  },

  subsonic: {
    // ...
    name: 'Subsonic',
    icon: '🔊',
    description: 'Classic self-hosted music server',
    authType: 'subsonic',
    getStreamUrl: (...args) => MUSIC_SERVICES.navidrome.getStreamUrl(...args),
    getCoverArt: (...args) => MUSIC_SERVICES.navidrome.getCoverArt(...args),
    search: (...args) => MUSIC_SERVICES.navidrome.search(...args),
    getAlbumTracks: (...args) => MUSIC_SERVICES.navidrome.getAlbumTracks(...args),
    getLyrics: (...args) => MUSIC_SERVICES.navidrome.getLyrics(...args),
  },

  ampache: {
    // ...
    name: 'Ampache',
    icon: '🎧',
    description: 'Web-based audio/video streaming',
    authType: 'apikey',

    getStreamUrl(serverUrl, songId, { apiKey }) {
      return `${serverUrl}/server/json.server.php?action=stream&id=${songId}&auth=${apiKey}`
    },

    getCoverArt(serverUrl, albumId, { apiKey }) {
      return `${serverUrl}/server/json.server.php?action=get_art&id=${albumId}&type=album&auth=${apiKey}`
    },

    async search(serverUrl, query, { apiKey }) {
      // Parallel search for songs and albums
      const songUrl = `${serverUrl}/server/json.server.php?action=search_songs&filter=${encodeURIComponent(query)}&auth=${apiKey}`
      const albumUrl = `${serverUrl}/server/json.server.php?action=search_albums&filter=${encodeURIComponent(query)}&auth=${apiKey}`

      const [songRes, albumRes] = await Promise.all([
        fetch(`/api/music/proxy?url=${encodeURIComponent(songUrl)}`),
        fetch(`/api/music/proxy?url=${encodeURIComponent(albumUrl)}`),
      ])

      const songData = await songRes.json()
      const albumData = await albumRes.json()

      return {
        songs: (songData.song || []).map(song => ({
          id: song.id,
          title: song.name || song.title,
          artist: song.artist?.name || 'Unknown Artist',
          album: song.album?.name || 'Unknown Album',
          albumId: song.album?.id,
          duration: song.time || 0,
        })),
        albums: (albumData.album || []).map(album => ({
          id: album.id,
          title: album.name || album.title,
          artist: album.artist?.name || 'Unknown Artist',
          coverArt: album.id, // Ampache uses ID for art
          year: album.year,
        })),
      }
    },

    async getAlbumTracks(serverUrl, albumId, { apiKey }) {
      const targetUrl = `${serverUrl}/server/json.server.php?action=album_songs&filter=${albumId}&auth=${apiKey}`
      const res = await fetch(`/api/music/proxy?url=${encodeURIComponent(targetUrl)}`)
      const data = await res.json()
      return (data.song || []).map(song => ({
        id: song.id,
        title: song.name || song.title,
        artist: song.artist?.name || 'Unknown Artist',
        album: song.album?.name || 'Unknown Album',
        albumId: song.album?.id,
        duration: song.time || 0,
      }))
    },

    async getLyrics() {
      return null
    },
  },
}

/**
 * Get service connector by name
 */
export function getServiceConnector(serviceName) {
  return MUSIC_SERVICES[serviceName] || null
}

/**
 * Get list of available services
 */
export function getAvailableServices() {
  return Object.entries(MUSIC_SERVICES).map(([id, service]) => ({
    id,
    name: service.name,
    icon: service.icon,
    description: service.description,
    authType: service.authType,
  }))
}

/**
 * Create default music note content object
 */
export function createMusicNoteContent(service, serverUrl, credentials, item, type = 'track') {
  return {
    service,
    serverUrl,
    credentials,
    type, // 'track' or 'album'
    data: item, // Store full item data
    playbackSettings: {
      volume: 0.7,
      repeat: 'none',
    },
  }
}
