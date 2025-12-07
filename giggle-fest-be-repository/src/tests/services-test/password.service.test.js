/**
 * @jest-environment node
 */
import { jest } from "@jest/globals";

// ---------------------------
// Create mock user repository functions
// ---------------------------
const mockFindUserByEmail = jest.fn();
const mockFindUserByResetToken = jest.fn();
const mockUpdateUser = jest.fn();

// ---------------------------
// Create mock jwt functions
// ---------------------------
const mockJwtSign = jest.fn();
const mockJwtVerify = jest.fn();

// ---------------------------
// Create mock bcrypt functions
// ---------------------------
const mockBcryptHash = jest.fn();
const mockBcryptCompare = jest.fn();

// ---------------------------
// Create mock email service function
// ---------------------------
const mockSendResetOTPEmail = jest.fn();

// ---------------------------
// Mock user.repository module
// ---------------------------
jest.unstable_mockModule("../../repositories/user.repository.js", () => ({
  findUserByEmail: mockFindUserByEmail,
  findUserByResetToken: mockFindUserByResetToken,
  updateUser: mockUpdateUser,
}));

// ---------------------------
// Mock jsonwebtoken module
// ---------------------------
jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: mockJwtSign,
    verify: mockJwtVerify,
  },
}));

// ---------------------------
// Mock bcrypt module
// ---------------------------
jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: mockBcryptHash,
    compare: mockBcryptCompare,
  },
}));

// ---------------------------
// Mock email.service module
// ---------------------------
jest.unstable_mockModule("../../utils/email.service.js", () => ({
  sendResetOTPEmail: mockSendResetOTPEmail,
}));

// ---------------------------
// Import service after mock setup
// ---------------------------
const { initPasswordReset, generateAndSendOTP, verifyOTP, resetPassword } =
  await import("../../services/password.service.js");

