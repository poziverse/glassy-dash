# GlassyDash Deployment Process Documentation

**Version:** 1.1.3 | **Last Updated:** January 26, 2026

---

## 📋 Overview

This document explains the complete deployment process for GlassyDash to production (dash.0rel.com). It covers the methodology, infrastructure, step-by-step procedures, and best practices.

**Target Audience:** DevOps Engineers, System Administrators
**Infrastructure Complexity:** Medium (nested VM with jump host)
**Estimated Deployment Time:** 15-30 minutes

---

## 🏗️ Infrastructure Architecture

### Network Topology

```
┌─────────────────┐
│  User Browser   │
└────────┬────────┘
         │ HTTPS (443)
         ↓
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare DNS (dash.0rel.com)                 │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS (443)
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  Jump Host (104.225.217.232)                    │
│  - User: poziverse                                │
│  - Purpose: SSH bastion only                       │
└─────────────────────┬───────────────────────────────────┘
                      │ SSH Tunnel (Port Forwarding)
                      ↓
┌─────────────────────────────────────────────────────────────┐
│  Production VM (192.168.122.45) - glassy-vm      │
│  - User: pozi                                     │
│  - OS: Linux 6.6                                 │
│  - Docker: Running                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ↓                           ↓
┌──────────────────┐      ┌──────────────────┐
│ dokploy-traefik │      │ glassy-dash-prod│
│ (v3.5.0)       │      │ (Application)    │
│ - Port: 80,443  │      │ - Port: 8080     │
│ - SSL: Let's    │      │ - Network:        │
│   Encrypt       │      │   dokploy-network│
└──────────────────┘      └──────────────────┘
        │                           │
        └──────────┬────────────────┘
                   │ HTTP (8080)
                   ↓
           ┌──────────────────┐
           │ GlassyDash App  │
           │ (v1.1.3)       │
           └──────────────────┘
```

### Key Infrastructure Components

| Component          | Role                    | Details                                  |
| ------------------ | ----------------------- | ---------------------------------------- |
| **Cloudflare DNS** | DNS Resolution          | Points dash.0rel.com to jump host        |
| **Jump Host**      | SSH Bastion             | 104.225.217.232 (poziverse)              |
| **Production VM**  | Application Host        | 192.168.122.45 (pozi)                    |
| **Docker**         | Container Orchestration | Manages application containers           |
| **Traefik**        | Reverse Proxy           | SSL termination, routing, load balancing |
| **SQLite**         | Database                | Persistent data storage                  |

### Why This Architecture?

1. **Security**
   - Nested VM isolates production environment
   - Jump host provides additional security layer
   - No direct SSH access to production VM

2. **Scalability**
   - Docker containers easy to scale
   - Traefik handles multiple services
   - Volume mounts separate data from code

3. **Flexibility**
   - Easy to update by replacing containers
   - Database backups straightforward
   - Can roll back to previous versions

---

## 🔄 Deployment Methodology

### Build Strategy: Local Build, Remote Deploy

**Why Build Locally?**

1. **Resource Efficiency**
   - VM has limited resources (~97GB disk)
   - Local machine typically more powerful
   - Faster build times

2. **Bandwidth Optimization**
   - Build heavy dependencies locally (node_modules, npm packages)
   - Transfer only compiled artifacts
   - Compressed Docker image (~300MB vs ~1GB)

3. **Testing Flexibility**
   - Test build locally before deployment
   - Catch issues early
   - Verify production build works

### Deployment Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Local Build                                 │
│  1. Navigate to project directory                      │
│  2. Build Docker image                                 │
│  3. Save and compress image                            │
│  4. Verify build artifacts                              │
└──────────────────────┬────────────────────────────────────┘
                       │ Compressed Docker Image
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Transport to Jump Host                      │
│  1. SCP image to jump host (104.225.217.232)        │
│  2. Verify transfer complete                          │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: Transport to Production VM                  │
│  1. SSH to jump host                                │
│  2. SCP from jump to production VM                   │
│  3. Verify transfer complete                          │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: Deploy on Production VM                     │
│  1. Load Docker image                                 │
│  2. Stop old container                               │
│  3. Start new container                              │
│  4. Configure networking                             │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: Verification                              │
│  1. Check container status                            │
│  2. Test health endpoint                             │
│  3. Verify external access                          │
│  4. Monitor logs                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Step-by-Step Deployment Guide

