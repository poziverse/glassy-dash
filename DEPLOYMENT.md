# Deployment Guide

## Infrastructure Overview

The application is deployed on a nested virtual machine requiring a "Jump Host" for access.

- **Jump Host**: `104.225.217.232` (User: `poziverse`)
- **Target VM**: `192.168.122.45` (User: `pozi`)
- **Service URL**: `http://192.168.122.45:3001` (Internal)

## Access

To access the target VM for **GlassyDash** maintenance, you can use an SSH ProxyJump:

```bash
# ~/.ssh/config
Host glassy-jump
    HostName 104.225.217.232
    User poziverse
    IdentityFile ~/.ssh/your_key

Host glassy-vm
    HostName 192.168.122.45
    User pozi
    ProxyJump glassy-jump
    IdentityFile ~/.ssh/your_key
```

Then SSH directly: `ssh glassy-vm`

## Pre-Deployment Verification

Before deploying, always verify the production build is current and working:

```bash
# Navigate to project directory
cd glassy-dash/GLASSYDASH

# Check for uncommitted changes
git status

# Rebuild the site with latest code
npm run build

# Verify build artifacts exist
ls -lh dist/

# Expected output:
# index.html (~0.61 kB)
# assets/index-B*.css (~109 kB)
# assets/CDWEKZTF-*.js (~226 kB)
# assets/index-*.js (~2.1 MB)

# Preview the production build locally
npm run preview

# Test at http://localhost:4173/ to ensure:
# - All features work correctly
# - No console errors
# - All recent changes are present
# - Styles and assets load properly
```

**Critical:**

- Always rebuild after committing changes
- Verify the build includes all recent modifications
- Test locally before packaging for deployment
- The `dist/` directory contains production assets that will be deployed

## Deployment Procedure

### 1. Build & Package (Local Machine)

We build the image locally to leverage local resources and avoid compiling heavy dependencies on the VM.

```bash
# 1. Build the production image
# Ensure you are in the project root
docker build -t glassy-dash:prod .

# 2. Save and Compress the image
# Compressing with gzip significantly reduces transfer time (~1GB -> ~300MB)
docker save glassy-dash:prod | gzip > glassy-dash.tar.gz
```

### 2. Transport to VM (Via Jump Host)

Since we cannot SSH directly to the VM, we proxy through the Jump Host.

**Note:** You will be prompted for the SSH key passphrase (`Maplewood2025`) multiple times during this process.

```bash
# 1. Copy to Jump Host
# This will ask for the passphrase for the local key if not cached
scp glassy-dash.tar.gz glassy-jump:~/

# 2. Copy from Jump Host to VM
# Connect to jump host to execute scp to VM
ssh -t glassy-jump "scp ~/glassy-dash.tar.gz pozi@192.168.122.45:~/"
# Prompts for:
# 1. Jump host SSH key passphrase (Maplewood2025)
# 2. VM user (pozi) password (pozi)
```

### 3. Install & Start on VM

```bash
# Connect to VM (via Jump Host)
# Prompts for Jump host passphrase (Maplewood2025) then VM password (pozi)
ssh -t glassy-jump "ssh -t pozi@192.168.122.45"

# --- Run the following ON THE VM ---

# 1. Load the image
# This imports the image from the tarball into the VM's Docker registry
gunzip -c glassy-dash.tar.gz | sudo docker load

# 2. Stop existing container (if running)
sudo docker rm -f glassy-dash-prod 2>/dev/null || true

# 3. Start the Application using the management script (Recommended)
# This handles networks, volumes, and ports automatically
chmod +x ~/docker_manage.sh
sudo ./docker_manage.sh prod-compose

# OR Start manually:
# sudo docker run -d \
#   --name glassy-dash-prod \
#   --restart unless-stopped \
#   -p 3001:8080 \
#   -e NODE_ENV=production \
#   -e API_PORT=8080 \
#   -v ~/.GLASSYDASH:/app/data \
#   glassy-dash:prod
```

### Credentials Reference

- **SSH Key Passphrase**: `Maplewood2025`
- **VM User**: `pozi`
- **VM Password**: `pozi`
- **Service URL**: `http://192.168.122.45:3001`

### Environment Variables

Ensure `GEMINI_API_KEY` (or `VITE_GEMINI_API_KEY`) is set in `docker-compose.prod.yml` or passed via `-e`.

## Maintenance & Troubleshooting

### 502 Bad Gateway

If you encounter a 502 error via the Cloudflare URL:

1. **Check Tunnel Target**: If the Cloudflare tunnel (`cloudflared`) is running **inside the VM**, ensure its target is set to `http://localhost:3001`.
2. **Port Mismatch**: Ensure no other service (like Traefik) is blocking port `3001`.
3. **Health Check**: Verify the container is healthy via `docker ps`. The health check endpoint is `/api/monitoring/health`.

### Disk Space

The VM has limited storage (~97GB). Periodically prune old images:

```bash
sudo docker system prune -a --volumes -f
```

### Management Script

Use `./docker_manage.sh` for all container operations. It automatically handles:

- Stopping conflicting containers.
- Switching between `dev` and `prod`.
- Mapping the correct external ports (3001 for prod).
