# Application Architecture & State Logic

## 1. Modular Architecture

**React GlassKeep** operates on a fully modular, Context-driven architecture. The codebase has moved away from a monolithic structure to a separation of concerns between Routing, Views, Layouts, and State.

### Core Structure
- **Root Entry (`App.jsx`)**: Acts as a high-level router and provider shell. It listens to authentication state and hash routes to switch between top-level views (`NotesView`, `AdminView`, `LoginView`, `RegisterView`).
- **`src/contexts/`**: Centralized state management.
  - `AuthContext`: Authentication, session management (JWT), and user profiles.
  - `NotesContext`: Note CRUD, search, filtering, and real-time SSE syncing.
  - `ModalContext`: Complex state machine for note editor modal (formerly ~1000 lines of App code).
  - `ComposerContext`: Logic for creating new notes.
  - `UIContext`: Global UI shells (Toasts, Confirmation Dialogs).
  - `SettingsContext`: User preferences (Theming, View Modes).

- **`src/components/`**: 
  - **Views**: Top-level route targets.
    - `NotesView.jsx`: The main dashboard displaying note grids/lists.
    - `AdminView.jsx`: User management and system stats.
    - `AuthViews.jsx`: Login/Register forms.
  - **Layout**: 
    - `DashboardLayout.jsx`: The application shell containing `Sidebar` and `SearchBar`.
  - **Widgets**: `NoteCard.jsx`, `Composer.jsx`, `SettingsPanel.jsx`.

- **`src/utils/`**: Pure utility functions for API calls, formatting, and image processing.
- **`server/`**: Backend API server with Express.js.
  - `index.js`: Main server entry point.
  - `routes/`: API route handlers.
  - `middleware/`: Security, performance, logging middleware.
  - `utils/`: Server utilities (logger, database helpers).
  - `migrations/`: Database migration system.

---

## 2. State Management & Persistence

The application uses **React Context** as its primary state engine, with persistence layers for both `localStorage` and a remote SQLite backend.

### Context Flow
1. **Providers**: Wrapped at the root in `main.jsx` via `RootProvider`.
2. **Persistence**:
   - `SettingsContext` persists themes and UI preferences to `localStorage`.
   - `NotesContext` syncs note data with backend `/api/notes` with a local cache fallback.
   - `AuthContext` manages JWT tokens in `localStorage`.

### Data Syncing (SSE)
Real-time collaboration is handled via **Server-Sent Events (SSE)**.
- The `useCollaboration` hook (used by `NotesContext`) listens for `note_updated` events.
- When an update occurs, local `NotesContext` invalidates its cache and re-fetches data, ensuring all users see changes instantly.

---

## 3. Theming Engine

The theming system is a hybrid of **React State** and **Tailwind CSS / Variables**.

1. **Context Management (`SettingsContext`)**:
   - Manages `accentColor`, `dark` mode, and `backgroundImage`.
   - Dynamically updates `:root` CSS variables on change.

2. **CSS Layer (`index.css`)**:
   - Tailwind utilities are mapped to `--color-accent` and `--bg-accent`.

---

## 4. Utility Architecture

Heavy logic is moved out of components into `src/utils/helpers.js`:
- **API Wrapper**: A centralized `api()` fetch helper handles timeouts, error parsing, and automatic logout on 401s.
- **Formatting**: `runFormat()` manages markdown injection into textareas.
- **Checklist Logic**: Universal item toggling and reordering helpers.
- **Image Pipeline**: Handles DataURL compression and filename normalization before upload.

---

## 5. Database Architecture

### SQLite Database Structure

**Tables:**
1. **users** - User accounts and authentication
2. **notes** - Notes and content (text, checklist, drawing, image)
3. **checklist_items** - Checklist item data
4. **note_collaborators** - Collaboration relationships
5. **settings** - Application-wide settings
6. **user_settings** - User preferences (theme, AI, notifications)
7. **note_views** - Note analytics and tracking

