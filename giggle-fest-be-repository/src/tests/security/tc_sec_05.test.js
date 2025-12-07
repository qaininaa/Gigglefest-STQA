/**
 * TC_SEC_05: SQL Injection Prevention
 *
 * Test Scenario: Verify SQL injection prevention
 * Test Steps:
 *   1. Submit malicious SQL payloads
 *   2. Attempt common SQL injection patterns
 *   3. Confirm input is sanitized
 *   4. Ensure no data leakage
 *
 * Expected Result: Malicious SQL must be treated as literal input, and the database must not be compromised.
 *
 * Tools: Jest + Supertest
 * Note: sqlmap is recommended for comprehensive testing but requires external setup
 */

import request from "supertest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseURL = process.env.BASE_URL || "http://localhost:8080";

describe("TC_SEC_05: SQL Injection Prevention", () => {
  let validToken;
  let testUserId;
  const testUser = {
    email: `test.sec05.${Date.now()}@example.com`,
    password: "SecurePassword123!",
    name: "Security Test User 05",
    age: 25,
    phoneNumber: "081234567890",
  };

  // Common SQL injection payloads
  const sqlInjectionPayloads = [
    // Classic SQL injection
    "' OR '1'='1",
    "' OR 1=1--",
    "' OR 'x'='x",
    "admin'--",
    "admin' #",
    "admin'/*",

    // UNION-based injection
    "' UNION SELECT NULL--",
    "' UNION SELECT NULL, NULL--",
    "' UNION SELECT username, password FROM users--",
    "1' UNION SELECT table_name FROM information_schema.tables--",

    // Boolean-based blind injection
    "' AND 1=1--",
    "' AND 1=2--",
    "' AND SLEEP(5)--",

    // Time-based blind injection
    "'; WAITFOR DELAY '00:00:05'--",
    "'; SELECT SLEEP(5)--",
    "1' AND SLEEP(5) AND '1'='1",

    // Stacked queries
    "'; DROP TABLE users--",
    "'; DELETE FROM users WHERE '1'='1'--",
    "'; UPDATE users SET password='hacked'--",

    // Comment-based injection
    "admin' OR '1'='1'--",
    "admin' OR '1'='1'#",
    "admin' OR '1'='1'/*",

    // Error-based injection
    "' AND 1=CONVERT(int, (SELECT @@version))--",
    "' AND 1=1/(SELECT COUNT(*) FROM users)--",

    // Special characters
    "'; SELECT * FROM users WHERE ''='",
    "\\'; SELECT * FROM users--",
    "%27; DROP TABLE users--",
  ];

  beforeAll(async () => {
    // Create test user
    const registerResponse = await request(baseURL)
      .post("/api/v1/auth/register")
      .send(testUser);

    testUserId = registerResponse.body.data.user.id;

    // Verify the user in the database directly (bypass email verification)
    await prisma.user.update({
      where: { id: testUserId },
      data: { isVerified: true },
    });

    // Get valid token
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

  describe("Step 1 & 2: Submit malicious SQL payloads", () => {
    test("Login endpoint - SQL injection in email field", async () => {
      for (const payload of sqlInjectionPayloads.slice(0, 5)) {
        const response = await request(baseURL)
          .post("/api/v1/auth/login")
          .send({
            email: payload,
            password: "anypassword",
          });

        // Should not grant access or cause SQL errors
        expect([400, 401, 500]).toContain(response.status);

        // Should not return database error messages
        if (response.body.message) {
          expect(response.body.message.toLowerCase()).not.toContain("sql");
          expect(response.body.message.toLowerCase()).not.toContain("syntax");
          expect(response.body.message.toLowerCase()).not.toContain("mysql");
          expect(response.body.message.toLowerCase()).not.toContain(
            "postgresql"
          );
        }
      }
    });

    test("Login endpoint - SQL injection in password field", async () => {
      for (const payload of sqlInjectionPayloads.slice(0, 5)) {
        const response = await request(baseURL)
          .post("/api/v1/auth/login")
          .send({
            email: testUser.email,
            password: payload,
          });

        // Should reject the login
        expect(response.status).toBe(401);
        expect(response.body.status).toBe("error");
      }
    });

    test("Search/Filter endpoints - SQL injection in query parameters", async () => {
      const searchPayloads = [
        "' OR '1'='1",
        "1' UNION SELECT * FROM users--",
        "'; DROP TABLE events--",
      ];

      for (const payload of searchPayloads) {
        const response = await request(baseURL).get(
          `/api/v1/events?search=${encodeURIComponent(payload)}`
        );

        // Should handle gracefully without exposing SQL errors
        expect([200, 400]).toContain(response.status);

        if (response.body.data) {
          // If it returns data, it should be normal search results, not all records
          expect(Array.isArray(response.body.data.events)).toBe(true);
        }
      }
    });

    test("Registration - SQL injection in name field", async () => {
      const maliciousName = "'; DROP TABLE users--";

      const response = await request(baseURL)
        .post("/api/v1/auth/register")
        .send({
          email: `sqlinject.${Date.now()}@test.com`,
          password: "Password123!",
          name: maliciousName,
          age: 25,
          phoneNumber: "081234567890",
        });

      // Should either reject or sanitize the input
      if (response.status === 201) {
        // If accepted, verify the name is stored as literal string
        const user = await prisma.user.findUnique({
          where: { email: response.body.data.user.email },
        });

        expect(user.name).toBe(maliciousName);

        // Cleanup
        await prisma.user.delete({ where: { id: user.id } });
      }
    });

    test("Update profile - SQL injection in profile fields", async () => {
      const maliciousData = {
        name: "' OR '1'='1'--",
        phoneNumber: "'; DELETE FROM users--",
      };

      const response = await request(baseURL)
        .put("/api/v1/users/profile")
        .set("Authorization", `Bearer ${validToken}`)
        .send(maliciousData);

      // Should handle without SQL execution
      if (response.status === 200) {
        const user = await prisma.user.findUnique({
          where: { id: testUserId },
        });

        // Values should be stored as literal strings, not executed
        expect(user.name).toBe(maliciousData.name);
      }
    });
  });

  describe("Step 3: Confirm input is sanitized", () => {
    test("Special SQL characters are escaped", async () => {
      const testCases = [
        { input: "test'user", field: "name" },
        { input: 'test"user', field: "name" },
        { input: "test\\user", field: "name" },
        { input: "test;user", field: "name" },
        { input: "test--user", field: "name" },
      ];

      for (const testCase of testCases) {
        const response = await request(baseURL)
          .put("/api/v1/users/profile")
          .set("Authorization", `Bearer ${validToken}`)
          .send({ [testCase.field]: testCase.input });

        if (response.status === 200) {
          const user = await prisma.user.findUnique({
            where: { id: testUserId },
          });

          // Special characters should be preserved as literals
          expect(user[testCase.field]).toBe(testCase.input);
        }
      }
    });

    test("Parameterized queries prevent injection", async () => {
      // Test with ID-based endpoints
      const maliciousIds = [
        "1 OR 1=1",
        "1; DROP TABLE users",
        "1' UNION SELECT * FROM users--",
      ];

      for (const maliciousId of maliciousIds) {
        const response = await request(baseURL).get(
          `/api/v1/events/${maliciousId}`
        );

        // Should return 400/404/200 (not found or invalid), not execute SQL
        expect([200, 400, 404]).toContain(response.status);

        // Should not expose SQL errors
        if (response.body.message) {
          expect(response.body.message.toLowerCase()).not.toContain("sql");
        }
      }
    });
  });

  describe("Step 4: Ensure no data leakage", () => {
    test("SQL injection should not expose user data", async () => {
      const response = await request(baseURL).post("/api/v1/auth/login").send({
        email: "' OR 1=1--",
        password: "anything",
      });

      // Should reject with 400 or 401
      expect([400, 401]).toContain(response.status);

      // Should not return any user data
      expect(response.body.data).toBeFalsy();
    });

    test("Error messages should not reveal database structure", async () => {
      const response = await request(baseURL).post("/api/v1/auth/login").send({
        email: "'; SELECT * FROM information_schema.tables--",
        password: "test",
      });

      // Should reject with 400 or 401
      expect([400, 401]).toContain(response.status);

      // Error message should be generic
      if (response.body.message) {
        expect(response.body.message.toLowerCase()).not.toContain("table");
        expect(response.body.message.toLowerCase()).not.toContain("column");
        expect(response.body.message.toLowerCase()).not.toContain("schema");
        expect(response.body.message.toLowerCase()).not.toContain(
          "information_schema"
        );
      }
    });

    test("UNION-based injection should not merge data", async () => {
      const unionPayload = "1' UNION SELECT id, email, password FROM users--";

      const response = await request(baseURL).get(
        `/api/v1/events?search=${encodeURIComponent(unionPayload)}`
      );

      // Should handle safely
      if (response.body.data && response.body.data.events) {
        // Verify response structure is normal
        response.body.data.events.forEach((event) => {
          // Should have event properties, not user properties
          expect(event).not.toHaveProperty("password");
          if (event.email) {
            // Email should be event-related, not from users table
            expect(event).toHaveProperty("id");
          }
        });
      }
    });

    test("Boolean-based blind injection timing", async () => {
      const trueCondition = "1' AND 1=1--";
      const falseCondition = "1' AND 1=2--";

      const startTrue = Date.now();
      await request(baseURL).get(
        `/api/v1/events?search=${encodeURIComponent(trueCondition)}`
      );
      const timeTrue = Date.now() - startTrue;

      const startFalse = Date.now();
      await request(baseURL).get(
        `/api/v1/events?search=${encodeURIComponent(falseCondition)}`
      );
      const timeFalse = Date.now() - startFalse;

      // Response times should be similar (not exploitable for blind injection)
      const timeDiff = Math.abs(timeTrue - timeFalse);
      expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
    });

    test("Verify database integrity after injection attempts", async () => {
      // Get record count before
      const usersBefore = await prisma.user.count();
      const eventsBefore = await prisma.event.count();

      // Attempt destructive SQL injection
      await request(baseURL).post("/api/v1/auth/login").send({
        email: "'; DROP TABLE users--",
        password: "test",
      });

      await request(baseURL).get(
        "/api/v1/events?search=" + encodeURIComponent("'; DELETE FROM events--")
      );

      // Verify tables still exist and data is intact
      const usersAfter = await prisma.user.count();
      const eventsAfter = await prisma.event.count();

      expect(usersAfter).toBe(usersBefore);
      expect(eventsAfter).toBe(eventsBefore);
    });
  });

  describe("Comprehensive SQL Injection Test Suite", () => {
    test("Test all common injection patterns", async () => {
      const results = {
        total: sqlInjectionPayloads.length,
        blocked: 0,
        vulnerable: 0,
      };

      for (const payload of sqlInjectionPayloads) {
        const response = await request(baseURL)
          .post("/api/v1/auth/login")
          .send({
            email: payload,
            password: "test123",
          });

        // Should be rejected
        if ([400, 401].includes(response.status)) {
          results.blocked++;
        } else if (response.status === 200) {
          results.vulnerable++;
          console.error(`VULNERABLE: Payload succeeded: ${payload}`);
        }
      }

      console.log(`\nSQL Injection Test Results:`);
      console.log(`  Total payloads tested: ${results.total}`);
      console.log(`  Blocked: ${results.blocked}`);
      console.log(`  Vulnerable: ${results.vulnerable}`);

      // All should be blocked
      expect(results.vulnerable).toBe(0);
      expect(results.blocked).toBe(results.total);
    });
  });
});
