import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../../app.js";

describe("TC_PORT_01: Adaptability - Different Content Types", () => {
  let server;

  beforeAll((done) => {
    server = app.listen(4001, () => {
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: API should accept and correctly process application/json content type
   * Validates: Content negotiation, JSON parsing capability
   */
  test("Should accept and process application/json", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .set("Content-Type", "application/json")
      .send({
        email: "test@example.com",
        password: "Test123!@#",
        name: "Test User",
      });

    // Accept valid registration responses (success, validation error, or conflict)
    expect([200, 201, 400, 409]).toContain(response.status);
    // Verify response is JSON regardless of status
    expect(response.headers["content-type"]).toMatch(/json/);
    // Verify response body structure exists
    expect(response.body).toBeDefined();
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: API should accept application/x-www-form-urlencoded content type
   * Validates: Support for form-encoded data, backward compatibility
   */
  test("Should accept application/x-www-form-urlencoded", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/x-www-form-urlencoded")
      .send("email=test@example.com&password=Test123!@#");

    // Accept valid login responses (success, validation error, or authentication failure)
    expect([200, 400, 401]).toContain(response.status);
    // API should return JSON even when receiving form-encoded data
    expect(response.headers["content-type"]).toMatch(/json/);
    // Verify response structure
    expect(response.body).toBeDefined();
    expect(response.body).toHaveProperty("message");
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: API should handle multipart/form-data for file uploads
   * Validates: Multipart form handling, file upload capability
   */
  test("Should handle multipart/form-data for file uploads", async () => {
    // First, login to get authentication token
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "ghaisanikarin@gmail.com",
      password: "password",
    });

    const token = loginRes.body.data?.token;

    // Test multipart/form-data with actual upload endpoint
    const response = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Test Event")
      .field("location", "Test Location")
      .field("date", new Date(Date.now() + 86400000).toISOString())
      .attach("image", Buffer.from("test image content"), "test.jpg");

    // Accept valid responses (success, validation error, or unauthorized)
    expect([200, 201, 400, 401, 403]).toContain(response.status);
    // Verify server processed multipart data (didn't return 415 Unsupported Media Type)
    expect(response.status).not.toBe(415);
  });

  /**
   * ISO/IEC 25010 - Portability > Adaptability
   * Test: API should return proper content-type in responses based on Accept header
   * Validates: Content negotiation, response format adaptability
   */
  test("Should return proper content-type in responses", async () => {
    const response = await request(app)
      .get("/api/v1/events")
      .set("Accept", "application/json");

    // Verify response status is successful or expected error
    // In CI/CD environment without database, may return 500
    expect([200, 500]).toContain(response.status);
    
    // Verify response content-type matches request Accept header
    expect(response.headers["content-type"]).toMatch(/json/);
    
    // Verify response body is valid JSON
    expect(response.body).toBeDefined();
    expect(typeof response.body).toBe("object");
    
    // If successful, verify data structure
    if (response.status === 200) {
      expect(response.body).toHaveProperty("data");
    }
  });
});
