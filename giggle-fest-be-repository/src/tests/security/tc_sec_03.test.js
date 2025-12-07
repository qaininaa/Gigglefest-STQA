/**
 * TC_SEC_03: Authentication Required for Protected Routes
 *
 * Test Scenario: Verify authentication is required for protected routes
 * Test Steps:
 *   1. Call protected endpoints with no token
 *   2. Call with an expired token
 *   3. Call with an invalid token
 *   4. Verify all are rejected
 *
 * Expected Result: All unauthorized or invalid requests must return 401/403.
 */

import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseURL = process.env.BASE_URL || "http://localhost:8080";

describe("TC_SEC_03: Authentication Required for Protected Routes", () => {
  let validToken;
  let testUserId;
  const testUser = {
    email: `test.sec03.${Date.now()}@example.com`,
    password: "SecurePassword123!",
    name: "Security Test User 03",
    age: 25,
    phoneNumber: "081234567890",
  };

  // List of protected endpoints to test
  const protectedEndpoints = [
    { method: "get", path: "/api/v1/users/profile" },
    { method: "put", path: "/api/v1/users/profile" },
    { method: "get", path: "/api/v1/notifications" },
    { method: "post", path: "/api/v1/cart" },
    { method: "get", path: "/api/v1/cart" },
  ];

  beforeAll(async () => {
    // Create test user and get valid token
    const registerResponse = await request(baseURL)
      .post("/api/v1/auth/register")
      .send(testUser);

    testUserId = registerResponse.body.data.user.id;

    // Verify the user in the database directly (bypass email verification)
    await prisma.user.update({
      where: { id: testUserId },
      data: { isVerified: true },
    });

    const loginResponse = await request(baseURL)
      .post("/api/v1/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

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

  describe("Step 1: Call protected endpoints with no token", () => {
    test("GET /api/v1/users/profile - No token", async () => {
      const response = await request(baseURL)
        .get("/api/v1/users/profile")
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });

      expect(response.body.status).toBe("error");
    });

    test("PUT /api/v1/users/profile - No token", async () => {
      const response = await request(baseURL)
        .put("/api/v1/users/profile")
        .send({ name: "Hacker" })
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });

      expect(response.body.status).toBe("error");
    });

    test("GET /api/v1/notifications - No token", async () => {
      const response = await request(baseURL)
        .get("/api/v1/notifications")
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });

      expect(response.body.status).toBe("error");
    });

    test("GET /api/v1/cart - No token", async () => {
      const response = await request(baseURL)
        .get("/api/v1/cart")
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });

      expect(response.body.status).toBe("error");
    });

    test("POST /api/v1/cart - No token", async () => {
      const response = await request(baseURL)
        .post("/api/v1/cart")
        .send({ ticketId: 1, quantity: 2 })
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });

      expect(response.body.status).toBe("error");
    });
  });

  describe("Step 2: Call with an expired token", () => {
    let expiredToken;

    beforeAll(() => {
      // Create an expired token (expired 1 hour ago)
      const payload = {
        id: testUserId,
        email: testUser.email,
        role: testUser.role,
      };

      // Sign with a past expiration time
      expiredToken = jwt.sign(payload, process.env.JWT_SECRET || "secret", {
        expiresIn: "-1h", // Expired 1 hour ago
      });
    });

    test("GET /api/v1/users/profile - Expired token", async () => {
      const response = await request(baseURL)
        .get("/api/v1/users/profile")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });

      expect(response.body.status).toBe("error");
    });

    test("PUT /api/v1/users/profile - Expired token", async () => {
      const response = await request(baseURL)
        .put("/api/v1/users/profile")
        .set("Authorization", `Bearer ${expiredToken}`)
        .send({ name: "Updated Name" })
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });

      expect(response.body.status).toBe("error");
    });

    test("GET /api/v1/cart - Expired token", async () => {
      const response = await request(baseURL)
        .get("/api/v1/cart")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });

      expect(response.body.status).toBe("error");
    });
  });

  describe("Step 3: Call with an invalid token", () => {
    const invalidTokens = [
      { name: "Malformed token", token: "not.a.valid.jwt.token" },
      { name: "Empty token", token: "" },
      { name: "Random string", token: "randomstring123456" },
      {
        name: "Missing signature",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0",
      },
      { name: "Wrong format", token: "Bearer invalidtoken" },
    ];

    invalidTokens.forEach(({ name, token }) => {
      test(`GET /api/v1/users/profile - ${name}`, async () => {
        const response = await request(baseURL)
          .get("/api/v1/users/profile")
          .set("Authorization", `Bearer ${token}`)
          .expect((res) => {
            expect([401, 403]).toContain(res.status);
          });

        expect(response.body.status).toBe("error");
      });
    });

    test("Invalid Authorization header format", async () => {
      const response = await request(baseURL)
        .get("/api/v1/users/profile")
        .set("Authorization", validToken) // Missing "Bearer" prefix
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });

      expect(response.body.status).toBe("error");
    });

    test("Token signed with wrong secret", async () => {
      const fakeToken = jwt.sign(
        { id: testUserId, email: testUser.email },
        "wrong-secret-key",
        { expiresIn: "1h" }
      );

      const response = await request(baseURL)
        .get("/api/v1/users/profile")
        .set("Authorization", `Bearer ${fakeToken}`)
        .expect((res) => {
          expect([401, 403]).toContain(res.status);
        });

      expect(response.body.status).toBe("error");
    });
  });

  describe("Step 4: Verify all unauthorized requests are rejected", () => {
    test("Summary: All protected endpoints reject no token", async () => {
      const results = await Promise.all(
        protectedEndpoints.map(async (endpoint) => {
          const response = await request(baseURL)[endpoint.method](
            endpoint.path
          );
          return {
            endpoint: `${endpoint.method.toUpperCase()} ${endpoint.path}`,
            statusCode: response.status,
            isRejected: [401, 403].includes(response.status),
          };
        })
      );

      // All endpoints must reject unauthorized access
      results.forEach((result) => {
        expect(result.isRejected).toBe(true);
      });

      // Log results for documentation
      console.log("\nProtected Endpoints Security Check:");
      results.forEach((result) => {
        console.log(
          `  ${result.endpoint}: ${result.statusCode} ${
            result.isRejected ? "✓" : "✗"
          }`
        );
      });
    });

    test("Verify valid token still grants access", async () => {
      const response = await request(baseURL)
        .get("/api/v1/users/profile")
        .set("Authorization", `Bearer ${validToken}`);

      // Valid token should NOT return 401/403 (unauthorized)
      expect(response.status).not.toBe(401);
      expect(response.status).not.toBe(403);
    });
  });
});
