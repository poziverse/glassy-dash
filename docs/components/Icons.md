# Icons Component
**Last Updated:** January 21, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready

---

## Overview

`Icons` is a collection of SVG icon components used throughout the GlassKeep application. All icons are implemented as React components with consistent sizing and styling, supporting both outline and filled variants where applicable.

---

## Purpose

Provide consistent icon set with:
- SVG-based rendering
- Multiple size variants
- Outline and filled styles
- Stroke-based design
- Theme-aware colors
- Accessibility support
- Minimal bundle size

---

## Key Responsibilities

### 1. Icon Rendering
- SVG elements
- Consistent viewBox
- Responsive sizing
- Stroke-based design

### 2. Categories
- Navigation icons
- Action icons
- Formatting icons
- Note type icons
- Settings icons
- Theme icons

### 3. Consistency
- Uniform sizing
- Consistent stroke widths
- Common styling
- Reusable components

---

## Icon Categories

### 1. Navigation Icons

#### ArrowLeft
```javascript
export const ArrowLeft = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.75 19.5l-7.5-7.5 7.5-7.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Back navigation, previous page

#### ArrowRight
```javascript
export const ArrowRight = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.25 4.5l7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Forward navigation, next page

---

### 2. Action Icons

#### PinOutline
```javascript
export const PinOutline = () => (
  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.5V22H12.5V16H18V14L16,12Z" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Unpinned notes, pin button

#### PinFilled
```javascript
export const PinFilled = () => (
  <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="currentColor">
    <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.5V22H12.5V16H18V14L16,12Z" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Pinned notes, pin button

#### PinIcon
```javascript
export const PinIcon = () => (
  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.5V22H12.5V16H18V14L16,12Z" />
  </svg>
);
```

**Size:** 16px × 16px (w-4 h-4)  
**Usage:** Pin icon (smaller variant)

#### Trash
```javascript
export const Trash = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.109 1.02.17M4.772 5.79c.338-.061.678-.118 1.02-.17m12.456 0L18.16 19.24A2.25 2.25 0 0 1 15.916 21.5H8.084A2.25 2.25 0 0 1 5.84 19.24L4.772 5.79m12.456 0a48.108 48.108 0 0 0-12.456 0M10 5V4a2 2 0 1 1 4 0v1" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Delete note, trash view

#### CloseIcon
```javascript
export const CloseIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
  </svg>
);
```

**Size:** 24px × 24px (w-6 h-6)  
**Usage:** Close modals, panels, dismiss

#### DownloadIcon
```javascript
export const DownloadIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5m0 0l5-5m-5 5V3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Download files, export notes

#### Kebab
```javascript
export const Kebab = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Menu dots, more options

---

### 3. Formatting Icons

#### FormatIcon
```javascript
export const FormatIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
    <path strokeLinecap="round" d="M3 19h18M10 17V7l-3 8m10 2V7l-3 8" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Format toolbar button

#### Heading1
```javascript
export const Heading1 = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Heading 1 formatting

#### Heading2
```javascript
export const Heading2 = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="M21 18h-4a4 4 0 0 0 0-8h4" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Heading 2 formatting

#### Heading3
```javascript
export const Heading3 = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h8" />
    <path d="M4 18V6" />
    <path d="M12 18V6" />
    <path d="M17 18h-1a4 4 0 0 1-4-8h1" />
    <path d="M21 18h-2a4 4 0 0 1-4-8" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Heading 3 formatting

#### Bold
```javascript
export const Bold = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Bold text formatting

#### Italic
```javascript
export const Italic = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="4" x2="10" y2="4" />
    <line x1="14" y1="20" x2="5" y2="20" />
    <line x1="15" y1="4" x2="9" y2="20" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Italic text formatting

#### Strikethrough
```javascript
export const Strikethrough = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4H9a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h6" />
    <path d="M8 20h7a3 3 0 0 0 3-3v0a3 3 0 0 0-3-3H8" />
    <line x1="4" y1="12" x2="20" y2="12" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Strikethrough text formatting

