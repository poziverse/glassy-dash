# GLASSYDASH

A sleek notes application with Markdown, checklists, images, tag chips, color themes, dark mode, drag-and-drop reordering, import/export, authentication, real-time collaboration, and a glassy UI — built with Vite + React and a Express + SQLite API.

---

## ✨ Features

- **Authentication & Multi-user**
  - Register, Login (username + password), Sign out
  - Default Admin Account: `admin` / `admin` (if no users exist)
  - Secret recovery key download and Sign in with Secret Key
  - Each user sees only their notes

- **Private AI Assistant (Llama 3.2)**
  - 100% Local & Private — Runs entirely on your own server. No data ever leaves your hardware.
  - Note-Aware (RAG) — The AI reads your own notes to answer questions factually.
  - Smart Search — Ask questions and get direct answers based on your private data.
  - Privacy First — Uses an optimized Llama 3.2 (1B) model running inside your Docker container.

- **Real-time Collaboration**
  - Real-time collaboration for checklists — multiple people can add/tick items together and see updates instantly.
  - Collaboration on notes — co-edit Markdown notes and watch changes sync across collaborators.
  - Add and remove collaborators — invite users by username/email to collaborate on your notes.
  - View-only mode for collaborators — open notes in view mode without overwriting edits from others.
  - Automatic conflict resolution — prevents stale data from overwriting recent edits.

- **Admin Panel**
  - Access: Located in the User Avatar Dropdown menu (top right).
  - Create new users, reset passwords, and manage permissions.
  - Toggle whether new account sign-ups are allowed (off by default).
  - View all users with: Name, Email/Username, Is Admin, Notes count, Storage used, Created at.
  - Delete user (also deletes their notes; protected against deleting last admin).

- **Notes**
  - Text notes with Markdown (H1/H2/H3, bold, italic, strike, links, blockquote, inline/fenced code)
  - Checklists (add items, toggle done, inline edit)
    - Drag to reorder checklist items within modal
    - Control checklist items directly from notes grid — toggle items without opening modal
  - Drawing/Handwritten notes — create freehand drawings with customizable brush sizes and colors
  - Smart Enter continues lists / exits on empty line
  - Formatting toolbar in editor (composer + modal edit mode)
  - Links open in new tab from view mode

- **Multimedia Support**
  - **YouTube Integration**: Paste any YouTube URL (video, short, standard) to create a premium embedded player card.
    - Features: Lazy loading (privacy-friendly), timestamp support, and distraction-free playback.
  - **Self-Hosted Music**: Stream properly from your Navidrome, Jellyfin, Subsonic, or Ampache server.
    - Features: Full HTML5 audio player, album art, keyboard shortcuts, and secure proxying.
  - **Premium Icons**: Insert beautiful SVG icons into your text with the new Icon Widget.

- **Images**
  - Attach multiple images (client-side compression)
  - Thumbs in grid, larger in modal
  - Fullscreen viewer with next/prev + download image

- **Organization & Layout**
  - Pin / Unpin; "Pinned / Others" sections
  - Tags as chips (comma input → chips; quick add/remove)
  - Tag sidebar/drawer with list of all tags + counts
  - Quick filters: Notes (All) and All Images
  - Per-note color themes
  - Search across title, Markdown text, tags, checklist items, image names
  - Drag to reorder within each section
  - Grid cards show truncated body with … and tag chips with … when overflowing

- **Modal**
  - Glassy blurred backdrop; sticky header
  - View / Edit toggle button
  - Pin, more (⋮) menu (Download .md), Close
  - Footer: tags chip editor, color palette, image add, Delete (confirm dialog), Save
  - Click edit button in body to switch to edit mode
  - Dense list rendering in view mode (minimal spacing)

- **PWA**
  - Installable on desktop & mobile

- **Bulk actions (multi-select)**
  - Select multiple notes at once to Download, Pin/Unpin, Delete, or Change Color.

- **Data**
  - Export all notes (JSON) and Import (merges; keeps existing notes)
  - Per-note Download .md
  - Import from Google Keep (Google Takeout) — pick multiple .json files
  - Backend: Express API + SQLite (`better-sqlite3`)

