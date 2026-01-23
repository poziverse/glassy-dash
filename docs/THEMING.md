# Theming System Specification

**Component Name:** Theming System  
**Locations:** `src/contexts/SettingsContext.jsx`, `src/themes.js`, `src/backgrounds.js`  
**Version:** 1.1.0  
**Last Updated:** January 20, 2026

---

## 1. Overview

The theming system provides comprehensive visual customization for Glass Keep, including dark/light modes, accent colors, custom backgrounds, and theme presets. The system is built on CSS variables for runtime theme switching.

### Purpose

- Support dark/light mode switching
- Provide multiple accent color options
- Enable custom background images
- Offer pre-configured theme presets
- Maintain accessibility and readability
- Ensure consistent visual language

---

## 2. Theme Architecture

### 2.1 CSS Variables

The theming system uses CSS custom properties (variables) defined on the `:root` element:

```css
:root {
  /* Accent Colors */
  --color-accent: #8b5cf6;
  --bg-accent: rgba(139, 92, 246, 0.1);
  --text-accent: #8b5cf6;

  /* Background */
  --bg-primary: rgba(255, 255, 255, 0.95);
  --bg-secondary: rgba(255, 255, 255, 0.7);
  --bg-tertiary: rgba(255, 255, 255, 0.5);

  /* Text Colors */
  --text-primary: #1f2937;
  --text-secondary: #4b5563;
  --text-tertiary: #9ca3af;

  /* Border Colors */
  --border-primary: rgba(0, 0, 0, 0.1);
  --border-secondary: rgba(0, 0, 0, 0.05);

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
}

/* Dark Mode Override */
:root.dark {
  --bg-primary: rgba(0, 0, 0, 0.9);
  --bg-secondary: rgba(0, 0, 0, 0.7);
  --bg-tertiary: rgba(0, 0, 0, 0.5);

  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-tertiary: #9ca3af;

  --border-primary: rgba(255, 255, 255, 0.1);
  --border-secondary: rgba(255, 255, 255, 0.05);
}
```

### 2.2 Theme State Management

```typescript
interface ThemeState {
  // Mode
  dark: boolean

  // Accent Color
  accentColor: AccentColor

  // Background
  backgroundImage: string | null | 'golden_gradient'

  // Preset
  themePreset: string | null

  // View Mode
  viewMode: 'grid' | 'list'

  // Compact Mode
  compactMode: boolean

  // Overlay Opacity
  overlayOpacity: number // 0.0 to 1.0

  // Card Transparency Preset
  cardTransparency: string
}

type AccentColor =
  | 'neon' // #8b5cf6 (purple)
  | 'rose' // #f43f5e (red)
  | 'emerald' // #10b981 (green)
  | 'amber' // #f59e0b (yellow)
  | 'cyan' // #06b6d4 (cyan)
  | 'violet' // #8b5cf6 (violet)
  | 'pink' // #ec4899 (pink)
```

---

## 3. Accent Colors

### 3.1 Color Palette

| Name    | Hex       | CSS Variable              | Tailwind Class  |
| ------- | --------- | ------------------------- | --------------- |
| Neon    | `#8b5cf6` | `--color-accent: #8b5cf6` | `bg-purple-500` |
| Rose    | `#f43f5e` | `--color-accent: #f43f5e` | `bg-red-500`    |
| Emerald | `#10b981` | `--color-accent: #10b981` | `bg-green-500`  |
| Amber   | `#f59e0b` | `--color-accent: #f59e0b` | `bg-yellow-500` |
| Cyan    | `#06b6d4` | `--color-accent: #06b6d4` | `bg-cyan-500`   |
| Violet  | `#8b5cf6` | `--color-accent: #8b5cf6` | `bg-violet-500` |
| Pink    | `#ec4899` | `--color-accent: #ec4899` | `bg-pink-500`   |

### 3.2 Color Implementation

```javascript
// src/themes.js
export const accentColors = {
  neon: {
    primary: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.1)',
    hover: 'rgba(139, 92, 246, 0.2)',
    text: '#8b5cf6',
    tailwind: 'purple'
  },
  rose: {
    primary: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.1)',
    hover: 'rgba(244, 63, 94, 0.2)',
    text: '#f43f5e',
    tailwind: 'red'
  },
  // ... other colors
};

export function setAccentColor(color) {
  const colors = accentColors[color];
  const root = document.documentElement;

  root.style.setProperty('--color-accent', colors.primary);
  root.style.setProperty('--bg-accent', colors.bg);
  root.style.setProperty('--text-accent', colors.text);

  // Update Tailwind class
  root.classList.remove('theme-neon', 'theme-rose', 'theme-emerald', ...);
  root.classList.add(`theme-${color}`);
}
```

