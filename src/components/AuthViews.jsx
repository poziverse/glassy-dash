import React, { useState } from 'react'
import { useSettings } from '../contexts'
import { Sun, Moon } from 'lucide-react' // Assuming we have lucide-react or use Icons.jsx

// Reusing Icons from Icons.jsx if available or lucide-react if installed
// Checking Icons.jsx in previous reads shows Sun/Moon importable from there?
// In App.jsx: import { Sun, Moon ... } from "./components/Icons";

import { SunIcon, MoonIcon } from './Icons' // Using names from Icons.jsx

export function AuthShell({ children, title, dark, onToggleDark }) {
  // If hooks not passed, use context (cleaner)
  const settings = useSettings()
  const isDark = dark !== undefined ? dark : settings.dark
  const toggle = onToggleDark || settings.toggleDark

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-[#1a1a1a] text-gray-100' : 'bg-[#f0f2f5] text-gray-900'}`}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 shadow-lg shadow-indigo-500/10 mb-4 overflow-hidden border border-white/20">
            <img src="/favicon.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            GlassyDash
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        </div>
        <div className="glass-card rounded-xl p-6 shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-white/10">
          {children}
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={toggle}
            className={`inline-flex items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} hover:underline`}
            title="Toggle dark mode"
          >
            {isDark ? <MoonIcon /> : <SunIcon />} Toggle theme
          </button>
        </div>
      </div>
    </div>
  )
}

export function LoginView({ onLogin, goRegister, goSecret, allowRegistration }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const res = await onLogin(email.trim(), pw)
      if (!res.ok) setErr(res.error || 'Login failed')
    } catch (er) {
      setErr(er.message || 'Login failed')
    }
  }

  return (
    <AuthShell title="Sign in to your account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          autoComplete="username"
          className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Username"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          required
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
        >
          Sign In
        </button>
      </form>

      <div className="mt-4 text-sm flex justify-between items-center">
        {allowRegistration && (
          <button
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
            onClick={goRegister}
          >
            Create account
          </button>
        )}
        <button className="text-indigo-600 dark:text-indigo-400 hover:underline" onClick={goSecret}>
          Forgot username/password?
        </button>
      </div>
    </AuthShell>
  )
}

export function RegisterView({ onRegister, goLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [err, setErr] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (pw.length < 6) return setErr('Password must be at least 6 characters.')
    if (pw !== pw2) return setErr('Passwords do not match.')
    try {
      const res = await onRegister(name.trim() || 'User', email.trim(), pw)
      if (!res.ok) setErr(res.error || 'Registration failed')
    } catch (er) {
      setErr(er.message || 'Registration failed')
    }
  }

  return (
    <AuthShell title="Create a new account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <input
          type="text"
          autoComplete="username"
          className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Username"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Password (min 6 chars)"
          value={pw}
          onChange={e => setPw(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Confirm password"
          value={pw2}
          onChange={e => setPw2(e.target.value)}
          required
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
        >
          Create Account
        </button>
      </form>
      <div className="mt-4 text-sm text-center">
        Already have an account?{' '}
        <button className="text-indigo-600 dark:text-indigo-400 hover:underline" onClick={goLogin}>
          Sign in
        </button>
      </div>
    </AuthShell>
  )
}

export function SecretLoginView({ onLoginWithKey, goLogin }) {
  const [key, setKey] = useState('')
  const [err, setErr] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const res = await onLoginWithKey(key.trim())
      if (!res.ok) setErr(res.error || 'Login failed')
    } catch (er) {
      setErr(er.message || 'Login failed')
    }
  }

  return (
    <AuthShell title="Sign in with Secret Key">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Paste your secret key here"
          value={key}
          onChange={e => setKey(e.target.value)}
          required
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
        >
          Sign In with Secret Key
        </button>
      </form>
      <div className="mt-4 text-sm text-center">
        Remember your credentials?{' '}
        <button className="text-indigo-600 dark:text-indigo-400 hover:underline" onClick={goLogin}>
          Sign in with email & password
        </button>
      </div>
    </AuthShell>
  )
}