#### InlineCode
```javascript
export const InlineCode = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Inline code formatting

#### CodeBlock
```javascript
export const CodeBlock = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 18l6-6-6-6" />
    <path d="M8 6l-6 6 6 6" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Code block formatting

#### Quote
```javascript
export const Quote = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Blockquote formatting

#### BulletList
```javascript
export const BulletList = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Bullet list formatting

#### NumberedList
```javascript
export const NumberedList = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <path d="M4 6h1v4" />
    <path d="M4 10h2" />
    <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    <path d="M4 12h1" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Numbered list formatting

#### Link
```javascript
export const Link = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Link formatting

---

### 4. Note Type Icons

#### Text
```javascript
export const Text = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 6.1H3" />
    <path d="M21 12.1H3" />
    <path d="M15.1 18H3" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Text note type

#### Checklist
```javascript
export const Checklist = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Checklist note type

#### DrawIcon
```javascript
export const DrawIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Drawing note type

---

### 5. Settings Icons

#### SettingsIcon
```javascript
export const SettingsIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
```

**Size:** 16px × 16px (w-4 h-4)  
**Usage:** Settings navigation, settings panel

#### ShieldIcon
```javascript
export const ShieldIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
```

**Size:** 16px × 16px (w-4 h-4)  
**Usage:** Admin panel, admin access

#### LogOutIcon
```javascript
export const LogOutIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
```

**Size:** 16px × 16px (w-4 h-4)  
**Usage:** Sign out, logout

---

### 6. Theme Icons

#### Sun (Large)
```javascript
export const Sun = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <line x1="12" y1="2" x2="12" y2="4" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="20" x2="12" y2="22" strokeWidth="2" strokeLinecap="round" />
    <line x1="20" y1="12" x2="22" y2="12" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="12" x2="4" y2="12" strokeWidth="2" strokeLinecap="round" />
    <line x1="17.657" y1="6.343" x2="18.364" y2="5.636" strokeWidth="2" strokeLinecap="round" />
    <line x1="5.636" y1="18.364" x2="6.343" y2="17.657" strokeWidth="2" strokeLinecap="round" />
    <line x1="17.657" y1="17.657" x2="18.364" y2="18.364" strokeWidth="2" strokeLinecap="round" />
    <line x1="5.636" y1="5.636" x2="6.343" y2="6.343" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="4" strokeWidth="2" />
  </svg>
);
```

**Size:** 24px × 24px (h-6 w-6)  
**Usage:** Light mode toggle (large)

#### Moon (Large)
```javascript
export const Moon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9 9 0 008.354-5.646z" />
  </svg>
);
```

**Size:** 24px × 24px (h-6 w-6)  
**Usage:** Dark mode toggle (large)

#### SunIcon (Small)
```javascript
export const SunIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
```

**Size:** 16px × 16px (w-4 h-4)  
**Usage:** Light mode toggle (small)

#### MoonIcon (Small)
```javascript
export const MoonIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9 9 0 008.354-5.646z" />
  </svg>
);
```

**Size:** 16px × 16px (w-4 h-4)  
**Usage:** Dark mode toggle (small)

---

### 7. View Toggle Icons

#### GridIcon
```javascript
export const GridIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);
```

**Size:** 16px × 16px (w-4 h-4)  
**Usage:** Grid view toggle

#### ListIcon
```javascript
export const ListIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);
```

**Size:** 16px × 16px (w-4 h-4)  
**Usage:** List view toggle

#### CheckSquareIcon
```javascript
export const CheckSquareIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
);
```

**Size:** 16px × 16px (w-4 h-4)  
**Usage:** Checkbox, selection

---

### 8. Media Icons

#### ImageIcon
```javascript
export const ImageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
    <path d="M8 11l2.5 3 3.5-4 4 5" />
    <circle cx="8" cy="8" r="1.5" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Image attachment, image note

