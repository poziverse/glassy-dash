import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

const AUTH_KEY = 'glass-keep-auth';

/**
 * AuthProvider Component
 * Provides authentication state and operations to the entire app
 * Replaces useAuth hook usage with Context API
 */
export function AuthProvider({ children }) {
  // Auth helpers
  const getAuth = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch (e) {
      return null;
    }
  }, []);

  const setAuthStorage = useCallback((obj) => {
    if (obj) localStorage.setItem(AUTH_KEY, JSON.stringify(obj));
    else localStorage.removeItem(AUTH_KEY);
  }, []);

  // State
  const [session, setSession] = useState(getAuth());
  const token = session?.token;
  const currentUser = session?.user || null;
  const isAdmin = !!currentUser?.is_admin;

  // Persist session to localStorage
  useEffect(() => {
    setAuthStorage(session);
  }, [session, setAuthStorage]);

  // Handle auth expiration globally
  useEffect(() => {
    const handleAuthExpired = () => {
      console.log("Auth expired, signing out...");
      setSession(null);
      setAuthStorage(null);
      // Clear all cached data
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('glass-keep-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error("Error clearing cache on auth expiration:", error);
      }
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, [setAuthStorage]);

  // Logout
  const logout = useCallback(() => {
    setSession(null);
    setAuthStorage(null);
  }, [setAuthStorage]);

  // Update session (called after login/register)
  const updateSession = useCallback((authData) => {
    setSession(authData);
  }, []);

  const value = {
    session,
    token,
    currentUser,
    isAdmin,
    logout,
    updateSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * Convenience hook to access auth context
 * Replaces the original useAuth hook
 */
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
