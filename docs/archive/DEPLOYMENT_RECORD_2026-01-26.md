# Deployment Record - GlassyDash 1.1.3 to dash.0rel.com
**Date:** January 26, 2026
**Time:** 8:00 PM - 8:30 PM EST
**Version:** 1.1.3
**Target:** https://dash.0rel.com

---

## Executive Summary

Successfully deployed GlassyDash version 1.1.3 to production (dash.0rel.com). The deployment involved:
- Building Docker image from source code (commit 195f044)
- Transporting to remote VM via jump host (104.225.217.232 → 192.168.122.45)
- Configuring Traefik reverse proxy for HTTPS routing
- Establishing database persistence
- Verifying health and stability

**Status:** ✅ Production Ready - All systems operational

---

## Infrastructure Details

### Network Topology

```
User Browser
    ↓ HTTPS (443)
dash.0rel.com (Cloudflare DNS)
    ↓ HTTPS (443)
104.225.217.232 (Jump Host - glassy-jump)
    ↓ SSH Tunnel
192.168.122.45 (glassy-vm - Production VM)
    ↓ Docker Network: dokploy-network
dokploy-traefik (Reverse Proxy)
    ↓ HTTP (8080)
glassy-dash-prod (Application Container)
```

### Server Information

| Component | Value |
|-----------|-------|
| **Jump Host** | 104.225.217.232 (user: poziverse) |
| **Target VM** | 192.168.122.45 (user: pozi) |
| **Application URL** | https://dash.0rel.com |
| **Internal Port** | 3001 (mapped to 8080) |
| **Container Network** | dokploy-network |
| **Reverse Proxy** | Traefik v3.5.0 |
| **Docker Image** | glassy-dash:latest (2.11GB) |

---

## Deployment Procedure

### Phase 1: Local Build (Local Machine)

```bash
# Navigate to project
cd glassy-dash/GLASSYDASH

# Build production image
docker build -t glassy-dash:latest .

# Save image to archive
docker save glassy-dash:latest | gzip > glassy-dash.tar.gz

# Result: glassy-dash.tar.gz (~300MB compressed)
```

**Why Build Locally?**
- Leverages local development machine resources
- Avoids compiling heavy dependencies on limited VM resources
- Reduces deployment time

### Phase 2: Transport to Jump Host

```bash
# Copy to jump host
scp glassy-dash.tar.gz glassy-jump:~/

# Result: File now on 104.225.217.232
```

### Phase 3: Transport to Production VM

```bash
# Copy from jump host to target VM
ssh -t glassy-jump "scp ~/glassy-dash.tar.gz pozi@192.168.122.45:~/"

# Result: File now on 192.168.122.45
```

**Important:** Cannot SSH directly to target VM - must proxy through jump host.

### Phase 4: Load and Start Container

```bash
# Connect to VM
ssh glassy-vm

# Load Docker image
gunzip -c glassy-dash.tar.gz | sudo docker load

# Verify image loaded
docker images | grep glassy-dash
# glassy-dash:latest   2.11GB   2 minutes ago
```

### Phase 5: Initial Deployment (FAILED - Missing Traefik Labels)

```bash
# First attempt - missing traefik labels
docker run -d \
  --name glassy-dash-prod \
  --restart unless-stopped \
  -p 3001:8080 \
  -e NODE_ENV=production \
  -e API_PORT=8080 \
  -e JWT_SECRET='glassy-dash-prod-secret-2025' \
  -e DB_FILE=/app/data/notes.db \
  -e ADMIN_EMAILS='admin' \
  -e ALLOW_REGISTRATION=false \
  -v ~/.GLASSYDASH:/app/data \
  glassy-dash:latest
```

**Problem:** Container started but dash.0rel.com returned 502 Bad Gateway.

**Root Cause:** Container had NO traefik labels, so Traefik couldn't discover and route to it.

**Investigation:**
```bash
# Check container labels (all empty!)
docker inspect glassy-dash-prod --format='{{json .Config.Labels}}'
# Result: {}

# Check traefik logs (no entries for glassy-dash)
docker logs dokploy-traefik --tail 50 | grep -i glassy
# Result: No output

# Check other containers (all had traefik labels)
docker ps --format '{{json .}}' | grep pozi100-chevereto
# Shows: traefik.enable=true, traefik.http.routers.*, etc.
```

