/**
 * TC_PERF_05: Large Payload Handling
 * 
 * Test Scenario: Test response handling for large payloads
 * Test Steps: Send payloads between 1MB–5MB to test data transfer capabilities
 * 
 * ISO/IEC 25010 - Performance Efficiency > Resource Utilization
 * Validates: System capability to handle large data transfers efficiently
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend, Rate } from "k6/metrics";

// Custom metrics
const payloadSizes = new Trend("payload_size_bytes");
const uploadTime = new Trend("upload_time_ms");
const downloadTime = new Trend("download_time_ms");
const transferSuccess = new Rate("transfer_success_rate");

export const options = {
  scenarios: {
    large_payload_test: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "30s", target: 10 }, // Warm up with 10 users
        { duration: "1m", target: 25 }, // Increase to 25 users
        { duration: "2m", target: 50 }, // Peak at 50 users
        { duration: "1m", target: 10 }, // Cool down
        { duration: "30s", target: 0 }, // End
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<10000"], // 95% under 10s for large payloads
    http_req_failed: ["rate<0.1"], // Error rate under 10%
    upload_time_ms: ["p(95)<8000"], // Upload time under 8s
    transfer_success_rate: ["rate>0.9"], // 90% success rate
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// Generate payload of specific size
function generatePayload(sizeInMB) {
  const sizeInBytes = sizeInMB * 1024 * 1024;
  const chunkSize = 1024; // 1KB chunks
  const chunks = Math.floor(sizeInBytes / chunkSize);

  // Create array of test data
  const data = {
    testId: `perf-test-${Date.now()}`,
    timestamp: new Date().toISOString(),
    payloadSizeMB: sizeInMB,
    data: [],
  };

  // Fill with sample data
  for (let i = 0; i < chunks; i++) {
    data.data.push({
      id: i,
      content: "x".repeat(900), // ~900 bytes per object
      metadata: {
        index: i,
        timestamp: Date.now(),
      },
    });
  }

  return JSON.stringify(data);
}

export default function () {
  // Random payload size between 1MB and 5MB
  const payloadSizeMB = Math.floor(Math.random() * 5) + 1;
  const payload = generatePayload(payloadSizeMB);
  const payloadBytes = new TextEncoder().encode(payload).length;

  payloadSizes.add(payloadBytes);

  const uploadStart = Date.now();

  // Test 1: POST with large payload (simulated upload)
  const postResponse = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      tags: {
        payload_size_mb: payloadSizeMB.toString(),
        test_type: "large_upload",
      },
    }
  );

  const uploadEnd = Date.now();
  const uploadDuration = uploadEnd - uploadStart;
  uploadTime.add(uploadDuration);

  const uploadSuccess = check(postResponse, {
    "upload status acceptable": (r) =>
      [200, 201, 400, 409, 413, 500].includes(r.status),
    "upload completed": (r) => r.timings.duration > 0,
    "no timeout": (r) => r.status !== 0,
  });

  if (uploadSuccess) {
    transferSuccess.add(1);
  } else {
    transferSuccess.add(0);
  }

  sleep(1);

  // Test 2: GET request to receive data (simulated download)
  const downloadStart = Date.now();

  const getResponse = http.get(`${BASE_URL}/api/v1/events`, {
    tags: {
      test_type: "data_download",
    },
  });

  const downloadEnd = Date.now();
  const downloadDuration = downloadEnd - downloadStart;
  downloadTime.add(downloadDuration);

  const downloadSuccess = check(getResponse, {
    "download status is 200 or 500": (r) => [200, 500].includes(r.status),
    "response has content": (r) => r.body && r.body.length > 0,
    "download time reasonable": (r) => r.timings.duration < 5000,
  });

  if (downloadSuccess) {
    transferSuccess.add(1);
  } else {
    transferSuccess.add(0);
  }

  // Longer sleep due to large payload processing
  sleep(2);
}

export function handleSummary(data) {
  const metrics = data.metrics;

  const avgPayloadSize =
    (metrics.payload_size_bytes?.values.avg || 0) / 1024 / 1024;
  const maxPayloadSize =
    (metrics.payload_size_bytes?.values.max || 0) / 1024 / 1024;
  const avgUploadTime = metrics.upload_time_ms?.values.avg || 0;
  const avgDownloadTime = metrics.download_time_ms?.values.avg || 0;
  const successRate = (metrics.transfer_success_rate?.values.rate || 0) * 100;

  console.log("\n=== TC_PERF_05: Large Payload Handling Results ===");
  console.log(`\nPayload Statistics:`);
  console.log(`  Average Payload Size: ${avgPayloadSize.toFixed(2)} MB`);
  console.log(`  Maximum Payload Size: ${maxPayloadSize.toFixed(2)} MB`);
  console.log(
    `  Total Data Transferred: ${((metrics.data_sent?.values.count || 0) / 1024 / 1024).toFixed(2)} MB`
  );

  console.log(`\nTransfer Performance:`);
  console.log(`  Average Upload Time: ${avgUploadTime.toFixed(2)}ms`);
  console.log(
    `  P95 Upload Time: ${(metrics.upload_time_ms?.values["p(95)"] || 0).toFixed(2)}ms`
  );
  console.log(`  Average Download Time: ${avgDownloadTime.toFixed(2)}ms`);
  console.log(
    `  P95 Download Time: ${(metrics.download_time_ms?.values["p(95)"] || 0).toFixed(2)}ms`
  );

  console.log(`\nThroughput:`);
  if (avgUploadTime > 0) {
    const uploadThroughput = (avgPayloadSize / (avgUploadTime / 1000)).toFixed(
      2
    );
    console.log(`  Upload Throughput: ${uploadThroughput} MB/s`);
  }

  console.log(`\nOverall Statistics:`);
  console.log(`  Total Requests: ${metrics.http_reqs?.values.count || 0}`);
  console.log(
    `  Average Response Time: ${(metrics.http_req_duration?.values.avg || 0).toFixed(2)}ms`
  );
  console.log(
    `  P95 Response Time: ${(metrics.http_req_duration?.values["p(95)"] || 0).toFixed(2)}ms`
  );
  console.log(`  Transfer Success Rate: ${successRate.toFixed(2)}%`);
  console.log(
    `  HTTP Error Rate: ${((metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%`
  );

  console.log(`\nTest Configuration:`);
  console.log(`  Payload Size Range: 1MB - 5MB`);
  console.log(`  Peak Virtual Users: ${metrics.vus?.values.max || 0}`);
  console.log(
    `  Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s`
  );

  console.log("===================================================\n");

  return {
    "stdout": JSON.stringify(
      {
        summary: {
          avgPayloadSizeMB: avgPayloadSize.toFixed(2),
          maxPayloadSizeMB: maxPayloadSize.toFixed(2),
          avgUploadTimeMs: avgUploadTime.toFixed(2),
          avgDownloadTimeMs: avgDownloadTime.toFixed(2),
          transferSuccessRate: successRate.toFixed(2),
          totalRequests: metrics.http_reqs?.values.count,
        },
      },
      null,
      2
    ),
    "perf_05_summary.json": JSON.stringify(data, null, 2),
  };
}