---

## 4. Theme Presets

### 4.1 Predefined Presets

```javascript
export const themePresets = {
  neonTokyo: {
    name: 'Neon Tokyo',
    accent: 'rose',
    background: 'City-Night.png',
    dark: true,
    overlay: true,
    overlayOpacity: 0.85,
    transparencyId: 'frosted',
    description: 'Vibrant cyberpunk aesthetic with neon accents',
  },

  zenGarden: {
    name: 'Zen Garden',
    accent: 'emerald',
    background: 'Bonsai-Plant.png',
    dark: true,
    overlay: true,
    overlayOpacity: 0.7,
    transparencyId: 'medium',
    description: 'Peaceful nature theme with green accents',
  },
  goldenHour: {
    name: 'Golden Hour',
    accent: 'amber',
    background: 'Fantasy - Sunset.png',
    dark: false,
    overlay: true,
    overlayOpacity: 0.6,
    transparencyId: 'medium',
    description: 'Warm golden theme with amber accents',
  },

  deepSpace: {
    name: 'Deep Space',
    accent: 'indigo',
    background: null,
    dark: true,
    overlay: false,
    overlayOpacity: 0.85,
    transparencyId: 'medium',
    description: 'Classic dark theme with gradient background',
  },

  darkNature: {
    name: 'Dark Nature',
    accent: 'emerald',
    background: 'Dark_Nature.png',
    dark: true,
    overlay: true,
    overlayOpacity: 0.6,
    transparencyId: 'frosted',
    description: 'Deep forest tones with emerald accents',
  },

  etherealSilk: {
    name: 'Ethereal Silk',
    accent: 'violet',
    background: 'Nix Silk 06.png',
    dark: true,
    overlay: true,
    overlayOpacity: 0.4,
    transparencyId: 'airy',
    description: 'Soft, flowing silk texture with violet hues',
  },

  midnightBlue: {
    name: 'Midnight Blue',
    accent: 'sky',
    background: 'Nightfall-by-the-Lake.jpg',
    dark: true,
    overlay: true,
    overlayOpacity: 0.7,
    transparencyId: 'subtle',
    description: 'Calm lakeside night with sky blue accents',
  },

  urbanRain: {
    name: 'Urban Rain',
    accent: 'indigo',
    background: 'City-Rain.png',
    dark: true,
    overlay: true,
    overlayOpacity: 0.8,
    transparencyId: 'medium',
    description: 'Moody rainy city with deep indigo accents',
  },
}
/* Note: Presets now control Dark Mode, Card Transparency, and Overlay Opacity to ensure optimal visual combinations. */
```

### 4.2 Apply Preset

```javascript
export function applyThemePreset(presetName) {
  const preset = themePresets[presetName]

  // Apply comprehensive settings
  setDark(preset.dark)
  setAccentColor(preset.accent)
  setBackgroundImage(preset.background)
  setBackgroundOverlay(preset.overlay) // boolean
  setOverlayOpacity(preset.overlayOpacity) // number
  setCardTransparency(preset.transparencyId) // string
}
```

### 4.3 Transparency Levels

| ID          | Name         | Opacity | Description                            |
| ----------- | ------------ | ------- | -------------------------------------- |
| **Solid**   | Solid        | 0.95    | Nearly opaque, maximum legibility      |
| **Subtle**  | Subtle Glass | 0.75    | Slight transparency, professional look |
| **Medium**  | Medium Glass | 0.50    | Balanced glass effect (Default)        |
| **Frosted** | Frosted      | 0.30    | Stronger blur, distinct glass feel     |
| **Airy**    | Airy         | 0.12    | Highly transparent, ethereal look      |

---

## 5. Background System

### 5.1 Background Categories

