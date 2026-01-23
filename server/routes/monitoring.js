const express = require('express')
const router = express.Router()
const {
  getMemoryStats,
  checkMemory,
  getPerformanceStats,
  cache,
} = require('../middleware/performance')
const { getLogStats } = require('../utils/logger')
const { runMigrations, getMigrations } = require('../migrations')
const Database = require('../db')
const path = require('path')

const DB_PATH = process.env.DB_FILE || path.join(__dirname, '../../data/notes.db')

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      cache: checkCache(),
      memory: checkMemoryHealth(),
      diskSpace: await checkDiskSpace(),
    },
  }

  // Determine overall status
  const allHealthy = Object.values(healthCheck.checks).every(check => check.status === 'healthy')

  if (!allHealthy) {
    healthCheck.status = 'degraded'
    return res.status(503).json(healthCheck)
  }

  res.json(healthCheck)
})

/**
 * Check database health
 */
async function checkDatabase() {
  try {
    const db = new Database(DB_PATH, { readonly: true, timeout: 5000 })

    // Test query
    await db.prepare('SELECT 1').get()

    // Check table count
    const tables = await db
      .prepare(
        `
      SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'
    `
      )
      .get()

    await db.close()

    return {
      status: 'healthy',
      tables: tables ? tables.count : 0,
      message: 'Database is accessible',
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
    }
  }
}

/**
 * Check cache health
 */
function checkCache() {
  return {
    status: 'healthy',
    size: cache.size(),
    message: 'Cache is operational',
  }
}

/**
 * Check disk space
 */
async function checkDiskSpace() {
  try {
    const fs = require('fs')
    const stats = fs.statSync(DB_PATH)
    const dbSize = stats.size
    const dbSizeMB = (dbSize / (1024 * 1024)).toFixed(2)

    // Simple check - in production, use diskusage package
    return {
      status: 'healthy',
      databaseSize: `${dbSizeMB} MB`,
      message: 'Disk space is adequate',
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error.message,
    }
  }
}

/**
 * Check memory health
 */
function checkMemoryHealth() {
  const stats = getMemoryStats()
  const isHealthy = stats.heapUsedPercentage < 90

  return {
    status: isHealthy ? 'healthy' : 'degraded',
    ...stats,
    message: isHealthy
      ? 'Memory usage is within normal limits'
      : `Memory usage high: ${stats.heapUsedPercentage}%`,
  }
}

// ============================================================================
// READY ENDPOINT
// ============================================================================

/**
 * Ready check endpoint (for Kubernetes health checks)
 * GET /ready
 */
router.get('/ready', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
  }

  const isReady = Object.values(checks).every(check => check.status === 'healthy')

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    checks,
    timestamp: new Date().toISOString(),
  })
})

// ============================================================================
// METRICS ENDPOINT
// ============================================================================

/**
 * Metrics endpoint
 * GET /metrics
 */
router.get('/metrics', async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      memory: getMemoryStats(),
      cpu: getCpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    },
    performance: getPerformanceStats(),
    cache: {
      size: cache.size(),
    },
    logs: getLogStats(),
    database: await getDatabaseStats(),
  }

  res.json(metrics)
})

/**
 * Get CPU usage
 */
