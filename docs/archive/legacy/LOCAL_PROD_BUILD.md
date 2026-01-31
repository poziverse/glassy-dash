# GLASSYDASH - Local Production Build Guide

Complete guide to building GLASSYDASH for production testing locally.

---

## Overview

This guide covers building a production-optimized version of GLASSYDASH for local testing before deployment. Production builds are:
- Minified and optimized
- Have hot-swapping disabled
- Use production environment variables
- Are ready for Docker deployment

---

## Prerequisites

- **Node.js 18+** and npm
- **Docker** (optional, for containerized testing)
- At least 2GB free disk space

---

## Method 1: Native Production Build

### Step 1: Navigate to Project

```bash
cd /home/pozicontrol/projects/glassy-dash/GLASSYDASH
```

### Step 2: Install Dependencies (if not already done)

```bash
npm install
```

### Step 3: Set Production Environment Variables

Create a `.env.production` file:

```bash
cat > .env.production << 'EOF'
NODE_ENV=production
API_PORT=8080
JWT_SECRET=production-secret-key-change-this
DB_FILE=/app/data/notes.db
ADMIN_EMAILS=admin
ALLOW_REGISTRATION=false
EOF
```

### Step 4: Build for Production

```bash
npm run build
```

This command:
- Runs Vite in production mode
- Optimizes all assets (CSS, JS, images)
- Minifies JavaScript and CSS
- Generates source maps (for debugging)
- Creates static assets in `dist/` directory

**Build time:** ~1-3 minutes

**Output:**
```
vite v7.1.1 building for production...
✓ 2560 modules transformed.
dist/index.html                   0.45 kB
dist/assets/index-abc123.js      245.67 kB │ gzip: 78.32 kB
dist/assets/index-def456.css      42.15 kB │ gzip: 12.34 kB
```

### Step 5: Start Production Server

```bash
# Option 1: Use Node directly
NODE_ENV=production node server/index.js

# Option 2: Use the scheduler with production mode
NODE_ENV=production node server/index.js
```

The server will:
- Serve production build from `dist/` directory
- Listen on port 8080 (or your configured API_PORT)
- Connect to SQLite database
- Run all API endpoints

**Access:** http://localhost:8080

### Step 6: Test Production Build

```bash
# Using curl to test health endpoint
curl http://localhost:8080/api/monitoring/health

# Expected response:
# {"status":"ok","timestamp":"2026-01-26T10:00:00.000Z"}
```

Open browser: **http://localhost:8080**

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin`

---

## Method 2: Production Preview (Vite)

### Build and Preview

```bash
# Step 1: Build
npm run build

# Step 2: Preview production build
npm run preview
```

This runs the production build with Vite's preview server:
- Serves static files from `dist/`
- Auto-reloads on file changes
- Useful for testing production optimizations
- Runs on port 4173 by default

**Access:** http://localhost:4173

**Note:** This is frontend-only. API endpoints will fail without the backend server.

---

## Method 3: Docker Production Build

### Step 1: Build Production Docker Image

```bash
cd /home/pozicontrol/projects/glassy-dash/GLASSYDASH
docker build -t glassy-dash:prod .
```

This uses the production `Dockerfile` (not `Dockerfile.dev`):
- Multi-stage build for smaller image size
- Production Node.js runtime
- Optimized for production deployment

**Build time:** ~5-10 minutes

**Image size:** ~400-600 MB

### Step 2: Create Data Directory

```bash
mkdir -p ~/.glassy-dash-prod
```

### Step 3: Run Production Container

```bash
docker run -d \
  --name glassy-dash-prod \
  --restart unless-stopped \
  -p 3001:8080 \
  -e NODE_ENV=production \
  -e API_PORT=8080 \
  -e JWT_SECRET="production-secret-key-change-this" \
  -e DB_FILE=/app/data/notes.db \
  -e ADMIN_EMAILS="admin" \
  -e ALLOW_REGISTRATION=false \
  -v ~/.glassy-dash-prod:/app/data \
  glassy-dash:prod
```

### Step 4: Verify Container is Running

```bash
# Check container status
docker ps | grep glassy-dash-prod

# View logs
docker logs glassy-dash-prod

