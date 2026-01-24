import React, { useState, useCallback } from 'react'
import { useSettings, useUI } from '../contexts'
import { getServiceConnector, createMusicNoteContent } from '../lib/musicServices'
import { MusicPlayerCard } from './MusicPlayerCard'
import { useLogger } from '../utils/logger'

export function MusicInput({ value, onChange }) {
  const { musicSettings } = useSettings()
  const { setSettingsPanelOpen } = useUI()
  const logger = useLogger()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ songs: [], albums: [] })
  const [activeTab, setActiveTab] = useState('songs')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { service, serverUrl, token, salt, username, password, apiKey, userId } =
    musicSettings || {}

  let selectedItem = null
  try {
    const raw = value ? (typeof value === 'string' ? JSON.parse(value) : value) : null
    selectedItem = raw?.data || raw?.track // Backwards compat
  } catch (e) {
    // Silent parsing error for input
  }

  if (selectedItem) {
    return (
      <div className="relative">
        <MusicPlayerCard
          data={value ? (typeof value === 'string' ? JSON.parse(value) : value) : null}
          isPreview={true}
        />
        <button
          onClick={() => onChange(null)}
          className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white"
          title="Remove item"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    )
  }

  const handleSearch = useCallback(
    async e => {
      e?.preventDefault()
      if (!query.trim() || !service) return

      setLoading(true)
      setError(null)
      setResults({ songs: [], albums: [] })

      try {
        const connector = getServiceConnector(service)
        if (!connector) throw new Error('Invalid service configuration')

        const credentials = { token, salt, username, password, apiKey, userId }

        const data = await connector.search(serverUrl, query, credentials)
        setResults(data) // Expects { songs: [], albums: [] }

        if (data.songs.length === 0 && data.albums.length === 0) {
          setError('No results found')
        } else {
          // Auto switch tab if one is empty
          if (data.songs.length === 0 && data.albums.length > 0) setActiveTab('albums')
          else setActiveTab('songs')
        }
      } catch (err) {
        logger.error('music_search_error', { service, query }, err)
        console.error('Search error:', err)
        setError('Search failed: ' + (err.message || 'Unknown error'))
      } finally {
        setLoading(false)
      }
    },
    [query, service, serverUrl, token, salt, username, password, apiKey, userId, logger]
  )

  const handleSelect = (item, type) => {
    const credentials = { token, salt, apiKey, userId }
    const noteContent = createMusicNoteContent(service, serverUrl, credentials, item, type)
    onChange(noteContent)
  }

  if (!service || !serverUrl) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400 border border-dashed border-[var(--border-light)] rounded-lg">
        <p className="mb-3 text-lg">🎵 Setup Music Player</p>
        <p className="text-sm mb-4">
          Connect your Navidrome, Jellyfin, or Subsonic server to stream music.
        </p>
        <button
          onClick={() => setSettingsPanelOpen(true)}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover"
        >
          Open Settings
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search songs, albums..."
          className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-[var(--border-light)] rounded-lg p-2 focus:border-accent outline-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {(results.songs.length > 0 || results.albums.length > 0) && (
        <div>
          <div className="flex border-b border-[var(--border-light)] mb-2">
            <button
              type="button"
              onClick={() => setActiveTab('songs')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'songs'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Songs ({results.songs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('albums')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'albums'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Albums ({results.albums.length})
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {activeTab === 'songs' &&
              results.songs.map(track => (
                <button
                  type="button"
                  key={track.id}
                  onClick={() => handleSelect(track, 'track')}
                  className="w-full text-left p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 transition-colors group"
                >
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0 text-lg">
                    🎵
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate group-hover:text-accent">
                      {track.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {track.artist} • {track.album}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.floor(track.duration / 60)}:
                    {String(Math.floor(track.duration % 60)).padStart(2, '0')}
                  </div>
                </button>
              ))}

            {activeTab === 'albums' &&
              results.albums.map(album => (
                <button
                  type="button"
                  key={album.id}
                  onClick={() => handleSelect(album, 'album')}
                  className="w-full text-left p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-3 transition-colors group"
                >
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0 text-lg">
                    💿
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate group-hover:text-accent">
                      {album.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {album.artist} • {album.year}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
