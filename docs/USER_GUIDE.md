# GlassyDash User Guide

**Version:** 1.0  
**Last Updated:** January 31, 2026  
**Target Audience:** End Users

---

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Creating Notes](#creating-notes)
- [Note Types](#note-types)
- [Organizing Notes](#organizing-notes)
- [Collaboration](#collaboration)
- [Search and Filter](#search-and-filter)
- [Import and Export](#import-and-export)
- [Settings and Customization](#settings-and-customization)
- [AI Assistant](#ai-assistant)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Troubleshooting](#troubleshooting)

---

## Introduction

GlassyDash is a modern, production-ready note-taking application with real-time collaboration, AI assistance, and enterprise-grade features. This guide will help you master all features and workflows.

### Key Features

- 📝 **Multiple Note Types** - Text, checklist, drawing, YouTube, music
- 🎨 **Custom Themes** - Dark/light modes, custom colors, backgrounds
- 👥 **Real-time Collaboration** - Share notes with live sync
- 🤖 **AI Assistant** - Intelligent summarization and analysis
- 🔍 **Powerful Search** - Find anything instantly
- 💾 **Import/Export** - Backup and migrate your data
- 📱 **PWA Support** - Use offline anywhere

---

## Getting Started

### Account Setup

#### 1. Registration

1. Open GlassyDash in your browser
2. Click **"Register"** in the top-right corner
3. Fill in the registration form:
   - **Username**: Your display name
   - **Email**: Valid email address
   - **Password**: Secure password (min 8 characters)
4. Click **"Create Account"**

#### 2. First Login

1. On the login page, enter your email and password
2. Click **"Login"**
3. You'll be redirected to your dashboard

#### 3. Account Recovery

Generate a **Secret Key** for password recovery:
1. Click your username in the top-right
2. Select **"Settings"**
3. Click **"Generate Secret Key"**
4. Save the key securely (you'll need it to reset your password)

---

## Creating Notes

### Quick Note Creation

#### Method 1: Keyboard Shortcut
- Press **`N`** anywhere in the app

#### Method 2: Button Click
- Click the **"+"** button in the sidebar

#### Method 3: Dashboard Button
- Click **"Create Note"** on the dashboard

### Note Creation Modal

When creating a note, you'll see:

1. **Note Type Selector** - Choose from:
   - Text Note
   - Checklist
   - Drawing
   - YouTube Video
   - Music Player

2. **Title Field** - Enter a descriptive title
3. **Content Area** - Add your content (varies by type)
4. **Color Picker** - Choose a color for the note
5. **Tags** - Add tags for organization
6. **Save Button** - Click to save or press `Ctrl/Cmd + S`

---

## Note Types

### 1. Text Notes

**Best for:** Articles, ideas, documentation, meeting notes

**Features:**
- Rich text formatting (bold, italic, lists, links)
- Code blocks with syntax highlighting
- Markdown support
- Auto-save

**How to Use:**
1. Select "Text Note" when creating
2. Enter title
3. Type content in the editor
4. Use toolbar for formatting
5. Save note

**Example:**
```
Title: Project Meeting Notes

Content:
- Discussed Q1 roadmap
- Assigned tasks:
  - Alice: Design review
  - Bob: API implementation
- Next meeting: Friday 2pm
```

---

### 2. Checklists

**Best for:** Todo lists, shopping lists, task tracking

**Features:**
- Checkbox items
- Progress tracking
- Strike-through completed items
- Reorder items

**How to Use:**
1. Select "Checklist" when creating
2. Enter title (e.g., "Shopping List")
3. Add items one by one
4. Click checkboxes to mark complete
5. Save note

**Example:**
```
Title: Weekly Tasks

Items:
☐ Review pull requests
☐ Update documentation
☑ Write unit tests
☑ Deploy to staging
```

---

### 3. Drawings

**Best for:** Sketches, diagrams, whiteboard sessions

**Features:**
- Freehand drawing
- Multiple colors and brush sizes
- Eraser tool
- Clear canvas
- Save as image

**How to Use:**
1. Select "Drawing" when creating
2. Enter title (e.g., "Wireframe Sketch")
3. Use drawing tools:
   - **Pen**: Draw with selected color
   - **Eraser**: Remove drawn lines
   - **Color Picker**: Change pen color
   - **Size Slider**: Adjust brush thickness
4. Click **"Clear"** to start over
5. Save note

**Tips:**
- Use different colors for different elements
- Draw lightly first, then go over important lines
- Use eraser for fine adjustments

---

### 4. YouTube Videos

**Best for:** Video references, tutorials, playlists

**Features:**
- Embed YouTube videos
- Auto-fetch video metadata
- Add notes and timestamps
- Organize video collection

**How to Use:**
1. Select "YouTube Video" when creating
2. Enter title
3. Paste YouTube video URL (e.g., `https://youtube.com/watch?v=dQw4w9WgXcQ`)
4. Video metadata loads automatically
5. Add notes or timestamps
6. Save note

**Supported URL Formats:**
- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- Shortened YouTube URLs

---

### 5. Music Player

**Best for:** Music references, playlists, album notes

**Features:**
- Embed music players
- Support for multiple services (Subsonic, Jellyfin, Swing Music)
- Add track notes
- Organize music library

**How to Use:**
1. Select "Music Player" when creating
2. Enter title (e.g., "Favorite Albums")
3. Configure music server:
   - Select server type (Subsonic/Jellyfin/Swing Music)
   - Enter server URL
   - Enter credentials
4. Select or search for tracks
5. Add notes
6. Save note

**Note:** Requires compatible music server setup

---

## Organizing Notes

### Pinning Notes

Keep important notes at the top of your dashboard.

**How to Pin:**
1. Click the note to open it
2. Click the **📌** (pin) icon in the toolbar
3. Note moves to "Pinned" section

**How to Unpin:**
- Click the **📌** icon again

**Use Cases:**
- Important reminders
- Daily tasks
- Project highlights
- Meeting notes

---

### Color Coding

Organize notes by color for quick visual identification.

**How to Set Color:**
1. Create or edit a note
2. Click the color picker (🎨)
3. Choose from preset colors:
   - Red (urgent)
   - Orange (important)
   - Yellow (work in progress)
   - Green (complete)
   - Blue (personal)
   - Purple (ideas)
   - Gray (archive)
4. Save note

**Color Coding Best Practices:**
- **Red**: Urgent tasks, deadlines
- **Orange**: Important projects, priorities
- **Yellow**: Active work in progress
- **Green**: Completed items, achievements
- **Blue**: Personal notes, ideas
- **Purple**: Reference materials, documentation

---

### Tags

Add tags to filter and group related notes.

**How to Add Tags:**
1. Create or edit a note
2. Enter tags in the "Tags" field
3. Separate tags with commas
4. Save note

**Tag Examples:**
- `#work`, `#personal`, `#ideas`
- `#project-alpha`, `#project-beta`
- `#meeting`, `#todo`, `#reference`

**Filter by Tags:**
- Click a tag on any note
- All notes with that tag display

---

### Folders (Coming Soon)

*Folder organization feature is in development and will be available in a future update.*

---

## Collaboration

### Sharing Notes

Share notes with other users for real-time collaboration.

**How to Share:**
1. Open a note
2. Click the **"Share"** button
3. Enter the username of the collaborator
4. Click **"Add Collaborator"**
5. Select permission level:
   - **View Only**: Can see note
   - **Can Edit**: Can modify note
6. Collaborator receives notification
7. Note appears in their dashboard

**Real-time Sync:**
- Changes appear instantly for all collaborators
- Cursors show collaborator positions
- No page refresh needed

**Managing Collaborators:**
- View list of collaborators in share panel
- Remove collaborators anytime
- Update permission levels

**Collaboration Use Cases:**
- Team project notes
- Meeting notes with multiple participants
- Shared checklists
- Brainstorming sessions

---

## Search and Filter

### Search Notes

Find notes by title, content, or tags.

**How to Search:**
1. Click the search bar (🔍)
2. Type search term
3. Results appear instantly
4. Click result to open note

**Search Tips:**
- Search is case-insensitive
- Searches title, content, and tags
- Use multiple words for precise results
- Press `Ctrl/Cmd + F` to focus search

**Advanced Search:**
- `"exact phrase"` - Exact phrase match
- `tag:work` - Search specific tag
- `type:checklist` - Search by note type

---

### Filter by Note Type

View only specific note types.

**How to Filter:**
1. Click the filter dropdown (⚙️)
2. Select note type:
   - All Notes
   - Text Notes
   - Checklists
   - Drawings
   - YouTube Videos
   - Music Players
3. Dashboard updates with filtered results

---

### View Modes

Switch between grid and list views.

**Grid View (Default):**
- Visual card layout
- See more notes at once
- Color coding prominent
- Best for browsing

**List View:**
- Compact list layout
- See more details
- Better for many notes
- Best for scanning

**Switch Views:**
- Click view mode icon in toolbar
- Toggle between grid and list

---

### Sort Notes

Organize notes by different criteria.

**Sort Options:**
- **Date Created** (newest first)
- **Date Modified** (most recent)
- **Alphabetical** (A-Z)
- **Color** (grouped by color)

**How to Sort:**
1. Click sort dropdown (↑↓)
2. Select sort option
3. Notes reorder automatically

---

## Import and Export

### Export Notes

Download all notes as JSON for backup.

**How to Export:**
1. Click your username in top-right
2. Select **"Settings"**
3. Scroll to **"Data Management"**
4. Click **"Export JSON"**
5. JSON file downloads automatically

**Export Includes:**
- All notes and content
- Tags and metadata
- Settings (optional)
- No user credentials

**Backup Schedule:**
- Export weekly for important data
- Export before major changes
- Keep multiple backup versions

---

### Import Google Keep

Migrate notes from Google Keep.

**How to Import:**
1. Export your Google Keep notes (takeout.google.com)
2. Extract the downloaded zip file
3. In GlassyDash:
   - Click username → Settings
   - Scroll to **"Import"**
   - Click **"Import Google Keep"**
   - Select the extracted JSON file
4. Notes import automatically

**Import Mapping:**
- Google Keep notes → GlassyDash text notes
- Google Keep lists → GlassyDash checklists
- Images and attachments preserved
- Labels converted to tags

---

### Import Markdown

Import markdown files as text notes.

**How to Import:**
1. Click username → Settings
2. Scroll to **"Import"**
3. Click **"Import Markdown"**
4. Select .md file(s)
5. Files import as text notes

**Use Cases:**
- Migrate from other note apps
- Import documentation
- Batch import notes

---

## Settings and Customization

### Accessing Settings

1. Click your username in top-right
2. Select **"Settings"**

---

### Theme Customization

#### Dark/Light Mode

**How to Change:**
1. In Settings, find **"Appearance"**
2. Toggle **"Dark Mode"** on/off
3. Theme applies instantly

**Theme Options:**
- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on eyes, reduces glare
- **Auto (Coming Soon)**: Follows system preference

#### Accent Color

Customize the primary accent color.

**How to Change:**
1. In Settings, find **"Accent Color"**
2. Click color picker
3. Choose from:
   - Predefined colors
   - Custom color (hex code)
4. Color applies to buttons, links, highlights

---

### Background Image

Add a custom background to your dashboard.

**How to Set Background:**
1. In Settings, find **"Background"**
2. Click **"Upload Image"**
3. Select image file (JPG, PNG, WebP)
4. Adjust opacity slider
5. Background applies immediately

**Background Options:**
- **Solid Color**: Choose solid background
- **Gradient**: Predefined gradients
- **Custom Image**: Upload your own
- **Presets**: Choose from built-in images

**Tips:**
- Use subtle images for readability
- Adjust opacity for text visibility
- High-resolution images work best

---

### Card Transparency

Adjust note card transparency for better background visibility.

**How to Adjust:**
1. In Settings, find **"Appearance"**
2. Find **"Card Transparency"**
3. Move slider (0-100%)
4. Cards update in real-time

**Recommendations:**
- **0%** (opaque): Maximum readability
- **50%**: Balanced
- **100%**: Full background visibility

---

### Notification Settings

Control how you receive notifications.

**Notification Options:**
- **Email Notifications**: Toggle on/off
- **Browser Notifications**: Allow browser alerts
- **Collaboration Alerts**: Notify on note changes
- **Announcements**: Opt out of admin announcements

**How to Change:**
1. In Settings, find **"Notifications"**
2. Toggle each option
3. Changes save automatically

---

### Privacy Settings

Manage your privacy preferences.

**Options:**
- **Profile Visibility**: Show/hide profile
- **Note Visibility**: Default sharing settings
- **Activity Log**: View recent activity
- **Delete Account**: Permanently remove account

---

## AI Assistant

### Accessing AI Assistant

The AI Assistant helps you summarize, analyze, and improve your notes.

**How to Access:**
1. Open a note
2. Click the **AI** button in toolbar
3. AI panel opens on the right

---

### AI Features

#### 1. Summarize Notes

Get a quick summary of long notes.

**How to Use:**
1. Click AI button
2. Select **"Summarize"**
3. AI generates summary
4. Review and save if needed

**Best For:**
- Meeting notes
- Research articles
- Long documentation
- Project summaries

---

#### 2. Ask Questions

Ask AI questions about your notes.

**How to Use:**
1. Click AI button
2. Enter question in input field
3. Click **"Ask"**
4. AI provides answer based on notes

**Example Questions:**
- "What are my pending tasks?"
- "Summarize my project notes"
- "What did I discuss in meetings this week?"
- "What ideas do I have for X?"

---

#### 3. Transform Text

Improve or reformat text with AI.

**How to Use:**
1. Select text in note
2. Click AI button
3. Choose transformation:
   - **Make Professional**: Formal tone
   - **Fix Grammar**: Correct errors
   - **Summarize**: Condense content
   - **Expand**: Add detail
   - **Translate**: To another language

---

#### 4. Generate Images

Create images with AI for visual notes.

**How to Use:**
1. Click AI button
2. Select **"Generate Image"**
3. Enter prompt describing desired image
4. Click **"Generate"**
5. Image appears in note

**Tips:**
- Be specific in your prompt
- Include style (e.g., "watercolor", "digital art")
- Mention color preferences
- Example: "A modern office with blue accent colors, minimalist style"

---

## Keyboard Shortcuts

Master these shortcuts for faster navigation:

| Shortcut | Action |
|-----------|--------|
| `N` | Create new note |
| `Ctrl/Cmd + S` | Save note |
| `Ctrl/Cmd + F` | Focus search |
| `Escape` | Close modal |
| `Delete` | Delete selected notes |
| `Ctrl/Cmd + A` | Select all notes |
| `Ctrl/Cmd + C` | Copy selected notes |
| `Ctrl/Cmd + V` | Paste clipboard |
| `Ctrl/Cmd + Z` | Undo (editor) |
| `Ctrl/Cmd + Y` | Redo (editor) |
| `Ctrl/Cmd + B` | Bold text (editor) |
| `Ctrl/Cmd + I` | Italic text (editor) |

---

## Troubleshooting

### Common Issues

#### Notes Not Saving

**Symptoms:** Clicking save doesn't update note

**Solutions:**
1. Check internet connection
2. Refresh page and try again
3. Clear browser cache
4. Check if session expired (login again)

---

#### Can't Create Notes

**Symptoms:** Create button doesn't work

**Solutions:**
1. Verify you're logged in
2. Check browser console for errors
3. Try different browser
4. Contact support if issue persists

---

#### Collaboration Not Working

**Symptoms:** Collaborator can't see changes

**Solutions:**
1. Verify both users are logged in
2. Check internet connection
3. Refresh page to sync
4. Verify collaborator was added correctly

---

#### Images Not Loading

**Symptoms:** Drawing images or icons missing

**Solutions:**
1. Check internet connection
2. Disable ad blockers
3. Clear browser cache
4. Try different browser

---

#### PWA Not Installing

**Symptoms:** Can't install as app

**Solutions:**
1. Use Chrome, Edge, or Safari (best PWA support)
2. Check browser settings allow PWA installation
3. Update browser to latest version
4. Visit site over HTTPS (not HTTP)

---

### Getting Help

If you encounter issues not covered here:

1. **Check FAQ** - See [FAQ.md](FAQ.md) for common questions
2. **View Logs** - Enable debug mode in settings
3. **Contact Support** - Submit bug report from settings
4. **Join Community** - Connect with other users

---

## Best Practices

### Daily Workflow

1. **Morning**: Check pinned notes and tasks
2. **Throughout Day**: Create notes for important information
3. **Evening**: Review and organize notes
4. **Weekly**: Export backup and archive old notes

### Note Organization

1. **Use consistent naming** - Clear, descriptive titles
2. **Tag strategically** - Create a tag system
3. **Color code** - Visual priority system
4. **Pin important notes** - Quick access
5. **Archive old notes** - Keep dashboard clean

### Collaboration

1. **Set permissions** - View vs edit access
2. **Communicate** - Let collaborators know you're sharing
3. **Sync regularly** - Refresh for updates
4. **Resolve conflicts** - Discuss changes with team

### Backup Strategy

1. **Export weekly** - JSON backup of all notes
2. **Version control** - Keep multiple backup files
3. **Cloud storage** - Save backups in multiple locations
4. **Test restore** - Verify backups work

---

## Advanced Features

### PWA Installation

Install GlassyDash as an app for offline use.

**How to Install:**
1. Open GlassyDash in Chrome/Edge/Safari
2. Look for install icon in address bar
3. Click install
4. Follow browser prompts
5. App installs on device

**Benefits:**
- Works offline
- Faster loading
- App-like experience
- Desktop/mobile support

---

### Power User Tips

1. **Search operators**: Combine terms for precise results
   - `tag:work meeting` - Work notes with "meeting"
   - `type:checklist urgent` - Urgent checklists

2. **Bulk operations**: Select multiple notes
   - Click first note
   - Hold `Shift` and click last note
   - Delete or move multiple notes

3. **Quick actions**: Right-click notes
   - Edit, delete, pin, share
   - Copy note content
   - Duplicate note

---

## Security Tips

1. **Strong password**: Use unique, complex password
2. **Enable 2FA** (Coming Soon): Two-factor authentication
3. **Secret key**: Save securely, don't share
4. **Public Wi-Fi**: Avoid on public networks
5. **Log out**: On shared devices
6. **HTTPS only**: Ensure site uses HTTPS

---

## Conclusion

You're now equipped with all the knowledge to use GlassyDash effectively! 

**Key Takeaways:**
- Create notes with multiple types
- Organize with tags, colors, and pins
- Collaborate in real-time
- Use AI for summaries and insights
- Export backups regularly
- Customize your experience

**Next Steps:**
- Explore all note types
- Set up your organization system
- Try AI features
- Share notes with team
- Install as PWA for offline use

Happy note-taking! 📝

---

## Additional Resources

- **[FAQ](FAQ.md)** - Frequently asked questions
- **[GETTING_STARTED](GETTING_STARTED.md)** - Quick start guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - For administrators
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Technical issues

---

**Document Version:** 1.0  
**Last Updated:** January 31, 2026  
**Status:** Complete