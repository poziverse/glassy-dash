# 📝 Changelog

All notable changes to GLASSYDASH are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.8] - 2026-01-28

### Added

- ⚙️ **Modern Settings Navigation**
  - Replaced horizontal tabs with a premium vertical icon-only sidebar in `SettingsPanel`
  - Added smooth transitions and tooltips for better spatial efficiency
  - Unified theme application logic in `settingsStore`

- 🧪 **Significant Test Coverage Expansion**
  - Created comprehensive unit tests for `settingsStore` (77% coverage)
  - Created component tests for `SettingsPanel` (65% coverage)
  - Created component tests for `MusicSettings` (64% coverage)
  - Improved testing infrastructure with stable `global.fetch` mocking in `setup.js`

- 🔊 **Enhanced Music Integration**
  - Added robust server URL validation (protocol enforcement and space trimming)
  - Improved accessibility with nested label/input patterns in `MusicSettings.jsx`

### Fixed

- 🎨 **Theming Consistency**
  - Fixed issues where accent colors and transparencies weren't applied to custom backgrounds
  - Corrected background attribute targeting on the document body

---

## [1.1.7] - 2026-01-27

### Added

- 🎨 **Document Editor Toolbar**
  - Comprehensive glass-style formatting toolbar for the GlassyEditor
  - Positioned at top of document editing canvas
  - Matches glassmorphic design language with blur and transparency
  - Grouped toolbar sections with visual dividers

- ✏️ **Editor Formatting Tools**
  - Undo/Redo with keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
  - Text formatting: Bold, Italic, Underline, Strikethrough, Inline Code
  - Heading levels: H1, H2, H3
  - Lists: Bullet list, Numbered list
  - Block elements: Blockquote, Horizontal rule
  - Clear formatting button

- 🎯 **Enhanced BubbleMenu**
  - Added Underline support to floating selection menu
  - Added Heading 2 option
  - Added Blockquote option
  - Improved visual separation with dividers

### Dependencies

- Added `@tiptap/extension-underline` for underline text formatting

### Files Changed

- `src/components/editor/Editor.jsx` - Added glass toolbar with comprehensive formatting tools

---

## [1.1.6] - 2026-01-27

### Added

- 🛡️ **Admin Dashboard Complete Rewrite**
  - Dashboard overview with stats cards (Total Users, Admins, Notes, Storage)
  - Full user management with Create/Edit/Delete functionality
  - New AdminUserModal component for user CRUD operations
  - Quick admin status toggle per user
  - Registration control toggle (open/close new signups)
  - Real-time user search and filtering
  - Premium glassmorphic UI matching app design language

- 📊 **Admin Stats Cards**
  - Total Users count with icon
  - Admin count display
  - Total Notes across all users
  - Storage usage visualization

- 👤 **User Management Features**
  - Create new users with name, email, password, admin status
  - Edit existing users (name, email, password, admin status)
  - Toggle admin status with single click
  - Delete users with confirmation dialog
  - Search/filter users by name or email

- ⚙️ **Admin Settings**
  - Toggle new user registration on/off
  - Settings persist in database

### Fixed

- 🐛 **Critical: Admin status not showing in UI**
  - Root cause: `useNotesCompat` hook missing `currentUser` in return object
  - Fix: Added `currentUser` and `signOut` exports to hook
  - Result: Admin Panel now correctly appears for admin users

### Files Changed

- `src/components/AdminView.jsx` - Complete rewrite
- `src/components/admin/AdminUserModal.jsx` - New component
- `src/hooks/useNotesCompat.js` - Bug fix (missing exports)

---

## [1.1.5] - 2026-01-27

### Added

- 🎙️ **Voice Studio Export & Save System**
  - Smart Export/Save modal with content-based recommendations
  - Multiple save options: Save as Note, Document, Voice Note
  - Multiple export formats: Markdown, TXT, JSON
  - Content preview with statistics (reading time, file size)
  - Formatted content exports (preserves markdown)
- 📊 **Transcript Statistics**
  - Real-time character count display
  - Real-time word count display
  - Helps with export decisions and content planning

- 📚 **Comprehensive Documentation**
  - New Voice Studio user guide (VOICE_STUDIO_GUIDE.md)
  - Complete recording workflow documentation
  - Export/Save features documentation
  - Troubleshooting guide and FAQ section

### Changed

- 🔄 **FormatToolbar Architecture**
  - Added textareaRef parameter for proper component targeting
  - Updated format functions to use ref-based targeting
  - Maintained backward compatibility with document.activeElement fallback
  - Removed conflicting z-index from toolbar container

- 🔄 **EditRecordingModal Enhancements**
  - "Save & Done" button now always visible (was conditional)
  - "Save Changes" and "Save & Done" displayed simultaneously
  - Enhanced footer layout with better button visibility
  - Improved save workflow with export options

### Fixed

