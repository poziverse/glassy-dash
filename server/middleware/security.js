/**
 * Security Middleware
 * 
 * Provides security enhancements including CSP, XSS protection,
 * CSRF protection, and input validation.
 */

const helmet = require('helmet');
const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// ============================================================================
// HELMET CONFIGURATION
// ============================================================================

/**
 * Configure Helmet with strict security settings
 */
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Permissions-Policy
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
    },
  },
});

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * General rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  message: 'Too many API requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate request and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  return res.status(400).json({
    success: false,
    errors: errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    })),
  });
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 255 })
    .withMessage('Email must not exceed 255 characters'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('secretKey')
    .optional()
    .isLength({ min: 12, max: 64 })
    .withMessage('Secret key must be between 12 and 64 characters'),
  
  validate,
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),
  
  validate,
];

/**
 * Validation rules for note creation/update
 */
const noteValidation = [
  param('id')
    .optional()
    .isUUID()
    .withMessage('Invalid note ID'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('content')
    .optional()
    .isLength({ max: 100000 })
    .withMessage('Content must not exceed 100,000 characters')
    .escape(),
  
  body('type')
    .optional()
    .isIn(['text', 'checklist', 'drawing', 'image'])
    .withMessage('Invalid note type'),
  
  body('color')
    .optional()
    .matches(/^[#][0-9A-Fa-f]{6}$/)
    .withMessage('Invalid color format'),
  
  body('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',').map(t => t.trim());
        if (tags.some(t => t.length > 50)) {
          throw new Error('Tags must not exceed 50 characters each');
        }
        if (tags.length > 20) {
          throw new Error('Maximum 20 tags allowed');
        }
      }
      return true;
    }),
  
  validate,
];

/**
 * Validation rules for checklist items
 */
const checklistValidation = [
  param('noteId')
    .isUUID()
    .withMessage('Invalid note ID'),
  
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Checklist item text is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Checklist item must be between 1 and 500 characters')
    .escape(),
  
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean'),
  
  body('position')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Position must be a non-negative integer'),
  
  validate,
];

/**
 * Validation rules for collaboration
 */
const collaborationValidation = [
  param('noteId')
    .isUUID()
    .withMessage('Invalid note ID'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  validate,
];

/**
 * Validation rules for ID parameters
 */
const idValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  
  validate,
];

/**
 * Validation rules for search and filter parameters
 */
const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must not exceed 100 characters')
    .escape(),
  
  query('type')
    .optional()
    .isIn(['text', 'checklist', 'drawing', 'image'])
    .withMessage('Invalid note type'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  validate,
];

// ============================================================================
// XSS PROTECTION
// ============================================================================

/**
 * Sanitize HTML content to prevent XSS attacks
 */
const sanitizeHtml = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous HTML
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * Simple CSRF protection using custom header
 * Note: For production, consider using csurf or similar library
 */
const csrfProtection = (req, res, next) => {
  const csrfToken = req.headers['x-csrf-token'];
  
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Check for CSRF token in state-changing requests
  if (!csrfToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token missing',
    });
  }
  
  // Validate CSRF token (simplified - implement proper validation)
  // In production, validate against session or cookie
  if (csrfToken.length < 32) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token',
    });
  }
  
  next();
};

// ============================================================================
// SQL INJECTION PREVENTION
// ============================================================================

/**
 * Middleware to detect potential SQL injection attempts
 */
const sqlInjectionProtection = (req, res, next) => {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION)\b)/i,
    /(\/\*|\*\/|--)/i,
    /('|'('|'')|"|;|\|\||&&)/i,
    /(\bOR\b|\bAND\b).*=.*=/i,
  ];
  
  const checkForInjection = (obj) => {
    if (typeof obj === 'string') {
      for (const pattern of patterns) {
        if (pattern.test(obj)) {
          return true;
        }
      }
    }
    
    if (Array.isArray(obj)) {
      return obj.some(checkForInjection);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(checkForInjection);
    }
    
    return false;
  };
  
  if (checkForInjection(req.body) || checkForInjection(req.query)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request detected',
    });
  }
  
  next();
};

// ============================================================================
// EXPORT
// ============================================================================

module.exports = {
  securityHeaders,
  generalLimiter,
  authLimiter,
  apiLimiter,
  registerValidation,
  loginValidation,
  noteValidation,
  checklistValidation,
  collaborationValidation,
  idValidation,
  searchValidation,
  sanitizeHtml,
  csrfProtection,
  sqlInjectionProtection,
  validate,
};