```javascript
export const backgrounds = {
  desktop: {
    original: [
      'Anime-Girl-Night-Sky.jpg',
      'Anime-Girl5.png',
      'Balcony-ja.png',
      // ... more original backgrounds
    ],
    desktop: [
      // Optimized for desktop (1920x1080)
      'Anime-Girl-Night-Sky.jpg',
      'City-Night.png',
      'City-Rain.png',
      'Dreamscape-Wanderer.jpg',
      'Fantasy-Hongkong.png',
      'Nightfall-by-the-Lake.jpg',
      'Nix Silk 02.png',
      'Nix Silk 06.png',
      'Nix Silk 10.png',
      'Dark_Nature.png',
      'Dark-Anime-Girl-Wallpaper.png',
      'Dreamy-Aesthetic-Home-Under-Moonlight.png',
      'Fantasy - Sunset.png',
      'Celestial-Samurai.jpg',
      'Bonsai-Plant.png',
      'Concept-Japanese house.png',
      'Balcony-ja.png'
    ]
  },
  mobile: {
    // Optimized for mobile (1080x1920)
    'Anime-Girl-Night-Sky.jpg',
    'City-Night.png',
    'City-Rain.png',
    // ... same list, mobile optimized
  },
  xl: {
    // Ultra high resolution (4K)
    'Dreamscape-Wanderer.jpg',
    'Fantasy-Hongkong.png',
    'Nightfall-by-the-Lake.jpg'
    // ... select xl backgrounds
  }
};
/* Note: 'golden_gradient' is also a valid backgroundImage ID, rendering a CSS gradient. */
```

### 5.2 Background Loading

```javascript
export async function loadBackground(path) {
  const fullUrl = `/backgrounds/${path}`

  // Preload image
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(fullUrl)
    img.onerror = reject
    img.src = fullUrl
  })
}

export function setBackground(path) {
  const root = document.documentElement

  // Set as CSS variable
  root.style.setProperty('--background-image', `url(${path})`)

  // Or set as body background
  document.body.style.backgroundImage = `url(${path})`
  document.body.style.backgroundSize = 'cover'
  document.body.style.backgroundPosition = 'center'
  document.body.style.backgroundAttachment = 'fixed'
}
```

### 5.3 Theme Overlay

```css
/* Theme overlay for readability */
.theme-overlay {
  @apply absolute
         inset-0
         pointer-events-none;
}

.dark .theme-overlay {
  @apply bg-black/30;
}

.light .theme-overlay {
  @apply bg-white/20;
}

/* Glassmorphism effect */
.glass-panel {
  @apply bg-white/10
         backdrop-blur-lg
         border
         border-white/20;
}

.dark .glass-panel {
  @apply bg-black/30;
}
```

---

## 6. Settings Context Implementation

### 6.1 Context Provider

```jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { setAccentColor, setDark, setBackground } from '../themes'

const SettingsContext = createContext()

export function SettingsProvider({ children }) {
  const [state, setState] = useState(() => {
    // Load from localStorage
    return {
      dark: localStorage.getItem('dark') === 'true',
      accentColor: localStorage.getItem('accentColor') || 'neon',
      backgroundImage: localStorage.getItem('backgroundImage'),
      themePreset: localStorage.getItem('themePreset'),
      viewMode: localStorage.getItem('viewMode') || 'grid',
      compactMode: localStorage.getItem('compactMode') === 'true',
    }
  })

  // Apply theme on mount
  useEffect(() => {
    setDark(state.dark)
    setAccentColor(state.accentColor)
    if (state.backgroundImage) {
      setBackground(state.backgroundImage)
    }
  }, [])

  // Persist changes
  const updateSetting = (key, value) => {
    setState(prev => ({ ...prev, [key]: value }))
    localStorage.setItem(key, String(value))
  }

  return (
    <SettingsContext.Provider value={{ ...state, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  )
}
```

### 6.2 Context Methods

```javascript
export function useSettings() {
  const context = useContext(SettingsContext)

  return {
    // Getters
    dark: context.dark,
    accentColor: context.accentColor,
    backgroundImage: context.backgroundImage,
    themePreset: context.themePreset,
    viewMode: context.viewMode,
    compactMode: context.compactMode,

    // Actions
    toggleDark: () => {
      const newValue = !context.dark
      context.updateSetting('dark', newValue)
      setDark(newValue)
    },

    setAccentColor: color => {
      context.updateSetting('accentColor', color)
      setAccentColor(color)
    },

    setBackgroundImage: path => {
      context.updateSetting('backgroundImage', path)
      setBackground(path)
    },

    setThemePreset: preset => {
      const presetConfig = themePresets[preset]
      context.updateSetting('themePreset', preset)
      context.updateSetting('dark', presetConfig.dark)
      context.updateSetting('accentColor', presetConfig.accent)
      context.updateSetting('backgroundImage', presetConfig.background)
      setDark(presetConfig.dark)
      setAccentColor(presetConfig.accent)
      setBackground(presetConfig.background)
    },

    setViewMode: mode => {
      context.updateSetting('viewMode', mode)
    },

    toggleCompactMode: () => {
      const newValue = !context.compactMode
      context.updateSetting('compactMode', newValue)
    },
  }
}
```

