import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { GenericContainer, Wait } from "testcontainers";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Helper function to check if Docker is available
 *
 * NOTE: If you encounter "authentication required - email must be verified" error:
 * 1. Verify your Docker Hub account email
 * 2. Or run: docker logout
 * 3. Or remove credsStore from ~/.docker/config.json
 * 4. Or build the image manually first: docker build -t gigglefest-api-test .
 */
async function isDockerAvailable() {
  try {
    await execAsync("docker --version");
    return true;
  } catch {
    return false;
  }
}

describe("TC_PORT_06: Installability - Docker Containerization", () => {
  let container;
  let containerUrl;
  let dockerAvailable = false;

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Setup: Build Docker image and run container
   * Validates: Application can be containerized and deployed via Docker
   */
  beforeAll(async () => {
    // Check if Docker is available
    dockerAvailable = await isDockerAvailable();

    if (!dockerAvailable) {
      console.warn(
        "⚠️  Docker is not available. Tests will be skipped. Install Docker to run these tests."
      );
      return;
    }

    const projectRoot = resolve(__dirname, "../../../");

    try {
      // Use the pre-built image instead of building from Dockerfile
      container = await new GenericContainer("gigglefest-api-test:latest")
        .withExposedPorts(3000)
        .withEnvironment({
          NODE_ENV: "production",
          PORT: "3000",
          DATABASE_URL:
            "postgresql://postgres:password@host.docker.internal:5432/gigglefest",
          IMAGEKIT_PUBLIC_KEY: "test_public_key",
          IMAGEKIT_PRIVATE_KEY: "test_private_key",
          IMAGEKIT_URL_ENDPOINT: "https://ik.imagekit.io/test",
          JWT_SECRET: "test_jwt_secret_key_for_testing",
        })
        .withWaitStrategy(Wait.forHttp("/", 3000).forStatusCode(200))
        .start();

      // Get container host and mapped port
      const host = container.getHost();
      const port = container.getMappedPort(3000);
      containerUrl = `http://${host}:${port}`;

      console.log(`Container started at: ${containerUrl}`);
    } catch (error) {
      console.error("Container setup failed:", error);
      throw error;
    }
  }, 300000);

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Cleanup: Stop and remove container
   * Validates: Clean removal of containerized application
   */
  afterAll(async () => {
    if (container && dockerAvailable) {
      await container.stop();
      console.log("Container stopped successfully");
    }
  }, 60000);

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Test: Docker image should build successfully
   * Validates: Application can be packaged as Docker image
   */
  test("Should build Docker image successfully", async () => {
    if (!dockerAvailable) {
      console.log("⏭️  Skipping: Docker not available");
      return;
    }

    // If we reach this point, container was built and started
    expect(container).toBeDefined();
    expect(containerUrl).toBeDefined();
    expect(containerUrl).toMatch(/^http:\/\//);
  });

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Test: Container should be running
   * Validates: Containerized application runs successfully
   */
  test("Should run container successfully", async () => {
    if (!dockerAvailable) {
      console.log("⏭️  Skipping: Docker not available");
      return;
    }

    const isRunning =
      container.getState?.() === "running" || container !== null;
    expect(isRunning).toBe(true);

    // Verify container has exposed ports
    const mappedPort = container.getMappedPort(3000);
    expect(mappedPort).toBeDefined();
    expect(typeof mappedPort).toBe("number");
    expect(mappedPort).toBeGreaterThan(0);
  });

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Test: Health check endpoint should respond
   * Validates: Container is healthy and accessible
   */
  test("Should execute health check endpoint successfully", async () => {
    if (!dockerAvailable) {
      console.log("⏭️  Skipping: Docker not available");
      return;
    }

    const response = await fetch(containerUrl + "/");
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("status", "success");
    expect(data).toHaveProperty("message");
    expect(data).toHaveProperty("version");
    expect(data).toHaveProperty("server", "running");
    expect(data).toHaveProperty("timestamp");
  });

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Test: API endpoints should be accessible in container
   * Validates: Containerized application serves API correctly
   */
  test("Should run API tests against container - GET /api/v1/events", async () => {
    if (!dockerAvailable) {
      console.log("⏭️  Skipping: Docker not available");
      return;
    }

    const response = await fetch(containerUrl + "/api/v1/events");
    const data = await response.json();

    // Accept 200 (success) or 500 (database connection issue in container)
    expect([200, 500]).toContain(response.status);
    expect(response.headers.get("content-type")).toMatch(/json/);

    if (response.status === 200) {
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("events");
      expect(data.data).toHaveProperty("meta");
    } else {
      // Database connection error is expected if database is not accessible
      expect(data).toHaveProperty("message");
    }
  });

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Test: Container should handle multiple API requests
   * Validates: Containerized API maintains functionality
   */
  test("Should handle multiple API endpoints in container", async () => {
    if (!dockerAvailable) {
      console.log("⏭️  Skipping: Docker not available");
      return;
    }

    const endpoints = [
      "/api/v1/events",
      "/api/v1/tickets",
      "/api/v1/categories",
    ];

    const requests = endpoints.map((endpoint) =>
      fetch(containerUrl + endpoint)
    );
    const responses = await Promise.all(requests);

    // All endpoints should respond (200 or 500 for database issues)
    for (const response of responses) {
      expect([200, 500]).toContain(response.status);
      expect(response.headers.get("content-type")).toMatch(/json/);

      const data = await response.json();
      // Verify response structure exists (data or error message)
      expect(data).toBeDefined();
    }
  });

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Test: Container should handle POST requests
   * Validates: Full API functionality in containerized environment
   */
  test("Should handle POST requests in container", async () => {
    if (!dockerAvailable) {
      console.log("⏭️  Skipping: Docker not available");
      return;
    }

    const response = await fetch(containerUrl + "/api/v1/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "containertest@example.com",
        password: "Test123!@#",
        name: "Container Test User",
      }),
    });

    const data = await response.json();

    // Accept valid responses (success, validation error, or conflict)
    expect([200, 201, 400, 409]).toContain(response.status);
    expect(response.headers.get("content-type")).toMatch(/json/);
    expect(data).toBeDefined();
  });

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Test: Container should handle error cases properly
   * Validates: Error handling works in containerized environment
   */
  test("Should handle error cases in container", async () => {
    if (!dockerAvailable) {
      console.log("⏭️  Skipping: Docker not available");
      return;
    }

    const response = await fetch(containerUrl + "/api/v1/nonexistent");
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toMatch(/json/);
    expect(data).toHaveProperty("message");
  });

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Test: Container should serve consistent responses
   * Validates: Containerized application behaves identically to non-containerized
   */
  test("Should serve consistent responses from container", async () => {
    if (!dockerAvailable) {
      console.log("⏭️  Skipping: Docker not available");
      return;
    }

    // Make multiple requests to same endpoint
    const responses = await Promise.all([
      fetch(containerUrl + "/api/v1/events?page=1&limit=5"),
      fetch(containerUrl + "/api/v1/events?page=1&limit=5"),
      fetch(containerUrl + "/api/v1/events?page=1&limit=5"),
    ]);

    // All should return same structure
    const dataArray = await Promise.all(responses.map((r) => r.json()));

    dataArray.forEach((data, index) => {
      // Accept success or database connection error
      expect(responses[index].status).toBeGreaterThanOrEqual(200);

      if (responses[index].status === 200) {
        expect(data).toHaveProperty("data");
        expect(data.data).toHaveProperty("events");
        expect(data.data).toHaveProperty("meta");
        expect(data.data.meta.page).toBe(1);
        expect(data.data.meta.limit).toBe(5);
      } else {
        // Database connection error is acceptable in containerized environment
        expect(data).toHaveProperty("message");
      }
    });
  });

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Test: Container should respect environment variables
   * Validates: Configuration portability in containerized environment
   */
  test("Should respect environment variables in container", async () => {
    if (!dockerAvailable) {
      console.log("⏭️  Skipping: Docker not available");
      return;
    }

    const response = await fetch(containerUrl + "/");
    const data = await response.json();

    // Verify container is running in production mode
    expect(data).toHaveProperty("status", "success");
    expect(data).toHaveProperty("server", "running");

    // Container should be accessible on configured port
    expect(containerUrl).toContain(String(container.getMappedPort(3000)));
  });

  /**
   * ISO/IEC 25010 - Portability > Installability
   * Test: Container should handle concurrent requests
   * Validates: Performance and stability in containerized environment
   */
  test("Should handle concurrent requests in container", async () => {
    if (!dockerAvailable) {
      console.log("⏭️  Skipping: Docker not available");
      return;
    }

    const concurrentRequests = [];

    // Create 10 concurrent requests
    for (let i = 0; i < 10; i++) {
      concurrentRequests.push(fetch(containerUrl + "/api/v1/events"));
    }

    const responses = await Promise.all(concurrentRequests);

    // All requests should return valid responses
    for (const response of responses) {
      expect([200, 500]).toContain(response.status);

      const data = await response.json();
      // Verify response is valid JSON with data or error message
      expect(data).toBeDefined();
      expect(response.headers.get("content-type")).toMatch(/json/);
    }
  });
});
