/**
 * TC_PERF_01: Response Time Verification
 *
 * Test Scenario: Verify response time under sustained load
 * Test Steps: Run 100 requests per second and measure p95 and p99 latency
 *
 * ISO/IEC 25010 - Performance Efficiency > Time Behaviour
 * Validates: Response time meets acceptable thresholds under load
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

// Custom metrics
const responseTime = new Trend("custom_response_time");
const successfulRequests = new Counter("successful_requests");
const failedRequests = new Counter("failed_requests");

export const options = {
  // Target 100 requests per second
  scenarios: {
    constant_request_rate: {
      executor: "constant-arrival-rate",
      rate: 100, // 100 requests per second
      timeUnit: "1s",
      duration: "1m", // Run for 1 minute
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
  thresholds: {
    http_req_duration: [
      "p(95)<500", // 95% of requests should be below 500ms
      "p(99)<1000", // 99% of requests should be below 1000ms
    ],
    http_req_failed: ["rate<0.05"], // Error rate should be below 5%
    custom_response_time: ["p(95)<500", "p(99)<1000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export default function () {
  // Test health endpoint
  const healthResponse = http.get(`${BASE_URL}/`);

  check(healthResponse, {
    "health status is 200": (r) => r.status === 200,
    "health has valid response": (r) => r.json("status") === "success",
  });

  responseTime.add(healthResponse.timings.duration);

  if (healthResponse.status === 200) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
  }

  // Test API endpoints
  const eventsResponse = http.get(`${BASE_URL}/api/v1/events`);

  check(eventsResponse, {
    "events status is 200 or 500": (r) => [200, 500].includes(r.status),
    "events response time < 500ms": (r) => r.timings.duration < 500,
  });

  responseTime.add(eventsResponse.timings.duration);

  if (eventsResponse.status === 200) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
  }

  // Small sleep to simulate realistic user behavior
  sleep(0.1);
}

export function handleSummary(data) {
  console.log("\n=== TC_PERF_01: Response Time Test Results ===");
  console.log(`Total Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(
    `Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s`
  );
  console.log(
    `P95 Response Time: ${data.metrics.http_req_duration.values[
      "p(95)"
    ].toFixed(2)}ms`
  );
  console.log(
    `P99 Response Time: ${data.metrics.http_req_duration.values[
      "p(99)"
    ].toFixed(2)}ms`
  );
  console.log(
    `Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(
      2
    )}ms`
  );
  console.log(
    `Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%`
  );
  console.log("==============================================\n");

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
