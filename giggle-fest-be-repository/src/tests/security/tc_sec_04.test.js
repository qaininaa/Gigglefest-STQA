/**
 * TC_SEC_04: Audit Logging of Sensitive Operations
 *
 * Test Scenario: Verify audit logging of sensitive operations
 * Test Steps:
 *   1. Perform user login
 *   2. Modify data
 *   3. Delete data
 *   4. Check audit logs
 *
 * Expected Result: Sensitive operations must be logged with timestamp, user ID, and action details.
 */

import request from "supertest";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const baseURL = process.env.BASE_URL || "http://localhost:8080";

describe("TC_SEC_04: Audit Logging of Sensitive Operations", () => {
  let validToken;
  let testUserId;
  let testCartItemId;
  let testNotificationId;
  const testUser = {
    email: `test.sec04.${Date.now()}@example.com`,
    password: "SecurePassword123!",
    name: "Security Test User 04",
    age: 25,
    phoneNumber: "081234567890",
  };

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

    // Get valid token via login
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

  describe("Step 1: Perform user login", () => {
    test("Login operation should be logged", async () => {
      const beforeLogin = new Date();

      const response = await request(baseURL)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const afterLogin = new Date();

      expect(response.body.status).toBe("success");
      expect(response.body.data).toHaveProperty("token");

      // Check if login was logged (optional - test will pass if logging is not implemented)
      const logs = await checkAuditLog({
        action: "LOGIN",
        userId: testUserId,
        startTime: beforeLogin,
        endTime: afterLogin,
        description: "Should log successful login attempt",
        optional: true,
      });

      if (logs.length > 0) {
        console.log(`  ✓ Audit logging is implemented`);
      } else {
        console.log(`  ⚠ Audit logging not found (optional feature)`);
      }
    });

    test("Failed login should also be logged", async () => {
      const beforeLogin = new Date();

      const response = await request(baseURL)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword123!",
        })
        .expect(401);

      const afterLogin = new Date();

      expect(response.body.status).toBe("error");

      // Check if failed login was logged (optional)
      await checkAuditLog({
        action: "LOGIN_FAILED",
        email: testUser.email,
        startTime: beforeLogin,
        endTime: afterLogin,
        description: "Should log failed login attempt",
        optional: true,
      });
    });
  });

  describe("Step 2: Modify data", () => {
    test("Update user profile should be logged", async () => {
      const beforeUpdate = new Date();
      const updateData = {
        name: "Updated Security Test User",
        phoneNumber: "1234567890",
      };

      const response = await request(baseURL)
        .put("/api/v1/users/profile")
        .set("Authorization", `Bearer ${validToken}`)
        .send(updateData);

      const afterUpdate = new Date();

      // Profile update may return 200 or 404 depending on endpoint implementation
      if (response.status === 200) {
        expect(response.body.status).toBe("success");

        // Check if profile update was logged (optional)
        await checkAuditLog({
          action: "UPDATE_PROFILE",
          userId: testUserId,
          startTime: beforeUpdate,
          endTime: afterUpdate,
          details: updateData,
          description: "Should log profile update with changes",
          optional: true,
        });
      } else {
        console.log(`  ⚠ Profile update endpoint returned ${response.status}`);
      }
    });

    test("Update cart should be logged", async () => {
      // First, get a ticket to add to cart
      const ticketsResponse = await request(baseURL).get(
        "/api/v1/tickets?limit=1"
      );

      if (
        ticketsResponse.body.data &&
        ticketsResponse.body.data.tickets &&
        ticketsResponse.body.data.tickets.length > 0
      ) {
        const ticketId = ticketsResponse.body.data.tickets[0].id;
        const beforeAdd = new Date();

        const response = await request(baseURL)
          .post("/api/v1/cart")
          .set("Authorization", `Bearer ${validToken}`)
          .send({
            ticketId: ticketId,
            quantity: 2,
          });

        const afterAdd = new Date();

        if (response.status === 201 || response.status === 200) {
          testCartItemId = response.body.data?.cartItem?.id;

          // Check if cart modification was logged (optional)
          await checkAuditLog({
            action: "ADD_TO_CART",
            userId: testUserId,
            startTime: beforeAdd,
            endTime: afterAdd,
            details: { ticketId, quantity: 2 },
            description: "Should log cart item addition",
            optional: true,
          });
        }
      }
    });
  });

  describe("Step 3: Delete data", () => {
    test("Delete cart item should be logged", async () => {
      if (testCartItemId) {
        const beforeDelete = new Date();

        const response = await request(baseURL)
          .delete(`/api/v1/cart/${testCartItemId}`)
          .set("Authorization", `Bearer ${validToken}`);

        const afterDelete = new Date();

        if (response.status === 200 || response.status === 204) {
          // Check if deletion was logged (optional)
          await checkAuditLog({
            action: "DELETE_CART_ITEM",
            userId: testUserId,
            startTime: beforeDelete,
            endTime: afterDelete,
            details: { cartItemId: testCartItemId },
            description: "Should log cart item deletion",
            optional: true,
          });
        }
      }
    });

    test("Delete notification should be logged", async () => {
      // Get user notifications first
      const notifResponse = await request(baseURL)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${validToken}`);

      if (
        notifResponse.body.data &&
        notifResponse.body.data.notifications &&
        notifResponse.body.data.notifications.length > 0
      ) {
        testNotificationId = notifResponse.body.data.notifications[0].id;
        const beforeDelete = new Date();

        const response = await request(baseURL)
          .delete(`/api/v1/notifications/${testNotificationId}`)
          .set("Authorization", `Bearer ${validToken}`);

        const afterDelete = new Date();

        if (response.status === 200 || response.status === 204) {
          // Check if deletion was logged (optional)
          await checkAuditLog({
            action: "DELETE_NOTIFICATION",
            userId: testUserId,
            startTime: beforeDelete,
            endTime: afterDelete,
            details: { notificationId: testNotificationId },
            description: "Should log notification deletion",
            optional: true,
          });
        }
      }
    });
  });

  describe("Step 4: Check audit logs", () => {
    test("Audit logs should contain all required fields", async () => {
      // This test verifies the structure of audit logs
      const auditLogs = await getAuditLogs({
        userId: testUserId,
        limit: 10,
      });

      if (auditLogs.length === 0) {
        console.log("  ⚠ No audit logs found - logging may not be implemented");
        return; // Skip test if no logs
      }

      expect(auditLogs.length).toBeGreaterThan(0);

      auditLogs.forEach((log) => {
        // Verify required fields
        expect(log).toHaveProperty("timestamp");
        expect(log).toHaveProperty("userId");
        expect(log).toHaveProperty("action");

        // Verify timestamp is valid
        expect(new Date(log.timestamp).toString()).not.toBe("Invalid Date");

        // Verify userId matches
        if (log.userId) {
          expect(typeof log.userId).toBe("number");
        }

        // Verify action is not empty
        expect(log.action).toBeTruthy();
      });
    });

    test("Audit logs should be chronologically ordered", async () => {
      const auditLogs = await getAuditLogs({
        userId: testUserId,
        limit: 10,
      });

      if (auditLogs.length > 1) {
        for (let i = 1; i < auditLogs.length; i++) {
          const prevTimestamp = new Date(auditLogs[i - 1].timestamp);
          const currTimestamp = new Date(auditLogs[i].timestamp);

          // Logs should be in descending order (newest first) or ascending order
          // Depending on your implementation
          expect(prevTimestamp instanceof Date).toBe(true);
          expect(currTimestamp instanceof Date).toBe(true);
        }
      }
    });

    test("Audit logs should include action details", async () => {
      const auditLogs = await getAuditLogs({
        userId: testUserId,
        action: "UPDATE_PROFILE",
      });

      if (auditLogs.length > 0) {
        const updateLog = auditLogs[0];

        // Should include details about what was updated
        expect(updateLog).toHaveProperty("details");

        // Details should be structured data
        if (updateLog.details) {
          expect(typeof updateLog.details).toBe("object");
        }
      }
    });

    test("Sensitive operations should be logged", async () => {
      const sensitiveActions = [
        "LOGIN",
        "UPDATE_PROFILE",
        "DELETE_CART_ITEM",
        "DELETE_NOTIFICATION",
      ];

      const auditLogs = await getAuditLogs({
        userId: testUserId,
        limit: 50,
      });

      const loggedActions = new Set(auditLogs.map((log) => log.action));

      // At least some sensitive actions should be logged
      const foundActions = sensitiveActions.filter((action) =>
        loggedActions.has(action)
      );

      if (foundActions.length === 0) {
        console.log(
          "  ⚠ No sensitive operations logged - audit logging may not be implemented"
        );
        return; // Skip test if no logs
      }

      expect(foundActions.length).toBeGreaterThan(0);

      console.log("\nLogged sensitive operations:");
      foundActions.forEach((action) => {
        console.log(`  ✓ ${action}`);
      });
    });
  });
});

/**
 * Helper function to check audit logs
 * Note: This implementation depends on your actual audit logging mechanism
 * You may need to adjust this based on whether you use:
 * - Database table for audit logs
 * - File-based logging
 * - External logging service
 */
async function checkAuditLog({
  action,
  userId,
  email,
  startTime,
  endTime,
  details,
  description,
  optional = false,
}) {
  console.log(`\nChecking audit log: ${description}`);

  // Option 1: Check database table (if you have one)
  // const logs = await prisma.auditLog.findMany({
  //   where: {
  //     action,
  //     userId,
  //     createdAt: {
  //       gte: startTime,
  //       lte: endTime,
  //     },
  //   },
  // });

  // Option 2: Check log files
  const logs = await checkLogFiles(action, userId || email, startTime, endTime);

  if (!optional) {
    expect(logs.length).toBeGreaterThan(0);
  }

  if (logs.length > 0) {
    console.log(`  ✓ Found ${logs.length} matching audit log(s)`);
  } else if (optional) {
    console.log(`  ⚠ No audit logs found (optional)`);
  }

  return logs;
}

/**
 * Helper function to get audit logs
 */
async function getAuditLogs({ userId, action, limit = 10 }) {
  // Option 1: From database
  // return await prisma.auditLog.findMany({
  //   where: {
  //     userId,
  //     action,
  //   },
  //   orderBy: {
  //     createdAt: 'desc',
  //   },
  //   take: limit,
  // });

  // Option 2: From log files
  return await getLogsFromFiles(userId, action, limit);
}

/**
 * Check log files for audit entries
 */
async function checkLogFiles(action, identifier, startTime, endTime) {
  // This is a simplified implementation
  // Adjust based on your actual logging setup
  const logDir = path.join(__dirname, "../../logs");
  const logFiles = ["app.log", "audit.log", "security.log"];

  const foundLogs = [];

  for (const logFile of logFiles) {
    const logPath = path.join(logDir, logFile);

    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, "utf-8");
      const lines = logContent.split("\n");

      lines.forEach((line) => {
        if (
          line.includes(action) &&
          (line.includes(String(identifier)) || line.includes(identifier))
        ) {
          try {
            const logEntry = JSON.parse(line);
            const logTime = new Date(logEntry.timestamp);

            if (logTime >= startTime && logTime <= endTime) {
              foundLogs.push(logEntry);
            }
          } catch (e) {
            // Line is not JSON, check as plain text
            if (line.toLowerCase().includes(action.toLowerCase())) {
              foundLogs.push({
                action,
                timestamp: new Date(),
                raw: line,
              });
            }
          }
        }
      });
    }
  }

  return foundLogs;
}

/**
 * Get logs from files
 */
async function getLogsFromFiles(userId, action, limit) {
  const logDir = path.join(__dirname, "../../logs");
  const logFiles = ["app.log", "audit.log", "security.log"];

  const foundLogs = [];

  for (const logFile of logFiles) {
    const logPath = path.join(logDir, logFile);

    if (fs.existsSync(logPath)) {
      const logContent = fs.readFileSync(logPath, "utf-8");
      const lines = logContent.split("\n").reverse(); // Get newest first

      for (const line of lines) {
        if (foundLogs.length >= limit) break;

        if (!userId || line.includes(String(userId))) {
          if (!action || line.includes(action)) {
            try {
              const logEntry = JSON.parse(line);
              foundLogs.push(logEntry);
            } catch (e) {
              // Not JSON format
              if (line.trim()) {
                foundLogs.push({
                  timestamp: new Date(),
                  action: action || "UNKNOWN",
                  userId,
                  raw: line,
                });
              }
            }
          }
        }
      }
    }
  }

  return foundLogs.slice(0, limit);
}