### Prerequisites

**Local Machine:**

- Docker installed and running
- Docker CLI tools available
- SSH configured for jump host access
- Write access to project directory

**Network Access:**

- SSH access to jump host (104.225.217.232)
- Network connectivity to production VM
- SSH keys properly configured

**Source Code:**

- Latest code pulled from repository
- Version updated in package.json
- CHANGELOG.md updated

### Phase 1: Local Build (10-15 minutes)

#### Step 1.1: Navigate to Project

```bash
cd glassy-dash/GLASSYDASH
```

**Verify:**

```bash
pwd
# Should output: /path/to/glassy-dash/GLASSYDASH

ls -la
# Should show: package.json, Dockerfile, src/, etc.
```

#### Step 1.2: Check for Uncommitted Changes

```bash
git status
```

**Expected Output:**

```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

**If there are uncommitted changes:**

- Commit them first
- Or stash them if not relevant

#### Step 1.3: Verify Version

```bash
cat package.json | grep '"version"'
```

**Expected Output:**

```
"version": "1.1.3",
```

#### Step 1.4: Build Docker Image

```bash
docker build -t glassy-dash:latest .
```

**What This Does:**

- Reads Dockerfile
- Installs dependencies in container
- Builds React application (npm run build)
- Copies production artifacts (dist/)
- Sets up entry point

**Expected Duration:** 5-10 minutes

**Monitor Progress:**

```bash
# Build progresses through stages:
# 1. Base image pull
# 2. Dependencies install
# 3. Application build
# 4. Final image assembly
```

#### Step 1.5: Verify Build Artifacts

```bash
ls -lh dist/
```

**Expected Output:**

```
index.html (~0.6KB)
assets/
  index-*.css (~109KB)
  index-*.js (~2.1MB)