**Indexes:**
- user_id, pinned, archived, updated_at, type, pinned_to_dashboard (notes)
- note_id (checklist_items)
- note_id, user_id (note_collaborators)
- note_id, user_id, viewed_at (note_views)

### Migration System
- Version tracking via SQLite `user_version` pragma
- Up and down migrations with rollback capability
- Transaction support for atomic changes
- 4 migrations implemented (v1-v4)

---

## 6. Security Architecture

### Multi-Layer Security
1. **Helmet**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
2. **Rate Limiting**: Three tiers (general, auth, API)
3. **Input Validation**: express-validator for all endpoints
4. **XSS Protection**: HTML sanitization middleware
5. **CSRF Protection**: Token-based protection
6. **SQL Injection Prevention**: Pattern detection and prepared statements
7. **Authentication**: JWT-based with bcrypt password hashing

### Security Headers
- Content-Security-Policy (strict with controlled sources)
- Strict-Transport-Security (HSTS, 1 year)
- X-Frame-Options (deny)
- X-Content-Type-Options (nosniff)
- X-XSS-Protection (filter)
- Referrer-Policy (strict-origin-when-cross-origin)
- Permissions-Policy (restricted browser features)

---

## 7. Performance Architecture

### Optimization Layers
1. **Caching**: Three-tier in-memory cache (1min, 5min, 1hour TTL)
2. **Prepared Statements**: Database query optimization
3. **Batch Operations**: Transaction-based bulk operations
4. **Response Compression**: Gzip support
5. **Performance Tracking**: Real-time metrics for requests, database, AI

### Performance Metrics
- Request count, duration, slow percentage
- Database query count, duration, slow percentage
- AI operation count, duration, slow percentage
- Error count, cache hit rate
- Memory usage (heap, RSS, external)
- CPU usage (user, system, cores)

---

## 8. Logging Architecture

### Structured Logging
- **JSON Format**: All logs structured with timestamps and metadata
- **Multiple Levels**: info, warn, error, debug
- **Multiple Destinations**: Console and file output
- **Log Rotation**: 10 MB max size, 30 days retention
- **Specialized Logging**:
  - Request logging (method, path, status, duration)
  - Database operation logging
  - AI operation logging
  - Authentication event logging
  - User action logging
  - System event logging

### Log Files
- `./logs/app.log` - All application logs
- `./logs/error.log` - Error logs only
- Rotated logs: `./logs/app.log.YYYY-MM-DDTHH-mm-ss`

---

## 9. Testing Architecture

### Testing Framework
- **Vitest**: Fast unit testing framework
- **Testing Library**: React component testing
- **jsdom**: DOM implementation for testing
- **Coverage**: @vitest/coverage-v8 with multiple formats

### Test Suites
- **GlassKeep**: 20 test cases (Auth, Notes, Collaboration)
- **DashyDash**: 28 test cases (Widgets, Settings, AI Companion)
- **Total**: 48 test cases covering critical paths

### CI/CD Pipeline
- GitHub Actions workflow
- Runs on push to main/develop and pull requests
- Separate jobs for GlassKeep and DashyDash
- Coverage report generation

---

## 10. Monitoring & Health Checks

### Health Check Endpoints
- **GET /health**: Overall health status (database, cache, memory, disk)
- **GET /ready**: Kubernetes readiness probe (database check only)
- **GET /metrics**: Comprehensive metrics (system, performance, cache, logs, database)
- **GET /metrics/prometheus**: Prometheus-style metrics
- **GET /info**: Application information (version, features, endpoints)
- **GET /migrations**: Migration status
- **POST /migrations/run**: Run migrations (admin only)

### Health Checks Performed
- Database connectivity and query execution
- Cache operational status
- Memory usage (warns at 90%)
- Disk space availability
- Overall system health status

---

## 11. Error Handling Architecture

### React Error Boundaries
- **ErrorBoundary**: Catches errors in component tree
- **Multiple Fallbacks**: Global, Auth, Notes, Admin
- **User-Friendly UI**: Retry and reload options
- **Development Details**: Full error stack traces in dev mode

