/**
 * Server Logging Utility
 * 
 * Provides structured logging with multiple levels and log rotation.
 * Logs to both console and file for production use.
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');

// ============================================================================
// LOG DIRECTORY MANAGEMENT
// ============================================================================

/**
 * Ensure log directory exists
 */
const ensureLogDir = () => {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
};

/**
 * Format log entry as JSON
 */
const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };
  return JSON.stringify(logEntry) + '\n';
};

/**
 * Write log to file
 */
const writeLog = (file, content) => {
  ensureLogDir();
  fs.appendFileSync(file, content, 'utf8');
};

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Log info message
 */
const info = (message, meta = {}) => {
  const log = formatLog('info', message, meta);
  console.log(log);
  writeLog(LOG_FILE, log);
};

/**
 * Log warning message
 */
const warn = (message, meta = {}) => {
  const log = formatLog('warn', message, meta);
  console.warn(log);
  writeLog(LOG_FILE, log);
};

/**
 * Log error message
 */
const error = (message, errorObj = null, meta = {}) => {
  const log = formatLog('error', message, {
    ...meta,
    error: errorObj ? {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
    } : null,
  });
  console.error(log);
  writeLog(ERROR_LOG_FILE, log);
  writeLog(LOG_FILE, log);
};

/**
 * Log debug message (only in development or when DEBUG is set)
 */
const debug = (message, meta = {}) => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
    const log = formatLog('debug', message, meta);
    console.debug(log);
    writeLog(LOG_FILE, log);
  }
};

/**
 * Log HTTP request
 */
const request = (req, res, duration) => {
  const log = formatLog('request', 'HTTP Request', {
    method: req.method,
    path: req.path,
    query: req.query,
    status: res.statusCode,
    duration,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  console.log(log);
  writeLog(LOG_FILE, log);
  
  // Log slow requests
  if (duration > 1000) {
    warn('Slow request detected', {
      path: req.path,
      method: req.method,
      duration,
      threshold: 1000,
    });
  }
};

/**
 * Log database operation
 */
const database = (operation, query, duration, meta = {}) => {
  const log = formatLog('database', operation, {
    query: query.substring(0, 100), // Truncate for logging
    duration,
    ...meta,
  });
  
  // Log slow queries
  if (duration > 100) {
    warn('Slow database query', { operation, query, duration });
  }
  
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
    console.log(log);
    writeLog(LOG_FILE, log);
  }
};

/**
 * Log AI operation
 */
const ai = (operation, duration, meta = {}) => {
  const log = formatLog('ai', operation, {
    duration,
    ...meta,
  });
  
  info('AI operation', log);
  
  // Log slow AI responses
  if (duration > 5000) {
    warn('Slow AI response', { operation, duration });
  }
};

/**
 * Log authentication event
 */
const auth = (event, userId, meta = {}) => {
  const log = formatLog('auth', event, {
    userId,
    ...meta,
  });
  
  info('Authentication event', log);
};

/**
 * Log user action
 */
const userAction = (action, userId, meta = {}) => {
  const log = formatLog('user_action', action, {
    userId,
    ...meta,
  });
  
  info('User action', log);
};

/**
 * Log system event
 */
const system = (event, meta = {}) => {
  const log = formatLog('system', event, meta);
  
  info('System event', log);
};

// ============================================================================
// LOG ROTATION
// ============================================================================

/**
 * Rotate log files (called by scheduler)
 */
const rotateLogs = () => {
  const maxLogSize = 10 * 1024 * 1024; // 10 MB
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  const logFiles = [LOG_FILE, ERROR_LOG_FILE];
  const cutoffDate = new Date();
  cutoffDate.setTime(cutoffDate.getTime() - maxAge);
  
  logFiles.forEach(logFile => {
    if (!fs.existsSync(logFile)) return;
    
    const stats = fs.statSync(logFile);
    
    // Rotate if file is too large
    if (stats.size > maxLogSize) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, -5);
      const rotatedFile = `${logFile}.${timestamp}`;
      
      fs.renameSync(logFile, rotatedFile);
      info('Log rotated', { original: logFile, rotated: rotatedFile });
    }
  });
  
  // Clean up old rotated logs
  const logDir = path.dirname(LOG_FILE);
  const files = fs.readdirSync(logDir);
  
  files.forEach(file => {
    if (file.includes('.log.')) {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        info('Deleted old log file', { file });
      }
    }
  });
};

/**
 * Get log statistics
 */
const getLogStats = () => {
  const stats = {
    appLog: null,
    errorLog: null,
    totalSize: 0,
  };
  
  if (fs.existsSync(LOG_FILE)) {
    stats.appLog = {
      path: LOG_FILE,
      size: fs.statSync(LOG_FILE).size,
      sizeMB: (fs.statSync(LOG_FILE).size / (1024 * 1024)).toFixed(2),
      modified: fs.statSync(LOG_FILE).mtime,
    };
    stats.totalSize += stats.appLog.size;
  }
  
  if (fs.existsSync(ERROR_LOG_FILE)) {
    stats.errorLog = {
      path: ERROR_LOG_FILE,
      size: fs.statSync(ERROR_LOG_FILE).size,
      sizeMB: (fs.statSync(ERROR_LOG_FILE).size / (1024 * 1024)).toFixed(2),
      modified: fs.statSync(ERROR_LOG_FILE).mtime,
    };
    stats.totalSize += stats.errorLog.size;
  }
  
  stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
  
  return stats;
};

/**
 * Clear log files (use with caution)
 */
const clearLogs = () => {
  [LOG_FILE, ERROR_LOG_FILE].forEach(logFile => {
    if (fs.existsSync(logFile)) {
      fs.unlinkSync(logFile);
      info('Log file cleared', { file: logFile });
    }
  });
  
  // Clear old rotated logs
  const logDir = path.dirname(LOG_FILE);
  const files = fs.readdirSync(logDir);
  
  files.forEach(file => {
    if (file.includes('.log.')) {
      const filePath = path.join(logDir, file);
      fs.unlinkSync(filePath);
      info('Deleted rotated log file', { file });
    }
  });
};

// ============================================================================
// EXPRESS MIDDLEWARE
// ============================================================================

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    request(req, res, duration);
  });
  
  next();
};

/**
 * Error logging middleware
 */
const errorLogger = (err, req, res, next) => {
  error(
    'Unhandled error',
    err,
    {
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      ip: req.ip,
      body: req.body,
      query: req.query,
    }
  );
  
  next(err);
};

// ============================================================================
// EXPORT
// ============================================================================

module.exports = {
  info,
  warn,
  error,
  debug,
  request,
  database,
  ai,
  auth,
  userAction,
  system,
  rotateLogs,
  getLogStats,
  clearLogs,
  requestLogger,
  errorLogger,
};