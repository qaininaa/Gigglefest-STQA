#!/bin/bash

# Performance Test Runner Script
# Runs all k6 performance tests sequentially

echo "======================================"
echo "   GiggleFest Performance Test Suite"
echo "======================================"
echo ""

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "❌ Error: k6 is not installed"
    echo "Please install k6 from https://k6.io/docs/getting-started/installation/"
    exit 1
fi

echo "✅ k6 is installed: $(k6 version)"
echo ""

# Set base URL (default to localhost:8080)
BASE_URL=${BASE_URL:-"http://localhost:8080"}
echo "🌐 Target URL: $BASE_URL"
echo ""

# Check if application is running
echo "🔍 Checking if application is running..."
if curl -s --head --request GET "$BASE_URL" | grep "200\|404" > /dev/null; then
    echo "✅ Application is responding"
else
    echo "❌ Warning: Application may not be running at $BASE_URL"
    echo "   Please start your application before running tests"
    read -p "   Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "======================================"
echo "   Starting Performance Tests"
echo "======================================"
echo ""

# Create results directory
RESULTS_DIR="src/tests/performance/results"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Test 1: Response Time
echo "📊 Test 1/5: Response Time Verification (tc_perf_01)"
echo "   Target: 100 req/s, Duration: ~1 min"
k6 run --out json="$RESULTS_DIR/tc_perf_01_$TIMESTAMP.json" \
       --summary-export="$RESULTS_DIR/tc_perf_01_summary_$TIMESTAMP.json" \
       src/tests/performance/tc_perf_01.js
echo ""

# Test 2: Memory Usage
echo "📊 Test 2/5: Memory Usage Under Load (tc_perf_02)"
echo "   Target: 1000 VUs, Duration: ~4.5 min"
k6 run --out json="$RESULTS_DIR/tc_perf_02_$TIMESTAMP.json" \
       --summary-export="$RESULTS_DIR/tc_perf_02_summary_$TIMESTAMP.json" \
       src/tests/performance/tc_perf_02.js
echo ""

# Test 3: Maximum Capacity
echo "📊 Test 3/5: Maximum User Capacity (tc_perf_03)"
echo "   Target: 2000 VUs, Duration: ~14 min"
echo "   ⚠️  This is a long test, press Ctrl+C to skip"
sleep 3
k6 run --out json="$RESULTS_DIR/tc_perf_03_$TIMESTAMP.json" \
       --summary-export="$RESULTS_DIR/tc_perf_03_summary_$TIMESTAMP.json" \
       src/tests/performance/tc_perf_03.js
echo ""

# Test 4: Resource Monitoring
echo "📊 Test 4/5: RAM and CPU Usage Monitoring (tc_perf_04)"
echo "   Target: 1000 VUs, Duration: ~6 min"
k6 run --out json="$RESULTS_DIR/tc_perf_04_$TIMESTAMP.json" \
       --summary-export="$RESULTS_DIR/tc_perf_04_summary_$TIMESTAMP.json" \
       src/tests/performance/tc_perf_04.js
echo ""

# Test 5: Large Payloads
echo "📊 Test 5/5: Large Payload Handling (tc_perf_05)"
echo "   Target: 1-5MB payloads, Duration: ~5 min"
k6 run --out json="$RESULTS_DIR/tc_perf_05_$TIMESTAMP.json" \
       --summary-export="$RESULTS_DIR/tc_perf_05_summary_$TIMESTAMP.json" \
       src/tests/performance/tc_perf_05.js
echo ""

echo "======================================"
echo "   Performance Tests Completed! ✅"
echo "======================================"
echo ""
echo "📁 Results saved to: $RESULTS_DIR"
echo "📊 Test reports:"
ls -lh "$RESULTS_DIR"/*_$TIMESTAMP*
echo ""
echo "🎉 All tests completed successfully!"
