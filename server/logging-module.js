/**
 * Backend Logging Module for Glass Keep
 * 
 * Features:
 * - Persistent daily log files
 * - Structured JSON logging
 * - Log viewer API for admins
 * - Automatic cleanup of old logs
 * 
 * Usage in server/index.js:
 * require('./logging-module')(app);
 */

const path = require('path');
const fs = require('fs');

// ============ Logging Setup ============

const LOGS_DIR = path.join(__dirname, '..', 'data', 'logs');

// Create logs directory if it doesn't exist
try {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
} catch (error) {
  console.error('Failed to create logs directory:', error.message);
}

/**
 * Get today's log file path
 */
function getLogFilePath(date = new Date()) {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOGS_DIR, `${dateStr}.log`);
}

/**
 * Write log entry to file
 */
function writeLogEntry(entry) {
  try {
    const line = JSON.stringify(entry) + '\n';
    const logFile = getLogFilePath();
    fs.appendFileSync(logFile, line, 'utf-8');
  } catch (error) {
    console.error('Failed to write log entry:', error.message);
  }
}

/**
 * Parse log entries from file
 */
function parseLogFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          console.warn('Failed to parse log line:', line.slice(0, 50));
          return null;
        }
      })
      .filter(entry => entry !== null);
  } catch (error) {
    console.error('Failed to read log file:', error.message);
    return [];
  }
}

/**
 * Clean up old log files (older than 30 days)
 */
