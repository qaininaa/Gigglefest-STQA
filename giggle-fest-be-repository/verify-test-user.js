import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyTestUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: "test.endurance@example.com" },
    });

    if (!user) {
      console.log("❌ User not found");
      process.exit(1);
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);
    console.log(`Current verification status: ${user.isVerified}`);

    if (!user.isVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
      console.log("✅ User verified successfully");
    } else {
      console.log("✅ User already verified");
    }

    // Test the credentials
    console.log("\nTesting login...");
    const response = await fetch("http://localhost:8080/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test.endurance@example.com",
        password: "TestPassword123!",
      }),
    });

    const data = await response.json();

    if (response.ok && data.data?.token) {
      console.log("✅ Login successful!");
      console.log("Token received:", data.data.token.substring(0, 20) + "...");
    } else {
      console.log("❌ Login failed:", data.message);
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTestUser();
