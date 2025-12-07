# TC_PORT_04: Cross-Platform Portability Test - Quick Start Guide

## 🎯 What This Test Does

Tests the Gigglefest application running in **Docker containers** across multiple platforms:

- **Linux AMD64** (x86_64) - Intel/AMD processors
- **Linux ARM64** - Apple Silicon (M1/M2/M3), AWS Graviton

**ISO/IEC 25010:** Portability > Installability & Adaptability

---

## ⚡ Quick Start (3 Steps)

### Option 1: Automated Script (Recommended)

**Windows:**

```cmd
run-portability-test.bat
```

**Linux/macOS:**

```bash
./run-portability-test.sh
```

### Option 2: Manual Execution

```bash
# 1. Build multi-platform images
docker compose -f docker-compose.portability.yml build

# 2. Start all containers
docker compose -f docker-compose.portability.yml up -d

# 3. Wait 30 seconds, then run tests
docker compose -f docker-compose.portability.yml run --rm test-runner

# 4. Cleanup
docker compose -f docker-compose.portability.yml down -v
```

### Option 3: Jest Test (Verification Only)

```bash
npm test -- src/tests/portability/portability4.test.js
```

**Note:** This only verifies configuration files exist, not actual platform testing.

---

## 📊 What Gets Tested

| Test Category            | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| **Basic Connectivity**   | Application starts and responds to health checks           |
| **API Endpoints**        | `/api/v1/events`, `/api/v1/categories`, `/api/v1/tickets`  |
| **Response Consistency** | Same API version, structure, and behavior across platforms |
| **Error Handling**       | 404 errors, invalid parameters handled identically         |
| **Performance**          | Response time < 1000ms average across all platforms        |

---

## 📁 Files Created

```
📦 Project Root
├── Dockerfile.test                         # Multi-platform Dockerfile
├── docker-compose.portability.yml          # Orchestration config
├── run-portability-test.sh                 # Linux/macOS script
├── run-portability-test.bat                # Windows script
└── src/tests/portability/
    ├── portability4.test.js                # Jest verification test
    ├── tc_port_04_runner.js                # HTTP test runner
    └── README_TC_PORT_04.md                # Full documentation
```

---

## ✅ Expected Output

```
╔════════════════════════════════════════════════════════════╗
║  TC_PORT_04: Cross-Platform Portability Test (Docker)     ║
║  ISO/IEC 25010 - Portability > Installability              ║
╚════════════════════════════════════════════════════════════╝

Testing: Linux AMD64 (x86_64) (x86_64)
=========================================
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

╔════════════════════════════════════════════════════════════╗
║  ✓ Portability Tests PASSED                               ║
╚════════════════════════════════════════════════════════════╝
```

---

## 🔧 Troubleshooting

### Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**

1. Start Docker Desktop
2. Wait for Docker to initialize (green icon)
3. Run test again

### Port Already in Use

**Error:** `bind: address already in use`

**Solution:**

```bash
# Cleanup existing containers
docker compose -f docker-compose.portability.yml down -v

# Or change ports in docker-compose.portability.yml
```

### Build Fails

**Error:** `failed to solve with frontend dockerfile.v0`

**Solution:**

```bash
# Enable buildx for multi-platform
docker buildx create --use

# Rebuild without cache
docker compose -f docker-compose.portability.yml build --no-cache
```

### ARM64 Not Supported

If your system doesn't support ARM64 emulation:

1. Edit `docker-compose.portability.yml`
2. Remove `app-linux-arm64` service
3. Edit `tc_port_04_runner.js`
4. Remove ARM64 from `PLATFORMS` array

---

## 📖 Full Documentation

See `src/tests/portability/README_TC_PORT_04.md` for:

- Detailed architecture
- Configuration options
- CI/CD integration
- Advanced troubleshooting
- ISO 25010 compliance details

---

## 🎓 Key Concepts

### Why Docker for Portability Testing?

1. **True Multi-Platform:** Runs actual containers on AMD64 and ARM64
2. **Realistic:** Tests production-like environment, not just code
3. **Automated:** Full workflow from build to test to cleanup
4. **Consistent:** Same environment every time, anywhere

### What Makes This Different from Unit Tests?

| Aspect          | Unit Tests  | Portability Tests              |
| --------------- | ----------- | ------------------------------ |
| **Scope**       | Code logic  | Full application + environment |
| **Environment** | Mock/Stub   | Real containers                |
| **Platform**    | Host OS     | Multiple Docker platforms      |
| **Focus**       | Correctness | Cross-platform compatibility   |

---

## 🚀 Next Steps

1. ✅ Run verification test: `npm test -- portability4.test.js`
2. ✅ Run portability test: `./run-portability-test.sh`
3. ✅ Review test output
4. ✅ Integrate into CI/CD (see full README)

---

**Last Updated:** December 2025  
**Compliance:** ISO/IEC 25010 - Portability  
**Status:** ✅ Production Ready
