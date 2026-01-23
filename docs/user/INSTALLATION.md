# Installation Guide

Complete guide to installing and setting up GLASSYDASH.

---

## 🎯 Installation Methods

Choose the method that best fits your needs:

| Method | Difficulty | Best For | Setup Time |
|---------|-----------|----------|-------------|
| Docker | Easy | Production, quick setup | 2 min |
| Docker Compose | Easy | Multi-container setup | 3 min |
| npm/yarn | Medium | Development | 5 min |
| Manual | Advanced | Custom configuration | 10+ min |

---

## ⚡ Docker (Recommended)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Quick Start
```bash
git clone https://github.com/yourusername/glassy-dash.git
cd glassy-dash/GLASSYDASH
docker-compose up -d
```

**Access**: http://localhost:8080

### Docker Compose Options

#### Development
```bash
docker-compose -f docker-compose.yml up -d
```

#### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Docker Management

**View Logs**
```bash
docker-compose logs -f
```

**Stop Services**
```bash
docker-compose down
```

**Rebuild**
```bash
docker-compose build --no-cache
```

---

## 💻 npm/yarn (Development)

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/yourusername/glassy-dash.git
cd glassy-dash/GLASSYDASH
npm install
```

### Running

**Development**
```bash
ADMIN_EMAILS=admin npm run dev
```
Access: http://localhost:5173

**Build for Production**
```bash
npm run build
npm start
```
Access: http://localhost:8080

### Useful Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm test             # Run tests
npm run lint         # Lint code
```

---

## 🔧 Manual Installation

### Prerequisites
- Node.js 18+
- npm
- (Optional) Git

### Steps

1. **Clone Repository**
```bash
git clone https://github.com/yourusername/glassy-dash.git
cd glassy-dash/GLASSYDASH
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
nano .env  # Edit with your settings
```

4. **Build Application**
```bash
npm run build
```

5. **Start Server**
```bash
npm start
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in `GLASSYDASH/`:

```bash
# Application
NODE_ENV=production
API_PORT=8080

# Database
DB_FILE=/app/data/notes.db

# Security
JWT_SECRET=your-secret-key-here

# Admin
ADMIN_EMAILS=admin
ALLOW_REGISTRATION=false

# AI (Ollama)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
```

See `.env.example` for all available options.

### Database Setup

GLASSYDASH uses SQLite by default. No additional setup needed.

**Database Location**:
- Docker: `/app/data/notes.db`
- Local: `data/notes.db`

---

## 🤖 AI Setup (Optional)

GLASSYDASH includes a private AI assistant powered by Llama 3.2.

### Install Ollama

**Linux/macOS:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from [ollama.ai](https://ollama.ai)

### Pull Model

```bash
ollama pull llama3.2:1b
```

### Verify Installation

```bash
ollama list
```

### Configure GLASSYDASH

In `.env`:
```bash
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
```

---

## ✅ Verification

### Check Installation

1. **Access Application**
   - Open http://localhost:8080 in browser
   - Should see login screen

2. **Login**
   - Username: `admin`
   - Password: `admin`

3. **Create Test Note**
   - Click "Add Note"
   - Enter title and content
   - Save successfully?

4. **Test AI** (if configured)
   - Open search bar
   - Ask: "What are my notes?"
   - Get response?

---

## 🔧 Troubleshooting

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use`

**Solution**:
```bash
# Change port in .env
API_PORT=8081
```

### Database Locked

**Error**: `SQLITE_BUSY: database is locked`

**Solution**:
```bash
# Docker
docker-compose down
docker-compose up -d

# Local
# Stop server, wait 10 seconds, restart
```

### Permission Denied

**Error**: `EACCES: permission denied`

**Solution**:
```bash
# Fix permissions
chmod -R 755 GLASSYDASH
chmod +x GLASSYDASH/server/index.js
```

### Module Not Found

**Error**: `Error: Cannot find module 'xxx'`

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 🚀 Production Deployment

### Using Docker Compose

1. **Edit Production Config**
```bash
nano docker-compose.prod.yml
```

2. **Set Environment Variables**
```yaml
environment:
  - NODE_ENV=production
  - API_PORT=8080
```

3. **Deploy**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Using systemd (Linux)

Create `/etc/systemd/system/glassydash.service`:

```ini
[Unit]
Description=GLASSYDASH Application
After=network.target

[Service]
Type=simple
User=glassydash
WorkingDirectory=/home/glassydash/GLASSYDASH
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable glassydash
sudo systemctl start glassydash
```

---

## 📊 Performance Optimization

### Increase Performance

1. **Use Production Build**
```bash
npm run build
npm start
```

2. **Enable Compression** (in Express)
```javascript
app.use(compression());
```

3. **Use Reverse Proxy** (Nginx)
```nginx
server {
    listen 80;
    server_name glassydash.io;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## 🔄 Updating

### Docker

```bash
git pull origin main
docker-compose down
docker-compose pull
docker-compose up -d
```

### npm/yarn

```bash
git pull origin main
npm install
npm run build
npm start
```

---

## 📚 Additional Resources

- [Quick Start Guide](../../QUICKSTART.md)
- [Getting Started Guide](GETTING_STARTED.md)
- [Admin Installation Guide](../admin/INSTALLATION.md)
- [Troubleshooting Guide](../admin/TROUBLESHOOTING.md)

---

**Need help?** Check our [Support Guide](../../SUPPORT.md)