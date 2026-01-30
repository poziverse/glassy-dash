import React, { useEffect, useState } from 'react'
import { GridLayout } from './GridLayout'
import { bgFor } from '../themes'
import { useSettingsStore } from '../stores/settingsStore'

export function WindowView({ slug }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const dark = useSettingsStore(state => state.dark)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/window/${slug}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error('User not found')
          throw new Error('Failed to load profile')
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-500 gap-4">
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{error}</p>
        <button
          onClick={() => (window.location.hash = '#/login')}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg"
        >
          Go Home
        </button>
      </div>
    )
  }

  // Pre-process notes to have correct layout format if needed,
  // but GridLayout handles missing layouts gracefully.

  return (
    <div
      className={`min-h-screen ${dark ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}
    >
      {/* Hero Header */}
      <div className="relative h-64 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-gray-900 to-black animate-gradient-xy"></div>
        <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
          {/* Avatar with Ring */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <img
              src={`https://www.gravatar.com/avatar/${data.user.gravatarHash}?d=mp&s=200`}
              alt={data.user.name}
              className="relative w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-2xl object-cover"
            />
          </div>

          <h1 className="mt-4 text-3xl font-bold text-white tracking-tight drop-shadow-md">
            {data.user.name}
          </h1>
          <p className="text-white/60 text-sm font-medium tracking-wide uppercase mt-1">
            Public Window
          </p>

          {/* Action Bar */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                // Use a simple alert fallback if toast not available in this view context
                // But we can try to use existing toast lib if available, or just visual feedback
                const btn = document.getElementById('copy-btn-text')
                if (btn) {
                  const original = btn.innerText
                  btn.innerText = 'Copied!'
                  setTimeout(() => (btn.innerText = original), 2000)
                }
              }}
              className="flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full text-white transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                ></path>
              </svg>
              <span id="copy-btn-text" className="font-medium text-sm">
                Share Link
              </span>
            </button>
            <a
              href="#/login"
              className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 rounded-full text-white shadow-lg shadow-purple-500/30 transition-all active:scale-95 text-sm font-bold"
            >
              Create Your Own
            </a>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="p-4 sm:p-8 max-w-[1600px] mx-auto">
        {data.notes.length === 0 ? (
          <div className="text-center py-20 opacity-50">Nothing shared yet.</div>
        ) : (
          <GridLayout notes={data.notes} isReadOnly={true} multiMode={false} />
        )}
      </div>
    </div>
  )
}
