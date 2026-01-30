# GlassyDash Quick Reference Guide

**Version:** 1.1.3 | **Last Updated:** January 26, 2026

---

## 🚀 Quick Deployment

### Build & Deploy (Local → Production)

```bash
# 1. Build image locally
cd glassy-dash/GLASSYDASH
docker build -t glassy-dash:latest .
docker save glassy-dash:latest | gzip > glassy-dash.tar.gz

# 2. Transfer to jump host
scp glassy-dash.tar.gz glassy-jump:~/

# 3. Transfer to production VM
ssh -t glassy-jump "scp ~/glassy-dash.tar.gz pozi@192.168.122.45:~/"

# 4. Deploy on VM
ssh glassy-vm
gunzip -c glassy-dash.tar.gz | sudo docker load
docker stop glassy-dash-prod && docker rm glassy-dash-prod
docker run -d --name glassy-dash-prod \
  --restart unless-stopped -p 3001:8080 \
  -e NODE_ENV=production -e API_PORT=8080 \
  -e JWT_SECRET='glassy-dash-prod-secret-2025' \
  -e DB_FILE=/app/data/notes.db -e ADMIN_EMAILS='admin' \
  -e ALLOW_REGISTRATION=false \
  -v ~/.GLASSYDASH:/app/data glassy-dash:latest

# 5. Verify
curl https://dash.0rel.com/api/monitoring/health
```

---

## 🔧 Common Operations

### SSH Access

```bash
# Direct access
ssh glassy-vm

# With SSH config (recommended)
# ~/.ssh/config:
# Host glassy-jump
#     HostName 104.225.217.232
#     User poziverse
# Host glassy-vm
#     HostName 192.168.122.45
#     User pozi
#     ProxyJump glassy-jump
```

### Container Management

```bash
# Status
docker ps | grep glassy

# Restart
docker restart glassy-dash-prod

# Stop
docker stop glassy-dash-prod

# Logs (follow)
docker logs glassy-dash-prod -f

# Logs (last 50 lines)
docker logs glassy-dash-prod --tail 50
```

### Health Checks

```bash
# Local
curl http://localhost:3001/api/monitoring/health

# Production
curl https://dash.0rel.com/api/monitoring/health

# With JSON formatting
curl -s https://dash.0rel.com/api/monitoring/health | jq .
```

### Database Operations

```bash
# Access database
ssh glassy-vm
sqlite3 ~/.GLASSYDASH/notes.db

# View tables
.tables

# Query users
SELECT id, email, name, role FROM users;

# Query notes
SELECT id, title, created_at FROM notes ORDER BY created_at DESC LIMIT 10;

# Exit
.quit
```

### Backup Database

```bash
ssh glassy-vm

# Create backup directory
mkdir -p ~/.GLASSYDASH/backups

# Backup with timestamp
cp ~/.GLASSYDASH/notes.db ~/.GLASSYDASH/backups/notes-$(date +%Y%m%d-%H%M%S).db

# List backups
ls -lh ~/.GLASSYDASH/backups/

# Restore (if needed)
cp ~/.GLASSYDASH/backups/notes-YYYYMMDD-HHMMSS.db ~/.GLASSYDASH/notes.db
docker restart glassy-dash-prod
```

---

## 📊 Monitoring

### Container Resources

```bash
# Real-time stats
docker stats glassy-dash-prod

# Disk usage
df -h ~/.GLASSYDASH

# Container size
docker ps -s | grep glassy
```

---

## 🐛 Troubleshooting

### 502 Bad Gateway

```bash
# Check container
docker ps | grep glassy-dash-prod

# Restart if needed
docker restart glassy-dash-prod

# Re-deploy if needed
ssh glassy-vm
docker stop glassy-dash-prod && docker rm glassy-dash-prod
docker run -d --name glassy-dash-prod \
  --restart unless-stopped -p 3001:8080 \
  -e NODE_ENV=production -e API_PORT=8080 \
  -e JWT_SECRET='glassy-dash-prod-secret-2025' \
  -e DB_FILE=/app/data/notes.db -e ADMIN_EMAILS='admin' \
  -e ALLOW_REGISTRATION=false \
  -v ~/.GLASSYDASH:/app/data glassy-dash:latest
```

### Health Check Fails

```bash
# Check application logs
docker logs glassy-dash-prod --tail 50

# Check database
docker exec glassy-dash-prod ls -la /app/data/

# Restart container
docker restart glassy-dash-prod
```

### Can't Log In

```bash
# Check users
ssh glassy-vm
sqlite3 ~/.GLASSYDASH/notes.db "SELECT id, email, name FROM users;"

# If empty, use defaults:
# Email: admin
# Password: admin
```

---

## 🔐 Credentials

### Application Access

| Item | Value |
|------|-------|
| **URL** | https://dash.0rel.com |
| **Default Email** | admin |
| **Default Password** | admin |
| **Health Endpoint** | /api/monitoring/health |

### SSH Access

| Item | Value |
|------|-------|
| **Jump Host** | 104.225.217.232 (poziverse) |
| **Target VM** | 192.168.122.45 (pozi) |
| **Container Name** | glassy-dash-prod |

### Database

| Item | Value |
|------|-------|
| **Location** | ~/.GLASSYDASH/notes.db |
| **Backup Location** | ~/.GLASSYDASH/backups/ |
| **Tables** | 5 (users, notes, trash, settings, migrations) |

---

## 📚 Essential Documentation

| Document | Location | Purpose |
|----------|------------|---------|
| **Deployment Record** | docs/DEPLOYMENT_RECORD_2026-01-26.md | Complete deployment details |
| **Deployment Guide** | DEPLOYMENT.md | Step-by-step deployment |
| **Changelog** | docs/CHANGELOG.md | Version history |
| **Troubleshooting** | docs/TROUBLESHOOTING.md | Common issues |
| **API Reference** | docs/API_REFERENCE.md | API documentation |
| **Admin Guide** | docs/ADMIN_GUIDE.md | Administration |

---

## 🎯 Critical Information

**Production URL:** https://dash.0rel.com
**Version:** 1.1.3
**Commit:** 195f044
**Docker Image:** glassy-dash:latest (2.11GB)
**Health Status:** ✅ All systems operational

---

## 📞 Support

For detailed procedures, architecture, and troubleshooting:
- **Full Documentation:** See `/docs/` directory
- **Deployment Record:** `docs/DEPLOYMENT_RECORD_2026-01-26.md`
- **Latest Changelog:** `docs/CHANGELOG.md`

---

## 💡 Tips

1. **Always backup** before redeployment
2. **Verify health** after every change
3. **Monitor logs** during troubleshooting
4. **Document** any custom changes
5. **Use SSH config** for easier access

---

**Quick Reference Version:** 1.0
**Last Updated:** January 26, 2026
**GlassyDash Version:** 1.1.3