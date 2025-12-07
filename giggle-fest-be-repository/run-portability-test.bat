@echo off
REM TC_PORT_04: Cross-Platform Portability Test Script (Windows)
REM This script automates the execution of portability tests using Docker

setlocal enabledelayedexpansion

echo ================================================================
echo   TC_PORT_04: Cross-Platform Portability Test
echo   ISO/IEC 25010 - Portability Testing with Docker
echo ================================================================
echo.

REM Check if Docker is running
echo [1/6] Checking Docker status...
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running
    echo Please start Docker Desktop and try again
    exit /b 1
)
echo [OK] Docker is running
echo.

REM Check if Docker Compose is available
echo [2/6] Checking Docker Compose...
docker compose version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not available
    exit /b 1
)
echo [OK] Docker Compose is available
echo.

REM Clean up any existing containers
echo [3/6] Cleaning up existing containers...
docker compose -f docker-compose.portability.yml down -v --remove-orphans >nul 2>&1
echo [OK] Cleanup complete
echo.

REM Build and start containers
echo [4/6] Building Docker images for all platforms...
echo This may take several minutes on first run...
docker compose -f docker-compose.portability.yml build
if errorlevel 1 (
    echo [ERROR] Failed to build Docker images
    exit /b 1
)
echo [OK] Images built successfully
echo.

REM Start containers
echo [5/6] Starting containers...
docker compose -f docker-compose.portability.yml up -d postgres-test app-linux-amd64 app-linux-arm64
if errorlevel 1 (
    echo [ERROR] Failed to start containers
    docker compose -f docker-compose.portability.yml down -v
    exit /b 1
)
echo [OK] Containers started
echo.

REM Wait for services to be ready
echo [6/6] Waiting for services to be healthy...
echo This may take up to 30 seconds...

set MAX_WAIT=60
set WAITED=0
set ALL_HEALTHY=0

:wait_loop
if !WAITED! GEQ !MAX_WAIT! goto wait_timeout

REM Check health status
for /f "delims=" %%i in ('docker inspect --format="{{.State.Health.Status}}" postgres-test 2^>nul') do set POSTGRES_HEALTH=%%i
for /f "delims=" %%i in ('docker inspect --format="{{.State.Health.Status}}" gigglefest-linux-amd64 2^>nul') do set AMD64_HEALTH=%%i
for /f "delims=" %%i in ('docker inspect --format="{{.State.Health.Status}}" gigglefest-linux-arm64 2^>nul') do set ARM64_HEALTH=%%i

if "!POSTGRES_HEALTH!"=="healthy" if "!AMD64_HEALTH!"=="healthy" if "!ARM64_HEALTH!"=="healthy" (
    set ALL_HEALTHY=1
    goto wait_done
)

echo   Postgres: !POSTGRES_HEALTH! ^| AMD64: !AMD64_HEALTH! ^| ARM64: !ARM64_HEALTH!
timeout /t 5 /nobreak >nul
set /a WAITED+=5
goto wait_loop

:wait_timeout
echo [ERROR] Services failed to become healthy
echo Showing container logs:
docker compose -f docker-compose.portability.yml logs
docker compose -f docker-compose.portability.yml down -v
exit /b 1

:wait_done
echo [OK] All services are healthy
echo.

REM Run portability tests
echo ================================================================
echo   Running Portability Tests
echo ================================================================
echo.

docker compose -f docker-compose.portability.yml run --rm test-runner
set TEST_RESULT=!errorlevel!

REM Cleanup
echo.
echo Cleaning up containers...
docker compose -f docker-compose.portability.yml down -v

if !TEST_RESULT! EQU 0 (
    echo.
    echo ================================================================
    echo   [OK] Portability Tests PASSED
    echo ================================================================
    echo.
    exit /b 0
) else (
    echo.
    echo ================================================================
    echo   [ERROR] Portability Tests FAILED
    echo ================================================================
    echo.
    exit /b 1
)
