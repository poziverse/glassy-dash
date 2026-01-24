const express = require('express')
// Native fetch is available in Node 18+. If missing, we might need 'node-fetch' but let's assume environment is standard.
// If fetch is not defined, we can try to require it if package exists, but usually global fetch is present.

const router = express.Router()

// Simple in-memory cache for icons
const iconCache = new Map()

// Helper to inject attributes into SVG string
function customizeSvg(svg, { color, size, stroke, fill }) {
  let result = svg

  // Inject width/height if size provided
  if (size) {
    result = result.replace(/width="[^"]*"/, `width="${size}"`)
    result = result.replace(/height="[^"]*"/, `height="${size}"`)
  }

  // Inject color (stroke or fill depending on icon type)
  // Lucide uses stroke. Filled icons use fill.
  if (color) {
    // Replace existing stroke if it's not "none"
    result = result.replace(/stroke="[^"]*"/g, match => {
      return match.includes('none') ? match : `stroke="${color}"`
    })
    // Replace distinct fill colors (rare in Lucide unless defined)
    // For solid icons, we might want to set fill.
    if (fill === 'true' || fill === true) {
      result = result.replace(/fill="none"/, `fill="${color}"`)
    }
  }

  if (stroke) {
    result = result.replace(/stroke-width="[^"]*"/, `stroke-width="${stroke}"`)
  }

  return result
}

// Helper to create gradient
function createGradientSvg(svg, id, colors) {
  const gradientId = `grad-${id}-${Date.now()}`
  const defs = `
    <defs>
      <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colors[0] || '#ec4899'}" />
        <stop offset="100%" stop-color="${colors[1] || '#8b5cf6'}" />
      </linearGradient>
    </defs>
  `

  // Insert defs after <svg ...>
  let result = svg.replace('>', `>${defs}`)

  // Apply gradient to stroke (for line icons) or fill
  // For Lucide (line icons), apply to stroke
  result = result.replace(/stroke="[^"]*"/g, match => {
    return match.includes('none') ? match : `stroke="url(#${gradientId})"`
  })

  return result
}

router.get('/:collection/:name', async (req, res) => {
  const { collection, name } = req.params
  const { color, size = '24', stroke = '2', type } = req.query // type=gradient

  // Clean inputs
  // Remove 'Icon' suffix if present (common in Lucide React exports)
  // Convert CamelCase to kebab-case for unpkg (e.g. AirVent -> air-vent)
  const cleanName = name
    .replace(/\.svg$/, '')
    .replace(/Icon$/, '')
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/^-/, '') // Remove leading dash from result

  const cacheKey = `${collection}:${cleanName}`

  try {
    let svgRaw

    // 1. Check Cache
    if (iconCache.has(cacheKey)) {
      svgRaw = iconCache.get(cacheKey)
    } else {
      // 2. Fetch from source
      let url
      if (collection === 'lucide') {
        url = `https://unpkg.com/lucide-static@latest/icons/${cleanName}.svg`
      } else {
        return res.status(400).send('Unknown collection')
      }

      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 404) return res.status(404).send('Icon not found')
        throw new Error('Upstream error')
      }

      svgRaw = await response.text()

      // Cache the RAW svg
      if (iconCache.size > 1000) iconCache.clear() // Simple eviction
      iconCache.set(cacheKey, svgRaw)
    }

    // 3. Customize
    let finalSvg = customizeSvg(svgRaw, { color, size, stroke })

    // 4. Advanced Effects
    if (type === 'gradient') {
      // Example gradient colors (pink to violet default)
      const colors = req.query.colors ? req.query.colors.split(',') : ['#ec4899', '#8b5cf6']
      finalSvg = createGradientSvg(finalSvg, cleanName, colors)
    }

    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable') // Cache aggressively on client
    res.send(finalSvg)
  } catch (err) {
    console.error('Icon Proxy Error:', err)
    res.status(500).send('Internal Server Error')
  }
})

module.exports = router
