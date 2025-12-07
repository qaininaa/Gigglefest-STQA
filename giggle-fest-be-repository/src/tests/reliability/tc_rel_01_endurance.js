/**
 * TC_REL_01: Reliability - Endurance Test for Login Endpoint
 *
 * Test Scenario: Endurance test for the login endpoint
 * Test Steps:
 *   1. Run a 20-minute load test
 *   2. Use 10–20 virtual users accessing /auth/login
 *   3. Monitor stability and server error rates
 *
 * Expected Result: The server remains stable for the entire duration with no 500 errors.
 *
 * Tools: k6
 * ISO 25010: Reliability Quality Characteristic
 *
 * Usage:
 *   k6 run src/tests/reliability/tc_rel_01_endurance.js
 *
 * Prerequisites:
 *   - Server must be running on localhost:8080
 *   - Valid test user must exist in database
 *   - k6 must be installed (https://k6.io/docs/getting-started/installation/)
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Custom metrics
const serverErrors = new Counter("server_errors"); // Count of 5xx errors
const clientErrors = new Counter("client_errors"); // Count of 4xx errors
const successRate = new Rate("success_rate"); // Rate of successful requests
const loginDuration = new Trend("login_duration"); // Response time trend

// Test configuration
export const options = {
  // Endurance test: 20 minutes with 10-20 virtual users
  stages: [
    { duration: "2m", target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: "16m", target: 15 }, // Stay at 15 users for 16 minutes (main endurance phase)
    { duration: "2m", target: 20 }, // Increase to 20 users for 2 minutes
    { duration: "1m", target: 0 }, // Ramp down to 0 users
  ],

  // Thresholds: Define pass/fail criteria
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests must complete within 2s
    http_req_failed: ["rate<0.05"], // Less than 5% failed requests
    server_errors: ["count==0"], // Zero 5xx errors
    success_rate: ["rate>0.95"], // Success rate must be above 95%
  },
};

// Base URL
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// Test data - valid credentials
// Note: Update these credentials to match a real user in your test database
const testUser = {
  email: __ENV.TEST_EMAIL || "test.endurance@example.com",
  password: __ENV.TEST_PASSWORD || "TestPassword123!",
};

export function setup() {
  console.log("=== TC_REL_01: Endurance Test Starting ===");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Duration: 20 minutes`);
  console.log(`Virtual Users: 10-20`);
  console.log(`Test User: ${testUser.email}`);
  console.log("==========================================");

  // Verify server is running
  const healthCheck = http.get(`${BASE_URL}/api/v1/events`);
  if (healthCheck.status === 0) {
    throw new Error("Server is not reachable. Please start the server first.");
  }

  return { startTime: new Date().toISOString() };
}

export default function (data) {
  const url = `${BASE_URL}/api/v1/auth/login`;

  const payload = JSON.stringify({
    email: testUser.email,
    password: testUser.password,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "LoginEndpoint" },
  };

  // Send login request
  const response = http.post(url, payload, params);

  // Record custom metrics
  loginDuration.add(response.timings.duration);

  // Check response
  const checkResult = check(response, {
    "status is 200 or 201": (r) => r.status === 200 || r.status === 201,
    "status is not 5xx": (r) => r.status < 500,
    "response has body": (r) => r.body.length > 0,
    "response time < 3s": (r) => r.timings.duration < 3000,
    "contains token or user data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data?.token !== undefined || body.data?.user !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  // Count errors
  if (response.status >= 500) {
    serverErrors.add(1);
    console.error(
      `[ERROR] 5xx error detected: ${response.status} - ${response.body}`
    );
  } else if (response.status >= 400) {
    clientErrors.add(1);
  }

  // Track success rate
  successRate.add(response.status >= 200 && response.status < 300);

  // Think time: simulate realistic user behavior
  // Users wait 1-3 seconds between requests
  sleep(1 + Math.random() * 2);
}

export function teardown(data) {
  console.log("\n=== TC_REL_01: Endurance Test Completed ===");
  console.log(`Started at: ${data.startTime}`);
  console.log(`Ended at: ${new Date().toISOString()}`);
  console.log("==========================================");
  console.log("\n📊 Check the summary above for detailed metrics:");
  console.log("  - http_req_duration: Response time distribution");
  console.log("  - http_req_failed: Request failure rate");
  console.log("  - server_errors: Count of 5xx errors (must be 0)");
  console.log("  - success_rate: Percentage of successful requests");
  console.log("\n✅ Test PASSES if:");
  console.log("  - server_errors count = 0");
  console.log("  - success_rate > 95%");
  console.log("  - http_req_duration p(95) < 2000ms");
  console.log("  - No application crashes or hangs");
}
