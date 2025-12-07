#!/bin/bash

# TC_PORT_04: Cross-Platform Portability Test Script
# This script automates the execution of portability tests using Docker

set -e

COLORS_RED='\033[0;31m'
COLORS_GREEN='\033[0;32m'
COLORS_YELLOW='\033[1;33m'
COLORS_BLUE='\033[0;34m'
COLORS_CYAN='\033[0;36m'
COLORS_RESET='\033[0m'

echo -e "${COLORS_BLUE}╔════════════════════════════════════════════════════════════╗${COLORS_RESET}"
echo -e "${COLORS_BLUE}║  TC_PORT_04: Cross-Platform Portability Test              ║${COLORS_RESET}"
echo -e "${COLORS_BLUE}║  ISO/IEC 25010 - Portability Testing with Docker          ║${COLORS_RESET}"
echo -e "${COLORS_BLUE}╚════════════════════════════════════════════════════════════╝${COLORS_RESET}"
echo ""

# Check if Docker is running
echo -e "${COLORS_CYAN}[1/6] Checking Docker status...${COLORS_RESET}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${COLORS_RED}✗ Docker is not running${COLORS_RESET}"
    echo -e "${COLORS_YELLOW}Please start Docker Desktop and try again${COLORS_RESET}"
    exit 1
fi
echo -e "${COLORS_GREEN}✓ Docker is running${COLORS_RESET}"
echo ""

# Check if Docker Compose is available
echo -e "${COLORS_CYAN}[2/6] Checking Docker Compose...${COLORS_RESET}"
if ! docker compose version > /dev/null 2>&1; then
    echo -e "${COLORS_RED}✗ Docker Compose is not available${COLORS_RESET}"
    exit 1
fi
echo -e "${COLORS_GREEN}✓ Docker Compose is available${COLORS_RESET}"
echo ""

# Clean up any existing containers
echo -e "${COLORS_CYAN}[3/6] Cleaning up existing containers...${COLORS_RESET}"
docker compose -f docker-compose.portability.yml down -v --remove-orphans 2>/dev/null || true
echo -e "${COLORS_GREEN}✓ Cleanup complete${COLORS_RESET}"
echo ""

# Build and start containers
echo -e "${COLORS_CYAN}[4/6] Building Docker images for all platforms...${COLORS_RESET}"
echo -e "${COLORS_YELLOW}This may take several minutes on first run...${COLORS_RESET}"
if ! docker compose -f docker-compose.portability.yml build; then
    echo -e "${COLORS_RED}✗ Failed to build Docker images${COLORS_RESET}"
    exit 1
fi
echo -e "${COLORS_GREEN}✓ Images built successfully${COLORS_RESET}"
echo ""

# Start containers
echo -e "${COLORS_CYAN}[5/6] Starting containers...${COLORS_RESET}"
if ! docker compose -f docker-compose.portability.yml up -d postgres-test app-linux-amd64 app-linux-arm64; then
    echo -e "${COLORS_RED}✗ Failed to start containers${COLORS_RESET}"
    docker compose -f docker-compose.portability.yml down -v
    exit 1
fi
echo -e "${COLORS_GREEN}✓ Containers started${COLORS_RESET}"
echo ""

# Wait for services to be ready
echo -e "${COLORS_CYAN}[6/6] Waiting for services to be healthy...${COLORS_RESET}"
echo -e "${COLORS_YELLOW}This may take up to 30 seconds...${COLORS_RESET}"

MAX_WAIT=60
WAITED=0
ALL_HEALTHY=false

while [ $WAITED -lt $MAX_WAIT ]; do
    POSTGRES_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' postgres-test 2>/dev/null || echo "starting")
    AMD64_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' gigglefest-linux-amd64 2>/dev/null || echo "starting")
    ARM64_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' gigglefest-linux-arm64 2>/dev/null || echo "starting")
    
    if [ "$POSTGRES_HEALTH" = "healthy" ] && [ "$AMD64_HEALTH" = "healthy" ] && [ "$ARM64_HEALTH" = "healthy" ]; then
        ALL_HEALTHY=true
        break
    fi
    
    echo -e "  Postgres: $POSTGRES_HEALTH | AMD64: $AMD64_HEALTH | ARM64: $ARM64_HEALTH"
    sleep 5
    WAITED=$((WAITED + 5))
done

if [ "$ALL_HEALTHY" = false ]; then
    echo -e "${COLORS_RED}✗ Services failed to become healthy${COLORS_RESET}"
    echo -e "${COLORS_YELLOW}Showing container logs:${COLORS_RESET}"
    docker compose -f docker-compose.portability.yml logs
    docker compose -f docker-compose.portability.yml down -v
    exit 1
fi

echo -e "${COLORS_GREEN}✓ All services are healthy${COLORS_RESET}"
echo ""

# Run portability tests
echo -e "${COLORS_BLUE}╔════════════════════════════════════════════════════════════╗${COLORS_RESET}"
echo -e "${COLORS_BLUE}║  Running Portability Tests                                 ║${COLORS_RESET}"
echo -e "${COLORS_BLUE}╚════════════════════════════════════════════════════════════╝${COLORS_RESET}"
echo ""

# Run the test runner
docker compose -f docker-compose.portability.yml run --rm test-runner
TEST_RESULT=$?

# Cleanup
echo ""
echo -e "${COLORS_CYAN}Cleaning up containers...${COLORS_RESET}"
docker compose -f docker-compose.portability.yml down -v

if [ $TEST_RESULT -eq 0 ]; then
    echo ""
    echo -e "${COLORS_GREEN}╔════════════════════════════════════════════════════════════╗${COLORS_RESET}"
    echo -e "${COLORS_GREEN}║  ✓ Portability Tests PASSED                               ║${COLORS_RESET}"
    echo -e "${COLORS_GREEN}╚════════════════════════════════════════════════════════════╝${COLORS_RESET}"
    echo ""
    exit 0
else
    echo ""
    echo -e "${COLORS_RED}╔════════════════════════════════════════════════════════════╗${COLORS_RESET}"
    echo -e "${COLORS_RED}║  ✗ Portability Tests FAILED                               ║${COLORS_RESET}"
    echo -e "${COLORS_RED}╚════════════════════════════════════════════════════════════╝${COLORS_RESET}"
    echo ""
    exit 1
fi
