# Theming System Specification

**Component Name:** Theming System  
**Locations:** `src/stores/settingsStore.js`, `src/components/ThemedBackground.jsx`, `src/themes.js`, `src/backgrounds.js`, `src/index.css`  
**Version:** 2.1.0  
**Last Updated:** January 28, 2026  
**Status:** Fully Functional

---

## 1. Overview

The theming system provides comprehensive visual customization for GlassyDash, including dark/light modes, accent colors, custom backgrounds, and theme presets. The system uses CSS variables for runtime theme switching and is fully operational.

### Purpose

- Support dark/light mode switching (Defaulting to Dark Mode)
- Provide multiple accent color options
- Enable custom background images via IndexedDB
- Offer pre-configured theme presets
- Maintain accessibility and readability
- Ensure consistent visual language
- Support responsive background loading (desktop/mobile)

---

## 2. Theme Architecture

### 2.1 CSS Variables

The theming system uses CSS custom properties (variables) defined on the `:root` element. Recent updates have refined the glass effect variables.

```css
:root {
  color-scheme: dark;
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-surface: rgba(20, 20, 20, 0.6);
  --glass-surface-hover: rgba(30, 30, 30, 0.7);
  --neon-accent: #646cff;

  /* Default Accent (Indigo-600) */
  --color-accent: #6366f1;
  /* Default Accent Hover (Indigo-700) */
  --color-accent-hover: #4f46e5;
  /* Accent glow for box-shadows */
  --color-accent-glow: rgba(99, 102, 241, 0.15);

  /* Initial values, dynamically updated by JS */
  --glass-base: 10, 10, 12; /* DARK_COLORS.default matching */
  --glass-opacity: 0.45;
  --glass-blur: 20px;
}

.dark body {
  /* Ensure dark mode background persists */
  background:
    radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.2), transparent 40%),
    radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 40%),
    linear-gradient(to bottom, #050505, #121212, #0a0a0a);
}
```

### 2.2 Theme State Management (Zustand Store)

```typescript
interface ThemeState {
  // Mode
  dark: boolean

  // Accent Color
  accentColor: AccentColor

  // Background
  backgroundImage: string | null // Default: 'Bonsai-Plant.png'

  // View Mode
  viewMode: 'grid' | 'list'

  // Overlay Opacity
  overlayOpacity: number // Default: 0.6

  // Card Transparency Preset
  cardTransparency: string

  // Background Overlay
  backgroundOverlay: boolean

  // Custom Backgrounds
  customBackgrounds: Array<{ id: string; name: string; timestamp: number }>
}
```

**Store Location:** `src/stores/settingsStore.js`  
**Persistence:** `zustand/middleware` with localStorage

### 2.3 Custom Backgrounds (Fully Functional)

Custom backgrounds are implemented using a privacy-focused "Offline-First" approach:

1. **Storage**: Images stored in browser's **IndexedDB** via `src/utils/userStorage.js`
2. **Privacy**: No images uploaded to server. They stay on user's device
3. **Limits**: Max 5MB per file
4. **Rendering**: Images loaded as Blobs and rendered via `URL.createObjectURL`
5. **ID Format**: `custom:${uuid}` (e.g., `custom:550e8400-e29b-41d4-a716-4466554400000`)

### 2.4 Accent Colors

```typescript
type AccentColor =
  | 'neon' // #8b5cf6 (purple)
  | 'rose' // #f43f5e (red)
  | 'emerald' // #10b981 (green)
  | 'amber' // #f59e0b (yellow)
  | 'cyan' // #06b6d4 (cyan)
  | 'violet' // #8b5cf6 (violet)
  | 'pink' // #ec4899 (pink)
  | 'sky' // #0ea5e9 (blue)
  | 'indigo' // #6366f1 (indigo)
```

**Color Palette:**

| Name    | Hex       | Tailwind Class  |
| ------- | --------- | --------------- |
| Neon    | `#8b5cf6` | `bg-purple-500` |
| Rose    | `#f43f5e` | `bg-red-500`    |
| Emerald | `#10b981` | `bg-green-500`  |
| Amber   | `#f59e0b` | `bg-yellow-500` |
| Cyan    | `#06b6d4` | `bg-cyan-500`   |
| Violet  | `#8b5cf6` | `bg-violet-500` |
| Pink    | `#ec4899` | `bg-pink-500`   |
| Sky     | `#0ea5e9` | `bg-sky-500`    |
| Indigo  | `#6366f1` | `bg-indigo-500` |

