# Frequently Asked Questions

Common questions and answers about GLASSYDASH.

---

## 🚀 Getting Started

### What is GLASSYDASH?

GLASSYDASH is a private, self-hosted note-taking application with AI-powered search, real-time collaboration, and advanced customization. It's designed for users who value privacy and control over their data.

### How much does GLASSYDASH cost?

GLASSYDASH is **100% free and open source**. There are no subscriptions, no ads, and no data collection. You can self-host it at no cost.

### What are the system requirements?

**Minimum:**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- 1GB RAM
- 100MB storage
- Internet connection (first-time setup)

**Recommended:**
- 2GB RAM
- 500MB storage
- Node.js 18+ (for self-hosting)
- Docker (optional, recommended)

### Can I try GLASSYDASH before installing?

Yes! Try our live demo: [https://demo.glassydash.io](https://demo.glassydash.io)

---

## 🔐 Security & Privacy

### Is GLASSYDASH private?

**Yes!** GLASSYDASH is designed with privacy in mind:

- All data stored locally
- No cloud transmission
- No data collection
- No analytics tracking
- Private AI (local processing)

### Does GLASSYDASH send my notes to the cloud?

**No.** All your notes are stored locally on your device or server. Nothing is sent to any cloud service unless you choose to backup to cloud storage.

### Is the AI assistant private?

**Yes.** The AI assistant runs 100% locally on your machine. No data leaves your device. It reads your notes and answers questions without any internet connection.

### Can I use GLASSYDASH offline?

**Yes.** GLASSYDASH works completely offline once installed. You don't need an internet connection to create, edit, or search notes.

---

## 💾 Data Management

### How do I backup my notes?

**JSON Backup (Full):**
1. Go to Settings → Export
2. Choose "JSON"
3. Download backup file
4. Store in safe location

**Recommended:** Backup daily or weekly depending on usage.

### How do I restore from backup?

1. Go to Settings → Import
2. Select JSON backup file
3. Choose merge or replace
4. Confirm import

### Can I import notes from other apps?

**Yes!** GLASSYDASH supports:
- Google Keep Takeout
- JSON backups
- Markdown files

### What happens if I lose my notes?

If you have a backup:
1. Import from your JSON backup
2. All notes will be restored

If you don't have a backup:
- Unfortunately, lost notes cannot be recovered
- We recommend regular backups

---

## 🤖 AI Assistant

### How does the AI assistant work?

The AI assistant uses Llama 3.2 (1B model) and Retrieval-Augmented Generation (RAG) to:
- Read all your notes
- Understand your questions
- Answer based on your data
- Provide context-aware responses

**Requirements:**
- Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
- Pull model: `ollama pull llama3.2:1b`

### What can I ask the AI assistant?

- **Information Retrieval:** "What are my AWS commands?"
- **Summarization:** "Summarize my meeting notes"
- **Personal Info:** "What's my birthday?"
- **Task Management:** "What tasks need completion?"
- **Research:** "What did I learn about React?"

### Is the AI assistant required?

**No.** GLASSYDASH works perfectly without AI. The AI assistant is an optional feature for enhanced search and productivity.

### Does the AI assistant need internet?

**No.** The AI assistant runs 100% locally on your device using Ollama.

---

## 👥 Collaboration

### How do I collaborate with others?

1. Open a note
2. Click "Collaborate" button
3. Enter collaborator email
4. Set permission level (Can Edit or View Only)
5. Click "Add"
6. Collaborator receives email invitation
7. They accept and can access the note

### Can multiple people edit at the same time?

**Yes!** GLASSYDASH supports real-time collaboration. Multiple users can edit the same note simultaneously with real-time cursor tracking and automatic conflict resolution.

### What are the permission levels?

| Permission | View | Edit | Delete |
|------------|-------|------|--------|
| Can Edit | ✅ | ✅ | ✅ |
| View Only | ✅ | ❌ | ❌ |

---

## 🎨 Customization

### How do I change the theme?

1. Click Settings (⚙️)
2. Go to "Theme"
3. Choose a preset:
   - Neon Tokyo
   - Zen Garden
   - Midnight
   - Daylight
   - Ocean
   - Sunset
   - Cyberpunk

### Can I upload my own background?

**Yes!**
1. Settings → Theme → Background
2. Click "Upload Background"
3. Select your image
4. Adjust transparency
5. Save

**Supported formats:** JPG, PNG, WEBP (max 10MB)

### What accent colors are available?

7 bioluminescent options:
- Electric Blue
- Neon Pink
- Lime Green
- Amber Glow
- Purple Pulse
- Crimson Red
- Cyan Bright

---

## 📱 Mobile & Cross-Platform

### Does GLASSYDASH work on mobile?

**Yes!** GLASSYDASH is fully responsive and works on:
- iOS devices (iPhone, iPad)
- Android devices (tablets and phones)
- Desktop computers
- Laptops

### Is there a mobile app?

Not yet. GLASSYDASH is a web application that works in any modern browser. A native mobile app is planned for future releases.

### Can I sync across devices?

Currently, GLASSYDASH is designed for single-device use. Cross-device sync is planned for future versions. For now, use export/import to move notes between devices.

---

## 🔧 Technical

### What technology is GLASSYDASH built with?

- **Frontend:** React, Vite, TypeScript
- **Backend:** Node.js, Express
- **Database:** SQLite
- **AI:** Llama 3.2 via Ollama
- **Real-time:** WebSocket for collaboration

### Can I self-host GLASSYDASH?

**Yes!** GLASSYDASH is designed for self-hosting:

**Docker (Recommended):**
```bash
docker-compose up -d
```

**npm/yarn:**
```bash
npm install
npm run build
npm start
```

**Full Guide:** See [Installation Guide](INSTALLATION.md)

### Does GLASSYDASH work with Docker?

**Yes!** Docker is the recommended method for self-hosting.

```bash
git clone https://github.com/yourusername/glassy-dash.git
cd glassy-dash/GLASSYDASH
docker-compose up -d
```

---

## ⚡ Performance

### Is GLASSYDASH fast?

**Yes.** GLASSYDASH is optimized for speed:
- Virtualized note lists (handles 10,000+ notes)
- Debounced search
- Lazy loading images
- Code splitting
- Compression enabled

### How many notes can GLASSYDASH handle?

GLASSYDASH is designed to handle **10,000+ notes** smoothly. For optimal performance, we recommend keeping under 5,000 notes.

### Why is GLASSYDASH slow?

If GLASSYDASH is slow, try:

1. **Use production build:** `npm run build && npm start`
2. **Clean up old notes:** Archive or delete unused notes
3. **Optimize images:** Compress images before uploading
4. **Clear cache:** Clear browser cache (Ctrl+Shift+Delete)
5. **Check server resources:** Ensure server has enough RAM/CPU

---

## 🐛 Troubleshooting

### I can't login to GLASSYDASH

**Try these solutions:**
1. Check credentials: `admin` / `admin` (default)
2. Verify server is running
3. Check browser console (F12) for errors
4. Clear browser cache
5. Try different browser

### Notes aren't saving

**Possible solutions:**
1. Check internet connection
2. Verify server is accessible
3. Check browser console (F12) for errors
4. Clear browser cache
5. Check server logs

### AI assistant isn't working

**Solutions:**
1. Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
2. Pull model: `ollama pull llama3.2:1b`
3. Verify Ollama is running: `ollama list`
4. Check OLLAMA_HOST in .env
5. Restart GLASSYDASH server

### Collaboration not working

**Troubleshooting:**
1. Both users must have accounts
2. Check email addresses are correct
3. Verify network connection
4. Check server logs for errors
5. Try refreshing page

### Images won't upload

**Solutions:**
1. Check file size (max 10MB)
2. Verify file format (JPG, PNG, WEBP)
3. Check server disk space
4. Check browser console for errors
5. Try smaller image

### Search isn't finding my notes

**Tips:**
1. Check spelling of search terms
2. Try different keywords
3. Use AI queries for natural language
4. Ensure notes exist
5. Check for typos in note content

---

## 📞 Support

### Where can I get help?

- 📖 [Documentation](../README.md) - Complete documentation
- 🐛 [Report Bug](https://github.com/yourusername/glassy-dash/issues/new?template=bug_report.md)
- 💬 [Discord](https://discord.gg/glassydash) - Live community support
- 📧 Email: support@glassydash.io
- 📚 [Support Guide](../../SUPPORT.md) - Detailed support options

### How do I report a bug?

1. Go to [GitHub Issues](https://github.com/yourusername/glassy-dash/issues)
2. Click "New Issue"
3. Select "Bug Report"
4. Fill in details:
   - Description
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment info
5. Submit

### How do I request a feature?

1. Go to [GitHub Issues](https://github.com/yourusername/glassy-dash/issues)
2. Click "New Issue"
3. Select "Feature Request"
4. Fill in details:
   - Feature description
   - Motivation
   - Proposed solution
   - Use cases
5. Submit

### Can I contribute to GLASSYDASH?

**Yes!** We welcome contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

**See:** [Contributing Guide](../../CONTRIBUTING.md)

---

## 📚 Additional Resources

- [Getting Started Guide](GETTING_STARTED.md) - Learn the basics
- [Installation Guide](INSTALLATION.md) - Detailed setup
- [Features Guide](FEATURES.md) - All features explained
- [Quick Reference](QUICK_REFERENCE.md) - Keyboard shortcuts & tips
- [Support Guide](../../SUPPORT.md) - Getting support

---

## 🎉 Still Have Questions?

If you didn't find your answer here:

- 📧 Email us at: support@glassydash.io
- 💬 Join our Discord: [discord.gg/glassydash](https://discord.gg/glassydash)
- 🐛 Create an issue on [GitHub](https://github.com/yourusername/glassy-dash/issues)

We're here to help! 🚀