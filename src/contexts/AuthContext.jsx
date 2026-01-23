import React, { createContext, useCallback, useMemo, useEffect } from 'react'
import logger from '../utils/logger'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'

export const AuthContext = createContext()

/**
 * AuthProvider Component
 * Acts as a bridge between Zustand useAuthStore and legacy Context consumers
 */
export function AuthProvider({ children }) {
  const {
    currentUser,
    token,
    isAuthenticated,
    logout: storeLogout,
    login: storeLogin,
  } = useAuthStore()

  // Handle auth expiration globally
  useEffect(() => {
    const handleAuthExpired = () => {
      logger.warn('token_expired', { url: window.location.href })
      logger.clearUserId()
      console.log('Auth expired, signing out...')
      storeLogout()
    }

    window.addEventListener('auth-expired', handleAuthExpired)
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired)
    }
  }, [storeLogout])

  const logout = useCallback(() => {
    logger.info('user_logout', { reason: 'user_requested' })
    logger.clearUserId()
    storeLogout()
  }, [storeLogout])

  const updateSession = useCallback(
    authData => {
      if (authData?.user && authData?.token) {
        storeLogin(authData.user, authData.token)
      }
    },
    [storeLogin]
  )

  // signIn function - calls real API
  const signIn = useCallback(
    async (username, password) => {
      try {
        const data = await api('/login', {
          method: 'POST',
          body: { email: username, password },
        })

        if (data.token && data.user) {
          storeLogin(data.user, data.token)
          logger.setUserId(data.user.email || data.user.name)
          logger.setToken(data.token)
          logger.info('user_login', { email: data.user.email || data.user.name, provider: 'api' })
          return { ok: true, user: data.user }
        }

        return { ok: false, error: data.error || 'Login failed' }
      } catch (error) {
        return { ok: false, error: error.message || 'Login failed' }
      }
    },
    [storeLogin]
  )

  const register = useCallback(
    async (name, email, password) => {
      try {
        const data = await api('/register', {
          method: 'POST',
          body: { name, email, password },
        })

        if (data.token && data.user) {
          storeLogin(data.user, data.token)
          logger.setUserId(data.user.email || data.user.name)
          logger.setToken(data.token)
          return { ok: true, user: data.user }
        }

        return { ok: false, error: data.error || 'Registration failed' }
      } catch (error) {
        return { ok: false, error: error.message || 'Registration failed' }
      }
    },
    [storeLogin]
  )

  const signInWithSecret = useCallback(
    async secretKey => {
      try {
        const data = await api('/login/secret', {
          method: 'POST',
          body: { key: secretKey },
        })

        if (data.token && data.user) {
          storeLogin(data.user, data.token)
          logger.setUserId(data.user.email || data.user.name)
          logger.setToken(data.token)
          return { ok: true, user: data.user }
        }

        return { ok: false, error: data.error || 'Login failed' }
      } catch (error) {
        return { ok: false, error: error.message || 'Login failed' }
      }
    },
    [storeLogin]
  )

  const value = useMemo(
    () => ({
      session: { user: currentUser, token },
      token,
      currentUser,
      isAdmin: !!currentUser?.is_admin,
      isAuthenticated,
      logout,
      updateSession,
      signIn,
      register,
      signInWithSecret,
    }),
    [currentUser, token, isAuthenticated, logout, updateSession, signIn, register, signInWithSecret]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth Hook
 * Convenience hook to access auth context
 * Replaces the original useAuth hook
 */
export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
