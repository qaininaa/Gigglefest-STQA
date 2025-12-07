/**
 * TC_SEC_02: JWT Token Validation
 *
 * Test Scenario: Verify JWT token validation
 * Test Steps:
 *   1. Generate a valid JWT token
 *   2. Tamper with the token payload
 *   3. Call a protected endpoint using the modified token
 *   4. Confirm the request is rejected
 *
 * Expected Result: Tampered tokens must be rejected with 401 Unauthorized.
 */

import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseURL = process.env.BASE_URL || "http://localhost:8080";

describe("TC_SEC_02: JWT Token Validation", () => {
  let validToken;
  let testUserId;
  const testUser = {
    email: `test.sec02.${Date.now()}@example.com`,
    password: "SecurePassword123!",
    name: "Security Test User 02",
    age: 25,
    phoneNumber: "081234567890",
  };

  beforeAll(async () => {
    // Create test user
    const registerResponse = await request(baseURL)
      .post("/api/v1/auth/register")
      .send(testUser);

    if (registerResponse.status !== 201) {
      throw new Error(
        `Registration failed: ${JSON.stringify(registerResponse.body)}`
      );
    }

    testUserId = registerResponse.body.data.user.id;

    // Verify the user in the database directly (bypass email verification)
    await prisma.user.update({
      where: { id: testUserId },
      data: { isVerified: true },
    });

    // Login to get valid token
    const loginResponse = await request(baseURL)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    if (loginResponse.status !== 200 || !loginResponse.body.data?.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.body)}`);
    }

    validToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }
    await prisma.$disconnect();
  });

  test("Step 1: Generate a valid JWT token", () => {
    expect(validToken).toBeDefined();
    expect(typeof validToken).toBe("string");
    expect(validToken.split(".").length).toBe(3); // JWT has 3 parts

    // Verify token structure
    const decoded = jwt.decode(validToken);
    expect(decoded).toHaveProperty("id");
    expect(decoded).toHaveProperty("email");
  });

  test("Step 2 & 3: Tamper with token payload - modify user ID", async () => {
    // Decode the valid token
    const decoded = jwt.decode(validToken);

    // Tamper with the payload - change user ID
    const tamperedPayload = {
      ...decoded,
      id: 99999, // Change to non-existent ID
    };

    // Get the JWT secret from environment (we'll use a wrong secret to simulate tampering)
    // Re-sign with modified payload but keep the original signature
    const [header, , signature] = validToken.split(".");
    const tamperedToken = `${header}.${Buffer.from(
      JSON.stringify(tamperedPayload)
    )
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")}.${signature}`;

    // Try to access protected endpoint with tampered token
    const response = await request(baseURL)
      .get("/api/v1/users/profile")
      .set("Authorization", `Bearer ${tamperedToken}`)
      .expect(401);

    expect(response.body.status).toBe("error");
  });

  test("Step 4: Tamper with token - modify email", async () => {
    const decoded = jwt.decode(validToken);

    // Tamper with email
    const tamperedPayload = {
      ...decoded,
      email: "hacker@malicious.com",
    };

    const [header, , signature] = validToken.split(".");
    const tamperedToken = `${header}.${Buffer.from(
      JSON.stringify(tamperedPayload)
    )
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")}.${signature}`;

    const response = await request(baseURL)
      .get("/api/v1/users/profile")
      .set("Authorization", `Bearer ${tamperedToken}`)
      .expect(401);

    expect(response.body.status).toBe("error");
  });

  test("Step 4: Tamper with token - modify role to admin", async () => {
    const decoded = jwt.decode(validToken);

    // Attempt privilege escalation
    const tamperedPayload = {
      ...decoded,
      role: "admin",
    };

    const [header, , signature] = validToken.split(".");
    const tamperedToken = `${header}.${Buffer.from(
      JSON.stringify(tamperedPayload)
    )
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")}.${signature}`;

    const response = await request(baseURL)
      .get("/api/v1/users/profile")
      .set("Authorization", `Bearer ${tamperedToken}`)
      .expect(401);

    expect(response.body.status).toBe("error");
  });

  test("Step 4: Completely fabricated token", async () => {
    // Create a completely fake token with wrong secret
    const fakePayload = {
      id: testUserId,
      email: testUser.email,
      role: "admin",
    };

    const fakeToken = jwt.sign(fakePayload, "wrong-secret-key", {
      expiresIn: "1h",
    });

    const response = await request(baseURL)
      .get("/api/v1/users/profile")
      .set("Authorization", `Bearer ${fakeToken}`)
      .expect(401);

    expect(response.body.status).toBe("error");
  });

  test("Step 4: Token with modified signature", async () => {
    // Modify the signature part
    const [header, payload] = validToken.split(".");
    const fakeSignature = "fakesignature123456";
    const tamperedToken = `${header}.${payload}.${fakeSignature}`;

    const response = await request(baseURL)
      .get("/api/v1/users/profile")
      .set("Authorization", `Bearer ${tamperedToken}`)
      .expect(401);

    expect(response.body.status).toBe("error");
  });

  test("Verify valid token still works", async () => {
    // Confirm that a valid, untampered token is still accepted (does not return 401)
    const response = await request(baseURL)
      .get("/api/v1/users/profile")
      .set("Authorization", `Bearer ${validToken}`);

    // Valid token should NOT return 401 (unauthorized)
    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
  });
});
