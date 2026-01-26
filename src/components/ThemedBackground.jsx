import React, { useMemo, useState, useEffect } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { BACKGROUNDS } from '../backgrounds'

export default function ThemedBackground() {
  const dark = useSettingsStore(state => state.dark)
  const backgroundImage = useSettingsStore(state => state.backgroundImage)
  const backgroundOverlay = useSettingsStore(state => state.backgroundOverlay)
  const overlayOpacity = useSettingsStore(state => state.overlayOpacity)

  const currentBg = useMemo(
    () => BACKGROUNDS.find(b => b.id === backgroundImage),
    [backgroundImage]
  )

  return (
    <>
      {/* Golden Gradient Background */}
      {backgroundImage === 'golden_gradient' && (
        <div
          className="fixed inset-0 z-[-1] pointer-events-none animate-in fade-in duration-700"
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
                  ? `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.2), transparent 40%), linear-gradient(to bottom, #000000, #1a1a1a)` // Darker overlay for contrast
                  : `rgba(255, 255, 255, 0.2)`,
                overflow: 'hidden',
                opacity: overlayOpacity,
              }}
            />
          )}
        </div>
      )}

      {/* Custom or Regular Images */}
      {backgroundImage?.startsWith('custom:') ? (
        <CustomBackgroundRenderer
          id={backgroundImage.split(':')[1]}
          dark={dark}
          backgroundOverlay={backgroundOverlay}
          overlayOpacity={overlayOpacity}
        />
      ) : (
        currentBg &&
        backgroundImage !== 'golden_gradient' && (
          <div className="fixed inset-0 z-[-1] pointer-events-none">
            <img
              src={`/backgrounds/${currentBg.id}${currentBg.id.includes('.') ? '' : '.jpg'}`}
              className="w-full h-full object-cover animate-in fade-in duration-700"
              alt="Background"
            />
            {backgroundOverlay && (
              <div
                className="absolute inset-0 transition-opacity duration-700"
                style={{
                  background: dark
                    ? `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.2), transparent 40%), 
                        radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 40%),
                        linear-gradient(to bottom, #050505, #121212, #0a0a0a)`
                    : `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.15), transparent 25%), 
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
      )}
    </>
  )
}

function CustomBackgroundRenderer({ id, dark, backgroundOverlay, overlayOpacity }) {
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

  if (!url) return <div className="fixed inset-0 z-[-1] bg-black/90" />

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none">
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
              ? `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.2), transparent 40%), 
                  radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 40%),
                  linear-gradient(to bottom, #050505, #121212, #0a0a0a)`
              : `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.15), transparent 25%), 
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
