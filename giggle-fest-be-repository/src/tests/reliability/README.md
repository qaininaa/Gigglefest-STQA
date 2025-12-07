# Reliability Test Suite - GiggleFest Backend

Automated reliability and fault tolerance test scripts based on **ISO/IEC 25010 Quality Characteristics**.

## Overview

This test suite validates the reliability and fault tolerance of the GiggleFest backend application through four comprehensive test cases:

| Test Case | Type            | Tool             | Duration | Focus                                  |
| --------- | --------------- | ---------------- | -------- | -------------------------------------- |
| TC_REL_01 | Reliability     | k6               | 20 min   | Endurance testing under sustained load |
| TC_REL_02 | Reliability     | Jest + Supertest | ~2 min   | Database failure handling and recovery |
| TC_REL_03 | Reliability     | k6 + clinic.js   | 10 min   | Memory leak detection under load       |
| TC_REL_04 | Fault Tolerance | Jest + Supertest | ~2 min   | Request timeout handling               |

## Prerequisites

### Required Tools

```bash
# Node.js dependencies (already installed)
npm install

# k6 installation
# Windows (using Chocolatey):
choco install k6

# macOS (using Homebrew):
brew install k6

# Linux:
# Download from https://k6.io/docs/getting-started/installation/

# Verify k6 installation
k6 version
```

### Environment Setup

1. **Database**: Ensure PostgreSQL is running and configured
2. **Test User**: Create a test user for authentication tests
3. **Environment Variables**: Configure in `.env` file

```env
# For k6 tests (optional - will use defaults)
BASE_URL=http://localhost:8080
TEST_EMAIL=test.endurance@example.com
TEST_PASSWORD=TestPassword123!
```

## Test Cases

### TC_REL_01: Endurance Test for Login Endpoint ⏱️

**Objective**: Verify server stability under sustained load for 20 minutes

**Test Configuration**:

- Virtual Users: 10-20 (gradually increasing)
- Duration: 20 minutes
- Target Endpoint: `/api/v1/auth/login`
- Success Criteria:
  - Zero 5xx server errors
  - 95% success rate
  - 95th percentile response time < 2s

**Running the Test**:

```bash
# Step 1: Start the server
npm run dev

# Step 2: In another terminal, run the k6 test
k6 run src/tests/reliability/tc_rel_01_endurance.js

# Optional: Use custom environment variables
k6 run -e BASE_URL=http://localhost:8080 -e TEST_EMAIL=your@email.com src/tests/reliability/tc_rel_01_endurance.js
```

**Expected Output**:

```
✓ status is 200 or 201
✓ status is not 5xx
✓ response time < 3s
✓ contains token or user data

server_errors................: 0      (MUST be 0)
success_rate.................: 95.50% (MUST be > 95%)
http_req_duration............: avg=450ms p(95)=1200ms
```

**What to Look For**:

- ✅ All thresholds pass (green checkmarks)
- ✅ `server_errors` count = 0
- ✅ `success_rate` > 95%
- ✅ Server remains responsive throughout 20 minutes
- ❌ Any 5xx errors indicate reliability issues

---

### TC_REL_02: Database Connection Failure Handling 🗄️

**Objective**: Verify graceful handling of database disconnection and recovery

**Test Configuration**:

- Simulates database disconnection
- Tests multiple endpoints during outage
- Verifies recovery when database reconnects
- Success Criteria:
  - Returns 503/500 errors (not crashes)
  - Doesn't expose sensitive database info
  - Successfully recovers after reconnection

**Running the Test**:

```bash
# Make sure server is running
npm run dev

# In another terminal, run the test
npm test -- tc_rel_02
```

**Test Steps**:

1. Creates test user
2. Disconnects Prisma database client
3. Sends requests to multiple endpoints
4. Verifies error responses are graceful
5. Reconnects database
6. Verifies normal operation resumes

**Expected Output**:

```
=== TC_REL_02: Database Connection Failure Test ===
✓ Test user created: test.dbfailure.xxx@example.com
📡 Database disconnected - simulating connection failure
  ✓ Get Events: 500 (database unavailable)
  ✓ Get Profile: 500 (database unavailable)
  ✓ Get Categories: 500 (database unavailable)
  ✓ All requests failed gracefully without application crash
  ✓ Error response does not expose sensitive database details
🔄 Reconnecting to database...
  ✓ Database reconnected
  ✓ Application recovered: GET /api/v1/events returned 200
  ✓ Authentication successful after database recovery
  ✓ Database write operations working after recovery

Tests: 9 passed, 9 total
```

**What to Look For**:

