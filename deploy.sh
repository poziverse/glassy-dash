#!/bin/bash
# ============================================================================
# GlassyDash Production Deploy Script
# ============================================================================
# One-command deploy to the remote production VM via jump host.
#
# Prerequisites:
#   - SSH key-based authentication configured for glassy-jump and the VM
#   - docker_manage.sh and docker-compose.prod.yml present on VM
#
# Usage:
#   ./deploy.sh           # Full build + deploy
#   ./deploy.sh --skip-build  # Deploy existing tarball only
# ============================================================================
set -euo pipefail

# --- Configuration ---
IMAGE="glassy-dash:latest"
TARBALL="glassy-dash.tar"
JUMP="glassy-jump"
VM_USER="pozi"
VM_IP="192.168.122.45"
HEALTH_URL="http://localhost:3001/api/monitoring/health"

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[deploy]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# --- Parse Arguments ---
SKIP_BUILD=false
for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
  esac
done

# --- Step 1: Build ---
if [ "$SKIP_BUILD" = false ]; then
  log "🔨 Building Docker image..."
  docker build -t "$IMAGE" . || error "Docker build failed"
  success "Image built: $IMAGE"

  log "📦 Saving image to tarball..."
  docker save "$IMAGE" -o "$TARBALL" || error "Failed to save tarball"
  success "Tarball created: $TARBALL ($(du -h "$TARBALL" | cut -f1))"
else
  warn "Skipping build (--skip-build flag set)"
  if [ ! -f "$TARBALL" ]; then
    error "Tarball not found: $TARBALL"
  fi
fi

# --- Step 2: Transfer to Jump Host ---
log "🚀 Transferring tarball to jump host ($JUMP)..."
scp "$TARBALL" "$JUMP:~/" || error "Failed to transfer to jump host"
success "Tarball uploaded to jump host"

# --- Step 3: Transfer to VM ---
log "🚀 Transferring tarball from jump host to VM ($VM_IP)..."
ssh "$JUMP" "scp ~/$TARBALL $VM_USER@$VM_IP:~/" || error "Failed to transfer to VM"
success "Tarball uploaded to VM"

# --- Step 4: Load Image and Restart ---
log "🐳 Loading image and restarting container on VM..."
ssh "$JUMP" "ssh $VM_USER@$VM_IP 'sudo docker load -i ~/$TARBALL && sudo ./docker_manage.sh prod-compose'" || error "Failed to load/restart on VM"
success "Container restarted on VM"

# --- Step 5: Health Check ---
log "🩺 Verifying health endpoint..."
HEALTH_RESULT=$(ssh "$JUMP" "ssh $VM_USER@$VM_IP 'curl -sf $HEALTH_URL'" 2>/dev/null || echo "FAILED")

if [[ "$HEALTH_RESULT" == *"ok"* ]] || [[ "$HEALTH_RESULT" == *"healthy"* ]]; then
  success "Health check passed!"
else
  warn "Health check returned: $HEALTH_RESULT"
fi

# --- Step 6: Cleanup Local Tarball ---
log "🧹 Cleaning up local tarball..."
rm -f "$TARBALL"
success "Local tarball removed"

echo ""
echo -e "${GREEN}🎉 Deploy complete!${NC}"
echo -e "   🌐 https://dash.0rel.com"
echo ""
