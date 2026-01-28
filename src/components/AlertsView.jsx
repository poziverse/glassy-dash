import React from 'react'
import DashboardLayout from './DashboardLayout'
import { Bell, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'

export default function AlertsView() {
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.signOut)
  const setSettingsPanelOpen = useUIStore(state => state.setSettingsPanelOpen)

  return (
    <DashboardLayout
      activeSection="alerts"
      onNavigate={section => {
        if (['health', 'alerts', 'admin', 'trash', 'docs', 'voice', 'settings'].includes(section)) {
          window.location.hash = `#/${section}`
        } else if (section === 'overview') {
          window.location.hash = '#/notes'
        }
      }}
      user={currentUser}
      title="System Alerts"
      onSignOut={signOut}
      onOpenSettings={() => setSettingsPanelOpen(true)}
    >
      <div className="w-full">
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white">All Clear</h3>
          <p className="text-white/50 w-full px-4">
            There are no active system alerts or notifications at this time.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
