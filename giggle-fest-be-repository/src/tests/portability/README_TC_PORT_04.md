# TC_PORT_04: Cross-Platform Portability Testing with Docker

## 📋 Overview

This test validates **cross-platform portability** of the Gigglefest application using Docker containers. Unlike unit tests, this test runs the **actual application** in Docker containers simulating different platforms to ensure consistent behavior across:

- **Linux AMD64** (x86_64) - Intel/AMD processors
- **Linux ARM64** - Apple Silicon (M1/M2/M3), AWS Graviton, ARM servers
- **Windows** (via Linux containers)
- **macOS** (via Docker Desktop)

**ISO/IEC 25010 Compliance:** Portability > Installability & Adaptability

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Setup                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐│
│  │   PostgreSQL   │  │  Linux AMD64   │  │  Linux ARM64   ││
│  │   (Database)   │  │  Container     │  │  Container     ││
│  │                │  │                │  │                ││
│  │  Port: 5432    │  │  Port: 8081    │  │  Port: 8082    ││
│  └────────────────┘  └────────────────┘  └────────────────┘│
│         │                    │                    │          │
│         └────────────────────┴────────────────────┘          │
│                              │                                │
│                    ┌─────────▼─────────┐                     │
│                    │   Test Runner     │                     │
│                    │   (Node.js)       │                     │
│                    │                   │                     │
│                    │  Runs HTTP tests  │                     │
│                    │  against all      │                     │
│                    │  platforms        │                     │
│                    └───────────────────┘                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Files Created

### 1. **Dockerfile.test**

Multi-platform Dockerfile for testing with:

- Platform argument support (`linux/amd64`, `linux/arm64`)
- Test environment configuration
- Health check for automated testing
- Minimal Alpine-based image for fast builds

### 2. **docker-compose.portability.yml**

Orchestrates the entire test environment:

- PostgreSQL database (shared across platforms)
- Application containers for each platform
- Test runner container
- Health checks and dependencies

### 3. **tc_port_04_runner.js**

Node.js test runner that:

- Tests each platform container via HTTP
- Validates API endpoints, error handling, performance
- Ensures response consistency across platforms
- Generates detailed test reports

### 4. **run-portability-test.sh** (Linux/macOS)

Automated shell script that:

- Checks Docker availability
- Builds multi-platform images
- Starts containers
- Waits for health checks
- Runs tests
- Cleans up resources

### 5. **run-portability-test.bat** (Windows)

Windows batch script with the same functionality as the shell script

---

## 🚀 Quick Start

### Prerequisites

1. **Docker Desktop** installed and running
2. **Docker Compose** v2.0+ (included with Docker Desktop)
3. **Buildx** enabled (for multi-platform builds)

### Running the Test

#### On Linux/macOS:

```bash
# Make script executable
chmod +x run-portability-test.sh

# Run portability tests
./run-portability-test.sh
```

#### On Windows:

```cmd
# Run portability tests
run-portability-test.bat
```

### Manual Execution

If you prefer manual control:

```bash
# 1. Build images
docker compose -f docker-compose.portability.yml build

# 2. Start services
docker compose -f docker-compose.portability.yml up -d

# 3. Wait for health (30 seconds)
sleep 30

# 4. Run tests
docker compose -f docker-compose.portability.yml run --rm test-runner

# 5. Cleanup
docker compose -f docker-compose.portability.yml down -v
```

---

## 🧪 Test Coverage

### 1. Basic Connectivity (ISO 25010: Installability)

- ✅ Container starts successfully
- ✅ Application responds to health checks
- ✅ Database connection established

### 2. API Endpoint Testing (ISO 25010: Adaptability)

- ✅ `/api/v1/events` - Returns events list
- ✅ `/api/v1/categories` - Returns categories
- ✅ `/api/v1/tickets` - Returns tickets
- ✅ All endpoints return valid JSON

### 3. Response Consistency (ISO 25010: Replaceability)

- ✅ Same API version across platforms
- ✅ Identical response structure
- ✅ Consistent content types
- ✅ Same behavior for identical requests

### 4. Error Handling (ISO 25010: Maturity)

- ✅ 404 errors return proper JSON
- ✅ Invalid parameters handled gracefully
- ✅ Error messages are consistent

### 5. Performance Baseline (ISO 25010: Time Behavior)

- ✅ Average response time < 1000ms
- ✅ Consistent performance across platforms
- ✅ No platform-specific degradation

---

## 📊 Expected Output

### Successful Run:

```
╔════════════════════════════════════════════════════════════╗
║  TC_PORT_04: Cross-Platform Portability Test (Docker)     ║
║  ISO/IEC 25010 - Portability > Installability              ║
╚════════════════════════════════════════════════════════════╝

Testing: Linux AMD64 (x86_64) (x86_64)
=========================================
Host: gigglefest-linux-amd64:8080

  ✓ Should respond to health check endpoint
  ✓ Should handle GET /api/v1/events
  ✓ Should handle GET /api/v1/categories
  ✓ Should handle GET /api/v1/tickets
  ✓ Should have consistent API version
  ✓ Should have consistent response structure
  ✓ Should return JSON content type
  ✓ Should handle 404 errors gracefully
  ✓ Should handle invalid query parameters
  ✓ Should respond within 1s (avg: 234ms)

Testing: Linux ARM64 (Apple Silicon/Graviton) (arm64)
======================================================
Host: gigglefest-linux-arm64:8080

  ✓ Should respond to health check endpoint
  ✓ Should handle GET /api/v1/events
  ✓ Should handle GET /api/v1/categories
  ✓ Should handle GET /api/v1/tickets
  ✓ Should have consistent API version
  ✓ Should have consistent response structure
  ✓ Should return JSON content type
  ✓ Should handle 404 errors gracefully
  ✓ Should handle invalid query parameters
  ✓ Should respond within 1s (avg: 241ms)

Test Summary
============
Total Tests:  20
Passed:       20
Failed:       0
Success Rate: 100.0%

✓ All portability tests passed!
✓ Application is portable across tested platforms
```

