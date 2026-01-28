import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { BACKGROUNDS } from '../backgrounds'
import { ACCENT_COLORS } from '../themes'

export default function ThemedBackground() {
  const dark = useSettingsStore(state => state.dark)
  const backgroundImage = useSettingsStore(state => state.backgroundImage)
  const backgroundOverlay = useSettingsStore(state => state.backgroundOverlay)
  const overlayOpacity = useSettingsStore(state => state.overlayOpacity)
  const accentColor = useSettingsStore(state => state.accentColor)

  const currentAccent = ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0]
  const hex = currentAccent.hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const accentRgba = `rgba(${r}, ${g}, ${b}, 0.2)`
  const accentRgbaSubtle = `rgba(${r}, ${g}, ${b}, 0.15)`

  // Track window size for responsive images
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )

  // Responsive image selection
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const currentBg = useMemo(
    () => BACKGROUNDS.find(b => b.id === backgroundImage),
    [backgroundImage]
  )

  // Select optimal image path based on screen size
  const getOptimalPath = useCallback(
    paths => {
      if (!paths) return null
      const isMobile = windowWidth < 768
      return isMobile ? paths.mobile : paths.desktop
    },
    [windowWidth]
  )

  const optimalPath = useMemo(
    () => (currentBg ? getOptimalPath(currentBg.paths) : null),
    [currentBg, getOptimalPath]
  )

  return (
    <>
      {/* Golden Gradient Background */}
      {backgroundImage === 'golden_gradient' && (
        <div
          className="fixed inset-0 z-[0] pointer-events-none animate-in fade-in duration-700"
          style={{
            background: `
              radial-gradient(circle at 15% 50%, rgba(251, 191, 36, 0.2), transparent 30%),
              radial-gradient(circle at 85% 30%, rgba(253, 224, 71, 0.15), transparent 30%),
              linear-gradient(to bottom, #FFFBEB, #FEF3C7, #FDE68A)
            `,
          }}
        >
          {backgroundOverlay && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background: dark
                  ? `radial-gradient(circle at 15% 50%, ${accentRgba}, transparent 40%), linear-gradient(to bottom, #000000, #1a1a1a)`
                  : `rgba(255, 255, 255, 0.2)`,
                overflow: 'hidden',
                opacity: overlayOpacity,
              }}
            />
          )}
        </div>
      )}

      {/* Custom Backgrounds from IndexedDB */}
      {backgroundImage?.startsWith('custom:') && (
        <CustomBackgroundRenderer
          id={backgroundImage.split(':')[1]}
          dark={dark}
          backgroundOverlay={backgroundOverlay}
          overlayOpacity={overlayOpacity}
          accentRgba={accentRgba}
          accentRgbaSubtle={accentRgbaSubtle}
        />
      )}

      {/* Regular Background Images */}
      {!backgroundImage?.startsWith('custom:') &&
        backgroundImage !== 'golden_gradient' &&
        currentBg &&
        optimalPath && (
          <div className="fixed inset-0 z-[0] pointer-events-none">
            <img
              src={optimalPath}
              className="w-full h-full object-cover animate-in fade-in duration-700"
              alt="Background"
            />
            {backgroundOverlay && (
              <div
                className="absolute inset-0 transition-opacity duration-700"
                style={{
                  background: dark
                    ? `radial-gradient(circle at 15% 50%, ${accentRgba}, transparent 40%), 
                        radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 40%),
                        linear-gradient(to bottom, #050505, #121212, #0a0a0a)`
                    : `radial-gradient(circle at 15% 50%, ${accentRgbaSubtle}, transparent 25%), 
                        radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.1), transparent 25%),
                        linear-gradient(to bottom, #0f0c29, #302b63, #24243e)`,
                  overflow: 'hidden',
                  opacity: overlayOpacity,
                }}
              />
            )}
            {dark && !backgroundOverlay && <div className="absolute inset-0 bg-black/40" />}
          </div>
        )}

      {/* Default Gradient (when no background set) */}
      {!backgroundImage && (
        <div
          className="fixed inset-0 z-[0] pointer-events-none"
          style={{
            background: dark
              ? `radial-gradient(circle at 15% 50%, ${accentRgba}, transparent 40%),
                   radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 40%),
                   linear-gradient(to bottom, #050505, #121212, #0a0a0a)`
              : `radial-gradient(circle at 15% 50%, ${accentRgbaSubtle}, transparent 25%),
                   radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.1), transparent 25%),
                   linear-gradient(to bottom, #dbeafe, #eff6ff, #f8fafc)`,
          }}
        />
      )}
    </>
  )
}

function CustomBackgroundRenderer({
  id,
  dark,
  backgroundOverlay,
  overlayOpacity,
  accentRgba,
  accentRgbaSubtle,
}) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let active = true
    import('../utils/userStorage').then(({ getCustomBackground }) => {
      getCustomBackground(id).then(blob => {
        if (active && blob) {
          setUrl(URL.createObjectURL(blob))
        }
      })
    })
    return () => (active = false)
  }, [id])

  if (!url) return <div className="fixed inset-0 z-[0] bg-black/90" />

  return (
    <div className="fixed inset-0 z-[0] pointer-events-none">
      <img
        src={url}
        alt="Custom Background"
        className="w-full h-full object-cover animate-in fade-in duration-700"
      />
      {backgroundOverlay && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background: dark
              ? `radial-gradient(circle at 15% 50%, ${accentRgba}, transparent 40%), 
                    radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 40%),
                    linear-gradient(to bottom, #050505, #121212, #0a0a0a)`
              : `radial-gradient(circle at 15% 50%, ${accentRgbaSubtle}, transparent 25%), 
                    radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.1), transparent 25%),
                    linear-gradient(to bottom, #0f0c29, #302b63, #24243e)`,
            overflow: 'hidden',
            opacity: overlayOpacity,
          }}
        />
      )}
      {dark && !backgroundOverlay && <div className="absolute inset-0 bg-black/40" />}
    </div>
  )
}