---

## 7. Theme Switcher Component

### 7.1 Theme Switcher UI

```jsx
function ThemeSwitcher() {
  const { dark, toggleDark, accentColor, setAccentColor } = useSettings()

  return (
    <div className="theme-switcher">
      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDark}
        className="theme-toggle"
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Accent Color Picker */}
      <div className="accent-colors">
        {Object.keys(accentColors).map(color => (
          <button
            key={color}
            onClick={() => setAccentColor(color)}
            className={`color-btn ${accentColor === color ? 'active' : ''}`}
            style={{ backgroundColor: accentColors[color].primary }}
            aria-label={`Set ${color} accent color`}
          />
        ))}
      </div>

      {/* Background Selector */}
      <button onClick={() => setShowBackgroundPicker(true)}>
        <ImageIcon />
        <span>Background</span>
      </button>
    </div>
  )
}
```

### 7.2 Background Picker

```jsx
function BackgroundPicker() {
  const { backgroundImage, setBackgroundImage, dark } = useSettings()
  const [isOpen, setIsOpen] = useState(false)

  const categories = [
    { id: 'desktop', name: 'Desktop', backgrounds: backgrounds.desktop },
    { id: 'mobile', name: 'Mobile', backgrounds: backgrounds.mobile },
    { id: 'xl', name: '4K', backgrounds: backgrounds.xl },
  ]

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <div className="background-picker">
        {categories.map(category => (
          <div key={category.id}>
            <h3>{category.name}</h3>
            <div className="background-grid">
              {category.backgrounds.map(bg => (
                <button
                  key={bg}
                  onClick={() => {
                    setBackgroundImage(`/backgrounds/${category.id}/${bg}`)
                    setIsOpen(false)
                  }}
                  className={`background-thumb ${backgroundImage?.includes(bg) ? 'active' : ''}`}
                >
                  <img src={`/backgrounds/thumbs/${bg}`} alt={bg} />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Clear Background */}
        <button
          onClick={() => {
            setBackgroundImage(null)
            setIsOpen(false)
          }}
          className="clear-btn"
        >
          Clear Background
        </button>
      </div>
    </Modal>
  )
}
```

### 7.3 Theme Preset Selector

```jsx
function ThemePresetSelector() {
  const { setThemePreset } = useSettings()

  return (
    <div className="preset-selector">
      <h3>Theme Presets</h3>
      {Object.entries(themePresets).map(([key, preset]) => (
        <button key={key} onClick={() => setThemePreset(key)} className="preset-card">
          <img src={preset.background} alt={preset.name} className="preset-preview" />
          <div className="preset-info">
            <h4>{preset.name}</h4>
            <p>{preset.description}</p>
            <div className="preset-accent">
              <ColorDot color={preset.accent} />
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
```

---

## 8. Note Color Themes

### 8.1 Note Colors

```javascript
export const noteColors = {
  default: { name: 'Default', hex: '#e5e7eb' },
  blue: { name: 'Blue', hex: '#3b82f6' },
  green: { name: 'Green', hex: '#10b981' },
  red: { name: 'Red', hex: '#ef4444' },
  yellow: { name: 'Yellow', hex: '#f59e0b' },
  purple: { name: 'Purple', hex: '#8b5cf6' },
  pink: { name: 'Pink', hex: '#ec4899' },
  orange: { name: 'Orange', hex: '#f97316' },
}
```

### 8.2 Color Picker Component

```jsx
function NoteColorPicker({ currentColor, onColorChange }) {
  return (
    <div className="color-picker">
      {Object.entries(noteColors).map(([key, color]) => (
        <button
          key={key}
          onClick={() => onColorChange(key)}
          className={`color-option ${currentColor === key ? 'active' : ''}`}
          style={{ backgroundColor: color.hex }}
          aria-label={`Set ${color.name} color`}
        >
          {currentColor === key && <CheckIcon className="check-mark" />}
        </button>
      ))}
    </div>
  )
}
```

---

## 9. Responsive Theming

### 9.1 Mobile Optimization

```javascript
// Detect device type
const isMobile = window.innerWidth < 768
const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024

// Auto-select background category
export function getOptimalBackground() {
  if (isMobile) {
    return backgrounds.mobile[0]
  } else if (isTablet) {
    return backgrounds.desktop[0]
  } else {
    return backgrounds.xl[0]
  }
}
```

