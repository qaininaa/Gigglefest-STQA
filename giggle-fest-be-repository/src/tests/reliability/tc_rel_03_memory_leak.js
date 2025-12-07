/**
 * TC_REL_03: Reliability - Memory Leak Detection Under Load
 *
 * Test Scenario: Verify memory leak detection under load
 * Test Steps:
 *   1. Run the application under constant load
 *   2. Monitor memory usage over time
 *   3. Check for continuous memory growth
 *   4. Verify that memory stabilizes after the initial warm-up
 *
 * Expected Result:
 *   Memory usage stabilizes and does not continuously increase, indicating no memory leaks.
 *
 * Tools: k6 + clinic.js
 * ISO 25010: Reliability Quality Characteristic - Resource Utilization
 *
 * Usage:
 *   # Step 1: Start the application with clinic.js monitoring
 *   npm run test:memory
 *
 *   # Step 2: In another terminal, run this k6 script
 *   k6 run src/tests/reliability/tc_rel_03_memory_leak.js
 *
 *   # Step 3: After k6 completes, stop the server (Ctrl+C)
 *   # Step 4: clinic.js will generate a report showing memory usage
 *
 * Prerequisites:
 *   - clinic.js installed: npm install --save-dev clinic
 *   - k6 installed
 *   - Add to package.json scripts: "test:memory": "clinic doctor -- node src/app.js"
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend, Gauge } from "k6/metrics";

// Custom metrics
const requestErrors = new Counter("request_errors");
const responseTime = new Trend("response_time_ms");
const activeConnections = new Gauge("active_connections");

// Test configuration
export const options = {
  // Constant load for 10 minutes to observe memory behavior
  stages: [
    { duration: "1m", target: 20 }, // Ramp up to 20 users
    { duration: "8m", target: 20 }, // Maintain 20 users for 8 minutes (observation period)
    { duration: "1m", target: 0 }, // Ramp down
  ],

  // Thresholds
  thresholds: {
    http_req_duration: ["p(95)<3000"], // 95% of requests under 3s
    http_req_failed: ["rate<0.1"], // Less than 10% failures
    request_errors: ["count<100"], // Less than 100 errors total
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// Test scenarios to exercise different parts of the application
const scenarios = [
  {
    name: "Get Events",
    method: "GET",
    url: "/api/v1/events",
    weight: 40, // 40% of requests
  },
  {
    name: "Get Categories",
    method: "GET",
    url: "/api/v1/categories",
    weight: 20, // 20% of requests
  },
  {
    name: "Search Events",
    method: "GET",
    url: "/api/v1/events?search=test",
    weight: 20, // 20% of requests
  },
  {
    name: "Get Single Event",
    method: "GET",
    url: "/api/v1/events/1",
    weight: 20, // 20% of requests
  },
];

// Helper function to select scenario based on weight
function selectScenario() {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const scenario of scenarios) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      return scenario;
    }
  }

  return scenarios[0];
}

export function setup() {
  console.log("\n=== TC_REL_03: Memory Leak Detection Test ===");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Duration: 10 minutes`);
  console.log(`Constant Load: 20 virtual users`);
  console.log("============================================");
  console.log("\n⚠️  IMPORTANT:");
  console.log(
    "  1. Make sure the server is running with clinic.js monitoring:"
  );
  console.log("     npm run test:memory");
  console.log("  2. Let this k6 test complete");
  console.log("  3. Stop the server (Ctrl+C)");
  console.log("  4. Check the clinic.js report for memory analysis");
  console.log("============================================\n");

  // Verify server is running
  const healthCheck = http.get(`${BASE_URL}/api/v1/events`);
  if (healthCheck.status === 0) {
    throw new Error("Server is not reachable. Start with: npm run test:memory");
  }

  return { startTime: Date.now() };
}

export default function (data) {
  // Select a random scenario based on weights
  const scenario = selectScenario();

  const url = `${BASE_URL}${scenario.url}`;
  const params = {
    tags: { name: scenario.name },
    headers: {
      Connection: "keep-alive", // Reuse connections
    },
  };

  // Execute request
  const startTime = Date.now();
  const response = http.get(url, params);
  const duration = Date.now() - startTime;

  // Record metrics
  responseTime.add(duration);

  // Check response
  const success = check(response, {
    "status is 2xx or 404": (r) =>
      (r.status >= 200 && r.status < 300) || r.status === 404,
    "response has body": (r) => r.body !== null && r.body.length > 0,
    "response time acceptable": (r) => r.timings.duration < 5000,
  });

  if (!success) {
    requestErrors.add(1);

    if (response.status >= 500) {
      console.error(
        `[ERROR] Server error: ${response.status} on ${scenario.name}`
      );
    }
  }

  // Small random delay to simulate realistic user behavior
  sleep(0.5 + Math.random() * 1.5); // 0.5-2 seconds
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000 / 60;

  console.log("\n=== TC_REL_03: Load Test Completed ===");
  console.log(`Duration: ${duration.toFixed(2)} minutes`);
  console.log("=====================================");

  console.log("\n📊 Next Steps:");
  console.log("  1. Stop the server now (Ctrl+C in the server terminal)");
  console.log("  2. clinic.js will generate a report automatically");
  console.log("  3. Open the .clinic/*.html file in a browser");
  console.log("\n🔍 What to look for in the clinic.js report:");
  console.log("  ✓ Memory should stabilize after initial warm-up");
  console.log(
    "  ✓ No continuous upward trend in memory usage (indicates leak)"
  );
  console.log("  ✓ Memory should release after periods of low activity");
  console.log("  ✓ Event loop delay should remain low and stable");
  console.log("\n⚠️  Red flags (potential memory leaks):");
  console.log("  ✗ Continuous linear growth in heap usage");
  console.log("  ✗ Memory never decreases even during idle periods");
  console.log("  ✗ Event loop delay increasing over time");
  console.log("=====================================\n");
}
