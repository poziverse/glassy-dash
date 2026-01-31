import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'

/**
 * useCollaboration Hook
 * Manages real-time collaboration via Server-Sent Events (SSE)
 * Handles connection, reconnection, polling fallback, and online/offline events
 */
export function useCollaboration({ token, tagFilter, onNotesUpdated }) {
  // Presence state
  const [activeUsers, setActiveUsers] = useState([])
  const activeUsersRef = useRef([])
  const [sseConnected, setSseConnected] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const esRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef(null)
  const pollIntervalRef = useRef(null)
  const pollTimeoutRef = useRef(null)

  const MAX_RECONNECT_ATTEMPTS = 10
  const BASE_RECONNECT_DELAY = 1000

  // Keep the latest callback in a ref to avoid reconnecting when it changes
  const onNotesUpdatedRef = useRef(onNotesUpdated)
  useEffect(() => {
    onNotesUpdatedRef.current = onNotesUpdated
  }, [onNotesUpdated])
  // Clean up stale users periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const valid = activeUsersRef.current.filter(u => now - u.timestamp < 60000) // 1 min timeout
      if (valid.length !== activeUsersRef.current.length) {
        activeUsersRef.current = valid
        setActiveUsers(valid)
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  const connectSSE = useCallback(() => {
    // Stop if no token is provided
    if (!token) return

    try {
      const url = new URL(`${window.location.origin}/api/events`)
      url.searchParams.set('token', token)
      url.searchParams.set('_t', Date.now()) // Cache buster for PWA

      const es = new EventSource(url.toString())

      es.onopen = () => {
        console.log('SSE connected')
        setSseConnected(true)
        reconnectAttemptsRef.current = 0
      }

      es.onmessage = e => {
        try {
          const msg = JSON.parse(e.data || '{}')
          if (msg && msg.type === 'note_updated') {
            if (onNotesUpdatedRef.current) {
              onNotesUpdatedRef.current()
            }
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err)
        }
      }

      es.addEventListener('note_updated', e => {
        try {
          const msg = JSON.parse(e.data || '{}')
          if (msg && msg.noteId && onNotesUpdatedRef.current) {
            onNotesUpdatedRef.current()
          }
        } catch (err) {
          console.error('Error parsing note_updated event:', err)
        }
      })

      es.addEventListener('user_presence', e => {
        try {
          const msg = JSON.parse(e.data || '{}')
          const { noteId, userId, user, status } = msg

          // Only if relevant to current view?
          //Actually this hook is generic, so we store presence.
          //Ideally we should filter by current active Note if possible?
          //But this hook is used in NoteCard list too?
          //If tagFilter is present, maybe we don't care about specific presence logic
          //unless we expose it.
          //For now, let's just expose the raw presence data.

          if (userId && user) {
            const now = Date.now()
            const existing = activeUsersRef.current.filter(u => u.userId !== userId)
            const updated = [...existing, { userId, user, noteId, status, timestamp: now }]
            activeUsersRef.current = updated
            setActiveUsers(updated)
          }
        } catch (err) {
          console.error('Error parsing user_presence:', err)
        }
      })

      es.onerror = error => {
        console.log('SSE error, attempting reconnect...', error)
        setSseConnected(false)
        es.close()

        // Check if token still exists in store before attempting reconnect
        const currentToken = useAuthStore.getState().token
        if (!currentToken) {
          console.log('SSE stopped - no active session')
          return
        }

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++

            // Re-check token before reconnecting
            if (useAuthStore.getState().token) {
              connectSSE()
            }
          }, delay)
        } else {
          console.log('SSE reconnection attempts exhausted')
        }
      }

      esRef.current = es
    } catch (error) {
      console.error('Failed to create EventSource:', error)
      setSseConnected(false)
    }
  }, [token])

  const startPolling = useCallback(() => {
    pollIntervalRef.current = setInterval(() => {
      // Only poll if SSE is not connected and we have a token
      if (
        (!esRef.current || esRef.current.readyState === EventSource.CLOSED) &&
        useAuthStore.getState().token
      ) {
        if (onNotesUpdatedRef.current) {
          onNotesUpdatedRef.current()
        }
      }
    }, 30000) // Poll every 30 seconds as fallback
  }, [])

  // Main SSE connection effect
  useEffect(() => {
    if (!token) {
      setSseConnected(false)
      if (esRef.current) esRef.current.close()
      return
    }

    connectSSE()

    // Start polling after a delay
    pollTimeoutRef.current = setTimeout(startPolling, 10000)

    return () => {
      setSseConnected(false)
      if (esRef.current) {
        esRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
    }
  }, [token, connectSSE, startPolling])

  // Online/Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (token && (!esRef.current || esRef.current.readyState === EventSource.CLOSED)) {
        connectSSE()
      }
    }
    const handleOffline = () => {
      setIsOnline(false)
      setSseConnected(false)
      if (esRef.current) esRef.current.close()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [token, connectSSE])

  // Typing state
  const [typingUsers, setTypingUsers] = useState([])
  const typingTimeoutsRef = useRef({})

  const broadcastTyping = useCallback(
    async noteId => {
      if (!token || !noteId) return
      try {
        await fetch(`/api/notes/${noteId}/typing`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (e) {
        console.error(e)
      }
    },
    [token]
  )

  useEffect(() => {
    const es = esRef.current
    if (!es) return

    const handleTyping = e => {
      try {
        const { userId, userName, noteId } = JSON.parse(e.data || '{}')
        // Add user to typing list
        setTypingUsers(prev => {
          if (prev.find(u => u.userId === userId)) return prev
          return [...prev, { userId, userName, noteId }]
        })

        // Clear existing timeout for this user
        if (typingTimeoutsRef.current[userId]) {
          clearTimeout(typingTimeoutsRef.current[userId])
        }

        // Remove after 3 seconds
        typingTimeoutsRef.current[userId] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userId !== userId))
          delete typingTimeoutsRef.current[userId]
        }, 3000)
      } catch (err) {
        console.error('Error parsing user_typing:', err)
      }
    }

    es.addEventListener('user_typing', handleTyping)
    return () => {
      es.removeEventListener('user_typing', handleTyping)
    }
  }, [sseConnected]) // Re-attach if connection cycling happens, though esRef is stable-ish

  const reportPresence = useCallback(
    async (noteId, status = 'viewing') => {
      if (!token || !noteId) return
      try {
        await fetch(`/api/notes/${noteId}/presence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        })
      } catch (e) {
        console.error('Report presence error:', e)
      }
    },
    [token]
  )

  return { sseConnected, isOnline, activeUsers, reportPresence, broadcastTyping, typingUsers }
}
