import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ACCENT_COLORS, TRANSPARENCY_PRESETS } from '../themes'

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Initial state (Default: Zen Garden)
      dark: true,
      viewMode: 'grid',
      theme: 'zen',
      background: 'default',
      accentColor: 'emerald',
      customBackgrounds: [], // { id, name, timestamp }
      backgroundImage: 'Bonsai-Plant.png',
      backgroundOverlay: true,
      overlayOpacity: 0.6,
      cardTransparency: 'medium',
      sidebarAlwaysVisible: false,
      sidebarWidth: 288,
      musicSettings: {
        service: null,
        serverUrl: '',
        username: '',
        password: '',
        apiKey: '',
        userId: '',
      },
      listView: false,

      // Actions
      toggleDark: () => {
        const newDark = !get().dark
        set({ dark: newDark })
        applyThemeVariables(get())
      },

      setDark: dark => {
        set({ dark })
        applyThemeVariables(get())
      },

      setBackgroundImage: backgroundImage => {
        set({ backgroundImage })
        applyThemeVariables(get())
      },

      setViewMode: mode => set({ viewMode: mode }),
      setListView: listView => set({ listView }),
      toggleListView: () => set(state => ({ listView: !state.listView })),

      setTheme: theme => {
        set({ theme })
        applyThemeVariables(get())
      },

      setBackgroundOverlay: backgroundOverlay => set({ backgroundOverlay }),
      setOverlayOpacity: overlayOpacity => set({ overlayOpacity }),

      // Custom Background Actions
      setCustomBackgrounds: customBackgrounds => set({ customBackgrounds }),

      addCustomBackground: (id, name) => {
        set(state => ({
          customBackgrounds: [...state.customBackgrounds, { id, name, timestamp: Date.now() }],
        }))
      },

      removeCustomBackground: id => {
        set(state => {
          // If the deleted background is currently active, reset to default
          let newBgImage = state.backgroundImage
          if (state.backgroundImage === `custom:${id}`) {
            newBgImage = null
          }

          const newState = {
            customBackgrounds: state.customBackgrounds.filter(bg => bg.id !== id),
            backgroundImage: newBgImage,
          }

          // Apply changes to document
          applyThemeVariables({ ...state, ...newState })

          return newState
        })
      },

      setAccentColor: color => {
        console.log('[Theming] Setting accent color to:', color)
        set({ accentColor: color })
        applyThemeVariables(get())
      },

      setCardTransparency: cardTransparency => {
        set({ cardTransparency })
        applyThemeVariables(get())
      },
      setSidebarAlwaysVisible: sidebarAlwaysVisible => set({ sidebarAlwaysVisible }),
      setSidebarWidth: sidebarWidth => set({ sidebarWidth }),
      setMusicSettings: settings =>
        set(state => ({
          musicSettings: { ...state.musicSettings, ...settings },
        })),

      // Atomic Theme Application (Prevents Flicker)
      applyThemePreset: preset => {
        const updates = {}

        // Apply all theme settings atomically
        if (preset.backgroundId !== undefined) updates.backgroundImage = preset.backgroundId
        if (preset.accentId !== undefined) updates.accentColor = preset.accentId
        if (preset.overlay !== undefined) updates.backgroundOverlay = preset.overlay
        if (preset.transparencyId !== undefined) updates.cardTransparency = preset.transparencyId
        if (typeof preset.darkMode === 'boolean') updates.dark = preset.darkMode
        if (typeof preset.overlayOpacity === 'number')
          updates.overlayOpacity = preset.overlayOpacity

        set(updates)

        // Apply theme variables after state update
        const newState = get()
        applyThemeVariables(newState)
      },

      // Load saved settings into document
      loadSettings: () => {
        applyThemeVariables(get())
      },
    }),
    {
      name: 'glassy-dash-settings',
    }
  )
)

/**
 * Apply all theme-related CSS variables to the document
 * @param {Object} state - Current settings state
 */
export const applyThemeVariables = state => {
  if (typeof document === 'undefined') return

  // Dark Mode
  if (state.dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // Accent Color
  if (state.accentColor) {
    const theme = ACCENT_COLORS.find(c => c.id === state.accentColor) || ACCENT_COLORS[0]
    document.documentElement.style.setProperty('--color-accent', theme.hex)
    document.documentElement.style.setProperty('--color-accent-hover', theme.hover)

    const hex = theme.hex.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    document.documentElement.style.setProperty(
      '--color-accent-glow',
      `rgba(${r}, ${g}, ${b}, 0.15)`
    )
  }

  // Card Transparency & Glass Blur
  const preset = TRANSPARENCY_PRESETS.find(p => p.id === state.cardTransparency)
  if (preset) {
    document.documentElement.style.setProperty('--glass-blur', preset.blur || '16px')
    document.documentElement.style.setProperty('--glass-opacity', preset.opacity || '0.6')
  } else {
    document.documentElement.style.setProperty('--glass-blur', '16px')
    document.documentElement.style.setProperty('--glass-opacity', '0.6')
  }

  // Background Image Attribute
  if (state.backgroundImage) {
    document.body.setAttribute('data-has-background', 'true')
  } else {
    document.body.removeAttribute('data-has-background')
  }
}

// Initialize settings on load (Must be at the end to ensure all functions are defined)
if (typeof window !== 'undefined') {
  useSettingsStore.getState().loadSettings()
}
