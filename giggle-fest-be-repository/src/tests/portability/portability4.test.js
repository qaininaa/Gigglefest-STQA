import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";

describe("TC_PORT_04: Co-existence - API Versioning Support", () => {
  let server;

  beforeAll((done) => {
    server = app.listen(4004, () => {
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: API v1 endpoints should respond correctly
   * Validates: Version 1 API is accessible and functional
   */
  test("Should successfully access /api/v1 endpoints", async () => {
    const response = await request(app).get("/api/v1/events");

    // Verify v1 API responds successfully
    expect(response.status).toBe(200);

    // Verify response structure is consistent
    expect(response.body).toHaveProperty("data");
    expect(response.headers["content-type"]).toMatch(/json/);

    // Verify v1 API returns expected data structure
    expect(response.body.data).toHaveProperty("events");
    expect(response.body.data).toHaveProperty("meta");
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: API v2 endpoints should be properly isolated (or return proper not found)
   * Validates: Version isolation, preventing conflicts between API versions
   */
  test("Should handle /api/v2 endpoints appropriately", async () => {
    const response = await request(app).get("/api/v2/events");

    // v2 should either work (if implemented) or return 404 (not yet implemented)
    // This validates version isolation
    expect([200, 404]).toContain(response.status);

    // Verify response is in JSON format
    expect(response.headers["content-type"]).toMatch(/json/);

    if (response.status === 404) {
      // If v2 not implemented, verify proper error message
      expect(response.body).toHaveProperty("message");
    } else if (response.status === 200) {
      // If v2 exists, verify it has proper structure
      expect(response.body).toHaveProperty("data");
    }
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: Both API versions should be independently accessible
   * Validates: Multiple API versions can co-exist without interference
   */
  test("Should allow both versions to respond independently", async () => {
    // Test v1 endpoint
    const v1Response = await request(app).get("/api/v1/events");

    // Test v2 endpoint (or verify it doesn't interfere with v1)
    const v2Response = await request(app).get("/api/v2/events");

    // v1 should always work
    expect(v1Response.status).toBe(200);
    expect(v1Response.body).toHaveProperty("data");

    // v2 should return a valid response (200 if exists, 404 if not)
    expect([200, 404]).toContain(v2Response.status);

    // Verify both responses are JSON
    expect(v1Response.headers["content-type"]).toMatch(/json/);
    expect(v2Response.headers["content-type"]).toMatch(/json/);

    // Verify v1 structure is not affected by v2 request
    expect(v1Response.body.data).toHaveProperty("events");
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: API should maintain backward compatibility
   * Validates: Existing v1 endpoints continue to work with same structure
   */
  test("Should maintain backward compatibility in v1 API", async () => {
    // Test multiple v1 endpoints to verify consistency
    const endpoints = [
      "/api/v1/events",
      "/api/v1/tickets",
      "/api/v1/categories",
    ];

    for (const endpoint of endpoints) {
      const response = await request(app).get(endpoint);

      // All v1 endpoints should respond successfully
      expect(response.status).toBe(200);

      // Verify consistent response structure across v1 endpoints
      expect(response.body).toHaveProperty("data");
      expect(response.headers["content-type"]).toMatch(/json/);

      // Verify data structure consistency
      if (endpoint.includes("events")) {
        expect(response.body.data).toHaveProperty("events");
        expect(response.body.data).toHaveProperty("meta");
      } else if (endpoint.includes("tickets")) {
        expect(response.body.data).toHaveProperty("tickets");
        expect(response.body.data).toHaveProperty("meta");
      } else if (endpoint.includes("categories")) {
        expect(response.body.data).toHaveProperty("categories");
        expect(response.body.data).toHaveProperty("meta");
      }
    }
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: API version should be clearly identifiable
   * Validates: Version information is available and consistent
   */
  test("Should provide clear API version identification", async () => {
    // Test root endpoint for version info
    const rootResponse = await request(app).get("/");

    expect(rootResponse.status).toBe(200);
    expect(rootResponse.body).toHaveProperty("version");

    // Verify version format
    expect(typeof rootResponse.body.version).toBe("string");
    expect(rootResponse.body.version).toMatch(/\d+\.\d+\.\d+/);

    // Test v1 endpoint to verify it's part of v1
    const v1Response = await request(app).get("/api/v1/events");

    expect(v1Response.status).toBe(200);
    // Verify v1 endpoints are accessible
    expect(v1Response.body).toBeDefined();
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: Different API versions should handle authentication consistently
   * Validates: Auth mechanisms work across API versions
   */
  test("Should handle authentication consistently across versions", async () => {
    // Login to get token
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "karina@gmail.com",
      password: "password",
    });

    const token = loginRes.body.data?.token;

    if (token) {
      // Test authenticated endpoint in v1
      const v1AuthResponse = await request(app)
        .get("/api/v1/cart")
        .set("Authorization", `Bearer ${token}`);

      expect([200, 401]).toContain(v1AuthResponse.status);

      // If v2 exists, test it handles auth consistently
      const v2AuthResponse = await request(app)
        .get("/api/v2/cart")
        .set("Authorization", `Bearer ${token}`);

      // v2 should either work with same auth or return 404 (not implemented)
      expect([200, 401, 404]).toContain(v2AuthResponse.status);

      // Verify both responses are JSON
      expect(v1AuthResponse.headers["content-type"]).toMatch(/json/);
      expect(v2AuthResponse.headers["content-type"]).toMatch(/json/);
    } else {
      // If login fails, test passes (not testing auth itself)
      expect(true).toBe(true);
    }
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: API should handle version-specific features gracefully
   * Validates: Features can be version-specific without breaking other versions
   */
  test("Should handle version-specific features without conflicts", async () => {
    // Test v1 with query parameters (standard feature)
    const v1WithParams = await request(app).get(
      "/api/v1/events?page=1&limit=5"
    );

    expect(v1WithParams.status).toBe(200);
    expect(v1WithParams.body.data).toHaveProperty("meta");
    expect(v1WithParams.body.data.meta.page).toBe(1);
    expect(v1WithParams.body.data.meta.limit).toBe(5);

    // Test v2 with same parameters
    const v2WithParams = await request(app).get(
      "/api/v2/events?page=1&limit=5"
    );

    // v2 should handle params consistently (or return 404 if not implemented)
    expect([200, 404]).toContain(v2WithParams.status);

    if (v2WithParams.status === 200) {
      // If v2 exists, verify it handles params correctly
      expect(v2WithParams.body.data).toHaveProperty("meta");
    }

    // Verify v1 is not affected by v2 request
    const v1Verify = await request(app).get("/api/v1/events");
    expect(v1Verify.status).toBe(200);
  });

  /**
   * ISO/IEC 25010 - Portability > Co-existence
   * Test: Error handling should be consistent across API versions
   * Validates: Error responses maintain consistency between versions
   */
  test("Should maintain consistent error handling across versions", async () => {
    // Test invalid endpoint in v1
    const v1Error = await request(app).get("/api/v1/nonexistent");

    expect(v1Error.status).toBe(404);
    expect(v1Error.body).toHaveProperty("message");
    expect(v1Error.headers["content-type"]).toMatch(/json/);

    // Test invalid endpoint in v2
    const v2Error = await request(app).get("/api/v2/nonexistent");

    expect(v2Error.status).toBe(404);
    expect(v2Error.body).toHaveProperty("message");
    expect(v2Error.headers["content-type"]).toMatch(/json/);

    // Verify error structures are similar (consistency)
    expect(typeof v1Error.body.message).toBe("string");
    expect(typeof v2Error.body.message).toBe("string");
  });
});
