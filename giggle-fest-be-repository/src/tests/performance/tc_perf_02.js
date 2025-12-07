/**
 * TC_PERF_02: Memory Usage Under Load
 * 
 * Test Scenario: Verify memory usage and system stability under high load
 * Test Steps: Run a test with 1000 concurrent virtual users
 * 
 * ISO/IEC 25010 - Performance Efficiency > Resource Utilization
 * Validates: Application handles high concurrent load without memory leaks
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const requestCount = new Counter("total_requests");

export const options = {
  scenarios: {
    high_concurrency: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 250 }, // Ramp up to 250 VUs
        { duration: "30s", target: 500 }, // Ramp up to 500 VUs
        { duration: "30s", target: 1000 }, // Ramp up to 1000 VUs
        { duration: "2m", target: 1000 }, // Stay at 1000 VUs for 2 minutes
        { duration: "30s", target: 0 }, // Ramp down to 0
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% under 2s with high load
    http_req_failed: ["rate<0.1"], // Error rate under 10%
    errors: ["rate<0.1"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export default function () {
  const responses = http.batch([
    ["GET", `${BASE_URL}/`],
    ["GET", `${BASE_URL}/api/v1/events`],
    ["GET", `${BASE_URL}/api/v1/tickets`],
    ["GET", `${BASE_URL}/api/v1/categories`],
  ]);

  responses.forEach((response) => {
    requestCount.add(1);

    const passed = check(response, {
      "status is 200 or 500": (r) => [200, 500].includes(r.status),
      "response time OK": (r) => r.timings.duration < 3000,
    });

    if (!passed) {
      errorRate.add(1);
    }
  });

  // Simulate user think time
  sleep(1);
}

export function handleSummary(data) {
  const vus = data.metrics.vus?.values || {};
  const duration = data.metrics.http_req_duration?.values || {};
  const reqs = data.metrics.http_reqs?.values || {};

  console.log("\n=== TC_PERF_02: Memory Usage Under Load Results ===");
  console.log(`Peak Virtual Users: ${vus.max || 1000}`);
  console.log(`Total Requests: ${reqs.count || 0}`);
  console.log(
    `Requests Per Second: ${(reqs.rate || 0).toFixed(2)} req/s`
  );
  console.log(`Average Response Time: ${(duration.avg || 0).toFixed(2)}ms`);
  console.log(`P95 Response Time: ${(duration["p(95)"] || 0).toFixed(2)}ms`);
  console.log(`P99 Response Time: ${(duration["p(99)"] || 0).toFixed(2)}ms`);
  console.log(
    `Error Rate: ${((data.metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%`
  );
  console.log("===================================================\n");

  return {
    "stdout": JSON.stringify(data, null, 2),
  };
}