#### GalleryIcon
```javascript
export const GalleryIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="8" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" />
    <rect x="13" y="13" width="8" height="8" rx="1" />
    <circle cx="6" cy="6" r="1" fill="currentColor" />
    <circle cx="16" cy="6" r="1" fill="currentColor" />
    <circle cx="6" cy="16" r="1" fill="currentColor" />
    <circle cx="16" cy="16" r="1" fill="currentColor" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** Gallery view, multiple images

#### ArchiveIcon
```javascript
export const ArchiveIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);
```

**Size:** 16px × 16px (w-4 h-4)  
**Usage:** Archive notes, archive view

---

### 9. Menu Icons

#### Hamburger
```javascript
export const Hamburger = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
```

**Size:** 24px × 24px (w-6 h-6)  
**Usage:** Mobile menu toggle

---

### 10. AI Icons

#### Sparkles
```javascript
export const Sparkles = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
```

**Size:** 20px × 20px (w-5 h-5)  
**Usage:** AI assistant, AI features

---

## Icon Sizes

### Size Classes

| Class | Width | Height | Usage |
|-------|--------|---------|-------|
| w-4 h-4 | 16px | 16px | Small icons (settings, views) |
| w-5 h-5 | 20px | 20px | Standard icons (actions, formatting) |
| h-6 w-6 | 24px | 24px | Large icons (close, menu) |

### Examples

```javascript
// Small (16px)
<svg className="w-4 h-4" />

// Standard (20px)
<svg className="w-5 h-5" />

// Large (24px)
<svg className="h-6 w-6" />
```

---

## Styling

### Stroke-Based Design

Most icons use stroke-based design:

```javascript
fill="none"
stroke="currentColor"
strokeWidth="1.5-2"
strokeLinecap="round"
strokeLinejoin="round"
```

**Benefits:**
- Consistent stroke width
- Rounded line ends and joins
- Theme-aware colors
- Lightweight SVG paths

### Fill-Based Design

Some icons use fill-based design:

```javascript
fill="currentColor"
```

**Examples:**
- PinFilled
- Kebab (menu dots)
- ArrowLeft, ArrowRight (with stroke)

---

## Accessibility

### ARIA Attributes

```javascript
aria-hidden="true"
```

**Usage:** Applied to decorative icons (e.g., Kebab)

### Semantic Use

Icons should be used within semantic elements:

```javascript
// Good
<button>
  <Trash />
  Delete
</button>

// Bad (without text)
<button>
  <Trash />
</button>
```

---

## Performance

### Optimizations

1. **Inline SVG**
   - No additional HTTP requests
   - Instant rendering
   - Minimal DOM

2. **Consistent viewBox**
   - All icons use 24×24 viewBox
   - Consistent coordinate system
   - Better caching

3. **Stroke-Based Paths**
   - Smaller file sizes
   - Faster parsing
   - Better compression

4. **No External Dependencies**
   - Self-contained components
   - No icon library
   - Tree-shakable

---

## Usage Examples

### Basic Usage

```javascript
import { Trash, PinOutline, SettingsIcon } from './components/Icons'

function NoteCard() {
  return (
    <div className="flex gap-2">
      <button onClick={pinNote}>
        <PinOutline />
      </button>
      <button onClick={deleteNote}>
        <Trash />
      </button>
      <button onClick={openSettings}>
        <SettingsIcon />
      </button>
    </div>
  )
}
```

### With Color Customization

```javascript
function ColoredIcon() {
  return (
    <div className="flex items-center gap-2">
      <Trash className="text-red-500" />
      <span>Delete</span>
    </div>
  )
}
```

### With Size Customization

```javascript
function SizedIcon() {
  return (
    <div>
      <SettingsIcon className="w-6 h-6" />
    </div>
  )
}
```

### In Toolbar

```javascript
import { Bold, Italic, Strikethrough, Link } from './components/Icons'