- ✅ Application returns 500/503 (not crashes)
- ✅ Error messages don't expose connection strings
- ✅ All operations resume after reconnection
- ❌ Application crash = reliability failure

---

### TC_REL_03: Memory Leak Detection Under Load 💾

**Objective**: Detect memory leaks by monitoring memory usage under constant load

**Test Configuration**:

- Load: 20 virtual users (constant)
- Duration: 10 minutes
- Tools: k6 (load generation) + clinic.js (memory profiling)
- Success Criteria:
  - Memory stabilizes after warm-up
  - No continuous memory growth
  - Event loop delay remains stable

**Running the Test**:

```bash
# Step 1: Start server with clinic.js monitoring
npm run test:memory

# Step 2: In another terminal, run k6 load test
k6 run src/tests/reliability/tc_rel_03_memory_leak.js

# Step 3: After k6 completes (~10 minutes), stop the server
# Press Ctrl+C in the server terminal

# Step 4: clinic.js will generate an HTML report
# Open the .clinic/*.html file in a browser
```

**Expected Output**:

k6 will show:

```
✓ http_req_duration: p(95)<3000
✓ http_req_failed: rate<0.1

📊 Next Steps:
  1. Stop the server now (Ctrl+C)
  2. clinic.js will generate a report
  3. Open .clinic/*.html in browser
```

clinic.js report will show:

- **Heap Usage Graph**: Should stabilize, not continuously increase
- **Event Loop Delay**: Should remain low and stable
- **GC (Garbage Collection)**: Regular GC cycles indicate healthy memory management

**What to Look For**:

✅ **Healthy (No Memory Leak)**:

```
Memory (MB)
    │     ╱─────────────  (stabilized)
    │   ╱
    │ ╱  (warm-up)
    └──────────────────────> Time
```

❌ **Memory Leak Detected**:

```
Memory (MB)
    │                  ╱
    │              ╱
    │          ╱
    │      ╱  (continuous growth)
    └──────────────────────> Time
```

**Interpreting the Report**:

- ✅ Memory plateaus after initial ramp-up
- ✅ GC cycles bring memory down periodically
- ✅ Event loop delay < 50ms consistently
- ❌ Linear upward trend = memory leak
- ❌ Event loop delay increasing = performance degradation

---

### TC_REL_04: Request Timeout Handling ⏰

**Objective**: Verify proper handling of request timeouts without system hang

**Test Configuration**:

- Timeout: 5 seconds
- Creates test endpoints with intentional delays
- Tests timeout behavior and system recovery
- Success Criteria:
  - Requests timeout at 5 seconds
  - Proper error structure returned
  - System remains responsive after timeout

**Running the Test**:

```bash
# Make sure server is running
npm run dev

# Run the timeout test
npm test -- tc_rel_04
```

**Test Steps**:

1. Creates test server with delayed endpoints (3s, 6s, 10s)
2. Tests endpoint within timeout (3s delay)
3. Tests endpoint exceeding timeout (6s delay)
4. Verifies timeout error structure
5. Confirms system doesn't hang after timeout
6. Tests multiple concurrent timeouts

**Expected Output**:

```
=== TC_REL_04: Request Timeout Handling Test ===
✓ Test server started on port 8081
  ✓ 3-second delay endpoint responded in 3045ms
  ✓ Timeout configuration verified (1s timeout works)
  ✓ Request timed out after 5002ms (expected ~5000ms)
  ✓ POST request timed out after 5001ms
  ✓ 3 parallel requests all timed out in 5123ms
  ✓ Timeout error has proper structure:
    - Code: ECONNABORTED
    - Timeout: 5000ms
    - Message: timeout of 5000ms exceeded
  ✓ System continues processing requests after timeout
  ✓ Server remains responsive after 5 timeout events
  ✓ System healthy after 10 timeout cycles (no resource leak)

Tests: 12 passed, 12 total
```

**What to Look For**:

- ✅ Timeouts occur at expected time (~5s)
- ✅ Error code is `ECONNABORTED`
- ✅ System processes new requests after timeout
- ✅ No resource exhaustion after multiple timeouts
- ❌ System hangs = fault tolerance failure

---

## Running All Tests

### Sequential Execution

```bash
# 1. Run Jest-based reliability tests (TC_REL_02, TC_REL_04)
npm test -- --testPathPattern=reliability

# 2. Run k6 endurance test (TC_REL_01)
k6 run src/tests/reliability/tc_rel_01_endurance.js

# 3. Run memory leak test (TC_REL_03)
npm run test:memory  # Terminal 1
k6 run src/tests/reliability/tc_rel_03_memory_leak.js  # Terminal 2
# Ctrl+C in Terminal 1 after k6 completes
```