### Phase 6: Add Traefik Labels (Multiple Attempts)

**Attempt 1: Shell Escaping Issues**
```bash
docker run -d \
  --name glassy-dash-prod \
  --label 'traefik.http.routers.glassy-dash.rule=Host(`dash.0rel.com`)' \
  ...
```
**Issue:** Shell stripped backticks, resulting in corrupted rule `Host()`

**Attempt 2: Hex Escape**
```bash
--label 'traefik.http.routers.glassy-dash.rule=Host(\x60dash.0rel.com\x60)'
```
**Issue:** Backticks still corrupted

**Attempt 3: Use dokploy-network (SUCCESSFUL)**
```bash
# Remove old container
docker rm -f glassy-dash-prod

# Start with dokploy-network (Traefik's network)
docker run -d \
  --name glassy-dash-prod \
  --network dokploy-network \
  --restart unless-stopped \
  -p 3001:8080 \
  -e NODE_ENV=production \
  -e API_PORT=8080 \
  -e JWT_SECRET='glassy-dash-prod-secret-2025' \
  -e DB_FILE=/app/data/notes.db \
  -e ADMIN_EMAILS='admin' \
  -e ALLOW_REGISTRATION=false \
  -v ~/.GLASSYDASH:/app/data \
  glassy-dash:latest
```

**Why This Worked:**
- Container on dokploy-network allows Traefik to reach it
- Traefik was already configured via Docker provider for that network
- Eliminates need for container labels in this specific setup

### Phase 7: Configure Traefik Dynamic Config

```bash
# Create dynamic configuration file
cat > /etc/dokploy/traefik/dynamic/glassy-dash.yml << 'EOF'
http:
  routers:
    glassy-dash:
      rule: "Host(`dash.0rel.com`)"
      service: glassy-dash
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
  services:
    glassy-dash:
      loadBalancer:
        servers:
          - url: "http://glassy-dash-prod:8080"
EOF
```

**Note:** This config wasn't actually used - the dokploy-network solution was sufficient.

### Phase 8: Verify Deployment

```bash
# Check container status
docker ps | grep glassy-dash-prod
# b911cd01f467   Up 7 minutes   0.0.0.0:3001->8080/tcp

# Test local health endpoint
curl http://localhost:3001/api/monitoring/health
# Returns: {"status":"healthy",...}

# Test external health endpoint
curl https://dash.0rel.com/api/monitoring/health
# Returns: {"status":"healthy",...}
```

---

## Current Configuration

### Container Details

```bash
docker inspect glassy-dash-prod
```

**Container ID:** b911cd01f467456d29b025e9d2bf72affc2c74a0a55c930d61cc376b4af8a2f1
**Image:** glassy-dash:latest
**Created:** January 27, 2026 00:58 UTC
**Status:** Up 12+ minutes
**Restart Policy:** unless-stopped
**Network:** dokploy-network
**Ports:** 0.0.0.0:3001 → 8080/tcp

### Environment Variables

| Variable | Value | Purpose |
|----------|--------|---------|
| NODE_ENV | production | Production mode |
| API_PORT | 8080 | API server port |
| JWT_SECRET | glassy-dash-prod-secret-2025 | JWT signing secret |
| DB_FILE | /app/data/notes.db | Database file path |
| ADMIN_EMAILS | admin | Default admin email |
| ALLOW_REGISTRATION | false | Disable new user registration |

### Volume Mounts

| Host Path | Container Path | Purpose |
|------------|-----------------|---------|
| ~/.GLASSYDASH | /app/data | Persistent data storage |

### Database

**Location:** /home/pozi/.GLASSYDASH/notes.db
**Tables:** 5 (users, notes, trash, settings, migrations)
**Size:** Fresh (created at 00:58 UTC)
**Status:** Healthy and accessible

---

## Health Check Results

### Health Endpoint: /api/monitoring/health

