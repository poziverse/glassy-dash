import React from 'react'
import { SettingsPanel } from './SettingsPanel'
import DashboardLayout from './DashboardLayout'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { Settings } from 'lucide-react'

export default function SettingsView() {
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.logout)
  const setSettingsPanelOpen = useUIStore(state => state.setSettingsPanelOpen)
  const isAdmin = currentUser?.is_admin === true

  return (
    <DashboardLayout
      activeSection="settings"
      onNavigate={section => {
        if (['health', 'alerts', 'admin', 'trash', 'docs', 'voice', 'settings'].includes(section)) {
          window.location.hash = `#/${section}`
        } else if (section === 'overview') {
          window.location.hash = '#/notes'
        }
      }}
      user={currentUser}
      isAdmin={isAdmin}
      title="Settings"
      onSignOut={signOut}
      onOpenSettings={() => setSettingsPanelOpen(true)}
    >
      <SettingsPanel inline />
    </DashboardLayout>
  )
}