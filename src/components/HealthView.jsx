import React, { useEffect, useState } from 'react'
import DashboardLayout from './DashboardLayout'
import {
  Activity,
  Server,
  Cpu,
  Database,
  HardDrive,
  Globe,
  Zap,
  Clock,
  LayoutGrid,
  Box,
  Users,
  FileText,
  Save,
} from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'

export default function HealthView() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const dark = useSettingsStore(state => state.dark)
  const setSettingsPanelOpen = useUIStore(state => state.setSettingsPanelOpen)
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.signOut)

  const fetchMetrics = () => {
    fetch('/api/monitoring/metrics')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch metrics')
        return res.json()
      })
      .then(data => {
        setMetrics(data)
        setLoading(false)
        setError(null)
      })
      .catch(err => {
        console.error(err)
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  // Helper to parse "XX MB" string to number
  const parseMB = val => (val ? parseInt(String(val).replace(' MB', '')) : 0)

  // Calculate memory metrics
  const memUsedMB = parseMB(metrics?.system?.memory?.heapUsed)
  const memTotalMB = parseMB(metrics?.system?.memory?.heapTotal)
  const memRssMB = parseMB(metrics?.system?.memory?.rss)

  // Percentage is already calculated by backend but let's be safe
  const memPercent =
    metrics?.system?.memory?.heapUsedPercentage ||
    Math.min(100, Math.round((memUsedMB / (memTotalMB || 1)) * 100))

  return (
    <DashboardLayout
      activeSection="health"
      onNavigate={section => {
        if (['health', 'alerts', 'admin', 'trash', 'docs', 'voice', 'settings'].includes(section)) {
          window.location.hash = `#/${section}`
        } else if (section === 'overview') {
          window.location.hash = '#/notes'
        }
      }}
      user={currentUser}
      title="Mission Control"
      headerActions={
        metrics?.uptime && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10">
            <Clock size={14} className="text-indigo-400" />
            <span className="text-xs font-mono text-indigo-300">
              UPTIME: {Math.floor(metrics.uptime / 60)}m {Math.floor(metrics.uptime % 60)}s
            </span>
          </div>
        )
      }
      onSignOut={signOut}
      onOpenSettings={() => setSettingsPanelOpen(true)}
    >
      <div className="pb-20">
          {loading && !metrics && (
            <div className="text-white/60 animate-pulse flex items-center gap-2">
              <Zap className="w-4 h-4" /> Initializing telemetry...
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-red-400 flex items-center gap-4">
              <Server className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="font-bold">Telemetry Link Failed</h3>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </div>
          )}

          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* --- Vitals Section --- */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Cpu size={120} />
                  </div>
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-blue-300">
                    <Cpu className="w-5 h-5" /> CPU Load
                  </h3>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-mono font-bold">
                      {(metrics.system.cpu.user + metrics.system.cpu.system).toFixed(2)}s
                    </span>
                    <span className="text-sm text-white/50 mb-1">usage time</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-blue-500 w-full animate-pulse opacity-50"></div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="p-2 rounded bg-white/5 border border-white/5 text-center">
                      <div className="text-xs text-white/40">CORES</div>
                      <div className="font-mono">{metrics.system.cpu.cores}</div>
                    </div>
                    <div className="p-2 rounded bg-white/5 border border-white/5 text-center">
                      <div className="text-xs text-white/40">USER</div>
                      <div className="font-mono">{metrics.system.cpu.user.toFixed(1)}s</div>
                    </div>
                    <div className="p-2 rounded bg-white/5 border border-white/5 text-center">
                      <div className="text-xs text-white/40">SYSTEM</div>
                      <div className="font-mono">{metrics.system.cpu.system.toFixed(1)}s</div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <LayoutGrid size={120} />
                  </div>
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-purple-300">
                    <Box className="w-5 h-5" /> Memory Heap
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-mono font-bold">{memPercent}%</span>
                      <span className="text-sm text-white/50 mb-1">utilized</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/40">ALLOCATED</div>
                      <div className="font-mono text-sm">{memUsedMB} MB</div>
                    </div>
                  </div>
                  <ProgressBar value={memPercent} color="bg-purple-500" />
                  <div className="mt-4 text-xs text-white/40 flex justify-between">
                    <span>Heap Total: {memTotalMB} MB</span>
                    <span>RSS: {memRssMB} MB</span>
                  </div>
                </GlassCard>
              </div>

              {/* --- Database Stats --- */}
              <GlassCard className="col-span-1 md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <h3 className="col-span-2 sm:col-span-4 font-semibold text-emerald-300 flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4" /> Database Statistics
                </h3>

                <StatBox
                  icon={Users}
                  label="Users"
                  value={metrics.database.users}
                  color="text-blue-400"
                />
                <StatBox
                  icon={FileText}
                  label="Notes"
                  value={metrics.database.notes}
                  color="text-yellow-400"
                />
                <StatBox
                  icon={LayoutGrid}
                  label="Lists"
                  value={metrics.database.checklistItems}
                  color="text-pink-400"
                />
                <StatBox
                  icon={Save}
                  label="Size"
                  value={metrics.database.size}
                  color="text-emerald-400"
                />
              </GlassCard>

              {/* --- Performance --- */}
              <GlassCard className="col-span-1 md:col-span-2">
                <h3 className="font-semibold text-orange-300 flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4" /> API Performance
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Avg Response Time</span>
                    <span className="font-mono font-bold text-orange-400">
                      {metrics.performance.requests.avgDuration.toFixed(2)}ms
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.min(100, metrics.performance.requests.avgDuration * 2)}
                    color="bg-orange-500"
                  />

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                    <div>
                      <div className="text-xs text-white/40 mb-1">TOTAL REQUESTS</div>
                      <div className="text-xl font-mono">{metrics.performance.requests.count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40 mb-1">DB QUERIES</div>
                      <div className="text-xl font-mono">{metrics.performance.database.count}</div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* --- System Info --- */}
              <GlassCard className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <Globe className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs text-white/40">SYSTEM PLATFORM</div>
                    <div className="font-mono text-sm capitalize">{metrics.system.platform}</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <HardDrive className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs text-white/40">NODE RUNTIME</div>
                    <div className="font-mono text-sm">{metrics.system.nodeVersion}</div>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <Zap className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-xs text-white/40">MEMORY CACHE</div>
                    <div className="font-mono text-sm">{metrics.cache.size} Items</div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
    </DashboardLayout>
  )
}

// --- Sub-components for clean glass aesthetic ---

function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`glass-card p-6 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-md shadow-xl ${className}`}
    >
      {children}
    </div>
  )
}

function ProgressBar({ value, color = 'bg-blue-500' }) {
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all duration-1000 ease-out`}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="min-w-0">
        <div className="text-xs text-white/40 uppercase tracking-wider">{label}</div>
        <div className="font-mono font-bold truncate">{value}</div>
      </div>
    </div>
  )
}
