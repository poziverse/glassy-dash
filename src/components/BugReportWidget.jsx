import React, { useState } from 'react'
import { Bug, X, Send, Loader2 } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useUIStore } from '../stores/uiStore'
import { api } from '../lib/api'

export function BugReportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentUser = useAuthStore(state => state.currentUser)
  const showToast = useUIStore(state => state.showToast)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!description.trim()) return

    setIsSubmitting(true)
    try {
      const metadata = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        screen: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        referrer: document.referrer,
      }

      await api('/bug-reports', {
        method: 'POST',
        body: {
          description,
          email: currentUser ? currentUser.email : email,
          metadata,
        },
      })

      showToast('Bug report sent. Thank you!', 'success')
      setIsOpen(false)
      setDescription('')
      setEmail('')
    } catch (err) {
      console.error(err)
      showToast('Failed to send report. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 shadow-lg hover:scale-105 transition-all group"
        title="Report a bug"
      >
        <Bug size={24} className="group-hover:rotate-12 transition-transform" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="glass-card rounded-2xl border border-white/10 p-4 shadow-2xl bg-[#1a1a1a]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Bug size={16} className="text-red-400" />
            Report a Bug
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!currentUser && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-red-500/50 focus:outline-none text-sm text-white placeholder-gray-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What happened?"
              rows={4}
              required
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-red-500/50 focus:outline-none text-sm text-white placeholder-gray-500 resize-none"
            />
          </div>

          <div className="text-xs text-gray-500">
            We'll capture your page URL and browser info automatically to help debug.
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !description.trim()}
            className="w-full py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/20 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Send size={16} />
                Send Report
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
