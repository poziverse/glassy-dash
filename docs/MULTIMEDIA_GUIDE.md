# GlassyDash Multimedia User Manual

**Version:** 1.1  
**Last Updated:** January 23, 2026

---

## Overview

GlassyDash now supports premium multimedia notecards, allowing you to embed YouTube videos and stream music from your self-hosted servers directly within your dashboard. These cards are designed with privacy, performance, and aesthetics in mind.

---

## 📺 YouTube Integration

Embed distract-free YouTube players directly in your notes.

### Features

- **Privacy-Focused**: Uses privacy-enhanced mode (no cookies until playback).
- **Distraction-Free**: Hides related videos and overlay clutter.
- **Lazy Loading**: Thumbnails load instantly; the heavy video player only loads when you click play.
- **Smart Parsing**: Supports standard URLs (`youtube.com`), short URLs (`youtu.be`), and Shorts (`youtube.com/shorts`).
- **Timestamps**: Respects timestamp parameters (e.g., `?t=1m30s`).

### How to Use

#### 1. Creating a YouTube Note

1. Open the **Composer** (at the top of the dashboard).
2. Click the **YouTube** icon button (🟥 play button).
3. Paste a YouTube URL into the input field.
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. The card will automatically generate a preview with the video title and thumbnail.
5. (Optional) Add a title or tags to the note.
6. Click **Add Note**.

#### 2. Playing Videos

- **In Grid View**: The card shows a thumbnail. Click the play button to load the inline player.
- **In Modal View**: Click the card to open it full-size. The player controls (volume, quality, speed) are available here.

#### 3. Editing

- Open the note in the modal.
- Switch to **Edit Mode** (pencil icon).
- You can replace the URL to change the video.
- **Note**: The video content is locked to the URL. To change the video title displayed in the card, you must edit the metadata fetched from YouTube (by pasting a new URL).

---

## 🎨 Premium Icons

Enhance your notes with high-quality vector icons using the **Icon Widget**.

### How to Use

1.  Open any Note in the editor.
2.  Click the **Formatting Toolbar** button (`Aa`).
3.  Click the **Face Icon** (`:)`) in the toolbar.
4.  Browse or search for an icon (e.g., "star", "code", "heart").
5.  Click an icon to insert it at your cursor position!

### Features

- **Vector Quality**: Icons are crisp at any size.
- **Markdown Native**: Icons are inserted as standard markdown images: `![icon:star](...)`.
- **Secure**: All icons are sanitized and served safely.

---

## 🎵 Self-Hosted Music Player

Stream high-quality audio from your personal media server (Navidrome, Jellyfin, Subsonic, etc.).

### Supported Services

| Service       | Icon | Auth Type                |
| ------------- | ---- | ------------------------ |
| **Navidrome** | 🎵   | Subsonic API (User/Pass) |
| **Jellyfin**  | 🎬   | API Key + User ID        |
| **Subsonic**  | 🔊   | Subsonic API (User/Pass) |
| **Ampache**   | 🎧   | API Key                  |

### Configuration (One-Time Setup)

Before creating music notes, you must connect GlassyDash to your server.

1. Go to **Settings** (Gear icon in top right) → **Music Player**.
2. **Select Service**: Choose your server type (e.g., Navidrome).
3. **Server URL**: Enter the full URL to your server (e.g., `https://music.myserver.com` or `http://192.168.1.50:4533`).
4. **Credentials**:
   - **Navidrome/Subsonic**: Enter Username and Password.
     - _Note: Your password is used to generate a secure token/salt pair locally and is NOT stored in plain text._
   - **Jellyfin**: Enter your API Key and User ID.
   - **Ampache**: Enter your API Key.
5. Click **Test Connection**. You should see a success message.
6. Click **Save Settings**.

### How to Use

#### 1. Creating a Music Note

1. Open the **Composer**.
2. Click the **Music** icon button (🎵).
3. **Search**: Type the name of a song or album.
4. **Browse**: Switch between **Songs** and **Albums** tabs to filter results.
5. **Select**:
   - Click a **Track** for a single-song note.
   - Click an **Album** for a full playlist note.
6. A player preview will appear.
7. Click **Add Note**.

#### 2. Playback Controls

The Music Card is a full-featured HTML5 audio player:

- **Play/Pause**: Click the main button or press `Space` (when card is focused).
- **Playlist Navigation**:
  - **Next/Prev**: Use the skip buttons or Left/Right arrow keys.
  - **Playlist View**: Click the list icon (top right of album art) to toggle the track list view.
  - **Auto-Play**: The player automatically advances to the next track in the album.
- **Seek**: Click/drag the progress bar.
- **Volume**: Hover over the speaker icon to adjust volume.
- **Keyboard Shortcuts**:
  - `Space`: Toggle Play/Pause
  - `Left Arrow`: Skip back 10s
  - `Right Arrow`: Skip forward 10s

#### 3. Security & Proxying

- **No CORS Errors**: GlassyDash uses a secure backend proxy. Your browser does not connect directly to your music server; it connects to the GlassyDash API, which forwards the stream. This ensures playback works even if your music server doesn't have CORS headers configured for the dashboard.
- **Credential Safety**: When you share a note or collaborate, the _connection details_ (proxied stream URL) are embedded, but your raw password is never shared. However, be aware that anyone with access to the note can stream that specific track/album using your session.

---

## Troubleshooting

### "Invalid YouTube video"

- The URL might be malformed or private.
- If the video was deleted from YouTube, the card will show this error.
- **Fix**: Edit the note and paste a new, valid URL.

### Music Search / Playback Fails

- **Check Settings**: Go to Settings → Music Player and click "Test Connection".
- **Server Offline**: Ensure your self-hosted server is running and accessible from the machine running GlassyDash (if using Docker, they need to be on the same network or accessible via public URL).
- **HTTPS/HTTP Mixed Content**: If GlassyDash is on HTTPS, your music server _should_ ideally be HTTPS, but the backend proxy handles the unsecured connection for you, so HTTP servers usually work fine!

### "Upstream request failed"

- This means the GlassyDash server could not reach your music server. Check your Server URL in settings.
