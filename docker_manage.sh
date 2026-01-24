#!/bin/bash
# GLASSYDASH Docker Container Manager
# Provides easy switching between development and production modes

set -e

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"



# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to show usage
show_usage() {
    echo -e "${BLUE}GLASSYDASH Docker Container Manager${NC}"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo -e "  ${GREEN}dev${NC}         Start development mode (hot reload)"
    echo -e "  ${GREEN}prod${NC}        Start production mode (stable)"
    echo -e "  ${GREEN}dev-compose${NC}  Start development via docker-compose"
    echo -e "  ${GREEN}prod-compose${NC} Start production via docker-compose"
    echo -e "  ${GREEN}stop${NC}        Stop all GLASSYDASH containers"
    echo -e "  ${GREEN}status${NC}      Show container status"
    echo -e "  ${GREEN}logs${NC}        Show logs from running container"
    echo -e "  ${GREEN}shell${NC}       Open shell in container"
    echo -e "  ${GREEN}rebuild${NC}     Rebuild and restart current mode"
    echo -e "  ${GREEN}clean${NC}       Remove all GLASSYDASH containers and images"
    echo ""
}

# Function to check which mode is running
check_running_mode() {
    if docker ps | grep -q glassy-dash-dev; then
        echo "Development mode"
        return 0
    elif docker ps | grep -q glassy-dash-prod; then
        echo "Production mode"
        return 0
    else
        echo "None"
        return 1
    fi
}

# Function to stop all containers
stop_all() {
    echo -e "${YELLOW}🛑 Stopping all GLASSYDASH containers...${NC}"
    docker stop glassy-dash-dev 2>/dev/null || true
    docker stop glassy-dash-prod 2>/dev/null || true
    echo -e "${GREEN}✅ All containers stopped${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 GLASSYDASH Container Status${NC}"
    echo ""
    
    CURRENT=$(check_running_mode)
    echo -e "Current Mode: ${GREEN}$CURRENT${NC}"
    echo ""
    
    echo "Development Container:"
    docker ps -a --filter "name=glassy-dash-dev" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo "Production Container:"
    docker ps -a --filter "name=glassy-dash-prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    echo -e "${BLUE}💾 Data Volume: $HOME/.GLASSYDASH${NC}"
}

# Function to show logs
show_logs() {
    CURRENT=$(check_running_mode) || { echo -e "${RED}❌ No container running${NC}"; exit 1; }
    
    if [ "$CURRENT" = "Development mode" ]; then
        docker logs -f glassy-dash-dev
    elif [ "$CURRENT" = "Production mode" ]; then
        docker logs -f glassy-dash-prod
    fi
}

# Function to open shell
open_shell() {
    CURRENT=$(check_running_mode) || { echo -e "${RED}❌ No container running${NC}"; exit 1; }
    
    if [ "$CURRENT" = "Development mode" ]; then
        docker exec -it glassy-dash-dev bash
    elif [ "$CURRENT" = "Production mode" ]; then
        docker exec -it glassy-dash-prod bash
    fi
}

# Function to clean everything
clean_all() {
    echo -e "${YELLOW}🧹 Removing all GLASSYDASH containers...${NC}"
    docker stop glassy-dash-dev 2>/dev/null || true
    docker stop glassy-dash-prod 2>/dev/null || true
    docker rm glassy-dash-dev 2>/dev/null || true
    docker rm glassy-dash-prod 2>/dev/null || true
    
    echo -e "${YELLOW}🗑️  Removing GLASSYDASH images...${NC}"
    docker rmi GLASSYDASH:dev 2>/dev/null || true
    docker rmi GLASSYDASH:local 2>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Main command handler
case "${1:-help}" in
    dev)
        stop_all
        echo -e "${GREEN}🚀 Starting development mode...${NC}"
        ./local_docker_run_dev.sh
        ;;
    prod)
        stop_all
        echo -e "${GREEN}🚀 Starting production mode...${NC}"
        ./local_docker_run.sh
        ;;
    dev-compose)
        stop_all
        echo -e "${GREEN}🚀 Starting development mode (docker-compose)...${NC}"
        docker-compose up --build
        ;;
    prod-compose)
        stop_all
        echo -e "${GREEN}🚀 Starting production mode (docker-compose)...${NC}"
        docker-compose -f docker-compose.prod.yml up --build -d
        ;;
    stop)
        stop_all
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    shell)
        open_shell
        ;;
    rebuild)
        CURRENT=$(check_running_mode) || { echo -e "${RED}❌ No container running${NC}"; exit 1; }
        stop_all
        
        if [ "$CURRENT" = "Development mode" ]; then
            echo -e "${GREEN}🔄 Rebuilding development mode...${NC}"
            ./local_docker_run_dev.sh
        elif [ "$CURRENT" = "Production mode" ]; then
            echo -e "${GREEN}🔄 Rebuilding production mode...${NC}"
            ./local_docker_run.sh
        fi
        ;;
    clean)
        clean_all
        ;;
    help|*)
        show_usage
        ;;
esac