### Error Logging
- **Structured Logging**: Context-rich error logs
- **Error Tracking Service**: Integration points for Sentry/LogRocket
- **Performance Logging**: Slow operation detection
- **User Action Logging**: Track user interactions leading to errors

### Error Components
- **ErrorMessage**: Generic error with retry/dismiss
- **GlobalError**: Full-page error display
- **InlineError**: Compact form field errors
- **APIError**: Specialized API error display
- **NetworkError**: Connectivity issues
- **ValidationError**: Form validation errors
- **LoadingError**: Loading failures
- **EmptyState**: Empty data states

---

## 12. Automation Architecture

### Task Scheduler
- **node-cron**: Cron-like task scheduling
- **Automated Tasks**:
  - Daily backup (2:00 AM)
  - Hourly log check (every hour)
  - Weekly cleanup (Sunday 3:00 AM)
  - Daily health check (6:00 AM)

### Backup System
- **Automated Backups**: Daily at 2:00 AM
- **Backup Retention**: 7 days for regular, 30 days for pre-restore
- **Backup Validation**: Integrity checks before restore
- **Pre-Restore Safety**: Automatic backup before restore

### Cleanup Tasks
- **Log Rotation**: Automatic at 10 MB, 30-day retention
- **Backup Cleanup**: Remove old backups per retention policy
- **Migration Automation**: Run pending migrations during weekly cleanup

---

## 13. TypeScript Architecture

### Type Safety Foundation
- **Strict Mode**: Enabled with no `any` types allowed
- **Path Aliases**: `@/*` → `./src/*` for clean imports
- **Comprehensive Types**: All entities fully typed
- **Interfaces**: User, Note, Collaboration, Widget, Settings, API, Error types
- **Utility Types**: DeepPartial, Nullable, Optional

### Migration Strategy
- Incremental migration from JavaScript to TypeScript
- Type definitions complete for all entities
- Infrastructure ready for full migration
- Type safety for new development

---

## 14. Directory Structure

### Frontend Structure
```
src/
├── components/           # UI Components (Presentational + Logic)
│   ├── AuthViews.jsx
│   ├── AdminView.jsx
│   ├── NotesView.jsx
│   ├── NoteCard.jsx
│   ├── Composer.jsx
│   ├── SettingsPanel.jsx
│   ├── Modal.jsx
│   ├── Popover.jsx
│   ├── SearchBar.jsx
│   ├── Sidebar.jsx
│   ├── DashboardLayout.jsx
│   ├── DrawingPreview.jsx
│   ├── FormatToolbar.jsx
│   ├── ChecklistRow.jsx
│   ├── ColorDot.jsx
│   └── ErrorBoundary.tsx
├── contexts/            # State Management (Providers + Hooks)
│   ├── AuthContext.jsx
│   ├── NotesContext.jsx
│   ├── ModalContext.jsx
│   ├── ComposerContext.jsx
│   ├── UIContext.jsx
│   ├── SettingsContext.jsx
│   └── index.jsx
├── hooks/              # Custom React Hooks
│   ├── index.js
│   ├── useAuth.js
│   ├── useNotes.js
│   ├── useAdmin.js
│   ├── useCollaboration.js
│   └── useSettings.js
├── utils/              # Pure functions and helpers
│   ├── helpers.js
│   └── errorLogging.ts
├── types.ts            # TypeScript type definitions
├── ai.js              # AI logic wrapper
├── App.jsx            # Root component
├── main.jsx           # Entry point
├── App.css            # Global styles
└── index.css          # CSS imports and variables
```