---

## 3. Theme Presets

### 3.1 Predefined Presets

All theme presets now enforce dark mode for consistent glass aesthetics (Updated Jan 28, 2026).

| Preset         | Background                | Accent  | Transparency | Dark Mode |
| -------------- | ------------------------- | ------- | ------------ | --------- |
| Deep Space     | Gradient                  | Indigo  | Medium       | ✓         |
| Neon Tokyo     | City-Night.png            | Rose    | Frosted      | ✓         |
| **Zen Garden** | Bonsai-Plant.png          | Emerald | **Airy**     | ✓         |
| Golden Hour    | Fantasy - Sunset.png      | Amber   | Medium       | ✓         |
| Dark Nature    | Dark_Nature.png           | Emerald | Frosted      | ✓         |
| Ethereal Silk  | Nix Silk 06.png           | Violet  | Airy         | ✓         |
| Midnight Blue  | Nightfall-by-the-Lake.jpg | Sky     | Subtle       | ✓         |
| Urban Rain     | City-Rain.png             | Indigo  | Medium       | ✓         |
| Crystal Waters | Nix-Silk-10.png           | Cyan    | Airy         | ✓         |

**Key Definition (Example):**

```javascript
  neonTokyo: {
    name: 'Neon Tokyo',
    backgroundId: 'City-Night.png',
    accentId: 'rose',
    darkMode: true,
    overlay: true,
    overlayOpacity: 0.7,
    transparencyId: 'frosted',
    description: 'Vibrant cyberpunk aesthetic with neon accents',
  },
```

### 3.2 Transparency Levels (Recalibrated Jan 28, 2026)

Opacity and blur values have been adjusted for better visual balance:

| Preset      | Opacity | Blur | Visual Effect                          |
| ----------- | ------- | ---- | -------------------------------------- |
| **Solid**   | 0.85    | 4px  | Nearly opaque, maximum legibility      |
| **Subtle**  | 0.65    | 12px | Slight transparency, professional look |
| **Medium**  | 0.45    | 20px | Balanced glass effect (Default)        |
| **Frosted** | 0.30    | 28px | Strong blur, distinct glass feel       |
| **Airy**    | 0.20    | 16px | Highly transparent, ethereal look      |

### 3.3 Apply Preset Implementation

```javascript
// In settingsStore.js
applyThemePreset: preset => {
  const updates = {}

  // Apply all theme settings atomically
  if (preset.backgroundId !== undefined) updates.backgroundImage = preset.backgroundId
  if (preset.accentId !== undefined) updates.accentColor = preset.accentId
  if (preset.overlay !== undefined) updates.backgroundOverlay = preset.overlay
  if (preset.transparencyId !== undefined) updates.cardTransparency = preset.transparencyId
  if (typeof preset.darkMode === 'boolean') updates.dark = preset.darkMode
  if (typeof preset.overlayOpacity === 'number') updates.overlayOpacity = preset.overlayOpacity

  set(updates)

  // Side effects (CSS variable updates) are handled by the store subscription/loadSettings
}
```

---

## 4. Background System

### 4.1 Background Structure

**Location:** `src/backgrounds.js`

```javascript
export const BACKGROUNDS = [
  {
    id: 'Bonsai-Plant.png',
    name: 'Bonsai Plant',
    paths: {
      desktop: '/backgrounds/desktop/Bonsai-Plant.png',
      mobile: '/backgrounds/mobile/Bonsai-Plant.png',
      thumbs: '/backgrounds/thumbs/Bonsai-Plant.png',
    },
    tags: ['nature', 'peaceful', 'green'],
    aspectRatio: '16:9',
  },
  // ... 18 total backgrounds
]
```

**Responsive Sizes:** Desktop (1920x1080), Mobile (1080x1920), Thumbnails (320x180)

### 4.2 ThemedBackground Component

**Location:** `src/components/ThemedBackground.jsx`  
**Status:** Fully Functional

Renders the background image or gradient based on current settings. It handles:

