import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ACCENT_COLORS } from '../themes'

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Initial state
      dark: false,
      viewMode: 'grid',
      theme: 'default',
      background: 'default',
      accentColor: 'indigo',
      backgroundImage: null,
      backgroundOverlay: false,
      overlayOpacity: 0.85,
      cardTransparency: 'medium',
      sidebarAlwaysVisible: false,
      sidebarWidth: 288,
      localAiEnabled: false,
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