function cleanupOldLogs() {
  try {
    const files = fs.readdirSync(LOGS_DIR);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    files.forEach(file => {
      const filePath = path.join(LOGS_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < thirtyDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`[Cleanup] Removed log file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Log cleanup error:', error.message);
  }
}

// Run cleanup daily
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);
cleanupOldLogs(); // Run on startup

// ============ API Endpoints ============

/**
 * POST /api/logs
 * 
 * Receive log entries from clients and store them
 * 
 * Body:
 * {
 *   timestamp: ISO8601,
 *   level: 'error|warn|info|debug',
 *   action: string,
 *   context: object,
 *   requestId: string,
 *   userId: number,
 *   error?: { message, name, stack },
 *   url: string,
 *   userAgent: string
 * }
 */

// ============ Initialize Routes ============

module.exports = function initializeLoggingRoutes(app, authenticateToken) {

// Simple auth check if not provided
if (!authenticateToken) {
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
  
  authenticateToken = (req, res, next) => {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.auth = payload;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

app.post('/api/logs', authenticateToken, (req, res) => {
  try {
    const entry = {
      ...req.body,
      receivedAt: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      // Set userId from JWT if available (token was already parsed)
      userId: req.auth?.uid || req.body.userId
    };

    // Sanitize sensitive data
    if (entry.context?.password) {
      entry.context.password = '***REDACTED***';
    }
    if (entry.error?.stack) {
      // Limit stack trace size
      entry.error.stack = entry.error.stack.slice(0, 500);
    }

    // Write to persistent log
    writeLogEntry(entry);

    // If it's a critical error, also log to server console
    if (entry.level === 'error') {
      console.error(`[${entry.action}] User ${entry.userId || 'anon'} - ${entry.error?.message}`);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Failed to process log entry:', error);
    res.status(500).json({ error: 'Failed to store log' });
  }
});

/**
 * GET /api/logs
 * 
 * Retrieve logs (admin only)
 * 
 * Query parameters:
 * - date: YYYY-MM-DD (defaults to today)
 * - level: filter by log level (error, warn, info, debug)
 * - action: filter by action name
 * - userId: filter by user ID
 * - limit: number of entries to return (default 100, max 1000)
 * - offset: skip N entries (default 0)
 */
app.get('/api/logs', authenticateToken, (req, res) => {
  try {
    // Only admins can view logs
    if (!req.auth?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      date = new Date().toISOString().split('T')[0],
      level,
      action,
      userId,
      limit = 100,
      offset = 0
    } = req.query;

    const parsedLimit = Math.min(parseInt(limit) || 100, 1000);
    const parsedOffset = Math.max(0, parseInt(offset) || 0);

    // Get log file for specified date
    const logFile = path.join(LOGS_DIR, `${date}.log`);
    let entries = parseLogFile(logFile);

    // Apply filters
    if (level) {
      entries = entries.filter(e => e.level === level);
    }
    if (action) {
      entries = entries.filter(e => e.action === action);
    }
    if (userId) {
      entries = entries.filter(e => e.userId === parseInt(userId));
    }

    // Apply pagination
    const total = entries.length;
    entries = entries.slice(parsedOffset, parsedOffset + parsedLimit);

    res.json({
      date,
      total,
      offset: parsedOffset,
      limit: parsedLimit,
      entries
    });
  } catch (error) {
    console.error('Failed to retrieve logs:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

/**
 * GET /api/logs/stats
 * 
 * Get statistics about recent logs (admin only)
 */
app.get('/api/logs/stats', authenticateToken, (req, res) => {
  try {
    if (!req.auth?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { days = 7 } = req.query;
    const daysToCheck = Math.min(parseInt(days) || 7, 30);

    const stats = {
      date: new Date().toISOString(),
      period_days: daysToCheck,
      levels: { error: 0, warn: 0, info: 0, debug: 0 },
      topActions: {},
      totalEntries: 0,
      uniqueUsers: new Set(),
      errorDetails: []
    };

    // Get logs from the last N days
    for (let i = 0; i < daysToCheck; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const logFile = path.join(LOGS_DIR, date.toISOString().split('T')[0] + '.log');
      const entries = parseLogFile(logFile);

      entries.forEach(entry => {
        stats.totalEntries++;
        stats.levels[entry.level] = (stats.levels[entry.level] || 0) + 1;
        stats.topActions[entry.action] = (stats.topActions[entry.action] || 0) + 1;
        if (entry.userId) {
          stats.uniqueUsers.add(entry.userId);
        }

        // Collect error details
        if (entry.level === 'error') {
          stats.errorDetails.push({
            timestamp: entry.timestamp,
            action: entry.action,
            message: entry.error?.message,
            userId: entry.userId
          });
        }
      });
    }

    // Convert Set to array and sort
    stats.uniqueUsers = Array.from(stats.uniqueUsers).length;
    stats.errorDetails = stats.errorDetails
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20); // Last 20 errors

    // Sort top actions
    stats.topActions = Object.entries(stats.topActions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((acc, [action, count]) => {
        acc[action] = count;
        return acc;
      }, {});

    res.json(stats);
  } catch (error) {
    console.error('Failed to get log stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * POST /api/logs/export
 * 
 * Export logs as CSV or JSON (admin only)
 * 
 * Body:
 * {
 *   date: 'YYYY-MM-DD',
 *   level?: 'error' | 'warn' | 'info' | 'debug',
 *   format: 'json' | 'csv'
 * }
 */
app.post('/api/logs/export', authenticateToken, (req, res) => {
  try {
    if (!req.auth?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { date, level, format = 'json' } = req.body;
    const logFile = path.join(LOGS_DIR, `${date}.log`);
    let entries = parseLogFile(logFile);

    if (level) {
      entries = entries.filter(e => e.level === level);
    }

    if (format === 'csv') {
      const csv = convertToCSV(entries);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="logs-${date}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="logs-${date}.json"`);
      res.json(entries);
    }
  } catch (error) {
    console.error('Failed to export logs:', error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

/**
 * Convert array of objects to CSV
 */
function convertToCSV(entries) {
  if (entries.length === 0) return '';

  const headers = ['timestamp', 'level', 'action', 'userId', 'error', 'ip', 'url'];
  const rows = entries.map(entry => [
    entry.timestamp,
    entry.level,
    entry.action,
    entry.userId || '',
    entry.error?.message || '',
    entry.ip || '',
    entry.url || ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csv;
}

console.log('✓ Logging module initialized');

}; // End of module.exports function