### Server Structure
```
server/
├── index.js            # Main server entry
├── routes/            # API route handlers
│   ├── auth.js
│   ├── notes.js
│   ├── users.js
│   ├── events.js       # SSE endpoints
│   └── monitoring.js   # Health checks and metrics
├── middleware/        # Express middleware
│   ├── auth.js        # JWT authentication
│   ├── error.js       # Error handling
│   ├── security.js    # Security enhancements (NEW)
│   └── performance.js # Performance tracking (NEW)
├── utils/             # Server utilities
│   ├── logger.js      # Structured logging (NEW)
│   └── helpers.js     # Helper functions
├── migrations/        # Database migrations
│   ├── index.js       # Migration runner (NEW)
│   └── backup.js      # Backup/restore system (NEW)
└── scheduler.js        # Task scheduler (NEW)
```

### Testing Structure
```
src/__tests__/         # Test suites
├── setup.js           # Test setup with mocks
├── auth.test.js       # Authentication tests
├── notes.test.js      # Note management tests
└── collaboration.test.js # Real-time collaboration tests
```

### Documentation Structure
```
docs/
├── ARCHITECTURE_AND_STATE.md    # Architecture overview
├── COMPONENT_SPECS.md           # Component specifications
├── NOTE_CARD.md                # Note card details
├── THEMING.md                  # Theming guide
├── DEVELOPMENT_CONTEXT.md      # Development history
├── STABILIZATION_PLAN.md       # 8-week roadmap
├── STABILIZATION_PROGRESS_REPORT.md    # Progress tracking
├── STABILIZATION_COMPLETION_REPORT.md   # Final report
├── TEST_EXECUTION_GUIDE.md     # Testing procedures
└── TEST_INFRASTRUCTURE_README.md   # Testing overview
```

---

## 15. Integration Points

### External Services
- **AI Service**: Onnx-community AI models (local)
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT tokens with bcrypt
- **Real-time**: Server-Sent Events (SSE)

### API Endpoints
- **Authentication**: `/api/auth/*` (register, login, logout, verify)
- **Notes**: `/api/notes/*` (CRUD, search, filter, pin, archive)
- **Users**: `/api/users/*` (profile, settings, admin)
- **Collaboration**: `/api/notes/:id/collaborators`
- **Real-time**: `/api/events` (SSE stream)
- **Monitoring**: `/health`, `/ready`, `/metrics`, `/info`

---

## 16. Data Flow

### Authentication Flow
1. User submits credentials → `/api/auth/login`
2. Server validates and returns JWT token
3. Client stores token in localStorage
4. Client includes token in Authorization header
5. Server verifies token on protected routes
6. Token refresh or logout on 401

### Note Operations Flow
1. User creates note → `/api/notes` (POST)
2. Server stores in SQLite with user_id
3. Server returns note data
4. Client updates NotesContext
5. Real-time: SSE pushes update to collaborators
6. Collaborators receive and update UI

### Real-time Collaboration Flow
1. User edits note → `/api/notes/:id` (PUT)
2. Server updates database
3. Server emits SSE event to connected clients
4. Clients receive event via `useCollaboration` hook
5. NotesContext updates and re-renders

---

## 17. State Persistence

### Client-Side
- **Settings**: localStorage (theme, preferences)
- **Auth Tokens**: localStorage (JWT)
- **Drafts**: localStorage (in-progress notes)
- **Cache**: In-memory (5min TTL)

### Server-Side
- **Database**: SQLite with migration system
- **Backups**: Daily automated backups (7-day retention)
- **Logs**: Rotated log files (30-day retention)

---

## 18. Scalability Considerations

### Current Architecture
- **Single-Threaded**: Node.js event loop
- **In-Memory Cache**: Three-tier cache (1min, 5min, 1hour)
- **SQLite**: Suitable for single-instance deployments
- **SSE**: Single-server real-time updates

### Scaling Options
- **Horizontal Scaling**: Use external message queue (Redis) for SSE
- **Database Migration**: PostgreSQL/MySQL for multi-instance
- **CDN**: Static asset delivery
- **Load Balancer**: Multiple server instances
- **Session Store**: Redis for distributed sessions

---

## 19. Security Best Practices