### 9.2 View Modes

```javascript
// Grid view: Masonry-style layout
const gridView = {
  columns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '1rem',
}

// List view: Single column layout
const listView = {
  columns: '1fr',
  gap: '0.5rem',
}

export function getViewModeStyles(mode) {
  return mode === 'grid' ? gridView : listView
}
```

---

## 10. Accessibility

### 10.1 Contrast Ratios

```javascript
// WCAG AA compliance: 4.5:1 contrast ratio
// WCAG AAA compliance: 7:1 contrast ratio

function checkContrast(foreground, background) {
  const fgL = getLuminance(foreground)
  const bgL = getLuminance(background)
  const ratio = (fgL + 0.05) / (bgL + 0.05)

  return {
    ratio,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
  }
}
```

### 10.2 Reduced Motion

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Performance Optimizations

### 11.1 Lazy Background Loading

```javascript
export function lazyLoadBackground(path) {
  // Use Intersection Observer
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadBackground(path)
          observer.disconnect()
        }
      })
    },
    { rootMargin: '100px' }
  )

  return observer
}
```

### 11.2 CSS Variable Updates

```javascript
// Batch CSS variable updates for performance
export function batchUpdateVariables(updates) {
  const root = document.documentElement

  requestAnimationFrame(() => {
    Object.entries(updates).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  })
}
```

---

## 12. Testing

### 12.1 Theme Tests

```jsx
describe('Theming System', () => {
  it('applies dark mode', () => {
    setDark(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('changes accent color', () => {
    setAccentColor('rose')
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-accent')
    expect(accent).toBe('#f43f5e')
  })

  it('sets background image', () => {
    setBackground('/backgrounds/desktop/City-Night.png')
    const bg = document.body.style.backgroundImage
    expect(bg).toContain('City-Night.png')
  })
})
```

### 12.2 Contrast Tests

```jsx
describe('Accessibility', () => {
  it('meets WCAG AA standards', () => {
    const contrast = checkContrast('#1f2937', '#ffffff')
    expect(contrast.passesAA).toBe(true)
  })

  it('respects reduced motion preference', () => {
    const root = document.documentElement
    root.classList.add('reduced-motion')

    const duration = getComputedStyle(document.body).getPropertyValue('animation-duration')
    expect(duration).toBe('0.01ms')
  })
})
```

---

## 13. Examples

### 13.1 Using Theme Context

```jsx
import { useSettings } from '../contexts'

function MyComponent() {
  const { dark, accentColor, toggleDark, setAccentColor } = useSettings()

  return (
    <div className={dark ? 'dark' : 'light'}>
      <button onClick={toggleDark}>{dark ? 'Light Mode' : 'Dark Mode'}</button>

      <div className={`accent-${accentColor}`}>Content with {accentColor} accent</div>
    </div>
  )
}
```

### 13.2 Custom Theme Component

```jsx
function CustomThemeSwitcher() {
  const { dark, accentColor, setAccentColor, toggleDark } = useSettings()

  return (
    <div className="custom-theme">
      {/* Custom toggle switch */}
      <div
        className={`toggle-switch ${dark ? 'on' : 'off'}`}
        onClick={toggleDark}
        role="switch"
        aria-checked={dark}
      >
        <div className="toggle-track">
          <div className="toggle-thumb" />
        </div>
      </div>

      {/* Custom color palette */}
      <div className="custom-palette">
        {customColors.map(color => (
          <div
            key={color.id}
            onClick={() => setAccentColor(color.id)}
            className="palette-swatch"
            style={{ backgroundColor: color.hex }}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 14. Known Issues & Limitations

### Current Limitations

1. Custom backgrounds not validated for file size
2. No user-uploaded background support
3. Limited to pre-defined theme presets
4. Color contrast not dynamically validated

### Future Enhancements

1. Allow user-uploaded custom backgrounds
2. Add more theme presets
3. Implement custom color picker (hex/rgb input)
4. Add gradient backgrounds
5. Support multiple accent colors
6. Theme marketplace/community themes

---

## 15. References

- [Component Specifications](../COMPONENT_SPECS.md)
- [SettingsContext](../src/contexts/SettingsContext.jsx)
- [Themes](../src/themes.js)
- [Backgrounds](../src/backgrounds.js)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Document Version:** 1.0.2  
**Last Updated:** January 18, 2026  
**Maintained By:** Development Team
