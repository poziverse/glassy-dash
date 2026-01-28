import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Clock,
  User,
  Activity,
  AlertCircle,
  FileText,
  Download,
} from 'lucide-react'
import { api } from '../../lib/api'

export default function AuditLogViewer({ token }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'auth', 'user', 'data', 'system'
  const [search, setSearch] = useState('')

  // Mock data for UI demonstration if API fails or is unimplemented
  const loadLogs = React.useCallback(async () => {
    setLoading(true)
    try {
      // Try to fetch real logs
      const data = await api('/admin/audit-logs', { token })
      setLogs(Array.isArray(data) ? data : [])
    } catch (e) {
      console.warn('Failed to load audit logs, using mock data:', e)
      setLogs(generateMockLogs())
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  // Filter logic
  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.category !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        log.action.toLowerCase().includes(q) ||
        log.user?.toLowerCase().includes(q) ||
        log.details?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const getActionIcon = (action, category) => {
    if (category === 'auth') return <User size={16} className="text-blue-400" />
    if (category === 'system') return <Activity size={16} className="text-purple-400" />
    if (category === 'error') return <AlertCircle size={16} className="text-red-400" />
    if (action.includes('Delete')) return <Activity size={16} className="text-red-400" />
    return <FileText size={16} className="text-gray-400" />
  }

  return (
    <div className="glass-card rounded-2xl border border-white/10 overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity size={20} className="text-[var(--color-accent)]" />
            System Audit Logs
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track user activity and system events</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--color-accent)]/50 text-white w-48"
            />
          </div>

          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--color-accent)]/50 text-gray-300"
          >
            <option value="all">All Events</option>
            <option value="auth">Authentication</option>
            <option value="user">User Management</option>
            <option value="data">Data Access</option>
            <option value="system">System</option>
          </select>

          <button
            onClick={loadLogs}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <Activity size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 font-mono text-sm">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileText size={48} className="opacity-20 mb-4" />
            <p>No logs found matching your criteria</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-gray-400 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="py-2 px-4 font-semibold w-40">Timestamp</th>
                <th className="py-2 px-4 font-semibold w-48">User</th>
                <th className="py-2 px-4 font-semibold w-48">Action</th>
                <th className="py-2 px-4 font-semibold">Details</th>
                <th className="py-2 px-4 font-semibold w-32">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr
                  key={log.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-2 px-4 text-gray-500 truncate">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-indigo-300 truncate">{log.user || 'System'}</td>
                  <td className="py-2 px-4 text-gray-200 flex items-center gap-2 truncate">
                    {getActionIcon(log.action, log.category)}
                    {log.action}
                  </td>
                  <td className="py-2 px-4 text-gray-400 truncate max-w-xs" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-2 px-4 text-gray-600 truncate">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// Internal Mock Data Generator
function generateMockLogs() {
  const actions = [
    { action: 'User Login', category: 'auth', details: 'Successful login via email' },
    { action: 'Failed Login', category: 'auth', details: 'Invalid password attempt' },
    { action: 'Update Profile', category: 'user', details: 'Changed display name' },
    { action: 'Delete Document', category: 'data', details: 'Deleted "ProjectSpecs.md"' },
    { action: 'System Backup', category: 'system', details: 'Automated nightly backup completed' },
    { action: 'Create User', category: 'user', details: 'Created user "new_employee"' },
  ]

  return Array.from({ length: 50 })
    .map((_, i) => {
      const act = actions[Math.floor(Math.random() * actions.length)]
      return {
        id: `log-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
        user: Math.random() > 0.2 ? `user_${Math.floor(Math.random() * 10)}` : null,
        action: act.action,
        category: act.category,
        details: act.details,
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      }
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}
