#!/bin/bash
# GlassKeep Development Container Runner
# Starts container with hot reload and source code mounting

set -e  # Exit on any error

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"


# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Removing existing glass-keep-dev container (if exists)...${NC}"
docker rm -f glass-keep-dev 2>/dev/null || true

echo -e "${YELLOW}🏗️  Building development Docker image...${NC}"
docker build -f Dockerfile.dev -t glass-keep:dev .

echo -e "${GREEN}🚀 Starting development container...${NC}"
docker run -d \
  --name glass-keep-dev \
  --restart unless-stopped \
  -p 5173:5173 \
  -p 8080:8080 \
  -e NODE_ENV=development \
  -e API_PORT=8080 \
  -e JWT_SECRET=dev-please-change-in-production \
  -e DB_FILE=/app/data/notes.db \
  -e ADMIN_EMAILS=admin \
  -v "$SCRIPT_DIR:/app" \
  -v "$HOME/.glass-keep:/app/data" \
  glass-keep:dev

echo -e "${GREEN}✅ Development container started!${NC}"
echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo -e "   Frontend (Vite Dev Server): ${GREEN}http://localhost:5173${NC}"
echo -e "   API (Express Server):        ${GREEN}http://localhost:8080${NC}"
echo -e "   Health Check:               ${GREEN}http://localhost:8080/api/health${NC}"
echo ""
echo -e "${BLUE}📝 Useful Commands:${NC}"
echo -e "   View logs:     ${YELLOW}docker logs -f glass-keep-dev${NC}"
echo -e "   Stop container: ${YELLOW}docker stop glass-keep-dev${NC}"
echo -e "   Start shell:    ${YELLOW}docker exec -it glass-keep-dev bash${NC}"
echo -e "   Restart:        ${YELLOW}docker restart glass-keep-dev${NC}"
echo ""
echo -e "${BLUE}💡 Note: Changes to source code are automatically reflected (hot reload)${NC}"
echo -e "${BLUE}💡 Note: Data persists in $HOME/.glass-keep${NC}"