### Implemented
- ✅ Helmet security headers
- ✅ Strict CSP
- ✅ Rate limiting (3 tiers)
- ✅ Input validation (all endpoints)
- ✅ XSS protection (HTML sanitization)
- ✅ CSRF protection (token-based)
- ✅ SQL injection prevention (prepared statements, pattern detection)
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ HTTPS enforcement (HSTS)

### Recommended
- 2FA for admin accounts
- IP-based rate limiting
- Request signing for sensitive operations
- API key authentication for admin operations
- Regular security audits
- Dependency vulnerability scanning

---

## 20. Performance Optimization

### Implemented
- ✅ Three-tier caching (1min, 5min, 1hour)
- ✅ Prepared database statements
- ✅ Batch database operations
- ✅ Response compression (gzip)
- ✅ Performance tracking (requests, database, AI)
- ✅ Memory monitoring
- ✅ Slow operation detection

### Recommended
- CDN for static assets
- Code splitting and lazy loading
- Image optimization and lazy loading
- Service Worker for offline support
- Database connection pooling
- Query result caching

---

## 21. Monitoring Strategy

### Current Monitoring
- ✅ Health check endpoint (`/health`)
- ✅ Readiness probe (`/ready`)
- ✅ Metrics endpoint (`/metrics`)
- ✅ Prometheus metrics (`/metrics/prometheus`)
- ✅ Structured logging (JSON format)
- ✅ Performance tracking
- ✅ Error logging
- ✅ Automated health checks

### Recommended
- Grafana/Prometheus dashboards
- Alerting rules (critical, warning, informational)
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry, LogRocket)
- APM (Application Performance Monitoring)
- Log aggregation (ELK stack)

---

## 22. Deployment Architecture

### Development
```bash
npm dev              # Starts web, API, and scheduler
# - Vite dev server (port 5173)
# - Express API server (port 8080)
# - Task scheduler (cron jobs)
```

### Production
```bash
npm run build       # Build frontend bundle
npm run migrate     # Run database migrations
npm run db:backup   # Create backup before deployment
npm run api         # Start API server
# Deploy frontend bundle to CDN/hosting
# Configure reverse proxy (nginx)
# Enable SSL/TLS
# Start scheduler
```

### Environment Variables
- `NODE_ENV`: development/production
- `API_PORT`: API server port (default: 8080)
- `DB_FILE`: Database file path
- `JWT_SECRET`: JWT signing secret
- `ADMIN_SECRET_KEY`: Admin operations secret
- `LOG_DIR`: Log directory path

---

## 23. Backup & Disaster Recovery

### Backup Strategy
- **Daily Backups**: Automated at 2:00 AM
- **Retention**: 7 days for regular, 30 days for pre-restore
- **Location**: `./data/backups/`
- **Validation**: Integrity checks before restore

### Recovery Procedures
1. Stop application
2. Create pre-restore backup
3. Restore from backup: `npm run db:restore <backup-path>`
4. Verify database integrity
5. Restart application
6. Verify health check endpoint

### Disaster Recovery
1. Verify latest backup integrity
2. Restore to staging environment
3. Test all functionality
4. Restore to production
5. Monitor for issues
6. Roll back if necessary

---

## Conclusion

GlassKeep now features a comprehensive, production-ready architecture with:
- Modular, Context-driven state management
- Multi-layer security (Helmet, rate limiting, validation, XSS/CSRF/SQL protection)
- Performance optimization (caching, prepared statements, monitoring)
- Comprehensive logging (structured JSON, rotation, specialized logging)
- Automated maintenance (backups, cleanup, health checks)
- Production monitoring (health checks, metrics, Prometheus format)
- Type safety foundation (TypeScript with strict mode)
- Testing infrastructure (48 test cases, CI/CD pipeline)

The architecture is designed for:
- **Security**: Multi-layer protection with industry best practices
- **Performance**: Optimized with caching, monitoring, and tracking
- **Reliability**: Automated backups, health checks, and error handling
- **Maintainability**: Modular structure, comprehensive documentation, type safety
- **Scalability**: Foundation ready for horizontal scaling if needed

**Status**: Production-ready with enterprise-grade capabilities.