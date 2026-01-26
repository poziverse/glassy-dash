# GLASSYDASH - Local Development Setup Guide

Complete guide to setting up GLASSYDASH for local development and testing.

---

## Prerequisites

- **Node.js 18+** (recommended: 18.x or 20.x)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- **Modern web browser** (Chrome, Firefox, Edge, Safari)

---

## Method 1: Native Development (Recommended)

### Step 1: Navigate to Project Directory

```bash
cd /home/pozicontrol/projects/glassy-dash/GLASSYDASH
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required dependencies including:
- React 19 and Vite 7
- Express.js backend
- SQLite database
- UI libraries (Tailwind CSS, Lucide Icons, Framer Motion)
- State management (Zustand)
- AI integrations (Google Gemini, Llama 3.2)

**Installation time:** ~2-5 minutes

### Step 3: Set Environment Variables

Create a `.env` file in the project root:

```bash
cat > .env << 'EOF'
NODE_ENV=development
API_PORT=8080
JWT_SECRET=dev-secret-key-change-in-production
DB_FILE=./server/data/notes.db
ADMIN_EMAILS=admin
ALLOW_REGISTRATION=false
EOF
```

Or set inline:

```bash
# Linux/macOS
export ADMIN_EMAILS="admin"

# Windows PowerShell
set ADMIN_EMAILS="admin"
```

### Step 4: Initialize Database (Optional)

The database will be created automatically on first run. To initialize manually:

```bash
npm run migrate
```

### Step 5: Start Development Server

```bash
npm run dev
```

This starts three services simultaneously:
- **Frontend (Vite)**: http://localhost:5173
- **API Server**: http://localhost:8080
- **Scheduler**: Background tasks

**Output example:**
```
[WEB] VITE v7.1.1 ready in 375ms
[WEB] ➜  Local:   http://localhost:5173/
[WEB] ➜  Network: use --host to expose
[API] Server running on port 8080
[SCHEDULER] Scheduler started
```

### Step 6: Access the Application

Open your browser and navigate to: **http://localhost:5173**

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin`

---

## Method 2: Docker Development

### Step 1: Build Docker Image

```bash
cd /home/pozicontrol/projects/glassy-dash/GLASSYDASH
docker build -f Dockerfile.dev -t glassy-dash:dev .
```

### Step 2: Create Data Directory

```bash
mkdir -p ~/.glassy-dash
```

### Step 3: Run Docker Container

```bash
docker-compose up -d
```

Or manually:

```bash
docker run -d \
  --name glassy-dash-dev \
  --restart unless-stopped \
  -p 5174:5173 \
  -p 3001:8080 \
  -e NODE_ENV=development \
  -e API_PORT=8080 \
  -e JWT_SECRET=dev-please-change-in-production \
  -e DB_FILE=/app/data/notes.db \
  -e ADMIN_EMAILS=admin \
  -v "$PWD:/app" \
  -v ~/.glassy-dash:/app/data \
  glassy-dash:dev
```

### Step 4: Access the Application

Open your browser and navigate to: **http://localhost:5174**

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin`

---

## Development Workflow

### Running Tests

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Linting and Formatting

```bash
# Check code style
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Database Management

```bash
# Run migrations
npm run migrate

# Rollback migrations
npm run migrate:rollback

# Check migration status
npm run migrate:status

# Backup database
npm run db:backup

# Restore database
npm run db:restore

# List backups
npm run db:list

# Cleanup old backups
npm run db:cleanup

# View database stats
npm run db:stats
```

### Cleanup Operations

```bash
# Cleanup trash/deleted notes
npm run trash:cleanup

# View trash statistics
npm run trash:stats
```

### Scheduler Management

```bash
# Start scheduler
npm run scheduler:start

# Stop scheduler
npm run scheduler:stop

# Trigger scheduled task manually
npm run scheduler:trigger

# Check scheduler status
npm run scheduler:status
```

---

## Project Structure for Development

```
GLASSYDASH/
├── server/                 # Express + SQLite API
│   ├── index.js           # Main API server
│   ├── data/              # SQLite database (auto-created)
│   ├── migrations/        # Database migrations
│   ├── scheduler.js       # Background tasks
│   └── cleanup.js        # Cleanup utilities
├── src/
│   ├── components/        # React components
│   │   ├── voice/       # Voice Studio components
│   │   ├── docs/        # Documents components
│   │   └── notes/       # Notes components
│   ├── stores/           # Zustand state stores
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── contexts/         # React contexts
│   ├── App.jsx          # Main app router
│   └── main.jsx         # Entry point
├── public/               # Static assets
├── tests/               # Test files
├── .env                 # Environment variables
├── vite.config.js       # Vite configuration
├── docker-compose.yml    # Docker configuration
└── package.json         # Dependencies and scripts
```

---

## Common Development Tasks

### Add a New Feature

1. Create component in `src/components/`
2. Add route in `src/App.jsx`
3. Add state store if needed in `src/stores/`
4. Test your changes
5. Run linter: `npm run lint:fix`
6. Format code: `npm run format`

### Debug API Issues

```bash
# View API logs in terminal
# API runs on :8080
# Check .env for configuration
```

### Debug Frontend Issues

```bash
# Check browser console for errors
# React DevTools is recommended
# Check Vite logs in terminal
```

### Reset Development Environment

```bash
# Stop all processes
# Press Ctrl+C in terminal

# Clear node_modules
rm -rf node_modules

# Clear package-lock.json
rm -f package-lock.json

# Reinstall dependencies
npm install

# Start fresh
npm run dev
```

---

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::8080`

**Solution:**
```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use different ports
export API_PORT=8081
npm run dev
```

### Dependencies Not Installing

**Error:** `npm ERR! code ERESOLVE`

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try installing with legacy peer deps
npm install --legacy-peer-deps

# Or update Node.js to latest LTS
nvm install --lts
nvm use --lts
npm install
```

### Database Errors

**Error:** `SQLITE_CANTOPEN: unable to open database file`

**Solution:**
```bash
# Ensure data directory exists
mkdir -p server/data

# Check file permissions
chmod 755 server/data

# Recreate database
rm -f server/data/notes.db
npm run dev
```

### Vite Proxy Issues

**Error:** `Proxy error: Could not proxy request`

**Solution:**
```bash
# Ensure API is running separately
npm run api

# Check vite.config.js proxy settings
# Should proxy /api to http://localhost:8080
```

### Docker Issues

**Container won't start:**
```bash
# Check logs
docker logs glassy-dash-dev

# Rebuild image
docker-compose build --no-cache

# Remove and recreate container
docker-compose down
docker-compose up -d
```

---

## Hot Reloading

The development server supports hot module replacement (HMR):

- **Frontend changes**: Auto-refresh in browser
- **API changes**: Auto-restart nodemon
- **CSS changes**: Instant update without refresh

**Note:** Database migrations require manual restart.

---

## Production Preview Locally

To test production build locally:

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Access at http://localhost:4173
```

---

## Next Steps

1. **Explore Features**: Try creating notes, documents, and voice recordings
2. **Admin Panel**: Access http://localhost:5173/#/admin
3. **Voice Studio**: Test recording and transcription
4. **Documents**: Try the new Grid View
5. **AI Assistant**: Ask questions about your notes

---

## Additional Resources

- **Full Documentation**: `/docs/` directory
- **API Reference**: `docs/API_REFERENCE.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Deployment**: `DEPLOYMENT.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`

---

**Last Updated:** January 26, 2026  
**Version:** 1.0.0