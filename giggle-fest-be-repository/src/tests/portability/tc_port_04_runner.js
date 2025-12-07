#!/usr/bin/env node

/**
 * TC_PORT_04: Cross-Platform Portability Test Runner
 *
 * ISO/IEC 25010 - Portability > Installability & Adaptability
 *
 * This script tests the application running in Docker containers
 * across different platforms to ensure consistent behavior.
 */

import http from "http";

const PLATFORMS = [
  {
    name: "Linux AMD64 (x86_64)",
    host: "gigglefest-linux-amd64",
    port: 8080,
    architecture: "x86_64",
    os: "Linux",
  },
  {
    name: "Linux ARM64 (Apple Silicon/Graviton)",
    host: "gigglefest-linux-arm64",
    port: 8080,
    architecture: "arm64",
    os: "Linux",
  },
];

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Make HTTP request to container
 */
function makeRequest(host, port, path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test helper functions
 */
function logTest(platform, testName, passed, message = "") {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`  ${COLORS.green}✓${COLORS.reset} ${testName}`);
  } else {
    failedTests++;
    console.log(`  ${COLORS.red}✗${COLORS.reset} ${testName}`);
    if (message) {
      console.log(`    ${COLORS.red}Error: ${message}${COLORS.reset}`);
    }
  }
}

function logSection(title) {
  console.log(`\n${COLORS.cyan}${title}${COLORS.reset}`);
  console.log("=".repeat(title.length));
}

/**
 * Test Suite: Basic Connectivity
 */
async function testBasicConnectivity(platform) {
  try {
    const response = await makeRequest(platform.host, platform.port, "/");
    const passed = response.statusCode === 200;
    logTest(
      platform,
      "Should respond to health check endpoint",
      passed,
      passed ? "" : `Expected 200, got ${response.statusCode}`
    );
    return response;
  } catch (error) {
    logTest(
      platform,
      "Should respond to health check endpoint",
      false,
      error.message
    );
    throw error;
  }
}

/**
 * Test Suite: API Endpoints
 */
async function testAPIEndpoints(platform) {
  const tests = [
    { path: "/api/v1/events", name: "GET /api/v1/events" },
    { path: "/api/v1/categories", name: "GET /api/v1/categories" },
    { path: "/api/v1/tickets", name: "GET /api/v1/tickets" },
  ];

  for (const test of tests) {
    try {
      const response = await makeRequest(
        platform.host,
        platform.port,
        test.path
      );
      const passed =
        response.statusCode === 200 &&
        response.headers["content-type"]?.includes("application/json");
      logTest(
        platform,
        `Should handle ${test.name}`,
        passed,
        passed
          ? ""
          : `Status: ${response.statusCode}, Content-Type: ${response.headers["content-type"]}`
      );
    } catch (error) {
      logTest(platform, `Should handle ${test.name}`, false, error.message);
    }
  }
}

/**
 * Test Suite: Response Consistency
 */
async function testResponseConsistency(platform, baselineResponse) {
  try {
    const response = await makeRequest(platform.host, platform.port, "/");

    // Check version consistency
    const versionMatch =
      response.body.version === baselineResponse.body.version;
    logTest(
      platform,
      "Should have consistent API version",
      versionMatch,
      versionMatch
        ? ""
        : `Expected ${baselineResponse.body.version}, got ${response.body.version}`
    );

    // Check response structure
    const hasMessage = "message" in response.body;
    logTest(platform, "Should have consistent response structure", hasMessage);

    // Check content type
    const contentType =
      response.headers["content-type"]?.includes("application/json");
    logTest(platform, "Should return JSON content type", contentType);
  } catch (error) {
    logTest(platform, "Should have consistent responses", false, error.message);
  }
}

/**
 * Test Suite: Error Handling
 */
