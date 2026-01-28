import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUIStore } from '../stores/uiStore'
import { api } from '../lib/api'
import DashboardLayout from './DashboardLayout'
import AdminUserModal from './admin/AdminUserModal'

import AuditLogViewer from './admin/AuditLogViewer'
import BugReportViewer from './admin/BugReportViewer'
import {
  Shield,
  RefreshCw,
  Users,
  FileText,
  HardDrive,
  UserPlus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Crown,
  UserX,
  Loader2,
  CheckCircle,
  XCircle,
  LayoutList,
  Activity,
  AlertTriangle,
  Bug,
} from 'lucide-react'

const STORAGE_LIMIT = 1024 * 1024 * 1024 // 1 GB Quota

export default function AdminView() {
  const token = useAuthStore(state => state.token)
  const currentUser = useAuthStore(state => state.currentUser)
  const signOut = useAuthStore(state => state.logout)
  const setSettingsPanelOpen = useUIStore(state => state.setSettingsPanelOpen)
  const showToast = useUIStore(state => state.showToast)
  const showGenericConfirm = useUIStore(state => state.showGenericConfirm)

  // State
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [adminSettings, setAdminSettings] = useState({ allowNewAccounts: true })
  const [settingsLoading, setSettingsLoading] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  // Tab state
  const [activeTab, setActiveTab] = useState('users')

  // Derived stats
  const totalUsers = users.length
  const totalAdmins = users.filter(u => u.is_admin).length
  const totalNotes = users.reduce((acc, u) => acc + (u.notes || 0), 0)
  const totalStorage = users.reduce((acc, u) => acc + (u.storage_bytes || 0), 0)

  const formatBytes = (n = 0) => {
    if (!Number.isFinite(n) || n <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const e = Math.min(Math.floor(Math.log10(n) / 3), units.length - 1)
    const v = n / Math.pow(1024, e)
    return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[e]}`
  }

  // Load users
  const loadUsers = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const data = await api('/admin/users', { token })
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      if (e.status !== 401) {
        showToast?.('Failed to load users: ' + (e.message || 'Unknown error'), 'error')
      }
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [token, showToast])

  // Load admin settings
  const loadSettings = useCallback(async () => {
    if (!token) return
    try {
      const data = await api('/admin/settings', { token })
      setAdminSettings(data || { allowNewAccounts: true })
    } catch (e) {
      console.error('Failed to load admin settings:', e)
    }
  }, [token])

  // Toggle registration
  const toggleRegistration = async () => {
    setSettingsLoading(true)
    try {
      const newValue = !adminSettings.allowNewAccounts
      const data = await api('/admin/settings', {
        method: 'PATCH',
        token,
        body: { allowNewAccounts: newValue },
      })
      setAdminSettings(data)
      showToast?.(newValue ? 'Registration enabled' : 'Registration disabled', 'success')
    } catch (e) {
      showToast?.('Failed to update settings: ' + (e.message || 'Unknown error'), 'error')
    } finally {
      setSettingsLoading(false)
    }
  }

  // Create user
  const createUser = async userData => {
    const data = await api('/admin/users', {
      method: 'POST',
      token,
      body: userData,
    })
    setUsers(prev => [data, ...prev])
    showToast?.('User created successfully', 'success')
    return data
  }

  // Update user
  const updateUser = async userData => {
    if (!editingUser) return
    const data = await api(`/admin/users/${editingUser.id}`, {
      method: 'PATCH',
      token,
      body: userData,
    })
    setUsers(prev => prev.map(u => (u.id === editingUser.id ? { ...u, ...data } : u)))
    showToast?.('User updated successfully', 'success')
    return data
  }

  // Delete user
  const deleteUser = async id => {
    try {
      await api(`/admin/users/${id}`, { method: 'DELETE', token })
      setUsers(prev => prev.filter(u => u.id !== id))
      showToast?.('User deleted successfully', 'success')
    } catch (e) {
      showToast?.('Delete failed: ' + (e.message || 'Unknown error'), 'error')
    }
  }

  // Toggle admin status
  const toggleAdmin = async user => {
    try {
      const data = await api(`/admin/users/${user.id}`, {
        method: 'PATCH',
        token,
        body: { is_admin: !user.is_admin },
      })
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, is_admin: data.is_admin } : u)))
      showToast?.(
        data.is_admin ? `${user.name} is now an admin` : `${user.name} is no longer an admin`,
        'success'
      )
    } catch (e) {
      showToast?.('Failed to update admin status: ' + (e.message || 'Unknown error'), 'error')
    }
  }

  // Filtered users
  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  // Load on mount
  useEffect(() => {
    if (token) {
      loadUsers()
      loadSettings()
    }
  }, [token, loadUsers, loadSettings])

  // Handle modal save
  const handleModalSave = async userData => {
    if (editingUser) {
      return updateUser(userData)
    } else {
      return createUser(userData)
    }
  }

  // Open create modal
  const openCreateModal = () => {
    setEditingUser(null)
    setModalOpen(true)
  }

  // Open edit modal
  const openEditModal = user => {
    setEditingUser(user)
    setModalOpen(true)
  }

  return (
    <DashboardLayout
      activeSection="admin"
      onNavigate={section => {
        if (['health', 'alerts', 'admin', 'trash', 'docs', 'voice', 'settings'].includes(section)) {
          window.location.hash = `#/${section}`
        } else if (section === 'overview') {
          window.location.hash = '#/notes'
        }
      }}
      user={currentUser}
      isAdmin={currentUser?.is_admin}
      title="Admin Dashboard"
      headerActions={
        <button
          onClick={loadUsers}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      }
      onSignOut={signOut}
      onOpenSettings={() => setSettingsPanelOpen(true)}
    >
      <div className="pb-20 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={totalUsers}
            color="text-blue-400"
            bgColor="bg-blue-500/10"
          />
          <StatCard
            icon={Crown}
            label="Admins"
            value={totalAdmins}
            color="text-amber-400"
            bgColor="bg-amber-500/10"
          />
          <StatCard
            icon={FileText}
            label="Total Notes"
            value={totalNotes}
            color="text-emerald-400"
            bgColor="bg-emerald-500/10"
          />
          <StatCard
            icon={HardDrive}
            label="Storage Used"
            value={formatBytes(totalStorage)}
            color="text-purple-400"
            bgColor="bg-purple-500/10"
          />
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-5 border border-white/10">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-[var(--color-accent)]/20"
            >
              <UserPlus size={16} />
              Add User
            </button>

            <button
              onClick={toggleRegistration}
              disabled={settingsLoading}
              className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                adminSettings.allowNewAccounts
                  ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
              }`}
            >
              {settingsLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : adminSettings.allowNewAccounts ? (
                <ToggleRight size={16} />
              ) : (
                <ToggleLeft size={16} />
              )}
              Registration: {adminSettings.allowNewAccounts ? 'Open' : 'Closed'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-white/10 mb-4">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'users'
                ? 'text-[var(--color-accent)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={16} />
              Users
            </div>
            {activeTab === 'users' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent)] rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'audit'
                ? 'text-[var(--color-accent)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity size={16} />
              Audit Logs
            </div>
            {activeTab === 'audit' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent)] rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('bug-reports')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'bug-reports'
                ? 'text-[var(--color-accent)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bug size={16} />
              Bug Reports
            </div>
            {activeTab === 'bug-reports' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent)] rounded-t-full" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'users' ? (
          /* Users Table */
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            {/* Table Header */}
            <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Users size={20} className="text-[var(--color-accent)]" />
                Registered Users
              </h2>

              {/* Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-[var(--color-accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors text-sm w-full sm:w-64"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-white/10 bg-white/5">
                    <th className="py-3 px-5 font-medium text-gray-400">Name</th>
                    <th className="py-3 px-5 font-medium text-gray-400">Email</th>
                    <th className="py-3 px-5 font-medium text-gray-400 text-center">Notes</th>
                    <th className="py-3 px-5 font-medium text-gray-400 text-center">Storage</th>
                    <th className="py-3 px-5 font-medium text-gray-400 text-center">Admin</th>
                    <th className="py-3 px-5 font-medium text-gray-400">Created</th>
                    <th className="py-3 px-5 font-medium text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                        Loading users...
                      </td>
                    </tr>
                  )}
                  {!loading && filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <UserX size={32} className="mx-auto mb-2 opacity-50" />
                        {searchQuery ? 'No users match your search.' : 'No users found.'}
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map(u => (
                    <tr
                      key={u.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-5 font-medium">{u.name}</td>
                      <td className="py-3 px-5 text-gray-400">{u.email}</td>
                      <td className="py-3 px-5 text-center font-mono">{u.notes ?? 0}</td>
                      <td className="py-3 px-5 text-center font-mono">
                        <div className="flex flex-col items-center">
                          <span className="text-gray-300">{formatBytes(u.storage_bytes ?? 0)}</span>
                          <div
                            className="w-24 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden"
                            title={`${(((u.storage_bytes || 0) / STORAGE_LIMIT) * 100).toFixed(1)}% of 1GB Quota`}
                          >
                            <div
                              className={`h-full rounded-full ${
                                (u.storage_bytes || 0) > STORAGE_LIMIT * 0.9
                                  ? 'bg-red-500'
                                  : (u.storage_bytes || 0) > STORAGE_LIMIT * 0.7
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min(((u.storage_bytes || 0) / STORAGE_LIMIT) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <button
                          onClick={() => toggleAdmin(u)}
                          disabled={u.id === currentUser?.id}
                          title={
                            u.id === currentUser?.id
                              ? "Can't change own admin status"
                              : 'Toggle admin status'
                          }
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                            u.is_admin
                              ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                              : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                          } ${u.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {u.is_admin ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        </button>
                      </td>
                      <td className="py-3 px-5 text-gray-400 text-sm">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Edit user"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (showGenericConfirm) {
                                showGenericConfirm({
                                  title: 'Delete User',
                                  message: `Delete "${u.name}" and ALL their notes? This cannot be undone.`,
                                  confirmText: 'Delete',
                                  danger: true,
                                  onConfirm: () => deleteUser(u.id),
                                })
                              } else if (
                                window.confirm(`Delete "${u.name}" and ALL their notes?`)
                              ) {
                                deleteUser(u.id)
                              }
                            }}
                            disabled={u.id === currentUser?.id}
                            className={`p-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors ${
                              u.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title={
                              u.id === currentUser?.id ? "Can't delete yourself" : 'Delete user'
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {filteredUsers.length > 0 && (
              <div className="p-4 border-t border-white/10 text-sm text-gray-500 flex items-center justify-between">
                <span>
                  Showing {filteredUsers.length} of {totalUsers} users
                </span>
              </div>
            )}
          </div>
        ) : activeTab === 'bug-reports' ? (
          <BugReportViewer token={token} />
        ) : (
          <AuditLogViewer token={token} />
        )}
      </div>

      {/* User Modal */}
      <AdminUserModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingUser(null)
        }}
        user={editingUser}
        onSave={handleModalSave}
      />
    </DashboardLayout>
  )
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${bgColor} border border-white/10`}>
          <Icon size={24} className={color} />
        </div>
        <div>
          <div className="text-2xl font-bold font-mono">{value}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
        </div>
      </div>
    </div>
  )
}