# Test health endpoint
curl http://localhost:3001/api/monitoring/health
```

**Access:** http://localhost:3001

### Step 5: Stop Container (when done)

```bash
docker stop glassy-dash-prod
docker rm glassy-dash-prod
```

---

## Production Build Optimization

### What Gets Optimized

1. **JavaScript**
   - Minified with Terser
   - Dead code elimination (tree-shaking)
   - Code splitting for faster initial load

2. **CSS**
   - Minified with PostCSS
   - Tailwind CSS purged (removes unused styles)
   - Critical CSS inlined

3. **Assets**
   - Images compressed
   - Fonts optimized
   - Source maps generated for debugging

4. **Bundle Size**
   - Development: ~2-3 MB
   - Production: ~400-600 KB (gzipped)

---

## Environment-Specific Differences

| Feature | Development | Production |
|---------|-------------|------------|
| Build Mode | Vite dev server | Optimized static files |
| Source Maps | Enabled | Generated (not loaded) |
| Hot Reload | Enabled | Disabled |
| Minification | Disabled | Enabled |
| Console Logs | All logs | Warnings and errors only |
| API Proxy | Vite proxy | Direct server connection |
| Port | 5173 (frontend) | 8080 (full stack) |

---

## Testing Production Build Locally

### Checklist

Before deploying to production, test these items:

#### Functionality Tests
- [ ] User can register/login
- [ ] Admin panel accessible
- [ ] Create, edit, delete notes
- [ ] Create, edit, delete documents
- [ ] Voice recording and transcription
- [ ] Image upload and display
- [ ] Search functionality
- [ ] AI assistant
- [ ] Export/Import features
- [ ] Settings and themes

#### Performance Tests
- [ ] Initial load time < 3 seconds
- [ ] Navigation between views is instant
- [ ] Large notes load quickly
- [ ] No console errors
- [ ] No memory leaks

#### Security Tests
- [ ] API endpoints protected
- [ ] JWT authentication works
- [ ] CORS configured correctly
- [ ] SQL injection protection active
- [ ] Rate limiting works

#### Environment Tests
- [ ] Production environment variables loaded
- [ ] Database connections work
- [ ] File uploads work
- [ ] Scheduler runs background tasks

---

## Production Build Output

### Directory Structure After Build

```
GLASSYDASH/
├── dist/                    # Production build output
│   ├── index.html           # Entry point
│   └── assets/
│       ├── index-[hash].js   # Minified JavaScript
│       ├── index-[hash].css  # Minified CSS
│       └── [images, fonts]  # Optimized assets
├── server/
│   ├── index.js            # Express server (unchanged)
│   └── data/              # SQLite database
├── node_modules/           # Dependencies (unchanged)
└── package.json            # Dependencies (unchanged)
```

### Build Artifacts

The `dist/` directory contains:
- **HTML**: Single entry point with injected assets
- **JavaScript**: ~250 KB (minified, ~78 KB gzipped)
- **CSS**: ~42 KB (minified, ~12 KB gzipped)
- **Assets**: Images, fonts, icons
- **Source Maps**: For debugging (optional)

---

## Troubleshooting Production Builds

### Build Fails

**Error:** `Error: Build failed with errors`

**Solution:**
```bash
# Clear build artifacts
rm -rf dist

# Clear Node cache
rm -rf node_modules/.vite

# Try building again
npm run build
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::8080`

**Solution:**
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use different port
export API_PORT=8081
node server/index.js
```

### Database Not Found

**Error:** `SQLITE_CANTOPEN: unable to open database file`

**Solution:**
```bash
# Ensure data directory exists
mkdir -p server/data

# Check file permissions
chmod 755 server/data

# Database will be auto-created on first run
```

### Docker Build Fails

**Error:** `failed to solve: executor failed running`

**Solution:**
```bash
# Clear Docker cache
docker builder prune -a

# Build without cache
docker build --no-cache -t glassy-dash:prod .

# Check Docker disk space
docker system df
```

### Assets Not Loading

**Error:** `404 Not Found` for assets

**Solution:**
```bash
# Verify dist directory exists
ls -la dist/

# Check Express static file serving
# In server/index.js, ensure:
# app.use(express.static('dist'))

# Restart server
```

---

## Performance Metrics

### Build Performance

| Metric | Development | Production |
|--------|-------------|------------|
| Build Time | Instant | 1-3 minutes |
| Bundle Size | 2-3 MB | 400-600 KB |
| Initial Load | 3-5 seconds | 1-2 seconds |
| Runtime Performance | Good | Excellent |

### Runtime Performance

- **First Contentful Paint**: < 1.5 seconds
- **Time to Interactive**: < 3 seconds
- **Lighthouse Score**: 90+ (Performance)
- **Bundle Size**: 78 KB gzipped

---

## Deploying Production Build

After successful local testing, prepare for deployment:

### 1. Docker Image Preparation

```bash
# Tag image for deployment
docker tag glassy-dash:prod glassy-dash:latest

# Save compressed image
docker save glassy-dash:prod | gzip > glassy-dash.tar.gz

# Check file size
ls -lh glassy-dash.tar.gz
# Should be ~300-400 MB
```

### 2. Verify Before Deployment

```bash
# Test image works locally
docker run --rm -p 3002:8080 glassy-dash:prod

# Access at http://localhost:3002
# Verify all features work
```

### 3. Deploy to Server

See `DEPLOYMENT.md` for full deployment instructions.

---

## Clean Up

### After Testing

```bash
# Stop production server
# Press Ctrl+C in terminal

# Remove production build (optional)
rm -rf dist

# Stop Docker container
docker stop glassy-dash-prod
docker rm glassy-dash-prod

# Remove Docker image (optional)
docker rmi glassy-dash:prod
```

---

## Comparison: Development vs Production

### Development
```bash
npm run dev
# - Hot reload enabled
# - Source maps active
# - Full console logging
# - Vite dev server
# - API proxy to :8080
# - Port: 5173
```

### Production
```bash
npm run build && node server/index.js
# - Optimized build
# - Minified assets
# - No hot reload
# - Production logging
# - Express server serves static files
# - Direct API access
# - Port: 8080
```

---

## Best Practices

1. **Always test production build locally before deploying**
2. **Use environment-specific config files** (.env, .env.production)
3. **Monitor build size** - alert if increases > 10%
4. **Test critical user flows** in production mode
5. **Check console for errors** in production build
6. **Verify database migrations** work in production
7. **Test with production-like data** (large notes, many images)
8. **Verify performance metrics** meet requirements

---

## Next Steps

After successful local production build:

1. ✅ Verify all features work
2. ✅ Check performance metrics
3. ✅ Test with production-like data
4. ✅ Review console logs for errors
5. ✅ Package Docker image
6. ✅ Deploy to staging/production

---

## Additional Resources

- **Development Setup**: `LOCAL_DEV_SETUP.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Performance**: `docs/DEPLOYMENT.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`

---

**Last Updated:** January 26, 2026  
**Version:** 1.0.0