- 🐛 **Critical: FormatToolbar Blocking Textarea Access**
  - Users couldn't click into transcript textarea after transcription
  - Root cause: z-index: 10 created stacking context blocking clicks
  - Fix: Removed z-index, connected textarea refs properly
  - Affected components: RecordingStudio, EditRecordingModal

- 🐛 **Bug: Save & Done Button Hidden During Editing**
  - Export modal was only accessible when no changes existed
  - Root cause: Conditional rendering showed either/or, never both
  - Fix: Show both buttons, disable "Save Changes" when no edits
  - Result: Improved workflow, always accessible export options

- 🎨 **UI/UX Improvements**
  - Better button state visibility (enabled/disabled)
  - Enhanced Save & Done button prominence (gradient purple)
  - Clear visual feedback for edit states
  - Improved accessibility for transcript editing

### Documentation

- 📚 **New Documentation Files**
  - VOICE_STUDIO_GUIDE.md (complete user guide)
  - VOICE_STUDIO_UPDATE_2026-01-27.md (detailed update notes)
  - Updated 00_OVERVIEW.md with Voice Studio features

- 📚 **Enhanced Documentation**
  - System overview with latest Voice Studio capabilities
  - Component architecture changes documented
  - API integration details (Google Gemini 2.5 Flash)
  - Troubleshooting guide expanded

### Performance

- ⚡ **Optimizations**
  - FormatToolbar reduced from ~5KB to ~4KB
  - ExportSaveModal optimized (~15KB, well-performing)
  - Smooth textarea interaction (no lag)
  - Fast export generation (<100ms for typical recordings)

### Testing

- ✅ **Manual Testing**
  - Verified textarea accessibility in RecordingStudio
  - Verified textarea accessibility in EditRecordingModal
  - Tested all export formats (Markdown, TXT, JSON)
  - Verified smart recommendations accuracy
  - Tested button states and visibility

### Known Issues

- ⚠️ Language detection hardcoded to 'en' in JSON exports
- ⚠️ Export file naming uses generic pattern
- ⚠️ Batch export not yet implemented

---

## [1.1.4] - 2026-01-27

### Added

- 🎨 **Design System Overhaul**
  - Created reusable PageHeader component with consistent styling
  - Implemented comprehensive design tokens (design-tokens.css)
  - Established CSS variable-based theming system
  - Icon color palette with semantic naming

### Changed

- 🔄 **Header System Refactor**
  - Removed all duplicate page-specific headers across 7 pages
  - Established DashboardLayout as single source of truth for navigation
  - Unified header pattern with icons, subtitles, and actions
  - Improved visual hierarchy and consistency

### Fixed

- 🐛 **Design Inconsistencies Resolved**
  - TrashView: Removed duplicate "Trash" title
  - AlertsView: Removed duplicate header
  - HealthView: Removed duplicate header
  - AdminView: Removed duplicate header
  - SettingsView: Added proper header (was missing)
  - DocsView: Replaced gradient text with consistent PageHeader
- 🎨 **Visual Improvements**
  - Consistent typography using design tokens
  - Semantic icon coloring per page context
  - Uniform spacing and layout
  - Enhanced accessibility with proper semantic HTML

---

## [1.1.3] - 2026-01-26

### Added

- 🚀 **Production Deployment**
  - Deployed to https://dash.0rel.com
  - Docker container on glassy-vm (192.168.122.45)
  - Traefik reverse proxy configuration
  - SSL/TLS via Let's Encrypt
  - Health monitoring endpoint
  - Comprehensive deployment documentation

### Deployment Details

- **Infrastructure**: Nested VM with jump host (104.225.217.232 → 192.168.122.45)
- **Container**: glassy-dash-prod (b911cd01f467)
- **Network**: dokploy-network
- **Image**: glassy-dash:latest (2.11GB)
- **Commit**: 195f044
- **Health**: All systems operational
- **Database**: SQLite with 5 tables

### Fixed

- 🐛 Bug: Note cards truncated at 6 lines with line-clamp
- 🐛 Bug: Note content overflow not scrollable in dark/light modes
- 🐛 Bug: Clicking note cards doesn't open note in composer
- 🐛 Bug: Traefik routing issues (resolved via dokploy-network)
- 🎨 UI: Added proper CSS overflow handling for note-content
- 🎨 UI: Removed line-clamp-6 restriction from note cards
- 🎨 UI: Fixed NoteCard click handler to properly open notes

### Planned Features

- Multi-language support (Spanish, Chinese)
- Enhanced AI with larger models
- Mobile app (React Native)
- Plugin system
- Advanced collaboration features

---

## [0.67.0] - 2026-01-23 (Beta)

### Added

- 🎨 **Advanced Theming System**
  - Theme presets (Neon Tokyo, Zen Garden, etc.)
  - Custom background library (Mobile/Desktop/4K optimized)
  - 7 bioluminescent accent colors
  - Card transparency levels (5 options)
  - Smart overlay for readability