```

**If dist/ doesn't exist or is empty:**

- Build failed
- Check Dockerfile for npm run build step
- Review build logs

#### Step 1.6: Save and Compress Image

```bash
docker save glassy-dash:latest | gzip > glassy-dash.tar.gz
```

**What This Does:**

- Exports Docker image to tar archive
- Compresses with gzip (reduces size ~70%)
- Creates single file for transfer

**Expected Duration:** 2-5 minutes

**Verify Output:**

```bash
ls -lh glassy-dash.tar.gz
# Should be ~300MB (compressed)
```

#### Step 1.7: Verify Image Size

```bash
docker images | grep glassy-dash
```

**Expected Output:**

```
glassy-dash   latest   <image_id>   2.11GB   5 minutes ago
```

**Critical:** The uncompressed image should be ~2.11GB

### Phase 2: Transport to Jump Host (5-10 minutes)

#### Step 2.1: Copy to Jump Host

```bash
scp glassy-dash.tar.gz glassy-jump:~/
```

**What This Does:**

- Transfers compressed image over SSH
- Uses SCP (Secure Copy Protocol)
- Requires SSH config setup

**Monitor Progress:**

```
glassy-dash.tar.gz                    100%  300MB   5:00
```

**Troubleshooting:**

- **If SSH config not found:** Use full host: `scp glassy-dash.tar.gz poziverse@104.225.217.232:~/`
- **If transfer fails:** Check network connectivity, verify SSH keys
- **SSH Key Passphrase:** You will be prompted for the SSH key passphrase (`Maplewood2025`).
- **If slow:** Try during off-peak hours

#### Step 2.2: Verify Transfer

```bash
ssh glassy-jump "ls -lh ~/glassy-dash.tar.gz"
```

**Expected Output:**

```
-rw-r--r-- 1 poziverse poziverse 300M Jan 26 20:00 glassy-dash.tar.gz
```

### Phase 3: Transport to Production VM (5-10 minutes)

#### Step 3.1: Transfer to Production VM

```bash
ssh -t glassy-jump "scp ~/glassy-dash.tar.gz pozi@192.168.122.45:~/"
```

**What This Does:**

- SSH into jump host
- Execute SCP command on jump host
- Transfer from jump host to production VM
- Use `-t` flag for pseudo-terminal

**Monitor Progress:**

```
glassy-dash.tar.gz                    100%  300MB   5:00
```

**Why Two-Stage Transfer?**

- Cannot SSH directly to production VM
- Must proxy through jump host
- Security isolation
- **Note:** You will be prompted for the SSH key passphrase (`Maplewood2025`) and the VM password (`pozi`).

#### Step 3.2: Verify Transfer

```bash
ssh glassy-vm "ls -lh ~/glassy-dash.tar.gz"
```

**Expected Output:**

```
-rw-r--r-- 1 pozi pozi 300M Jan 26 20:10 glassy-dash.tar.gz
```

### Phase 4: Deploy on Production VM (5-10 minutes)

#### Step 4.1: Connect to Production VM

```bash
ssh glassy-vm
```

**Expected Output:**

```
Warning: Permanently added '104.225.217.232' (ED25519) to the list of known hosts.
Warning: Permanently added '192.168.122.45' (ED25519) to the list of known hosts.
pozi@192.168.122.45:~$
```

#### Step 4.2: Verify Transfer Complete

```bash
ls -lh ~/glassy-dash.tar.gz
```

**Expected:** File exists and is ~300MB

#### Step 4.3: Load Docker Image

```bash
gunzip -c glassy-dash.tar.gz | sudo docker load
```

**What This Does:**

- Decompresses tar.gz archive
- Pipes to docker load command
- Imports image into Docker registry

**Expected Duration:** 3-5 minutes

**Expected Output:**

```
Loaded image: glassy-dash:latest
sha256:<image_hash>
```

#### Step 4.4: Verify Image Loaded

```bash
docker images | grep glassy-dash
```

**Expected Output:**

```
glassy-dash   latest   <image_hash>   2.11GB   2 minutes ago
```

**Critical:** Image should be ~2.11GB

#### Step 4.5: Check Current Container

```bash
docker ps | grep glassy-dash
```

**Expected Output (if running):**

```
<container_id>   glassy-dash:latest   "docker-entrypoint.s…"   Up 12 hours   0.0.0.0:3001->8080/tcp   glassy-dash-prod
```

#### Step 4.6: Backup Database (Optional but Recommended)

```bash
# Create backup directory
mkdir -p ~/.GLASSYDASH/backups

# Backup current database
cp ~/.GLASSYDASH/notes.db ~/.GLASSYDASH/backups/notes-$(date +%Y%m%d-%H%M%S).db

# Verify backup
ls -lh ~/.GLASSYDASH/backups/
```

**Why Backup?**

- Deployment creates fresh database if missing
- Preserves user data and notes
- Enables rollback if needed

#### Step 4.7: Stop Old Container

```bash
sudo docker stop glassy-dash-prod && sudo docker rm glassy-dash-prod
```

**What This Does:**

- Gracefully stops container
- Removes container definition
- Frees up port 3001
- Preserves database (in volume mount)

**Expected Output:**

```
glassy-dash-prod
glassy-dash-prod
```

#### Step 4.8: Start New Container

```bash
sudo docker run -d \
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

**Breakdown of Flags:**

