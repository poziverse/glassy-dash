const express = require('express')
const app = express()
app.get('/api/health', (req, res) => res.json({ ok: true }))
app.listen(8081, () => console.log('Simple server on 8081'))
