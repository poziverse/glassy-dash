// server/test_db.js
const Database = require('./db')
const path = require('path')

async function runTest() {
  const dbFile = path.join(__dirname, '..', 'data', 'test_async.db')
  const db = new Database(dbFile)

  try {
    console.log('Testing async wrapper...')

    await db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER, name TEXT)')

    const stmt = db.prepare('INSERT INTO test (id, name) VALUES (?, ?)')
    await stmt.run(1, 'Test Item')

    const rows = await db.prepare('SELECT * FROM test').all()
    console.log('Rows:', rows)

    const row = await db.prepare('SELECT * FROM test WHERE id = ?').get(1)
    console.log('Single Row:', row)

    await db.close()
    console.log('Test complete.')
  } catch (err) {
    console.error('Test failed:', err)
  }
}

runTest()