- Responsive image selection (Mobile vs Desktop)
- Overlay rendering
- Custom background rendering

### 4.3 Responsive Image Selection

```javascript
// Select optimal image path based on screen size
const getOptimalPath = paths => {
  if (!paths) return null
  const isMobile = windowWidth < 768
  return isMobile ? paths.mobile : paths.desktop
}
```

**Breakpoints:**

- Mobile: < 768px width
- Desktop: >= 768px width

### 4.4 CSS Layering & Gradients

**Light Mode Gradient (Fixed Jan 28, 2026):**

```css
linear-gradient(to bottom, #dbeafe, #eff6ff, #f8fafc)
```

**Layer Stack:**

```
body (z-index: auto, background: transparent or gradient)
    > ThemedBackground (z-index: 0, has image)
        > App Content (z-index: 10+, has UI)
```

---

## 5. Accent Color System

### 5.1 Color Implementation

Styles are applied via CSS variables updated in `src/stores/settingsStore.js`.

```javascript
setAccentColor: color => {
  // ...
  document.documentElement.style.setProperty('--color-accent', theme.hex)
  document.documentElement.style.setProperty('--color-accent-hover', theme.hover)
  // ... glow calculation
}
```

### 5.2 Dark Mode Color Alignment

`DARK_COLORS.default` now matches the CSS `--glass-base` variable: `rgba(10, 10, 12, 0.6)`.

---

## 6. Glassmorphism Effects

### 6.1 Glass Card

Updated default fallback values to match "Medium Glass" preset (Jan 28, 2026):

```css
.glass-card {
  /* Dynamic Background with gradient hint using CSS vars */
  background: linear-gradient(
    145deg,
    rgba(var(--glass-base, 10, 10, 12), var(--glass-opacity, 0.45)) 0%,
    rgba(var(--glass-base, 10, 10, 12), calc(var(--glass-opacity, 0.45) * 0.4)) 100%
  );
  backdrop-filter: blur(var(--glass-blur, 20px));
  -webkit-backdrop-filter: blur(var(--glass-blur, 20px));

  /* Organic Border */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  border-left: 1px solid rgba(255, 255, 255, 0.12);

  /* Liquid Shadow */
  box-shadow:
    0 4px 24px -1px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.02) inset;
}

.glass-card:hover {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow:
    0 10px 40px -10px rgba(0, 0, 0, 0.5),
    0 0 20px -5px var(--color-accent-glow, rgba(99, 102, 241, 0.2));
}
```

### 6.2 Page Header Dynamic Glass

The page header now respects theme settings:

```css
.page-header-bottom .glass-card {
  background: linear-gradient(
    145deg,
    rgba(var(--glass-base), calc(var(--glass-opacity, 0.45) * 0.8)) 0%,
    rgba(var(--glass-base), calc(var(--glass-opacity, 0.45) * 0.3)) 100%
  );
}
```

---

## 7. Settings Store Methods

### 7.1 Background Management

```javascript
setBackgroundImage: backgroundImage => {
  set({ backgroundImage })
  // Update body attribute to control CSS gradient
  if (backgroundImage) {
    document.body.setAttribute('data-has-background', 'true')
  } else {
    document.body.removeAttribute('data-has-background')
  }
}
```

### 7.2 Custom Background Actions

Supports adding and removing custom backgrounds to `customBackgrounds` array and localStorage/IndexedDB.

---

## 8. Testing

### 8.1 Manual Testing

1. **Test Theme Presets:** Verify all presets (Zen Garden, Neon Tokyo, etc.) apply correctly with Dark Mode enabled.
2. **Test Background Images:** Verify responsive loading (Desktop vs Mobile).
3. **Test Accent Colors:** Verify UI accent updates.
4. **Test Transparency:** Move slider, check blur and opacity.
5. **Test Dark/Light Mode:** Toggle and check gradients.

---

## 9. Performance Optimizations

### 9.1 Window Resize Debouncing

Recommended: Debounce window resize events to avoid excessive re-renders.

### 9.2 Image Preloading

Recommended: Preload background images for smoother transitions.

---

## 10. References

- [Component Specifications](./COMPONENT_GUIDE.md)
- [Settings Store](../src/stores/settingsStore.js)
- [Themes](../src/themes.js)
