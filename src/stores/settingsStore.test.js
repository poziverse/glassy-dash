import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSettingsStore, applyThemeVariables } from './settingsStore'

describe('settingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset state
    useSettingsStore.setState({
      dark: true,
      accentColor: 'emerald',
      cardTransparency: 'medium',
      backgroundImage: 'Bonsai-Plant.png',
      customBackgrounds: [],
      backgroundOverlay: true,
      overlayOpacity: 0.6,
    })

    // Reset document state
    document.documentElement.className = ''
    document.body.removeAttribute('data-has-background')

    // Spies
    vi.spyOn(document.documentElement.classList, 'add')
    vi.spyOn(document.documentElement.classList, 'remove')
    vi.spyOn(document.documentElement.style, 'setProperty')
    vi.spyOn(document.body, 'setAttribute')
    vi.spyOn(document.body, 'removeAttribute')
  })

  it('should toggle dark mode and apply variables', () => {
    const { toggleDark } = useSettingsStore.getState()

    toggleDark()
    expect(useSettingsStore.getState().dark).toBe(false)

    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark')
  })

  it('should set accent color and apply variables', () => {
    const { setAccentColor } = useSettingsStore.getState()

    setAccentColor('amber')
    expect(useSettingsStore.getState().accentColor).toBe('amber')

    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--color-accent',
      expect.any(String)
    )
  })

  it('should set background image and update body attribute', () => {
    const { setBackgroundImage } = useSettingsStore.getState()

    setBackgroundImage('test.jpg')
    expect(useSettingsStore.getState().backgroundImage).toBe('test.jpg')
    expect(document.body.setAttribute).toHaveBeenCalledWith('data-has-background', 'true')

    setBackgroundImage(null)
    expect(document.body.removeAttribute).toHaveBeenCalledWith('data-has-background')
  })

  it('should apply theme presets correctly', () => {
    const { applyThemePreset } = useSettingsStore.getState()

    const preset = {
      backgroundId: 'zen.jpg',
      accentId: 'violet',
      overlay: false,
      transparencyId: 'none',
      darkMode: true,
      overlayOpacity: 0.2,
    }

    applyThemePreset(preset)

    const state = useSettingsStore.getState()
    expect(state.backgroundImage).toBe('zen.jpg')
    expect(state.accentColor).toBe('violet')
    expect(state.backgroundOverlay).toBe(false)
    expect(state.cardTransparency).toBe('none')
    expect(state.dark).toBe(true)
    expect(state.overlayOpacity).toBe(0.2)
  })

  it('should handle custom background removal', () => {
    const { addCustomBackground, removeCustomBackground } = useSettingsStore.getState()

    addCustomBackground('bg1', 'My Background')
    useSettingsStore.setState({ backgroundImage: 'custom:bg1' })

    removeCustomBackground('bg1')

    const state = useSettingsStore.getState()
    expect(state.customBackgrounds).toHaveLength(0)
    expect(state.backgroundImage).toBeNull()
  })

  describe('applyThemeVariables', () => {
    it('should set correct transparency variables', () => {
      applyThemeVariables({ cardTransparency: 'frosted' })
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--glass-blur',
        '28px'
      )
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--glass-opacity',
        0.3
      )
    })
  })
})
