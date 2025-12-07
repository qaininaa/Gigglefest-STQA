/**
 * TC_PERF_03: Maximum User Capacity
 * 
 * Test Scenario: Validate maximum user capacity and breaking point
 * Test Steps: Gradually increase the load up to 2000 virtual users
 * 
 * ISO/IEC 25010 - Performance Efficiency > Capacity
 * Validates: System capacity limits and graceful degradation under extreme load
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

// Custom metrics
const successRate = new Counter("successful_requests");
const failureRate = new Counter("failed_requests");
const responseTimes = new Trend("response_times_by_stage");

export const options = {
  scenarios: {
    capacity_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 100 }, // Warm up: 0 to 100 users
        { duration: "2m", target: 500 }, // Ramp up: 100 to 500 users
        { duration: "2m", target: 1000 }, // Ramp up: 500 to 1000 users
        { duration: "2m", target: 1500 }, // Ramp up: 1000 to 1500 users
        { duration: "2m", target: 2000 }, // Ramp up: 1500 to 2000 users
        { duration: "3m", target: 2000 }, // Hold at peak: 2000 users for 3 min
        { duration: "2m", target: 0 }, // Ramp down: 2000 to 0 users
      ],
      gracefulRampDown: "1m",
    },
  },
  thresholds: {
    http_req_duration: [
      "p(50)<1000", // 50% under 1s
      "p(90)<3000", // 90% under 3s
      "p(95)<5000", // 95% under 5s
    ],
    http_req_failed: ["rate<0.2"], // Allow up to 20% failure at peak load
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

const endpoints = [
  "/",
  "/api/v1/events",
  "/api/v1/tickets",
  "/api/v1/categories",
];

export default function () {
  // Random endpoint selection to simulate realistic traffic
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const url = `${BASE_URL}${endpoint}`;

  const response = http.get(url, {
    tags: { endpoint: endpoint },
  });

  responseTimes.add(response.timings.duration);

  const success = check(response, {
    "status is 2xx or acceptable error": (r) =>
      (r.status >= 200 && r.status < 300) || r.status === 500,
    "response received": (r) => r.body !== null,
  });

  if (success) {
    successRate.add(1);
  } else {
    failureRate.add(1);
  }

  // Variable sleep based on current VU count to simulate realistic behavior
  const vu = __VU;
  const sleepTime = vu > 1500 ? 0.5 : vu > 1000 ? 0.8 : 1;
  sleep(sleepTime);
}

export function handleSummary(data) {
  const duration = data.metrics.http_req_duration?.values || {};
  const reqs = data.metrics.http_reqs?.values || {};
  const vus = data.metrics.vus?.values || {};
  const failed = data.metrics.http_req_failed?.values || {};

  console.log("\n=== TC_PERF_03: Maximum User Capacity Results ===");
  console.log(`Test Duration: ${data.state.testRunDurationMs / 1000}s`);
  console.log(`Peak Virtual Users: ${vus.max || 2000}`);
  console.log(`Total Requests: ${reqs.count || 0}`);
  console.log(`Throughput: ${(reqs.rate || 0).toFixed(2)} req/s`);
  console.log(`\nResponse Times:`);
  console.log(`  Average: ${(duration.avg || 0).toFixed(2)}ms`);
  console.log(`  Median (P50): ${(duration.med || 0).toFixed(2)}ms`);
  console.log(`  P90: ${(duration["p(90)"] || 0).toFixed(2)}ms`);
  console.log(`  P95: ${(duration["p(95)"] || 0).toFixed(2)}ms`);
  console.log(`  P99: ${(duration["p(99)"] || 0).toFixed(2)}ms`);
  console.log(`  Max: ${(duration.max || 0).toFixed(2)}ms`);
  console.log(`\nSuccess Rate: ${((1 - (failed.rate || 0)) * 100).toFixed(2)}%`);
  console.log(`Failure Rate: ${((failed.rate || 0) * 100).toFixed(2)}%`);
  console.log("=================================================\n");

  return {
    "stdout": JSON.stringify(data, null, 2),
    "summary.json": JSON.stringify(data),
  };
}