| Flag                    | Value                        | Purpose                           |
| ----------------------- | ---------------------------- | --------------------------------- |
| `-d`                    | -                            | Run in detached mode (background) |
| `--name`                | glassy-dash-prod             | Container name                    |
| `--network`             | dokploy-network              | Join Traefik network              |
| `--restart`             | unless-stopped               | Auto-restart on reboot            |
| `-p`                    | 3001:8080                    | Map host 3001 to container 8080   |
| `-e NODE_ENV`           | production                   | Production mode                   |
| `-e API_PORT`           | 8080                         | API server port                   |
| `-e JWT_SECRET`         | glassy-dash-prod-secret-2025 | JWT signing key                   |
| `-e DB_FILE`            | /app/data/notes.db           | Database path                     |
| `-e ADMIN_EMAILS`       | admin                        | Default admin                     |
| `-e ALLOW_REGISTRATION` | false                        | Disable signup                    |
| `-v`                    | ~/.GLASSYDASH:/app/data      | Volume mount for persistence      |

**Critical Flag:** `--network dokploy-network`

- Must join dokploy-network
- Allows Traefik to discover container
- Without this, external routing fails

**Expected Output:**

```
<container_id>
```

#### Step 4.9: Verify Container Running

```bash
docker ps | grep glassy-dash
```

**Expected Output:**

```
<container_id>   glassy-dash:latest   "docker-entrypoint.s…"   Up 1 minute   0.0.0.0:3001->8080/tcp   glassy-dash-prod
```

**Check:**

- Container is "Up" (not "Exited")
- Port mapping is correct (0.0.0.0:3001->8080)
- Container name is glassy-dash-prod

### Phase 5: Verification (5-10 minutes)

#### Step 5.1: Check Container Logs

```bash
docker logs glassy-dash-prod --tail 20
```

**Expected Output:**

```
✓ GlassyDash started on port 8080
✓ Database connected
✓ Tables initialized
✓ Ready to accept connections
```

**If Errors:**

- Database errors: Check volume mount, file permissions
- Port errors: Verify port 3001 not in use
- Network errors: Check dokploy-network membership

#### Step 5.2: Test Local Health Endpoint

```bash
curl http://localhost:3001/api/monitoring/health
```

**Expected Output:**

```json
{
  "status": "healthy",
  "timestamp": "2026-01-27T01:26:46.635Z",
  "uptime": 60.0,
  "checks": {
    "database": { "status": "healthy", "tables": 5 },
    "cache": { "status": "healthy", "size": 0 },
    "memory": { "status": "healthy", "heapUsed": "10 MB" },
    "diskSpace": { "status": "healthy", "databaseSize": "0.00 MB" }
  }
}
```

**Key Checks:**

- status: "healthy"
- database: healthy
- All checks: healthy

#### Step 5.3: Test External Health Endpoint

```bash
curl https://dash.0rel.com/api/monitoring/health
```

**Expected Output:** Same as local health check

**If 502 Bad Gateway:**

- Traefik not routing to container
- Check container is on dokploy-network
- Restart Traefik if needed

#### Step 5.4: Check Traefik Discovery

```bash
docker logs dokploy-traefik | grep glassy-dash
```

**Expected Output:**

```
time="..." level=info msg="Configuration received from provider docker..."
time="..." level=info msg="Creating middleware..."
time="..." level=info msg="Creating router..."
time="..." level=info msg="Creating service..."
```

**If No Output:**

- Container not on dokploy-network
- Traefik not discovering container
- Restart container with correct network

#### Step 5.5: Monitor Startup (2-5 minutes)

```bash
docker logs -f glassy-dash-prod
```

**Watch For:**

- Database initialization
- API server start
- Ready message
- No errors or warnings

**Exit monitoring:** Ctrl+C

#### Step 5.6: Test Application Access

```bash
# In browser
https://dash.0rel.com
```

**Expected:**

- Page loads successfully
- Login screen appears
- No console errors
- Styles load correctly

#### Step 5.7: Test Default Login

```
Email: admin
Password: admin
```

**Expected:**

- Login successful
- Dashboard loads
- Can create notes

---

## 🔧 Configuration Details

### Environment Variables