- 🤖 **Private AI Assistant (Llama 3.2)**
  - 100% local and private AI integration
  - Note-aware RAG capabilities
  - Smart search and question answering
  - No data leaves your server

- 👥 **Real-time Collaboration**
  - Live note collaboration
  - Real-time checklist sync
  - Add/remove collaborators
  - View-only mode
  - Automatic conflict resolution

- 📝 **Drawing Notes**
  - Freehand drawing canvas
  - Customizable brush sizes
  - Color palette selection
  - Drawing preview

- 📌 **Enhanced Note Features**
  - Pin/unpin functionality
  - Drag-and-drop reordering
  - Bulk operations (delete, pin, color)
  - Tag chip management

- 🔍 **Advanced Search**
  - Full-text search (title, content, tags, checklist, images)
  - AI-powered query assistance
  - Quick filters (All Notes, All Images)

- 💾 **Import/Export**
  - Export all notes to JSON
  - Import JSON (merge support)
  - Per-note Markdown export
  - Google Keep import (Takeout format)

- 👨‍💼 **Admin Panel**
  - User management (CRUD)
  - Password reset
  - Admin role assignment
  - Registration toggle
  - User statistics

- 🔐 **Security Enhancements**
  - JWT-based authentication
  - Secret key recovery
  - Password hashing (bcrypt)
  - Protected API endpoints

- 🎯 **UI Improvements**
  - Responsive design (mobile-first)
  - Dark/Light mode
  - Glassmorphism design
  - Improved color picker
  - Emoji icons for note types

### Changed

- 🔄 **Architecture Refactor**
  - Migrated to React 18
  - Updated to Vite 5.x
  - Express.js 4.x backend
  - SQLite with better-sqlite3

- 📱 **PWA Support**
  - Offline capability
  - Installable on desktop/mobile
  - Service worker implementation

### Fixed

- 🐛 Bug: Checklist items not persisting on save
- 🐛 Bug: Tag chips not rendering properly on overflow
- 🐛 Bug: Images not compressing on upload
- 🐛 Bug: Search not finding checklist items
- 🐛 Bug: Modal not closing on Escape key
- 🐛 Bug: Drag-and-drop not working on mobile

### Security

- 🔒 Security: Updated JWT secret handling
- 🔒 Security: Added CORS protection
- 🔒 Security: Enhanced password hashing
- 🔒 Security: SQL injection prevention

### Performance

- ⚡ Performance: Optimized image compression
- ⚡ Performance: Reduced bundle size by 40%
- ⚡ Performance: Debounced search input
- ⚡ Performance: Virtualized note list (in progress)

### Documentation

- 📚 Documentation: Comprehensive user guides
- 📚 Documentation: Developer documentation
- 📚 Documentation: API reference
- 📚 Documentation: Troubleshooting guide
- 📚 Documentation: Quick start guide

---

## [0.66.0] - 2026-01-15

### Added

- ✨ Markdown support with formatting toolbar
- ✨ Checklists with drag-to-reorder
- ✨ Image attachments with compression
- ✨ Tag system with chips
- ✨ Per-note color themes
- ✨ Server-Sent Events (SSE) for real-time updates

### Fixed

- 🐛 Bug: Notes not syncing across devices
- 🐛 Bug: Login session expiring too quickly

---

## [0.65.0] - 2026-01-08

### Added

- ✨ Multi-user authentication system
- ✨ User registration
- ✨ Admin panel basic features
- ✨ Database schema with migrations

### Changed

- 🔄 Migrated from local storage to SQLite
- 🔄 Implemented user isolation

---

## [0.60.0] - 2026-01-01

### Added

- ✨ Initial release of GLASSYDASH
- ✨ Basic note creation
- ✨ Markdown editor
- ✨ Local storage persistence
- ✨ Simple UI with glassmorphism

---

## Versioning Policy

GLASSYDASH follows [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

### Beta Releases

Beta versions (0.x.x) may have:

- Breaking changes
- Unstable features
- Experimental functionality

**Stable release**: 1.0.0 planned for Q2 2026

---

## Categories

### Added

New features and enhancements

### Changed

Changes to existing functionality

### Deprecated

Soon-to-be removed features

### Removed

Removed features

### Fixed

Bug fixes

### Security

Security updates and fixes

### Performance

Performance improvements

### Documentation

Documentation updates

---

## Migration Guide

### From v0.66 to v0.67

No breaking changes. Just upgrade:

```bash
git pull origin main
npm install
npm run build
npm start
```

### From v0.65 to v0.66

Database migration required:

```bash
npm run migrate
```

---

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Run tests
5. Build release
6. Create GitHub release
7. Publish to npm (if applicable)
8. Deploy to Docker Hub

---

**For Older Releases**
See [GitHub Releases](https://github.com/yourusername/glassy-dash/releases)

**Current Version**: 1.1.8 (Stable)  
**Last Updated**: January 28, 2026
