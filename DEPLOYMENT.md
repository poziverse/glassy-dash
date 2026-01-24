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

### 1. Build & Transport (Local Machine)

Since the VM has limited direct connectivity, build the image locally and transport it via the jump host.

```bash
# 1. Build locally
docker build -t glassy-dash:latest .

# 2. Save image to tarball
docker save glassy-dash:latest -o glassy-dash.tar

# 3. Transfer to Jump Host
scp glassy-dash.tar glassy-jump:~/
```

### 2. Transport to VM (From Local Machine)

```bash
# Transfer from Jump Host to VM
ssh -t glassy-jump "scp ~/glassy-dash.tar pozi@192.168.122.45:~/"
```

### 3. Install & Start on VM

```bash
# 1. Load image onto VM
ssh -t glassy-jump "ssh -t pozi@192.168.122.45 'sudo docker load -i ~/glassy-dash.tar'"

# 2. Start Application
# Use the management script to handle port mapping (3001:8080) and composition
ssh -t glassy-jump "ssh -t pozi@192.168.122.45 'sudo ./docker_manage.sh prod-compose'"
```

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