- **UI/Theme**
  - Tailwind (v4) look & feel with glassmorphism
  - Dark/Light mode with persistence
  - Advanced Theming:
    - Theme Presets: One-click configuration for "Neon Tokyo", "Zen Garden", etc.
    - Custom Backgrounds: Choose from a library of high-quality backgrounds (Optimized for Mobile/Desktop/4K).
    - Accent Colors: 7 "Bioluminescent" colors (Neon, Rose, Emerald, etc.) to customize the UI.
    - Card Transparency: Granular control over glass effect (Airy, Frosted, Medium, Subtle, Solid).
  - Theme Overlay: Smart blending mode for using any wallpaper while maintaining legibility.

  - Responsive header: hamburger + logo; "GLASSYDASH" title hidden on small screens
  - Improved color picker — circular color indicator showing selected color
  - Colorful emoji icons — enhanced icons for checklist (✅), drawing (🖌️), and images (🖼️)
  - Better visual feedback — cleaner UI elements with improved spacing and colors

---

## 🧰 Requirements

- **Node.js 18+** and npm
- (Optional) **Docker** & **Docker Compose**
- SQLite is embedded (no external DB needed)

---

## 📦 Project Structure

```
.
├─ public/                # PWA icons, manifest
├─ server/                # Express + SQLite API (index.js, data.sqlite)
├─ src/
│  ├─ components/         # Reusable UI (Modal, NoteCard, etc.)
│  ├─ contexts/           # State Management (Notes, Auth, Modal)
│  ├─ hooks/              # Custom Business Logic Hooks
│  ├─ utils/              # Helper functions (helpers.js)
│  ├─ App.jsx             # Main Router & Provider Shell
│  └─ main.jsx            # Entry point
├─ vite.config.js
├─ package.json
└─ README.md
```

---

## 🛠 Setup (Development)

### 1) Install dependencies

```bash
npm install
# (Optional) only If you don't have these dev/runtime deps yet:
npm install -D concurrently nodemon
npm install express better-sqlite3 cors jsonwebtoken bcryptjs
```

### 2) Run (web + API)

**POSIX/mac/Linux:**

```bash
ADMIN_EMAILS="your-admin-username" npm run dev
```

**Windows (PowerShell):**

```powershell
setx ADMIN_EMAILS "your-admin-username"
npm run dev
```

- Frontend (Vite): http://localhost:5173
- Docker: http://localhost:8080  
  _(Vite dev server proxies `/api` → `http://localhost:8080`.)_

**Promote an existing user to admin (optional):**

```sql
-- Run against server/data.sqlite
UPDATE users SET is_admin=1 WHERE email='your-admin-username';
```

### 3) Docker (Local Development)

**Quick Local Docker Script:**

```bash
./local_docker_run.sh
```

**Or manually:**

```bash
docker build -t GLASSYDASH:local .

docker rm -f GLASSYDASH 2>/dev/null || true

docker run -d \
  --name GLASSYDASH \
  --restart unless-stopped \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e API_PORT=8080 \
  -e JWT_SECRET=dev-please-change \
  -e DB_FILE=/app/data/notes.db \
  -e ADMIN_EMAILS=admin \
  -e ALLOW_REGISTRATION=false \
  -v "$HOME/.GLASSYDASH:/app/data" \
  GLASSYDASH:local
```

---

> [!IMPORTANT]
> **Default Admin Credentials** (for fresh installations):
>
> - **Username:** `admin`
> - **Password:** `admin`

## 🐳 Docker Deploy to Server (single image: API + built frontend)

### Dockerfile

Your Dockerfile builds the frontend, bundles the API, and runs Express server that serves both the API and built UI.

### Build & Run

```bash
# Create data dir
mkdir -p ~/.GLASSYDASH

# (optional) stop/remove any old container
docker rm -f GLASSYDASH 2>/dev/null || true

# Run
docker run -d \
  --name GLASSYDASH \
  --restart unless-stopped \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e API_PORT=8080 \
  -e JWT_SECRET="replace-with-a-long-random-string" \
  -e DB_FILE="/app/data/notes.db" \
  -e ADMIN_EMAILS="your-admin-username" \
  -e ALLOW_REGISTRATION=false \
  -v ~/.GLASSYDASH:/app/data \
  GLASSYDASH:latest
```

- App & API: http://localhost:8080
- **Admin Panel (Docker/prod):** http://localhost:8080/#/admin  
  _(Make sure `ADMIN_EMAILS` matches username exactly when creating admin account)_

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    image: GLASSYDASH:latest
    container_name: GLASSYDASH
    restart: unless-stopped
    environment:
      NODE_ENV: production
      API_PORT: '8080'
      JWT_SECRET: replace-with-a-long-random-string
      DB_FILE: /app/data/notes.db
      ADMIN_EMAILS: your-admin-username
      ALLOW_REGISTRATION: 'false'
    ports:
      - '8080:8080'
    volumes:
      - /home/YOURUSER/.GLASSYDASH:/app/data
