import React, { useEffect, useRef, useState } from 'react'
import { useSettings, useUI, useNotes } from '../contexts'
import { SettingsIcon, CloseIcon, MusicIcon, SunIcon, ArchiveIcon, Sparkles } from './Icons'
import { BACKGROUNDS } from '../backgrounds'
import { TRANSPARENCY_PRESETS } from '../themes'
import { MusicSettings } from './MusicSettings'
import { AppearanceSettings } from './settings/AppearanceSettings'

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
    backgroundImage,
    setBackgroundImage,
    backgroundOverlay,
    setBackgroundOverlay,
    accentColor,
    setAccentColor,
    cardTransparency,
    setCardTransparency,
    alwaysShowSidebarOnWide,
    setAlwaysShowSidebarOnWide,
    localAiEnabled,
    setLocalAiEnabled,
    listView,
    toggleListView,
    overlayOpacity,
    setOverlayOpacity,
  } = useSettings()

  const { settingsPanelOpen, setSettingsPanelOpen, showToast, showGenericConfirm } = useUI()

  const { exportAllNotes, importNotes, importGoogleKeep, importMarkdown, downloadSecretKey } =
    useNotes()

  // Refs for hidden file inputs
  const importFileRef = useRef(null)
  const gkeepFileRef = useRef(null)
  const mdFileRef = useRef(null)

  const [activeTab, setActiveTab] = useState('appearance')

  const open = inline ? true : props.open !== undefined ? props.open : settingsPanelOpen
  const onClose = props.onClose || (() => setSettingsPanelOpen(false))

  // Apply dynamic glass blur to root based on current transparency
  useEffect(() => {
    const preset = TRANSPARENCY_PRESETS.find(p => p.id === cardTransparency)
    if (preset) {
      document.documentElement.style.setProperty('--glass-blur', preset.blur || '16px')
    } else {
      document.documentElement.style.setProperty('--glass-blur', '16px')
    }
  }, [cardTransparency])

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

        <div className={`flex flex-col h-[calc(100%-64px)] ${inline ? 'h-full md:flex-row' : ''}`}>
          {/* Navigation Tabs */}
          <div
            className={`
            flex overflow-x-auto border-b border-[var(--border-light)] flex-shrink-0
            ${inline ? 'md:flex-col md:border-b-0 md:border-r md:w-60 md:h-full md:overflow-y-auto' : ''}
          `}
          >
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-3 px-4 py-3 whitespace-nowrap transition-colors
                  ${
                    activeTab === tab.id
                      ? 'text-accent border-b-2 border-accent md:border-b-0 md:border-l-2 md:bg-accent/5'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 border-transparent md:border-l-2'
                  }
                `}
              >
                <span className={activeTab === tab.id ? 'text-accent' : ''}>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
              </button>
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
                      onClick={() => importFileRef.current?.click()}
                    >
                      Import JSON Backup
                    </button>
                    <button
                      className="w-full p-3 rounded-lg border border-dashed border-[var(--border-light)] hover:border-accent hover:bg-accent/5 transition-all text-sm font-medium text-center"
                      onClick={() => gkeepFileRef.current?.click()}
                    >
                      Import Google Keep JSON
                    </button>
                    <button
                      className="w-full p-3 rounded-lg border border-dashed border-[var(--border-light)] hover:border-accent hover:bg-accent/5 transition-all text-sm font-medium text-center"
                      onClick={() => mdFileRef.current?.click()}
                    >
                      Import Markdown Files (.md)
                    </button>
                  </div>
                </div>

                {/* Hidden Inputs */}
                <input
                  ref={importFileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={e =>
                    e.target.files?.length && importNotes(e.target.files) && (e.target.value = '')
                  }
                />
                <input
                  ref={gkeepFileRef}
                  type="file"
                  accept="application/json"
                  multiple
                  className="hidden"
                  onChange={e =>
                    e.target.files?.length &&
                    importGoogleKeep(e.target.files) &&
                    (e.target.value = '')
                  }
                />
                <input
                  ref={mdFileRef}
                  type="file"
                  accept=".md,text/markdown"
                  multiple
                  className="hidden"
                  onChange={e =>
                    e.target.files?.length &&
                    importMarkdown(e.target.files) &&
                    (e.target.value = '')
                  }
                />
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
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alwaysShowSidebarOnWide ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    Features
                  </h4>
                  <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Local AI Assistant</div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localAiEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                        onClick={() => {
                          if (!localAiEnabled && showGenericConfirm) {
                            showGenericConfirm({
                              title: 'Enable AI Assistant?',
                              message:
                                'This will download a ~700MB AI model to the server. CPU usage may increase.',
                              confirmText: 'Enable',
                              onConfirm: () => {
                                setLocalAiEnabled(true)
                                showToast('AI Assistant enabled', 'success')
                              },
                            })
                          } else {
                            setLocalAiEnabled(false)
                          }
                        }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localAiEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                    <p className="text-xs opacity-70">
                      Enable server-side LLM for answering questions about your notes. Requires
                      decent server resources.
                    </p>
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