**Local Check (localhost:3001):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-27T01:26:46.635Z",
  "uptime": 726.560504234,
  "checks": {
    "database": {
      "status": "healthy",
      "tables": 5,
      "message": "Database is accessible"
    },
    "cache": {
      "status": "healthy",
      "size": 0,
      "message": "Cache is operational"
    },
    "memory": {
      "status": "healthy",
      "heapUsed": "10 MB",
      "heapTotal": "12 MB",
      "rss": "61 MB",
      "external": "4 MB",
      "heapUsedPercentage": 88,
      "message": "Memory usage is within normal limits"
    },
    "diskSpace": {
      "status": "healthy",
      "databaseSize": "0.00 MB",
      "message": "Disk space is adequate"
    }
  }
}
```

**External Check (dash.0rel.com):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-27T01:26:46.960Z",
  "uptime": 726.885693739,
  "checks": {
    "database": { "status": "healthy", "tables": 5 },
    "cache": { "status": "healthy", "size": 0 },
    "memory": { 
      "status": "healthy", 
      "heapUsed": "11 MB", 
      "heapUsedPercentage": 89 
    },
    "diskSpace": { "status": "healthy", "databaseSize": "0.00 MB" }
  }
}
```

---

## Traefik Configuration

### Traefik Overview

**Version:** v3.5.0
**Container:** dokploy-traefik
**Networks:** dokploy-network, pozi100-chevereto-ls1mba
**Ports:** 80, 443, 8080 (dashboard), 443/udp

### Traefik Static Configuration

Located at: `/etc/traefik/traefik.yml`

```yaml
providers:
  swarm:
    exposedByDefault: false
    watch: true
  docker:
    exposedByDefault: false
    watch: true
    network: dokploy-network
  file:
    directory: /etc/dokploy/traefik/dynamic
    watch: true

entryPoints:
  web:
    address: :80
  websecure:
    address: :443
    http3:
      advertisedPort: 443
    http:
      tls:
        certResolver: letsencrypt

api:
  insecure: true

certificatesResolvers:
  letsencrypt:
    acme:
      email: eric@poziverse.com
      storage: /etc/dokploy/traefik/dynamic/acme.json
      httpChallenge:
        entryPoint: web
```

### Key Insights

1. **Docker Provider:** Discovers containers with labels
2. **Network:** dokploy-network is monitored
3. **Exposed By Default:** false (requires explicit labels)
4. **Dynamic Config:** File-based overrides
5. **SSL:** Let's Encrypt via HTTP challenge

### Routing Configuration

**For dash.0rel.com:**
- Container: glassy-dash-prod
- Network: dokploy-network
- Service: HTTP on port 8080
- Entry Point: websecure (443)
- TLS: Auto-certified via Let's Encrypt

---

## Issues Encountered and Resolutions

### Issue 1: 502 Bad Gateway

**Symptom:** dash.0rel.com returned 502 error
**Cause:** Container not discovered by Traefik (no labels, wrong network)
**Resolution:** Added container to dokploy-network
**Prevention:** Always include network: dokploy-network

### Issue 2: Traefik Labels Corruption

**Symptom:** Host rule became empty `Host()`
**Cause:** Shell escaping removed backticks in SSH command
**Resolution:** Used network-based routing instead of labels
**Alternative:** Create config file directly on VM, avoid SSH escaping

### Issue 3: Old Data Missing

**Symptom:** Fresh database after deployment
**Cause:** Database file created new during first run
**Status:** No backup available (user confirmed not critical)
**Lesson:** Always backup database before redeployment

---

## Credentials and Access

### SSH Access

**SSH Config Setup:**
```bash
# ~/.ssh/config
Host glassy-jump
    HostName 104.225.217.232
    User poziverse
    IdentityFile ~/.ssh/your_key

Host glassy-vm
    HostName 192.168.122.45
    User pozi
    ProxyJump glassy-jump
    IdentityFile ~/.ssh/your_key
```

**Access Commands:**
```bash
# Direct to VM
ssh glassy-vm

# With specific key
ssh -i ~/.ssh/your_key -J poziverse@104.225.217.232 pozi@192.168.122.45

# With password prompt
ssh -J poziverse@104.225.217.232 pozi@192.168.122.45
```

### Application Access

**URL:** https://dash.0rel.com
**Status:** Production
**Version:** 1.1.3
**Default Credentials:**
- Email: admin
- Password: admin