```

Run:

```bash
mkdir -p /home/YOURUSER/.GLASSYDASH
docker compose up -d
```

> **Persistent data:** notes DB lives in mounted `./data` folder on your host.

---

## 🧭 Using the Admin Panel

- **Where**
  - Dev: http://localhost:5173/#/admin
  - Docker/Prod: http://localhost:8080/#/admin
- **Who can access**: Users with `is_admin = 1`.
  - Auto-promote by setting `ADMIN_EMAILS="your-admin-username"` before starting server/container, **or**
  - Run a one-off SQL update:
    ```sql
    UPDATE users SET is_admin=1 WHERE email='your-admin-username';
    ```
  - **Note:** If registration is disabled (default), you can use the default admin account to log in for the first time:
    - **Username:** `admin`
    - **Password:** `admin`
    - After logging in, you can create new users or change admin password in the Admin Panel.
- **What you can do**
  - View all users with: **Is Admin**, **Notes count**, **Storage used**, **Created at**
  - **Delete** a user (also removes their notes; cannot delete last admin)

> The admin view is intentionally not in the main header menu. Navigate to the route directly.

---

## 🧭 Usage Guide

- **Create a note**
  - Choose **Text / Checklist / Drawing** in composer toggle.
  - For text notes: Enter a _Title_ and content.
  - For checklists: Add checklist items and toggle them as needed.
  - For drawings: Draw freehand with customizable brush sizes and colors.
  - Add **tags** (comma-separated) — they become chips.
  - Choose a **color**, attach **images**, then click **Add Note**.

- **Markdown editing**
  - Use the **Formatting** button (Aa) in composer or modal edit mode:
    - H1/H2/H3, **bold**, _italic_, ~~strike~~, `inline code`, `fenced code`, quote, lists, link
  - **Smart Enter** continues lists or exits on empty line.

- **Open / Edit**
  - Click a card to open the modal.
  - Modal header has **View / Edit** toggle, **Pin**, **⋮ (Download .md)**, and **Close**.
  - Click edit button in body to switch to edit mode.

- **Images**
  - Click a modal image to open **Fullscreen Viewer** (download, next/prev).
  - Images are compressed client-side on upload.

- **Pin & Reorder**
  - Use the pin icon on a card or modal header.
  - Drag cards to reorder within **Pinned** or **Others**.
  - **Drag checklist items** to reorder them within a checklist note.
  - **Toggle checklist items** directly from the notes grid without opening the modal.

- **Tags & Filters**
  - Open the **hamburger menu** → sidebar lists all tags + counts.
  - Quick filters: **Notes (All)**, **All Images**.

- **Search & AI Assistance**
  - **Deep Search**: Searches across title, Markdown text, tags, checklist items, and image names.
  - **AI Assistant**: Press **Enter** in the search bar to ask questions about your notes.
  - **Smart Grounding**: The AI analyzes your relevant notes to give you accurate, private answers.
  - **One-Click Clear**: Closing the **AI response box** automatically clears your search query.

- **Export / Import**
  - Header **⋮** → **Export** to JSON (backup/sharing).
  - **Import** JSON merges with existing notes (keeps existing).

- **Secret Key**
  - Header **⋮** → **Download secret key (.txt)**.
  - On login screen, choose **Forgot username/password? → Sign in with Secret Key**.

- **Collaboration**
  - Open a note and click the **collaboration icon** (👥) in the modal header.
  - Add collaborators by username or email — they can view and edit the note.
  - View current collaborators and remove them if needed.
  - Changes sync in real-time across all collaborators.

---

## 🔐 Security Notes

- Treat your **Secret Key** like a password. Anyone with it can sign in as you.
- Change `JWT_SECRET` in production to a long, random string.
- Serve over HTTPS in production for PWA and security best practices.

---

## 🧪 Troubleshooting

- **Dev proxy error (`ECONNREFUSED` to `/api`)**
  - Ensure the API is running on `:8080` (`npm run dev` starts both).

- **Docker runs but CSS looks wrong**
  - Rebuild after Tailwind config changes: `docker compose build --no-cache`.
  - Ensure the app is built (`npm run build`) before running the Node server image.

- **PWA "Install" doesn't appear**
  - Use the built preview (`npm run preview`) or serve production build over HTTPS.
  - Check DevTools → Application → Manifest & Service Worker for errors.

---

## 📝 License

MIT
