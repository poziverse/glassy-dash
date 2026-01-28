import React, { createContext, useMemo, useContext } from 'react'
import { useSettingsStore } from '../stores/settingsStore'

export const SettingsContext = createContext()

/**
 * SettingsProvider Component
 * Bridge between Zustand useSettingsStore and legacy Context consumers
 */
export function SettingsProvider({ children }) {
  const store = useSettingsStore()

  const value = useMemo(
    () => ({
      // Dark mode
      dark: store.dark,
      setDark: store.setDark,
      toggleDark: store.toggleDark,

      // Background
      backgroundImage: store.backgroundImage,
      setBackgroundImage: store.setBackgroundImage,
      backgroundOverlay: store.backgroundOverlay,
      setBackgroundOverlay: store.setBackgroundOverlay,
      overlayOpacity: store.overlayOpacity,
      setOverlayOpacity: store.setOverlayOpacity,

      // Custom Backgrounds
      customBackgrounds: store.customBackgrounds,
      addCustomBackground: store.addCustomBackground,
      removeCustomBackground: store.removeCustomBackground,

      // Accent color
      accentColor: store.accentColor,
      setAccentColor: store.setAccentColor,

      // Transparency
      cardTransparency: store.cardTransparency,
      setCardTransparency: store.setCardTransparency,

      // Sidebar
      alwaysShowSidebarOnWide: store.sidebarAlwaysVisible,
      setAlwaysShowSidebarOnWide: store.setSidebarAlwaysVisible,
      sidebarWidth: store.sidebarWidth,
      setSidebarWidth: store.setSidebarWidth,

      // View Mode
      listView: store.listView,
      setListView: store.setListView,
      toggleListView: store.toggleListView,

      // Music Player
      musicSettings: store.musicSettings,
      setMusicSettings: store.setMusicSettings,

      // Atomic Preset
      applyThemePreset: store.applyThemePreset,
    }),
    [store]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

/**
 * useSettings Hook
 * Convenience hook to access settings context
 * Replaces the original useSettings hook
 */
export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
