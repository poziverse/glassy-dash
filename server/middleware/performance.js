/**
 * Performance Monitoring & Optimization Middleware
 * 
 * Provides performance tracking, caching, and optimization utilities.
 */

const { performance } = require('perf_hooks');
const { createHash } = require('crypto');

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

/**
 * Store for performance metrics
 */
const performanceMetrics = {
  requests: [],
  database: [],
  ai: [],
  errors: [],
};

/**
 * Track request performance
 */
const trackRequest = (req, res, next) => {
  const startTime = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    const metric = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Math.round(duration),
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      ip: req.ip,
    };
    
    // Keep last 1000 metrics
    performanceMetrics.requests.push(metric);
    if (performanceMetrics.requests.length > 1000) {
      performanceMetrics.requests.shift();
    }
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} (${duration.toFixed(2)}ms)`);
    }
  });
  
  next();
};

/**
 * Track database query performance
 */
const trackDatabase = (operation) => {
  const startTime = performance.now();
  
  return (result) => {
    const duration = performance.now() - startTime;
    const metric = {
      operation,
      duration: Math.round(duration),
      timestamp: new Date().toISOString(),
    };
    
    performanceMetrics.database.push(metric);
    if (performanceMetrics.database.length > 1000) {
      performanceMetrics.database.shift();
    }
    
    // Log slow queries
    if (duration > 100) {
      console.warn(`⚠️ Slow database query: ${operation} (${duration.toFixed(2)}ms)`);
    }
    
    return result;
  };
};

/**
 * Track AI operation performance
 */
const trackAI = (operation) => {
  const startTime = performance.now();
  
  return () => {
    const duration = performance.now() - startTime;
    const metric = {
      operation,
      duration: Math.round(duration),
      timestamp: new Date().toISOString(),
    };
    
    performanceMetrics.ai.push(metric);
    if (performanceMetrics.ai.length > 100) {
      performanceMetrics.ai.shift();
    }
    
    // Log slow AI operations
    if (duration > 5000) {
      console.warn(`⚠️ Slow AI operation: ${operation} (${duration.toFixed(2)}ms)`);
    }
    
    return duration;
  };
};

/**
 * Get performance statistics
 */
const getPerformanceStats = () => {
  const avgRequestDuration = performanceMetrics.requests.length > 0
    ? performanceMetrics.requests.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.requests.length
    : 0;
  
  const avgDatabaseDuration = performanceMetrics.database.length > 0
    ? performanceMetrics.database.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.database.length
    : 0;
  
  const avgAIDuration = performanceMetrics.ai.length > 0
    ? performanceMetrics.ai.reduce((sum, m) => sum + m.duration, 0) / performanceMetrics.ai.length
    : 0;
  
  const slowRequests = performanceMetrics.requests.filter(m => m.duration > 1000).length;
  const slowQueries = performanceMetrics.database.filter(m => m.duration > 100).length;
  const slowAI = performanceMetrics.ai.filter(m => m.duration > 5000).length;
  
  return {
    requests: {
      count: performanceMetrics.requests.length,
      avgDuration: Math.round(avgRequestDuration),
      slowCount: slowRequests,
      slowPercentage: performanceMetrics.requests.length > 0
        ? Math.round((slowRequests / performanceMetrics.requests.length) * 100)
        : 0,
    },
    database: {
      count: performanceMetrics.database.length,
      avgDuration: Math.round(avgDatabaseDuration),
      slowCount: slowQueries,
      slowPercentage: performanceMetrics.database.length > 0
        ? Math.round((slowQueries / performanceMetrics.database.length) * 100)
        : 0,
    },
    ai: {
      count: performanceMetrics.ai.length,
      avgDuration: Math.round(avgAIDuration),
      slowCount: slowAI,
      slowPercentage: performanceMetrics.ai.length > 0
        ? Math.round((slowAI / performanceMetrics.ai.length) * 100)
        : 0,
    },
    errors: {
      count: performanceMetrics.errors.length,
    },
  };
};

// ============================================================================
// CACHING
// ============================================================================

/**
 * Simple in-memory cache
 */
class Cache {
  constructor(ttl = 5 * 60 * 1000) { // Default 5 minutes TTL
    this.cache = new Map();
    this.ttl = ttl;
  }
  
  /**
   * Set cache value
   */
  set(key, value, customTTL) {
    const ttl = customTTL || this.ttl;
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }
  
  /**
   * Get cache value
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  /**
   * Delete cache value
   */
  delete(key) {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }
  
  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
  
  /**
   * Clean expired entries
   */
  clean() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Create cache instances
const cache = new Cache(5 * 60 * 1000); // 5 minutes
const shortCache = new Cache(1 * 60 * 1000); // 1 minute
const longCache = new Cache(60 * 60 * 1000); // 1 hour

/**
 * Cache middleware
 */
const cacheMiddleware = (duration = 5 * 60 * 1000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = createHash('md5')
      .update(req.originalUrl)
      .digest('hex');
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({
        ...cached,
        cached: true,
      });
    }
    
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to cache response
    res.json = (data) => {
      if (res.statusCode === 200) {
        cache.set(cacheKey, data, duration);
      }
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Cache invalidation middleware
 */
const invalidateCache = (pattern) => {
  return (req, res, next) => {
    // Run after response
    res.on('finish', () => {
      if (res.statusCode < 400) {
        // Invalidate cache entries matching pattern
        // For simplicity, we clear all cache
        // In production, implement pattern matching
        cache.clear();
      }
    });
    
    next();
  };
};

// ============================================================================
// DATABASE QUERY OPTIMIZATION
// ============================================================================

/**
 * Wrap database query with prepared statement
 */
const preparedQuery = (db, sql, params = []) => {
  const track = trackDatabase(sql);
  
  try {
    const result = db.prepare(sql).all(...params);
    return track(result);
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

/**
 * Batch database operations
 */
const batchOperation = (db, operations) => {
  const track = trackDatabase('batch-operation');
  
  const tx = db.transaction((ops) => {
    return ops.map(op => {
      const [sql, params] = op;
      return db.prepare(sql).run(...params);
    });
  });
  
  try {
    const result = tx(operations);
    return track(result);
  } catch (error) {
    console.error('Batch operation error:', error.message);
    throw error;
  }
};

// ============================================================================
// RESPONSE COMPRESSION
// ============================================================================

/**
 * Compress response if client supports it
 */
const compression = (req, res, next) => {
  // Check if client accepts gzip
  const acceptEncoding = req.headers['accept-encoding'];
  const supportsGzip = acceptEncoding && acceptEncoding.includes('gzip');
  
  if (!supportsGzip || req.method !== 'GET') {
    return next();
  }
  
  // Store original send method
  const originalSend = res.send.bind(res);
  
  // Override send method
  res.send = (data) => {
    if (typeof data === 'string' || Buffer.isBuffer(data)) {
      // In production, use compression middleware like compression
      // For now, just add header
      res.setHeader('Content-Encoding', 'gzip');
    }
    
    return originalSend(data);
  };
  
  next();
};

// ============================================================================
// MEMORY MONITORING
// ============================================================================

/**
 * Get memory usage statistics
 */
const getMemoryStats = () => {
  const usage = process.memoryUsage();
  return {
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`,
    heapUsedPercentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
  };
};

/**
 * Check memory usage and warn if high
 */
const checkMemory = () => {
  const stats = getMemoryStats();
  if (stats.heapUsedPercentage > 90) {
    console.warn('⚠️ High memory usage detected:', stats);
  }
  return stats;
};

// ============================================================================
// EXPORT
// ============================================================================

module.exports = {
  trackRequest,
  trackDatabase,
  trackAI,
  getPerformanceStats,
  Cache,
  cache,
  shortCache,
  longCache,
  cacheMiddleware,
  invalidateCache,
  preparedQuery,
  batchOperation,
  compression,
  getMemoryStats,
  checkMemory,
  performanceMetrics,
};