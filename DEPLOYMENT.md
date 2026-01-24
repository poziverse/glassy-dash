# Deployment Guide

## Infrastructure Overview

The application is deployed on a nested virtual machine requiring a "Jump Host" for access.

- **Jump Host**: `104.225.217.232` (User: `poziverse`)
- **Target VM**: `192.168.122.45` (User: `pozi`)
- **Service URL**: `http://192.168.122.45:3001` (Internal)

## Access

To access the target VM, you can use an SSH ProxyJump:

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

## Deployment Procedure

### 1. Build & Transport

Since the VM has limited bandwidth or connectivity, we build locally and push the image.

```bash
# 1. Build locally
docker build -t glassy-dash:latest .

# 2. Save image to tarball
docker save glassy-dash:latest -o glassy-dash.tar

# 3. Transfer to Jump Host -> VM (Using SCP with ProxyJump)
scp -o ProxyJump=glassy-jump glassy-dash.tar glassy-vm:~/
```

### 2. Install on VM

SSH into the VM (`ssh glassy-vm`) and run:

```bash
# 1. Load image (This is disk intensive, take patience)
sudo docker load -i glassy-dash.tar

# 2. Stop existing container
sudo docker rm -f GLASSYDASH || true

# 3. Run Container
# NOTE: We run on Port 3001 because Port 8080 is taken by Traefik
sudo docker run -d \
  --name GLASSYDASH \
  --restart unless-stopped \
  -p 3001:8080 \
  -e NODE_ENV=production \
  -e API_PORT=8080 \
  -e JWT_SECRET="your-secure-secret" \
  -e DB_FILE="/app/data/notes.db" \
  -e ADMIN_EMAILS="admin" \
  -e ALLOW_REGISTRATION=true \
  -v ~/.GLASSYDASH:/app/data \
  glassy-dash:latest

# 4. Cleanup
rm glassy-dash.tar
```

## Maintenance & Troubleshooting

### Disk Space Warning

The VM has ~97GB of storage which fills up quickly with Docker images.
**Routine Maintenance**: Run this periodically to free space:

```bash
sudo docker system prune -a --volumes -f
```

### Port Conflicts

- **Traefik** runs on Port `8080` and `80`.
- **GlassyDash** must avoid these. We use **Port 3001**.
- **Cloudflare Tunnel**: Ensure the tunnel points to `http://192.168.122.45:3001`.