// ---------------------------
// Test Suite
// ---------------------------
describe("Password Service", () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup test environment
    process.env = {
      ...originalEnv,
      JWT_SECRET: "test-secret-key",
    };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  // Helper function to create mock user
  const createMockUser = (overrides = {}) => ({
    id: 1,
    email: "user@example.com",
    name: "Test User",
    password: "$2b$10$hashedpassword",
    resetToken: null,
    resetOTP: null,
    resetOTPExpires: null,
    ...overrides,
  });

  describe("initPasswordReset", () => {
    test("should initiate password reset successfully", async () => {
      const email = "user@example.com";
      const mockUser = createMockUser({ id: 5, email });
      const mockToken = "mock-jwt-reset-token";

      mockFindUserByEmail.mockResolvedValue(mockUser);
      mockJwtSign.mockReturnValue(mockToken);
      mockUpdateUser.mockResolvedValue({
        ...mockUser,
        resetToken: mockToken,
      });

      const result = await initPasswordReset(email);

      expect(mockFindUserByEmail).toHaveBeenCalledTimes(1);
      expect(mockFindUserByEmail).toHaveBeenCalledWith(email);

      expect(mockJwtSign).toHaveBeenCalledTimes(1);
      expect(mockJwtSign).toHaveBeenCalledWith(
        { id: 5, email: "user@example.com" },
        "test-secret-key",
        { expiresIn: "1h" }
      );

      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
      expect(mockUpdateUser).toHaveBeenCalledWith(5, {
        resetToken: mockToken,
        resetOTP: null,
        resetOTPExpires: null,
      });

      expect(result).toBe(mockToken);
    });

    test("should throw error when user not found", async () => {
      const email = "nonexistent@example.com";

      mockFindUserByEmail.mockResolvedValue(null);

      await expect(initPasswordReset(email)).rejects.toThrow("User not found");

      expect(mockFindUserByEmail).toHaveBeenCalledWith(email);
      expect(mockJwtSign).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    test("should generate JWT with correct payload", async () => {
      const email = "test@example.com";
      const mockUser = createMockUser({ id: 10, email });

      mockFindUserByEmail.mockResolvedValue(mockUser);
      mockJwtSign.mockReturnValue("token");
      mockUpdateUser.mockResolvedValue(mockUser);

      await initPasswordReset(email);

      const jwtPayload = mockJwtSign.mock.calls[0][0];
      expect(jwtPayload).toEqual({ id: 10, email: "test@example.com" });
    });

    test("should use JWT_SECRET from environment", async () => {
      const email = "user@example.com";
      const mockUser = createMockUser({ email });

      mockFindUserByEmail.mockResolvedValue(mockUser);
      mockJwtSign.mockReturnValue("token");
      mockUpdateUser.mockResolvedValue(mockUser);

      await initPasswordReset(email);

      const jwtSecret = mockJwtSign.mock.calls[0][1];
      expect(jwtSecret).toBe("test-secret-key");
    });

    test("should set 1 hour expiration for token", async () => {
      const email = "user@example.com";
      const mockUser = createMockUser({ email });

      mockFindUserByEmail.mockResolvedValue(mockUser);
      mockJwtSign.mockReturnValue("token");
      mockUpdateUser.mockResolvedValue(mockUser);

      await initPasswordReset(email);

      const jwtOptions = mockJwtSign.mock.calls[0][2];
      expect(jwtOptions.expiresIn).toBe("1h");
    });

    test("should clear existing OTP data when initiating reset", async () => {
      const email = "user@example.com";
      const mockUser = createMockUser({ email });

      mockFindUserByEmail.mockResolvedValue(mockUser);
      mockJwtSign.mockReturnValue("new-token");
      mockUpdateUser.mockResolvedValue(mockUser);

      await initPasswordReset(email);

      const updateData = mockUpdateUser.mock.calls[0][1];
      expect(updateData.resetOTP).toBeNull();
      expect(updateData.resetOTPExpires).toBeNull();
    });

    test("should propagate repository errors", async () => {
      const email = "user@example.com";
      const error = new Error("Database error");

      mockFindUserByEmail.mockRejectedValue(error);

      await expect(initPasswordReset(email)).rejects.toThrow("Database error");
    });
  });

  describe("generateAndSendOTP", () => {
    test("should generate and send OTP successfully", async () => {
      const token = "valid-reset-token";
      const mockUser = createMockUser({ id: 5, email: "user@example.com" });
      const mockHashedOTP = "$2b$10$hashedOTP";

      // Mock Math.random to control OTP generation
      const mockRandom = jest.spyOn(Math, "random").mockReturnValue(0.5);
      const mockDateNow = jest.spyOn(Date, "now").mockReturnValue(1000000000);

      mockFindUserByResetToken.mockResolvedValue(mockUser);
      mockBcryptHash.mockResolvedValue(mockHashedOTP);
      mockSendResetOTPEmail.mockResolvedValue(undefined);
      mockUpdateUser.mockResolvedValue(mockUser);

      await generateAndSendOTP(token);

      expect(mockFindUserByResetToken).toHaveBeenCalledWith(token);

      // OTP should be 6 digits (100000 + 0.5 * 900000 = 550000)
      const expectedOTP = "550000";
      expect(mockBcryptHash).toHaveBeenCalledWith(expectedOTP, 10);

      // OTP expires in 15 minutes (1000000000 + 15 * 60 * 1000 = 1000900000)
      const expectedExpires = new Date(1000900000);
      expect(mockUpdateUser).toHaveBeenCalledWith(5, {
        resetOTP: mockHashedOTP,
        resetOTPExpires: expectedExpires,
      });

      expect(mockSendResetOTPEmail).toHaveBeenCalledWith(
        "user@example.com",
        expectedOTP
      );

      mockRandom.mockRestore();
      mockDateNow.mockRestore();
    });

    test("should throw error when user not found by reset token", async () => {
      const token = "invalid-token";

      mockFindUserByResetToken.mockResolvedValue(null);

      await expect(generateAndSendOTP(token)).rejects.toThrow(
        "Invalid reset token"
      );

      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockSendResetOTPEmail).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    test("should handle JsonWebTokenError", async () => {
      const token = "invalid-jwt";
      const jwtError = new Error("jwt malformed");
      jwtError.name = "JsonWebTokenError";

      mockFindUserByResetToken.mockRejectedValue(jwtError);

      await expect(generateAndSendOTP(token)).rejects.toThrow("Invalid token");
    });

    test("should handle TokenExpiredError", async () => {
      const token = "expired-token";
      const expiredError = new Error("jwt expired");
      expiredError.name = "TokenExpiredError";

      mockFindUserByResetToken.mockRejectedValue(expiredError);

      await expect(generateAndSendOTP(token)).rejects.toThrow(
        "Token has expired"
      );
    });

    test("should generate 6-digit OTP", async () => {
      const token = "valid-token";
      const mockUser = createMockUser();

      const mockRandom = jest.spyOn(Math, "random").mockReturnValue(0.999999);

      mockFindUserByResetToken.mockResolvedValue(mockUser);
      mockBcryptHash.mockResolvedValue("hashed");
      mockSendResetOTPEmail.mockResolvedValue(undefined);
      mockUpdateUser.mockResolvedValue(mockUser);

      await generateAndSendOTP(token);

      // Max OTP: 100000 + 0.999999 * 900000 ≈ 999999
      const otpArg = mockBcryptHash.mock.calls[0][0];
      expect(otpArg).toMatch(/^\d{6}$/);
      expect(parseInt(otpArg)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(otpArg)).toBeLessThan(1000000);

      mockRandom.mockRestore();
    });

    test("should set OTP expiration to 15 minutes from now", async () => {
      const token = "valid-token";
      const mockUser = createMockUser({ id: 3 });
      const currentTime = 1700000000000;

      const mockDateNow = jest.spyOn(Date, "now").mockReturnValue(currentTime);

      mockFindUserByResetToken.mockResolvedValue(mockUser);
      mockBcryptHash.mockResolvedValue("hashed");
      mockSendResetOTPEmail.mockResolvedValue(undefined);
      mockUpdateUser.mockResolvedValue(mockUser);

      await generateAndSendOTP(token);

      const updateData = mockUpdateUser.mock.calls[0][1];
      const expectedExpires = new Date(currentTime + 15 * 60 * 1000);
      expect(updateData.resetOTPExpires).toEqual(expectedExpires);

      mockDateNow.mockRestore();
    });

    test("should hash OTP with bcrypt salt rounds 10", async () => {
      const token = "valid-token";
      const mockUser = createMockUser();

      mockFindUserByResetToken.mockResolvedValue(mockUser);
      mockBcryptHash.mockResolvedValue("hashed");
      mockSendResetOTPEmail.mockResolvedValue(undefined);
      mockUpdateUser.mockResolvedValue(mockUser);

      await generateAndSendOTP(token);

      const saltRounds = mockBcryptHash.mock.calls[0][1];
      expect(saltRounds).toBe(10);
    });

    test("should propagate other errors", async () => {
      const token = "valid-token";
      const error = new Error("Database error");

      mockFindUserByResetToken.mockRejectedValue(error);

      await expect(generateAndSendOTP(token)).rejects.toThrow("Database error");
    });
  });

  describe("verifyOTP", () => {
    test("should verify OTP successfully", async () => {
      const token = "valid-token";
      const otp = "123456";
      const mockUser = createMockUser({
        id: 5,
        resetOTP: "$2b$10$hashedOTP",
        resetOTPExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);

      const result = await verifyOTP(token, otp);

      expect(mockFindUserByResetToken).toHaveBeenCalledWith(token);
      expect(mockBcryptCompare).toHaveBeenCalledWith(otp, "$2b$10$hashedOTP");
      expect(result).toBe(true);
    });

    test("should throw error when user not found by reset token", async () => {
      const token = "invalid-token";
      const otp = "123456";

      mockFindUserByResetToken.mockResolvedValue(null);

      await expect(verifyOTP(token, otp)).rejects.toThrow(
        "Invalid reset token"
      );

      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    test("should throw error when OTP not generated", async () => {
      const token = "valid-token";
      const otp = "123456";
      const mockUser = createMockUser({
        resetOTP: null,
        resetOTPExpires: null,
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);

      await expect(verifyOTP(token, otp)).rejects.toThrow("OTP not generated");

      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    test("should throw error when resetOTPExpires is null", async () => {
      const token = "valid-token";
      const otp = "123456";
      const mockUser = createMockUser({
        resetOTP: "$2b$10$hashedOTP",
        resetOTPExpires: null,
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);

      await expect(verifyOTP(token, otp)).rejects.toThrow("OTP not generated");
    });

    test("should throw error when OTP has expired", async () => {
      const token = "valid-token";
      const otp = "123456";
      const mockUser = createMockUser({
        resetOTP: "$2b$10$hashedOTP",
        resetOTPExpires: new Date(Date.now() - 1000), // 1 second ago
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);

      await expect(verifyOTP(token, otp)).rejects.toThrow("OTP has expired");

      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    test("should throw error when OTP is invalid", async () => {
      const token = "valid-token";
      const otp = "wrong-otp";
      const mockUser = createMockUser({
        resetOTP: "$2b$10$hashedOTP",
        resetOTPExpires: new Date(Date.now() + 10 * 60 * 1000),
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(verifyOTP(token, otp)).rejects.toThrow("Invalid OTP");
    });

    test("should handle JsonWebTokenError", async () => {
      const token = "invalid-jwt";
      const otp = "123456";
      const jwtError = new Error("jwt malformed");
      jwtError.name = "JsonWebTokenError";

      mockFindUserByResetToken.mockRejectedValue(jwtError);

      await expect(verifyOTP(token, otp)).rejects.toThrow("Invalid token");
    });

    test("should handle TokenExpiredError", async () => {
      const token = "expired-token";
      const otp = "123456";
      const expiredError = new Error("jwt expired");
      expiredError.name = "TokenExpiredError";

      mockFindUserByResetToken.mockRejectedValue(expiredError);

      await expect(verifyOTP(token, otp)).rejects.toThrow("Token has expired");
    });

    test("should check OTP expiration before comparing OTP", async () => {
      const token = "valid-token";
      const otp = "123456";
      const mockUser = createMockUser({
        resetOTP: "$2b$10$hashedOTP",
        resetOTPExpires: new Date(Date.now() - 1000),
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);

      await expect(verifyOTP(token, otp)).rejects.toThrow("OTP has expired");

      // bcrypt.compare should not be called if OTP expired
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    test("should propagate other errors", async () => {
      const token = "valid-token";
      const otp = "123456";
      const error = new Error("Database error");

      mockFindUserByResetToken.mockRejectedValue(error);

      await expect(verifyOTP(token, otp)).rejects.toThrow("Database error");
    });
  });

  describe("resetPassword", () => {
    test("should reset password successfully", async () => {
      const token = "valid-token";
      const otp = "123456";
      const newPassword = "NewSecurePassword123!";
      const mockUser = createMockUser({
        id: 5,
        resetOTP: "$2b$10$hashedOTP",
        resetOTPExpires: new Date(Date.now() + 10 * 60 * 1000),
      });
      const hashedPassword = "$2b$10$newHashedPassword";

      mockFindUserByResetToken.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue(hashedPassword);
      mockUpdateUser.mockResolvedValue(mockUser);

      await resetPassword(token, otp, newPassword);

      expect(mockFindUserByResetToken).toHaveBeenCalledWith(token);
      expect(mockBcryptCompare).toHaveBeenCalledWith(otp, "$2b$10$hashedOTP");
      expect(mockBcryptHash).toHaveBeenCalledWith(newPassword, 10);

      expect(mockUpdateUser).toHaveBeenCalledWith(5, {
        password: hashedPassword,
        resetToken: null,
        resetOTP: null,
        resetOTPExpires: null,
      });
    });

    test("should throw error when user not found by reset token", async () => {
      const token = "invalid-token";
      const otp = "123456";
      const newPassword = "NewPassword123!";

      mockFindUserByResetToken.mockResolvedValue(null);

      await expect(resetPassword(token, otp, newPassword)).rejects.toThrow(
        "Invalid reset token"
      );

      expect(mockBcryptCompare).not.toHaveBeenCalled();
      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    test("should throw error when OTP not generated", async () => {
      const token = "valid-token";
      const otp = "123456";
      const newPassword = "NewPassword123!";
      const mockUser = createMockUser({
        resetOTP: null,
        resetOTPExpires: null,
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);

      await expect(resetPassword(token, otp, newPassword)).rejects.toThrow(
        "OTP not generated"
      );

      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    test("should throw error when OTP has expired", async () => {
      const token = "valid-token";
      const otp = "123456";
      const newPassword = "NewPassword123!";
      const mockUser = createMockUser({
        resetOTP: "$2b$10$hashedOTP",
        resetOTPExpires: new Date(Date.now() - 1000),
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);

      await expect(resetPassword(token, otp, newPassword)).rejects.toThrow(
        "OTP has expired"
      );

      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    test("should throw error when OTP is invalid", async () => {
      const token = "valid-token";
      const otp = "wrong-otp";
      const newPassword = "NewPassword123!";
      const mockUser = createMockUser({
        resetOTP: "$2b$10$hashedOTP",
        resetOTPExpires: new Date(Date.now() + 10 * 60 * 1000),
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(resetPassword(token, otp, newPassword)).rejects.toThrow(
        "Invalid OTP"
      );

      expect(mockBcryptHash).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    test("should hash new password with bcrypt salt rounds 10", async () => {
      const token = "valid-token";
      const otp = "123456";
      const newPassword = "NewPassword123!";
      const mockUser = createMockUser({
        resetOTP: "$2b$10$hashedOTP",
        resetOTPExpires: new Date(Date.now() + 10 * 60 * 1000),
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue("hashed");
      mockUpdateUser.mockResolvedValue(mockUser);

      await resetPassword(token, otp, newPassword);

      const hashCallArgs = mockBcryptHash.mock.calls[0];
      expect(hashCallArgs[0]).toBe(newPassword);
      expect(hashCallArgs[1]).toBe(10);
    });

    test("should clear reset token and OTP data after successful reset", async () => {
      const token = "valid-token";
      const otp = "123456";
      const newPassword = "NewPassword123!";
      const mockUser = createMockUser({
        id: 10,
        resetOTP: "$2b$10$hashedOTP",
        resetOTPExpires: new Date(Date.now() + 10 * 60 * 1000),
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(true);
      mockBcryptHash.mockResolvedValue("newHashedPassword");
      mockUpdateUser.mockResolvedValue(mockUser);

      await resetPassword(token, otp, newPassword);

      const updateData = mockUpdateUser.mock.calls[0][1];
      expect(updateData.resetToken).toBeNull();
      expect(updateData.resetOTP).toBeNull();
      expect(updateData.resetOTPExpires).toBeNull();
    });

    test("should handle JsonWebTokenError", async () => {
      const token = "invalid-jwt";
      const otp = "123456";
      const newPassword = "NewPassword123!";
      const jwtError = new Error("jwt malformed");
      jwtError.name = "JsonWebTokenError";

      mockFindUserByResetToken.mockRejectedValue(jwtError);

      await expect(resetPassword(token, otp, newPassword)).rejects.toThrow(
        "Invalid token"
      );
    });

    test("should handle TokenExpiredError", async () => {
      const token = "expired-token";
      const otp = "123456";
      const newPassword = "NewPassword123!";
      const expiredError = new Error("jwt expired");
      expiredError.name = "TokenExpiredError";

      mockFindUserByResetToken.mockRejectedValue(expiredError);

      await expect(resetPassword(token, otp, newPassword)).rejects.toThrow(
        "Token has expired"
      );
    });

    test("should validate OTP before hashing new password", async () => {
      const token = "valid-token";
      const otp = "wrong-otp";
      const newPassword = "NewPassword123!";
      const mockUser = createMockUser({
        resetOTP: "$2b$10$hashedOTP",
        resetOTPExpires: new Date(Date.now() + 10 * 60 * 1000),
      });

      mockFindUserByResetToken.mockResolvedValue(mockUser);
      mockBcryptCompare.mockResolvedValue(false);

      await expect(resetPassword(token, otp, newPassword)).rejects.toThrow(
        "Invalid OTP"
      );

      // Should not hash password if OTP is invalid
      expect(mockBcryptHash).not.toHaveBeenCalled();
    });

    test("should propagate other errors", async () => {
      const token = "valid-token";
      const otp = "123456";
      const newPassword = "NewPassword123!";
      const error = new Error("Database error");

      mockFindUserByResetToken.mockRejectedValue(error);

      await expect(resetPassword(token, otp, newPassword)).rejects.toThrow(
        "Database error"
      );
    });
  });
});
