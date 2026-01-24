import React from 'react'
import Sidebar from './Sidebar'
import { Bell, CheckCircle } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'

export default function AlertsView() {
  const { dark } = useSettings()

  return (
    <div
      className={`flex h-screen w-full overflow-hidden transition-colors duration-500 ${dark ? 'text-white' : 'text-gray-800'}`}
    >
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-gray-900 to-black" />

      <Sidebar
        activeSection="alerts"
        onNavigate={section => {
          if (section === 'overview') window.location.hash = '#/notes'
          else if (['health', 'admin'].includes(section)) window.location.hash = `#/${section}`
        }}
      />

      <main className="flex-1 relative overflow-y-auto">
        <div className="p-8 max-w-4xl mx-auto">
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
      </main>
    </div>
  )
}
