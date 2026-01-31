import React from 'react'
import DashboardLayout from './DashboardLayout'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUIStore } from '../stores/uiStore'
import RecordingStudio from './voice/RecordingStudio'
import VoiceGallery from './voice/VoiceGallery'
import { Mic } from 'lucide-react'

export default function VoiceView() {
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.logout)
  const dark = useSettingsStore(state => state.dark)
  const setSettingsPanelOpen = useUIStore(state => state.setSettingsPanelOpen)
  const isAdmin = currentUser?.is_admin === true

  return (
    <DashboardLayout
      activeSection="voice"
      onNavigate={section => {
        if (['health', 'alerts', 'admin', 'trash', 'docs', 'voice', 'settings'].includes(section)) {
          window.location.hash = `#/${section}`
        } else if (section === 'overview') {
          window.location.hash = '#/notes'
        }
      }}
      user={currentUser}
      isAdmin={isAdmin}
      title="Voice Studio"
      onSignOut={signOut}
      onOpenSettings={() => setSettingsPanelOpen(true)}
    >
      <div className="h-full flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Voice Studio
            </h1>
            <p className="text-gray-400 mt-1">
              Record, transcribe, and organize your voice notes with AI
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Mic size={20} className="text-indigo-400" />
          </div>
        </div>

        {/* Recording Studio */}
        <RecordingStudio />

        {/* Voice Gallery */}
        <VoiceGallery />
      </div>
    </DashboardLayout>
  )
}