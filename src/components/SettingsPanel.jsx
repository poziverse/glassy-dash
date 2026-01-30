import React, { useEffect, useState } from 'react'
import { useSettings, useUI, useNotes } from '../contexts'
import { SettingsIcon, CloseIcon, MusicIcon, SunIcon, ArchiveIcon } from './Icons'
import { MusicSettings } from './MusicSettings'
import { AppearanceSettings } from './settings/AppearanceSettings'
import { Tooltip } from './Tooltip'
import { Globe, Copy, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: <SunIcon /> },
  { id: 'integrations', label: 'Integrations', icon: <MusicIcon /> },
  { id: 'data', label: 'Data & Backup', icon: <ArchiveIcon /> },
  { id: 'general', label: 'General', icon: <SettingsIcon /> },
]

export function SettingsPanel({ inline, ...props }) {
  const {
    dark,
    toggleDark,
    alwaysShowSidebarOnWide,
    setAlwaysShowSidebarOnWide,
    listView,
    toggleListView,
  } = useSettings()

  const { settingsPanelOpen, setSettingsPanelOpen } = useUI()

  const { exportAllNotes, importNotes, downloadSecretKey } = useNotes()

  const [activeTab, setActiveTab] = useState('appearance')
  const { currentUser, login } = useAuthStore()
  const [slugInput, setSlugInput] = useState('')
  const [slugLoading, setSlugLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Initialize slug input from currentUser
  useEffect(() => {
    if (currentUser?.slug) {
      setSlugInput(currentUser.slug)
    }
  }, [currentUser])

  const handleSaveSlug = async () => {
    if (slugLoading) return
    const newSlug = slugInput.trim()

    // Basic validation
    if (newSlug && !/^[a-z0-9-]{3,30}$/.test(newSlug)) {
      toast.error('Slug must be 3-30 chars, alphanumeric with dashes.')
      return
    }

    setSlugLoading(true)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: JSON.stringify({ slug: newSlug || '' }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update')
      }

      const data = await res.json()

      // Update local user state properly
      // We re-use the existing token but update the user object
      const updatedUser = { ...currentUser, slug: data.slug }
      login(updatedUser, useAuthStore.getState().token)

      toast.success(data.slug ? 'Public URL claimed!' : 'Public URL removed')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSlugLoading(false)
    }
  }

  const copyUrl = () => {
    if (!currentUser?.slug) return
    const url = `${window.location.host}/#/w/${currentUser.slug}` // Use full URL in real app, here construct relative for now or just host
    // Actually window.location.origin is better
    const fullUrl = `${window.location.origin}/#/w/${currentUser.slug}`
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('URL copied to clipboard')
  }

  const open = inline ? true : props.open !== undefined ? props.open : settingsPanelOpen

  const onClose = props.onClose || (() => setSettingsPanelOpen(false))

  // Prevent body scroll when settings panel is open
  useEffect(() => {
    if (inline) return
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open, inline])

  if (!open && !inline) return null

  return (
    <>
      {open && !inline && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={e => {
            if (e.target === e.currentTarget) onClose()
          }}
        />
      )}
      <div
        className={
          inline
            ? 'w-full h-full'
            : `fixed top-0 right-0 z-[55] h-full w-full sm:w-[500px] shadow-2xl transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`
        }
        style={
          inline
            ? {}
            : {
                backgroundColor: dark ? '#222222' : 'rgba(255,255,255,0.95)',
                borderLeft: '1px solid var(--border-light)',
              }
        }
        aria-hidden={!open && !inline}
      >
        {!inline && (
          <div className="p-4 flex items-center justify-between border-b border-[var(--border-light)]">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <SettingsIcon />
              Settings
            </h3>
            <button
              className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10"
              onClick={onClose}
              title="Close"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        <div className="flex h-[calc(100%-64px)] overflow-hidden">
          {/* Navigation Tabs - Slim Vertical Sidebar */}
          <div
            className={`
            flex flex-col border-r border-[var(--border-light)] flex-shrink-0 w-16 items-center py-4 gap-4 bg-black/5 dark:bg-white/5
          `}
          >
            {TABS.map(tab => (
              <Tooltip key={tab.id} text={tab.label} position="right">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  aria-label={tab.label}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
                    ${
                      activeTab === tab.id
                        ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-110'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-black/10 dark:hover:bg-white/10'
                    }
                  `}
                >
                  <span className="scale-110">{tab.icon}</span>
                </button>
              </Tooltip>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
            {/* Appearance Tab */}
            {activeTab === 'appearance' && <AppearanceSettings />}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/20">
                  <h4 className="text-lg font-bold mb-2 flex items-center gap-2 text-purple-400">
                    <MusicIcon className="w-5 h-5" />
                    Self-Hosted Music
                  </h4>
                  <p className="text-sm opacity-80 mb-4">
                    Connect your Navidrome, Jellyfin, Subsonic, or Ampache server to stream
                    high-quality audio directly in the dashboard.
                  </p>
                  <MusicSettings />
                </div>
              </div>
            )}

            {/* Data Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h4 className="text-lg font-bold mb-4">Export & Backup</h4>
                  <div className="space-y-3">
                    <button
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                      onClick={exportAllNotes}
                    >
                      <div>
                        <div className="font-medium">Export All Notes (JSON)</div>
                        <div className="text-xs opacity-60">Full backup including metadata</div>
                      </div>
                      <ArchiveIcon />
                    </button>
                    <button
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                      onClick={downloadSecretKey}
                    >
                      <div>
                        <div className="font-medium">Download Secret Key</div>
                        <div className="text-xs opacity-60">Required for account recovery</div>
                      </div>
                      <SettingsIcon />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-4">Import Data</h4>
                  <div className="grid gap-3">
                    <button
                      className="w-full p-3 rounded-lg border border-dashed border-[var(--border-light)] hover:border-accent hover:bg-accent/5 transition-all text-sm font-medium text-center"
                      onClick={() => importNotes()}
                    >
                      Import JSON Backup
                    </button>
                    <button
                      className="w-full p-3 rounded-lg border border-dashed border-[var(--border-light)] hover:border-accent hover:bg-accent/5 transition-all text-sm font-medium text-center opacity-50 cursor-not-allowed"
                      disabled
                      title="Google Keep import coming soon"
                    >
                      Import Google Keep JSON
                    </button>
                    <button
                      className="w-full p-3 rounded-lg border border-dashed border-[var(--border-light)] hover:border-accent hover:bg-accent/5 transition-all text-sm font-medium text-center opacity-50 cursor-not-allowed"
                      disabled
                      title="Markdown import coming soon"
                    >
                      Import Markdown Files (.md)
                    </button>
                  </div>
                  <div className="mt-2 text-xs opacity-60">
                    Google Keep and Markdown imports coming soon
                  </div>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h4 className="text-lg font-bold mb-4">UI Preferences</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                      <div>
                        <div className="font-medium">Dark Mode</div>
                        <div className="text-xs opacity-60">Toggle application theme</div>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${dark ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
                        onClick={toggleDark}
                        aria-label="Toggle Dark Mode"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${dark ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                      <div>
                        <div className="font-medium">List View</div>
                        <div className="text-xs opacity-60">
                          Display notes in a list instead of grid
                        </div>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${listView ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
                        onClick={toggleListView}
                        aria-label="Toggle List View"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${listView ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                      <div>
                        <div className="font-medium">Persistent Sidebar</div>
                        <div className="text-xs opacity-60">
                          Always show sidebar on wide screens
                        </div>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${alwaysShowSidebarOnWide ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
                        onClick={() => setAlwaysShowSidebarOnWide(!alwaysShowSidebarOnWide)}
                        aria-label="Toggle Persistent Sidebar"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alwaysShowSidebarOnWide ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Public Profile Section */}
                <div className="mt-8 pt-8 border-t border-[var(--border-light)]">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    Public Window
                  </h4>
                  <p className="text-sm opacity-80 mb-4">
                    Claim a unique URL to share your selected notes publicly. Only notes marked as
                    "Public" will be visible.
                  </p>

                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold uppercase opacity-60">
                      Personal URL Slug
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-gray-500 text-sm select-none">
                          .../#/w/
                        </span>
                        <input
                          type="text"
                          value={slugInput}
                          onChange={e =>
                            setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                          }
                          placeholder="unique-name"
                          className="w-full bg-black/5 dark:bg-white/5 border border-[var(--border-light)] rounded-lg py-2 pl-20 pr-3 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                      </div>
                      <button
                        onClick={handleSaveSlug}
                        disabled={slugLoading || slugInput === (currentUser?.slug || '')}
                        className="px-4 py-2 bg-accent text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                      >
                        {slugLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>

                    {currentUser?.slug && (
                      <div className="flex items-center gap-3 mt-2 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm text-blue-600 dark:text-blue-400">
                        <div className="flex-1 truncate font-mono select-all">
                          {window.location.host}/#/w/{currentUser.slug}
                        </div>
                        <button
                          onClick={copyUrl}
                          className="p-1.5 hover:bg-blue-500/10 rounded-md transition-colors"
                          title="Copy URL"
                          aria-label="Copy public URL"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <a
                          href={`#/w/${currentUser.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-blue-500/10 rounded-md transition-colors"
                          title="Open Link"
                          aria-label="Open public window"
                        >
                          <Globe size={16} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
