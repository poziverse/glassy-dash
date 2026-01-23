# Security Architecture & Best Practices

**Version:** ALPHA 1.0  
**Last Updated:** January 19, 2026  

---

## Overview

GlassKeep implements multi-layer security architecture to protect user data, prevent attacks, and ensure compliance with security best practices.

---

## Table of Contents

- [Security Layers](#security-layers)
- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Frontend Security](#frontend-security)
- [Database Security](#database-security)
- [Monitoring & Auditing](#monitoring--auditing)
- [Security Best Practices](#security-best-practices)

---

## Security Layers

GlassKeep uses defense-in-depth with 6 security layers:

### Layer 1: Network Security
- HTTPS enforcement (HSTS)
- CORS configuration
- Security headers
- DDoS protection (rate limiting)

### Layer 2: Authentication
- JWT tokens with expiration
- bcrypt password hashing (12 rounds)
- Secure session management
- Secret key encryption

### Layer 3: Authorization
- User-specific data isolation
- Role-based access control (admin/user)
- Note ownership verification
- Collaborator permission checks

### Layer 4: Input Validation
- Express-validator on all endpoints
- XSS prevention (HTML sanitization)
- SQL injection prevention (prepared statements)
- File upload validation

### Layer 5: Application Security
- Rate limiting (per-endpoint tiers)
- Request logging
- Error handling (no sensitive data exposure)
- CSRF protection

### Layer 6: Logging & Auditing
- Structured error logging
- Security event tracking
- Audit trail for sensitive operations
- Anomaly detection

---

## Authentication & Authorization

### Password Security

**Hashing:**
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 12;

// Hash password
const hash = await bcrypt.hash(password, saltRounds);

// Verify password
const isValid = await bcrypt.compare(password, hash);
```

**Requirements:**
- Minimum 8 characters
- bcrypt with 12 rounds
- Never store plain text passwords
- No reversible encryption

### JWT Authentication

**Token Format:**
```javascript
const jwt = require('jsonwebtoken');

// Generate token
const token = jwt.sign(
  { userId: user.id, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verify token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**Token Payload:**
```javascript
{
  "userId": 1,
  "username": "johndoe",
  "iat": 1737264000,
  "exp": 1737868800
}
```

**Best Practices:**
- Strong JWT secret (32+ random bytes)
- Short expiration (7 days max)
- HTTPS only transmission
- Secure storage (httpOnly cookies recommended)

### Secret Recovery Key

**Generation:**
```javascript
const key = `sk-${crypto.randomBytes(16).toString('hex')}`;
// Example: sk-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p
```

**Security:**
- One-time use
- Server-side invalidation after use
- Secure storage by user
- Never transmitted insecurely

---

## Data Protection

### Input Validation

**Server-Side:**
```javascript
const { body, validationResult } = require('express-validator');

// Validation rules
app.post('/api/notes', [
  body('title').trim().isLength({ min: 0, max: 200 }),
  body('content').trim().isLength({ max: 100000 }),
  body('type').isIn(['text', 'checklist', 'draw'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request
});
```

### XSS Prevention

**HTML Sanitization:**
```javascript
import DOMPurify from 'dompurify';

// Sanitize user input
const cleanContent = DOMPurify.sanitize(userContent);

// Allow only safe HTML
const cleanHtml = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href']
});
```

### SQL Injection Prevention

**Prepared Statements:**
```javascript
// BAD: Vulnerable to SQL injection
const notes = db.exec(`SELECT * FROM notes WHERE user_id = ${userId}`);

// GOOD: Prepared statement
const stmt = db.prepare('SELECT * FROM notes WHERE user_id = ?');
const notes = stmt.all(userId);
```

**All database queries use prepared statements.**

### File Upload Security

**Validation:**
```javascript
// File size limit (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed formats
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Validation
function validateImage(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  if (!ALLOWED_FORMATS.includes(file.type)) {
    throw new Error('Invalid file type');
  }
}
```

---

## API Security

### Rate Limiting

**Three-Tier Rate Limits:**

| Endpoint Type | Limit | Window | Purpose |
|--------------|-------|--------|---------|
| Standard | 100 | 1 minute | Regular usage |
| Auth | 10 | 1 minute | Brute force prevention |
| Upload | 10 | 1 minute | Resource protection |
| AI | 20 | 1 minute | API cost control |

**Implementation:**
```javascript
const rateLimit = require('express-rate-limit');

const standardLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  skipSuccessfulRequests: true // Don't count successful logins
});

// Apply to routes
app.use('/api/notes', standardLimiter);
app.use('/api/auth', authLimiter);
```

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642521600
Retry-After: 60
```

### Security Headers

**Helmet Configuration:**
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

**Headers Sent:**
```
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN, // e.g., http://localhost:5173
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));
```

---

## Frontend Security

### Environment Variables

**Never commit secrets:**

```javascript
// BAD: Hardcoded secrets
const API_KEY = "sk-1234567890";

// GOOD: Environment variable
const API_URL = import.meta.env.VITE_API_URL;
```

**Allowed Environment Variables:**
- `VITE_API_URL` - API endpoint URL
- `VITE_APP_NAME` - Application name

**Never expose:**
- JWT secrets
- Database credentials
- API keys
- Encryption keys

### Token Storage

**Best Practice:**
```javascript
// Store in localStorage (current implementation)
localStorage.setItem('token', token);

// Recommended: Use httpOnly cookies for production
// Requires backend cookie support
```

**Token Expiration Handling:**
```javascript
// Check token expiration
function isTokenExpired(token) {
  const decoded = jwtDecode(token);
  return decoded.exp < Date.now() / 1000;
}

// Refresh token
if (isTokenExpired(token)) {
  logout();
  redirectToLogin();
}
```

### Content Security

**Avoid:**
- `dangerouslySetInnerHTML` with user content
- `eval()` with user input
- `new Function()` with user input

**Use:**
- DOMPurify for HTML sanitization
- React's built-in XSS protection
- Safe DOM manipulation methods

---

## Database Security

### Access Control

**User Data Isolation:**
```javascript
// All queries include user_id filter
app.get('/api/notes', authenticate, (req, res) => {
  const userId = req.user.id;
  
  // Always filter by user_id
  const notes = db.prepare(`
    SELECT * FROM notes
    WHERE user_id = ? AND archived = 0
  `).all(userId);
  
  res.json(notes);
});
```

**Note Ownership:**
```javascript
// Verify ownership before updates
app.put('/api/notes/:id', authenticate, (req, res) => {
  const userId = req.user.id;
  const noteId = req.params.id;
  
  // Check ownership
  const note = db.prepare(`
    SELECT * FROM notes
    WHERE id = ? AND user_id = ?
  `).get(noteId, userId);
  
  if (!note) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  // Proceed with update
});
```

### Encryption

**At Rest:**
- Database file permissions (600)
- Backup encryption (AES-256)
- Secure key management

**In Transit:**
- HTTPS only in production
- TLS 1.2+ required
- Valid SSL certificates

---

## Monitoring & Auditing

### Security Logging

**Logged Events:**
- Failed login attempts
- Successful logins from new locations
- Unauthorized access attempts
- Rate limit violations
- Suspicious activity patterns

**Log Format:**
```javascript
{
  timestamp: "2026-01-19T12:00:00.000Z",
  level: "warn",
  action: "security_alert",
  context: {
    event: "failed_login",
    userId: null,
    ip: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    reason: "invalid_credentials"
  },
  requestId: "req-1234567890"
}
```

### Anomaly Detection

**Alerts Triggered On:**
- 5+ failed logins from same IP in 10 minutes
- Unusual login location (geo IP check)
- Sudden increase in API usage
- Multiple failed authorization attempts
- Suspicious file upload patterns

---

## Security Best Practices

### For Developers

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Validate all input** on both client and server
4. **Use prepared statements** for all database queries
5. **Implement rate limiting** on all public endpoints
6. **Log security events** for audit trail
7. **Keep dependencies updated** (npm audit)
8. **Use HTTPS only** in production
9. **Implement CORS** properly
10. **Set strong password policies**

### For Deployment

1. **Use strong JWT secrets** (32+ random bytes)
2. **Enable HTTPS** with valid certificates
3. **Configure firewall** to restrict access
4. **Enable database encryption** at rest
5. **Regular backups** with encryption
6. **Monitor logs** for suspicious activity
7. **Set up intrusion detection** if possible
8. **Regular security audits** and penetration testing
9. **Keep OS and dependencies updated**
10. **Disable unnecessary services** and ports

### For Users

1. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
2. **Enable 2FA** when available (future feature)
3. **Store secret key securely** (password manager)
4. **Logout from shared devices**
5. **Be cautious with collaborators** (only add trusted users)
6. **Report security issues** to administrators
7. **Keep software updated** (browser, OS)
8. **Use secure networks** (avoid public WiFi when possible)
9. **Check for suspicious activity** regularly
10. **Report bugs** responsibly (not publicly)

---

## Security Checklist

### Pre-Deployment

- [ ] JWT secret generated and stored securely
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Rate limiting configured on all endpoints
- [ ] Security headers properly set (Helmet)
- [ ] CORS configured to specific origins
- [ ] Database file permissions set to 600
- [ ] Backup encryption enabled
- [ ] Logging configured and monitored
- [ ] Dependencies audited (npm audit)
- [ ] Environment variables configured correctly

### Ongoing

- [ ] Review logs daily for suspicious activity
- [ ] Update dependencies monthly
- [ ] Monitor rate limit violations
- [ ] Check for failed login attempts
- [ ] Review collaborator access monthly
- [ ] Backup database daily
- [ ] Test restore procedure monthly
- [ ] Run security audit quarterly
- [ ] Update SSL certificates before expiration
- [ ] Monitor system resources for anomalies

---

## Reporting Security Issues

**For Users:**
- Contact administrator immediately
- Do not disclose publicly
- Provide detailed information

**For Researchers (Responsible Disclosure):**
- Email: security@GLASSYDASH.example.com
- Allow 90 days for fix before disclosure
- Provide proof of concept
- Follow responsible disclosure guidelines

**Bug Bounty Program:** (Coming soon)

---

## Compliance

**GDPR Compliance:**
- User data export available
- User data deletion on request
- Data retention policies in place
- Privacy controls implemented

**Data Protection:**
- Encryption at rest and in transit
- Secure authentication
- Access control and authorization
- Audit logging

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Complete