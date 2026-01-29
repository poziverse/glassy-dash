const API_URL = 'http://localhost:8080/api'

async function run() {
  console.log('--- AI Empty Response Reproduction ---')

  // 1. Register/Login Temp User
  const userEmail = `ai_test_${Date.now()}@example.com`
  const userPass = 'password123'

  const regRes = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'AI Tester', email: userEmail, password: userPass }),
  })

  let token
  if (regRes.ok) {
    token = (await regRes.json()).token
  } else {
    // Login fallback
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, password: userPass }),
    })
    if (!loginRes.ok) throw new Error('Failed to login')
    token = (await loginRes.json()).token
  }

  // 2. Ask AI Question
  console.log('Asking AI: "Hello"')
  const res = await fetch(`${API_URL}/ai/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      question: 'Hello',
      options: { temperature: 0.7 },
    }),
  })

  if (res.ok) {
    const data = await res.json()
    console.log('Response Status:', res.status)
    console.log('Response Data:', JSON.stringify(data, null, 2))

    if (!data.answer) {
      console.log('❌ FAIL: Answer is missing or empty')
    } else {
      console.log('✅ SUCCESS: Answer received')
    }
  } else {
    console.error('❌ Request Failed:', res.status, await res.text())
  }
}

run().catch(console.error)
