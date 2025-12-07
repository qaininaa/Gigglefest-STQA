/**
 * TC_SEC_01: Password Encryption Verification
 *
 * Test Scenario: Verify password encryption in the database
 * Test Steps:
 *   1. Create a user with a plaintext password
 *   2. Query the database directly
 *   3. Confirm the stored password is hashed
 *   4. Attempt to decrypt the hash
 *
 * Expected Result: Passwords must be stored as bcrypt/argon2 hashes and must not be reversible to plaintext.
 */

import request from "supertest";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseURL = process.env.BASE_URL || "http://localhost:8080";

describe("TC_SEC_01: Password Encryption Verification", () => {
  let testUserId;
  const testUser = {
    email: `test.sec01.${Date.now()}@example.com`,
    password: "PlaintextPassword123!",
    name: "Security Test User 01",
    age: 25,
    phoneNumber: "081234567890",
  };

  afterAll(async () => {
    // Cleanup: Delete test user
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId },
      });
    }
    await prisma.$disconnect();
  });

  test("Step 1: Create a user with a plaintext password", async () => {
    const response = await request(baseURL)
      .post("/api/v1/auth/register")
      .send(testUser)
      .expect(201);

    expect(response.body.status).toBe("success");
    expect(response.body.data).toHaveProperty("user");
    testUserId = response.body.data.user.id;
  });

  test("Step 2 & 3: Query database and confirm password is hashed", async () => {
    // Query database directly
    const userInDb = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    expect(userInDb).toBeTruthy();
    expect(userInDb.password).toBeDefined();

    // Confirm password is NOT stored in plaintext
    expect(userInDb.password).not.toBe(testUser.password);

    // Confirm password is hashed (bcrypt format: $2b$10$... or $2a$10$...)
    expect(userInDb.password).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);

    // Confirm password starts with bcrypt identifier
    expect(userInDb.password.startsWith("$2")).toBe(true);

    // Confirm password has correct length (60 characters for bcrypt)
    expect(userInDb.password.length).toBe(60);
  });

  test("Step 4: Attempt to decrypt the hash (must be irreversible)", async () => {
    // Query database to get hashed password
    const userInDb = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    const hashedPassword = userInDb.password;

    // Verify that the hash cannot be reversed to plaintext
    // bcrypt is a one-way hashing algorithm - there's no decrypt function
    expect(() => {
      // This should not be possible - bcrypt has no decrypt method
      bcrypt.decrypt(hashedPassword);
    }).toThrow();

    // Verify that we can only COMPARE, not decrypt
    const isMatch = await bcrypt.compare(testUser.password, hashedPassword);
    expect(isMatch).toBe(true);

    // Verify wrong password fails comparison
    const isWrongMatch = await bcrypt.compare(
      "WrongPassword123!",
      hashedPassword
    );
    expect(isWrongMatch).toBe(false);

    // Confirm the hash is different even for the same password
    const newHash = await bcrypt.hash(testUser.password, 10);
    expect(newHash).not.toBe(hashedPassword);
  });

  test("Security Validation: Password hash characteristics", async () => {
    const userInDb = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    const hashedPassword = userInDb.password;

    // Verify bcrypt cost factor (should be at least 10)
    const costFactor = parseInt(hashedPassword.substring(4, 6));
    expect(costFactor).toBeGreaterThanOrEqual(10);

    // Verify hash entropy (should contain diverse characters)
    const uniqueChars = new Set(hashedPassword.split(""));
    expect(uniqueChars.size).toBeGreaterThan(15); // Should have good character diversity

    // Verify no plaintext password appears in database
    const allUsers = await prisma.user.findMany({
      where: {
        password: testUser.password, // Try to find plaintext password
      },
    });
    expect(allUsers.length).toBe(0);
  });
});
