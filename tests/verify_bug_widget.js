const BASE_URL = 'http://localhost:3001' // Assuming direct API access or 5173 proxy? Index.js is 3001.
// If using 5173, path is /api/...
// Let's use 3001 direct to test API logic.

async function run() {
  try {
    console.log('1. Logging in as Admin...')
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin', password: 'admin' }),
    })

    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`)
    const { token, user } = await loginRes.json()
    console.log('✓ Logged in as:', user.email)

    console.log('2. Creating Bug Report...')
    const reportData = {
      description: 'Automated Test Bug',
      email: 'tester@example.com',
      metadata: { userAgent: 'NodeTest', screen: '0x0' },
    }
    const createRes = await fetch(`${BASE_URL}/api/bug-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reportData),
    })

    if (!createRes.ok) throw new Error(`Create failed: ${createRes.status}`)
    const { id } = await createRes.json()
    console.log('✓ Only created report ID:', id)

    console.log('3. Listing Reports (Admin)...')
    const listRes = await fetch(`${BASE_URL}/api/bug-reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!listRes.ok) throw new Error(`List failed: ${listRes.status}`)
    const reports = await listRes.json()
    const found = reports.find(r => r.id === id)

    if (!found) throw new Error('Report not found in list')
    if (found.description !== 'Automated Test Bug') throw new Error('Description mismatch')
    console.log('✓ Report verified in list')

    console.log('4. Updating Status...')
    const patchRes = await fetch(`${BASE_URL}/api/bug-reports/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'resolved' }),
    })
    if (!patchRes.ok) throw new Error(`Patch failed: ${patchRes.status}`)
    console.log('✓ Status updated to resolved')

    console.log('5. Deleting Report...')
    const delRes = await fetch(`${BASE_URL}/api/bug-reports/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!delRes.ok) throw new Error(`Delete failed: ${delRes.status}`)
    console.log('✓ Report deleted')

    console.log('SUCCESS: All API tests passed.')
  } catch (err) {
    console.error('FAILED:', err.message)
    process.exit(1)
  }
}

run()