---

## 🔧 Configuration

### Environment Variables (docker-compose.portability.yml)

```yaml
DATABASE_URL: postgresql://testuser:testpass@postgres-test:5432/gigglefest_test
NODE_ENV: test
PORT: 8080
JWT_SECRET: test-secret-key-portability
JWT_EXPIRES_IN: 1h
```

### Platform Configuration

Modify `PLATFORMS` array in `tc_port_04_runner.js` to add/remove platforms:

```javascript
const PLATFORMS = [
  {
    name: "Linux AMD64 (x86_64)",
    host: "gigglefest-linux-amd64",
    port: 8080,
    architecture: "x86_64",
    os: "Linux",
  },
  // Add more platforms here
];
```

### Health Check Tuning

In `Dockerfile.test`:

```dockerfile
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1
```

---

## 🐛 Troubleshooting

### Docker Not Running

```
Error: Docker is not running
```

**Solution:**

- Start Docker Desktop
- Wait for Docker to fully initialize
- Run test again

### Build Fails for ARM64

```
Error: failed to solve with frontend dockerfile.v0
```

**Solution:**

```bash
# Enable buildx (multi-platform support)
docker buildx create --use

# Rebuild
docker compose -f docker-compose.portability.yml build --no-cache
```

### Container Unhealthy

```
Error: Services failed to become healthy
```

**Solution:**

```bash
# Check logs
docker compose -f docker-compose.portability.yml logs

# Common issues:
# 1. Database not ready - increase start_period in healthcheck
# 2. Port already in use - change ports in docker-compose.portability.yml
# 3. Memory limit - increase Docker Desktop memory allocation
```

### Platform Not Supported

If your machine doesn't support ARM64 emulation:

**Solution:**

- Remove `app-linux-arm64` from docker-compose.portability.yml
- Update `PLATFORMS` in tc_port_04_runner.js
- Run tests with AMD64 only

### Tests Timeout

```
Error: Request timeout
```

**Solution:**

```bash
# Increase timeout in tc_port_04_runner.js
timeout: 30000  // Change from 10000 to 30000
```

---

## 📈 Performance Tips

### Faster Builds

```bash
# Use BuildKit
export DOCKER_BUILDKIT=1

# Build with cache
docker compose -f docker-compose.portability.yml build
```

### Resource Allocation

In Docker Desktop settings:

- **CPUs:** 4+ recommended
- **Memory:** 8GB+ recommended
- **Disk:** 20GB+ available

### Skip ARM64 for Speed

If you only need AMD64 testing:

```bash
# Start only AMD64
docker compose -f docker-compose.portability.yml up -d postgres-test app-linux-amd64

# Update test runner to skip ARM64
```

---

## 🎯 Integration with CI/CD

### GitHub Actions Example

```yaml
name: Portability Tests

on: [push, pull_request]

jobs:
  portability:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Run Portability Tests
        run: |
          chmod +x run-portability-test.sh
          ./run-portability-test.sh
```

### GitLab CI Example

```yaml
portability-test:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  script:
    - chmod +x run-portability-test.sh
    - ./run-portability-test.sh
```

---

## 📚 ISO 25010 Compliance

| Characteristic  | Sub-Characteristic | Test Coverage                                  | Status  |
| --------------- | ------------------ | ---------------------------------------------- | ------- |
| **Portability** | Installability     | Docker build, container startup, health checks | ✅ Pass |
| **Portability** | Adaptability       | Multi-platform testing (AMD64, ARM64)          | ✅ Pass |
| **Portability** | Replaceability     | Platform-independent responses, consistent API | ✅ Pass |

---

## 🔄 Maintenance

### Adding New Platforms

1. Update `Dockerfile.test` with new platform ARG
2. Add service in `docker-compose.portability.yml`
3. Add platform config in `tc_port_04_runner.js`
4. Test new platform

### Adding New Tests

Edit `tc_port_04_runner.js`:

```javascript
async function testNewFeature(platform) {
  try {
    const response = await makeRequest(
      platform.host,
      platform.port,
      "/new-endpoint"
    );
    const passed = response.statusCode === 200;
    logTest(platform, "Should handle new feature", passed);
  } catch (error) {
    logTest(platform, "Should handle new feature", false, error.message);
  }
}
```

---

## 📖 References

- **ISO/IEC 25010:2011** - Software Quality Model
- **Docker Multi-Platform Builds**: https://docs.docker.com/build/building/multi-platform/
- **Docker Compose**: https://docs.docker.com/compose/
- **Node.js HTTP Module**: https://nodejs.org/api/http.html

---

**Last Updated:** December 2025  
**Test Version:** 1.0.0  
**Compliance:** ISO/IEC 25010 - Portability
