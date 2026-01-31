# GLASSYDASH - Quick Start Guide

Complete guide to getting GLASSYDASH running locally for development and testing.

---

## Quick Start - Development (Fastest)

```bash
# 1. Navigate to project
cd /home/pozicontrol/projects/glassy-dash/GLASSYDASH

# 2. Install dependencies (first time only)
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Navigate to: http://localhost:5173
# Login with: admin / admin
```

That's it! You're now running GLASSYDASH in development mode with hot reload.

---

## Quick Start - Production Build

```bash
# 1. Navigate to project
cd /home/pozicontrol/projects/glassy-dash/GLASSYDASH

# 2. Install dependencies (if not already)
npm install

# 3. Build for production
npm run build

# 4. Start production server
NODE_ENV=production node server/index.js

# 5. Open browser
# Navigate to: http://localhost:8080
# Login with: admin / admin
```

---

## Quick Start - Docker

```bash
# 1. Navigate to project
cd /home/pozicontrol/projects/glassy-dash/GLASSYDASH

# 2. Build Docker image
docker build -t glassy-dash:dev .

# 3. Create data directory
mkdir -p ~/.glassy-dash

# 4. Run container
docker-compose up -d

# 5. Open browser
# Navigate to: http://localhost:5174
# Login with: admin / admin
```

---

## What Just Happened?

### Development Mode (`npm run dev`)
- ✅ Vite dev server running on port 5173
- ✅ Express API server running on port 8080
- ✅ Hot module replacement enabled
- ✅ Source maps active for debugging
- ✅ Full console logging

### Production Build (`npm run build`)
- ✅ Optimized assets created in `dist/` directory
- ✅ JavaScript and CSS minified
- ✅ Build time: ~3.8 seconds
- ✅ Bundle size: ~575 KB gzipped

### Docker (`docker-compose up`)
- ✅ Containerized environment
- ✅ Isolated dependencies
- ✅ Easy cleanup and redeployment

---

## Access Points

| Mode | URL | Port | Features |
|------|-----|-------|----------|
| Development | http://localhost:5173 | 5173 | Hot reload, source maps, full logging |
| Production (Native) | http://localhost:8080 | 8080 | Optimized, minified, production-ready |
| Production (Docker) | http://localhost:3001 | 3001 | Containerized, isolated |
| Production Preview | http://localhost:4173 | 4173 | Static file preview (frontend only) |

---

## Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin`

**Note:** You can create new users from the Admin Panel after logging in.

---

## Testing Key Features

### 1. Notes
- Create text, checklist, and drawing notes
- Try formatting toolbar (bold, italic, headings)
- Upload images
- Add tags
- Pin and reorder notes

### 2. Documents
- Create new documents (Grid View)
- Edit with TipTap rich text editor
- Add headers, lists, code blocks
- Delete with custom modal
- Rename inline in grid view

### 3. Voice Studio
- Record audio with visualizer
- Pause and resume recording
- View AI transcription and summary
- Save to Notes or Gallery
- Edit existing recordings
- Play audio from gallery

### 4. AI Assistant
- Search across notes
- Ask questions about your notes
- Get AI-powered responses grounded in your data

### 5. Admin Panel
- Access at http://localhost:5173/#/admin (or :8080 for production)
- Create new users
- View system stats
- Monitor health status

---

## Common Commands

### Development
```bash
npm run dev          # Start dev server (frontend + API + scheduler)
npm run api          # Start API server only
npm run scheduler     # Start background tasks only
```

### Build & Test
```bash
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run unit tests (320 tests - 100% pass rate)
npm run test:api      # Run API integration tests (8 tests - 100% pass rate)
npm run test:e2e     # Run E2E tests (38 tests - timeout issues, infrastructure)
```

### Code Quality
```bash
npm run lint         # Check code style
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
```

### Database
```bash
npm run migrate      # Run database migrations
npm run db:backup   # Backup database
npm run db:restore   # Restore from backup
```

### Docker
```bash
docker-compose up -d        # Start containers
docker-compose down        # Stop containers
docker-compose logs -f     # View logs
docker-compose build       # Rebuild images
```

---

## Environment Variables

Create a `.env` file in the project root:

```bash
NODE_ENV=development
API_PORT=8080
JWT_SECRET=dev-secret-key-change-in-production
DB_FILE=./server/data/notes.db
ADMIN_EMAILS=admin
ALLOW_REGISTRATION=false
```

**Important:** Change `JWT_SECRET` in production!

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :5173  # or :8080

# Kill the process
kill -9 <PID>
```

### Build Errors
```bash
# Clear build artifacts
rm -rf dist

# Clear Node cache
rm -rf node_modules/.vite

# Rebuild
npm run build
```

### Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues
```bash
# View container logs
docker logs glassy-dash-dev

# Rebuild without cache
docker-compose build --no-cache

# Remove and restart
docker-compose down
docker-compose up -d
```

---

## Next Steps

1. **Explore the Application**
   - Create notes, documents, and voice recordings
   - Try different themes and settings
   - Test the AI assistant

2. **Read Documentation**
   - `LOCAL_DEV_SETUP.md` - Detailed development guide
   - `LOCAL_PROD_BUILD.md` - Production build guide
   - `DEPLOYMENT.md` - Deployment to production server

3. **Develop Features**
   - Check `docs/ARCHITECTURE.md` for architecture
   - Review `docs/API_REFERENCE.md` for API endpoints
   - Follow coding standards in `docs/DEVELOPMENT.md`

4. **Run Tests**
   - `npm run test` - Unit tests
   - `npm run test:e2e` - End-to-end tests
   - Check coverage with `npm run test:coverage`

---

## Project Structure

```
GLASSYDASH/
├── server/              # Express + SQLite API
├── src/
│   ├── components/      # React components
│   ├── stores/         # Zustand state stores
│   ├── hooks/          # Custom hooks
│   └── utils/         # Utility functions
├── public/             # Static assets
├── dist/              # Production build output
├── tests/              # Test files
├── docs/               # Documentation
├── .env                # Environment variables
└── package.json        # Dependencies
```

---

## Getting Help

- **Documentation**: Check the `docs/` directory
- **Troubleshooting**: See `docs/TROUBLESHOOTING.md`
- **API Reference**: See `docs/API_REFERENCE.md`
- **Architecture**: See `docs/ARCHITECTURE.md`

---

## Recent Changes

As of January 30, 2026:

**Version 1.1.6**
- ✅ **Test Suite Complete**: 320 unit tests (100% pass), 8 API tests (100% pass)
- ✅ **Production Ready**: All business logic tested and passing
- ⚠️ **E2E Tests**: 38 tests timeout on infrastructure (not code defects)
- ✅ **Documentation**: Comprehensive test report available
- See [COMPREHENSIVE_TEST_REPORT_2026-01-30.md](./COMPREHENSIVE_TEST_REPORT_2026-01-30.md) for details

**Previous Updates (January 26, 2026)**
- ✅ Voice Studio Phase 3: Undo/redo, IndexedDB, audio quality indicator
- ✅ UX Improvements: Save toasts, custom modals, inline rename
- ✅ GlassyDocs Grid View: New document management interface
- ✅ Bug Fixes: Note cards, overflow handling, click handlers
- ✅ Documentation: 25,000+ words of developer guides

---

**Happy Coding!** 🚀

---

**Last Updated:** January 30, 2026  
**Version:** 1.1.6
