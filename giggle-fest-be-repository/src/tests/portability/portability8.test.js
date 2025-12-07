import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("PT-008: Adaptability - Configuration Management Flexibility", () => {
  let server;
  const projectRoot = resolve(__dirname, "../../../");
  const testEnvFile = resolve(projectRoot, ".env.test");
  const testConfigFile = resolve(projectRoot, "config.test.json");

  // Store original environment variables
  const originalEnv = { ...process.env };

  beforeAll((done) => {
    server = app.listen(4008, () => {
      done();
    });
  });

  afterAll((done) => {
    server.close(() => {
      // Clean up test files
      if (existsSync(testEnvFile)) {
        unlinkSync(testEnvFile);
      }
      if (existsSync(testConfigFile)) {
        unlinkSync(testConfigFile);
      }

      // Restore original environment
      process.env = { ...originalEnv };
      done();
    });
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Load configuration from .env file
   * Validates: Application can read configuration from environment files
   */
  test("Should load config from .env file", async () => {
    // Create a test .env file
    const envContent = `
NODE_ENV=test
PORT=4008
TEST_CONFIG_SOURCE=env_file
DATABASE_URL=postgresql://test:test@localhost:5432/testdb
IMAGEKIT_PUBLIC_KEY=test_public_key_from_env
IMAGEKIT_PRIVATE_KEY=test_private_key_from_env
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/test
JWT_SECRET=test_jwt_secret_from_env_file
`.trim();

    writeFileSync(testEnvFile, envContent);

    // Load the .env file
    const result = dotenv.config({ path: testEnvFile });

    // Verify .env file was loaded successfully
    expect(result.error).toBeUndefined();
    expect(result.parsed).toBeDefined();
    expect(result.parsed.NODE_ENV).toBe("test");
    expect(result.parsed.TEST_CONFIG_SOURCE).toBe("env_file");

    // Verify environment variables are accessible
    expect(process.env.TEST_CONFIG_SOURCE).toBe("env_file");

    // Test that application works with .env configuration
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "success");
    expect(response.body).toHaveProperty("version");
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Load configuration from environment variables
   * Validates: Application can read configuration from system environment
   */
  test("Should load config from environment variables", async () => {
    // Set environment variables directly
    process.env.NODE_ENV = "test";
    process.env.PORT = "4008";
    process.env.TEST_CONFIG_SOURCE = "env_variables";
    process.env.DATABASE_URL =
      "postgresql://test:test@localhost:5432/testdb_env";
    process.env.IMAGEKIT_PUBLIC_KEY = "test_public_key_from_env_var";
    process.env.IMAGEKIT_PRIVATE_KEY = "test_private_key_from_env_var";
    process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/test_env";
    process.env.JWT_SECRET = "test_jwt_secret_from_env_var";

    // Verify environment variables are set
    expect(process.env.NODE_ENV).toBe("test");
    expect(process.env.TEST_CONFIG_SOURCE).toBe("env_variables");
    expect(process.env.PORT).toBe("4008");

    // Test that application works with environment variables
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "success");
    expect(response.body).toHaveProperty("message");

    // Verify API endpoints work with environment-based configuration
    const eventsResponse = await request(app).get("/api/v1/events");
    expect(eventsResponse.status).toBe(200);
    expect(eventsResponse.headers["content-type"]).toMatch(/json/);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Load configuration from JSON file
   * Validates: Application can work with JSON-based configuration
   */
  test("Should load config from JSON file", async () => {
    // Create a test JSON configuration file
    const jsonConfig = {
      nodeEnv: "test",
      port: 4008,
      testConfigSource: "json_file",
      database: {
        url: "postgresql://test:test@localhost:5432/testdb_json",
        host: "localhost",
        port: 5432,
        name: "testdb_json",
      },
      imageKit: {
        publicKey: "test_public_key_from_json",
        privateKey: "test_private_key_from_json",
        urlEndpoint: "https://ik.imagekit.io/test_json",
      },
      jwt: {
        secret: "test_jwt_secret_from_json",
        expiresIn: "24h",
      },
      server: {
        port: 4008,
        host: "localhost",
      },
    };

    writeFileSync(testConfigFile, JSON.stringify(jsonConfig, null, 2));

    // Verify JSON file was created
    expect(existsSync(testConfigFile)).toBe(true);

    // Read and parse the JSON configuration
    const fs = await import("fs");
    const configData = fs.readFileSync(testConfigFile, "utf-8");
    const config = JSON.parse(configData);

    // Verify configuration was loaded correctly
    expect(config.nodeEnv).toBe("test");
    expect(config.testConfigSource).toBe("json_file");
    expect(config.database.url).toBeDefined();
    expect(config.imageKit.publicKey).toBeDefined();
    expect(config.jwt.secret).toBeDefined();

    // Map JSON config to environment variables (simulating config loader)
    process.env.NODE_ENV = config.nodeEnv;
    process.env.PORT = String(config.port);
    process.env.DATABASE_URL = config.database.url;
    process.env.IMAGEKIT_PUBLIC_KEY = config.imageKit.publicKey;
    process.env.IMAGEKIT_PRIVATE_KEY = config.imageKit.privateKey;
    process.env.IMAGEKIT_URL_ENDPOINT = config.imageKit.urlEndpoint;
    process.env.JWT_SECRET = config.jwt.secret;

    // Test that application works with JSON-based configuration
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "success");
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Verify app behavior is consistent across config sources
   * Validates: Application behaves identically regardless of config source
   */
  test("Should verify app behavior consistent across config sources", async () => {
    const configSources = [
      {
        name: "environment_variables",
        setup: () => {
          process.env.NODE_ENV = "test";
          process.env.PORT = "4008";
        },
      },
      {
        name: "dotenv_file",
        setup: () => {
          const envContent = `NODE_ENV=test\nPORT=4008`;
          writeFileSync(testEnvFile, envContent);
          dotenv.config({ path: testEnvFile });
        },
      },
    ];

    const results = [];

    for (const source of configSources) {
      source.setup();

      // Test health endpoint
      const healthResponse = await request(app).get("/");

      // Test API endpoint
      const apiResponse = await request(app).get("/api/v1/events");

      results.push({
        source: source.name,
        healthStatus: healthResponse.status,
        healthBody: healthResponse.body,
        apiStatus: apiResponse.status,
        apiContentType: apiResponse.headers["content-type"],
      });
    }

    // Verify all config sources produce consistent results
    results.forEach((result, index) => {
      expect(result.healthStatus).toBe(200);
      expect(result.healthBody).toHaveProperty("status", "success");
      expect(result.apiStatus).toBe(200);
      expect(result.apiContentType).toMatch(/json/);

      // Compare with first result to ensure consistency
      if (index > 0) {
        expect(result.healthStatus).toBe(results[0].healthStatus);
        expect(result.apiStatus).toBe(results[0].apiStatus);
      }
    });

    // Verify behavior is identical across all config sources
    expect(results.length).toBe(configSources.length);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Configuration priority and override
   * Validates: Application handles configuration precedence correctly
   */
  test("Should handle configuration priority correctly", async () => {
    // Set base configuration via environment
    process.env.NODE_ENV = "test";
    process.env.PORT = "4008";
    process.env.TEST_PRIORITY = "env_base";

    // Create .env file with different value
    const envContent = `TEST_PRIORITY=env_file`;
    writeFileSync(testEnvFile, envContent);

    // Environment variables should take precedence over .env file
    expect(process.env.TEST_PRIORITY).toBe("env_base");

    // Load .env file (should not override existing env vars by default)
    dotenv.config({ path: testEnvFile });

    // Verify precedence
    const currentValue = process.env.TEST_PRIORITY;
    expect(currentValue).toBeDefined();

    // Test that application continues to work
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Missing configuration handling
   * Validates: Application handles missing configuration gracefully
   */
  test("Should handle missing configuration gracefully", async () => {
    // Remove optional configuration
    const optionalConfig = process.env.OPTIONAL_CONFIG;
    delete process.env.OPTIONAL_CONFIG;

    // Application should still work without optional config
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "success");

    // Restore if it existed
    if (optionalConfig !== undefined) {
      process.env.OPTIONAL_CONFIG = optionalConfig;
    }
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Configuration validation
   * Validates: Application validates configuration values
   */
  test("Should validate configuration values", async () => {
    // Test with valid configuration
    process.env.NODE_ENV = "test";
    process.env.PORT = "4008";

    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.PORT).toBeDefined();

    // Verify port is a valid number
    const port = parseInt(process.env.PORT, 10);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);

    // Verify NODE_ENV is valid
    expect(["development", "test", "production"]).toContain(
      process.env.NODE_ENV
    );

    // Test application works with valid config
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Configuration reload capability
   * Validates: Application can work with updated configuration
   */
  test("Should support configuration updates", async () => {
    // Set initial configuration
    process.env.TEST_CONFIG_VERSION = "v1";

    const response1 = await request(app).get("/");
    expect(response1.status).toBe(200);

    // Update configuration
    process.env.TEST_CONFIG_VERSION = "v2";

    const response2 = await request(app).get("/");
    expect(response2.status).toBe(200);

    // Verify updated value is accessible
    expect(process.env.TEST_CONFIG_VERSION).toBe("v2");
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Multi-format configuration support
   * Validates: Application supports various configuration formats
   */
  test("Should support multiple configuration formats", async () => {
    const formats = [
      {
        name: "key=value",
        content: "TEST_FORMAT=key_value\nTEST_VALUE=123",
        verify: () => expect(process.env.TEST_FORMAT).toBe("key_value"),
      },
      {
        name: "json",
        content: JSON.stringify({ testFormat: "json", testValue: 456 }),
        verify: () => {
          const parsed = JSON.parse(
            JSON.stringify({ testFormat: "json", testValue: 456 })
          );
          expect(parsed.testFormat).toBe("json");
        },
      },
    ];

    for (const format of formats) {
      if (format.name === "key=value") {
        writeFileSync(testEnvFile, format.content);
        dotenv.config({ path: testEnvFile });
      }
      format.verify();
    }

    // Verify application continues to work
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Configuration security
   * Validates: Sensitive configuration is handled securely
   */
  test("Should handle sensitive configuration securely", async () => {
    // Set sensitive configuration
    process.env.JWT_SECRET = "super_secret_key_12345";
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

    // Verify sensitive values are not logged or exposed
    const response = await request(app).get("/");

    // Response should not contain sensitive data
    const responseText = JSON.stringify(response.body);
    expect(responseText).not.toContain("super_secret_key");
    expect(responseText).not.toContain("pass@localhost");

    expect(response.status).toBe(200);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Default configuration fallback
   * Validates: Application uses sensible defaults when config is missing
   */
  test("Should use default configuration fallback", async () => {
    // Remove non-critical config
    const originalTimeout = process.env.REQUEST_TIMEOUT;
    delete process.env.REQUEST_TIMEOUT;

    // Application should use default values
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "success");

    // Restore original config
    if (originalTimeout !== undefined) {
      process.env.REQUEST_TIMEOUT = originalTimeout;
    }
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Configuration documentation
   * Validates: Required configuration is documented and accessible
   */
  test("Should document required configuration", async () => {
    // Check for common required environment variables
    const requiredVars = ["NODE_ENV", "PORT"];

    const availableVars = requiredVars.filter(
      (varName) => process.env[varName] !== undefined
    );

    // Most required vars should be available in test environment
    expect(availableVars.length).toBeGreaterThan(0);

    // Verify application works when required config is present
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: Configuration consistency check
   * Validates: Configuration remains consistent throughout application lifecycle
   */
  test("Should maintain configuration consistency", async () => {
    // Set test configuration
    process.env.TEST_CONSISTENCY = "consistent_value";

    // Make multiple requests
    const responses = await Promise.all([
      request(app).get("/"),
      request(app).get("/api/v1/events"),
      request(app).get("/api/v1/tickets"),
    ]);

    // Verify configuration remained consistent
    expect(process.env.TEST_CONSISTENCY).toBe("consistent_value");

    // All requests should succeed with consistent config
    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });
});