function FormatToolbar() {
  return (
    <div className="flex gap-1">
      <button onClick={formatBold}>
        <Bold />
      </button>
      <button onClick={formatItalic}>
        <Italic />
      </button>
      <button onClick={formatStrikethrough}>
        <Strikethrough />
      </button>
      <button onClick={insertLink}>
        <Link />
      </button>
    </div>
  )
}
```

---

## Testing

### Unit Tests

```javascript
describe('Icons Components', () => {
  it('should render PinOutline', () => {
    // Test icon rendering
  });
  
  it('should render Trash', () => {
    // Test icon rendering
  });
  
  it('should have correct viewBox', () => {
    // Test viewBox attribute
  });
  
  it('should have correct classes', () => {
    // Test size classes
  });
});
```

### Visual Regression Tests

```javascript
describe('Icons Visual Regression', () => {
  it('should match snapshot', () => {
    // Test icon snapshots
  });
});
```

---

## Troubleshooting

### Issue: Icon not showing

**Possible Causes:**
- Import error
- Component not exported
- CSS hiding icon

**Solutions:**
1. Verify import path
2. Check export statement
3. Inspect element visibility

---

### Issue: Wrong size

**Possible Causes:**
- Wrong size class
- CSS override
- Incorrect class

**Solutions:**
1. Check size class (w-4, w-5, w-6)
2. Verify Tailwind classes
3. Test with inline styles

---

### Issue: Wrong color

**Possible Causes:**
- stroke="currentColor" not working
- Parent color not set
- CSS override

**Solutions:**
1. Verify parent has color
2. Check currentColor usage
3. Test with explicit color

---

## Related Components

- [NoteCard](./NoteCard.md) - Note card (uses icons)
- [FormatToolbar](./FormatToolbar.md) - Format toolbar (uses icons)
- [Sidebar](./Sidebar.md) - Sidebar (uses icons)

---

## Dependencies

- `react` - React
- None (inline SVG icons)

---

## Best Practices

1. **Use semantic HTML elements** with icon labels
2. **Maintain consistent icon sizes** within same context
3. **Use stroke-based design** for consistency
4. **Provide text labels** for accessibility
5. **Use aria-hidden** for decorative icons
6. **Test icon visibility** in both themes
7. **Keep icon paths optimized** (minimal nodes)
8. **Use consistent stroke widths** (1.5-2)

---

## Icon Reference

### Complete Icon List

| Icon | Size | Category | Usage |
|------|-------|----------|-------|
| PinOutline | 20px | Action | Unpinned note |
| PinFilled | 20px | Action | Pinned note |
| PinIcon | 16px | Action | Pin (small) |
| Trash | 20px | Action | Delete, trash |
| CloseIcon | 24px | Action | Close modal |
| DownloadIcon | 20px | Action | Download |
| Kebab | 20px | Menu | More options |
| FormatIcon | 20px | Formatting | Format toolbar |
| Heading1 | 20px | Formatting | H1 |
| Heading2 | 20px | Formatting | H2 |
| Heading3 | 20px | Formatting | H3 |
| Bold | 20px | Formatting | Bold |
| Italic | 20px | Formatting | Italic |
| Strikethrough | 20px | Formatting | Strikethrough |
| InlineCode | 20px | Formatting | Inline code |
| CodeBlock | 20px | Formatting | Code block |
| Quote | 20px | Formatting | Blockquote |
| BulletList | 20px | Formatting | Bullet list |
| NumberedList | 20px | Formatting | Numbered list |
| Link | 20px | Formatting | Link |
| Text | 20px | Note Type | Text note |
| Checklist | 20px | Note Type | Checklist note |
| DrawIcon | 20px | Note Type | Drawing note |
| SettingsIcon | 16px | Settings | Settings |
| ShieldIcon | 16px | Settings | Admin |
| LogOutIcon | 16px | Settings | Sign out |
| Sun | 24px | Theme | Light mode (large) |
| Moon | 24px | Theme | Dark mode (large) |
| SunIcon | 16px | Theme | Light mode (small) |
| MoonIcon | 16px | Theme | Dark mode (small) |
| GridIcon | 16px | View | Grid view |
| ListIcon | 16px | View | List view |
| CheckSquareIcon | 16px | View | Checkbox |
| ArrowLeft | 20px | Navigation | Back |
| ArrowRight | 20px | Navigation | Forward |
| ImageIcon | 20px | Media | Image |
| GalleryIcon | 20px | Media | Gallery |
| ArchiveIcon | 16px | Media | Archive |
| Hamburger | 24px | Menu | Mobile menu |
| Sparkles | 20px | AI | AI features |

---

**Component Version:** 1.0  
**Last Updated:** January 21, 2026  
**Status:** ✅ Production Ready