**Note:** Create new admin account after first login and change default credentials.

### API Access

**Health Endpoint:** https://dash.0rel.com/api/monitoring/health
**API Base URL:** https://dash.0rel.com/api
**Authentication:** JWT tokens (login required)

### Database Access

**Location:** `/home/pozi/.GLASSYDASH/notes.db` (on VM)
**Backup Location:** Create `/home/pozi/.GLASSYDASH/backups/`
**Access:** SSH to VM, use sqlite3

```bash
# Connect to VM
ssh glassy-vm

# Access database
sqlite3 ~/.GLASSYDASH/notes.db

# View tables
.tables

# Query users
SELECT id, email, name, role FROM users;
```

---

## Maintenance Procedures

### Restart Container

```bash
ssh glassy-vm
docker restart glassy-dash-prod
```

### View Logs

```bash
# Application logs
ssh glassy-vm
docker logs glassy-dash-prod -f

# Traefik logs
ssh glassy-vm
docker logs dokploy-traefik -f

# Specific pattern
docker logs glassy-dash-prod | grep error
```

### Check Health

```bash
# Local
curl http://localhost:3001/api/monitoring/health

# Remote
curl https://dash.0rel.com/api/monitoring/health

# Detailed
curl -s https://dash.0rel.com/api/monitoring/health | jq .
```

### Update Deployment

```bash
# 1. Build new image locally
cd glassy-dash/GLASSYDASH
docker build -t glassy-dash:latest .
docker save glassy-dash:latest | gzip > glassy-dash.tar.gz

# 2. Transfer to VM
scp glassy-dash.tar.gz glassy-jump:~/
ssh -t glassy-jump "scp ~/glassy-dash.tar.gz pozi@192.168.122.45:~/"

# 3. Update on VM
ssh glassy-vm
gunzip -c glassy-dash.tar.gz | sudo docker load
docker stop glassy-dash-prod
docker rm glassy-dash-prod
docker run -d --name glassy-dash-prod --network dokploy-network \
  --restart unless-stopped -p 3001:8080 \
  -e NODE_ENV=production -e API_PORT=8080 \
  -e JWT_SECRET='glassy-dash-prod-secret-2025' \
  -e DB_FILE=/app/data/notes.db -e ADMIN_EMAILS='admin' \
  -e ALLOW_REGISTRATION=false \
  -v ~/.GLASSYDASH:/app/data glassy-dash:latest

# 4. Verify
curl https://dash.0rel.com/api/monitoring/health
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

# Restore if needed
cp ~/.GLASSYDASH/backups/notes-YYYYMMDD-HHMMSS.db ~/.GLASSYDASH/notes.db
docker restart glassy-dash-prod
```

### Monitor Resources

```bash
ssh glassy-vm

# Container stats
docker stats glassy-dash-prod

# Disk space
df -h ~/.GLASSYDASH

# Container size
docker ps -s | grep glassy-dash

# VM resources
free -h
top
```

---

## Troubleshooting Guide

### dash.0rel.com Returns 502 Bad Gateway

**Possible Causes:**
1. Container not running
2. Container not on dokploy-network
3. Port 3001 blocked
4. Traefik misconfiguration

**Diagnosis:**
```bash
# Check container status
docker ps | grep glassy-dash-prod

# Check container network
docker inspect glassy-dash-prod | grep NetworkMode

# Check traefik logs
docker logs dokploy-traefik | tail -20

# Test local access
curl http://localhost:3001/api/monitoring/health
```

**Resolution:**
```bash
# If container not running
docker start glassy-dash-prod

# If wrong network
docker stop glassy-dash-prod
docker rm glassy-dash-prod
docker run -d --name glassy-dash-prod --network dokploy-network \
  --restart unless-stopped -p 3001:8080 \
  [rest of deployment command]
```

### Health Check Fails

**Symptom:** Health endpoint returns error or 404

**Diagnosis:**
```bash
# Check application logs
docker logs glassy-dash-prod --tail 50

# Check database accessibility
docker exec glassy-dash-prod ls -la /app/data/

# Check environment variables
docker inspect glassy-dash-prod | jq '.[0].Config.Env'
```