async function testErrorHandling(platform) {
  try {
    const response = await makeRequest(
      platform.host,
      platform.port,
      "/api/v1/nonexistent"
    );
    const passed = response.statusCode === 404 && "message" in response.body;
    logTest(platform, "Should handle 404 errors gracefully", passed);
  } catch (error) {
    logTest(
      platform,
      "Should handle 404 errors gracefully",
      false,
      error.message
    );
  }

  try {
    const response = await makeRequest(
      platform.host,
      platform.port,
      "/api/v1/events?page=abc"
    );
    // Should either handle gracefully (400) or return data (200)
    const passed = [200, 400].includes(response.statusCode);
    logTest(platform, "Should handle invalid query parameters", passed);
  } catch (error) {
    logTest(
      platform,
      "Should handle invalid query parameters",
      false,
      error.message
    );
  }
}

/**
 * Test Suite: Performance Baseline
 */
async function testPerformance(platform) {
  const iterations = 10;
  const timings = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await makeRequest(platform.host, platform.port, "/api/v1/events");
      const duration = Date.now() - start;
      timings.push(duration);
    } catch (error) {
      // Skip failed requests
    }
  }

  if (timings.length > 0) {
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
    const passed = avgTime < 1000; // Should respond within 1 second on average
    logTest(
      platform,
      `Should respond within 1s (avg: ${avgTime.toFixed(0)}ms)`,
      passed
    );
  } else {
    logTest(
      platform,
      "Should measure response time",
      false,
      "All requests failed"
    );
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(
    `\n${COLORS.blue}╔════════════════════════════════════════════════════════════╗${COLORS.reset}`
  );
  console.log(
    `${COLORS.blue}║  TC_PORT_04: Cross-Platform Portability Test (Docker)     ║${COLORS.reset}`
  );
  console.log(
    `${COLORS.blue}║  ISO/IEC 25010 - Portability > Installability              ║${COLORS.reset}`
  );
  console.log(
    `${COLORS.blue}╚════════════════════════════════════════════════════════════╝${COLORS.reset}`
  );

  let baselineResponse = null;

  for (const platform of PLATFORMS) {
    logSection(`Testing: ${platform.name} (${platform.architecture})`);
    console.log(`Host: ${platform.host}:${platform.port}\n`);

    try {
      // 1. Basic Connectivity
      const healthResponse = await testBasicConnectivity(platform);

      if (!baselineResponse) {
        baselineResponse = healthResponse;
      }

      // 2. API Endpoints
      await testAPIEndpoints(platform);

      // 3. Response Consistency
      await testResponseConsistency(platform, baselineResponse);

      // 4. Error Handling
      await testErrorHandling(platform);

      // 5. Performance
      await testPerformance(platform);
    } catch (error) {
      console.log(
        `${COLORS.red}\n⚠️  Platform ${platform.name} is not responding${COLORS.reset}`
      );
      console.log(`${COLORS.red}   Error: ${error.message}${COLORS.reset}`);
    }
  }

  // Summary
  logSection("Test Summary");
  console.log(`Total Tests:  ${totalTests}`);
  console.log(`${COLORS.green}Passed:       ${passedTests}${COLORS.reset}`);
  console.log(`${COLORS.red}Failed:       ${failedTests}${COLORS.reset}`);

  const successRate =
    totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
  console.log(`Success Rate: ${successRate}%\n`);

  if (failedTests === 0) {
    console.log(
      `${COLORS.green}✓ All portability tests passed!${COLORS.reset}`
    );
    console.log(
      `${COLORS.green}✓ Application is portable across tested platforms${COLORS.reset}\n`
    );
    process.exit(0);
  } else {
    console.log(`${COLORS.red}✗ Some tests failed${COLORS.reset}`);
    console.log(
      `${COLORS.yellow}⚠️  Please review platform-specific issues${COLORS.reset}\n`
    );
    process.exit(1);
  }
}

// Execute tests
runTests().catch((error) => {
  console.error(
    `${COLORS.red}\n✗ Fatal error: ${error.message}${COLORS.reset}\n`
  );
  process.exit(1);
});