| Variable             | Value                        | Description                                     |
| -------------------- | ---------------------------- | ----------------------------------------------- |
| `NODE_ENV`           | production                   | Node environment mode                           |
| `API_PORT`           | 8080                         | Internal API port                               |
| `JWT_SECRET`         | glassy-dash-prod-secret-2025 | JWT signing secret (CHANGE THIS IN PRODUCTION!) |
| `DB_FILE`            | /app/data/notes.db           | SQLite database file path                       |
| `ADMIN_EMAILS`       | admin                        | Default admin email addresses                   |
| `ALLOW_REGISTRATION` | false                        | Enable/disable user registration                |

### Volume Mounts

| Host Path       | Container Path | Purpose                 |
| --------------- | -------------- | ----------------------- |
| `~/.GLASSYDASH` | `/app/data`    | Persistent data storage |

**What's Mounted:**

- Database file (notes.db)
- Database write-ahead log (notes.db-wal)
- Shared memory file (notes.db-shm)
- Any user uploads or caches

### Network Configuration

| Network           | Purpose                           |
| ----------------- | --------------------------------- |
| `dokploy-network` | Traefik discovery network         |
| `bridge`          | Default Docker network (not used) |

**Critical:** Container MUST be on `dokploy-network` for Traefik routing.

### Port Mappings

| Host Port | Container Port | Purpose           |
| --------- | -------------- | ----------------- |
| 3001      | 8080           | HTTP API endpoint |

**External Access:**

- Port 80: HTTP (redirects to 443)
- Port 443: HTTPS (via Traefik)

---

## 🐛 Common Issues and Solutions

### Issue 1: 502 Bad Gateway

**Symptoms:**

- dash.0rel.com returns 502
- Local localhost:3001 works

**Root Cause:**
Container not on dokploy-network, Traefik can't route

**Solution:**

```bash
# Check network
docker inspect glassy-dash-prod | grep NetworkMode

# If not dokploy-network, redeploy:
docker stop glassy-dash-prod && docker rm glassy-dash-prod
docker run -d --name glassy-dash-prod --network dokploy-network \
  --restart unless-stopped -p 3001:8080 \
  -e NODE_ENV=production -e API_PORT=8080 \
  -e JWT_SECRET='glassy-dash-prod-secret-2025' \
  -e DB_FILE=/app/data/notes.db -e ADMIN_EMAILS='admin' \
  -e ALLOW_REGISTRATION=false \
  -v ~/.GLASSYDASH:/app/data glassy-dash:latest
```

### Issue 2: Container Exits Immediately

**Symptoms:**

- Container status: "Exited"
- Container uptime: < 1 second

**Root Cause:**

- Database file permission error
- Volume mount path incorrect
- Port conflict

**Solution:**

```bash
# Check logs
docker logs glassy-dash-prod

# If permission error:
sudo chown -R pozi:pozi ~/.GLASSYDASH

# If port conflict:
netstat -tlnp | grep 3001
# Find and stop conflicting process
```

### Issue 3: Database Not Found

**Symptoms:**

- App starts but can't access data
- Health check shows database error

**Root Cause:**

- Volume mount not set correctly
- Database directory doesn't exist

**Solution:**

```bash
# Check mount
docker inspect glassy-dash-prod | grep -A 10 Mounts

# If mount missing or wrong:
docker stop glassy-dash-prod && docker rm glassy-dash-prod
docker run -d --name glassy-dash-prod --network dokploy-network \
  --restart unless-stopped -p 3001:8080 \
  -e NODE_ENV=production -e API_PORT=8080 \
  -e JWT_SECRET='glassy-dash-prod-secret-2025' \
  -e DB_FILE=/app/data/notes.db -e ADMIN_EMAILS='admin' \
  -e ALLOW_REGISTRATION=false \
  -v ~/.GLASSYDASH:/app/data glassy-dash:latest
```

### Issue 4: Traefik Not Discovering Container

**Symptoms:**

- 502 Bad Gateway
- Traefik logs show no entries for glassy-dash

**Root Cause:**

- Container not on dokploy-network
- Traefik restart needed

**Solution:**