### Quick Test (Reduced Duration)

For faster testing during development:

```bash
# TC_REL_01 - Reduced to 5 minutes
k6 run --duration 5m src/tests/reliability/tc_rel_01_endurance.js

# TC_REL_03 - Reduced to 3 minutes
# Edit tc_rel_03_memory_leak.js: Change duration "8m" to "2m"
npm run test:memory
k6 run src/tests/reliability/tc_rel_03_memory_leak.js
```

## Success Criteria Summary

### TC_REL_01: Endurance Test

- ✅ Zero 5xx errors during 20 minutes
- ✅ Success rate > 95%
- ✅ p(95) response time < 2 seconds
- ✅ No application crashes

### TC_REL_02: Database Failure Handling

- ✅ Returns 503/500 errors (not crashes)
- ✅ No sensitive data in error messages
- ✅ Successfully recovers after reconnection
- ✅ All operations resume normally

### TC_REL_03: Memory Leak Detection

- ✅ Memory usage stabilizes
- ✅ No continuous linear growth
- ✅ GC cycles occur regularly
- ✅ Event loop delay remains low

### TC_REL_04: Timeout Handling

- ✅ Timeouts occur at configured time
- ✅ Proper error structure (ECONNABORTED)
- ✅ System remains responsive
- ✅ No resource leaks from timeouts

## Troubleshooting

### k6 Tests Failing

**Issue**: `Server is not reachable`

```bash
# Solution: Make sure server is running
npm run dev
```

**Issue**: All requests failing (100%)

```bash
# Check server logs for errors
# Verify database is running
# Check BASE_URL environment variable
```

### Jest Tests Timing Out

**Issue**: Tests exceed Jest timeout

```bash
# Increase timeout in test file (already set to 30s-60s)
# Or run with higher timeout:
npm test -- --testTimeout=60000 tc_rel_02
```

### Memory Test Issues

**Issue**: clinic.js not generating report

```bash
# Make sure clinic is installed
npm install --save-dev clinic

# Check package.json has test:memory script
npm run test:memory
```

**Issue**: Can't open .clinic/\*.html

```bash
# Navigate to project root
cd c:/Users/karin/Documents/belajar-fs/gigglefest/giggle-fest-be-repository

# Find the report
ls -la .clinic/

# Open in browser
start .clinic/*.clinic-doctor.html  # Windows
open .clinic/*.clinic-doctor.html   # macOS
```

### Database Connection Test Fails

**Issue**: Database doesn't disconnect/reconnect properly

```bash
# Restart PostgreSQL service
# Check Prisma connection in .env
# Ensure test has proper permissions to disconnect
```

## Best Practices

### Before Running Tests

1. **Clean State**: Start with fresh database migration

   ```bash
   npx prisma migrate reset
   npx prisma migrate deploy
   ```

2. **Create Test Users**: Ensure test accounts exist

   ```bash
   # Register test user via API or directly in database
   ```

3. **Check Resources**: Verify sufficient system resources
   - Available memory: 2GB+
   - Available disk space: 1GB+ (for logs/reports)
   - CPU: Not under heavy load from other processes

### During Tests

1. **Monitor Server**: Keep eye on server terminal for errors
2. **Check System Resources**: Use task manager / htop
3. **Avoid Interference**: Don't run other heavy processes

### After Tests

1. **Review Reports**: Check k6 and clinic.js outputs
2. **Analyze Failures**: Investigate any failed assertions
3. **Clean Up**: Remove test data if needed
4. **Document Issues**: Note any performance concerns

## ISO 25010 Compliance

These tests validate the following ISO 25010 quality characteristics:

- **Reliability**: Ability to perform under normal conditions

  - TC_REL_01: Maturity (endurance)
  - TC_REL_02: Availability (recovery)
  - TC_REL_03: Fault tolerance (resource management)

- **Performance Efficiency**: Resource utilization

  - TC_REL_03: Memory behavior

- **Maintainability**: System robustness
  - TC_REL_04: Recoverability (timeout handling)

## References

- [ISO/IEC 25010](https://iso25000.com/index.php/en/iso-25000-standards/iso-25010) - Quality Model
- [k6 Documentation](https://k6.io/docs/)
- [clinic.js Documentation](https://clinicjs.org/documentation/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)

## Support

For issues or questions about these tests:

1. Check test output and error messages
2. Review this README troubleshooting section
3. Check server logs for application errors
4. Verify all prerequisites are installed correctly
