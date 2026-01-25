import React from 'react'
import DashboardLayout from '../DashboardLayout'
import RecordingStudio from './RecordingStudio'
import VoiceGallery from './VoiceGallery'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'

export default function VoiceWorkspace() {
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.signOut)
  const dark = useSettingsStore(state => state.dark)

  return (
    <DashboardLayout
      activeSection="voice"
      onNavigate={page => (window.location.hash = `#/${page}`)}
      user={currentUser}
      title="Voice Studio"
      onSignOut={signOut}
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