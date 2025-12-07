# Performance Testing Suite - K6

This directory contains performance testing scripts using [k6](https://k6.io/) following ISO/IEC 25010 Performance Efficiency standards.

## 📋 Test Cases

### TC_PERF_01: Response Time Verification

**Scenario:** Verify response time under sustained load  
**Target:** 100 requests per second  
**Metrics:** P95 < 500ms, P99 < 1000ms  
**Duration:** 1 minute

```bash
k6 run src/tests/performance/tc_perf_01.js
```

### TC_PERF_02: Memory Usage Under Load

**Scenario:** Verify memory usage and stability under high load  
**Target:** 1000 concurrent virtual users  
**Metrics:** P95 < 2000ms, Error rate < 10%  
**Duration:** ~4.5 minutes

```bash
k6 run src/tests/performance/tc_perf_02.js
```

### TC_PERF_03: Maximum User Capacity

**Scenario:** Validate maximum user capacity and breaking point  
**Target:** Gradually increase to 2000 virtual users  
**Metrics:** P90 < 3000ms, P95 < 5000ms  
**Duration:** 14 minutes

```bash
k6 run src/tests/performance/tc_perf_03.js
```

### TC_PERF_04: RAM and CPU Usage Monitoring

**Scenario:** Monitor resource utilization during load  
**Target:** Up to 1000 concurrent users with resource tracking  
**Metrics:** Resource usage, data transfer, throughput  
**Duration:** ~6 minutes

```bash
k6 run --out json=perf_04_results.json src/tests/performance/tc_perf_04.js
```

### TC_PERF_05: Large Payload Handling

**Scenario:** Test handling of large data transfers  
**Target:** 1MB-5MB payloads with up to 50 concurrent users  
**Metrics:** P95 upload time < 8000ms, Success rate > 90%  
**Duration:** ~5 minutes

```bash
k6 run src/tests/performance/tc_perf_05.js
```

## 🚀 Prerequisites

### Install k6

**Windows (using Chocolatey):**

```bash
choco install k6
```

**macOS (using Homebrew):**

```bash
brew install k6
```

**Linux:**

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## 📊 Running Tests

### Basic Run

```bash
# Run individual test
k6 run src/tests/performance/tc_perf_01.js

# Run with custom base URL
BASE_URL=http://localhost:8080 k6 run src/tests/performance/tc_perf_01.js
```

### Advanced Options

```bash
# Run with JSON output
k6 run --out json=results.json src/tests/performance/tc_perf_01.js

# Run with summary export
k6 run --summary-export=summary.json src/tests/performance/tc_perf_01.js

# Run with custom duration
k6 run --duration 2m src/tests/performance/tc_perf_01.js

# Run with custom VUs
k6 run --vus 50 --duration 1m src/tests/performance/tc_perf_01.js
```

### Run All Tests

```bash
# Run all performance tests sequentially
for file in src/tests/performance/tc_perf_*.js; do
  echo "Running $file..."
  k6 run "$file"
  echo "---"
done
```

## 📈 Output and Metrics

### Console Output

Each test provides a summary with:

- Total requests and request rate
- Response time statistics (avg, median, P95, P99)
- Error rates
- Virtual user statistics
- Test-specific metrics

### JSON Output

```bash
# Generate detailed JSON report
k6 run --out json=perf_report.json src/tests/performance/tc_perf_01.js

# Generate summary JSON
k6 run --summary-export=summary.json src/tests/performance/tc_perf_01.js
```

### Real-time Monitoring

For real-time monitoring, integrate with Grafana:

```bash
# Using InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 src/tests/performance/tc_perf_01.js

# Using Prometheus (requires xk6-output-prometheus-remote)
k6 run --out prometheus-remote src/tests/performance/tc_perf_01.js
```

## 🎯 Interpreting Results

### Response Time Thresholds

- ✅ **Excellent:** P95 < 200ms
- ✅ **Good:** P95 < 500ms
- ⚠️ **Acceptable:** P95 < 1000ms
- ❌ **Poor:** P95 > 1000ms

### Error Rate Thresholds

- ✅ **Excellent:** < 0.1%
- ✅ **Good:** < 1%
- ⚠️ **Acceptable:** < 5%
- ❌ **Poor:** > 5%

### Throughput Goals

- **Light Load:** 50-100 req/s
- **Medium Load:** 100-500 req/s
- **Heavy Load:** 500-1000 req/s

## 🔧 Customization

### Environment Variables

```bash
# Set base URL
export BASE_URL=http://localhost:8080

# Run test
k6 run src/tests/performance/tc_perf_01.js
```

### Modify Test Parameters

Edit the `options` object in each test file:

```javascript
export const options = {
  scenarios: {
    my_scenario: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 100 }, // Customize
        { duration: "1m", target: 500 }, // Customize
      ],
    },
  },
};
```

## 📝 Best Practices

1. **Start Application:** Ensure the application is running before tests
2. **Warm Up:** Include warm-up stages to avoid cold start issues
3. **Realistic Patterns:** Use realistic user behavior patterns
4. **Monitor Resources:** Watch server CPU/RAM during tests
5. **Baseline Tests:** Run tests regularly to track performance trends
6. **Clean Environment:** Use fresh database state for consistent results

## 🐛 Troubleshooting

### Common Issues

**Connection Refused:**

```bash
# Check if application is running
curl http://localhost:8080
```

**High Error Rates:**

- Check application logs
- Verify database connections
- Check system resources (CPU, RAM, disk)

**Slow Response Times:**

- Check database query performance
- Review application bottlenecks
- Monitor network latency

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Cloud](https://k6.io/cloud/)
- [ISO/IEC 25010 Performance Efficiency](https://iso25000.com/index.php/en/iso-25000-standards/iso-25010)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)

## 🎉 Summary

These performance tests validate:

- ✅ Response time under various load conditions
- ✅ System capacity and scalability
- ✅ Resource utilization efficiency
- ✅ Large payload handling capabilities
- ✅ System stability under sustained load

Run tests regularly to ensure performance standards are maintained! 🚀
