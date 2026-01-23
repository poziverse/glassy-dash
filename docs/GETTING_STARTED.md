# Getting Started with GlassKeep

**Version:** ALPHA 1.0  
**Last Updated:** January 19, 2026  

---

## Overview

GlassKeep is a modern, production-ready note-taking application with real-time collaboration, AI assistance, and enterprise-grade features. This guide will help you get up and running in 5 minutes.

---

## Prerequisites

### Required
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Git** (for cloning)

### Recommended
- **VS Code** with recommended extensions
- **Modern browser** (Chrome, Firefox, Edge, Safari)

---

## Installation

### 1. Clone and Navigate

```bash
# Clone the repository
git clone <repository-url>
cd glassy-dash/GLASSYDASH

# Or if you already have it
cd /home/pozicontrol/projects/glassy-dash/GLASSYDASH
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Create Environment File

```bash
# Create .env file
cd server
touch .env
```

Edit `server/.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=../data/notes.db
JWT_SECRET=your-secure-random-secret-key-here
JWT_EXPIRES_IN=7d
AI_ENABLED=true
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=10485760
```

**Generate a secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `JWT_SECRET` in `.env`.

---

## Quick Start

### Option 1: Development Mode (Recommended)

**Terminal 1 - Backend Server:**

```bash
cd GLASSYDASH/server
npm run dev
```

Expected output:
```
Server running on port 3000
Database connected: ../data/notes.db
AI Model: Ready
```

**Terminal 2 - Frontend Server:**

```bash
cd GLASSYDASH
npm run dev
```

Expected output:
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Option 2: Concurrent Mode

```bash
cd GLASSYDASH
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

---

## First Steps

### 1. Create an Account

1. Open [http://localhost:5173](http://localhost:5173)
2. Click "Register" in the top right
3. Enter username, email, and password
4. Click "Create Account"

### 2. Create Your First Note

1. Click the "+" button or press `N` (keyboard shortcut)
2. Select note type:
   - **Text** - Plain text notes
   - **Checklist** - Todo lists with checkboxes
   - **Drawing** - Sketch and draw
3. Enter title and content
4. Click "Save" or press `Ctrl+S` / `Cmd+S`

### 3. Customize Your Dashboard

1. Click the gear icon (Settings)
2. Customize:
   - **Theme** - Dark/Light mode
   - **Accent Color** - Choose your color
   - **Background Image** - Add a background
   - **Card Transparency** - Adjust transparency
   - **View Mode** - List or Grid

### 4. Explore Features

#### Note Features
- **Pin Notes** - Keep important notes at top
- **Archive Notes** - Hide completed notes
- **Color Code** - Organize with colors
- **Add Tags** - Filter by tags
- **Search** - Find notes quickly
- **Drag & Drop** - Reorder notes
- **Multi-select** - Bulk operations

#### Collaboration
1. Open a note
2. Click "Share" button
3. Enter username to add collaborator
4. Real-time sync via Server-Sent Events

#### Import/Export
- **Export JSON** - Full backup
- **Import Google Keep** - Migrate from Google Keep
- **Import Markdown** - Import MD files

#### AI Assistant (Optional)
1. Click AI button in toolbar
2. Ask questions about your notes
3. Get intelligent suggestions
4. Summarize or analyze content

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | Create new note |
| `Ctrl/Cmd + S` | Save note |
| `Ctrl/Cmd + F` | Search notes |
| `Escape` | Close modal |
| `Delete` | Delete selected notes |
| `Ctrl/Cmd + A` | Select all notes |
| `Ctrl/Cmd + C` | Copy selected notes |
| `Ctrl/Cmd + V` | Paste clipboard |

---

## Admin Panel

If you create an admin account (first registered user is admin):

1. Click user menu → Admin Panel
2. View:
   - User management
   - System statistics
   - Log viewer
   - System health

---

## Next Steps

### Learn More

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development setup and workflow
- **[COMPONENT_GUIDE.md](COMPONENT_GUIDE.md)** - Complete component reference
- **[API_REFERENCE.md](API_REFERENCE.md)** - API documentation
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture

### Advanced Features

- **Real-time Collaboration** - See [COLLABORATION.md](#) (in progress)
- **AI Integration** - See [AI_GUIDE.md](#) (in progress)
- **Custom Themes** - See [THEMING.md](THEMING.md)

### Troubleshooting

- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[LOGGING.md](LOGGING.md)** - Debugging with logs

---

## Common Questions

### Q: How do I backup my notes?

**A:** Click "Export JSON" in settings to download all notes as JSON.

### Q: Can I use GlassKeep offline?

**A:** Yes! GlassKeep is a PWA. Install it from your browser to use offline.

### Q: How do I reset my password?

**A:** Use your secret key to login. Generate a new secret key from Settings.

### Q: Is my data secure?

**A:** Yes. GlassKeep uses JWT authentication, bcrypt password hashing, and SQL injection prevention.

### Q: Can I collaborate in real-time?

**A:** Yes! Add collaborators to notes and changes sync instantly via SSE.

### Q: How do I migrate from Google Keep?

**A:** Export your Google Keep notes and use the "Import Google Keep" feature.

---

## System Requirements

### Development
- **OS:** Windows, macOS, or Linux
- **RAM:** 4GB minimum, 8GB recommended
- **Disk:** 500MB free space

### Production
- **OS:** Linux recommended
- **RAM:** 2GB minimum
- **Disk:** 1GB free space
- **Node:** v18.0.0 or higher

---

## Support

- **Documentation:** See [README.md](README.md)
- **Issues:** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Logs:** See [LOGGING.md](LOGGING.md)

---

## What's Next?

1. ✅ Installation complete
2. ✅ Create account and notes
3. ✅ Explore features
4. 📖 Read [DEVELOPMENT.md](DEVELOPMENT.md) for development
5. 📖 Read [API_REFERENCE.md](API_REFERENCE.md) for API usage
6. 🚀 Deploy to production with [DEPLOYMENT.md](DEPLOYMENT.md)

---

**Happy Note-Taking! 📝**

---

**Document Version:** 1.0  
**Last Updated:** January 19, 2026  
**Status:** Complete