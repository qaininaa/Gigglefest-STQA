/**
 * TC_PERF_04: RAM and CPU Usage Monitoring
 * 
 * Test Scenario: Monitor RAM and CPU usage during load testing
 * Test Steps: Use k6 handleSummary combined with Node-level monitoring
 * 
 * ISO/IEC 25010 - Performance Efficiency > Resource Utilization
 * Validates: Efficient resource usage and monitoring capabilities
 * 
 * Note: Run with `k6 run --out json=perf_04_results.json tc_perf_04.js`
 * For real-time monitoring, use k6 with Prometheus/Grafana or xk6-output-prometheus-remote
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Gauge, Trend } from "k6/metrics";
import exec from "k6/execution";

// Custom metrics for resource monitoring
const activeVUs = new Gauge("active_virtual_users");
const dataReceived = new Counter("data_received_bytes");
const dataSent = new Counter("data_sent_bytes");
const iterationDuration = new Trend("iteration_duration");

export const options = {
  scenarios: {
    resource_monitoring: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 }, // Warm up
        { duration: "1m", target: 200 }, // Light load
        { duration: "1m", target: 500 }, // Medium load
        { duration: "2m", target: 1000 }, // Heavy load
        { duration: "1m", target: 500 }, // Cool down
        { duration: "30s", target: 0 }, // End
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<3000"],
    http_req_failed: ["rate<0.1"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

export default function () {
  const iterationStart = Date.now();

  // Update active VUs metric
  activeVUs.add(exec.vu.idInTest);

  // Batch requests to simulate realistic load
  const responses = http.batch([
    ["GET", `${BASE_URL}/`, null, { tags: { name: "health" } }],
    ["GET", `${BASE_URL}/api/v1/events`, null, { tags: { name: "events" } }],
    [
      "GET",
      `${BASE_URL}/api/v1/tickets`,
      null,
      { tags: { name: "tickets" } },
    ],
  ]);

  // Track data transfer
  responses.forEach((response) => {
    if (response.body) {
      dataReceived.add(response.body.length);
    }
    if (response.request && response.request.body) {
      dataSent.add(response.request.body.length);
    }

    check(response, {
      "status is acceptable": (r) => [200, 500].includes(r.status),
      "has response body": (r) => r.body !== null,
    });
  });

  // Record iteration duration
  const iterationEnd = Date.now();
  iterationDuration.add(iterationEnd - iterationStart);

  // Simulate user think time
  sleep(1);
}

export function handleSummary(data) {
  const metrics = data.metrics;
  const state = data.state;

  // Calculate resource metrics
  const totalDataReceived = metrics.data_received?.values.count || 0;
  const totalDataSent = metrics.data_sent?.values.count || 0;
  const avgIterationDuration =
    metrics.iteration_duration?.values.avg || 0;
  const totalIterations = metrics.iterations?.values.count || 0;
  const totalRequests = metrics.http_reqs?.values.count || 0;
  const testDuration = state.testRunDurationMs / 1000;

  console.log("\n=== TC_PERF_04: RAM and CPU Usage Monitoring ===");
  console.log(`Test Duration: ${testDuration.toFixed(2)}s`);
  console.log(`\nLoad Profile:`);
  console.log(`  Peak Virtual Users: ${metrics.vus?.values.max || 0}`);
  console.log(`  Total Iterations: ${totalIterations}`);
  console.log(`  Total HTTP Requests: ${totalRequests}`);
  console.log(
    `  Average Iteration Duration: ${avgIterationDuration.toFixed(2)}ms`
  );

  console.log(`\nData Transfer:`);
  console.log(
    `  Total Data Received: ${(totalDataReceived / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `  Total Data Sent: ${(totalDataSent / 1024 / 1024).toFixed(2)} MB`
  );
  console.log(
    `  Bandwidth Usage (Received): ${((totalDataReceived / 1024 / 1024) / testDuration).toFixed(2)} MB/s`
  );

  console.log(`\nResponse Time Statistics:`);
  console.log(
    `  Average: ${(metrics.http_req_duration?.values.avg || 0).toFixed(2)}ms`
  );
  console.log(
    `  P95: ${(metrics.http_req_duration?.values["p(95)"] || 0).toFixed(2)}ms`
  );
  console.log(
    `  P99: ${(metrics.http_req_duration?.values["p(99)"] || 0).toFixed(2)}ms`
  );

  console.log(`\nThroughput:`);
  console.log(
    `  Requests Per Second: ${(metrics.http_reqs?.values.rate || 0).toFixed(2)}`
  );
  console.log(
    `  Iterations Per Second: ${(metrics.iterations?.values.rate || 0).toFixed(2)}`
  );

  console.log(`\nError Metrics:`);
  console.log(
    `  Failed Requests: ${((metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%`
  );

  console.log("\n=== Resource Monitoring Notes ===");
  console.log(
    "For detailed RAM and CPU monitoring, use one of these approaches:"
  );
  console.log(
    "1. Run alongside: docker stats (if app is containerized)"
  );
  console.log("2. Use: k6 run --out json=results.json tc_perf_04.js");
  console.log(
    "3. Integrate with: Prometheus + Grafana for real-time monitoring"
  );
  console.log("4. Server-side: Monitor with htop, top, or performance monitoring tools");
  console.log("=================================================\n");

  // Return summary in multiple formats
  return {
    "stdout": JSON.stringify({
      summary: {
        testDuration: testDuration,
        peakVUs: metrics.vus?.values.max,
        totalRequests: totalRequests,
        dataTransfer: {
          received_mb: (totalDataReceived / 1024 / 1024).toFixed(2),
          sent_mb: (totalDataSent / 1024 / 1024).toFixed(2),
        },
        responseTime: {
          avg: metrics.http_req_duration?.values.avg.toFixed(2),
          p95: metrics.http_req_duration?.values["p(95)"].toFixed(2),
          p99: metrics.http_req_duration?.values["p(99)"].toFixed(2),
        },
        errorRate: (
          (metrics.http_req_failed?.values.rate || 0) * 100
        ).toFixed(2),
      },
    }),
    "perf_04_summary.json": JSON.stringify(data, null, 2),
  };
}
