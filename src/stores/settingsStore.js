import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ACCENT_COLORS } from '../themes'

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
      localAiEnabled: false,
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
        // Apply to document
        if (newDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      setDark: dark => {
        set({ dark })
        // Apply to document
        if (dark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },

      setViewMode: mode => set({ viewMode: mode }),
      setListView: listView => set({ listView }),
      toggleListView: () => set(state => ({ listView: !state.listView })),

      setTheme: theme => {
        set({ theme })
        // Update CSS variable for theme
        document.documentElement.style.setProperty('--theme', theme)
      },

      setBackground: background => set({ background }),
      setBackgroundImage: backgroundImage => set({ backgroundImage }),
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

          return {
            customBackgrounds: state.customBackgrounds.filter(bg => bg.id !== id),
            backgroundImage: newBgImage,
          }
        })
      },

      setAccentColor: color => {
        set({ accentColor: color })
        // Update CSS variable for accent

        const theme = ACCENT_COLORS.find(c => c.id === color) || ACCENT_COLORS[0]
        document.documentElement.style.setProperty('--color-accent', theme.hex)
        document.documentElement.style.setProperty('--color-accent-hover', theme.hover)

        // Convert hex to rgba for glow effect
        const hex = theme.hex.replace('#', '')
        const r = parseInt(hex.substring(0, 2), 16)
        const g = parseInt(hex.substring(2, 4), 16)
        const b = parseInt(hex.substring(4, 6), 16)
        document.documentElement.style.setProperty(
          '--color-accent-glow',
          `rgba(${r}, ${g}, ${b}, 0.15)`
        )
      },

      setCardTransparency: cardTransparency => set({ cardTransparency }),
      setSidebarAlwaysVisible: sidebarAlwaysVisible => set({ sidebarAlwaysVisible }),
      setSidebarWidth: sidebarWidth => set({ sidebarWidth }),
      setLocalAiEnabled: localAiEnabled => set({ localAiEnabled }),
      setMusicSettings: settings =>
        set(state => ({
          musicSettings: { ...state.musicSettings, ...settings },
        })),

      // Atomic Theme Application (Prevents Flicker)
      applyThemePreset: preset => {
        const updates = {}
        if (preset.backgroundId !== undefined) updates.backgroundImage = preset.backgroundId
        if (preset.accentId !== undefined) updates.accentColor = preset.accentId
        if (preset.overlay !== undefined) updates.backgroundOverlay = preset.overlay
        if (preset.transparencyId !== undefined) updates.cardTransparency = preset.transparencyId
        if (typeof preset.darkMode === 'boolean') updates.dark = preset.darkMode
        if (typeof preset.overlayOpacity === 'number')
          updates.overlayOpacity = preset.overlayOpacity

        set(updates)

        // Apply side effects immediately
        const state = get() // Get updated state

        // Dark Mode
        if (state.dark) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')

        // Accent Color & CSS Vars
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
      },

      // Load saved settings into document
      loadSettings: () => {
        const { dark, theme, accentColor } = get()

        // Apply dark mode
        if (dark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }

        // Apply theme
        if (theme) {
          document.documentElement.style.setProperty('--theme', theme)
        }

        // Apply accent color
        if (accentColor) {
          document.documentElement.style.setProperty('--color-accent', accentColor)
        }
      },
    }),
    {
      name: 'glass-keep-settings',
    }
  )
)

// Initialize settings on load
if (typeof window !== 'undefined') {
  useSettingsStore.getState().loadSettings()
}
