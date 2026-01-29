const API_URL = 'http://localhost:8080/api'

async function run() {
  console.log('--- AI Status Check ---')

  // 1. Register Temp User for Token
  const userEmail = `ai_check_${Date.now()}@example.com`
  const userPass = 'password123'

  const regRes = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'AI Checker', email: userEmail, password: userPass }),
  })

  let token
  if (regRes.ok) {
    const userData = await regRes.json()
    token = userData.token
  } else {
    console.error('Failed to register user for check:', await regRes.text())
    return
  }

  // 2. Check AI Status
  console.log('\nChecking /api/ai/status...')
  const statusRes = await fetch(`${API_URL}/ai/status`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (statusRes.ok) {
    const data = await statusRes.json()
    console.log('✅ Status OK')
    console.log('Providers:', data.providers)
    console.log('Metrics:', data.metrics)
  } else {
    console.error('❌ Status Failed:', statusRes.status, await statusRes.text())
  }

  // 3. Check AI Health
  console.log('\nChecking /api/ai/health...')
  const healthRes = await fetch(`${API_URL}/ai/health`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (healthRes.ok) {
    const data = await healthRes.json()
    console.log('✅ Health OK')
    console.log('Providers Health:', JSON.stringify(data.providers, null, 2))
  } else {
    console.error('❌ Health Failed:', healthRes.status, await healthRes.text())
  }
}

run().catch(console.error)
