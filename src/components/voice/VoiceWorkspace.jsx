import React from 'react'
import DashboardLayout from '../DashboardLayout'
import RecordingStudio from './RecordingStudio'
import VoiceGallery from './VoiceGallery'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useUIStore } from '../../stores/uiStore'

export default function VoiceWorkspace() {
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.signOut)
  const dark = useSettingsStore(state => state.dark)
  const setSettingsPanelOpen = useUIStore(state => state.setSettingsPanelOpen)

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
      title="Voice Studio"
      onSignOut={signOut}
      onOpenSettings={() => setSettingsPanelOpen(true)}
    >
      <div className="pb-20">
        {/* Always-Visible Recording Studio */}
        <div className="recording-studio">
          <RecordingStudio />
        </div>

        {/* Voice Gallery - Recent Recordings */}
        <VoiceGallery />
      </div>
    </DashboardLayout>
  )
}