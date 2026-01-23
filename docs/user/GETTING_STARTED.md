# Getting Started with GLASSYDASH

Welcome to GLASSYDASH! This guide will help you get up and running quickly and introduce you to the core features.

---

## 📋 Prerequisites

Before you begin, make sure you have:

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection (for first-time setup)
- (Optional) Docker or Node.js if self-hosting
- (Optional) Ollama installed for AI features

---

## 🚀 Quick Start Options

### Option 1: Try the Demo (No Installation)
Visit our live demo: [https://demo.glassydash.io](https://demo.glassydash.io)

### Option 2: Self-Host with Docker (Recommended)
```bash
git clone https://github.com/yourusername/glassy-dash.git
cd glassy-dash/GLASSYDASH
docker-compose up -d
```
Access at: http://localhost:8080

### Option 3: Development Setup
```bash
git clone https://github.com/yourusername/glassy-dash.git
cd glassy-dash/GLASSYDASH
npm install
ADMIN_EMAILS=admin npm run dev
```
Access at: http://localhost:5173

📖 **Need more details?** See [Installation Guide](INSTALLATION.md)

---

## 🔐 First Steps

### 1. Login

**Default Credentials:**
- Username: `admin`
- Password: `admin`

> ⚠️ **Security**: Change your password immediately after first login!

### 2. Create Your First Note

1. Click the **"Add Note"** button (➕)
2. Select note type:
   - 📝 **Text** - Rich text with Markdown
   - ✅ **Checklist** - Task lists with checkboxes
   - 🎨 **Drawing** - Freehand sketches
   - 📷 **Mixed** - Text, images, and drawings
3. Give your note a title
4. Add content
5. Click **"Save"**

### 3. Organize with Tags

1. Open a note
2. Click the **"Tags"** button (🏷️)
3. Enter tag name and press Enter
4. Add multiple tags as needed

**Example Tags:**
- `work`, `personal`, `project-alpha`
- `ideas`, `todos`, `meeting-notes`

---

## 🎯 Core Features Overview

### 📝 Note Management

**Creating Notes**
- Click **"Add Note"** to create new notes
- Choose from 4 note types
- Customize with colors and tags

**Organizing Notes**
- Drag-and-drop to reorder
- Pin important notes (📌)
- Color-code for visual organization
- Filter by tags or search

**Bulk Operations**
- Select multiple notes
- Delete in bulk
- Change colors
- Pin/unpin multiple

### ✅ Checklists

**Creating Checklists**
1. Select **"Checklist"** note type
2. Add items with the **"Add Item"** button
3. Check off completed items
4. Drag to reorder items

**Checklist Tips**
- Use for: TODO lists, shopping lists, project tasks
- Drag to prioritize
- Completed items fade automatically
- Export as Markdown

### 🎨 Drawing Notes

**Drawing Features**
- **Brush Tool**: Draw freehand
- **Color Palette**: 7 colors + eraser
- **Brush Sizes**: 4 sizes (extra small to extra large)
- **Preview**: See your drawing before saving

**Drawing Tips**
- Use stylus for precision
- Combine with text notes
- Export as PNG
- Copy to clipboard

### 🏷️ Tag System

**Managing Tags**
- Add multiple tags per note
- Search by tag
- Filter sidebar by tag
- Tag chips show on note cards

**Tag Best Practices**
- Use consistent naming
- Create tag categories
- Use emojis for quick identification
- Limit to 3-5 tags per note

### 🔍 Search

**Search Features**
- **Full-text search**: Searches title, content, tags, checklists, images
- **AI-powered**: Ask questions naturally
- **Quick filters**: "All Notes", "All Images"
- **Keyboard shortcut**: `Ctrl+K` / `Cmd+K`

**Search Examples**
- `AWS commands` - Finds all mentions
- `TODO items not done` - Filters checklists
- `What are my project notes?` - AI understands context

### 🤖 AI Assistant

**AI Features**
- 100% local and private
- Reads all your notes
- Answers questions based on your data
- No information leaves your device

**Using AI Assistant**
1. Click the **Search** bar
2. Type your question in natural language
3. Press Enter or click the AI icon
4. Get instant answers from your notes

**AI Query Examples**
- "What are my AWS commands?"
- "Show me all notes about project X"
- "What tasks do I need to complete?"
- "How old am I?" (finds birthday notes)

### 👥 Collaboration

**Collaborating on Notes**
1. Open a note
2. Click **"Collaborate"** button
3. Enter collaborator email
4. Set permission level:
   - **Can Edit**: Full access
   - **View Only**: Read-only access
5. Click **"Add"**

**Collaboration Features**
- Real-time editing
- See who's viewing
- Cursor tracking
- Automatic conflict resolution

---

## 🎨 Customization

### Themes

**Applying Themes**
1. Click **"Settings"** (⚙️)
2. Go to **"Theme"**
3. Choose from presets:
   - **Neon Tokyo** - Vibrant, modern
   - **Zen Garden** - Calm, nature-inspired
   - **Midnight** - Dark, sleek
   - **Daylight** - Bright, clean
   - **Ocean** - Blue tones
   - **Sunset** - Warm colors
   - **Cyberpunk** - Futuristic

### Backgrounds

**Custom Backgrounds**
1. Settings → Theme → Background
2. Choose from library:
   - Mobile optimized
   - Desktop optimized
   - 4K resolution
3. Or upload your own

### Accent Colors

**7 Bioluminescent Options**
- Electric Blue
- Neon Pink
- Lime Green
- Amber Glow
- Purple Pulse
- Crimson Red
- Cyan Bright

### Transparency

**5 Levels of Card Transparency**
- **Solid** (100%) - Maximum readability
- **Lightly Transparent** (80%) - Slight transparency
- **Medium Transparency** (60%) - Balanced
- **Highly Transparent** (40%) - Glassy effect
- **Airy** (20%) - Minimalistic

**Smart Overlay**
- Automatically adjusts for readability
- Ensures text is always visible
- Works on any background

---

## 🔐 Security & Privacy

### Your Data Security

**Privacy Features**
- All data stored locally
- No cloud dependency
- No data collection
- Self-hosted option
- Private AI (local processing)

**Authentication**
- JWT-based secure auth
- Password hashing (bcrypt)
- Secret key recovery
- Protected API endpoints
- User management

### Backing Up Your Data

**Export All Notes**
1. Settings → Export
2. Choose export format:
   - JSON (full backup)
   - Markdown (text format)
3. Download backup

**Import Notes**
1. Settings → Import
2. Select backup file:
   - JSON backup (merge support)
   - Google Keep Takeout
3. Review and merge

---

## 💡 Pro Tips

### Keyboard Shortcuts
| Shortcut | Action |
|----------|---------|
| `Ctrl+K` / `Cmd+K` | Quick search |
| `Ctrl+N` / `Cmd+N` | New note |
| `Ctrl+S` / `Cmd+S` | Save note |
| `Esc` | Close modal |
| `Ctrl+F` / `Cmd+F` | Find in note |

### Productivity Hacks

1. **Use Color Coding**: Assign colors to note types or projects
2. **Pin Important Notes**: Keep crucial info accessible
3. **Batch Operations**: Delete/archive multiple notes at once
4. **Tag Consistency**: Use the same tags across notes
5. **AI Quick Answers**: Use AI to find information instantly

### Workflow Examples

**Daily Notes Workflow:**
1. Create a "Daily" note template
2. Use checklist for tasks
3. Tag with date and project
4. Pin for quick access

**Project Notes Workflow:**
1. Create project-specific tag
2. Color-code project notes
3. Use collaboration for team
4. Export project notes when done

**Research Workflow:**
1. Create research note
2. Add drawing for diagrams
3. Use AI to summarize
4. Export as Markdown for sharing

---

## 🆘 Need Help?

### Common Issues

**Can't Login**
- Check credentials: `admin` / `admin`
- Verify server is running
- Check browser console for errors

**Notes Not Saving**
- Check internet connection
- Verify server is accessible
- Check browser console for errors

**AI Not Working**
- Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
- Pull model: `ollama pull llama3.2:1b`
- Check Ollama is running: `ollama list`

**Collaboration Issues**
- Both users must have accounts
- Check email addresses are correct
- Verify network connection

### Getting Support

- 📖 [FAQ](FAQ.md) - Common questions
- 🐛 [Report Bug](https://github.com/yourusername/glassy-dash/issues/new?template=bug_report.md)
- 💬 [Discord](https://discord.gg/glassydash) - Live support
- 📧 Email: support@glassydash.io
- 📚 [Support Guide](../../SUPPORT.md)

---

## 🎓 Next Steps

Now that you're familiar with the basics:

1. **Explore Features** - Read [Features Guide](FEATURES.md)
2. **Advanced Topics** - Learn [Advanced Features](#advanced-features)
3. **API Integration** - Check [API Documentation](../api/README.md)
4. **Customization** - Explore [Theme Guide](#theming)

---

## 📚 Additional Resources

- [Quick Start Guide](../../QUICKSTART.md) - 5-minute setup
- [Installation Guide](INSTALLATION.md) - Detailed installation
- [Features Overview](FEATURES.md) - All features explained
- [FAQ](FAQ.md) - Common questions answered
- [Complete Documentation](../README.md) - Full documentation index

---

**Ready to become a power user?** Check out our [Advanced Features Guide](FEATURES.md#advanced-features).

**Happy note-taking!** 🎉