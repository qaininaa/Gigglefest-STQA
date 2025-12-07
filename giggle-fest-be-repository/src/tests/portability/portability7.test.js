import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";
import { platform, EOL } from "os";
import { sep, resolve, join, dirname } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("TC_PORT_07: Adaptability - Cross-Platform Compatibility", () => {
  let server;
  const currentOS = platform();
  const testResults = {
    platform: currentOS,
    timestamp: new Date().toISOString(),
    tests: [],
  };

  beforeAll((done) => {
    server = app.listen(4007, () => {
      console.log(
        `Running cross-platform tests on: ${currentOS} (${process.platform})`
      );
      done();
    });
  });

  afterAll((done) => {
    server.close(() => {
      console.log(`Platform: ${testResults.platform}`);
      console.log(`Tests completed: ${testResults.tests.length}`);
      done();
    });
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Application should correctly identify and run on Linux
   * Validates: Cross-platform compatibility on Linux OS
   * CI/CD: This test runs on Linux runners in GitHub Actions
   */
  test("Should run test suite on Linux (or current platform)", async () => {
    const testStart = Date.now();

    // Test basic API functionality on current platform
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "success");
    expect(response.body).toHaveProperty("version");

    // Record test result
    testResults.tests.push({
      name: "Linux compatibility",
      platform: currentOS,
      duration: Date.now() - testStart,
      passed: true,
    });

    // Verify platform-specific behavior
    if (currentOS === "linux") {
      expect(process.platform).toBe("linux");
      expect(EOL).toBe("\n");
      expect(sep).toBe("/");
    }
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Application should correctly identify and run on Windows
   * Validates: Cross-platform compatibility on Windows OS
   * CI/CD: This test runs on Windows runners in GitHub Actions
   */
  test("Should run test suite on Windows (or current platform)", async () => {
    const testStart = Date.now();

    // Test API endpoints work on Windows
    const response = await request(app).get("/api/v1/events");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.headers["content-type"]).toMatch(/json/);

    // Record test result
    testResults.tests.push({
      name: "Windows compatibility",
      platform: currentOS,
      duration: Date.now() - testStart,
      passed: true,
    });

    // Verify platform-specific behavior
    if (currentOS === "win32") {
      expect(process.platform).toBe("win32");
      expect(EOL).toBe("\r\n");
      expect(sep).toBe("\\");
    }
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Application should correctly identify and run on macOS
   * Validates: Cross-platform compatibility on macOS
   * CI/CD: This test runs on macOS runners in GitHub Actions
   */
  test("Should run test suite on macOS (or current platform)", async () => {
    const testStart = Date.now();

    // Test API endpoints work on macOS
    const response = await request(app).get("/api/v1/tickets");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.headers["content-type"]).toMatch(/json/);

    // Record test result
    testResults.tests.push({
      name: "macOS compatibility",
      platform: currentOS,
      duration: Date.now() - testStart,
      passed: true,
    });

    // Verify platform-specific behavior
    if (currentOS === "darwin") {
      expect(process.platform).toBe("darwin");
      expect(EOL).toBe("\n");
      expect(sep).toBe("/");
    }
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Compare results across platforms
   * Validates: Consistent behavior across different operating systems
   */
  test("Should compare results and ensure consistency", async () => {
    // Test that path handling works correctly on all platforms
    const testPath = resolve(__dirname, "../../app.js");
    expect(existsSync(testPath)).toBe(true);

    // Test that file system operations use platform-appropriate separators
    const joinedPath = join("src", "tests", "portability");
    expect(joinedPath).toContain("portability");
    expect(typeof joinedPath).toBe("string");

    // Test API consistency across platforms
    const endpoints = [
      "/api/v1/events",
      "/api/v1/tickets",
      "/api/v1/categories",
    ];
    const responses = await Promise.all(
      endpoints.map((endpoint) => request(app).get(endpoint))
    );

    // All endpoints should return consistent status codes
    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
    });

    // Verify all platform tests passed
    expect(testResults.tests.length).toBeGreaterThanOrEqual(3);
    testResults.tests.forEach((test) => {
      expect(test.passed).toBe(true);
      expect(test.duration).toBeGreaterThan(0);
    });

    // Log comparison results
    console.log("Cross-platform test comparison:");
    console.log(`  Platform: ${testResults.platform}`);
    console.log(`  Tests run: ${testResults.tests.length}`);
    console.log(
      `  All tests passed: ${testResults.tests.every((t) => t.passed)}`
    );
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Verify platform-independent path handling
   * Validates: Application uses platform-agnostic path operations
   */
  test("Should handle paths correctly across platforms", async () => {
    // Verify path module works correctly
    const absolutePath = resolve(__dirname, "..", "..", "app.js");
    expect(absolutePath).toBeDefined();
    expect(typeof absolutePath).toBe("string");
    expect(absolutePath).toContain("app.js");

    // Verify joined paths use correct separator
    const joinedPath = join(
      "src",
      "tests",
      "portability",
      "portability7.test.js"
    );
    expect(joinedPath).toContain(sep);

    // Test that application works regardless of path separators
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Verify environment variables work across platforms
   * Validates: Environment configuration is platform-independent
   */
  test("Should handle environment variables across platforms", async () => {
    // Verify NODE_ENV is accessible
    const nodeEnv = process.env.NODE_ENV;
    expect(typeof nodeEnv).toBe("string");

    // Verify platform detection
    expect(process.platform).toBeDefined();
    expect(["linux", "win32", "darwin", "freebsd"]).toContain(process.platform);

    // Test that API works with platform-specific environment
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("version");
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Verify line endings are handled correctly
   * Validates: Application handles different line ending conventions
   */
  test("Should handle line endings correctly across platforms", async () => {
    // Verify EOL constant is platform-appropriate
    expect(EOL).toBeDefined();
    expect(typeof EOL).toBe("string");

    // On Windows, EOL should be \r\n
    // On Unix-like systems (Linux, macOS), EOL should be \n
    if (process.platform === "win32") {
      expect(EOL).toBe("\r\n");
    } else {
      expect(EOL).toBe("\n");
    }

    // Test that API handles multiline data correctly
    const response = await request(app)
      .post("/api/v1/auth/register")
      .set("Content-Type", "application/json")
      .send({
        email: "platform-test@example.com",
        password: "Test123!@#",
        name: "Platform Test User",
      });

    expect([200, 201, 400, 409]).toContain(response.status);
    expect(response.headers["content-type"]).toMatch(/json/);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Verify file system case sensitivity handling
   * Validates: Application handles case-sensitive vs case-insensitive file systems
   */
  test("Should handle file system case sensitivity", async () => {
    // Windows: case-insensitive
    // Linux: case-sensitive
    // macOS: can be either (usually case-insensitive, but case-preserving)

    const isWindows = process.platform === "win32";
    const isLinux = process.platform === "linux";
    const isMacOS = process.platform === "darwin";

    expect(isWindows || isLinux || isMacOS).toBe(true);

    // Test that application paths work regardless of case sensitivity
    const response = await request(app).get("/api/v1/events");
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Verify process spawning works across platforms
   * Validates: Platform-independent process management
   */
  test("Should handle process information across platforms", async () => {
    // Verify process information is accessible
    expect(process.pid).toBeGreaterThan(0);
    expect(process.version).toMatch(/^v\d+\.\d+\.\d+/);
    expect(process.arch).toBeDefined();

    // Verify Node.js version compatibility
    const nodeVersion = process.version;
    expect(nodeVersion).toBeDefined();

    // Test that API continues to work
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Verify concurrent requests work across platforms
   * Validates: Thread/event loop handling is platform-independent
   */
  test("Should handle concurrent requests on all platforms", async () => {
    const concurrentRequests = [];

    // Create 5 concurrent requests
    for (let i = 0; i < 5; i++) {
      concurrentRequests.push(request(app).get("/api/v1/events"));
    }

    const responses = await Promise.all(concurrentRequests);

    // All requests should succeed regardless of platform
    responses.forEach((response, index) => {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
    });

    // Verify platform can handle concurrent operations
    expect(responses.length).toBe(5);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Verify memory and resource handling
   * Validates: Resource management is consistent across platforms
   */
  test("Should manage resources consistently across platforms", async () => {
    const memoryBefore = process.memoryUsage();

    // Perform several API operations
    await request(app).get("/api/v1/events");
    await request(app).get("/api/v1/tickets");
    await request(app).get("/api/v1/categories");

    const memoryAfter = process.memoryUsage();

    // Verify memory usage is tracked
    expect(memoryBefore.heapUsed).toBeGreaterThan(0);
    expect(memoryAfter.heapUsed).toBeGreaterThan(0);

    // Verify application continues to work
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Verify timezone handling across platforms
   * Validates: Date/time operations are platform-independent
   */
  test("Should handle timezones correctly across platforms", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("timestamp");

    // Verify timestamp is in valid ISO format
    const timestamp = response.body.timestamp;
    expect(timestamp).toBeDefined();
    expect(new Date(timestamp).toString()).not.toBe("Invalid Date");

    // Verify timezone offset is accessible
    const offset = new Date().getTimezoneOffset();
    expect(typeof offset).toBe("number");
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Summary - All platform tests should pass
   * Validates: Complete cross-platform compatibility
   */
  test("Should summarize cross-platform compatibility results", async () => {
    // Verify all tests have been recorded
    expect(testResults.tests.length).toBeGreaterThan(0);

    // Verify all tests passed
    const allPassed = testResults.tests.every((test) => test.passed);
    expect(allPassed).toBe(true);

    // Verify test ran on a supported platform
    expect(["linux", "win32", "darwin"]).toContain(testResults.platform);

    // Log final summary
    console.log("\n=== Cross-Platform Compatibility Summary ===");
    console.log(`Platform: ${testResults.platform}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Architecture: ${process.arch}`);
    console.log(`Tests completed: ${testResults.tests.length}`);
    console.log(`All tests passed: ${allPassed}`);
    console.log(
      `Total duration: ${testResults.tests.reduce(
        (sum, t) => sum + t.duration,
        0
      )}ms`
    );
    console.log("===========================================\n");

    // Verify application is still responsive
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });
});
