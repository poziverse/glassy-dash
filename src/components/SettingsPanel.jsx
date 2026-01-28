import React, { useEffect, useState } from 'react'
import { useSettings, useUI, useNotes } from '../contexts'
import { SettingsIcon, CloseIcon, MusicIcon, SunIcon, ArchiveIcon } from './Icons'
import { MusicSettings } from './MusicSettings'
import { AppearanceSettings } from './settings/AppearanceSettings'
import { Tooltip } from './Tooltip'

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
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