```bash
# Check container network
docker inspect glassy-dash-prod | grep NetworkMode

# Should show: "NetworkMode": "dokploy-network"

# Restart Traefik
docker restart dokploy-traefik

# Wait 30 seconds, then test
curl https://dash.0rel.com/api/monitoring/health
```

### Issue 5: Transfer Fails

**Symptoms:**

- SCP connection refused
- Transfer times out
- Permission denied

**Root Cause:**

- SSH keys not configured
- Network connectivity issue
- Disk space full

**Solution:**

```bash
# Test SSH connectivity
ssh glassy-jump "echo 'Connected'"
ssh glassy-vm "echo 'Connected'"

# Check disk space
ssh glassy-jump "df -h"
ssh glassy-vm "df -h"

# If full, clean up:
ssh glassy-vm "docker system prune -a --volumes -f"

# Verify SSH keys
ssh -v glassy-jump  # Verbose mode
```

---

## 📊 Monitoring and Maintenance

### Daily Monitoring

```bash
# Check container health
docker ps | grep glassy-dash

# Check health endpoint
curl -s https://dash.0rel.com/api/monitoring/health | jq .

# Check logs for errors
docker logs glassy-dash-prod --since 24h | grep -i error
```

### Weekly Maintenance

```bash
# Backup database
ssh glassy-vm
mkdir -p ~/.GLASSYDASH/backups
cp ~/.GLASSYDASH/notes.db ~/.GLASSYDASH/backups/notes-$(date +%Y%m%d).db

# Check disk space
df -h ~/.GLASSYDASH

# Clean up old backups (keep last 7)
find ~/.GLASSYDASH/backups -name "*.db" -mtime +7 -delete
```

### Monthly Maintenance

```bash
# Update Docker images (if applicable)
docker pull glassy-dash:latest

# Clean up Docker resources
docker system prune -a --volumes -f

# Check for security updates
ssh glassy-vm "sudo apt-get update && sudo apt-get upgrade -y"

# Review and rotate logs
docker logs glassy-dash-prod --tail 1000 > ~/glassy-dash-$(date +%Y%m).log
```

---

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Verify latest code pulled from repository
- [ ] Check version in package.json matches target version
- [ ] Run tests locally: `npm test`
- [ ] Build production image: `docker build -t glassy-dash:latest .`
- [ ] Verify build artifacts in dist/
- [ ] Save and compress image: `docker save glassy-dash:latest | gzip > glassy-dash.tar.gz`
- [ ] Check image size (~300MB compressed, ~2.11GB uncompressed)
- [ ] Backup current database: `cp ~/.GLASSYDASH/notes.db ~/.GLASSYDASH/backups/`

### Deployment

- [ ] Transfer to jump host: `scp glassy-dash.tar.gz glassy-jump:~/`
- [ ] Verify transfer complete on jump host
- [ ] Transfer to production VM: `ssh -t glassy-jump "scp ~/glassy-dash.tar.gz pozi@192.168.122.45:~/"`
- [ ] Verify transfer complete on production VM
- [ ] Load Docker image: `gunzip -c glassy-dash.tar.gz | sudo docker load`
- [ ] Verify image loaded: `docker images | grep glassy-dash`
- [ ] Stop old container: `docker stop glassy-dash-prod && docker rm glassy-dash-prod`
- [ ] Start new container with correct flags
- [ ] Verify container is running: `docker ps | grep glassy-dash`

### Post-Deployment

- [ ] Check container logs for errors: `docker logs glassy-dash-prod --tail 50`
- [ ] Test local health: `curl http://localhost:3001/api/monitoring/health`
- [ ] Test external health: `curl https://dash.0rel.com/api/monitoring/health`
- [ ] Verify Traefik discovery: `docker logs dokploy-traefik | grep glassy-dash`
- [ ] Test application in browser: https://dash.0rel.com
- [ ] Test login with default credentials
- [ ] Monitor for 5-10 minutes for stability
- [ ] Document any issues encountered
- [ ] Update deployment records

