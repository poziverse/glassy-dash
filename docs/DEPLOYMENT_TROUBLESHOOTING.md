# Deployment Troubleshooting Guide

**Version:** 1.0  
**Last Updated:** January 31, 2026  
**Target Audience:** DevOps Engineers, System Administrators

---

## Table of Contents

- [Quick Reference](#quick-reference)
- [Pre-Deployment Issues](#pre-deployment-issues)
- [Build Issues](#build-issues)
- [Docker Issues](#docker-issues)
- [Network and SSH Issues](#network-and-ssh-issues)
- [Database Issues](#database-issues)
- [Environment Variable Issues](#environment-variable-issues)
- [SSL/HTTPS Issues](#sslhttps-issues)
- [Performance Issues](#performance-issues)
- [Post-Deployment Issues](#post-deployment-issues)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Debugging](#monitoring-and-debugging)

---

## Quick Reference

### Common Error Codes

| Error Code | Description | Quick Fix |
|-------------|-------------|------------|
| `ECONNREFUSED` | Connection refused | Check if server is running |
| `ETIMEDOUT` | Connection timeout | Check firewall/network |
| `EACCES` | Permission denied | Check file permissions |
| `ENOTFOUND` | DNS resolution failed | Check domain configuration |
| `EADDRINUSE` | Port already in use | Kill process or change port |
| `500` | Internal server error | Check server logs |
| `502` | Bad gateway | Check upstream server |
| `503` | Service unavailable | Check if services are running |

### Emergency Commands

```bash
# Check if GlassyDash is running
ssh -p 2222 pozicontrol@89.117.20.104 "docker ps"

# Restart GlassyDash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose restart"

# View logs
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose logs -f"

# Check disk space
ssh -p 2222 pozicontrol@89.117.20.104 "df -h"

# Check memory
ssh -p 2222 pozicontrol@89.117.20.104 "free -h"
```

---

## Pre-Deployment Issues

### Issue: SSH Connection Refused

**Symptoms:**
```
ssh: connect to host 89.117.20.104 port 2222: Connection refused
```

**Causes:**
1. SSH service not running on server
2. Wrong SSH port
3. Firewall blocking connection
4. Server is down

**Solutions:**

**1. Check Server Status:**
```bash
# From local machine
ping 89.117.20.104

# Check if SSH is listening on correct port
nmap -p 2222 89.117.20.104
```

**2. Try Default SSH Port:**
```bash
ssh pozicontrol@89.117.20.104
```

**3. Check Firewall:**
```bash
# From server (if you can access via console)
sudo ufw status
sudo ufw allow 2222/tcp
```

**4. Restart SSH Service:**
```bash
# From server console
sudo systemctl restart sshd
sudo systemctl status sshd
```

---

### Issue: SSH Permission Denied

**Symptoms:**
```
Permission denied (publickey,password).
```

**Causes:**
1. Wrong SSH key
2. Key not added to agent
3. Wrong username
4. Account locked

**Solutions:**

**1. Check SSH Key:**
```bash
# List available keys
ls -la ~/.ssh/

# Try with explicit key
ssh -i ~/.ssh/your_key -p 2222 pozicontrol@89.117.20.104
```

**2. Add Key to Agent:**
```bash
ssh-add ~/.ssh/your_key
```

**3. Verify Username:**
```bash
# Double-check username
# Try: root@89.117.20.104 if pozicontrol doesn't work
```

**4. Reset SSH Key (Last Resort):**
```bash
# From server console
# Regenerate SSH keys and update local known_hosts
rm -f ~/.ssh/known_hosts
```

---

### Issue: Git Repository Not Found

**Symptoms:**
```
fatal: repository 'https://github.com/username/glassy-dash.git' not found
```

**Causes:**
1. Wrong repository URL
2. No internet access on server
3. Repository is private without authentication
4. GitHub is down

**Solutions:**

**1. Verify Repository URL:**
```bash
# Check correct URL in package.json or config
cat GLASSYDASH/.git/config
```

**2. Test GitHub Connectivity:**
```bash
# From server
curl -I https://github.com
```

**3. Use SSH Instead of HTTPS:**
```bash
# If using personal access token
git clone git@github.com:username/glassy-dash.git
```

**4. Check Authentication:**
```bash
# If private repo, configure credentials
git config --global credential.helper store
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## Build Issues

### Issue: npm install Fails

**Symptoms:**
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

**Causes:**
1. Node.js version incompatible
2. npm cache corruption
3. Network issues
4. Missing dependencies

**Solutions:**

**1. Check Node.js Version:**
```bash
# Verify version
node --version
npm --version

# Should be Node.js v18+ and npm v9+
# If wrong, update:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**2. Clear npm Cache:**
```bash
npm cache clean --force
```

**3. Delete node_modules:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**4. Use Legacy Peer Dependencies:**
```bash
npm install --legacy-peer-deps
```

---

### Issue: Build Timeout

**Symptoms:**
```
Error: Timeout of 300000ms exceeded
```

**Causes:**
1. Low server resources
2. Large dependencies
3. Network latency

**Solutions:**

**1. Increase Timeout:**
```bash
# In .npmrc
timeout=600000
```

**2. Build Locally Then Transfer:**
```bash
# Build on local machine
npm run build

# Transfer dist/ to server
scp -P 2222 -r dist/ pozicontrol@89.117.20.104:/var/www/glassy-dash/
```

**3. Use Build Caching:**
```bash
# Build with cache
npm run build -- --cache
```

---

### Issue: Production Build Fails

**Symptoms:**
```
Build failed with errors
```

**Causes:**
1. TypeScript errors
2. Missing environment variables
3. Code errors in production build

**Solutions:**

**1. Check Build Locally:**
```bash
npm run build
npm run preview
```

**2. Run Linter:**
```bash
npm run lint
npm run lint:fix
```

**3. Verify Environment Variables:**
```bash
# Check .env file exists
ls -la server/.env

# Verify required variables
cat server/.env | grep -E "PORT|DATABASE_PATH|JWT_SECRET"
```

**4. Check TypeScript Errors:**
```bash
npx tsc --noEmit
```

---

## Docker Issues

### Issue: Docker Compose Fails to Start

**Symptoms:**
```
ERROR: for glassy-dash  Cannot start service glassy-dash:
```

**Causes:**
1. Port already in use
2. Volume mount issues
3. Invalid Dockerfile
4. Insufficient resources

**Solutions:**

**1. Check Port Conflicts:**
```bash
# Check what's using ports
ssh -p 2222 pozicontrol@89.117.20.104 "netstat -tlnp | grep -E '80|443|8080'"

# Kill process if needed
ssh -p 2222 pozicontrol@89.117.20.104 "sudo kill -9 <PID>"
```

**2. Check Volume Mounts:**
```bash
# Verify directory exists and has correct permissions
ssh -p 2222 pozicontrol@89.117.20.104 "ls -la /var/www/glassy-dash/data/"

# Fix permissions
ssh -p 2222 pozicontrol@89.117.20.104 "sudo chown -R pozicontrol:pozicontrol /var/www/glassy-dash/data/"
```

**3. Rebuild Docker Images:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose build --no-cache"
```

**4. Check Docker Resources:**
```bash
# Check disk space
ssh -p 2222 pozicontrol@89.117.20.104 "df -h"

# Check Docker disk usage
ssh -p 2222 pozicontrol@89.117.20.104 "docker system df"
```

---

### Issue: Container Keeps Restarting

**Symptoms:**
```
Restarting (1) 5 seconds ago
```

**Causes:**
1. Application crash
2. Missing environment variables
3. Database connection error
4. Port binding issue

**Solutions:**

**1. Check Container Logs:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose logs glassy-dash"
```

**2. Check Exit Code:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "docker ps -a | grep glassy-dash"
# Exit code 1: Application error
# Exit code 137: Killed (OOM)
# Exit code 125: Docker daemon error
```

**3. Check Environment Variables:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose config"
```

**4. Check Database Connection:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && ls -la data/notes.db"
```

---

### Issue: Cannot Access Container Shell

**Symptoms:**
```
Error: No such container: glassy-dash
```

**Causes:**
1. Container not running
2. Wrong container name
3. Docker daemon not running

**Solutions:**

**1. List All Containers:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "docker ps -a"
```

**2. Start Container:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose up -d"
```

**3. Access Running Container:**
```bash
# Get container ID
CONTAINER_ID=$(ssh -p 2222 pozicontrol@89.117.20.104 "docker ps -q | head -1")

# Access shell
ssh -p 2222 pozicontrol@89.117.20.104 "docker exec -it $CONTAINER_ID sh"
```

---

## Network and SSH Issues

### Issue: Cannot Connect to Deployed Site

**Symptoms:**
```
This site can't be reached
ERR_CONNECTION_TIMED_OUT
```

**Causes:**
1. Server firewall blocking
2. Nginx not running
3. Domain DNS issues
4. SSL certificate issues

**Solutions:**

**1. Check Firewall:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "sudo ufw status"
ssh -p 2222 pozicontrol@89.117.20.104 "sudo ufw allow 80/tcp"
ssh -p 2222 pozicontrol@89.117.20.104 "sudo ufw allow 443/tcp"
```

**2. Check Nginx:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "sudo systemctl status nginx"
ssh -p 2222 pozicontrol@89.117.20.104 "sudo nginx -t"
ssh -p 2222 pozicontrol@89.117.20.104 "sudo systemctl restart nginx"
```

**3. Check Docker Ports:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "docker ps | grep -E '80|443'"
```

**4. Test Locally on Server:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "curl -I http://localhost"
```

---

### Issue: SSH Connection Drops

**Symptoms:**
```
Connection reset by peer
client_loop: send disconnect: Broken pipe
```

**Causes:**
1. Network instability
2. SSH timeout
3. Server load
4. NAT/firewall timeout

**Solutions:**

**1. Increase SSH Timeout:**
```bash
# In ~/.ssh/config
Host 89.117.20.104
    HostName 89.117.20.104
    Port 2222
    User pozicontrol
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

**2. Use tmux/screen:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104
tmux new -s deploy
# Run commands here
# Detach: Ctrl+B, D
# Reattach: ssh... then tmux attach -t deploy
```

**3. Check Server Load:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "uptime"
```

---

## Database Issues

### Issue: Database Locked

**Symptoms:**
```
Error: Database is locked
SQLITE_BUSY: database is locked
```

**Causes:**
1. Another process using database
2. WAL files not cleaned up
3. Database corruption

**Solutions:**

**1. Kill Zombie Processes:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "ps aux | grep sqlite"
ssh -p 2222 pozicontrol@89.117.20.104 "sudo killall sqlite3"
```

**2. Remove WAL Files:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && rm -f data/notes.db-shm data/notes.db-wal"
```

**3. Restart Container:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose restart"
```

**4. Check Database Integrity:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "sqlite3 /var/www/glassy-dash/data/notes.db 'PRAGMA integrity_check;'"
```

---

### Issue: Database Migration Failed

**Symptoms:**
```
Error: Migration failed
Table already exists
```

**Causes:**
1. Migration already run
2. Migration file error
3. Database schema mismatch

**Solutions:**

**1. Check Migration Status:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && sqlite3 data/notes.db 'SELECT * FROM migrations;'"
```

**2. Run Specific Migration:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && npm run migrate"
```

**3. Rollback Migration:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && sqlite3 data/notes.db 'DROP TABLE IF EXISTS new_table;'"
```

**4. Check Migration File:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cat server/migrations/latest.js"
```

---

## Environment Variable Issues

### Issue: Missing Environment Variables

**Symptoms:**
```
Error: JWT_SECRET is not defined
PORT is not defined
```

**Causes:**
1. .env file not created
2. Variables not loaded
3. Wrong variable names

**Solutions:**

**1. Check .env File:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cat server/.env"
```

**2. Create .env File:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cat > /var/www/glassy-dash/server/.env << EOF
PORT=8080
NODE_ENV=production
DATABASE_PATH=../data/notes.db
JWT_SECRET=your-secure-secret-key-here
JWT_EXPIRES_IN=7d
AI_ENABLED=true
CORS_ORIGIN=https://yourdomain.com
MAX_FILE_SIZE=10485760
EOF"
```

**3. Generate Secure JWT Secret:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
```

**4. Restart Container:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose restart"
```

---

### Issue: Environment Variables Not Loaded

**Symptoms:**
```
undefined is not a function
Error: Cannot read property of undefined
```

**Causes:**
1. .env file in wrong location
2. Dotenv package not configured
3. Container rebuilt without .env

**Solutions:**

**1. Verify Location:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "ls -la /var/www/glassy-dash/server/.env"
```

**2. Check Docker Compose:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cat /var/www/glassy-dash/docker-compose.yml | grep env_file"
```

**3. Rebuild Container:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose down && docker-compose up -d --build"
```

---

## SSL/HTTPS Issues

### Issue: SSL Certificate Expired

**Symptoms:**
```
NET::ERR_CERT_DATE_INVALID
Your connection is not private
```

**Causes:**
1. Certificate expired
2. Time sync issues
3. Wrong certificate installed

**Solutions:**

**1. Check Certificate Expiry:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "sudo certbot certificates"
```

**2. Renew Certificate:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "sudo certbot renew"
ssh -p 2222 pozicontrol@89.117.20.104 "sudo systemctl reload nginx"
```

**3. Check Server Time:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "date"
ssh -p 2222 pozicontrol@89.117.20.104 "sudo systemctl restart systemd-timesyncd"
```

---

### Issue: SSL Certificate Not Found

**Symptoms:**
```
nginx: [emerg] SSL certificate not found
```

**Causes:**
1. Certificate not generated
2. Wrong certificate path
3. Certificate files deleted

**Solutions:**

**1. Generate Certificate:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "sudo certbot --nginx -d yourdomain.com"
```

**2. Check Certificate Path:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "ls -la /etc/letsencrypt/live/yourdomain.com/"
```

**3. Update Nginx Config:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "sudo nano /etc/nginx/sites-available/glassy-dash"
# Verify paths are correct
```

---

## Performance Issues

### Issue: Slow Page Load

**Symptoms:**
- Site takes 10+ seconds to load
- Resources loading slowly
- High TTFB (Time to First Byte)

**Causes:**
1. Low server resources
2. Not using CDN
3. Large bundle size
4. Database queries slow

**Solutions:**

**1. Check Server Resources:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "free -h"
ssh -p 2222 pozicontrol@89.117.20.104 "df -h"
ssh -p 2222 pozicontrol@89.117.20.104 "top"
```

**2. Enable Compression:**
```bash
# In nginx config
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

**3. Check Bundle Size:**
```bash
# From local
npm run build
du -sh dist/assets/
```

**4. Enable Caching:**
```bash
# In nginx config
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

### Issue: High Memory Usage

**Symptoms:**
```
Container killed due to OOM
Memory usage > 90%
```

**Causes:**
1. Memory leak
2. Too many cached items
3. Large database
4. Insufficient RAM

**Solutions:**

**1. Check Memory Usage:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "docker stats"
ssh -p 2222 pozicontrol@89.117.20.104 "free -h"
```

**2. Increase Memory Limit:**
```bash
# In docker-compose.yml
services:
  glassy-dash:
    mem_limit: 2g
```

**3. Clear AI Cache:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "rm -rf /var/www/glassy-dash/data/ai-cache/*"
```

**4. Optimize Database:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "sqlite3 /var/www/glassy-dash/data/notes.db 'VACUUM;'"
```

---

## Post-Deployment Issues

### Issue: Site Shows Old Version

**Symptoms:**
- Deployed changes not visible
- Browser showing cached version
- Database not updated

**Causes:**
1. Browser cache
2. Old Docker image
3. Dist not rebuilt
4. CDN cache

**Solutions:**

**1. Clear Browser Cache:**
- Hard refresh: Ctrl+F5 or Cmd+Shift+R
- Clear cache: DevTools → Application → Clear Storage

**2. Force Docker Rebuild:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose build --no-cache && docker-compose up -d"
```

**3. Verify Git Pull:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && git log -1"
```

**4. Clear CDN Cache:**
```bash
# If using CloudFlare, etc., clear cache from dashboard
# Or purge via API
curl -X PURGE https://yourdomain.com/*
```

---

### Issue: API Endpoints Return 404

**Symptoms:**
```
404 Not Found
/api/notes
```

**Causes:**
1. Wrong API URL
2. Proxy misconfiguration
3. Backend not running
4. Route not registered

**Solutions:**

**1. Check Backend Logs:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose logs glassy-dash | tail -50"
```

**2. Test API Directly:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "curl -I http://localhost:8080/api/health"
```

**3. Check Nginx Proxy:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cat /etc/nginx/sites-available/glassy-dash | grep location"
```

**4. Verify Routes:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "docker exec -it \$(docker ps -q | head -1) cat /app/server/index.js | grep router"
```

---

### Issue: Authentication Fails

**Symptoms:**
```
401 Unauthorized
Invalid token
Session expired
```

**Causes:**
1. JWT secret mismatch
2. Token expired
3. Database user issue
4. CORS error

**Solutions:**

**1. Check JWT Secret:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cat /var/www/glassy-dash/server/.env | grep JWT_SECRET"
```

**2. Regenerate JWT Secret:**
```bash
NEW_SECRET=$(ssh -p 2222 pozicontrol@89.117.20.104 "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"")
ssh -p 2222 pozicontrol@89.117.20.104 "sed -i 's/^JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/' /var/www/glassy-dash/server/.env"
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose restart"
```

**3. Check Database Users:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "sqlite3 /var/www/glassy-dash/data/notes.db 'SELECT id, email FROM users;'"
```

**4. Check CORS Configuration:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cat /var/www/glassy-dash/server/.env | grep CORS_ORIGIN"
```

---

## Rollback Procedures

### Emergency Rollback

**When to Use:**
- Critical bugs in production
- Data corruption
- Security issues
- Performance degradation

**Quick Rollback (Docker):**
```bash
# 1. Stop current deployment
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose down"

# 2. Revert to previous git commit
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && git reset --hard HEAD~1"

# 3. Restart
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose up -d --build"

# 4. Verify
ssh -p 2222 pozicontrol@89.117.20.104 "docker ps && curl -I http://localhost"
```

---

### Database Rollback

**1. Backup Before Any Changes:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cp /var/www/glassy-dash/data/notes.db /var/www/glassy-dash/data/notes.db.backup.$(date +%Y%m%d_%H%M%S)"
```

**2. Restore from Backup:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cp /var/www/glassy-dash/data/notes.db.backup.20260130_120000 /var/www/glassy-dash/data/notes.db"
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose restart"
```

**3. Check Available Backups:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "ls -lth /var/www/glassy-dash/data/notes.db.backup*"
```

---

## Monitoring and Debugging

### Real-Time Monitoring

**1. View Live Logs:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose logs -f"
```

**2. Monitor Container Resources:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "docker stats --no-stream"
```

**3. Check Server Health:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "curl http://localhost:8080/api/monitoring/health"
```

**4. Monitor Error Logs:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose logs glassy-dash | grep -i error"
```

---

### Health Checks

**Database Health:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "sqlite3 /var/www/glassy-dash/data/notes.db 'PRAGMA integrity_check;'"
```

**Nginx Health:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "sudo systemctl status nginx"
```

**Docker Health:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "docker ps | grep glassy-dash"
```

**Network Health:**
```bash
ssh -p 2222 pozicontrol@89.117.20.104 "ping -c 3 google.com"
ssh -p 2222 pozicontrol@89.117.20.104 "curl -I https://github.com"
```

---

### Debug Mode

**Enable Debug Logging:**
```bash
# Update .env
ssh -p 2222 pozicontrol@89.117.20.104 "echo 'DEBUG=true' >> /var/www/glassy-dash/server/.env"

# Restart
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose restart"

# View debug logs
ssh -p 2222 pozicontrol@89.117.20.104 "cd /var/www/glassy-dash && docker-compose logs -f | grep DEBUG"
```

---

## Prevention Strategies

### Pre-Deployment Checklist

- [ ] Verify all tests pass locally
- [ ] Check Node.js version compatibility
- [ ] Verify environment variables
- [ ] Backup database
- [ ] Test production build locally
- [ ] Verify SSH access
- [ ] Check server disk space
- [ ] Verify SSL certificate validity
- [ ] Review recent git commits
- [ ] Prepare rollback plan

### Regular Maintenance

**Weekly:**
- Check disk space
- Review error logs
- Monitor performance metrics
- Backup database

**Monthly:**
- Update dependencies
- Renew SSL certificates
- Review security patches
- Optimize database
- Test backup restoration

**Quarterly:**
- Security audit
- Performance review
- Capacity planning
- Documentation update

---

## Additional Resources

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment procedures
- **[API_REFERENCE.md](API_REFERENCE.md)** - API documentation
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - General troubleshooting
- **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)** - Admin documentation

---

## Support

If you encounter issues not covered in this guide:

1. **Check Logs** - Review all available logs
2. **Health Checks** - Run all health checks
3. **Community** - Search forums and GitHub issues
4. **Contact Support** - Submit detailed bug report

**When Submitting Bug Reports:**
- Include error messages
- Attach logs
- Describe reproduction steps
- Include server environment details

---

**Document Version:** 1.0  
**Last Updated:** January 31, 2026  
**Status:** Complete