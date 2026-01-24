#!/bin/bash

# GlassyDash Docker Deployment Script
# This script builds and runs the GlassyDash application in a Docker container

set -e  # Exit on any error

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"


echo "🧹 Removing existing glassy-dash container (if exists)..."
docker rm -f glassy-dash 2>/dev/null || true

echo "🏗️  Building glassy-dash Docker image..."
docker build -t glassy-dash:local .

echo "🚀 Starting glassy-dash container..."
docker run -d \
  --name glassy-dash \
  --restart unless-stopped \
  -p 3001:8080 \
  -e NODE_ENV=production \
  -e API_PORT=8080 \
  -e JWT_SECRET=dev-please-change \
  -e DB_FILE=/app/data/notes.db \
  -e ADMIN_EMAILS=adminniku \
  -v "$HOME/.glassy-dash:/app/data" \
  glassy-dash:local

echo "✅ Local Deployment complete!"
echo "🌐 Application should be available at http://localhost:8080"
echo "� Stop container: docker stop glassy-dash"
echo "� Streaming logs (Press Ctrl+C to stop viewing logs, container will keep running)..."
docker logs -f glassy-dash