---

## 🔄 Rollback Procedure

### Quick Rollback (If Container Issues)

```bash
ssh glassy-vm

# Stop and remove new container
docker stop glassy-dash-prod && docker rm glassy-dash-prod

# Restart previous version (if still loaded)
# Check available images:
docker images | grep glassy-dash

# Start previous version
docker run -d --name glassy-dash-prod --network dokploy-network \
  --restart unless-stopped -p 3001:8080 \
  -e NODE_ENV=production -e API_PORT=8080 \
  -e JWT_SECRET='glassy-dash-prod-secret-2025' \
  -e DB_FILE=/app/data/notes.db -e ADMIN_EMAILS='admin' \
  -e ALLOW_REGISTRATION=false \
  -v ~/.GLASSYDASH:/app/data glassy-dash:previous-version
```

### Database Rollback (If Data Issues)

```bash
ssh glassy-vm

# Stop container
docker stop glassy-dash-prod

# Restore database backup
cp ~/.GLASSYDASH/backups/notes-YYYYMMDD-HHMMSS.db ~/.GLASSYDASH/notes.db

# Restart container
docker start glassy-dash-prod

# Verify health
curl https://dash.0rel.com/api/monitoring/health
```

### Full Rollback (Build Previous Version)

```bash
# 1. Checkout previous version locally
cd glassy-dash/GLASSYDASH
git checkout <previous-tag-or-commit>

# 2. Build image
docker build -t glassy-dash:rollback .
docker save glassy-dash:rollback | gzip > glassy-dash-rollback.tar.gz

# 3. Transfer and deploy (follow standard deployment process)
scp glassy-dash-rollback.tar.gz glassy-jump:~/
ssh -t glassy-jump "scp ~/glassy-dash-rollback.tar.gz pozi@192.168.122.45:~/"
ssh glassy-vm
gunzip -c glassy-dash-rollback.tar.gz | sudo docker load
docker stop glassy-dash-prod && docker rm glassy-dash-prod
docker run -d --name glassy-dash-prod --network dokploy-network \
  --restart unless-stopped -p 3001:8080 \
  -e NODE_ENV=production -e API_PORT=8080 \
  -e JWT_SECRET='glassy-dash-prod-secret-2025' \
  -e DB_FILE=/app/data/notes.db -e ADMIN_EMAILS='admin' \
  -e ALLOW_REGISTRATION=false \
  -v ~/.GLASSYDASH:/app/data glassy-dash:rollback

# 4. Verify
curl https://dash.0rel.com/api/monitoring/health
```

---

## 📚 Related Documentation

- **Quick Reference:** `QUICK_REFERENCE.md`
- **Deployment Record:** `DEPLOYMENT_RECORD_2026-01-26.md`
- **Changelog:** `CHANGELOG.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Architecture:** `ARCHITECTURE.md`
- **API Reference:** `API_REFERENCE.md`

---

## 💡 Best Practices

1. **Always Backup Before Deployment**
   - Backup database
   - Document current version
   - Keep previous image available

2. **Test Before Deploying**
   - Build locally first
   - Test production build
   - Verify health endpoint

3. **Monitor After Deployment**
   - Watch logs for 5-10 minutes
   - Test all critical functionality
   - Verify external access

4. **Document Everything**
   - Record deployment steps
   - Note any issues
   - Update CHANGELOG.md

5. **Plan Rollback**
   - Keep previous version accessible
   - Know rollback procedure
   - Test rollback occasionally

---

## 🎯 Summary

This deployment process provides a reliable, repeatable method for deploying GlassyDash to production. The key success factors are:

1. **Local Build:** Faster, uses local resources
2. **Two-Stage Transfer:** Necessary for nested VM architecture
3. **Docker Network:** Critical for Traefik routing
4. **Health Verification:** Confirms successful deployment
5. **Documentation:** Enables future deployments

**Process Version:** 1.0
**Last Updated:** January 26, 2026
**GlassyDash Version:** 1.1.3
