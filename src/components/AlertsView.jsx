import React from 'react'
import DashboardLayout from './DashboardLayout'
import { Bell, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'

export default function AlertsView() {
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.signOut)

  return (
    <DashboardLayout
      activeSection="alerts"
      onNavigate={section => {
        if (['health', 'alerts', 'admin', 'trash', 'docs', 'voice'].includes(section)) {
          window.location.hash = `#/${section}`
        } else if (section === 'overview') {
          window.location.hash = '#/notes'
        }
      }}
      user={currentUser}
      title="System Alerts"
      onSignOut={signOut}
    >
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="text-blue-400" />
            System Alerts
          </h1>
          <p className="text-white/60 mt-2">Notifications and system messages.</p>
        </header>

        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white">All Clear</h3>
          <p className="text-white/50 max-w-sm">
            There are no active system alerts or notifications at this time.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
