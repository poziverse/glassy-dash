import React from 'react'
import { useSettings, useUI } from '../../contexts'
import { BACKGROUNDS } from '../../backgrounds'
import { ACCENT_COLORS, THEME_PRESETS, TRANSPARENCY_PRESETS } from '../../themes'
import { saveCustomBackground, deleteCustomBackground } from '../../utils/userStorage'
import { Plus, Trash2, X } from 'lucide-react'

export function AppearanceSettings() {
  const {
    dark,
    setDark,
    toggleDark,
    backgroundImage,
    setBackgroundImage,
    backgroundOverlay,
    setBackgroundOverlay,
    accentColor,
    setAccentColor,
    cardTransparency,
    setCardTransparency,

    overlayOpacity,
    setOverlayOpacity,
    customBackgrounds,
    addCustomBackground,
    removeCustomBackground,
    applyThemePreset,
  } = useSettings()

  const { showToast } = useUI()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Theme Presets */}
      <div>
        <h4 className="text-lg font-bold mb-4">Theme Presets</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {THEME_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => {
                const bg = BACKGROUNDS.find(b => b.id === preset.backgroundId)
                if (bg && bg.paths?.desktop) {
                  // Preload image to prevent flicker
                  const img = new Image()
                  img.src = bg.paths.desktop
                  img.onload = () => applyThemePreset(preset)
                  img.onerror = () => applyThemePreset(preset) // Fallback
                } else {
                  applyThemePreset(preset)
                }
              }}
              className="group relative h-24 rounded-lg overflow-hidden border border-[var(--border-light)] hover:border-accent transition-all hover:scale-[1.02] text-left shadow-sm"
            >
              <div className="absolute inset-0 flex">
                {preset.backgroundId ? (
                  <img
                    src={BACKGROUNDS.find(b => b.id === preset.backgroundId)?.paths?.thumb}
                    className="w-full h-full object-cover opacity-80"
                    alt={preset.name}
                    onError={e => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />
                )}
                {preset.overlay && <div className="absolute inset-0 bg-black/20" />}
              </div>
              <div className="absolute inset-0 p-2 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        ACCENT_COLORS.find(c => c.id === preset.accentId)?.hex || '#6366f1',
                    }}
                  />
                  {preset.name}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Workspace Background */}
      <div>
        <h4 className="text-lg font-bold mb-4">Workspace Background</h4>
        <div className="mb-4 flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-lg">
          <span className="text-sm font-medium">Overlay Theme</span>
          {backgroundImage && (
            <div className="flex items-center gap-4">
              {backgroundOverlay && (
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={e => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
                  title={`Opacity: ${Math.round(overlayOpacity * 100)}%`}
                />
              )}
              <button
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  backgroundOverlay ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                onClick={() => setBackgroundOverlay(!backgroundOverlay)}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    backgroundOverlay ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {/* Custom Uploads */}
          <label className="relative aspect-video rounded-lg overflow-hidden border-2 border-dashed border-[var(--border-light)] hover:border-accent flex flex-col items-center justify-center cursor-pointer transition-all bg-black/5 dark:bg-white/5 hover:bg-accent/5">
            <Plus className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-[10px] text-gray-500 font-medium">Upload</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return

                try {
                  const id = await saveCustomBackground(file)
                  addCustomBackground(id, file.name)
                  setBackgroundImage(`custom:${id}`)
                  showToast('Background uploaded successfully', 'success')
                } catch (err) {
                  console.error(err)
                  showToast(err.message, 'error')
                }
              }}
            />
          </label>

          {customBackgrounds.map(bg => (
            <div
              key={bg.id}
              className={`group relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                backgroundImage === `custom:${bg.id}` ? 'border-accent' : 'border-transparent'
              }`}
            >
              <CustomBackgroundPreview id={bg.id} />

              <div
                className="absolute inset-0 cursor-pointer"
                onClick={() => setBackgroundImage(`custom:${bg.id}`)}
              />

              <button
                className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"
                onClick={async e => {
                  e.stopPropagation()
                  try {
                    await deleteCustomBackground(bg.id)
                    removeCustomBackground(bg.id)
                    showToast('Background removed', 'success')
                  } catch (err) {
                    showToast('Failed to remove background', 'error')
                  }
                }}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          <button
            onClick={() => setBackgroundImage(null)}
            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
              !backgroundImage ? 'border-accent' : 'border-transparent'
            }`}
          >
            <div className="w-full h-full bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center text-xs text-white">
              Default
            </div>
          </button>
          {BACKGROUNDS.map(bg => (
            <button
              key={bg.id}
              onClick={() => setBackgroundImage(bg.id)}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all group ${
                backgroundImage === bg.id ? 'border-accent' : 'border-transparent'
              }`}
            >
              <img
                src={bg.paths.thumb}
                alt={bg.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <h4 className="text-md font-bold mb-3">Accent Color</h4>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map(color => (
            <button
              key={color.id}
              onClick={() => setAccentColor(color.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                accentColor === color.id
                  ? 'ring-2 ring-offset-2 ring-accent scale-110'
                  : 'opacity-80 hover:opacity-100 hover:scale-105'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {accentColor === color.id && <div className="w-2 h-2 bg-white rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Card Transparency */}
      <div>
        <h4 className="text-md font-bold mb-3">Card Transparency</h4>
        <div className="flex flex-wrap gap-2">
          {TRANSPARENCY_PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => setCardTransparency(preset.id)}
              className={`px-3 py-1.5 rounded border text-xs transition-all ${
                cardTransparency === preset.id
                  ? 'border-accent bg-accent/10 text-accent font-bold'
                  : 'border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function CustomBackgroundPreview({ id }) {
  const [url, setUrl] = React.useState(null)

  React.useEffect(() => {
    let active = true
    import('../../utils/userStorage').then(({ getCustomBackground }) => {
      getCustomBackground(id).then(blob => {
        if (active && blob) {
          setUrl(URL.createObjectURL(blob))
        }
      })
    })
    return () => (active = false)
  }, [id])

  if (!url) return <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />

  return <img src={url} alt="Custom background" className="w-full h-full object-cover" />
}
