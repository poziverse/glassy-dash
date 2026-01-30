import http from 'http'
// Using built-in fetch

// Configuration
const API_URL = 'http://localhost:8080/api/music'
const MOCK_PORT = 3456

// Mock Upstream Server
const mockServer = http.createServer((req, res) => {
  // CORS for the proxy to hit it
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.url === '/lyrics.lrc') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('[00:01.00] Hello World\n[00:05.00] Test Lyrics')
  } else if (req.url === '/song.mp3') {
    const range = req.headers.range
    if (range) {
      res.writeHead(206, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': '10',
        'Content-Range': 'bytes 0-9/100',
        'Accept-Ranges': 'bytes',
      })
      res.end('1234567890')
    } else {
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes',
      })
      res.end('fullsongcontent')
    }
  } else if (req.url === '/api/helpers/system') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ version: '1.0.0' }))
  } else {
    res.writeHead(404)
    res.end()
  }
})

async function runTests() {
  console.log('Starting Music API Tests...')

  // 1. Test Proxy Text (Lyrics)
  try {
    const target = `http://localhost:${MOCK_PORT}/lyrics.lrc`
    const res = await fetch(`${API_URL}/proxy?url=${encodeURIComponent(target)}`)
    const text = await res.text()

    if (res.ok && text.includes('Hello World')) {
      console.log('✅ /proxy handled text/plain correctly')
    } else {
      console.error('❌ /proxy failed text test', res.status, text)
    }
  } catch (e) {
    console.error('❌ /proxy test error', e.message)
  }

  // 2. Test Stream Headers
  try {
    const target = `http://localhost:${MOCK_PORT}/song.mp3`
    // Pass range header to verify proxy forwarding
    const res = await fetch(`${API_URL}/stream?url=${encodeURIComponent(target)}`, {
      headers: { Range: 'bytes=0-9' },
    })

    if (res.ok && res.status === 206 && res.headers.get('content-range')) {
      console.log('✅ /stream handled Range header (206 Partial Content)')
    } else {
      console.error('❌ /stream failed Range test', res.status, res.headers.get('content-range'))
    }
  } catch (e) {
    console.error('❌ /stream test error', e.message)
  }

  // 3. Test Connection (Swing Music)
  try {
    const body = {
      service: 'swingmusic',
      serverUrl: `http://localhost:${MOCK_PORT}`,
      credentials: {},
    }
    const res = await fetch(`${API_URL}/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      console.log('✅ /test-connection verified Swing Music')
    } else {
      console.error('❌ /test-connection failed for Swing Music', data)
    }
  } catch (e) {
    console.error('❌ /test-connection error', e.message)
  }
}

// Start mock server and run tests
mockServer.listen(MOCK_PORT, async () => {
  console.log(`Mock server running on ${MOCK_PORT}`)
  await runTests()
  mockServer.close()
  console.log('Tests completed.')
})
