import React, { useState, useEffect } from 'react'
import { useSettings, useUI } from '../contexts'
import { getAvailableServices } from '../lib/musicServices'
import { api } from '../lib/api'

export function MusicSettings() {
  const { musicSettings, setMusicSettings } = useSettings()
  const { showToast } = useUI()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)

  // Local state for inputs
  const [service, setService] = useState(musicSettings.service || '')
  const [serverUrl, setServerUrl] = useState(musicSettings.serverUrl || '')
  const [username, setUsername] = useState(musicSettings.username || '')
  const [password, setPassword] = useState(musicSettings.password || '')
  const [apiKey, setApiKey] = useState(musicSettings.apiKey || '')
  const [userId, setUserId] = useState(musicSettings.userId || '')

  useEffect(() => {
    setService(musicSettings.service || '')
    setServerUrl(musicSettings.serverUrl || '')
    setUsername(musicSettings.username || '')
    setPassword(musicSettings.password || '')
    setApiKey(musicSettings.apiKey || '')
    setUserId(musicSettings.userId || '')
  }, [musicSettings])

  const services = getAvailableServices()
  const selectedService = services.find(s => s.id === service)

  const handleSave = async () => {
    setLoading(true)
    try {
      const cleanUrl = serverUrl.trim().replace(/\/$/, '') // Remove trailing slash and whitespace

      // Basic URL validation
      if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        throw new Error('Server URL must start with http:// or https://')
      }

      const newSettings = {
        service,
        serverUrl: cleanUrl,
        username,
        password,
        apiKey,
        userId,
      }

      // If Subsonic/Navidrome, generate token/salt immediately
      if (service === 'navidrome' || service === 'subsonic') {
        if (password) {
          const auth = await api('/music/subsonic-auth', {
            method: 'POST',
            body: { password },
          })
          newSettings.token = auth.token
          newSettings.salt = auth.salt
        }
      }

      setMusicSettings(newSettings)
      showToast('Music settings saved', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      // Use current input values for test
      let credentials = {}

      if (service === 'navidrome' || service === 'subsonic') {
        const auth = await api('/music/subsonic-auth', {
          method: 'POST',
          body: { password },
        })
        credentials = {
          token: auth.token,
          salt: auth.salt,
          username, // Some servers need user param
        }
      } else if (service === 'jellyfin' || service === 'ampache') {
        credentials = { apiKey, userId }
      }

      await api('/music/test-connection', {
        method: 'POST',
        body: {
          service,
          serverUrl: serverUrl.replace(/\/$/, ''),
          credentials,
        },
      })

      showToast('Connection successful!', 'success')
    } catch (err) {
      showToast(err.message || 'Connection failed', 'error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-4 border border-[var(--border-light)] rounded-lg p-4 bg-gray-50/50 dark:bg-white/5">
      <div>
        <label className="block text-sm font-medium mb-1">
          Music Service
          <select
            value={service}
            onChange={e => setService(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-[var(--border-light)] rounded-lg p-2 mt-1 focus:border-accent outline-none font-normal"
          >
            <option value="">Select a service...</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {service && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">
              Server URL
              <input
                type="url"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
                placeholder="http://your-server:4533"
                className="w-full bg-transparent border border-[var(--border-light)] rounded-lg p-2 mt-1 focus:border-accent outline-none font-normal"
              />
            </label>
          </div>

          {selectedService?.authType === 'subsonic' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Username
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-transparent border border-[var(--border-light)] rounded-lg p-2 mt-1 focus:border-accent outline-none font-normal"
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-transparent border border-[var(--border-light)] rounded-lg p-2 mt-1 focus:border-accent outline-none font-normal"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Used to generate a secure token. Password is stored locally.
                </p>
              </div>
            </>
          )}

          {selectedService?.authType === 'apikey' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  API Key / Token
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="w-full bg-transparent border border-[var(--border-light)] rounded-lg p-2 mt-1 focus:border-accent outline-none font-normal"
                  />
                </label>
              </div>
              {service === 'jellyfin' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    User ID
                    <input
                      type="text"
                      value={userId}
                      onChange={e => setUserId(e.target.value)}
                      placeholder="Jellyfin User ID (GUID)"
                      className="w-full bg-transparent border border-[var(--border-light)] rounded-lg p-2 mt-1 focus:border-accent outline-none font-normal"
                    />
                  </label>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={testing || !serverUrl}
              className="px-4 py-2 text-sm border border-[var(--border-light)] rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !serverUrl}
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
