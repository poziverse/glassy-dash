import React, { useState, useEffect } from 'react'
import { X, User, Mail, Lock, Shield, Loader2 } from 'lucide-react'

/**
 * AdminUserModal - Modal for creating or editing users
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {function} props.onClose - Close handler
 * @param {Object|null} props.user - User to edit (null for create mode)
 * @param {function} props.onSave - Save handler (userData) => Promise
 * @param {boolean} props.loading - External loading state
 */
export default function AdminUserModal({ open, onClose, user, onSave, loading = false }) {
  const isEdit = !!user

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    is_admin: false,
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        setForm({
          name: user.name || '',
          email: user.email || '',
          password: '',
          is_admin: !!user.is_admin,
        })
      } else {
        setForm({
          name: '',
          email: '',
          password: '',
          is_admin: false,
        })
      }
      setErrors({})
    }
  }, [open, user])

  const validate = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    if (!isEdit && !form.password) newErrors.password = 'Password is required for new users'
    if (form.password && form.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        is_admin: form.is_admin,
      }
      // Only include password if provided
      if (form.password) {
        payload.password = form.password
      }
      await onSave(payload)
      onClose()
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save user' })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-[90%] max-w-md glass-card rounded-2xl shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User size={20} className="text-[var(--color-accent)]" />
            {isEdit ? 'Edit User' : 'Create New User'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-300">Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border ${
                  errors.name ? 'border-red-500/50' : 'border-white/10'
                } focus:border-[var(--color-accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors`}
                placeholder="John Doe"
              />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-300">
              Email / Username
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border ${
                  errors.email ? 'border-red-500/50' : 'border-white/10'
                } focus:border-[var(--color-accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors`}
                placeholder="john@example.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-300">
              Password{' '}
              {isEdit && <span className="text-gray-500">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border ${
                  errors.password ? 'border-red-500/50' : 'border-white/10'
                } focus:border-[var(--color-accent)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors`}
                placeholder={isEdit ? '••••••••' : 'Enter password'}
              />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Admin Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Shield size={18} className={form.is_admin ? 'text-green-400' : 'text-gray-500'} />
              <div>
                <div className="text-sm font-medium">Administrator</div>
                <div className="text-xs text-gray-500">Grant admin privileges</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_admin: !form.is_admin })}
              className={`relative w-11 h-6 rounded-full transition-colors flex items-center px-1 ${
                form.is_admin ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                  form.is_admin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-white hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[var(--color-accent)]/20"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