function getCpuUsage() {
  const cpus = require('os').cpus()
  const cpuUsage = process.cpuUsage()

  return {
    user: cpuUsage.user / 1000000, // Convert to seconds
    system: cpuUsage.system / 1000000, // Convert to seconds
    cores: cpus.length,
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  try {
    const db = new Database(DB_PATH, { readonly: true })

    const userCountRow = await db.prepare('SELECT COUNT(*) as count FROM users').get()
    const noteCountRow = await db.prepare('SELECT COUNT(*) as count FROM notes').get()

    // Check if these tables exist before querying
    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    const tableSet = new Set(tables.map(t => t.name))

    let checklistCount = 0
    if (tableSet.has('checklist_items')) {
      const row = await db.prepare('SELECT COUNT(*) as count FROM checklist_items').get()
      checklistCount = row ? row.count : 0
    }

    let collaboratorCount = 0
    if (tableSet.has('note_collaborators')) {
      const row = await db.prepare('SELECT COUNT(*) as count FROM note_collaborators').get()
      collaboratorCount = row ? row.count : 0
    }

    const pageCountResult = await db.pragma('page_count')
    const pageSizeResult = await db.pragma('page_size')

    const dbStats = pageCountResult ? pageCountResult.page_count : 0
    const pageSize = pageSizeResult ? pageSizeResult.page_size : 0
    const dbSize = dbStats * pageSize
    const dbSizeMB = (dbSize / (1024 * 1024)).toFixed(2)

    await db.close()

    return {
      users: userCountRow ? userCountRow.count : 0,
      notes: noteCountRow ? noteCountRow.count : 0,
      checklistItems: checklistCount,
      collaborators: collaboratorCount,
      size: `${dbSizeMB} MB`,
    }
  } catch (error) {
    return {
      error: error.message,
    }
  }
}

// ============================================================================
// PROMETHEUS METRICS ENDPOINT
// ============================================================================

/**
 * Prometheus-style metrics endpoint
 * GET /metrics/prometheus
 */
router.get('/metrics/prometheus', async (req, res) => {
  const stats = getPerformanceStats()
  const dbStats = await getDatabaseStats()

  const metrics = `
# HELP GLASSYDASH_request_count_total Total number of requests
# TYPE GLASSYDASH_request_count_total counter
GLASSYDASH_request_count_total ${stats.requests.count}

# HELP GLASSYDASH_request_duration_ms Average request duration in milliseconds
# TYPE GLASSYDASH_request_duration_ms gauge
GLASSYDASH_request_duration_ms ${stats.requests.avgDuration}

# HELP GLASSYDASH_database_query_count_total Total number of database queries
# TYPE GLASSYDASH_database_query_count_total counter
GLASSYDASH_database_query_count_total ${stats.database.count}

# HELP GLASSYDASH_database_query_duration_ms Average database query duration in milliseconds
# TYPE GLASSYDASH_database_query_duration_ms gauge
GLASSYDASH_database_query_duration_ms ${stats.database.avgDuration}

# HELP GLASSYDASH_ai_operation_count_total Total number of AI operations
# TYPE GLASSYDASH_ai_operation_count_total counter
GLASSYDASH_ai_operation_count_total ${stats.ai.count}

# HELP GLASSYDASH_ai_operation_duration_ms Average AI operation duration in milliseconds
# TYPE GLASSYDASH_ai_operation_duration_ms gauge
GLASSYDASH_ai_operation_duration_ms ${stats.ai.avgDuration}

# HELP GLASSYDASH_cache_size Current cache size
# TYPE GLASSYDASH_cache_size gauge
GLASSYDASH_cache_size ${cache.size()}

# HELP GLASSYDASH_memory_heap_used_bytes Heap memory used in bytes
# TYPE GLASSYDASH_memory_heap_used_bytes gauge
GLASSYDASH_memory_heap_used_bytes ${process.memoryUsage().heapUsed}

# HELP GLASSYDASH_memory_heap_total_bytes Total heap memory in bytes
# TYPE GLASSYDASH_memory_heap_total_bytes gauge
GLASSYDASH_memory_heap_total_bytes ${process.memoryUsage().heapTotal}

# HELP GLASSYDASH_uptime_seconds Application uptime in seconds
# TYPE GLASSYDASH_uptime_seconds gauge
GLASSYDASH_uptime_seconds ${process.uptime()}
`.trim()

  res.set('Content-Type', 'text/plain')
  res.send(metrics)
})

// ============================================================================
// INFO ENDPOINT
// ============================================================================

/**
 * Application info endpoint
 * GET /info
 */
router.get('/info', (req, res) => {
  res.json({
    name: 'GlassKeep',
    version: process.env.npm_package_version || '1.0.2',
    description: 'Secure, real-time note-taking application',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    features: [
      'Real-time collaboration',
      'AI-powered features',
      'Multiple note types',
      'Drawing support',
      'End-to-end encryption',
      'Mobile responsive',
    ],
    endpoints: {
      api: '/api',
      auth: '/api/auth',
      notes: '/api/notes',
      users: '/api/users',
      websocket: '/api/events',
    },
  })
})

// ============================================================================
// MIGRATION STATUS ENDPOINT
// ============================================================================

/**
 * Migration status endpoint
 * GET /migrations
 */
router.get('/migrations', async (req, res) => {
  try {
    const db = new Database(DB_PATH, { readonly: true })
    const versionResult = await db.pragma('user_version')
    const currentVersion = versionResult ? versionResult.user_version : 0
    await db.close()

    // Note: getMigrations should be exported from migrations
    const migrations = getMigrations()
    const latestVersion = migrations[migrations.length - 1].version

    const pendingMigrations = migrations.filter(m => m.version > currentVersion)

    res.json({
      currentVersion,
      latestVersion,
      isUpToDate: currentVersion >= latestVersion,
      pendingMigrations: pendingMigrations.map(m => ({
        version: m.version,
        name: m.name,
        description: m.description,
      })),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      error: error.message,
    })
  }
})

// ============================================================================
// RUN MIGRATIONS ENDPOINT
// ============================================================================

/**
 * Run migrations endpoint (admin only)
 * POST /migrations/run
 */
router.post('/migrations/run', async (req, res) => {
  // Check for admin authorization in production
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      })
    }

    // Validate admin token
    const token = authHeader.split(' ')[1]
    if (token !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      })
    }
  }

  try {
    const migrations = getMigrations()
    const db = new Database(DB_PATH, { readonly: false })
    const versionResult = await db.pragma('user_version')
    const currentVersion = versionResult ? versionResult.user_version : 0
    await db.close()

    const pendingMigrations = migrations.filter(m => m.version > currentVersion)

    if (pendingMigrations.length === 0) {
      return res.json({
        success: true,
        message: 'No pending migrations',
        currentVersion,
        latestVersion: migrations[migrations.length - 1].version,
      })
    }

    await runMigrations()

    res.json({
      success: true,
      message: `Ran ${pendingMigrations.length} migration(s)`,
      currentVersion: migrations[migrations.length - 1].version,
      migrationsRun: pendingMigrations.map(m => ({
        version: m.version,
        name: m.name,
      })),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

module.exports = router
