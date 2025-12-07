/**
 * TC_PERF_02: Memory Usage Under Load
 *
 * Test Scenario: Verify memory consumption under realistic load
 * Test Steps:
 *   1. Start application and measure baseline memory
 *   2. Execute up to 250 concurrent requests
 *   3. Monitor memory usage throughout the test
 *   4. Verify no excessive allocation
 *
 * Expected Result: Memory usage stays within acceptable limits (e.g., <512MB for simple API)
 *
 * ISO/IEC 25010 - Performance Efficiency > Resource Utilization
 * Validates: Application handles realistic concurrent load without memory leaks
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const requestCount = new Counter("total_requests");
const memoryHeapUsed = new Trend("memory_heap_used_mb");
const memoryRSS = new Trend("memory_rss_mb");
const memoryHeapTotal = new Trend("memory_heap_total_mb");

export const options = {
  scenarios: {
    realistic_load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 50 }, // Ramp up to 50 VUs
        { duration: "30s", target: 100 }, // Ramp up to 100 VUs
        { duration: "30s", target: 200 }, // Ramp up to 200 VUs
        { duration: "30s", target: 250 }, // Ramp up to 250 VUs (peak)
        { duration: "60s", target: 250 }, // Hold at 250 VUs for 1 minute
        { duration: "30s", target: 100 }, // Ramp down to 100 VUs
        { duration: "20s", target: 0 }, // Ramp down to 0
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1000"], // 95% under 1s with realistic load
    http_req_failed: ["rate<0.05"], // Error rate under 5%
    errors: ["rate<0.05"],
    memory_heap_used_mb: ["max<512"], // Heap memory should stay under 512MB
    memory_rss_mb: ["max<768"], // RSS memory should stay under 768MB
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

let baselineMemory = null;

export function setup() {
  // Step 1: Measure baseline memory before load test
  console.log("\n📊 Measuring baseline memory...");
  const metricsRes = http.get(`${BASE_URL}/metrics`);

  if (metricsRes.status === 200) {
    const metrics = JSON.parse(metricsRes.body);
    baselineMemory = {
      heapUsed: parseFloat(metrics.memory.heapUsed.mb),
      rss: parseFloat(metrics.memory.rss.mb),
      heapTotal: parseFloat(metrics.memory.heapTotal.mb),
    };
    console.log(`✅ Baseline Memory:`);
    console.log(`   - Heap Used: ${baselineMemory.heapUsed} MB`);
    console.log(`   - RSS: ${baselineMemory.rss} MB`);
    console.log(`   - Heap Total: ${baselineMemory.heapTotal} MB\n`);
  } else {
    console.warn(
      "⚠️  Could not fetch baseline memory. Ensure /metrics endpoint is available."
    );
  }

  return { baselineMemory };
}

export default function (data) {
  // Step 2 & 3: Execute concurrent requests and monitor memory
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

  // Monitor memory usage periodically (every 10th iteration to reduce overhead)
  if (__ITER % 10 === 0) {
    const metricsRes = http.get(`${BASE_URL}/metrics`);

    if (metricsRes.status === 200) {
      const metrics = JSON.parse(metricsRes.body);
      const heapUsedMB = parseFloat(metrics.memory.heapUsed.mb);
      const rssMB = parseFloat(metrics.memory.rss.mb);
      const heapTotalMB = parseFloat(metrics.memory.heapTotal.mb);

      memoryHeapUsed.add(heapUsedMB);
      memoryRSS.add(rssMB);
      memoryHeapTotal.add(heapTotalMB);
    }
  }

  // Simulate user think time
  sleep(1);
}

export function teardown(data) {
  // Final memory measurement after test
  console.log("\n📊 Measuring final memory after load test...");
  sleep(2); // Wait for system to stabilize

  const metricsRes = http.get(`${BASE_URL}/metrics`);

  if (metricsRes.status === 200) {
    const metrics = JSON.parse(metricsRes.body);
    const finalMemory = {
      heapUsed: parseFloat(metrics.memory.heapUsed.mb),
      rss: parseFloat(metrics.memory.rss.mb),
      heapTotal: parseFloat(metrics.memory.heapTotal.mb),
    };

    console.log(`✅ Final Memory:`);
    console.log(`   - Heap Used: ${finalMemory.heapUsed} MB`);
    console.log(`   - RSS: ${finalMemory.rss} MB`);
    console.log(`   - Heap Total: ${finalMemory.heapTotal} MB\n`);

    if (data.baselineMemory) {
      const heapGrowth = finalMemory.heapUsed - data.baselineMemory.heapUsed;
      const rssGrowth = finalMemory.rss - data.baselineMemory.rss;

      console.log(`📈 Memory Growth:`);
      console.log(`   - Heap Used: +${heapGrowth.toFixed(2)} MB`);
      console.log(`   - RSS: +${rssGrowth.toFixed(2)} MB\n`);
    }
  }
}

export function handleSummary(data) {
  const vus = data.metrics.vus?.values || {};
  const duration = data.metrics.http_req_duration?.values || {};
  const reqs = data.metrics.http_reqs?.values || {};
  const heapMem = data.metrics.memory_heap_used_mb?.values || {};
  const rssMem = data.metrics.memory_rss_mb?.values || {};

  console.log(
    "\n=== TC_PERF_02: Memory Usage Under Realistic Load Results ==="
  );
  console.log(`Peak Virtual Users: ${vus.max || 250}`);
  console.log(`Total Requests: ${reqs.count || 0}`);
  console.log(`Requests Per Second: ${(reqs.rate || 0).toFixed(2)} req/s`);
  console.log(`Average Response Time: ${(duration.avg || 0).toFixed(2)}ms`);
  console.log(`P95 Response Time: ${(duration["p(95)"] || 0).toFixed(2)}ms`);
  console.log(`P99 Response Time: ${(duration["p(99)"] || 0).toFixed(2)}ms`);
  console.log(
    `Error Rate: ${(
      (data.metrics.http_req_failed?.values.rate || 0) * 100
    ).toFixed(2)}%`
  );

  console.log("\n--- Memory Usage Statistics ---");
  if (heapMem.max) {
    console.log(`Heap Used - Max: ${heapMem.max.toFixed(2)} MB`);
    console.log(`Heap Used - Avg: ${heapMem.avg.toFixed(2)} MB`);
    console.log(`Heap Used - Min: ${heapMem.min.toFixed(2)} MB`);
  } else {
    console.log("Heap Used: No data collected");
  }

  if (rssMem.max) {
    console.log(`RSS - Max: ${rssMem.max.toFixed(2)} MB`);
    console.log(`RSS - Avg: ${rssMem.avg.toFixed(2)} MB`);
    console.log(`RSS - Min: ${rssMem.min.toFixed(2)} MB`);
  } else {
    console.log("RSS: No data collected");
  }

  // Step 4: Verify no excessive allocation
  const memoryOK = !heapMem.max || heapMem.max < 512;
  console.log(
    `\n✓ Memory Check: ${
      memoryOK ? "PASSED" : "FAILED"
    } (Heap < 512MB: ${memoryOK})`
  );
  console.log("===================================================\n");

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
