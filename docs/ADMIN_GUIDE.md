# Admin Guide

**Version:** ALPHA 1.0  
**Last Updated:** January 19, 2026  

---

## Overview

This guide covers administrative tasks for managing GlassKeep, including user management, system monitoring, and maintenance operations.

---

## Table of Contents

- [Admin Access](#admin-access)
- [User Management](#user-management)
- [System Monitoring](#system-monitoring)
- [Log Management](#log-management)
- [Backup & Restore](#backup--restore)
- [Maintenance Tasks](#maintenance-tasks)

---

## Admin Access

### Becoming an Admin

The first registered user is automatically assigned admin role.

**Check Admin Status:**
```javascript
// User object includes is_admin field
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "is_admin": true
}
```

### Admin Permissions

Admins can:
- View all users
- Delete user accounts
- Access system statistics
- View and export logs
- Run database migrations
- Access health checks
- View system metrics

**Regular users cannot:** Access admin panel

---

## User Management

### View All Users

**API:**
```
GET /api/admin/users
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "is_admin": true,
    "notes": 42,
    "storage_bytes": 5242880,
    "created_at": "2026-01-01T12:00:00.000Z"
  }
]
```

**Query Parameters:**
- `limit` - Number of results (default: 100)
- `offset` - Skip N results (pagination)

---

### Search Users

**API:**
```
GET /api/users/search?q=john
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe"
  }
]
```

---

### Delete User

**WARNING:** This permanently deletes the user and all their notes.

**API:**
```
DELETE /api/admin/users/:id
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Restrictions:**
- Cannot delete yourself
- Cannot delete other admins (unless you're the only admin)

**Pre-deletion Checklist:**
- [ ] Confirm user identity
- [ ] Warn user about data loss
- [ ] Export user's data if needed
- [ ] Verify this isn't a mistake

---

## System Monitoring

### View System Statistics

**API:**
```
GET /api/admin/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "users": {
    "total": 42,
    "active": 38,
    "admins": 2
  },
  "notes": {
    "total": 1234,
    "pinned": 45,
    "archived": 89,
    "byType": {
      "text": 800,
      "checklist": 300,
      "draw": 134
    }
  },
  "storage": {
    "total_bytes": 104857600,
    "total_mb": 100,
    "per_user": {
      "average_mb": 2.4,
      "max_mb": 50
    }
  },
  "system": {
    "uptime_seconds": 86400,
    "version": "1.0.0",
    "node_version": "v18.0.0"
  }
}
```

---

### Health Checks

**Overall Health:**
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-19T12:00:00.000Z",
  "checks": {
    "database": "healthy",
    "cache": "healthy",
    "memory": "healthy",
    "disk": "healthy"
  },
  "details": {
    "memory": {
      "used_percent": 45.2,
      "heap_mb": 180,
      "rss_mb": 250
    },
    "disk": {
      "used_percent": 65.8,
      "free_gb": 150,
      "total_gb": 500
    }
  }
}
```

**Database Readiness:**
```
GET /ready
```

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2026-01-19T12:00:00.000Z"
}
```

---

### Performance Metrics

**API:**
```
GET /metrics
```

**Response:**
```json
{
  "performance": {
    "requests": {
      "total": 10000,
      "duration_avg_ms": 45,
      "duration_max_ms": 500,
      "slow_percent": 2.3
    },
    "database": {
      "queries": {
        "total": 50000,
        "duration_avg_ms": 5,
        "duration_max_ms": 100
      }
    },
    "ai": {
      "operations": {
        "total": 500,
        "duration_avg_ms": 1500
      }
    }
  },
  "cache": {
    "hits": 45000,
    "misses": 5000,
    "hit_rate": 0.9
  }
}
```

**Prometheus Format:**
```
GET /metrics/prometheus
```

---

## Log Management

### Query Logs

**API:**
```
GET /api/logs
Authorization: Bearer <token>
```

**Query Parameters:**
- `date` - Filter by date (YYYY-MM-DD)
- `level` - Filter by level (error, warn, info, debug)
- `action` - Filter by action name
- `userId` - Filter by user ID
- `limit` - Number of entries (default: 100, max: 1000)
- `offset` - Skip N entries (default: 0)

**Example:**
```
GET /api/logs?level=error&limit=50
```

**Response:**
```json
{
  "entries": [
    {
      "timestamp": "2026-01-19T12:00:00.000Z",
      "level": "error",
      "action": "api_error",
      "context": {
        "endpoint": "/api/notes",
        "status": 500
      },
      "userId": 1,
      "sessionId": "sess-abc123",
      "requestId": "req-1234567890"
    }
  ],
  "total": 50,
  "limit": 100,
  "offset": 0
}
```

---

### Log Statistics

**API:**
```
GET /api/logs/stats
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` - Number of days to analyze (default: 7)

**Response:**
```json
{
  "levelDistribution": {
    "error": 45,
    "warn": 120,
    "info": 850,
    "debug": 200
  },
  "topActions": [
    {
      "action": "user_login",
      "count": 142
    },
    {
      "action": "note_created",
      "count": 89
    }
  ],
  "totalEvents": 1215,
  "uniqueUsers": 8,
  "period": {
    "start": "2026-01-12T00:00:00.000Z",
    "end": "2026-01-19T12:00:00.000Z",
    "days": 7
  }
}
```

---

### Export Logs

**API:**
```
POST /api/logs/export
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "format": "csv|json",
  "filters": {
    "level": "error",
    "startDate": "2026-01-12",
    "endDate": "2026-01-19"
  }
}
```

**Response:** File download with appropriate `Content-Type` header.

---

## Backup & Restore

### Automatic Backups

Backups are automatically created daily at 2:00 AM.

**Location:** `data/backups/`

**Format:** `notes.db.YYYY-MM-DDTHH-mm-ss`

**Retention:** 30 days (configurable)

---

### Manual Backup

**Command:**
```bash
cd GLASSYDASH/server
npm run db:backup
```

**Output:** `data/backups/notes.db.YYYY-MM-DDTHH-mm-ss`

---

### Restore Database

**WARNING:** This overwrites the current database. A pre-restore backup is automatically created.

**Command:**
```bash
cd GLASSYDASH/server
npm run db:restore data/backups/notes.db.2026-01-19T02-00-00
```

**Pre-restore Backup:** Automatically created before restore

---

### Backup Verification

**Verify Backup Integrity:**
```bash
cd GLASSYDASH/server

# Check database integrity
sqlite3 data/backups/notes.db.2026-01-19T02-00-00 "PRAGMA integrity_check;"

# Check schema
sqlite3 data/backups/notes.db.2026-01-19T02-00-00 ".schema"

# Count records
sqlite3 data/backups/notes.db.2026-01-19T02-00-00 "SELECT COUNT(*) FROM notes;"
```

---

## Maintenance Tasks

### Database Maintenance

**Run VACUUM:**
```bash
cd GLASSYDASH/server
sqlite3 data/notes.db "VACUUM;"
```

**Run ANALYZE:**
```bash
sqlite3 data/notes.db "ANANLYZE;"
```

**Reindex:**
```bash
sqlite3 data/notes.db "REINDEX;"
```

---

### Log Cleanup

**Automatic Cleanup:**
- Old logs (>30 days) automatically archived
- Archived logs compressed
- Manual cleanup available via admin panel

**Manual Cleanup:**
```bash
# Remove logs older than 30 days
find data/logs/ -name "*.log" -mtime +30 -delete
```

---

### Update Dependencies

**Check for Updates:**
```bash
cd GLASSYDASH
npm outdated
```

**Update Dependencies:**
```bash
npm update
npm audit fix
```

**Security Audit:**
```bash
npm audit
```

---

## Security Tasks

### Review Failed Logins

**Query:**
```javascript
// Get failed login attempts
GET /api/logs?action=auth_failed&level=warn
```

**Action:** Block suspicious IPs if necessary

---

### Monitor Rate Limit Violations

**Check Logs:**
```bash
grep "rate_limit" GLASSYDASH/server/server.log
```

**Action:** Identify patterns and potential attacks

---

### Rotate Secrets

**JWT Secret Rotation:**
1. Generate new secret
2. Update `.env` file
3. Restart server
4. Old tokens expire naturally (7 days)

**Procedure:**
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update server/.env
# JWT_SECRET=<new-secret>

# Restart server
cd server && npm restart
```

---

## Best Practices

### Daily Tasks
- [ ] Review error logs
- [ ] Check system health
- [ ] Monitor disk space
- [ ] Verify backups completed

### Weekly Tasks
- [ ] Review user registrations
- [ ] Check system metrics
- [ ] Review storage usage
- [ ] Update dependencies if needed

### Monthly Tasks
- [ ] Review all logs
- [ ] Test restore procedure
- [ ] Security audit
- [ ] Performance review
- [ ] User cleanup (inactive accounts)

### Quarterly Tasks
- [ ] Full system backup verification
- [ ] Disaster recovery testing
- [ ] Security review
- [ ] Capacity planning

---

## Troubleshooting

### High Memory Usage

**Symptoms:**
- Memory >90%
- Application slowdown

**Solutions:**
1. Check for memory leaks
2. Review active SSE connections
3. Increase system memory
4. Restart server

```bash
# Check memory
free -h

# Check Node.js memory
ps aux | grep node
```

---

### High Disk Usage

**Symptoms:**
- Disk >80% full
- Backup failures

**Solutions:**
1. Clean old backups
2. Archive old logs
3. Review user storage
4. Increase disk space

```bash
# Check disk usage
df -h

# Find large files
find data/ -type f -size +100M
```

---

### Database Corruption

**Symptoms:**
- Database errors
- Queries failing

**Solutions:**
1. Check database integrity
2. Restore from backup
3. Rebuild database

```bash
# Check integrity
sqlite3 data/notes.db "PRAGMA integrity_check;"

# Restore from backup
npm run db:restore <backup-file>
```

---

## Compliance & Auditing

### Data Retention

**User Data:**
- Notes: Retained until user deletion
- Logs: Retained for 30 days
- Backups: Retained for 30 days

**Deletion Process:**
1. User requests deletion
2. Verify identity
3. Delete user account
4. Delete all user data
5. Confirm deletion

### Audit Trail

All administrative actions are logged:
- User deletions
- Settings changes
- System modifications
- Access attempts

**Export Audit Log:**
```bash
# Export admin actions
GET /api/logs?action=admin_*&format=csv
```

---

## Emergency Procedures

### Server Down

1. Check health: `curl http://localhost:3000/health`
2. Check logs: `tail -f GLASSYDASH/server/server.log`
3. Restart server: `pm2 restart GLASSYDASH`
4. Check dependencies: `ps aux | grep node`
5. Verify database: `sqlite3 data/notes.db ".tables"`

### Database Corruption

1. Stop server
2. Check integrity: `sqlite3 data/notes.db "PRAGMA integrity_check;"`
3. Restore from backup: `npm run db:restore <backup>`
4. Verify restore
5. Start server

### Security Incident

1. Block suspicious IPs
2. Review all logs
3. Rotate JWT secrets
4. Force password resets
5. Notify users
6. Document incident

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Complete