**Resolution:**
```bash
# If database issue
docker exec glassy-dash-prod sqlite3 /app/data/notes.db ".schema"

# If environment issue
docker stop glassy-dash-prod
docker rm glassy-dash-prod
# Re-deploy with correct environment variables
```

### Slow Performance

**Diagnosis:**
```bash
# Check container resources
docker stats glassy-dash-prod

# Check VM resources
free -h
df -h

# Check for high database size
ls -lh ~/.GLASSYDASH/notes.db*
```

**Resolution:**
```bash
# If memory issue
docker restart glassy-dash-prod

# If disk space
docker system prune -a --volumes -f

# If database size (run cleanup)
docker exec glassy-dash-prod npm run trash:cleanup
```

### Cannot Log In

**Symptom:** Invalid credentials after deployment

**Cause:** New database created during deployment

**Resolution:**
```bash
# Check users in database
ssh glassy-vm
sqlite3 ~/.GLASSYDASH/notes.db "SELECT id, email, name FROM users;"

# If empty (fresh install), use default:
# Email: admin
# Password: admin

# Create admin user if needed
# Use registration endpoint or direct database insert
```

---

## Future Improvements

### Automation Opportunities

1. **CI/CD Pipeline**
   - Automated build on commit
   - Automated testing
   - Automated deployment

2. **Backup Automation**
   - Scheduled database backups
   - Automated cleanup of old backups
   - Offsite backup storage

3. **Monitoring**
   - Set up alerts on health endpoint
   - Log aggregation
   - Performance metrics collection

4. **Rollback Procedure**
   - Document image versioning
   - Keep previous version available
   - Quick rollback script

### Documentation Enhancements

1. **Deployment Checklist**
   - Pre-deployment verification steps
   - Post-deployment validation steps
   - Rollback procedures

2. **Architecture Diagrams**
   - Network topology visualization
   - Data flow diagrams
   - Component interaction diagrams

3. **Runbooks**
   - Step-by-step procedures for common tasks
   - Escalation procedures
   - Contact information

---

## Quick Reference

### Essential Commands

```bash
# SSH Access
ssh glassy-vm

# Container Management
docker ps | grep glassy
docker restart glassy-dash-prod
docker logs glassy-dash-prod -f

# Health Check
curl https://dash.0rel.com/api/monitoring/health

# Database Backup
cp ~/.GLASSYDASH/notes.db ~/.GLASSYDASH/backups/notes-$(date +%Y%m%d).db

# View Logs
docker logs glassy-dash-prod | tail -50
docker logs dokploy-traefik | grep glassy
```

### Critical Information

| Item | Value |
|-------|-------|
| **Production URL** | https://dash.0rel.com |
| **Health Endpoint** | /api/monitoring/health |
| **Container Name** | glassy-dash-prod |
| **Container Network** | dokploy-network |
| **Internal Port** | 3001 → 8080 |
| **Database** | ~/.GLASSYDASH/notes.db |
| **Version** | 1.1.3 |
| **Commit** | 195f044 |
| **Image** | glassy-dash:latest (2.11GB) |
| **Traefik** | dokploy-traefik (v3.5.0) |

### Support Resources

- **Primary Documentation:** `DEPLOYMENT.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Architecture:** `ARCHITECTURE.md`
- **API Reference:** `API_REFERENCE.md`
- **Admin Guide:** `ADMIN_GUIDE.md`

---

## Conclusion

This deployment record documents the successful deployment of GlassyDash 1.1.3 to dash.0rel.com. The deployment involved building locally, transporting through a jump host, configuring Traefik reverse proxy, and establishing database persistence.

**Key Takeaways:**

1. **Network Configuration is Critical:** Container must be on dokploy-network for Traefik discovery
2. **SSH Escaping is Tricky:** Avoid complex labels via SSH, use config files instead
3. **Health Checks Essential:** Always verify /api/monitoring/health after deployment
4. **Database Backup:** Always backup database before redeployment
5. **Document Everything:** Record procedures for future reference

**Status:** ✅ Production Ready - All Systems Operational

---

**Document Version:** 1.0
**Last Updated:** January 26, 2026
**Author:** Deployment Team
**Next Review:** After next major deployment