import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'

/**
 * useCollaboration Hook
 * Manages real-time collaboration via Server-Sent Events (SSE)
 * Handles connection, reconnection, polling fallback, and online/offline events
 */
export function useCollaboration({ token, tagFilter, onNotesUpdated }) {
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

  return { sseConnected, isOnline }
}
